
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import ProjectCard from "@/components/ProjectCard";
import TaskTable from "@/components/TaskTable";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { LayoutGrid, FileText, CheckSquare, Clock, Plus, ArrowRight } from "lucide-react";
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

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const allProjects = useAppSelector(selectAllProjects);
  const allTasks = useAppSelector(selectAllTasks);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const { hasPermission, isSuperAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks">(
    "overview"
  );

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchAllTasksByCompany());
  }, [dispatch]);

  // Get recent projects (3 most recent)
  const recentProjects = [...allProjects]
    .sort((a, b) => {
      // Sort by most recent start date
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })
    .slice(0, 3);

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
    bgColor = "bg-blue-50",
    iconColor = "text-blue-600",
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: { value: string; positive: boolean };
    className?: string;
    bgColor?: string;
    iconColor?: string;
  }) => (
    <GlassCard
      className={cn(
        "flex flex-col h-full animate-scale-in",
        bgColor,
        className
      )}
    >
      <div className="p-6 flex flex-col h-full">
        <div
          className={cn(
            "rounded-full w-10 h-10 flex items-center justify-center mb-4",
            bgColor === "bg-blue-50"
              ? "bg-blue-100"
              : bgColor === "bg-green-50"
              ? "bg-green-100"
              : bgColor === "bg-purple-50"
              ? "bg-purple-100"
              : "bg-orange-100"
          )}
        >
          <Icon size={20} className={iconColor} />
        </div>
        <h3 className="text-muted-foreground font-medium text-sm mb-1">
          {label}
        </h3>
        <p className="text-2xl font-light mb-1">{value}</p>
        {trend && (
          <p
            className={cn(
              "text-xs font-medium mt-auto",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value} from last month
          </p>
        )}
      </div>
    </GlassCard>
  );

  return (
    <PageContainer>
      <div className="space-y-8">
        <section className="relative mb-12">
          <div
            className="py-12 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <h1 className="text-3xl md:text-4xl font-light mb-4">
              Welcome to{" "}
              <span className="font-normal text-primary">DesignFlow</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl mb-8">
              Manage your interior design projects with elegance and efficiency.
              Track tasks, organize documents, and collaborate with your team
              seamlessly.
            </p>
            <div className="flex flex-wrap gap-4">
              {hasPermission('projects', 'create') && (<MotionButton
                onClick={() => navigate("/projects")}
                variant="default"
                size="lg"
                motion="subtle"
              >
                Create New Project <Plus size={18} className="ml-2" />
              </MotionButton>
              )}
              <MotionButton variant="outline" size="lg" motion="subtle">
                Tour Dashboard
              </MotionButton>
            </div>
          </div>
        </section>

        <section
          className="mb-12 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(isSuperAdmin || hasPermission('projects', 'read')) && (<StatCard
              icon={FileText}
              label="Active Projects"
              value={allProjects
                .filter((p) => p.status === "In Progress")
                .length.toString()}
              trend={{ value: "20%", positive: true }}
              className="animation-delay-[0.1s]"
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />)}
            {(isSuperAdmin || hasPermission('tasks', 'read')) && (
            <StatCard
              icon={CheckSquare}
              label="Pending Tasks"
              value={allTasks.length.toString()}
              trend={{ value: "5%", positive: false }}
              className="animation-delay-[0.2s]"
              bgColor="bg-green-50"
              iconColor="text-green-600"
            />)}
            {(isSuperAdmin || hasPermission('time_tracking', 'read')) && (
            <StatCard
              icon={Clock}
              label="Tracked Hours"
              value="187"
              trend={{ value: "12%", positive: true }}
              className="animation-delay-[0.3s]"
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
            />)}
            {(isSuperAdmin || hasPermission('projects', 'read')) && (
            <StatCard
              icon={LayoutGrid}
              label="Completed Projects"
              value={allProjects
                .filter((p) => p.status === "Completed")
                .length.toString()}
              trend={{ value: "30%", positive: true }}
              className="animation-delay-[0.4s]"
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
            />)}
          </div>
        </section>

        <section
          className="mb-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  activeTab === "overview"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  activeTab === "projects"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                Recent Projects
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  activeTab === "tasks"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                Upcoming Tasks
              </button>
            </div>
          </div>
        </section>

        <section
          className="opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          {activeTab === "overview" && (
            <div className="space-y-8">
                {hasPermission('projects', 'read') && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Recent Projects</h2>
                  <MotionButton
                    variant="ghost"
                    size="sm"
                    motion="subtle"
                    className="text-primary"
                    onClick={() => setActiveTab("projects")}
                  >
                    View All <ArrowRight size={16} className="ml-1" />
                  </MotionButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      {...project}
                      className="animate-fade-in"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: "forwards",
                      }}
                    />
                  ))}
                </div>
              </div>
                )}

              {hasPermission('tasks', 'read') && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Upcoming Tasks</h2>
                  <MotionButton
                    variant="ghost"
                    size="sm"
                    motion="subtle"
                    className="text-primary"
                    onClick={() => setActiveTab("tasks")}
                  >
                    View All <ArrowRight size={16} className="ml-1" />
                  </MotionButton>
                </div>
                <TaskTable
                  tasks={upcomingTasks}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  className="animate-fade-in"
                  showProject={true}
                />
              </div>
            )}
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              {hasPermission('projects', 'create') && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">All Projects</h2>
                <MotionButton variant="default" size="sm" motion="subtle">
                  New Project <Plus size={16} className="ml-1" />
                </MotionButton>
              </div>)}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    {...project}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animationFillMode: "forwards",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div>
              {hasPermission('tasks', 'create') && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">All Tasks</h2>
                <MotionButton variant="default" size="sm" motion="subtle">
                  New Task <Plus size={16} className="ml-1" />
                </MotionButton>
              </div>)}
              <TaskTable
                tasks={allTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                className="animate-fade-in"
                showProject={true}
              />
            </div>
          )}
        </section>
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
