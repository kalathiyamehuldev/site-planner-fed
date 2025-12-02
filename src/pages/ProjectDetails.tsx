
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
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
  Plus,
  ChevronRight,
  Trash2,
  Check,
  X,
} from "lucide-react";
// Removed unused Link import
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import ProjectMemberManagement, { ProjectMemberManagementRef } from "@/components/projects/ProjectMemberManagement";
import solar from "@solar-icons/react";
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
import {
  fetchDocumentsByProject,
  selectProjectDocuments,
  selectProjectDocumentsLoading,
} from "@/redux/slices/documentsSlice";
import usePermission from "@/hooks/usePermission";
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
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import ActionButton from "@/components/ui/ActionButton";
import { DocumentsMinimalistic, DownloadMinimalistic } from "@solar-icons/react";
import { calculateProjectProgress, formatProjectDate } from "@/utils/projectUtils";
import DocumentSidebar from "@/components/documents/DocumentSidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchLocationsByProject,
  createLocation,
  updateLocation,
  deleteLocation,
  selectLocationsByProject,
  selectLocationsLoading,
  selectLocationsError,
} from "@/redux/slices/locationsSlice";

// Progress is now calculated from tasks

// Format file type to display simplified version
const formatFileType = (type: string): string => {
  if (!type) return 'Unknown';
  
  // If it's already a simple extension, return as is
  if (!type.includes('/')) {
    return type.toUpperCase();
  }
  
  // Map common MIME types to simple extensions
  const mimeTypeMap: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/msword': 'DOC',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.ms-powerpoint': 'PPT',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
    'application/json': 'JSON',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'application/javascript': 'JS',
    'text/javascript': 'JS'
  };
  
  // Return mapped type or extract extension from MIME type
  if (mimeTypeMap[type]) {
    return mimeTypeMap[type];
  }
  
  // For other MIME types, try to extract a meaningful part
  const parts = type.split('/');
  if (parts.length === 2) {
    const subtype = parts[1];
    // Remove common prefixes and suffixes
    const cleaned = subtype
      .replace(/^vnd\./, '')
      .replace(/^x-/, '')
      .replace(/\+.*$/, '')
      .toUpperCase();
    return cleaned || 'FILE';
  }
  
  return 'FILE';
};

// Remove static documents - will use API data instead

