
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import ProjectCard from "@/components/ProjectCard";
import TaskCard from "@/components/TaskCard";
import { LayoutGrid, FileText, CheckSquare, Clock, Plus, ArrowRight } from "lucide-react";

// Mock data for demo
const recentProjects = [
  {
    id: "p1",
    title: "Modern Loft Redesign",
    client: "Jane Cooper",
    status: "In Progress" as const,
    dueDate: "Aug 24, 2023",
    team: ["Alex Jones", "Sarah Smith", "Robert Lee"],
    progress: 65,
  },
  {
    id: "p2",
    title: "Coastal Vacation Home",
    client: "Michael Scott",
    status: "Not Started" as const,
    dueDate: "Sep 15, 2023",
    team: ["Alex Jones", "Sarah Smith"],
    progress: 0,
  },
  {
    id: "p3",
    title: "Corporate Office Revamp",
    client: "Acme Corp",
    status: "On Hold" as const,
    dueDate: "Oct 30, 2023",
    team: ["Alex Jones", "Robert Lee", "Emma Watson", "John Doe"],
    progress: 35,
  },
];

const upcomingTasks = [
  {
    id: "t1",
    title: "Finalize floor plans",
    projectName: "Modern Loft Redesign",
    status: "In Progress" as const,
    priority: "High" as const,
    dueDate: "Tomorrow",
    estimatedHours: 4,
    assignedTo: "Alex Jones",
  },
  {
    id: "t2",
    title: "Source furniture options",
    projectName: "Coastal Vacation Home",
    status: "Not Started" as const,
    priority: "Medium" as const,
    dueDate: "This week",
    estimatedHours: 8,
    assignedTo: "Sarah Smith",
  },
  {
    id: "t3",
    title: "Client meeting for material selection",
    projectName: "Modern Loft Redesign",
    status: "Not Started" as const,
    priority: "Medium" as const,
    dueDate: "Next Monday",
    estimatedHours: 2,
    assignedTo: "Alex Jones",
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks">("overview");

  const StatCard = ({ icon: Icon, label, value, trend, className }: {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: { value: string; positive: boolean };
    className?: string;
  }) => (
    <GlassCard className={cn("flex flex-col h-full animate-scale-in", className)}>
      <div className="p-6 flex flex-col h-full">
        <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10 mb-4">
          <Icon size={20} className="text-primary" />
        </div>
        <h3 className="text-muted-foreground font-medium text-sm mb-1">{label}</h3>
        <p className="text-2xl font-light mb-1">{value}</p>
        {trend && (
          <p className={cn(
            "text-xs font-medium mt-auto",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            {trend.positive ? "↑" : "↓"} {trend.value} from last month
          </p>
        )}
      </div>
    </GlassCard>
  );

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Hero section */}
        <section className="relative mb-12">
          <AnimatedGradient 
            className="absolute inset-0 -z-10 rounded-2xl mask-radial-gradient opacity-30" 
            variant="accent"
          />
          <div className="py-12 px-6 md:px-10 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <h1 className="text-3xl md:text-4xl font-light mb-4">
              Welcome to <span className="font-normal text-primary">DesignFlow</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl mb-8">
              Manage your interior design projects with elegance and efficiency. 
              Track tasks, organize documents, and collaborate with your team seamlessly.
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

        {/* Stats Grid */}
        <section className="mb-12 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={FileText} 
              label="Active Projects" 
              value="12" 
              trend={{ value: "20%", positive: true }}
              className="animation-delay-[0.1s]"
            />
            <StatCard 
              icon={CheckSquare} 
              label="Pending Tasks" 
              value="28" 
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
              value="39" 
              trend={{ value: "30%", positive: true }}
              className="animation-delay-[0.4s]"
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
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

        {/* Content */}
        <section className="opacity-0 animate-fade-in" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Recent Projects */}
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
                  {recentProjects.slice(0, 3).map((project, index) => (
                    <ProjectCard key={project.id} {...project} className={cn({
                      "opacity-0 animate-slide-up": true,
                      "animation-delay-[0.1s]": index === 0,
                      "animation-delay-[0.2s]": index === 1,
                      "animation-delay-[0.3s]": index === 2,
                    })} style={{ animationFillMode: "forwards" }} />
                  ))}
                </div>
              </div>

              {/* Upcoming Tasks */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTasks.slice(0, 3).map((task, index) => (
                    <TaskCard key={task.id} {...task} className={cn({
                      "opacity-0 animate-slide-up": true,
                      "animation-delay-[0.2s]": index === 0,
                      "animation-delay-[0.3s]": index === 1,
                      "animation-delay-[0.4s]": index === 2,
                    })} style={{ animationFillMode: "forwards" }} />
                  ))}
                </div>
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
                {recentProjects.map((project, index) => (
                  <ProjectCard key={project.id} {...project} className={cn({
                    "opacity-0 animate-slide-up": true,
                    "animation-delay-[0.1s]": index === 0,
                    "animation-delay-[0.2s]": index === 1,
                    "animation-delay-[0.3s]": index === 2,
                  })} style={{ animationFillMode: "forwards" }} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTasks.map((task, index) => (
                  <TaskCard key={task.id} {...task} className={cn({
                    "opacity-0 animate-slide-up": true,
                    "animation-delay-[0.1s]": index === 0,
                    "animation-delay-[0.2s]": index === 1,
                    "animation-delay-[0.3s]": index === 2,
                  })} style={{ animationFillMode: "forwards" }} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
