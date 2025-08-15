import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { Clock, Calendar, User, ArrowRight, Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TaskTableProps {
  tasks: any[];
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
  showProject?: boolean;
}

const TaskTable = ({ tasks, onTaskClick, onEditTask, onDeleteTask, className, showProject = true }: TaskTableProps) => {
  const statusColors = {
    "Not Started": "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "On Hold": "bg-amber-100 text-amber-600",
    Completed: "bg-green-100 text-green-600",
  };

  const priorityColors = {
    Low: "bg-blue-50 text-blue-600",
    Medium: "bg-amber-50 text-amber-600",
    High: "bg-red-50 text-red-600",
  };

  const transformTaskForTable = (task: any) => {
    const statusMap = {
      'TODO': 'Not Started' as const,
      'IN_PROGRESS': 'In Progress' as const,
      'DONE': 'Completed' as const,
      'CANCELLED': 'On Hold' as const,
    };
    
    const priorityMap = {
      'LOW': 'Low' as const,
      'MEDIUM': 'Medium' as const,
      'HIGH': 'High' as const,
      'URGENT': 'High' as const,
    };
    
    return {
      ...task,
      status: statusMap[task.status] || 'Not Started',
      priority: priorityMap[task.priority] || 'Medium',
      projectName: task.project?.name || 'Unknown Project',
      assignedTo: task.assignee || task.member?.firstName + ' ' + task.member?.lastName || 'Unassigned',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }) : 'No due date',
    };
  };

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
    <GlassCard className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-muted-foreground">
                Task
              </th>
              {showProject && (
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Project
                </th>
              )}
              <th className="text-left p-4 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                Priority
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                Assigned To
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                Due Date
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                Hours
              </th>
              <th className="text-right p-4 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const transformedTask = transformTaskForTable(task);
              return (
                <tr
                  key={task.id}
                  className="border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                  onClick={() => onTaskClick?.(task.id)}
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{task.title}</span>
                      {task.description && (
                        <span className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </td>
                  {showProject && (
                    <td className="p-4">
                      <span className="text-sm">{transformedTask.projectName}</span>
                    </td>
                  )}
                  <td className="p-4">
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium",
                        statusColors[transformedTask.status]
                      )}
                    >
                      {transformedTask.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium",
                        priorityColors[transformedTask.priority]
                      )}
                    >
                      {transformedTask.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm">{transformedTask.assignedTo}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span className="text-sm">{transformedTask.dueDate}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="text-sm">{task.estimatedHours || 0}h</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:gap-2 transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={14} />
                        View
                        <ArrowRight size={14} className="transition-transform hover:translate-x-1" />
                      </Link>
                      {onEditTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                      {onDeleteTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

export default TaskTable;