const ProjectDetails = () => {
  const { hasPermission } = usePermission();
  const resource = 'projects';
  const taskResource = 'tasks';
  const documentResource = 'documents';
  const locationResource = 'projects';
  const invoiceResource = 'invoices';
  const navigate = useNavigate();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const pmRef = useRef<ProjectMemberManagementRef>(null);

  // Handle task creation success - refetch project tasks
  const handleTaskCreated = () => {
    if (id) {
      dispatch(fetchTasksByProject(id));
    }
    setAddTaskDialogOpen(false);
  };
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Close document sidebar when tab changes
  useEffect(() => {
    setShowDocumentSidebar(false);
    setSelectedDocument(null);
  }, [activeTab]);
  const dispatch = useAppDispatch();
  // removed useToast usage
  const project = useAppSelector(selectSelectedProject);
  const loading = useAppSelector(selectProjectLoading);
  const projectTasks = useAppSelector(selectProjectTasks);
  const tasksLoading = useAppSelector(selectTaskLoading);
  const projectDocuments = useAppSelector(selectProjectDocuments);
  const documentsLoading = useAppSelector(selectProjectDocumentsLoading);
  const projectLocations = useAppSelector((state) => selectLocationsByProject(state, id || ''));
  const locationsLoading = useAppSelector(selectLocationsLoading);
  const locationsError = useAppSelector(selectLocationsError);

  const currentUser = useAppSelector((state) => state.auth.user);
  const isVendor = currentUser?.userType === 'VENDOR';
  const visibleProjectTasks = useMemo(() => {
    return isVendor
      ? (projectTasks || []).filter(t => t.assigneeType === 'VENDOR' && t.assigneeId === currentUser?.id)
      : (projectTasks || []);
  }, [projectTasks, currentUser?.id, isVendor]);

  // Fetch project data, tasks, and documents when component mounts or ID changes
  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchTasksByProject(id));
      dispatch(fetchDocumentsByProject(id));
      dispatch(fetchLocationsByProject(id));

      setMembersLoading(true);
      dispatch(getProjectMembers(id))
         .unwrap()
         .then((response) => {
           setProjectMembers(response.members || []);
         })
        .catch((error) => {
          console.error('Failed to fetch project members:', error);
        })
        .finally(() => {
          setMembersLoading(false);
        });
    }
  }, [dispatch, id]);

  const handleEditTask = (task: any) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch(deleteTaskAsync(taskId));
  };

  const handleDownloadDocument = (fileUrl: string, fileName: string) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Locations: state and handlers
  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState('');

  const handleAddLocation = async () => {
    if (!id || !hasPermission(locationResource, 'create')) return;
    const name = newLocationName.trim();
    if (!name) return;
    try {
      await dispatch(createLocation({ name, projectId: id })).unwrap();
      setNewLocationName('');
    } catch (err) {
      console.error('Failed to create location:', err);
    }
  };

  const startEditLocation = (loc: any) => {
    if (!hasPermission(locationResource, 'update')) return;
    setEditingLocationId(loc.id);
    setEditingLocationName(loc.name || '');
  };

  const cancelEditLocation = () => {
    setEditingLocationId(null);
    setEditingLocationName('');
  };

  const saveEditLocation = async () => {
    if (!editingLocationId || !hasPermission(locationResource, 'update')) return;
    const name = editingLocationName.trim();
    if (!name) return;
    try {
      await dispatch(updateLocation({ id: editingLocationId, data: { name } })).unwrap();
      cancelEditLocation();
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    if (!hasPermission(locationResource, 'delete')) return;
    try {
      await dispatch(deleteLocation(locId)).unwrap();
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  const confirmDeleteTask = async () => {
    if (!deletingTaskId) return;

    try {
      const result = await dispatch(deleteTaskAsync(deletingTaskId));
      if (deleteTaskAsync.fulfilled.match(result)) {
        if (id) {
          dispatch(fetchTasksByProject(id));
        }
      } else {
        throw new Error((result.payload as string) || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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



  // Create combined project details with API data and calculated progress
  const projectDetails = project
    ? {
        ...project,
        progress: calculateProjectProgress(projectTasks), // Calculate from tasks
        dueDate: formatProjectDate(project.endDate),
        // Keep original dates for form editing, add formatted versions for display
        formattedStartDate: formatProjectDate(project.startDate, (project as any).createdAt), // Use createdAt as fallback
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
    "Active": "bg-emerald-100 text-emerald-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "On Hold": "bg-amber-100 text-amber-600",
    Completed: "bg-green-100 text-green-600",
  };

  return (
    <PageContainer>
      <div className="space-y-4 md:space-y-8">
        {/* Header */}
        <PageHeader 
          title={projectDetails.title} 
          showBackButton={true}
          onBackClick={() => navigate('/projects')}
        >
          <div className="flex items-center flex-wrap gap-3">
            <span
              className={cn(
                "text-sm px-3 py-1 rounded-full font-medium",
                statusColors[projectDetails.status]
                )}
              >
                {projectDetails.status}
              </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasPermission(resource, 'update') && (
              <ActionButton
                variant="secondary"
                // size="sm"
                motion="subtle"
                onClick={() => setEditDialogOpen(true)}
                leftIcon={<Edit size={16} className="mr-2" />}
                text="Edit Project"
              >
              </ActionButton>
            )}
            {hasPermission(taskResource, 'create') && (
              <ActionButton
                variant="primary"
                // size="sm"
                motion="subtle"
                onClick={() => setAddTaskDialogOpen(true)}
                leftIcon={<Plus size={16} className="mr-2" />}
                text="Add Task"
              >
              </ActionButton>
            )}
          </div>
        </PageHeader>

        {/* Project Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full animate-fade-in animation-delay-[0.2s]"
        >
          <TabsList className="mb-6 w-full grid grid-cols-5 bg-white rounded-md md:flex md:gap-2">
            <TabsTrigger 
              value="overview"
              className="w-full px-2 md:px-3 py-2 text-xs md:text-base font-semibold text-[#1a2624] bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#1b78f9]"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="w-full px-2 md:px-3 py-2 text-xs md:text-base font-semibold text-[#1a2624] bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#1b78f9]"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="w-full px-2 md:px-3 py-2 text-xs md:text-base font-semibold text-[#1a2624] bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#1b78f9]"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="members"
              className="w-full px-2 md:px-3 py-2 text-xs md:text-base font-semibold text-[#1a2624] bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#1b78f9]"
            >
              Members
            </TabsTrigger>
            <TabsTrigger 
              value="locations"
              className="w-full px-2 md:px-3 py-2 text-xs md:text-base font-semibold text-[#1a2624] bg-white data-[state=active]:shadow-[inset_0_-2px_0_0_#1b78f9]"
            >
              Locations
            </TabsTrigger>
            {/* <TabsTrigger value="invoices">Invoices</TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4 animate-scale-in animation-delay-[0.1s]">
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 sm:p-2 rounded-sm flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: `#1B78F91A` }}
                  >
                    <solar.Time.Calendar className="w-6 h-6" style={{ color: '#1B78F9' }} />
                  </div>
                  <div>
                    <p className="text-[#4B5563] text-xs font-normal font-['Poppins']">Due Date</p>
                    <p className="text-gray-900 text-sm font-medium font-['Poppins']">{projectDetails.dueDate}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 animate-scale-in animation-delay-[0.2s]">
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 sm:p-2 rounded-sm flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: `#3DD5981A` }}
                  >
                    <solar.Ui.CheckCircle className="w-6 h-6" style={{ color: '#3DD598' }} />
                  </div>
                  <div>
                    <p className="text-[#4B5563] text-xs font-normal font-['Poppins']">Progress</p>
                    <p className="text-gray-900 text-sm font-medium font-['Poppins']">{projectDetails.progress}%</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 animate-scale-in animation-delay-[0.3s]">
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 sm:p-2 rounded-sm flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: `#00C2FF1A` }}
                  >
                    <solar.Security.ShieldUser className="w-6 h-6" style={{ color: '#00C2FF' }} />
                  </div>
                  <div>
                    <p className="text-[#4B5563] text-xs font-normal font-['Poppins']">Team</p>
                    <p className="text-gray-900 text-sm font-medium font-['Poppins']">{projectDetails.team.length === 1 ? '1 member' : `${projectDetails.team.length} members`}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 animate-scale-in animation-delay-[0.4s]">
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 sm:p-2 rounded-sm flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: `#FFB5471A` }}
                  >
                    <solar.Money.Bill className="w-6 h-6" style={{ color: '#FFB547' }} />
                  </div>
                  <div>
                    <p className="text-[#4B5563] text-xs font-normal font-['Poppins']">Budget</p>
                    <p className="text-gray-900 text-sm font-medium font-['Poppins']">{projectDetails.budget}</p>
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
                          {projectDetails.formattedStartDate}
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
                  {projectDetails.team.length > 0 && (
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
                  )}
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
                  motion="subtle"
                  className="text-primary"
                  onClick={() => setActiveTab("tasks")}
                >
                  <ChevronRight size={32} />
                </MotionButton>
              </div>
              <TaskTable
                tasks={visibleProjectTasks.slice(0, 3)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                className="animate-scale-in"
                showProject={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Locations</h2>
              {hasPermission(locationResource, 'create') && (
                <div className="hidden md:flex items-center gap-2">
                  <ActionButton 
                    onClick={() => setAddLocationDialogOpen(true)} 
                    variant="primary" 
                    text="Add New Location" 
                    leftIcon={<solar.Ui.AddSquare className="w-7 h-7" />}
                  />
                </div>
              )}
            </div>

            <GlassCard className="p-4">
              {locationsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-lg">Loading locations...</div>
                </div>
              ) : locationsError ? (
                <div className="text-sm text-red-600">{locationsError}</div>
              ) : projectLocations.length === 0 ? (
                <div className="text-center bg-white rounded-md p-12">
                  <solar.Tools.Layers weight="Bold" size={24} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No locations found for this project</p>
                  {hasPermission(locationResource, 'create') && (
                    <div className="mt-4">
                      <ActionButton
                        variant="primary"
                        motion="subtle"
                        text="Add New Location"
                        leftIcon={<solar.Ui.AddSquare className="w-6 h-6" />}
                        onClick={() => setAddLocationDialogOpen(true)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                <div className="sm:hidden">
                  <ul className="divide-y rounded-md border">
                    {projectLocations.map((loc) => (
                      <li key={loc.id} className="p-3">
                        {editingLocationId === loc.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLocationName}
                              onChange={(e) => setEditingLocationName(e.target.value)}
                              className="w-full"
                            />
                            <div className="flex items-center gap-2">
                              {hasPermission(locationResource, 'update') && (
                                <Button size="icon" variant="ghost" onClick={saveEditLocation} aria-label="Save location">
                                  <Check size={18} className="text-blue-600" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={cancelEditLocation} aria-label="Cancel edit">
                                <X size={18} className="text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate" title={loc.name}>{loc.name}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasPermission(locationResource, 'update') && (
                                <Button size="icon" variant="ghost" onClick={() => startEditLocation(loc)} aria-label="Edit location">
                                  <Edit size={18} className="text-blue-600" />
                                </Button>
                              )}
                              {hasPermission(locationResource, 'delete') && (
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteLocation(loc.id)} aria-label="Delete location">
                                  <Trash2 size={18} className="text-red-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden sm:block">
                  <div className="space-y-3">
                    {projectLocations.map((loc) => (
                      <div key={loc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-md p-3">
                        {editingLocationId === loc.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingLocationName}
                              onChange={(e) => setEditingLocationName(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate" title={loc.name}>{loc.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 sm:self-auto self-end">
                          {editingLocationId === loc.id ? (
                            <>
                              {hasPermission(locationResource, 'update') && (
                                <Button size="icon" variant="ghost" onClick={saveEditLocation} aria-label="Save location">
                                  <Check size={18} className="text-blue-600" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={cancelEditLocation} aria-label="Cancel edit">
                                <X size={18} className="text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {hasPermission(locationResource, 'update') && (
                                <Button size="icon" variant="ghost" onClick={() => startEditLocation(loc)} aria-label="Edit location">
                                  <Edit size={18} className="text-blue-600" />
                                </Button>
                              )}
                              {hasPermission(locationResource, 'delete') && (
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteLocation(loc.id)} aria-label="Delete location">
                                  <Trash2 size={18} className="text-red-600" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              )}
            </GlassCard>
            {hasPermission(locationResource, 'create') && (
              <Button
                variant="default"
                onClick={() => setAddLocationDialogOpen(true)}
                className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
              >
                <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
              </Button>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">All Tasks</h2>
              {hasPermission(taskResource, 'create') && (
                <div className="hidden md:flex">
                  <ActionButton
                    variant="primary"
                    motion="subtle"
                    onClick={() => setAddTaskDialogOpen(true)}
                    text="Add Task"
                    leftIcon={<solar.Ui.AddSquare className="w-7 h-7" />}
                  />
                </div>
              )}
            </div>
            {tasksLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-lg">Loading tasks...</div>
              </div>
            ) : visibleProjectTasks.length === 0 ? (
              <div className="text-center bg-white rounded-md p-12">
                <solar.List.ChecklistMinimalistic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tasks found for this project</p>
                {hasPermission(taskResource, 'create') && (
                  <div className="mt-4">
                    <ActionButton
                      variant="primary"
                      motion="subtle"
                      text="Add Task"
                      leftIcon={<solar.Ui.AddSquare className="w-6 h-6" />}
                      onClick={() => setAddTaskDialogOpen(true)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <TaskTable
                tasks={visibleProjectTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                className="animate-scale-in"
                showProject={false}
              />
            )}
            {hasPermission(taskResource, 'create') && (
              <Button
                variant="default"
                onClick={() => setAddTaskDialogOpen(true)}
                className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
              >
                <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
              </Button>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Documents</h2>
              {hasPermission(documentResource, 'create') && (
                <div className="hidden md:flex">
                  <ActionButton 
                    variant="primary" 
                    motion="subtle"
                    onClick={() => setUploadDocumentDialogOpen(true)}
                    text="Upload Document"
                    leftIcon={<solar.Ui.AddSquare className="w-7 h-7" />}
                  />
                </div>
              )}
            </div>
            <GlassCard className="overflow-hidden animate-scale-in">
              {documentsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-lg">Loading documents...</div>
                </div>
              ) : projectDocuments.length === 0 ? (
                <div className="text-center bg-white rounded-md p-12">
                  <DocumentsMinimalistic weight="Bold" size={24} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents found for this project</p>
                  {hasPermission(documentResource, 'create') && (
                    <div className="mt-4">
                      <ActionButton
                        variant="primary"
                        motion="subtle"
                        text="Upload Document"
                        leftIcon={<solar.Ui.AddSquare className="w-6 h-6" />}
                        onClick={() => setUploadDocumentDialogOpen(true)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full bg-white rounded-md overflow-hidden">
                  <div className="sm:hidden">
                    <ul className="divide-y">
                      {projectDocuments.map((doc, index) => (
                        <li
                          key={doc.id}
                          className="p-3 animate-fade-in cursor-pointer"
                          style={{
                            animationDelay: `${index * 0.05}s`,
                            animationFillMode: "forwards",
                          }}
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDocumentSidebar(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-primary flex-shrink-0" />
                                <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal truncate">
                                  {doc.name}
                                </div>
                              </div>
                              {doc.description && (
                                <div className="mt-0.5 text-[#1a2624]/70 text-xs truncate">
                                  {doc.description}
                                </div>
                              )}
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <div>{formatFileType(doc.type)}</div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  <span>
                                    {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {hasPermission(documentResource, 'read') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadDocument(doc.url, doc.name);
                                  }}
                                  className="w-6 h-6 p-0 text-[#1a2624]/60 hover:text-[#1a2624] hover:bg-gray-100 rounded"
                                >
                                  <DownloadMinimalistic size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:table-fixed">
                      <thead className="h-12">
                        <tr className="border-b border-[#1a2624]/10">
                          <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-full sm:w-1/3 md:w-1/4 lg:w-2/5">
                            Document Name
                          </th>
                          <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-20 sm:w-24 md:w-28 hidden md:table-cell">
                            Type
                          </th>
                          <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-24 sm:w-28 md:w-32 hidden lg:table-cell">
                            Date
                          </th>
                          <th className="w-12 px-3 border-b border-[#1a2624]/10"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {projectDocuments.map((doc, index) => (
                          <tr
                            key={doc.id}
                            className="h-16 hover:bg-gray-50/50 transition-colors cursor-pointer animate-fade-in border-b border-[#1a2624]/10"
                            style={{
                              animationDelay: `${index * 0.05}s`,
                              animationFillMode: "forwards",
                            }}
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDocumentSidebar(true);
                            }}
                          >
                            <td className="px-3 max-w-xs">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-primary flex-shrink-0" />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal cursor-pointer hover:text-blue-600 transition-colors truncate">
                                    {doc.name}
                                  </div>
                                  {doc.description && (
                                    <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none hidden sm:block truncate">
                                      {doc.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 hidden md:table-cell">
                              <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
                                {formatFileType(doc.type)}
                              </div>
                            </td>
                            <td className="px-3 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-muted-foreground" />
                                <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
                                  {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </td>
                            <td className="px-3">
                              <div className="flex items-center justify-center">
                                {hasPermission(documentResource, 'read') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadDocument(doc.url, doc.name);
                                    }}
                                    className="w-6 h-6 p-0 text-[#1a2624]/60 hover:text-[#1a2624] hover:bg-gray-100 rounded"
                                  >
                                    <DownloadMinimalistic size={16} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </GlassCard>
            {hasPermission(documentResource, 'create') && (
              <Button
                variant="default"
                onClick={() => setUploadDocumentDialogOpen(true)}
                className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
              >
                <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
              </Button>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Members</h2>
              {hasPermission(resource, 'create') && (
                <div className="hidden md:flex">
                  <ActionButton
                    variant="primary"
                    motion="subtle"
                    text="Add Member"
                    leftIcon={<solar.Ui.AddSquare className="w-7 h-7" />}
                    onClick={() => pmRef.current?.openAddDialog()}
                  />
                </div>
              )}
            </div>
            <GlassCard className="overflow-hidden animate-scale-in">
              {project?.id && (
                <ProjectMemberManagement ref={pmRef} projectId={project.id} hideHeader={true} />
              )}
            </GlassCard>
            {hasPermission(resource, 'create') && (
              <Button
                variant="default"
                onClick={() => pmRef.current?.openAddDialog()}
                className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
              >
                <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
              </Button>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Invoices</h2>
              {hasPermission(invoiceResource, 'create') && (
                <div className="hidden md:flex">
                  <ActionButton 
                    variant="primary" 
                    motion="subtle" 
                    text="Create Invoice" 
                    leftIcon={<solar.Ui.AddSquare className="w-7 h-7" />} 
                    onClick={() => {/* TODO: open create invoice dialog */}}
                  />
                </div>
              )}
            </div>
            <div className="text-center bg-white rounded-md p-12">
              <solar.Money.Bill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invoices created yet for this project</p>
              {hasPermission(invoiceResource, 'create') && (
                <div className="mt-4">
                  <ActionButton
                    variant="primary"
                    motion="subtle"
                    text="Create Invoice"
                    leftIcon={<solar.Ui.AddSquare className="w-6 h-6" />}
                    onClick={() => {/* TODO: open create invoice dialog */}}
                  />
                </div>
              )}
            </div>
            {hasPermission(invoiceResource, 'create') && (
              <Button
                variant="default"
                onClick={() => {/* TODO: open create invoice dialog */}}
                className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
              >
                <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
              </Button>
            )}
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

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        open={uploadDocumentDialogOpen}
        onOpenChange={setUploadDocumentDialogOpen}
        projectId={id}
        onDocumentUploaded={() => {
          // Documents will be automatically refreshed by the dialog
        }}
      />

      <Dialog open={addLocationDialogOpen} onOpenChange={setAddLocationDialogOpen}>
        <DialogContent className="w-5/6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>Enter a name for the new location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              placeholder="e.g., Living Room"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <ActionButton
              variant="secondary"
              motion="subtle"
              onClick={() => setAddLocationDialogOpen(false)}
              text="Cancel"
            />
            <ActionButton
              variant="primary"
              motion="subtle"
              onClick={async () => { await handleAddLocation(); setAddLocationDialogOpen(false); }}
              text="Save"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Document Sidebar */}
      <DocumentSidebar
        document={selectedDocument}
        isOpen={showDocumentSidebar}
        onClose={() => {
          setShowDocumentSidebar(false);
          setSelectedDocument(null);
        }}
        onDelete={() => {
          // Close sidebar and refresh documents
          setShowDocumentSidebar(false);
          setSelectedDocument(null);
          if (id) {
            dispatch(fetchDocumentsByProject(id));
          }
        }}
        onEdit={(document) => {
          // Handle document edit if needed
          console.log('Edit document:', document);
        }}
        onMove={(document) => {
          // Handle document move if needed
          console.log('Move document:', document);
        }}
        onRefresh={() => {
          // Refresh documents
          if (id) {
            dispatch(fetchDocumentsByProject(id));
          }
        }}
      />
    </PageContainer>
  );
};

export default ProjectDetails;
