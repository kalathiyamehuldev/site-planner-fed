
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAllProjects,
  fetchProjects,
  setSelectedProject,
} from "@/redux/slices/projectsSlice";

const Projects = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "onhold">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchProjects({ pagination: { page: 1, limit: 10 } }));
  }, [dispatch]);

  const filteredProjects = projects.filter(project => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        project.title.toLowerCase().includes(term) ||
        project.client.toLowerCase().includes(term)
      );
    }
    
    switch (filter) {
      case "active":
        return project.status === "In Progress";
      case "completed":
        return project.status === "Completed";
      case "onhold":
        return project.status === "On Hold";
      default:
        return true;
    }
  });

  const handleProjectClick = (projectId: string) => {
    dispatch(setSelectedProject(projectId));
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Projects</h1>
            <p className="text-muted-foreground">Manage all your interior design projects</p>
          </div>
          <MotionButton as={Link} to="/projects/new" variant="default" motion="subtle">
            <Plus size={18} className="mr-2" /> New Project
          </MotionButton>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                filter === "all"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Filter size={16} />
              <span>All Projects</span>
            </button>
            <button
              onClick={() => setFilter("active")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                filter === "active"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Filter size={16} />
              <span>Active</span>
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                filter === "completed"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Filter size={16} />
              <span>Completed</span>
            </button>
            <button
              onClick={() => setFilter("onhold")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                filter === "onhold"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Filter size={16} />
              <span>On Hold</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-[0.2s]">
          {filteredProjects.map((project, index) => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="transform transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
              onClick={() => handleProjectClick(project.id)}
            >
              <GlassCard className={cn(
                "h-full p-6 opacity-0 animate-scale-in", 
                {
                  "animation-delay-[0.1s]": index % 3 === 0,
                  "animation-delay-[0.2s]": index % 3 === 1,
                  "animation-delay-[0.3s]": index % 3 === 2,
                }
              )} style={{ animationFillMode: "forwards" }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg mb-1">{project.title}</h3>
                    <p className="text-muted-foreground text-sm">{project.client}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    project.status === "In Progress" && "bg-blue-100 text-blue-600",
                    project.status === "Not Started" && "bg-gray-100 text-gray-600",
                    project.status === "On Hold" && "bg-amber-100 text-amber-600",
                    project.status === "Completed" && "bg-green-100 text-green-600",
                  )}>
                    {project.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium border-2 border-white">
                        {member.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium border-2 border-white">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Due: {project.dueDate}</div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                  <div className="text-primary flex items-center text-sm font-medium">
                    View Details <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Projects;
