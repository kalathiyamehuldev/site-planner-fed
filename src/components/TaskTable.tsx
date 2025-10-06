import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { Clock, Calendar, User, ArrowRight, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import usePermission from "@/hooks/usePermission";

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
  const { hasPermission } = usePermission();
  const resource = 'tasks';

  // Generate avatar initials and color
  const getAvatarData = (name: string) => {
    if (!name || name === 'N/A') {
      return {
        initials: '?',
        color: '#6B7280',
        bgColor: '#F3F4F6'
      };
    }

    const words = name.trim().split(' ');
    const initials = words.length >= 2 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
    
    // Color palette from design system
    const colors = [
      '#1B78F9', '#00C2FF', '#3DD598', '#FFB547', '#FF6B6B',
      '#A970FF', '#FF82D2', '#29C499', '#E89F3D', '#2F95D8'
    ];
    
    // Generate consistent color based on name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    return {
      initials,
      color: colors[colorIndex],
      bgColor: `${colors[colorIndex]}1A` // 10% opacity
    };
  };
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Not Started": {
        bg: "bg-gray-200",
        text: "text-[#1a2624]",
        label: "Not Started"
      },
      "In Progress": {
        bg: "bg-[#e0f3ff]",
        text: "text-[#6c96b0]",
        label: "In Progress"
      },
      "On Hold": {
        bg: "bg-[#fef3e2]",
        text: "text-[#f59e0b]",
        label: "On Hold"
      },
      "Completed": {
        bg: "bg-[#eaf6ec]",
        text: "text-[#27ae60]",
        label: "Completed"
      },
      // "Cancelled": {
      //   bg: "bg-[#fee2e2]",
      //   text: "text-[#ef4444]",
      //   label: "Cancelled"
      // }
    };

    const config = statusConfig[status] || statusConfig["Not Started"];
    
    return (
      <div className={cn("px-2 py-0.5 rounded-sm inline-flex", config.bg)}>
        <div className={cn("text-center text-xs font-normal font-['Manrope'] leading-none", config.text)}>
          {config.label}
        </div>
      </div>
    );
  };

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
      // 'CANCELLED': 'On Hold' as const,
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
      <div className={cn("space-y-3", className)}>
        {tasks.map((task, index) => {
          const transformedTask = transformTaskForTable(task);
          const avatarData = getAvatarData(transformedTask.assignedTo);
          return (
            <GlassCard
              key={task.id}
              variant="clean"
              className="p-5 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in border border-gray-100 hover:border-gray-200"
              style={{
                animationDelay: `${index * 0.05}s`,
                animationFillMode: "forwards",
              }}
              onClick={() => onTaskClick?.(task.id)}
            >
              <div className="space-y-3">
                {/* Header: Title and Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 text-base font-semibold font-['Poppins'] mb-1 line-clamp-2">{task.title}</h3>
                    {showProject && (
                      <p className="text-gray-500 text-xs font-normal font-['Poppins']">{transformedTask.projectName}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(transformedTask.status)}
                  </div>
                </div>

                {/* Info Grid: Date and Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm font-medium font-['Poppins'] truncate">{transformedTask.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm font-medium font-['Poppins']">{task.estimatedHours || 0}h</span>
                  </div>
                </div>

                {/* Assignee and Priority Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ 
                        backgroundColor: avatarData.bgColor,
                        color: avatarData.color 
                      }}
                    >
                      {avatarData.initials}
                    </div>
                    <span className="text-gray-700 text-sm font-medium font-['Poppins'] truncate">{transformedTask.assignedTo}</span>
                  </div>
                  
                  {/* Priority */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      transformedTask.priority === 'High' ? 'bg-[#dc3545]' :
                      transformedTask.priority === 'Medium' ? 'bg-[#fdbe02]' : 'bg-[#28a745]'
                    )} />
                    <span className="text-gray-600 text-xs font-medium font-['Poppins']">
                      {transformedTask.priority}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Footer: View More and Actions */}
                <div className="flex items-center justify-between">
                  {hasPermission(resource, 'read') && (
                    <Link
                      to={`/tasks/${task.id}`}
                      className="flex items-center gap-1 text-[#0e489a] text-[10px] font-medium font-['General_Sans'] uppercase hover:gap-2 transition-all duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      VIEW MORE
                      <ArrowRight size={12} />
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    {hasPermission(resource, 'update') && onEditTask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                      >
                        <Edit size={14} />
                      </Button>
                    )}
                    {hasPermission(resource, 'delete') && onDeleteTask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
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
    <div className={cn("w-full bg-white rounded-md overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:table-fixed">
          <thead className="h-12">
            <tr className="border-b border-[#1a2624]/10">
              <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
                Task
              </th>
              {showProject && (
                <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-full sm:w-1/4 md:w-1/6 lg:w-1/8 hidden sm:table-cell">
                  Project
                </th>
              )}
              <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-16 sm:w-20 md:w-24">
                Status
              </th>
              <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-16 sm:w-20 md:w-24 hidden md:table-cell">
                Priority
              </th>
              <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-20 sm:w-28 md:w-32 hidden lg:table-cell">
                Assigned to
              </th>
              <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-20 sm:w-24 md:w-28 hidden lg:table-cell">
                Due Date
              </th>
              <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-12 sm:w-16 md:w-20 hidden xl:table-cell">
                Hours
              </th>
              <th className="w-12 px-3 border-b border-[#1a2624]/10">
                {/* Actions column - empty header */}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {tasks.map((task, index) => {
              const transformedTask = transformTaskForTable(task);
              return (
                <tr
                  key={task.id}
                  className="h-16 border-b border-[#1a2624]/10 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                  onClick={() => onTaskClick?.(task.id)}
                >
                  <td className="px-3 max-w-xs">
                    <div className="flex flex-col gap-0.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal cursor-pointer"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {task.title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-xs">
                            <p>{task.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {(task.description || transformedTask.projectName) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none cursor-pointer hidden sm:block"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {showProject ? transformedTask.projectName : task.description}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" className="max-w-xs">
                              <p>{showProject ? transformedTask.projectName : task.description}</p>
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
                    <td className="px-3 max-w-xs hidden sm:table-cell">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight cursor-pointer"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {transformedTask.projectName}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-xs">
                            <p>{transformedTask.projectName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  )}
                  <td className="px-3">
                    {getStatusBadge(transformedTask.status)}
                  </td>
                  <td className="px-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 relative overflow-hidden">
                        <div className={cn(
                          "w-2 h-2 left-[7.79px] top-[7.79px] absolute rounded-full",
                          transformedTask.priority === 'High' ? 'bg-[#dc3545]' :
                            transformedTask.priority === 'Medium' ? 'bg-[#fdbe02]' : 'bg-[#28a745]'
                        )} />
                      </div>
                      <div className="text-[#1a2624] text-sm font-normal font-['Manrope'] leading-tight">
                        {transformedTask.priority}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const avatarData = getAvatarData(transformedTask.assignedTo);
                        return (
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ 
                              backgroundColor: avatarData.bgColor,
                              color: avatarData.color 
                            }}
                          >
                            {avatarData.initials}
                          </div>
                        );
                      })()}
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight truncate">
                        {transformedTask.assignedTo}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 relative overflow-hidden">
                        <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight truncate">
                        {transformedTask.dueDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 relative overflow-hidden">
                        <Clock size={14} className="text-muted-foreground" />
                      </div>
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
                        {task.estimatedHours || 0} hours
                      </div>
                    </div>
                  </td>
                  <td className="px-3">
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="w-6 h-6 p-0 text-[#1a2624]/60 hover:text-[#1a2624] hover:bg-gray-100 rounded"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {hasPermission(resource, 'update') && onEditTask && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Edit size={14} />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {hasPermission(resource, 'delete') && onDeleteTask && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 size={14} />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;