import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { Clock, Calendar, User, ArrowRight, Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskTableProps {
  tasks: any[];
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
  showProject?: boolean;
}

const TaskTable = ({ tasks, onTaskClick, onEditTask, onDeleteTask, className, showProject = true }: TaskTableProps) => {
  const isMobile = useIsMobile();
  
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
      assignedTo: task.assignee || (task.member?.firstName && task.member?.lastName ? `${task.member.firstName} ${task.member.lastName}` : 'N/A'),
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

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {tasks.map((task, index) => {
          const transformedTask = transformTaskForTable(task);
          return (
            <GlassCard 
              key={task.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in"
              style={{
                animationDelay: `${index * 0.05}s`,
                animationFillMode: "forwards",
              }}
              onClick={() => onTaskClick?.(task.id)}
            >
              <div className="space-y-3">
                {/* Title and Description */}
                <div>
                  <h3 className="font-medium text-base mb-1 line-clamp-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  )}
                </div>
                
                {/* Status and Priority Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium",
                      statusColors[transformedTask.status]
                    )}
                  >
                    {transformedTask.status}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium",
                      priorityColors[transformedTask.priority]
                    )}
                  >
                    {transformedTask.priority}
                  </span>
                </div>
                
                {/* Project (if shown) */}
                {showProject && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Project:</span>
                    <span className="text-sm truncate">{transformedTask.projectName}</span>
                  </div>
                )}
                
                {/* Details Row */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{transformedTask.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{transformedTask.dueDate}</span>
                  </div>
                </div>
                
                {/* Hours and Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-sm">{task.estimatedHours || 0}h</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="inline-flex items-center gap-1 text-primary font-medium text-sm px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye size={14} />
                      View
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
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    );
  }

  // Desktop Table View
  return (
    <GlassCard className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:table-fixed">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
                Task
              </th>
              {showProject && (
                <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-full sm:w-1/4 md:w-1/6 lg:w-1/8 hidden sm:table-cell">
                  Project
                </th>
              )}
              <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-16 sm:w-20 md:w-24">
                Status
              </th>
              <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-16 sm:w-20 md:w-24 hidden md:table-cell">
                Priority
              </th>
              <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-20 sm:w-28 md:w-32 hidden lg:table-cell">
                Assigned To
              </th>
              <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-20 sm:w-24 md:w-28 hidden lg:table-cell">
                Due Date
              </th>
              <th className="text-left p-3 md:p-4 font-medium text-muted-foreground w-12 sm:w-16 md:w-20 hidden xl:table-cell">
                Hours
              </th>
              <th className="text-right p-3 md:p-4 font-medium text-muted-foreground w-20 sm:w-28 md:w-32">
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
                  <td className="p-3 md:p-4 max-w-xs">
                    <div className="flex flex-col">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span 
                              className="font-medium cursor-pointer text-sm md:text-base"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.4em',
                                maxHeight: '2.8em'
                              }}
                            >
                              {task.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-xs">
                             <p>{task.title}</p>
                           </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {task.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span 
                                className="text-xs md:text-sm text-muted-foreground cursor-pointer mt-1 hidden sm:block"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: '1.3em',
                                  maxHeight: '1.3em'
                                }}
                              >
                                {task.description}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" className="max-w-xs">
                               <p>{task.description}</p>
                             </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {/* Mobile: Show priority and assignee under title */}
                      <div className="flex items-center gap-2 mt-1 md:hidden">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            priorityColors[transformedTask.priority]
                          )}
                        >
                          {transformedTask.priority}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {transformedTask.assignedTo}
                        </span>
                      </div>
                    </div>
                  </td>
                  {showProject && (
                    <td className="p-3 md:p-4 max-w-xs hidden sm:table-cell">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span 
                              className="text-xs md:text-sm cursor-pointer"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.3em',
                                maxHeight: '2.6em'
                              }}
                            >
                              {transformedTask.projectName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-xs">
                             <p>{transformedTask.projectName}</p>
                           </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  )}
                  <td className="p-3 md:p-4">
                    <span
                      className={cn(
                        "text-xs px-2 md:px-2.5 py-0.5 md:py-1 rounded-full font-medium whitespace-nowrap",
                        statusColors[transformedTask.status]
                      )}
                    >
                      {transformedTask.status}
                    </span>
                  </td>
                  <td className="p-3 md:p-4 hidden md:table-cell">
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap",
                        priorityColors[transformedTask.priority]
                      )}
                    >
                      {transformedTask.priority}
                    </span>
                  </td>
                  <td className="p-3 md:p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm truncate">{transformedTask.assignedTo}</span>
                    </div>
                  </td>
                  <td className="p-3 md:p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span className="text-sm truncate">{transformedTask.dueDate}</span>
                    </div>
                  </td>
                  <td className="p-3 md:p-4 hidden xl:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="text-sm">{task.estimatedHours || 0}h</span>
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="inline-flex items-center gap-1 text-primary font-medium text-xs md:text-sm hover:gap-2 transition-all duration-200 px-2 py-1 rounded hover:bg-primary/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={12} className="md:hidden" />
                        <Eye size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">View</span>
                        <ArrowRight size={12} className="transition-transform hover:translate-x-1 md:hidden" />
                        <ArrowRight size={14} className="transition-transform hover:translate-x-1 hidden md:block" />
                      </Link>
                      {onEditTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit size={12} className="md:hidden" />
                          <Edit size={14} className="hidden md:block" />
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
                          className="h-7 w-7 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={12} className="md:hidden" />
                          <Trash2 size={14} className="hidden md:block" />
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