import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createTaskAsync, updateTaskAsync, selectTaskLoading, selectTaskError } from '@/redux/slices/tasksSlice';
import {
  ProjectMember,
  selectAllProjects,
  getProjectMembers,
} from "@/redux/slices/projectsSlice";
import { CreateTaskData, UpdateTaskData } from "@/redux/slices/tasksSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  fromProject?: boolean;
  task?: any; // For edit mode
  onSuccess?: () => void;
  projectMembers?: any[];
  membersLoading?: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedHours: string;
  memberId: string;
  projectId: string;
}

interface FormErrors {
  title?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: string;
  memberId?: string;
  projectId?: string;
}

const TASK_STATUSES = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  // { value: "CANCELLED", label: "Cancelled" },
];

const TASK_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  fromProject,
  task,
  onSuccess,
  projectMembers,
  membersLoading,
}) => {
  const isEditMode = !!task;
  const isFromTasksPage = !fromProject;
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const loading = useAppSelector(selectTaskLoading);
  const error = useAppSelector(selectTaskError);
  const projects = useAppSelector(selectAllProjects);

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "",
    priority: "",
    dueDate: "",
    estimatedHours: "",
    memberId: "unassigned",
    projectId: projectId || "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Local state for members when isFromTasksPage
  const [localMembers, setLocalMembers] = useState<any[]>([]);
  const [localMembersLoading, setLocalMembersLoading] = useState(false);
  
  // Use project members from props or local state based on context
  const currentMembers = isFromTasksPage ? localMembers : (projectMembers || []);
  const currentMembersLoading = isFromTasksPage ? localMembersLoading : (membersLoading || false);

  // Projects and project members are now fetched by parent components for better performance

  // Reset form when dialog opens/closes or populate with task data for edit
  useEffect(() => {
    if (open) {
      if (isEditMode && task) {
        setFormData({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "",
          priority: task.priority || "",
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          estimatedHours: task.estimatedHours
            ? task.estimatedHours.toString()
            : "",
          memberId: task.member?.id || "unassigned",
          projectId: task.project?.id || projectId || "",
        });
      } else {
        setFormData({
          title: "",
          description: "",
          status: "",
          priority: "",
          dueDate: "",
          estimatedHours: "",
          memberId: "unassigned",
          projectId: projectId || "",
        });
      }
      setFormErrors({});
    }
  }, [open, isEditMode, task]);

  // Handle form field changes
  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    
    // Fetch members when project is selected from tasks page
    if (field === 'projectId' && value && isFromTasksPage) {
      setLocalMembersLoading(true);
      dispatch(getProjectMembers(value))
        .unwrap()
        .then((response) => {
          setLocalMembers(response.members || []);
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
          setLocalMembersLoading(false);
        });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Task title is required";
    }

    if (isFromTasksPage && !formData.projectId) {
      errors.projectId = "Project selection is required";
    }

    if (!formData.status) {
      errors.status = "Task status is required";
    }

    if (!formData.priority) {
      errors.priority = "Task priority is required";
    }

    if (
      formData.estimatedHours &&
      (isNaN(Number(formData.estimatedHours)) ||
        Number(formData.estimatedHours) < 0)
    ) {
      errors.estimatedHours = "Estimated hours must be a valid positive number";
    }

    if (
      formData.dueDate &&
      new Date(formData.dueDate) < new Date(new Date().toDateString())
    ) {
      errors.dueDate = "Due date cannot be in the past";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode) {
        const updateData: UpdateTaskData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          status: formData.status as
            | "TODO"
            | "IN_PROGRESS"
            | "DONE",
            // | "CANCELLED",
          priority: formData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          dueDate: formData.dueDate || undefined,
          estimatedHours: formData.estimatedHours
            ? Number(formData.estimatedHours)
            : undefined,
          memberId:
            formData.memberId && formData.memberId !== "unassigned"
              ? formData.memberId
              : undefined,
        };

        const result = await dispatch(
          updateTaskAsync({ id: task.id, taskData: updateData })
        );
        if (updateTaskAsync.fulfilled.match(result)) {
          toast({
            title: "Success",
            description: "Task updated successfully",
          });
          if (onSuccess) {
            onSuccess();
          } else {
            onOpenChange(false);
          }
        }
      } else {
        const taskData: CreateTaskData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          status: formData.status as
            | "TODO"
            | "IN_PROGRESS"
            | "DONE",
            // | "CANCELLED",
          priority: formData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          dueDate: formData.dueDate || undefined,
          estimatedHours: formData.estimatedHours
            ? Number(formData.estimatedHours)
            : undefined,
          memberId:
            formData.memberId && formData.memberId !== "unassigned"
              ? formData.memberId
              : undefined,
          projectId: formData.projectId || projectId,
        };

        const result = await dispatch(createTaskAsync(taskData));
        if (createTaskAsync.fulfilled.match(result)) {
          toast({
            title: "Success",
            description: "Task created successfully",
          });
          if (onSuccess) {
            onSuccess();
          } else {
            onOpenChange(false);
          }
        }
      }
    } catch (error) {
      // Error handling is done in Redux and will show via error state
    }
  };

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-5/6 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the task details below."
              : "Add a new task to the project. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Title */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>

            {/* Project Selection - Only show when creating from /tasks page */}
            {isFromTasksPage && (
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    handleInputChange("projectId", value)
                  }
                >
                  <SelectTrigger
                    className={formErrors.projectId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.projectId && (
                  <p className="text-sm text-red-500">{formErrors.projectId}</p>
                )}
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger
                  className={formErrors.status ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select task status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-sm text-red-500">{formErrors.status}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger
                  className={formErrors.priority ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select task priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.priority && (
                <p className="text-sm text-red-500">{formErrors.priority}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className={formErrors.dueDate ? "border-red-500" : ""}
              />
              {formErrors.dueDate && (
                <p className="text-sm text-red-500">{formErrors.dueDate}</p>
              )}
            </div>

            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) =>
                  handleInputChange("estimatedHours", e.target.value)
                }
                placeholder="Enter estimated hours"
                min="0"
                step="0.5"
                className={formErrors.estimatedHours ? "border-red-500" : ""}
              />
              {formErrors.estimatedHours && (
                <p className="text-sm text-red-500">
                  {formErrors.estimatedHours}
                </p>
              )}
            </div>

            {/* Assigned Member */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="memberId">Assign to Member</Label>
              <Select
                value={formData.memberId}
                onValueChange={(value) => handleInputChange("memberId", value)}
                disabled={currentMembersLoading}
              >
                <SelectTrigger
                  className={formErrors.memberId ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      currentMembersLoading
                        ? "Loading members..."
                        : "Select a team member"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {currentMembers.map((member) => (
                    <SelectItem key={member.user.id} value={member.user.id}>
                      {member.user.firstName} {member.user.lastName} (
                      {member.user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.memberId && (
                <p className="text-sm text-red-500">{formErrors.memberId}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter task description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || membersLoading}>
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Task"
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;