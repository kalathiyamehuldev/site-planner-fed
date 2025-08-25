import React from "react";
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
  className?: string;
}

const KanbanBoard = ({ 
  tasks, 
  onTaskClick, 
  onEditTask, 
  onDeleteTask, 
  onAddTask,
  className 
}: KanbanBoardProps) => {
  // Define the columns with their corresponding statuses
  const columns = [
    {
      id: "TODO",
      title: "To Do",
      color: "bg-gray-50 border-gray-200",
      headerColor: "text-gray-700",
      count: 0
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress",
      color: "bg-blue-50 border-blue-200",
      headerColor: "text-blue-700",
      count: 0
    },
    {
      id: "DONE",
      title: "Done",
      color: "bg-green-50 border-green-200",
      headerColor: "text-green-700",
      count: 0
    },
    {
      id: "CANCELLED",
      title: "Cancelled",
      color: "bg-red-50 border-red-200",
      headerColor: "text-red-700",
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          
          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={cn(
                "flex items-center justify-between p-4 rounded-t-lg border-2 border-b-0",
                column.color
              )}>
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-medium text-sm", column.headerColor)}>
                    {column.title}
                  </h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full bg-white/50",
                    column.headerColor
                  )}>
                    {column.count}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/50"
                  onClick={() => onAddTask?.(column.id)}
                >
                  <Plus size={14} />
                </Button>
              </div>

              {/* Column Content */}
              <div className={cn(
                "flex-1 p-3 lg:p-4 rounded-b-lg border-2 border-t-0 min-h-[400px] max-h-[70vh] overflow-y-auto",
                column.color
              )}>
                <div className="space-y-3">
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