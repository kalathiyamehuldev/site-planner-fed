import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Document, fetchDocumentDetails, updateDocument, deleteDocument, downloadDocument, fetchFilePreview, selectFilePreview, selectPreviewLoading } from '@/redux/slices/documentsSlice';
import { getProjectMembers, ProjectMember } from '@/redux/slices/projectsSlice';
import { fetchTasksByProject, selectProjectTasks } from '@/redux/slices/tasksSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Send,
  Image as ImageIcon,
  FileText,
  Download,
  User,
  Calendar,
  Building,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import DeleteDocumentModal from '@/components/DeleteDocumentModal';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  taggedUsers: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  createdAt: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface DocumentPreviewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onCopy?: (document: Document) => void;
  onRefresh?: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const projectTasks = useAppSelector(selectProjectTasks);
  const documentsState = useAppSelector(state => state.documents);
  const filePreview = useAppSelector(selectFilePreview);
  const previewLoading = useAppSelector(selectPreviewLoading);
  
  // State management
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [description, setDescription] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [documentDetails, setDocumentDetails] = useState<any>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock comments data - replace with actual API calls
  const mockComments: Comment[] = [
    {
      id: '1',
      content: 'This document looks great! @John Doe please review the specifications.',
      author: {
        id: '1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      },
      taggedUsers: [
        {
          id: '2',
          firstName: 'John',
          lastName: 'Doe',
        },
      ],
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      content: 'Thanks for the review! I\'ve made the requested changes.',
      author: {
        id: '2',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      taggedUsers: [],
      createdAt: '2024-01-15T14:20:00Z',
      attachments: [
        {
          id: '1',
          name: 'updated-specs.pdf',
          url: '/files/updated-specs.pdf',
          type: 'pdf',
        },
      ],
    },
  ];

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen && document && document.id) {
      setDescription(document.description || '');
      setDocumentName(document.name || '');
      setSelectedTaskId(document.taskId || '');
      setComments(mockComments);
      
      // Only fetch document details if document exists
      if (document.id) {
        fetchDocumentDetailsData(document.id);
      }
      
      // Fetch project members if document has a project
      if (document.projectId) {
        fetchProjectMembers(document.projectId);
        dispatch(fetchTasksByProject(document.projectId));
      }
    }
  }, [isOpen, document, dispatch]);

  const fetchDocumentDetailsData = async (documentId: string) => {
    setIsLoadingDocument(true);
    try {
      const result = await dispatch(fetchDocumentDetails(documentId));
      if (fetchDocumentDetails.fulfilled.match(result)) {
        // The payload is the direct response from the API (response.data)
        const responseData = result.payload;
        console.log('Document details response:', responseData);
        
        // Extract the actual document data from the API response
        const documentData = responseData.data || responseData;
        setDocumentDetails(documentData);
        setDescription(documentData.description || '');
        
        // Update selectedTaskId if document has a task
        if (documentData.taskId) {
          setSelectedTaskId(documentData.taskId);
        }
        
        // Fetch project tasks if document has project info but original document doesn't have projectId
        if (documentData.project?.id && !document?.projectId) {
          dispatch(fetchTasksByProject(documentData.project.id));
        }
        // Fetch file preview if document has a fileId
        if (document?.fileId) {
          dispatch(fetchFilePreview(document.fileId));
        } else if (documentData.files[0]?.id) {
          console.log("doc-file-prev",documentData.files[0]);
          
          dispatch(fetchFilePreview(documentData.files[0]?.id));
        }
      } else {
        // Handle rejected case
        console.error('Failed to fetch document details:', result.payload);
        toast({
          title: 'Error',
          description: result.payload as string || 'Failed to load document details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch document details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document details',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const fetchProjectMembers = async (projectId: string) => {
    setIsLoadingMembers(true);
    try {
      const result = await dispatch(getProjectMembers(projectId));
      if (getProjectMembers.fulfilled.match(result)) {
        setProjectMembers(result.payload.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!document) return;
    
    setIsUpdating(true);
    try {
      await dispatch(updateDocument({
        id: document.id,
        documentData: { description: description }
      })).unwrap();
      
      setIsEditingDescription(false);
      toast({
        title: 'Success',
        description: 'Description updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update description',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!document) return;
    
    setIsUpdating(true);
    try {
      const updateData: any = {};
      
      if (documentName.trim() !== document.name) {
        updateData.name = documentName.trim();
      }
      
      if (selectedTaskId !== document.taskId) {
        updateData.taskId = selectedTaskId || undefined;
      }
      
      if (Object.keys(updateData).length > 0) {
        await dispatch(updateDocument({
          id: document.id,
          documentData: updateData
        })).unwrap();
      }
      
      setIsEditMode(false);
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setDocumentName(document?.name || '');
    setSelectedTaskId(document?.taskId || '');
  };

  const handleDeleteDocument = async () => {
    if (!document) return;
    
    setIsUpdating(true);
    try {
      await dispatch(deleteDocument(document.id)).unwrap();
      
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      setShowDeleteModal(false);
      
      // Notify parent component about deletion first
      if (onDelete) {
        onDelete(document.id);
      }
      
      // Close modal first
      handleClose();
      
      // Trigger refresh after a small delay to ensure state is updated
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!document?.id) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(downloadDocument(document.id));
      
      if (downloadDocument.fulfilled.match(result)) {
        toast({
          title: 'Success',
          description: 'Document downloaded successfully',
        });
      } else {
        throw new Error(result.payload as string || 'Download failed');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedUser) {
      toast({
        title: 'Error',
        description: 'Please enter a comment and select a user to tag',
        variant: 'destructive',
      });
      return;
    }

    const selectedMember = projectMembers.find(member => member.user.id === selectedUser);
    if (!selectedMember) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        id: 'current-user',
        firstName: 'Current',
        lastName: 'User',
        email: 'current@example.com',
      },
      taggedUsers: [
        {
          id: selectedMember.user.id,
          firstName: selectedMember.user.firstName,
          lastName: selectedMember.user.lastName,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setSelectedUser('');
    
    toast({
      title: 'Success',
      description: 'Comment added successfully',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getFilePreview = () => {
    // Show loading state while fetching preview
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading preview...</p>
          </div>
        </div>
      );
    }

    // Use preview URL from API if available
    if (filePreview?.previewUrl) {
      const fileType = filePreview.fileType?.toLowerCase() || document?.type?.toLowerCase() || '';
      
      // Handle different file types with preview URL
      if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif') || fileType.includes('svg')) {
        return (
          <div className="relative">
            <img
              src={filePreview.previewUrl}
              alt={filePreview.fileName || document?.name}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                {getFileIcon(fileType)}
                <p className="mt-2 text-sm text-gray-600">{filePreview.fileName}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleDownloadDocument}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        );
      }
      
      // For PDF and other document types, show in iframe
      if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) {
        return (
          <div className="relative">
            <iframe
              src={filePreview.previewUrl}
              className="w-full h-96 rounded-lg border"
              title={filePreview.fileName || document?.name}
              onError={() => {
                // Fallback if iframe fails to load
                console.log('Iframe failed to load, showing fallback');
              }}
            />
            <div className="mt-2 text-center">
              <Button variant="outline" size="sm" onClick={handleDownloadDocument}>
                <Download className="h-4 w-4 mr-2" />
                Download {filePreview.fileName}
              </Button>
            </div>
          </div>
        );
      }
      
      // For all other file types, show preview link with download option
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            {getFileIcon(fileType)}
            <p className="mt-2 text-sm text-gray-600">{filePreview.fileName}</p>
            <p className="text-xs text-gray-400 mb-3">
              {filePreview.fileType} • {Math.round(filePreview.fileSize / 1024)} KB • v{filePreview.version}
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => window.open(filePreview.previewUrl, '_blank')}>
                <FileText className="h-4 w-4 mr-2" />
                Open Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadDocument}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Fallback to original document URL if no preview available
    if (document?.url) {
      const fileType = document.type?.toLowerCase() || '';
      
      if (fileType.includes('image')) {
        return (
          <div className="relative">
            <img
              src={document.url}
              alt={document.name}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
            />
          </div>
        );
      }
    }

    // Default fallback when no preview is available
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No preview available</p>
          {document && (
            <Button variant="outline" size="sm" className="mt-2" onClick={handleDownloadDocument}>
              <Download className="h-4 w-4 mr-2" />
              Download {document.name}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleClose = () => {
    onClose();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(document.type)}
            <div>
              {isEditMode ? (
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="text-xl font-semibold"
                  disabled={isUpdating}
                />
              ) : (
                <DialogTitle className="text-xl font-semibold">
                  {document.name}
                </DialogTitle>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Uploaded by {documentDetails?.files?.[0]?.uploadedUser ? 
                    `${documentDetails.files[0].uploadedUser.firstName} ${documentDetails.files[0].uploadedUser.lastName}` : 
                    (document.user || 'Unknown')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>Project: {documentDetails?.project?.name || document.project || 'No project'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <>
                <Button size="sm" onClick={handleSaveAll} disabled={isUpdating}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadDocument}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                     onClick={() => setShowDeleteModal(true)}
                     className="text-red-600"
                     disabled={isUpdating}
                   >
                     <Trash2 className="h-4 w-4 mr-2" />
                     Delete
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        <div className="flex gap-6 overflow-hidden">
          {/* Left side - File Preview */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Document Details */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">File Size:</span>
                    <p>{documentDetails?.files?.[0]?.fileSize ? 
                      `${(documentDetails.files[0].fileSize / 1024).toFixed(2)} KB` : 
                      (document.size || 'Unknown')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Date Created:</span>
                    <p>{documentDetails?.createdAt ? 
                      format(new Date(documentDetails.createdAt), 'MMM dd, yyyy HH:mm') : 
                      (document.date || 'Unknown')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">File Type:</span>
                    <p>{documentDetails?.files?.[0]?.fileType || document.type || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Version:</span>
                    <p>v{documentDetails?.files?.[0]?.version || document.version || '1'}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-500">Task:</span>
                      {isEditMode ? (
                        <Select value={selectedTaskId || 'no-task'} onValueChange={(value) => setSelectedTaskId(value === 'no-task' ? '' : value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="No task assigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-task">No task assigned</SelectItem>
                            {projectTasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p>{documentDetails?.task?.title || 'No task assigned'}</p>
                      )}
                    </div>
                  </div>
                  {documentDetails?.folder && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-500">Folder:</span>
                      <p>{documentDetails.folder.path}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Description</h3>
                  {!isEditingDescription && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="min-h-[100px]"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSaveDescription}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingDescription(false);
                          setDescription(documentDetails?.description || document.description || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700">
                    {description || documentDetails?.description || 'No description available'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* File Preview */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Preview</h3>
                {getFilePreview()}
              </CardContent>
            </Card>
          </div>

          {/* Right side - Project Info & Comments */}
          <div className="w-96 flex flex-col space-y-4">
            {/* Project Information */}
            {(document?.projectId || documentDetails?.project) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Project Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Project Name:</span>
                      <p className="text-gray-700">
                        {documentDetails?.project?.name || document?.project || 'Unknown Project'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Comments */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col">
                {/* Comments Header */}
                <div 
                  className="flex items-center justify-between mb-4 cursor-pointer"
                  onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
                >
                  <h3 className="font-medium">Comments ({comments.length})</h3>
                  {isCommentsCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </div>

                {!isCommentsCollapsed && (
                  <>
                    {/* Add Comment */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Tag User (Required)
                        </label>
                        <Select value={selectedUser || 'no-user'} onValueChange={(value) => setSelectedUser(value === 'no-user' ? '' : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user to tag" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-user">Select user to tag</SelectItem>
                            {projectMembers.map((member) => (
                              <SelectItem key={member.user.id} value={member.user.id}>
                                {member.user.firstName} {member.user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="min-h-[80px]"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" disabled>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Image
                          </Button>
                        </div>
                        <Button size="sm" onClick={handleAddComment}>
                          <Send className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(comment.author.firstName, comment.author.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">
                                  {comment.author.firstName} {comment.author.lastName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 break-words">
                                {comment.content}
                              </p>
                              
                              {/* Tagged Users */}
                              {comment.taggedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {comment.taggedUsers.map((user) => (
                                    <Badge key={user.id} variant="secondary" className="text-xs">
                                      @{user.firstName} {user.lastName}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {/* Attachments */}
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {comment.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center space-x-2 text-xs text-blue-600">
                                      <FileText className="h-3 w-3" />
                                      <span>{attachment.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
      
      <DeleteDocumentModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        document={document}
        onConfirm={handleDeleteDocument}
        loading={isUpdating}
      />
    </Dialog>
  );
};

export default DocumentPreviewModal;