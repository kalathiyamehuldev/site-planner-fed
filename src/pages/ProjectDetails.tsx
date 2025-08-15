
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import TaskTable from "@/components/TaskTable";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  ShoppingBag,
  Edit,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import ProjectMemberManagement from "@/components/projects/ProjectMemberManagement";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchProjectById,
  selectSelectedProject,
  selectProjectLoading,
  getProjectMembers,
} from "@/redux/slices/projectsSlice";
import {
  fetchTasksByProject,
  selectProjectTasks,
  selectTaskLoading,
  deleteTaskAsync,
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

// Static data for progress (keeping as requested)
const staticProjectData = {
  progress: 65,
};

const projectDocuments = [
  {
    id: "d1",
    name: "Initial Contract.pdf",
    type: "PDF",
    size: "1.2 MB",
    date: "June 15, 2023",
  },
  {
    id: "d2",
    name: "Floor Plan v1.pdf",
    type: "PDF",
    size: "3.4 MB",
    date: "June 22, 2023",
  },
  {
    id: "d3",
    name: "Client Requirements.docx",
    type: "DOCX",
    size: "845 KB",
    date: "June 18, 2023",
  },
  {
    id: "d4",
    name: "Mood Board.jpg",
    type: "JPG",
    size: "5.1 MB",
    date: "June 30, 2023",
  },
];

const ProjectDetails = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Handle task creation success - refetch project tasks
  const handleTaskCreated = () => {
    if (id) {
      dispatch(fetchTasksByProject(id));
    }
    setAddTaskDialogOpen(false);
  };
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const project = useAppSelector(selectSelectedProject);
  const loading = useAppSelector(selectProjectLoading);
  const projectTasks = useAppSelector(selectProjectTasks);
  const tasksLoading = useAppSelector(selectTaskLoading);

  // Fetch project data and tasks when component mounts or ID changes
  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchTasksByProject(id));
      
      // Fetch project members locally
      setMembersLoading(true);
      dispatch(getProjectMembers(id))
         .unwrap()
         .then((response) => {
           setProjectMembers(response.members || []);
         })
        .catch((error) => {
          console.error('Failed to fetch project members:', error);
          toast({
            title: "Error",
            description: "Failed to fetch project members",
            variant: "destructive",
          });
        })
        .finally(() => {
          setMembersLoading(false);
        });
    }
  }, [dispatch, id, toast]);

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
        // Refresh project tasks list
        if (id) {
          dispatch(fetchTasksByProject(id));
        }
      } else {
        throw new Error(result.payload as string || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingTask(null);
    // Refresh project tasks list
    if (id) {
      dispatch(fetchTasksByProject(id));
    }
  };



  // Create combined project details with API data and static data
  const projectDetails = project
    ? {
        ...project,
        progress: staticProjectData.progress, // Use static progress for now
        dueDate: project.endDate
          ? new Date(project.endDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        client: "Jane Cooper", // Keep static for now
      }
    : null;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading project details...</div>
        </div>
      </PageContainer>
    );
  }

  if (!projectDetails) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">Project not found</div>
        </div>
      </PageContainer>
    );
  }

  const statusColors = {
    "Not Started": "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "On Hold": "bg-amber-100 text-amber-600",
    Completed: "bg-green-100 text-green-600",
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div className="space-y-1">
            <Link
              to="/projects"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Projects
            </Link>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-3xl font-light">{projectDetails.title}</h1>
              <span
                className={cn(
                  "text-sm px-3 py-1 rounded-full font-medium",
                  statusColors[projectDetails.status]
                )}
              >
                {projectDetails.status}
              </span>
            </div>
            <p className="text-muted-foreground">
              Client: {projectDetails.client}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <MotionButton
              variant="outline"
              size="sm"
              motion="subtle"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit size={16} className="mr-2" /> Edit Project
            </MotionButton>
            <MotionButton
              variant="default"
              size="sm"
              motion="subtle"
              onClick={() => setAddTaskDialogOpen(true)}
            >
              <Plus size={16} className="mr-2" /> Add Task
            </MotionButton>
          </div>
        </div>

        {/* Project Tabs */}
        <Tabs
          defaultValue="overview"
          className="w-full animate-fade-in animation-delay-[0.2s]"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
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
                    <p className="font-medium">
                      {projectDetails.team.length} members
                    </p>
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </h3>
                  <p className="text-foreground">
                    {projectDetails.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Start Date:</span>
                        <span className="font-medium">
                          {projectDetails.startDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Due Date:</span>
                        <span className="font-medium">
                          {projectDetails.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Team Members
                    </h3>
                    <div className="space-y-2">
                      {projectDetails.team.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {member
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span>{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Overall Completion</span>
                      <span className="font-medium">
                        {projectDetails.progress}%
                      </span>
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
              <TaskTable
                tasks={projectTasks.slice(0, 3)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                className="animate-scale-in"
                showProject={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">All Tasks</h2>
              <MotionButton
                variant="default"
                size="sm"
                motion="subtle"
                onClick={() => setAddTaskDialogOpen(true)}
              >
                <Plus size={16} className="mr-2" /> Add Task
              </MotionButton>
            </div>
            {tasksLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-lg">Loading tasks...</div>
              </div>
            ) : (
              <TaskTable
                tasks={projectTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                className="animate-scale-in"
                showProject={false}
              />
            )}
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
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Size
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-4 flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          {doc.name}
                        </td>
                        <td className="p-4">{doc.type}</td>
                        <td className="p-4">{doc.size}</td>
                        <td className="p-4">{doc.date}</td>
                        <td className="p-4 text-right">
                          <MotionButton
                            variant="ghost"
                            size="sm"
                            motion="subtle"
                            className="text-primary"
                          >
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

          <TabsContent value="members" className="space-y-6">
            <GlassCard className="p-6 animate-fade-in">
              {project?.id && (
                <ProjectMemberManagement projectId={project.id} />
              )}
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

      <AddProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editProject={projectDetails}
        mode="edit"
      />

      {project?.id && (
        <AddTaskDialog
          open={addTaskDialogOpen}
          fromProject={true}
          onOpenChange={setAddTaskDialogOpen}
          projectId={project.id}
          onSuccess={handleTaskCreated}
          projectMembers={projectMembers}
          membersLoading={membersLoading}
        />
      )}

      {/* Edit Task Dialog */}
      <AddTaskDialog
        open={!!editingTask}
        fromProject={true}
        onOpenChange={(open) => !open && setEditingTask(null)}
        projectId={id || ""}
        task={editingTask}
        onSuccess={handleEditSuccess}
        projectMembers={projectMembers}
        membersLoading={membersLoading}
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

export default ProjectDetails;
