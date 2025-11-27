import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RiArrowRightSLine } from "@remixicon/react";

import usePermission from "@/hooks/usePermission";

interface KanbanCardProps {
  task: any;
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
  isMobile?: boolean;
}

const KanbanCard = ({
  task,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  className,
  isMobile = false
}: KanbanCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { hasPermission } = usePermission();
  const resource = 'tasks';
  const canDrag = hasPermission(resource, 'update');

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDrag) return;
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: task.id,
      currentStatus: task.status
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMemberInitials = (member: any) => {
    if (!member) return "?";
    const firstName = member.firstName || "";
    const lastName = member.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getMemberName = (member: any) => {
    if (!member) return "Unassigned";
    return `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unknown";
  };

  // Helper function to get avatar data like in TaskView
  function getAvatarData(name?: string) {
    const initials = name
      ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
      : "?";
    const colors = [
      { bg: "#FDE68A", color: "#92400E" },
      { bg: "#A7F3D0", color: "#065F46" },
      { bg: "#BFDBFE", color: "#1E40AF" },
      { bg: "#FECACA", color: "#7F1D1D" },
      { bg: "#DDD6FE", color: "#4C1D95" },
    ];
    const idx = name
      ? (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length
      : 0;
    return { initials, bgColor: colors[idx].bg, color: colors[idx].color };
  }

  // Priority border colors for cards
  const priorityBorderColors = {
    LOW: "border-l-[#28a745]",
    MEDIUM: "border-l-[#fdbe02]", 
    HIGH: "border-l-[#dc3545]",
    URGENT: "border-l-[#ff6e0d]"
  };

  const assignedName = task?.assignee || (task?.vendor ? `${task.vendor.firstName} ${task.vendor.lastName}` : (task?.member ? `${task.member.firstName} ${task.member.lastName}` : undefined));
  const avatarData = getAvatarData(assignedName);
  const hasSubtasks = (Array.isArray(task?.subtasks) && task.subtasks.length > 0) || (typeof task?.subtaskCount === 'number' && task.subtaskCount > 0);
  const subtaskCount = Array.isArray(task?.subtasks) ? task.subtasks.length : (typeof task?.subtaskCount === 'number' ? task.subtaskCount : 0);

  return (
    <GlassCard
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      variant="clean"
      className={cn(
        "cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 border-l-4 border-r border-t border-b border-gray-100 hover:border-gray-200",
        priorityBorderColors[task.priority || 'MEDIUM'],
        isDragging && "opacity-50 rotate-1 scale-105",
        isMobile ? "p-3" : "p-4",
        className
      )}
      onClick={() => onTaskClick?.(task.id)}
    >
      <div className="space-y-3">
        {/* Task Title */}
        <h3 className={cn(
          "text-gray-800 font-semibold font-['Poppins'] line-clamp-2",
          isMobile ? "text-sm" : "text-base"
        )}>
          {task.title}
        </h3>

        {/* Project Name */}
        <p className={cn(
          "text-gray-500 font-normal font-['Poppins']",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {task.project?.name || 'Unknown Project'}
        </p>

        {/* Status and Duration Row */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "px-2 py-1 rounded-md text-xs font-medium",
            task.status === 'TODO' ? "bg-gray-200 text-gray-700" :
            task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
            "bg-green-100 text-green-700"
          )}>
            {task.status === 'TODO' ? 'Not Started' : 
             task.status === 'IN_PROGRESS' ? 'In Progress' : 
             'Completed'}
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock size={isMobile ? 14 : 16} className="text-gray-500" />
            <span className={cn("font-medium", isMobile ? "text-xs" : "text-sm")}>
              {task.estimatedHours || 0} hours
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-100" />

        {/* Due Date and Assigned Member Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={isMobile ? 14 : 16} className="text-gray-500" />
            <span className={cn("text-gray-700 font-medium", isMobile ? "text-xs" : "text-sm")}>
              {formatDate(task.dueDate || task.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const names = typeof task?.assignee === 'string' ? task.assignee.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
              const isMultiUser = String(task?.assigneeType || '').toUpperCase() === 'USER' && names.length > 1;
              if (isMultiUser) {
                const avatars = names.slice(0, 3).map((nm: string, idx: number) => {
                  const a = getAvatarData(nm);
                  return (
                    <div
                      key={`${nm}-${idx}`}
                      className={cn(
                        "rounded-full flex items-center justify-center font-medium",
                        isMobile ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs",
                        idx > 0 && "-ml-2 border border-white"
                      )}
                      style={{ backgroundColor: a.bgColor, color: a.color }}
                    >
                      {a.initials}
                    </div>
                  );
                });
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">{avatars}</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{names.join(', ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }
              const showEmailTooltip = String(task?.assigneeType || '').toUpperCase() === 'VENDOR' && task?.vendor?.email;
              const avatar = (
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center font-medium",
                    isMobile ? "w-5 h-5 text-xs" : "w-6 h-6 text-xs"
                  )}
                  style={{ backgroundColor: avatarData.bgColor, color: avatarData.color }}
                >
                  {avatarData.initials}
                </div>
              );
              const nameEl = (
                <span className={cn("text-gray-700 font-medium truncate", isMobile ? "text-xs" : "text-sm")}>
                  {assignedName || 'Unassigned'}
                </span>
              );
              if (showEmailTooltip) {
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">{avatar}{nameEl}</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.vendor.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }
              return (
                <div className="flex items-center gap-2">{avatar}{nameEl}</div>
              );
            })()}
          </div>
        </div>

        {/* Subtasks info and Action buttons row */}
        <div className={cn(
          "flex pt-2",
          hasSubtasks ? "items-center justify-between" : "items-end justify-end",
          !isMobile && "opacity-0 group-hover:opacity-100 transition-opacity"
        )}>
          {hasSubtasks && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 justify-between w-full cursor-pointer hover:bg-blue-100 transition-colors">
              <>
                <span className={cn("text-gray-600", isMobile ? "text-xs" : "text-sm")}>Subtasks {subtaskCount}</span>
              </>
            </div>
          )}

          <div className="flex items-center justify-end gap-1">
          {hasPermission(resource, 'update') && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "p-0 hover:bg-secondary",
                      isMobile ? "h-6 w-6" : "h-7 w-7"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask?.(task);
                    }}
                  >
                    <Edit size={isMobile ? 12 : 14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {hasPermission(resource, 'delete') && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "p-0 hover:bg-red-100 hover:text-red-600",
                      isMobile ? "h-6 w-6" : "h-7 w-7"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask?.(task.id);
                    }}
                  >
                    <Trash2 size={isMobile ? 12 : 14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default KanbanCard;
