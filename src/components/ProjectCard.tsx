
import React from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Calendar, Users, ArrowRight } from "lucide-react";

import usePermission from "@/hooks/usePermission";
import { calculateProjectProgress } from "@/utils/projectUtils";

interface ProjectCardProps {
  id: string;
  title: string;
  client: string;
  status: "Active" | "Not Started" | "In Progress" | "On Hold" | "Completed" | "Hold";
  dueDate: string;
  team: string[];
  progress?: number; // Make optional since we'll calculate it
  tasks?: any[]; // Add tasks for progress calculation
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
  progress: providedProgress,
  tasks = [],
  className,
  style,
  onDelete,
}: ProjectCardProps) => {
  // Calculate progress from tasks if not provided
  const progress = providedProgress ?? calculateProjectProgress(tasks);
  const { hasPermission, isSuperAdmin } = usePermission();

  // Generate avatar initials and color
  const getAvatarData = (name: string) => {
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

  const avatarData = getAvatarData(title);

  // Status colors matching Figma design
  const statusConfig = {
    "Active": { bg: "#27AE60", text: "white" },
    "Hold": { bg: "#F1C40F", text: "white" },
    "On Hold": { bg: "#F1C40F", text: "white" },
    "In Progress": { bg: "#1B78F9", text: "white" },
    "Completed": { bg: "#27AE60", text: "white" },
    "Not Started": { bg: "#95A5A6", text: "white" },
  };

  const currentStatus = status === "On Hold" ? "Hold" : status;
  const statusStyle = statusConfig[currentStatus] || statusConfig["Not Started"];

  return (
    <GlassCard
      variant="clean"
      className={cn("p-3 flex flex-col gap-3", className)}
      style={style}
    >
      {/* Header with Avatar and Title */}
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 relative rounded-sm overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: avatarData.bgColor }}
        >
          <div 
            className="text-sm font-semibold font-['Poppins']"
            style={{ color: avatarData.color }}
          >
            {avatarData.initials}
          </div>
        </div>
        <div className="flex-1 text-gray-800 text-base font-semibold font-['Poppins'] truncate">
          {title}
        </div>
      </div>

      {/* Date and Team Info */}
      <div className="flex items-start gap-2">
        <div className="flex-1 flex items-center gap-1.5">
          <div className="w-4 h-4 relative rounded-[5px] overflow-hidden">
            <Calendar size={14} className="text-gray-500" />
          </div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins']">
            {dueDate}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 relative overflow-hidden">
            <Users size={14} className="text-gray-500" />
          </div>
          <div className="text-gray-500 text-xs font-normal font-['Poppins']">
            {team.length === 1 ? '1 member' : `${team.length} members`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-1.5 relative bg-gray-100 rounded-2xl overflow-hidden">
          <div 
            className="h-1.5 absolute left-0 top-0 bg-[#1b78f9] rounded-2xl transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-1 text-gray-500 text-xs font-normal font-['Poppins']">
            Progress
          </div>
          <div className="text-gray-800 text-xs font-medium font-['Poppins']">
            {progress}%
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-0 border-t border-gray-100" />

      {/* Footer with Status and View More */}
      <div className="flex items-center gap-3">
        <div 
          className="h-6 px-2.5 py-1.5 rounded flex items-center gap-2"
          style={{ backgroundColor: statusStyle.bg }}
        >
          <div 
            className="text-xs font-medium font-['Poppins']"
            style={{ color: statusStyle.text }}
          >
            {currentStatus}
          </div>
        </div>
        <div className="flex-1 flex justify-end items-center gap-0.5">
          {(isSuperAdmin || hasPermission('projects', 'read')) && (
            <Link
              to={`/projects/${id}`}
              className="flex items-center gap-0.5 hover:gap-1 transition-all duration-200"
            >
              <div className="text-[#0e489a] text-[10px] font-medium font-['General_Sans'] uppercase">
                VIEW MORE
              </div>
              <div className="w-3 h-3 relative overflow-hidden">
                <ArrowRight size={12} className="text-[#0e489a]" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default ProjectCard;
