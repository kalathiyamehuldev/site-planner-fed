import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createTaskAsync, updateTaskAsync, selectTaskLoading, selectTaskError } from '@/redux/slices/tasksSlice';
import {
  ProjectMember,
  selectAllProjects,
  getProjectMembers,
} from "@/redux/slices/projectsSlice";
import { CreateTaskData, UpdateTaskData } from "@/redux/slices/tasksSlice";
import { ActionButton } from "@/components/ui/ActionButton";
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
import * as yup from 'yup';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  fromProject?: boolean;
  task?: any; // For edit mode
  onSuccess?: () => void;
  projectMembers?: any[];
  membersLoading?: boolean;
  // New props to support preselected and locked status
  initialStatus?: "TODO" | "IN_PROGRESS" | "DONE";
  lockStatus?: boolean;
  parentId?: string; // Added for subtask creation
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

// Yup validation schema
const taskValidationSchema = yup.object().shape({
  title: yup.string().required('Task title is required').min(3, 'Task title must be at least 3 characters'),
  description: yup.string().optional(),
  status: yup.string().required('Task status is required'),
  priority: yup.string().required('Task priority is required'),
  dueDate: yup.date().optional().min(new Date(), 'Due date cannot be in the past'),
  estimatedHours: yup.number().optional().min(0, 'Estimated hours must be a positive number'),
  memberId: yup.string().optional(),
  projectId: yup.string().when('isFromTasksPage', {
    is: true,
    then: (schema) => schema.required('Project selection is required'),
    otherwise: (schema) => schema.optional()
  })
});

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
  initialStatus,
  lockStatus,
  parentId,
}) => {
  const isEditMode = !!task;
  const isFromTasksPage = !fromProject;
  const dispatch = useAppDispatch();
  // Removed useToast usage; toasts handled in Redux slices
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
  
  // Local state for members when fetching inside this component
  const [localMembers, setLocalMembers] = useState<any[]>([]);
  const [localMembersLoading, setLocalMembersLoading] = useState(false);
  
  // Prefer members passed from parent; fall back to locally fetched ones
  const currentMembers = (projectMembers && projectMembers.length > 0) ? projectMembers : localMembers;
  const currentMembersLoading = (typeof membersLoading === 'boolean') ? membersLoading : localMembersLoading;

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
          status: initialStatus || "",
          priority: "",
          dueDate: "",
          estimatedHours: "",
          memberId: "unassigned",
          projectId: projectId || "",
        });
      }
      setFormErrors({});
    }
  }, [open, isEditMode, task, initialStatus, projectId]);

  // When opened from Project page and parent didn't provide members, fetch them
  // Fetch members on open whenever we have a projectId and none were provided by parent
  useEffect(() => {
    if (!open) return;
    const pid = formData.projectId || projectId || task?.project?.id;
    if (!pid) return;
    if (projectMembers && projectMembers.length > 0) return; // already provided by parent

    setLocalMembersLoading(true);
    dispatch(getProjectMembers(pid))
      .unwrap()
      .then((response) => {
        setLocalMembers(response.members || []);
      })
      .catch((error) => {
        console.error('Failed to fetch project members:', error);
      })
      .finally(() => {
        setLocalMembersLoading(false);
      });
  }, [open, formData.projectId, projectId, task, projectMembers, dispatch]);

  // Handle form field changes
  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (field === 'projectId' && value && isFromTasksPage) {
      setLocalMembersLoading(true);
      dispatch(getProjectMembers(value))
        .unwrap()
        .then((response) => {
          setLocalMembers(response.members || []);
        })
        .catch((error) => {
          console.error('Failed to fetch project members:', error);
        })
        .finally(() => {
          setLocalMembersLoading(false);
        });
    }
  };

  // Validate form using Yup
  const validateForm = async (): Promise<boolean> => {
    try {
      await taskValidationSchema.validate({
        ...formData,
        isFromTasksPage,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
      }, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path as keyof FormErrors] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
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
          parentId: parentId, // pass parent id if provided
        };

        const result = await dispatch(createTaskAsync(taskData));
        if (createTaskAsync.fulfilled.match(result)) {
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

  // Show error toast when error changes (centralized in slices)
  useEffect(() => {
    // No component-level toast; rely on slice toasts
  }, [error]);

  // Helper to get status label
  const getStatusLabel = (value: string) => TASK_STATUSES.find(s => s.value === value)?.label || value;

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
              <Label htmlFor="title">Task Title <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="projectId">Project <span className="text-red-500">*</span></Label>
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
            {lockStatus ? (
              <div className="space-y-2">
                <Label>Status <span className="text-red-500">*</span></Label>
                <Input value={getStatusLabel(formData.status)} disabled />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
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
            )}

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
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
            <ActionButton
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              text='Cancel'
            >
            </ActionButton>
            <ActionButton type="submit" disabled={loading}
            text={loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Task"}>
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;