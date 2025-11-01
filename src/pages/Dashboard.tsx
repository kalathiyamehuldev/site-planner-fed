
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { cn } from "@/lib/utils";
import ProjectCard from "@/components/ProjectCard";
import TaskTable from "@/components/TaskTable";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { LayoutGrid, FileText, CheckSquare, Clock, Plus, ArrowRight, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAllProjects, fetchProjects } from "@/redux/slices/projectsSlice";
import {
  selectAllTasks,
  deleteTaskAsync,
  fetchAllTasksByCompany,
} from "@/redux/slices/tasksSlice";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import usePermission from "@/hooks/usePermission";
import solar from "@solar-icons/react";
import { 
  fetchTimeEntries,
  selectTotalHours 
} from "@/redux/slices/timeTrackingSlice";
import { formatDuration as formatHoursDuration } from "@/lib/timeUtils";

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const allProjects = useAppSelector(selectAllProjects);
  const allTasks = useAppSelector(selectAllTasks);
  const totalHours = useAppSelector(selectTotalHours);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const { hasPermission, isSuperAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks">(
    "overview"
  );

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchAllTasksByCompany());
    dispatch(fetchTimeEntries({})); // Fetch time entries to populate totalHours
  }, [dispatch]);

  // Get recent projects (3 most recent)
  const recentProjects = [...allProjects]
    .sort((a, b) => {
      // Sort by most recent start date
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })
    .slice(0, 3);

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

  const handleEditTask = (task: any) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTaskId) return;

    try {
      const result = await dispatch(deleteTaskAsync(deletingTaskId));

      if (deleteTaskAsync.fulfilled.match(result)) {
        toast({
          title: "Success",
          description: "Task deleted successfully!",
        });
        // Refresh tasks list
        dispatch(fetchAllTasksByCompany());
      } else {
        throw new Error((result.payload as string) || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingTask(null);
    // Refresh tasks list
    dispatch(fetchAllTasksByCompany());
  };

  // Get upcoming tasks (3 most urgent)
  const upcomingTasks = [...allTasks]
    .sort((a, b) => {
      // Simple sorting based on priority and due date keywords
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      const dueDateOrder = {
        Today: 0,
        Tomorrow: 1,
        "This week": 2,
        "Next Monday": 3,
        "Next week": 4,
        "In 2 weeks": 5,
        "Next month": 6,
      };

      const aPriority = priorityOrder[a.priority] || 999;
      const bPriority = priorityOrder[b.priority] || 999;

      if (aPriority !== bPriority) return aPriority - bPriority;

      const aDueDate =
        dueDateOrder[a.dueDate as keyof typeof dueDateOrder] || 999;
      const bDueDate =
        dueDateOrder[b.dueDate as keyof typeof dueDateOrder] || 999;

      return aDueDate - bDueDate;
    })
    .slice(0, 3);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    className,
    iconBgColor = "#00c2ff",
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: { value: string; positive: boolean };
    className?: string;
    iconBgColor?: string;
  }) => (
    <GlassCard
      variant="clean"
      className={cn(
        "p-2.5 sm:p-3 bg-white rounded-lg flex items-start gap-2 overflow-hidden w-full min-w-0",
        className
      )}
    >
      <div 
        className="p-1 sm:p-1.5 rounded-md flex items-center gap-2 flex-shrink-0"
        style={{ backgroundColor: `${iconBgColor}1A` }}
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 relative rounded-[5px] overflow-hidden flex items-center justify-center">
          <Icon size={16} className="sm:w-5 sm:h-5" style={{ color: iconBgColor }} />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-start gap-1 sm:gap-2 min-w-0">
        <div className="w-full flex flex-col justify-start items-start">
          <div className="w-full text-right text-gray-600 text-xs font-normal truncate">
            {label}
          </div>
          <div className="w-full text-right text-gray-800 text-2xl sm:text-3xl font-semibold truncate">
            {value}
          </div>
        </div>
        {trend && (
          <div className="w-full text-right">
            <span 
              className={cn(
                "text-[9px] sm:text-[10px] font-semibold",
                trend.positive ? "text-[#00b683]" : "text-[#b60003]"
              )}
            >
              {trend.positive ? "+" : ""}{trend.value}
            </span>
            <span className="text-gray-600 text-[9px] sm:text-[10px] font-normal">
              {" "}from last month
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <PageContainer>
      <div className="space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Dashboard Header with Profile */}
        <DashboardHeader title="Dashboard" showProfile={true} />

        {/* Stats Cards */}
        <section className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {(isSuperAdmin || hasPermission('projects', 'read')) && (<StatCard
              icon={solar.Tools.Layers}
              label="Active Projects"
              value={allProjects
                .filter((p) => p.status === "In Progress")
                .length.toString()}
              trend={{ value: "84.2%", positive: true }}
              className="animation-delay-[0.1s]"
              iconBgColor="#00c2ff"
            />)}
            {(isSuperAdmin || hasPermission('tasks', 'read')) && (
            <StatCard
              icon={solar.Time.Hourglass}
              label="Pending Tasks"
              value={allTasks.length.toString()}
              trend={{ value: "3%", positive: false }}
              className="animation-delay-[0.2s]"
              iconBgColor="#ffb547"
            />)}
            {(isSuperAdmin || hasPermission('time_tracking', 'read')) && (
            <StatCard
              icon={solar.Time.ClockCircle}
              label="Tasked Hours"
              value={formatHoursDuration(totalHours)}
              trend={{ value: "12.2%", positive: true }}
              className="animation-delay-[0.3s]"
              iconBgColor="#ff6b6b"
            />)}
            {(isSuperAdmin || hasPermission('projects', 'read')) && (
            <StatCard
              icon={solar.Ui.CheckCircle}
              label="Completed Project"
              value={allProjects
                .filter((p) => p.status === "Completed")
                .length.toString()}
              trend={{ value: "12.2%", positive: true }}
              className="animation-delay-[0.4s]"
              iconBgColor="#29c499"
            />)}
          </div>
        </section>

        {/* Recent Projects Section */}
        {hasPermission('projects', 'read') && (
          <section className="mb-6 sm:mb-8 w-full min-w-0">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Recent Projects</h2>
              <button 
                onClick={() => navigate("/projects")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 ml-2"
              >
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            {allProjects.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <div className="text-3xl mb-4">✨</div>
                <h3 className="text-xl font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground">Add new projects in your company.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
                {recentProjects.map((project) => (
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
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Upcoming Tasks Section */}
        {hasPermission('tasks', 'read') && (
          <section className="w-full min-w-0">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Upcoming tasks</h2>
              <button 
                onClick={() => navigate("/tasks")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 ml-2"
              >
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="w-full min-w-0">
              <TaskTable
                tasks={upcomingTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                showProject={true}
              />
            </div>
          </section>
        )}
      </div>

      {/* Edit Task Dialog */}
      <AddTaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        projectId={editingTask?.project?.id || ""}
        task={editingTask}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTaskId}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default Dashboard;
