
import React from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { FileText, Calendar, Users, Clock, ArrowRight } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  client: string;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed";
  dueDate: string;
  team: string[];
  progress: number;
  className?: string;
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
}: ProjectCardProps) => {
  const statusColors = {
    "Not Started": "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "On Hold": "bg-amber-100 text-amber-600",
    "Completed": "bg-green-100 text-green-600",
  };

  return (
    <GlassCard 
      variant="default" 
      className={cn("overflow-hidden group hover:shadow-md transition-all duration-300", className)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm">{client}</p>
          </div>
          <span className={cn(
            "text-xs px-3 py-1 rounded-full font-medium",
            statusColors[status]
          )}>
            {status}
          </span>
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
          View Details <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </GlassCard>
  );
};

export default ProjectCard;
