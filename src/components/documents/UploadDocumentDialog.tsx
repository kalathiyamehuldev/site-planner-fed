import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchTasksByProject,
  selectProjectTasks,
} from '@/redux/slices/tasksSlice';
import {
  createDocument,
  fetchDocumentsByProject,
} from '@/redux/slices/documentsSlice';
import {
  selectSelectedProject,
  selectAllProjects,
} from '@/redux/slices/projectsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUploaded?: () => void;
  projectId?: string;
  folderId?: string;
  folderName?: string;
  folderProjectId?: string;
}

interface FormData {
  name: string;
  projectId: string;
  taskId: string;
  file: File | null;
  folderId?: string;
}

interface FormErrors {
  name?: string;
  projectId?: string;
  taskId?: string;
  file?: string;
}

const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({
  open,
  onOpenChange,
  onDocumentUploaded,
  projectId: propProjectId,
  folderId,
  folderName,
  folderProjectId,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const projectTasks = useAppSelector(selectProjectTasks);
  const project = useAppSelector(selectSelectedProject);
  const projects = useAppSelector(selectAllProjects);
  const projectId = propProjectId || folderProjectId || project?.id;
  
  // Show project selection only if no project is pre-selected AND no folder is selected
  // When a folder is selected, the project ID should come from the folder's project
  const showProjectSelection = !projectId && !folderId;
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    projectId: projectId || '',
    taskId: 'none',
    file: null,
    folderId: folderId,
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch tasks when dialog opens or project changes
  useEffect(() => {
    const currentProjectId = projectId || formData.projectId;
    if (open && currentProjectId) {
      dispatch(fetchTasksByProject(currentProjectId));
    }
  }, [open, projectId, formData.projectId, dispatch]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        projectId: projectId || '',
        taskId: 'none',
        file: null,
        folderId: folderId,
      });
      setFormErrors({});
    }
  }, [open, folderId, projectId]);

  const clearFieldError = (field: keyof FormData) => {
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
    clearFieldError('file');
    
    // Auto-fill name from filename if name is empty
    if (file && !formData.name) {
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setFormData(prev => ({ ...prev, name: fileName }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (showProjectSelection && !formData.projectId) {
      errors.projectId = 'Please select a project';
    }

    if (!formData.file) {
      errors.file = 'Please select a file to upload';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFileAndCreateDocument = async (file: File, name: string, selectedProjectId: string, taskId?: string, folderId?: string): Promise<void> => {
    // For folder uploads, projectId is optional and will be taken from the folder
    // For regular uploads, projectId is required
    if (!folderId && !selectedProjectId) {
      throw new Error('No project or folder selected');
    }

    const documentData = {
      name,
      projectId: selectedProjectId || undefined, // Make projectId optional
      taskId: taskId === 'none' ? undefined : taskId,
      folderId: folderId || undefined,
      file,
    };
    
    const result = await dispatch(createDocument(documentData));
    
    if (createDocument.rejected.match(result)) {
      throw new Error(result.payload as string || 'Failed to upload document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUploading(true);
    
    try {
      if (formData.file) {
        const selectedProjectId = projectId || formData.projectId;
        await uploadFileAndCreateDocument(
          formData.file,
          formData.name.trim(),
          selectedProjectId,
          formData.taskId || undefined,
          formData.folderId || undefined
        );
      }
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      
      // Refresh project documents
      const selectedProjectId = projectId || formData.projectId;
      if (selectedProjectId) {
        dispatch(fetchDocumentsByProject(selectedProjectId));
      }
      
      onDocumentUploaded?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  try {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document{folderName ? ` to ${folderName}` : ''}</DialogTitle>
            <DialogDescription>
              {folderName 
                ? `Upload a document to the "${folderName}" folder and optionally associate it with a task.`
                : 'Upload a document and associate it with a task.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className={formErrors.file ? 'border-red-500' : ''}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {formErrors.file && (
                <p className="text-sm text-red-500">{formErrors.file}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  clearFieldError('name');
                }}
                placeholder="Enter document name"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {showProjectSelection && (
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select value={formData.projectId} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, projectId: value, taskId: 'none' }));
                  clearFieldError('projectId');
                }}>
                  <SelectTrigger className={formErrors.projectId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
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

            <div className="space-y-2">
              <Label htmlFor="taskId">Associated Task</Label>
              <Select value={formData.taskId} onValueChange={(value) => {
                setFormData(prev => ({ ...prev, taskId: value }));
                clearFieldError('taskId');
              }}>
                <SelectTrigger className={formErrors.taskId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task selected</SelectItem>
                  {projectTasks?.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button type="submit" disabled={loading}>
                {uploading
                  ? 'Uploading...'
                  : loading
                  ? 'Saving...'
                  : 'Upload Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    console.error('UploadDocumentDialog render error:', error);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              An error occurred while loading the upload dialog. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
};

export default UploadDocumentDialog;