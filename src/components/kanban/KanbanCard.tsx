import React, { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  CheckSquare, 
  Pin, 
  Calendar, 
  Clock,
  Edit,
  Trash2,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KanbanCardProps {
  task: any;
  onTaskClick?: (taskId: string) => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
}

const KanbanCard = ({ 
  task, 
  onTaskClick, 
  onEditTask, 
  onDeleteTask, 
  className 
}: KanbanCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
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
  // Removed priority colors to match Jira-style design

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

  return (
    <GlassCard 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "p-3 cursor-pointer hover:shadow-sm transition-all duration-200 group rounded-md",
        "!bg-white !backdrop-blur-none !border-gray-300 !shadow-sm",
        "hover:!shadow-md hover:!border-gray-400 w-full",
        isDragging && "opacity-50 rotate-1 scale-105",
        className
      )}
      onClick={() => onTaskClick?.(task.id)}
    >
      {/* Task Title - Fixed height for consistency */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-2 cursor-pointer h-16 flex items-start">
              <h3 
                className="font-medium text-sm"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.4em',
                  maxHeight: '4.2em'
                }}
              >
                {task.title}
              </h3>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p>{task.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Project Name - Single line with ellipsis */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground mb-2 truncate cursor-pointer">
              {task.project?.name || "Unknown Project"}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p>{task.project?.name || "Unknown Project"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Members and Actions Row */}
      <div className="flex items-center justify-between mb-2">
        {/* Member Avatar */}
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {task.member ? getMemberInitials(task.member) : (
                    <User size={10} className="text-muted-foreground" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getMemberName(task.member)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <CheckSquare size={10} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Checklist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <MessageSquare size={10} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <Pin size={10} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pin</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
      </div>

      {/* Date and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={10} />
          <span>{formatDate(task.createdAt)}</span>
        </div>

        {/* Edit and Delete Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask?.(task);
                  }}
                >
                  <Edit size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask?.(task.id);
                  }}
                >
                  <Trash2 size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Estimated Hours */}
      {/* {task.estimatedHours && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Clock size={10} />
          <span>{task.estimatedHours}h</span>
        </div>
      )} */}
    </GlassCard>
  );
};

export default KanbanCard;