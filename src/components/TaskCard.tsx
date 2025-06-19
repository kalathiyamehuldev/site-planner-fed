
import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface TaskCardProps {
  id: string;
  title: string;
  projectName: string;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  estimatedHours: number;
  assignedTo: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const TaskCard = ({
  id,
  title,
  projectName,
  status,
  priority,
  dueDate,
  estimatedHours,
  assignedTo,
  className,
  onClick,
  style,
}: TaskCardProps) => {
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

  return (
    <GlassCard
      variant="default"
      className={cn(
        "overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={onClick}
      style={style}
    >
      <div className="p-6">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                statusColors[status]
              )}
            >
              {status}
            </span>
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                priorityColors[priority]
              )}
            >
              {priority} Priority
            </span>
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-muted-foreground text-sm">{projectName}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Due {dueDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{estimatedHours} hours</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned to: </span>
            <span className="font-medium">{assignedTo}</span>
          </div>

          <Link
            to={`/tasks/${id}`}
            className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all duration-200"
          >
            Details{" "}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
};

export default TaskCard;
