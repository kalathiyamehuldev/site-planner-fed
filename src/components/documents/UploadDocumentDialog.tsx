import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchTasksByProject,
  selectProjectTasks,
} from '@/redux/slices/tasksSlice';
import {
  createDocument,
  fetchDocumentsByProject,
  replaceDocument,
  uploadDocumentVersion,
  selectDocumentConflict,
  clearConflict,
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
import ConflictResolutionDialog from './ConflictResolutionDialog';

interface ConflictData {
  conflict: boolean;
  existingDocument?: {
    id?: string;
    _id?: string;
    name?: string;
    [key: string]: any;
  } | null;
  message?: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUploaded?: () => void;
  projectId?: string;
  folderId?: string;
  folderName?: string;
  folderProjectId?: string;
  documentId?: string;
  mode?: 'upload' | 'replace' | 'version';
  documentName?: string;
}

interface FormData {
  documentName: string;
  projectId: string;
  taskId: string;
  file: File | null;
  folderId?: string;
  notes?: string;
}

interface FormErrors {
  documentName?: string;
  projectId?: string;
  taskId?: string;
  file?: string;
  notes?: string;
}

export const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({
  open,
  onOpenChange,
  onDocumentUploaded,
  projectId: propProjectId,
  folderId,
  folderName,
  folderProjectId,
  documentId,
  mode = 'upload',
  documentName,
}) => {
  try {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const projectTasks = useAppSelector(selectProjectTasks);
    const project = useAppSelector(selectSelectedProject);
    const projects = useAppSelector(selectAllProjects);
    const documentConflict = useAppSelector(selectDocumentConflict);
    const projectId = propProjectId || folderProjectId || project?.id;

    // Show project selection only if no project is pre-selected AND no folder is selected
    // When a folder is selected, the project ID should come from the folder's project
    const showProjectSelection = !projectId && !folderId;

    const [formData, setFormData] = useState<FormData>({
      documentName: '',
      projectId: projectId || '',
      taskId: 'none',
      file: null,
      folderId: folderId,
      notes: '',
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [conflictDocumentId, setConflictDocumentId] = useState<string | null>(null);
    const [pendingUploadData, setPendingUploadData] = useState<{
      file: File;
      name: string;
      projectId: string;
      taskId?: string;
      folderId?: string;
    } | null>(null);

    // Fetch tasks when dialog opens or project changes
    useEffect(() => {
      const currentProjectId = projectId || formData.projectId;
      if (open && currentProjectId) {
        dispatch(fetchTasksByProject(currentProjectId));
      }
    }, [open, projectId, formData.projectId, dispatch]);

    // Watch for conflicts in Redux state
    useEffect(() => {
      try {
        if (documentConflict && typeof documentConflict === 'object' && 'conflict' in documentConflict && documentConflict.conflict) {
          console.log('Conflict detected in Redux state:', documentConflict);
          const conflictData = documentConflict as ConflictData;
          console.log('Conflict existingDocument:', conflictData.existingDocument);
          console.log('Conflict existingDocument type:', typeof conflictData.existingDocument);
          console.log('Conflict existingDocument keys:', conflictData.existingDocument ? Object.keys(conflictData.existingDocument) : 'none');

          // Set conflict data and show dialog
          let existingDocId = null;
          if (conflictData.existingDocument) {
            if (typeof conflictData.existingDocument === 'object' && conflictData.existingDocument !== null) {
              existingDocId = conflictData.existingDocument.id || conflictData.existingDocument._id || null;
            } else if (typeof conflictData.existingDocument === 'string') {
              existingDocId = conflictData.existingDocument;
            }
          }
          console.log('Setting conflict document ID:', existingDocId);
          setConflictDocumentId(existingDocId);
          
          // Set conflict dialog state but keep upload dialog open
          // This ensures pendingUploadData is preserved for conflict resolution
          setShowConflictDialog(true);
          
          // Don't close upload dialog - keep it open so pendingUploadData is preserved
        }
      } catch (error) {
        console.error('Error in conflict detection useEffect:', error);
      }
    }, [documentConflict, onOpenChange]);

    // Reset form when dialog closes
    useEffect(() => {
      if (!open) {
        setFormData({
          documentName: '',
          projectId: projectId || '',
          taskId: 'none',
          file: null,
          folderId: folderId,
        });
        setFormErrors({});
        // Only clear conflict state if there's no conflict resolution in progress
        // Don't clear if we have both conflictDocumentId and pendingUploadData (conflict resolution active)
        // Don't clear if showConflictDialog is true (conflict dialog is showing)
        const hasActiveConflict = (conflictDocumentId && pendingUploadData) || showConflictDialog;
        
        if (!hasActiveConflict) {
          console.log('Clearing conflict state in reset form useEffect');
          setConflictDocumentId(null);
          setPendingUploadData(null);
          // Clear any existing conflict state
          dispatch(clearConflict());
        } else {
          console.log('NOT clearing conflict state - active conflict detected. showConflictDialog:', showConflictDialog, 'conflictDocumentId:', conflictDocumentId, 'pendingUploadData exists:', !!pendingUploadData);
        }
      }
    }, [open, folderId, projectId, dispatch, showConflictDialog, conflictDocumentId, pendingUploadData]);

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
      if (file && !formData.documentName) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setFormData(prev => ({ ...prev, documentName: fileName }));
      }
    };

    const validateForm = (): boolean => {
      const errors: FormErrors = {};

      if (!formData.documentName.trim()) {
        errors.documentName = 'Name is required';
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
      // Add defensive check to prevent temporal dead zone issues
      if (!file || !name) {
        throw new Error('File and name are required for document creation');
      }
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

      console.log('Creating document with data:', documentData);
      const result = await dispatch(createDocument(documentData));

      console.log('Create document result:', result);

      if (createDocument.fulfilled.match(result)) {
        console.log('Document creation successful:', result.payload);
        // Document was created successfully, return to let calling function handle success
        return;
      } else if (createDocument.rejected.match(result)) {
        console.log('Document creation rejected:', result.payload);
        // Check if this is a conflict rejection
        if (result.payload && typeof result.payload === 'object' && 'conflict' in result.payload) {
          console.log('Conflict detected in rejection:', result.payload);
          const conflictData = result.payload as ConflictData;
          console.log('Conflict existingDocument:', conflictData.existingDocument);
          console.log('Conflict existingDocument type:', typeof conflictData.existingDocument);
          console.log('Conflict existingDocument keys:', conflictData.existingDocument ? Object.keys(conflictData.existingDocument) : 'none');

          // Store the conflict data for the dialog
          let existingDocId = null;
          if (conflictData.existingDocument) {
            if (typeof conflictData.existingDocument === 'object' && conflictData.existingDocument !== null) {
              existingDocId = conflictData.existingDocument.id || conflictData.existingDocument._id || null;
            } else if (typeof conflictData.existingDocument === 'string') {
              existingDocId = conflictData.existingDocument;
            }
          }
          console.log('Setting conflict document ID from rejection:', existingDocId);
          setConflictDocumentId(existingDocId);
          // Note: pendingUploadData is already set in handleSubmit, no need to set it again here
          console.log('Conflict detected, pendingUploadData should already be set in handleSubmit');
          throw new Error('CONFLICT_DETECTED');
        } else {
          // This is a regular error
          throw new Error(result.payload as string || 'Failed to upload document');
        }
      } else {
        console.error('Unexpected result state:', result);
        throw new Error('Unexpected document creation result');
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Handle different modes
      if (mode === 'replace') {
        await handleDirectReplace();
        return;
      }

      if (mode === 'version') {
        await handleDirectVersion();
        return;
      }

      // Default upload mode
      setLoading(true);

      try {
        // Add defensive checks to ensure formData is properly initialized
        if (!formData) {
          throw new Error('Form data is not initialized');
        }

        if (!formData.file) {
          throw new Error('No file selected');
        }

        if (!formData.documentName || !formData.documentName.trim()) {
          throw new Error('Document name is required');
        }

        const selectedProjectId = projectId || formData.projectId;
        if (!selectedProjectId && !folderId) {
          throw new Error('No project or folder selected');
        }

        // Store pending upload data
        const uploadData = {
          file: formData.file,
          name: formData.documentName.trim(),
          projectId: selectedProjectId,
          taskId: formData.taskId === 'none' ? undefined : formData.taskId,
          folderId: formData.folderId || undefined,
        };
        console.log('Setting pendingUploadData in handleSubmit:', uploadData);
        
        // Set pending upload data first, then wait for state update
        setPendingUploadData(uploadData);
        
        // Use a small delay to ensure state is updated before proceeding
        await new Promise(resolve => setTimeout(resolve, 10));

        // Try to create the document first
        await uploadFileAndCreateDocument(
          formData.file,
          formData.documentName.trim(),
          selectedProjectId,
          formData.taskId === 'none' ? undefined : formData.taskId,
          formData.folderId || undefined
        );

        // If we reach here, no conflict occurred
        handleSuccessfulUpload();
      } catch (error: any) {
        // Check if it's a conflict detection error
        if (error.message === 'CONFLICT_DETECTED') {
          // Set conflict dialog state but keep upload dialog open to preserve pendingUploadData
          setShowConflictDialog(true);
          // Don't close upload dialog - this preserves pendingUploadData for conflict resolution
        } else {
          toast({
            title: 'Error',
            description: error.message || 'Failed to upload document',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    const handleSuccessfulUpload = (message = 'Document uploaded successfully') => {
      toast({
        title: 'Success',
        description: message,
      });

      // Clear any previous errors and conflict state
      dispatch(clearConflict());
      setShowConflictDialog(false);
      setConflictDocumentId(null);
      setPendingUploadData(null);

      // Refresh project documents
      const selectedProjectId = projectId || formData.projectId;
      if (selectedProjectId) {
        dispatch(fetchDocumentsByProject(selectedProjectId));
      }

      onDocumentUploaded?.();
      onOpenChange(false);
    };

    const handleDirectReplace = async () => {
      if (!documentId || !formData.file) return;
      
      setLoading(true);
      try {
        const result = await dispatch(replaceDocument({
          id: documentId,
          file: formData.file,
          notes: formData.notes,
        }));

        if (replaceDocument.rejected.match(result)) {
          throw new Error(result.payload as string || 'Failed to replace document');
        }

        handleSuccessfulUpload('Document replaced successfully');
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to replace document',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const handleDirectVersion = async () => {
      if (!documentId || !formData.file) return;
      
      setLoading(true);
      try {
        const result = await dispatch(uploadDocumentVersion({
          id: documentId,
          file: formData.file,
          versionNotes: formData.notes,
        }));

        if (uploadDocumentVersion.rejected.match(result)) {
          throw new Error(result.payload as string || 'Failed to create document version');
        }

        handleSuccessfulUpload('Document version created successfully');
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create document version',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const handleReplaceDocument = async () => {
      console.log('handleReplaceDocument called with:', { 
        pendingUploadData, 
        conflictDocumentId,
        pendingUploadDataFile: pendingUploadData?.file,
        pendingUploadDataFileName: pendingUploadData?.file?.name,
        pendingUploadDataFileSize: pendingUploadData?.file?.size
      });
      
      if (!pendingUploadData) {
        console.error('No pendingUploadData available for replace');
        toast({
          title: 'Error',
          description: 'Upload data is missing. Please try uploading the document again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!conflictDocumentId) {
        console.error('No conflictDocumentId available for replace');
        return;
      }
      
      if (!pendingUploadData.file) {
        console.error('No file in pendingUploadData for replace');
        return;
      }

      setUploading(true);
      try {
        console.log('Dispatching replaceDocument with:', {
          id: conflictDocumentId,
          file: pendingUploadData.file,
          fileName: pendingUploadData.file.name,
          fileSize: pendingUploadData.file.size
        });
        
        const result = await dispatch(replaceDocument({
          id: conflictDocumentId,
          file: pendingUploadData.file,
        }));

        console.log('Replace document result:', result);

        if (replaceDocument.rejected.match(result)) {
          throw new Error(result.payload as string || 'Failed to replace document');
        }

        handleSuccessfulUpload('Document replaced successfully');
        // Clear conflict state after successful replace
        setShowConflictDialog(false);
        setConflictDocumentId(null);
        setPendingUploadData(null);
        dispatch(clearConflict());
      } catch (error: any) {
        console.error('Error in handleReplaceDocument:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to replace document',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    };

    const handleCreateVersion = async () => {
      console.log('handleCreateVersion called with:', { 
        pendingUploadData, 
        conflictDocumentId,
        pendingUploadDataFile: pendingUploadData?.file,
        pendingUploadDataFileName: pendingUploadData?.file?.name,
        pendingUploadDataFileSize: pendingUploadData?.file?.size,
        showConflictDialog,
        open
      });
      
      if (!pendingUploadData) {
        console.error('No pendingUploadData available for create version');
        toast({
          title: 'Error',
          description: 'Upload data is missing. Please try uploading the document again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!conflictDocumentId) {
        console.error('No conflictDocumentId available for create version');
        return;
      }
      
      if (!pendingUploadData.file) {
        console.error('No file in pendingUploadData for create version');
        return;
      }

      setUploading(true);
      try {
        console.log('Dispatching uploadDocumentVersion with:', {
          id: conflictDocumentId,
          file: pendingUploadData.file,
          fileName: pendingUploadData.file.name,
          fileSize: pendingUploadData.file.size
        });
        
        const result = await dispatch(uploadDocumentVersion({
          id: conflictDocumentId,
          file: pendingUploadData.file,
        }));

        console.log('Upload document version result:', result);

        if (uploadDocumentVersion.rejected.match(result)) {
          throw new Error(result.payload as string || 'Failed to create document version');
        }

        handleSuccessfulUpload('Document version created successfully');
        // Clear conflict state after successful version creation
        setShowConflictDialog(false);
        setConflictDocumentId(null);
        setPendingUploadData(null);
        dispatch(clearConflict());
      } catch (error: any) {
        console.error('Error in handleCreateVersion:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create document version',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    };

    const handleConflictCancel = () => {
      console.log('handleConflictCancel called');
      setPendingUploadData(null);
      setConflictDocumentId(null);
      setShowConflictDialog(false);
      // Clear the Redux conflict state
      dispatch(clearConflict());
      // Close upload dialog when conflict is cancelled
      onOpenChange(false);
    };

    try {
      return (
        <>
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {mode === 'replace' ? `Replace Document${documentName ? ` "${documentName}"` : ''}` :
                   mode === 'version' ? `Create New Version${documentName ? ` for "${documentName}"` : ''}` :
                   `Upload Document${folderName ? ` to ${folderName}` : ''}`}
                </DialogTitle>
                <DialogDescription>
                  {mode === 'replace' ? 'Replace the existing document with a new file.' :
                   mode === 'version' ? 'Upload a new version of the existing document.' :
                   folderName
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
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.csv,.xml,.webp,.svg,.zip"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {formErrors.file && (
                    <p className="text-sm text-red-500">{formErrors.file}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentName">Document Name *</Label>
                  <Input
                    id="documentName"
                    value={formData.documentName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, documentName: e.target.value }));
                      clearFieldError('documentName');
                    }}
                    placeholder="Enter document name"
                    className={formErrors.documentName ? 'border-red-500' : ''}
                  />
                  {formErrors.documentName && (
                    <p className="text-sm text-red-500">{formErrors.documentName}</p>
                  )}
                </div>

                {mode === 'upload' && showProjectSelection && (
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

                {mode === 'upload' && (
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
                )}

                {mode === 'version' && (
                  <div className="space-y-2">
                    <Label htmlFor="versionNotes">Version Notes</Label>
                    <Input
                      id="versionNotes"
                      value={formData.notes || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, notes: e.target.value }));
                      }}
                      placeholder="Describe what changed in this version (optional)"
                    />
                  </div>
                )}

                {mode === 'replace' && (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Replacement Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, notes: e.target.value }));
                      }}
                      placeholder="Describe why you're replacing this document (optional)"
                    />
                  </div>
                )}

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
                        : mode === 'replace'
                          ? 'Replace Document'
                          : mode === 'version'
                            ? 'Create Version'
                            : 'Upload Document'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Conflict Resolution Dialog */}
          {showConflictDialog && (
            <ConflictResolutionDialog
              open={showConflictDialog}
              onOpenChange={setShowConflictDialog}
              documentName={pendingUploadData?.name || ''}
              onReplace={handleReplaceDocument}
              onCreateVersion={handleCreateVersion}
              onCancel={handleConflictCancel}
            />
          )}
        </>
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
  }
    catch (error) {
      console.error('UploadDocumentDialog render error:', error);
    }
  }
