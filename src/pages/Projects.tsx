
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { Search, Filter, ArrowRight, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAllProjects, selectProjectLoading, selectProjectError, fetchProjects, setSelectedProject } from "@/redux/slices/projectsSlice";
import { fetchAllTasksByCompany, selectAllTasks } from "@/redux/slices/tasksSlice";
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import ProjectCard from "@/components/ProjectCard";
import usePermission from "@/hooks/usePermission";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import solar from "@solar-icons/react";

const Projects = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  const loading = useAppSelector(selectProjectLoading);
  const error = useAppSelector(selectProjectError);
  const allTasks = useAppSelector(selectAllTasks);
  const { hasPermission, isSuperAdmin } = usePermission();
  const resource = 'projects';

  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "onhold" | "inprogress"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchAllTasksByCompany());
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
    if (hasPermission(resource, 'read')) {
      dispatch(setSelectedProject(projectId));
    }
  };

  // Group tasks by project ID
  const tasksByProject = allTasks.reduce((acc, task) => {
    const projectId = task.project?.id;
    if (projectId) {
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
    }
    return acc;
  }, {} as Record<string, typeof allTasks>);

  return (
    <PageContainer>
      <div className="md:space-y-6">
        {/* Header */}
        <PageHeader 
          title="Projects" 
          subtitle="Manage all your interior design projects"
        >
          {hasPermission(resource, 'create') && (
            <ActionButton
              variant="primary"
              motion="subtle"
              onClick={() => setIsAddDialogOpen(true)}
              leftIcon={<Plus size={18} className="mr-2" />}
              text="New Project"
            />
          )}
        </PageHeader>

        {/* Filters and Search */}
        <div className="flex flex-row items-center gap-2 sm:gap-3 animate-fade-in animation-delay-[0.1s] w-full mb-4">
          <div className="flex-1 min-w-[180px] max-w-full relative">
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

          <FilterDropdown
            filters={[
              {
               id: "status",
                label: "Status",
                options: [
                  {value: "all", label: "All Projects" },
                  { value: "active", label: "Active" },
                  { value: "inprogress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                  { value: "onhold", label: "On Hold" },
                ],
              },
            ]}
            selectedFilters={{
              status: filter !== "all" ? [filter] : [],
            }}
            onFilterChange={(filterId, values) => {
              if (filterId === "status") {
                setFilter(values.length > 0 ? values[0] as "all" | "active" | "completed" | "onhold" | "inprogress" : "all");
              }
            }}
          />

          <div className="gap-2 overflow-x-auto pb-1 md:pb-0 hidden lg:flex">
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
            <ActionButton
              onClick={() => dispatch(fetchProjects())}
              variant="secondary"
              motion="subtle"
              text="Try Again"
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white">
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-xl font-medium mb-4">No projects found</h3>
            {(isSuperAdmin || hasPermission(resource, 'create')) && (
              <ActionButton
                variant="primary"
                motion="subtle"
                onClick={() => setIsAddDialogOpen(true)}
                leftIcon={<Plus size={18} className="mr-2" />}
                text="Create Your First Project"
              />
            )}
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
                dueDate={(() => {
                  if (!project.endDate) return "No Due Date";
                  const d = new Date(project.endDate);
                  return isNaN(d.getTime())
                    ? "No Due Date"
                    : d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                })()}
                team={project.team}
                tasks={tasksByProject[project.id] || []}
                className={cn("opacity-0 animate-scale-in rounded-xl", {
                  "animation-delay-[0.1s]": index % 3 === 0,
                  "animation-delay-[0.2s]": index % 3 === 1,
                  "animation-delay-[0.3s]": index % 3 === 2,
                  // Status-based border colors
                  // "border-blue-500": project.status === "In Progress",
                  // "border-emerald-500": project.status === "Active",
                  // "border-gray-400": project.status === "Not Started",
                  // "border-amber-500": project.status === "On Hold",
                  // "border-green-500": project.status === "Completed",
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
