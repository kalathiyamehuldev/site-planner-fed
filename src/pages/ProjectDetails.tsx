
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import TaskCard from "@/components/TaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  Calendar, Clock, Users, FileText, CheckSquare, 
  Image, ShoppingBag, Edit, ArrowLeft, Plus 
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demo
const projectDetails = {
  id: "p1",
  title: "Modern Loft Redesign",
  client: "Jane Cooper",
  status: "In Progress" as const,
  startDate: "June 15, 2023",
  dueDate: "August 24, 2023",
  budget: "$45,000",
  team: ["Alex Jones", "Sarah Smith", "Robert Lee"],
  progress: 65,
  description: "Complete renovation of a 2,000 sq ft loft space in downtown. The project includes new flooring, custom furniture, lighting design, and a complete kitchen overhaul. The client is looking for a modern, minimalist design with warm accents.",
};

const projectTasks = [
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
    projectName: "Modern Loft Redesign",
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
  {
    id: "t4",
    title: "Lighting design plan",
    projectName: "Modern Loft Redesign",
    status: "Not Started" as const,
    priority: "Low" as const,
    dueDate: "Next week",
    estimatedHours: 6,
    assignedTo: "Robert Lee",
  },
];

const projectDocuments = [
  { id: "d1", name: "Initial Contract.pdf", type: "PDF", size: "1.2 MB", date: "June 15, 2023" },
  { id: "d2", name: "Floor Plan v1.pdf", type: "PDF", size: "3.4 MB", date: "June 22, 2023" },
  { id: "d3", name: "Client Requirements.docx", type: "DOCX", size: "845 KB", date: "June 18, 2023" },
  { id: "d4", name: "Mood Board.jpg", type: "JPG", size: "5.1 MB", date: "June 30, 2023" },
];

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const statusColors = {
    "Not Started": "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "On Hold": "bg-amber-100 text-amber-600",
    "Completed": "bg-green-100 text-green-600",
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div className="space-y-1">
            <Link to="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={16} className="mr-1" /> Back to Projects
            </Link>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-3xl font-light">{projectDetails.title}</h1>
              <span className={cn(
                "text-sm px-3 py-1 rounded-full font-medium",
                statusColors[projectDetails.status]
              )}>
                {projectDetails.status}
              </span>
            </div>
            <p className="text-muted-foreground">Client: {projectDetails.client}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <MotionButton variant="outline" size="sm" motion="subtle">
              <Edit size={16} className="mr-2" /> Edit Project
            </MotionButton>
            <MotionButton variant="default" size="sm" motion="subtle">
              <Plus size={16} className="mr-2" /> Add Task
            </MotionButton>
          </div>
        </div>

        {/* Project Tabs */}
        <Tabs defaultValue="overview" className="w-full animate-fade-in animation-delay-[0.2s]">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4 animate-scale-in animation-delay-[0.1s]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                    <Calendar size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{projectDetails.dueDate}</p>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4 animate-scale-in animation-delay-[0.2s]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-medium">{projectDetails.progress}%</p>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4 animate-scale-in animation-delay-[0.3s]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team</p>
                    <p className="font-medium">{projectDetails.team.length} members</p>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4 animate-scale-in animation-delay-[0.4s]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                    <ShoppingBag size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">{projectDetails.budget}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Project Details */}
            <GlassCard className="p-6 animate-fade-in animation-delay-[0.3s]">
              <h2 className="text-xl font-medium mb-4">Project Details</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-foreground">{projectDetails.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Start Date:</span>
                        <span className="font-medium">{projectDetails.startDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Due Date:</span>
                        <span className="font-medium">{projectDetails.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Team Members</h3>
                    <div className="space-y-2">
                      {projectDetails.team.map((member, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {member.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Overall Completion</span>
                      <span className="font-medium">{projectDetails.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${projectDetails.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Recent Tasks */}
            <div className="animate-fade-in animation-delay-[0.4s]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Recent Tasks</h2>
                <MotionButton 
                  variant="ghost" 
                  size="sm" 
                  motion="subtle" 
                  className="text-primary"
                  onClick={() => setActiveTab("tasks")}
                >
                  View All Tasks
                </MotionButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectTasks.slice(0, 3).map((task, index) => (
                  <TaskCard key={task.id} {...task} className={cn({
                    "animation-delay-[0.1s]": index === 0,
                    "animation-delay-[0.2s]": index === 1, 
                    "animation-delay-[0.3s]": index === 2,
                  })} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">All Tasks</h2>
              <MotionButton variant="default" size="sm" motion="subtle">
                <Plus size={16} className="mr-2" /> Add Task
              </MotionButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectTasks.map((task, index) => (
                <TaskCard key={task.id} {...task} className={cn({
                  "animate-scale-in": true,
                  "animation-delay-[0.1s]": index === 0,
                  "animation-delay-[0.2s]": index === 1,
                  "animation-delay-[0.3s]": index === 2,
                  "animation-delay-[0.4s]": index === 3,
                })} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Documents</h2>
              <MotionButton variant="default" size="sm" motion="subtle">
                <Plus size={16} className="mr-2" /> Upload Document
              </MotionButton>
            </div>
            <GlassCard className="overflow-hidden animate-scale-in">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Size</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          {doc.name}
                        </td>
                        <td className="p-4">{doc.type}</td>
                        <td className="p-4">{doc.size}</td>
                        <td className="p-4">{doc.date}</td>
                        <td className="p-4 text-right">
                          <MotionButton variant="ghost" size="sm" motion="subtle" className="text-primary">
                            Download
                          </MotionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Invoices</h2>
              <MotionButton variant="default" size="sm" motion="subtle">
                <Plus size={16} className="mr-2" /> Create Invoice
              </MotionButton>
            </div>
            <div className="flex items-center justify-center p-12 text-muted-foreground animate-fade-in">
              No invoices created yet for this project.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default ProjectDetails;
