
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import ProjectCard from "@/components/ProjectCard";
import TaskTable from "@/components/TaskTable";
import { LayoutGrid, FileText, CheckSquare, Clock, Plus, ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAllProjects, fetchProjects } from "@/redux/slices/projectsSlice";
import { selectAllTasks, fetchTasks } from "@/redux/slices/tasksSlice";

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const allProjects = useAppSelector(selectAllProjects);
  const allTasks = useAppSelector(selectAllTasks);

  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks">(
    "overview"
  );

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks(null));
  }, [dispatch]);

  // Get recent projects (3 most recent)
  const recentProjects = [...allProjects]
    .sort((a, b) => {
      // Sort by most recent start date
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })
    .slice(0, 3);

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
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: { value: string; positive: boolean };
    className?: string;
  }) => (
    <GlassCard
      className={cn("flex flex-col h-full animate-scale-in", className)}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 mb-4">
          <Icon size={20} className="text-primary" />
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
          <AnimatedGradient
            className="absolute inset-0 -z-10 rounded-2xl mask-radial-gradient opacity-30"
            variant="accent"
          />
          <div
            className="py-12 px-6 md:px-10 opacity-0 animate-fade-in"
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
              <MotionButton variant="default" size="lg" motion="subtle">
                Create New Project <Plus size={18} className="ml-2" />
              </MotionButton>
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
            <StatCard
              icon={FileText}
              label="Active Projects"
              value={allProjects
                .filter((p) => p.status === "In Progress")
                .length.toString()}
              trend={{ value: "20%", positive: true }}
              className="animation-delay-[0.1s]"
            />
            <StatCard
              icon={CheckSquare}
              label="Pending Tasks"
              value={allTasks.length.toString()}
              trend={{ value: "5%", positive: false }}
              className="animation-delay-[0.2s]"
            />
            <StatCard
              icon={Clock}
              label="Tracked Hours"
              value="187"
              trend={{ value: "12%", positive: true }}
              className="animation-delay-[0.3s]"
            />
            <StatCard
              icon={LayoutGrid}
              label="Completed Projects"
              value={allProjects
                .filter((p) => p.status === "Completed")
                .length.toString()}
              trend={{ value: "30%", positive: true }}
              className="animation-delay-[0.4s]"
            />
          </div>
        </section>

        <section
          className="mb-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          <div className="flex space-x-2 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "py-2 px-4 text-sm font-medium rounded-t-lg transition-colors",
                activeTab === "overview"
                  ? "text-primary border-b-2 border-primary -mb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={cn(
                "py-2 px-4 text-sm font-medium rounded-t-lg transition-colors",
                activeTab === "projects"
                  ? "text-primary border-b-2 border-primary -mb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Recent Projects
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={cn(
                "py-2 px-4 text-sm font-medium rounded-t-lg transition-colors",
                activeTab === "tasks"
                  ? "text-primary border-b-2 border-primary -mb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Upcoming Tasks
            </button>
          </div>
        </section>

        <section
          className="opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          {activeTab === "overview" && (
            <div className="space-y-8">
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
                  className="animate-fade-in"
                  showProject={true}
                />
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">All Projects</h2>
                <MotionButton variant="default" size="sm" motion="subtle">
                  New Project <Plus size={16} className="ml-1" />
                </MotionButton>
              </div>
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">All Tasks</h2>
                <MotionButton variant="default" size="sm" motion="subtle">
                  New Task <Plus size={16} className="ml-1" />
                </MotionButton>
              </div>
              <TaskTable
                tasks={allTasks}
                className="animate-fade-in"
                showProject={true}
              />
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
