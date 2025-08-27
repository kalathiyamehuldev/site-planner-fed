import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import KanbanCard from "./KanbanCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  tasks: any[];
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (status: string) => void;
  onUpdateTaskStatus?: (taskId: string, newStatus: string) => void;
  className?: string;
}

const KanbanBoard = ({ 
  tasks, 
  onTaskClick, 
  onEditTask, 
  onDeleteTask, 
  onAddTask,
  onUpdateTaskStatus,
  className 
}: KanbanBoardProps) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { taskId, currentStatus } = dragData;
      
      // Only update if the status is actually changing
      if (currentStatus !== newStatus) {
        onUpdateTaskStatus?.(taskId, newStatus);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };
  // Define the columns with their corresponding statuses
  const columns = [
    {
      id: "TODO",
      title: "To Do",
      color: "bg-white border-gray-200",
      headerColor: "text-gray-700",
      count: 0
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress",
      color: "bg-white border-gray-200",
      headerColor: "text-gray-700",
      count: 0
    },
    {
      id: "DONE",
      title: "Done",
      color: "bg-white border-gray-200",
      headerColor: "text-gray-700",
      count: 0
    },
    {
      id: "CANCELLED",
      title: "Cancelled",
      color: "bg-white border-gray-200",
      headerColor: "text-gray-700",
      count: 0
    }
  ];

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    const status = task.status || "TODO";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  // Update column counts
  columns.forEach(column => {
    column.count = tasksByStatus[column.id]?.length || 0;
  });

  if (tasks.length === 0) {
    return (
      <GlassCard className={cn("p-8 text-center", className)}>
        <div className="text-3xl mb-4">✨</div>
        <h3 className="text-xl font-medium mb-2">No tasks found</h3>
        <p className="text-muted-foreground">No tasks match your criteria.</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          
          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3 rounded-t-lg border border-b-0 bg-gray-50",
                "border-gray-200"
              )}>
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-medium text-sm", column.headerColor)}>
                    {column.title}
                  </h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full bg-gray-100",
                    column.headerColor
                  )}>
                    {column.count}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={() => onAddTask?.(column.id)}
                >
                  <Plus size={14} />
                </Button>
              </div>

              {/* Column Content */}
              <div 
                className={cn(
                  "flex-1 p-1 rounded-b-lg border border-t-0 min-h-[400px] max-h-[70vh] overflow-y-auto transition-all duration-200",
                  "bg-white border-gray-200",
                  dragOverColumn === column.id && "ring-2 ring-primary ring-opacity-50 bg-primary/5"
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="space-y-1">
                  {columnTasks.map((task) => (
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
    </div>
  );
};

export default KanbanBoard;