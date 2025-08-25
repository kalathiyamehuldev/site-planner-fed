
import React from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { FileText, Calendar, Users, Clock, ArrowRight, Trash2 } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { deleteProjectAsync } from "@/redux/slices/projectsSlice";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  id: string;
  title: string;
  client: string;
  status: "Active" | "Not Started" | "In Progress" | "On Hold" | "Completed";
  dueDate: string;
  team: string[];
  progress: number;
  className?: string;
  style?: React.CSSProperties;
  onDelete?: (id: string) => void;
}

const ProjectCard = ({
  id,
  title,
  client,
  status,
  dueDate,
  team,
  progress,
  className,
  style,
  onDelete,
}: ProjectCardProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dispatch(deleteProjectAsync(id)).unwrap();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      onDelete?.(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };
  const statusColors = {
    "Not Started": "bg-gray-100 text-gray-600",
    "Active": "bg-emerald-100 text-emerald-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "On Hold": "bg-amber-100 text-amber-600",
    Completed: "bg-green-100 text-green-600",
  };

  const borderColors = {
    "Not Started": "border-gray-400",
    "Active": "border-emerald-500",
    "In Progress": "border-blue-500",
    "On Hold": "border-amber-500",
    Completed: "border-green-500",
  };

  return (
    <GlassCard
      variant="default"
      className={cn(
        "overflow-hidden group hover:shadow-md transition-all duration-300 border-2 rounded-xl",
        borderColors[status],
        className
      )}
      style={style}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm">{client}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium",
                statusColors[status]
              )}
            >
              {status}
            </span>
            <button
              onClick={handleDelete}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="Delete project"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar size={14} />
              <span>{dueDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users size={14} />
              <span>{team.length} team members</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Link
          to={`/projects/${id}`}
          className="mt-6 flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all duration-200"
        >
          View Details{" "}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </GlassCard>
  );
};

export default ProjectCard;
