
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAllProjects, selectProjectLoading, selectProjectError, fetchProjects, setSelectedProject } from "@/redux/slices/projectsSlice";
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import ProjectCard from "@/components/ProjectCard";

const Projects = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  const loading = useAppSelector(selectProjectLoading);
  const error = useAppSelector(selectProjectError);

  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "onhold" | "inprogress"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const filteredProjects = projects.filter((project) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        project.title.toLowerCase().includes(term) ||
        project.client.toLowerCase().includes(term)
      );
    }

    switch (filter) {
      case "active":
        return project.status === "Active";
      case "inprogress":
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
            <p className="text-muted-foreground">
              Manage all your interior design projects
            </p>
          </div>
          <MotionButton
            variant="default"
            motion="subtle"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus size={18} className="mr-2" /> New Project
          </MotionButton>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <MotionButton
              onClick={() => dispatch(fetchProjects())}
              variant="outline"
              motion="subtle"
            >
              Try Again
            </MotionButton>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No projects found</p>
            <MotionButton
              variant="default"
              motion="subtle"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus size={18} className="mr-2" /> Create Your First Project
            </MotionButton>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-[0.2s]">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                client={project.client}
                status={project.status}
                dueDate={new Date(project.endDate)?.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                team={project.team}
                progress={project.progress}
                className={cn("opacity-0 animate-scale-in border-2 rounded-xl", {
                  "animation-delay-[0.1s]": index % 3 === 0,
                  "animation-delay-[0.2s]": index % 3 === 1,
                  "animation-delay-[0.3s]": index % 3 === 2,
                  // Status-based border colors
                  "border-blue-500": project.status === "In Progress",
                  "border-emerald-500": project.status === "Active",
                  "border-gray-400": project.status === "Not Started",
                  "border-amber-500": project.status === "On Hold",
                  "border-green-500": project.status === "Completed",
                })}
                style={{ animationFillMode: "forwards" }}
                onDelete={() => {
                  // Refresh projects list after deletion
                  dispatch(fetchProjects());
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </PageContainer>
  );
};

export default Projects;
