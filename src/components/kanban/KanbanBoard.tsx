import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import KanbanCard from "./KanbanCard";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, Calendar, Clock, User, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import usePermission from "@/hooks/usePermission";
import { useIsMobile } from "@/hooks/use-mobile";
import ActionButton from "@/components/ui/ActionButton";
import solar from "@solar-icons/react";

interface KanbanBoardProps {
  tasks: any[];
  allTasks?: any[];
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (status: string) => void;
  onUpdateTaskStatus?: (taskId: string, newStatus: string) => void;
  className?: string;
  // Mobile controls props
  viewMode?: "list" | "kanban" | "timeline";
  onViewModeChange?: (mode: "list" | "kanban" | "timeline") => void;
  onNewTask?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filter?: "all" | "mine" | "high-priority" | "upcoming";
  onFilterChange?: (filter: "all" | "mine" | "high-priority" | "upcoming") => void;
  hasCreatePermission?: boolean;
}

const KanbanBoard = ({
  tasks,
  allTasks,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onUpdateTaskStatus,
  className,
  viewMode = "kanban",
  onViewModeChange,
  onNewTask,
  searchTerm = "",
  onSearchChange,
  filter = "all",
  onFilterChange,
  hasCreatePermission = false,
}: KanbanBoardProps) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { hasPermission } = usePermission();
  const isMobile = useIsMobile();
  const resource = "tasks";

  const FilterButton = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: typeof filter;
    icon: React.ElementType;
  }) => (
    <button
      onClick={() => onFilterChange?.(value)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
        filter === value
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary"
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  // Prevent body scroll on mobile when kanban is active
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-kanban-active');
      return () => {
        document.body.classList.remove('mobile-kanban-active');
      };
    }
  }, [isMobile]);

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { taskId, currentStatus } = dragData;
      if (currentStatus !== newStatus) {
        onUpdateTaskStatus?.(taskId, newStatus);
      }
    } catch (error) {
      console.error("Error parsing drag data:", error);
    }
  };

  const columns = [
    { id: "TODO", title: "To Do" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "DONE", title: "Done" },
    // { id: "CANCELLED", title: "Cancelled" },
  ];

  // Group provided tasks by status (showing parent tasks)
  const tasksByStatus = tasks.reduce((acc: Record<string, any[]>, task) => {
    const status = task.status || "TODO";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});

  if (tasks.length === 0) {
    return (
      <GlassCard className={cn("p-8 text-center", className)}>
        <div className="text-3xl mb-4">✨</div>
        <h3 className="text-xl font-medium mb-2">No tasks found</h3>
        <p className="text-muted-foreground">
          {"No tasks match the current filters."}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Grid layout */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          const subtasksByParent: Record<string, any[]> = (allTasks || []).reduce((acc: Record<string, any[]>, t: any) => {
            if (t.parentId) {
              acc[t.parentId] = acc[t.parentId] || [];
              acc[t.parentId].push(t);
            }
            return acc;
          }, {});
          const enriched = columnTasks.map((t) => ({
            ...t,
            subtaskCount: (subtasksByParent[t.id]?.length || 0),
            subtasks: (subtasksByParent[t.id]?.slice(0, 2) || [])
          }));
          const count = columnTasks.length;

          return (
            <div key={column.id} className="flex flex-col">
              <div className={cn(
                "flex items-center justify-between px-4 py-3 rounded-t-lg border border-b-0 bg-gray-50",
                "border-gray-200"
              )}>
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-medium text-sm", "text-gray-700")}>{column.title}</h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full bg-gray-100", "text-gray-700")}>{count}</span>
                </div>
                {hasPermission(resource, "create") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => onAddTask?.(column.id)}
                    aria-label={`Add task to ${column.title}`}
                  >
                    <Plus size={14} />
                  </Button>
                )}
              </div>

              <div
                className={cn(
                  "flex-1 p-3 rounded-b-lg border border-t-0 min-h-[400px] max-h-[70vh] overflow-y-auto transition-all duration-200",
                  "bg-white border-gray-200",
                  dragOverColumn === column.id && "ring-2 ring-primary ring-opacity-50 bg-primary/5"
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="space-y-3">
                  {enriched.map((task) => (
                    <div key={task.id} className="group">
                      <KanbanCard
                        task={task}
                        onTaskClick={onTaskClick}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                      />
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2 opacity-50">📋</div>
                      <p className="text-sm text-muted-foreground">
                        No tasks in {column.title.toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click + to add a task
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Jira-style layout with fixed header and scrollable columns */}
      <div className="md:hidden">
        {/* Fixed container that takes full viewport height minus header */}
        <div className="fixed top-16 left-0 right-0 bottom-0 flex flex-col">
          {/* Mobile Controls Header */}
          <div className="bg-white border-b border-gray-200 p-4 space-y-4 flex-shrink-0">
            {/* Title and View Mode Controls */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-light mb-1">Tasks</h1>
                <p className="text-muted-foreground text-sm">
                  Manage and track all your project tasks
                </p>
              </div>
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center bg-secondary rounded-lg p-1">
                  <ActionButton
                    text="Board"
                    variant={viewMode === "kanban" ? "secondary" : "gray"}
                    leftIcon={<LayoutGrid size={14} />}
                    className="px-2 py-1 text-xs"
                    onClick={() => onViewModeChange?.("kanban")}
                  />
                  <ActionButton
                    text="List"
                    variant={viewMode === "list" ? "secondary" : "gray"}
                    leftIcon={<List size={14} />}
                    className="px-2 py-1 text-xs"
                    onClick={() => onViewModeChange?.("list")}
                  />
                  <ActionButton
                    text="Timeline"
                    variant={viewMode === "timeline" ? "secondary" : "gray"}
                    leftIcon={<solar.Time.Stopwatch className="h-3 w-3" />}
                    className="px-2 py-1 text-xs"
                    onClick={() => onViewModeChange?.("timeline")}
                  />
                </div>
                
                {hasCreatePermission && (
                  <ActionButton 
                    variant="primary" 
                    leftIcon={<Plus size={14} />}
                    text="New Task"
                    className="px-3 py-2 text-xs"
                    onClick={onNewTask}
                  />
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterButton label="All" value="all" icon={Filter} />
                <FilterButton label="Mine" value="mine" icon={User} />
                <FilterButton label="High Priority" value="high-priority" icon={Clock} />
                <FilterButton label="Upcoming" value="upcoming" icon={Calendar} />
              </div>
            </div>

            {/* Filter Info Banner */}
            {(filter !== "all" || searchTerm) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Filter size={14} />
                  <span>
                    {searchTerm ? (
                      <>Showing tasks matching "{searchTerm}"</>
                    ) : (
                      <>Showing {filter === "mine" ? "your tasks" : filter === "high-priority" ? "high priority tasks" : "upcoming tasks"}</>
                    )}
                    {" (Kanban groups tasks by status)"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {/* Horizontal scrollable columns container */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden kanban-mobile-scroll">
            <div className="flex h-full w-max">
              {columns.map((column) => {
                const columnTasks = tasksByStatus[column.id] || [];
                const subtasksByParent: Record<string, any[]> = (allTasks || []).reduce((acc: Record<string, any[]>, t: any) => {
                  if (t.parentId) {
                    acc[t.parentId] = acc[t.parentId] || [];
                    acc[t.parentId].push(t);
                  }
                  return acc;
                }, {});
                const enriched = columnTasks.map((t) => ({
                  ...t,
                  subtaskCount: (subtasksByParent[t.id]?.length || 0),
                  subtasks: (subtasksByParent[t.id]?.slice(0, 2) || [])
                }));
                const count = columnTasks.length;

                return (
                  <div 
                    key={column.id} 
                    className="flex flex-col w-80 h-full border-r border-gray-200 last:border-r-0"
                  >
                    {/* Column header - fixed height */}
                    <div className={cn(
                      "flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0",
                      "min-h-[60px]"
                    )}>
                      <div className="flex items-center gap-2">
                        <h3 className={cn("font-medium text-sm", "text-gray-700")}>{column.title}</h3>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full bg-gray-100", "text-gray-700")}>{count}</span>
                      </div>
                      {hasPermission(resource, "create") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-100 flex-shrink-0"
                          onClick={() => onAddTask?.(column.id)}
                          aria-label={`Add task to ${column.title}`}
                        >
                          <Plus size={12} />
                        </Button>
                      )}
                    </div>

                    {/* Column content - scrollable */}
                    <div
                      className={cn(
                        "flex-1 p-3 overflow-y-auto bg-white transition-all duration-200",
                        dragOverColumn === column.id && "ring-2 ring-primary ring-opacity-50 bg-primary/5"
                      )}
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      <div className="space-y-3">
                        {enriched.map((task) => (
                          <div key={task.id} className="group">
                            <KanbanCard
                              task={task}
                              onTaskClick={onTaskClick}
                              onEditTask={onEditTask}
                              onDeleteTask={onDeleteTask}
                              isMobile={true}
                            />
                          </div>
                        ))}

                        {columnTasks.length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-xl mb-2 opacity-50">📋</div>
                            <p className="text-xs text-muted-foreground">
                              No tasks in {column.title.toLowerCase()}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Click + to add a task
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
