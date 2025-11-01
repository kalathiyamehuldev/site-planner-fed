import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Document, fetchDocumentDetails, updateDocument, deleteDocument, downloadDocument, fetchFilePreview, selectFilePreview, selectPreviewLoading } from '@/redux/slices/documentsSlice';
import { getProjectMembers, ProjectMember } from '@/redux/slices/projectsSlice';
import { fetchParentTasksByProject, selectParentProjectTasks } from '@/redux/slices/tasksSlice';
import usePermission from '@/hooks/usePermission';
import { 
  fetchDocumentComments, 
  createComment, 
  updateComment as updateCommentAction, 
  deleteComment as deleteCommentAction,
  fetchProjectMembers as fetchCommentProjectMembers,
  selectAllComments,
  selectCommentsLoading,
  selectCommentsError,
  selectProjectMembers as selectCommentProjectMembers,
  selectMembersLoading,
  clearComments,
  Comment as CommentType
} from '@/redux/slices/commentsSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import ActionButton from '@/components/ui/ActionButton';
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
  Reply,
  AtSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import DeleteDocumentModal from '@/components/documents/DeleteDocumentModal';

// Using Comment type from commentsSlice
type Comment = CommentType;

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
  const projectTasks = useAppSelector(selectParentProjectTasks);
  const documentsState = useAppSelector(state => state.documents);
  const filePreview = useAppSelector(selectFilePreview);
  const previewLoading = useAppSelector(selectPreviewLoading);
  
  // Comments selectors
  const comments = useAppSelector(selectAllComments);
  const commentsLoading = useAppSelector(selectCommentsLoading);
  const commentsError = useAppSelector(selectCommentsError);
  const commentProjectMembers = useAppSelector(selectCommentProjectMembers);
  const membersLoading = useAppSelector(selectMembersLoading);
  
  console.log('DocumentPreviewModal - commentProjectMembers:', commentProjectMembers);
  console.log('DocumentPreviewModal - membersLoading:', membersLoading);
  console.log('DocumentPreviewModal - document object:', document);
  
  // State management
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [description, setDescription] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<Array<{id: string, name: string}>>([]);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);

  const [isAddingComment, setIsAddingComment] = useState(false);
  const [documentDetails, setDocumentDetails] = useState<any>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMentionedUser, setReplyMentionedUser] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [currentTextarea, setCurrentTextarea] = useState<'new' | 'edit' | 'reply' | null>(null);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());
  // Permission check
  const { hasPermission } = usePermission();
  const resource = 'documents';
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments when document changes
  const fetchCommentsForDocument = async (documentId: string) => {
    try {
      await dispatch(fetchDocumentComments({ documentId }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    }
  };



  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen && document && document.id) {
      console.log('DocumentPreviewModal useEffect - document has projectId:', document.projectId);
      setDescription(document.description || '');
      setDocumentName(document.name || '');
      setSelectedTaskId(document.taskId || '');
      
      // Clear previous comments
      dispatch(clearComments());
      
      // Fetch comments for this document
      fetchCommentsForDocument(document.id);
      
      // Only fetch document details if document exists
      if (document.id) {
        fetchDocumentDetailsData(document.id);
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
          dispatch(fetchParentTasksByProject(documentData.project.id));
          dispatch(fetchCommentProjectMembers(documentData.project.id));
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

  const handleCancelDocumentEdit = () => {
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !document) return;
    
    setIsAddingComment(true);
    try {
      const mentionedUserIds = mentionedUsers.map(user => user.id);
      
      await dispatch(createComment({
        content: newComment,
        commentType: 'GENERAL',
        documentId: document.id,
        mentionedUserIds
      }));
      
      // Refresh comments after creating new comment
      await dispatch(fetchDocumentComments({ documentId: document.id }));
      
      setNewComment('');
      setMentionedUsers([]);
      
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string, newContent: string) => {
    if (!document) return;
    
    try {
      await dispatch(updateCommentAction({
        id: commentId,
        commentData: { content: newContent }
      }));
      
      // Refresh comments after updating comment
      await dispatch(fetchDocumentComments({ documentId: document.id }));
      
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
      });
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!document) return;
    
    setIsDeletingComment(commentId);
    try {
      await dispatch(deleteCommentAction(commentId));
      
      // Refresh comments after deleting comment
      await dispatch(fetchDocumentComments({ documentId: document.id }));
      
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingComment(null);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim() || !document) return;
    
    setIsUpdatingComment(true);
    try {
      await dispatch(updateCommentAction({
        id: commentId,
        commentData: { content: editingContent.trim() }
      }));
      
      // Refresh comments after editing comment
      await dispatch(fetchDocumentComments({ documentId: document.id }));
      
      setEditingCommentId(null);
      setEditingContent('');
      
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
      });
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleStartReply = (commentId: string) => {
    setReplyingToCommentId(commentId);
    setReplyContent('');
    setReplyMentionedUser('');
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent('');
    setReplyMentionedUser('');
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !document) return;
    
    setIsSubmittingReply(true);
    try {
      const mentionedUserIds = replyMentionedUser ? [replyMentionedUser] : [];
      
      await dispatch(createComment({
        content: replyContent.trim(),
        commentType: 'GENERAL',
        documentId: document.id,
        parentId,
        mentionedUserIds
      }));
      
      // Refresh comments after reply
      await dispatch(fetchDocumentComments({ documentId: document.id }));
      
      setReplyingToCommentId(null);
      setReplyContent('');
      setReplyMentionedUser('');
      
      toast({
        title: 'Success',
        description: 'Reply added successfully',
      });
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reply',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Helper function to extract mentioned users from text
  const extractMentionedUsers = (text: string) => {
    const mentionRegex = /@([^\s]+\s+[^\s]+)/g;
    const mentions: Array<{id: string, name: string}> = [];
    const seenUserIds = new Set<string>();
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[1];
      const user = commentProjectMembers.find(member => 
        `${member.firstName} ${member.lastName}` === mentionName
      );
      
      if (user && !seenUserIds.has(user.id)) {
        mentions.push({ id: user.id, name: mentionName });
        seenUserIds.add(user.id);
      }
    }
    
    return mentions;
  };

  // Helper functions for mention functionality
  const handleTextareaChange = (value: string, type: 'new' | 'edit' | 'reply') => {
    const lastAtIndex = value.lastIndexOf('@');
    const lastSpaceIndex = value.lastIndexOf(' ');
    
    if (lastAtIndex > lastSpaceIndex && lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1);
      setMentionQuery(query);
      setShowMentionDropdown(true);
      setCurrentTextarea(type);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
      setCurrentTextarea(null);
    }
    
    // Update the appropriate state
    if (type === 'new') {
      setNewComment(value);
      // Extract mentioned users for new comments
      const extractedUsers = extractMentionedUsers(value);
      setMentionedUsers(extractedUsers);
    } else if (type === 'edit') {
      setEditingContent(value);
    } else if (type === 'reply') {
      setReplyContent(value);
    }
  };

  const handleMentionSelect = (member: any) => {
    const mentionText = `@${member.firstName} ${member.lastName}`;
    
    if (currentTextarea === 'new') {
      const lastAtIndex = newComment.lastIndexOf('@');
      const newValue = newComment.substring(0, lastAtIndex) + mentionText + ' ';
      setNewComment(newValue);
      // Extract mentioned users from the updated text
      const extractedUsers = extractMentionedUsers(newValue);
      setMentionedUsers(extractedUsers);
    } else if (currentTextarea === 'edit') {
      const lastAtIndex = editingContent.lastIndexOf('@');
      const newValue = editingContent.substring(0, lastAtIndex) + mentionText + ' ';
      setEditingContent(newValue);
    } else if (currentTextarea === 'reply') {
      const lastAtIndex = replyContent.lastIndexOf('@');
      const newValue = replyContent.substring(0, lastAtIndex) + mentionText + ' ';
      setReplyContent(newValue);
      setReplyMentionedUser(member.id);
    }
    
    setShowMentionDropdown(false);
    setMentionQuery('');
    setCurrentTextarea(null);
  };

  const filteredMembers = commentProjectMembers.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const toggleReplyCollapse = (commentId: string) => {
    const newCollapsed = new Set(collapsedReplies);
    if (newCollapsed.has(commentId)) {
      newCollapsed.delete(commentId);
    } else {
      newCollapsed.add(commentId);
    }
    setCollapsedReplies(newCollapsed);
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
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToCommentId === comment.id;
    const maxDepth = 3; // Limit nesting depth
    
    return (
      <div key={comment.id} className={`space-y-2 ${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(comment.fromUser.firstName, comment.fromUser.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">
                {comment.fromUser.firstName} {comment.fromUser.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
              </span>
              {depth > 0 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  Reply
                </Badge>
              )}
            </div>
            
            {/* Comment Content */}
            {isEditing ? (
              <div className="space-y-2 relative">
                <Textarea
                  value={editingContent}
                  onChange={(e) => handleTextareaChange(e.target.value, 'edit')}
                  className="min-h-[60px] text-sm"
                  placeholder="Edit your comment... (use @ to mention)"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={isUpdatingComment || !editingContent.trim()}
                  >
                    {isUpdatingComment ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdatingComment}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 break-words">
                {comment.content}
              </p>
            )}
            
            {/* Mentioned Users */}
            {comment.mentionedUsers && comment.mentionedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comment.mentionedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="text-xs">
                    @{user.firstName} {user.lastName}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            {!isEditing && (
              <div className="flex items-center space-x-2 mt-2">
                {depth < maxDepth && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => handleStartReply(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => handleStartEdit(comment)}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 focus:text-red-600"
                      disabled={isDeletingComment === comment.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeletingComment === comment.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* Reply Form */}
            {isReplying && (
              <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg relative">
                <Textarea
                  value={replyContent}
                  onChange={(e) => handleTextareaChange(e.target.value, 'reply')}
                  placeholder="Write a reply... (use @ to mention)"
                  className="min-h-[60px] text-sm"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmittingReply || !replyContent.trim()}
                  >
                    {isSubmittingReply ? 'Replying...' : 'Reply'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelReply}
                    disabled={isSubmittingReply}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render nested replies */}
        {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
          <div className="mt-2">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => toggleReplyCollapse(comment.id)}
              >
                {collapsedReplies.has(comment.id) ? (
                  <><ChevronDown className="h-3 w-3 mr-1" />Show {comment.replies.length} replies</>
                ) : (
                  <><ChevronUp className="h-3 w-3 mr-1" />Hide replies</>
                )}
              </Button>
            </div>
            {!collapsedReplies.has(comment.id) && (
              <div>
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        )}

      </div>
    );
  };

  const handleClose = () => {
    onClose();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!document) return null;

  // Use media query for responsive design
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-6xl'} h-[90vh] flex flex-col text-sm`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center space-x-3">
            {getFileIcon(document.type)}
            <div>
              {isEditMode ? (
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="text-lg font-semibold"
                  disabled={isUpdating}
                />
              ) : (
                <DialogTitle className="text-lg font-semibold">
                  {document.name}
                </DialogTitle>
              )}
              <DialogDescription className="sr-only">
                Document preview and details
              </DialogDescription>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
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
                {hasPermission(resource,'update') && (
                  <ActionButton 
                    variant="primary" 
                    onClick={handleSaveAll} 
                    disabled={isUpdating}
                    text="Save"
                  />
                )}
                <ActionButton
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  text="Cancel"
                />
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPermission(resource, 'update') && (
                    <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDownloadDocument}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  {hasPermission(resource, 'delete') && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteModal(true)}
                      className="text-red-600"
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        <div className="flex lg:flex-row flex-col gap-6 flex-1 min-h-0 overflow-y-auto pb-4">
          {/* Left side - File Preview */}
          <div className="lg:flex-1 space-y-4 min-h-0 w-full">
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
                      onClick={() => hasPermission(resource, 'update') && setIsEditingDescription(true)}
                      className={!hasPermission(resource, 'update') ? 'hidden' : ''}
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
                      <ActionButton 
                        variant="primary" 
                        onClick={handleSaveDescription}
                        text="Save"
                      />
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
              <CardContent className="p-4 max-lg:hidden">
                <h3 className="font-medium mb-3">Preview</h3>
                {getFilePreview()}
              </CardContent>
            </Card>
          </div>

          {/* Right side - Project Info & Comments */}
          <div className="lg:w-96 w-full flex flex-col space-y-4 min-h-0">
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
            <Card className="flex-1 flex flex-col min-h-0">
              <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                {/* Comments Header */}
                <div 
                  className="flex items-center justify-between mb-4 cursor-pointer"
                  onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
                >
                  <div className="flex items-center justify-between">
                  <h3 className="font-medium">Comments ({commentsLoading ? '...' : comments.length})</h3>
                  {commentsLoading && (
                    <div className="text-sm text-muted-foreground">Loading comments...</div>
                  )}
                  {commentsError && (
                    <div className="text-sm text-red-500">Failed to load comments</div>
                  )}
                </div>
                  {isCommentsCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </div>

                {!isCommentsCollapsed && (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Add Comment */}
                    <div className="space-y-3 mb-4 flex-shrink-0">                      
                      <div className="relative">
                        <Textarea
                          ref={textareaRef}
                          value={newComment}
                          onChange={(e) => handleTextareaChange(e.target.value, 'new')}
                          placeholder="Add a comment... (use @ to mention)"
                          className="min-h-[80px]"
                        />
                        {showMentionDropdown && currentTextarea === 'new' && (
                          <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredMembers.length > 0 ? (
                              filteredMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleMentionSelect(member)}
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback>{member.firstName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{member.firstName} {member.lastName}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {/* <div className="flex space-x-2">
                          <Button variant="outline" size="sm" disabled>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Image
                          </Button>
                        </div> */}
                        <ActionButton 
                          variant="primary" 
                          onClick={handleAddComment} 
                          disabled={isAddingComment}
                          text="Comment"
                          leftIcon={<Send className="h-4 w-4" />}
                        />
                      </div>
                    </div>

                    <Separator className="mb-4 flex-shrink-0" />

                    {/* Comments List */}
                    <div className="space-y-4">
                      {commentsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-muted-foreground">Loading comments...</div>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {comments.filter(comment => !comment.parentId).map((comment) => renderComment(comment))}
                        </div>
                      )}
                    </div>
                  </div>
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