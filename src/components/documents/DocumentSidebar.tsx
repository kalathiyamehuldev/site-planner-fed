import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  Document,
  fetchDocumentDetails,
  updateDocument,
  deleteDocument,
  downloadDocument,
  fetchFilePreview,
  fetchDocumentVersions,
  selectFilePreview,
  selectPreviewLoading,
  selectDocumentDetails,
  selectDocumentDetailsLoading,
  selectDocumentVersions,
  selectVersionsLoading,
  AccessType,
  uploadDocumentVersion
} from '@/redux/slices/documentsSlice';
import { getProjectMembers } from '@/redux/slices/projectsSlice';
import { fetchParentTasksByProject, selectParentProjectTasks } from '@/redux/slices/tasksSlice';
import { selectUser } from '@/redux/slices/authSlice';
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
import ActionButton from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import DeleteDocumentModal from '@/components/documents/DeleteDocumentModal';
import {
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
  Eye,
  ArrowLeft,
  Move,
  Plus,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UploadVersionDialog } from '@/components/documents/UploadVersionDialog';
import UserSelectionComponent from '@/components/documents/UserSelectionComponent';
import { formatFileSize, formatFileType } from '@/utils/helper';

// Using Comment type from commentsSlice
type Comment = CommentType;

interface DocumentSidebarProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onCopy?: (document: Document) => void;
  onRefresh?: () => void;
  onMove?: (document: Document) => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  document,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  onRefresh,
  onMove
}) => {

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const parentProjectTasks = useAppSelector(selectParentProjectTasks);
  const documentsState = useAppSelector(state => state.documents);
  const filePreview = useAppSelector(selectFilePreview);
  const previewLoading = useAppSelector(selectPreviewLoading);
  const documentDetails = useAppSelector(selectDocumentDetails);
  const documentDetailsLoading = useAppSelector(selectDocumentDetailsLoading);
  const documentVersions = useAppSelector(selectDocumentVersions);
  const versionsLoading = useAppSelector(selectVersionsLoading);
  const currentUser = useAppSelector(selectUser);
  const isRestrictedUploader = !!currentUser && (currentUser as any).userType && ((currentUser as any).userType === 'CUSTOMER' || (currentUser as any).userType === 'VENDOR');

  // Initialize data when sidebar opens
  useEffect(() => {
    if (isOpen && document && document.id) {
      // Set immediate UI state from the provided document prop
      setDocumentName(document.name || '');
      setDescription(document.description || '');
      setSelectedTaskId(document.taskId || '');
      setAccessType(isRestrictedUploader ? AccessType.EVERYONE : (document.accessType || AccessType.EVERYONE));
      setSelectedUserIds(isRestrictedUploader ? [] : (document.userAccess?.map(u => u.userId) || []));

      // Clear previous comments
      dispatch(clearComments());

      // Fetch comments for this document
      fetchCommentsForDocument(document.id);

      // Fetch full document details for authoritative state
      dispatch(fetchDocumentDetails(document.id));

      // Fetch parent tasks for the project
      if (document.projectId) {
        dispatch(fetchParentTasksByProject(document.projectId));
      }

      // Fetch project members for mentions
      if (document.projectId) {
        dispatch(fetchCommentProjectMembers(document.projectId));
      }
    }
  }, [isOpen, document?.id, dispatch]);
  // Comments selectors
  const comments = useAppSelector(selectAllComments);
  const commentsLoading = useAppSelector(selectCommentsLoading);
  const commentsError = useAppSelector(selectCommentsError);
  const commentProjectMembers = useAppSelector(selectCommentProjectMembers);
  const membersLoading = useAppSelector(selectMembersLoading);

  // State management
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [description, setDescription] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<Array<{ id: string, name: string }>>([]);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isVersionUploadOpen, setIsVersionUploadOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);

  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
  const [accessType, setAccessType] = useState<AccessType>(AccessType.EVERYONE);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  // Permission check
  const { hasPermission } = usePermission();
  const resource = 'documents';

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments when document changes
  const fetchCommentsForDocument = async (documentId: string) => {
    try {
      await dispatch(fetchDocumentComments({ documentId })).unwrap();
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    }
  };

  // Helper: get the latest file id for preview
  const getLatestPreviewFileId = (): string | null => {
    const files = (documentVersions && documentVersions.length > 0)
      ? documentVersions
      : (documentDetails as any)?.files;
    if (files && Array.isArray(files) && files.length > 0) {
      // Prefer highest version; fallback to most recent createdAt
      const sorted = [...files].sort((a: any, b: any) => {
        if (typeof a.version === 'number' && typeof b.version === 'number') {
          return b.version - a.version;
        }
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
      return sorted[0]?.id ?? null;
    }
    return null;
  };


  const formatUploaderType = (type?: string) => {
    if (!type) return '';
    const lower = type.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const getUploaderInfo = (): { name: string; type: string } | null => {
    const latest: any = getLatestVersion();
    const baseUploader: any = latest?.uploader || (latest?.uploadedUser ? { ...latest.uploadedUser, type: 'USER' } : null);
    if (!baseUploader) return null;
    const first = baseUploader.firstName || '';
    const last = baseUploader.lastName || '';
    const name = `${first} ${last}`.trim() || baseUploader.email || '';
    const typeLabel = formatUploaderType(baseUploader.type);
    return name ? { name, type: typeLabel } : null;
  };

  // Update local state when documentDetails from Redux changes
  useEffect(() => {
    if (documentDetails) {
      setDescription(documentDetails.description || '');
      setSelectedTaskId(documentDetails.taskId || '');
      setAccessType(documentDetails.accessType);
      setSelectedUserIds(documentDetails.userAccess?.map(access => access.userId) || []);
      
      // Fetch parent tasks for the project
      if (documentDetails.projectId) {
        dispatch(fetchParentTasksByProject(documentDetails.projectId));
      }
    }
  }, [documentDetails, dispatch]);

  // Update local state when document prop changes (for name updates after rename)
  useEffect(() => {
    if (document) {
      setDocumentName(document.name || '');
    }
  }, [document?.name]);

  // Legacy function removed; Redux state is authoritative for document details

  const handleSaveDescription = async () => {
    if (!document) return;

    setIsUpdating(true);
    try {
      await dispatch(updateDocument({
        id: document.id,
        documentData: { description: description }
      })).unwrap();

      setIsEditingDescription(false);
      dispatch(fetchDocumentDetails(document?.id));
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

  const handleSaveAccessibility = async () => {
    if (!document) return;

    setIsUpdating(true);
    try {
      await dispatch(updateDocument({
        id: document.id,
        documentData: {
          accessType: isRestrictedUploader ? AccessType.EVERYONE : accessType,
          userIds: isRestrictedUploader ? [] : (accessType === AccessType.SELECTED_USERS ? selectedUserIds : [])
        }
      })).unwrap();
      dispatch(fetchDocumentDetails(document?.id));
      toast({
        title: 'Success',
        description: 'Access settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update access settings',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!documentDetails?.id) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(downloadDocument(documentDetails.id));

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

  const handleDeleteDocument = () => {
    if (!document) return;
    setShowDeleteModal(true);
  };

  // Handle task association update
  const handleSaveTaskAssociation = async () => {
    if (!document) return;

    setIsUpdating(true);

    try {
      const resultAction = await dispatch(
        updateDocument({
          id: document.id,
          documentData: {
            taskId: selectedTaskId || null
          }
        })
      );
      dispatch(fetchDocumentDetails(document?.id));
      if (resultAction) {
        toast({
          title: 'Success',
          description: 'Task association updated successfully',
        });

        // Update document details with new task association
        if (documentDetails) {
          // Since we're using Redux state, we need to refetch document details
          // to get the updated task association
          dispatch(fetchDocumentDetails(document.id));
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update task association',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while updating task association',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!document) return;

    setIsUpdating(true);
    try {
      await dispatch(deleteDocument(document.id)).unwrap();

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      // Close sidebar first to prevent any further API calls on deleted document
      onClose();

      // Notify parent component about deletion
      if (onDelete) {
        onDelete(document.id);
      }

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
      setShowDeleteModal(false);
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
      })).unwrap();

      // Refresh comments after creating new comment
      await dispatch(fetchDocumentComments({ documentId: document.id })).unwrap();

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
      })).unwrap();

      // Refresh comments after updating comment
      await dispatch(fetchDocumentComments({ documentId: document.id })).unwrap();

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
      await dispatch(deleteCommentAction(commentId)).unwrap();

      // Refresh comments after deleting comment
      await dispatch(fetchDocumentComments({ documentId: document.id })).unwrap();

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
      })).unwrap();

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
      // Extract all mentioned users from the reply content
      const extractedUsers = extractMentionedUsers(replyContent);
      const mentionedUserIds = extractedUsers.map(user => user.id);

      await dispatch(createComment({
        content: replyContent.trim(),
        commentType: 'GENERAL',
        documentId: document.id,
        parentId,
        mentionedUserIds
      })).unwrap();

      // Refresh comments after reply
      await dispatch(fetchDocumentComments({ documentId: document.id })).unwrap();

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
    const mentions: Array<{ id: string, name: string }> = [];
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

  const filteredMembers = commentProjectMembers.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesQuery = fullName.includes(mentionQuery.toLowerCase());
    const isNotCurrentUser = !currentUser || member.id !== currentUser.id;
    return matchesQuery && isNotCurrentUser;
  });

  const toggleReplyCollapse = (commentId: string) => {
    const newCollapsed = new Set(collapsedReplies);
    if (newCollapsed.has(commentId)) {
      newCollapsed.delete(commentId);
    } else {
      newCollapsed.add(commentId);
    }
    setCollapsedReplies(newCollapsed);
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Helper function to build comment hierarchy from flat structure
  const buildCommentHierarchy = (flatComments: Comment[]): Comment[] => {
    
    // Check if comments already have replies populated (nested structure from API)
    const hasNestedReplies = flatComments.some(comment => comment.replies && comment.replies.length > 0);
    
    // Count total comments vs comments that would be in nested structure
    const topLevelComments = flatComments.filter(comment => !comment.parentId);
    const replyComments = flatComments.filter(comment => comment.parentId);
    
    if (hasNestedReplies) {
      // Count replies in nested structure
      let nestedReplyCount = 0;
      const countNestedReplies = (comments: Comment[]) => {
        comments.forEach(comment => {
          if (comment.replies && comment.replies.length > 0) {
            nestedReplyCount += comment.replies.length;
            countNestedReplies(comment.replies);
          }
        });
      };
      countNestedReplies(topLevelComments);
      
      // If nested structure is complete, use it; otherwise build from flat structure
      if (nestedReplyCount >= replyComments.length) {
        return topLevelComments;
      }
    }
    
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments and initialize replies array
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the hierarchy
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parentId) {
        // This is a reply, add it to its parent's replies array
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        } else {
          // Add orphaned replies to root level as fallback
          rootComments.push(commentWithReplies);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    // Sort root comments by creation date (newest first)
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort replies within each comment by creation date (oldest first for replies)
    const sortReplies = (comment: Comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        comment.replies.forEach(sortReplies); // Recursively sort nested replies
      }
    };

    rootComments.forEach(sortReplies);

    // Debug: Print the complete hierarchy structure
    const printHierarchy = (comments: Comment[], level = 0) => {
      comments.forEach(comment => {
        const indent = '  '.repeat(level);
        if (comment.replies && comment.replies.length > 0) {
          printHierarchy(comment.replies, level + 1);
        }
      });
    };
    printHierarchy(rootComments);
    return rootComments;
  };
  const renderComment = (comment: Comment, depth: number = 0) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToCommentId === comment.id;
    const maxDepth = 5; // Allow deeper nesting for better hierarchy

    return (
      <div key={comment.id} className={`space-y-2 ${depth > 0 ? `ml-6 border-l-2 ${depth === 1 ? 'border-blue-200' : depth === 2 ? 'border-green-200' : 'border-gray-200'} pl-4` : ''}`}>
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
                <div className="relative">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => handleTextareaChange(e.target.value, 'edit')}
                    className="min-h-[60px] text-sm"
                    placeholder="Edit your comment... (use @ to mention)"
                  />
                  {showMentionDropdown && currentTextarea === 'edit' && (
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
                <div className="flex items-center space-x-2">
                  <ActionButton
                    variant="primary"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={isUpdatingComment || !editingContent.trim()}
                    text={isUpdatingComment ? 'Saving..' : 'Save'}
                  />
                  <ActionButton
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isUpdatingComment}
                    text="Cancel"
                  />
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

            {/* Action Buttons - Only show for comments by current user */}
            {!isEditing && currentUser && comment.fromUser.id === currentUser.id && (
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={isDeletingComment === comment.id}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {/* {isDeletingComment === comment.id ? 'Deleting...' : 'Delete'} */}
                </Button>
              </div>
            )}
            
            {/* Reply button for all users */}
            {!isEditing && depth < maxDepth && (!currentUser || comment.fromUser.id !== currentUser.id) && (
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => handleStartReply(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                </Button>
              </div>
            )}

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg relative">
                <div className="relative">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => handleTextareaChange(e.target.value, 'reply')}
                    placeholder="Write a reply... (use @ to mention)"
                    className="min-h-[60px] text-sm"
                  />
                  {showMentionDropdown && currentTextarea === 'reply' && (
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
                <div className="flex items-center space-x-2">
                  <ActionButton
                    variant="primary"
                    motion="subtle"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmittingReply || !replyContent.trim()}
                    text={isSubmittingReply ? 'Replying...' : 'Reply'}
                  />
                  <ActionButton
                    variant="secondary"
                    motion="subtle"
                    onClick={handleCancelReply}
                    disabled={isSubmittingReply}
                    text="Cancel"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Render nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {(() => {
              return null;
            })()}
            {comment.replies.length > 1 && (
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
            )}
            {!collapsedReplies.has(comment.id) && (
              <div>
                {(() => {
                  return comment.replies.map((reply) => {
                    return renderComment(reply, depth + 1);
                  });
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    );
  };
  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Helper: get latest version info from versions list or details files
  const getLatestVersion = () => {
    const list = (documentVersions && documentVersions.length > 0)
      ? documentVersions
      : ((documentDetails && Array.isArray(documentDetails.files)) ? documentDetails.files : []);
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a: any, b: any) => {
      const verDiff = (b?.version ?? 0) - (a?.version ?? 0);
      if (verDiff !== 0) return verDiff;
      const aTime = new Date(a?.createdAt).getTime();
      const bTime = new Date(b?.createdAt).getTime();
      return bTime - aTime;
    });
    return sorted[0];
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
    if (filePreview) {
      const fileType = (filePreview.fileType || document?.files?.[0]?.fileType || '').toLowerCase();

      if (fileType.includes('pdf')) {
        return (
          <iframe
            src={filePreview.previewUrl}
            className="w-full h-[70vh] rounded-lg border border-gray-200"
            title="PDF Preview"
          />
        );
      } else if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png') || fileType.includes('jpeg')) {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg">
            <img
              src={filePreview.previewUrl}
              alt={document?.name || 'Document preview'}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        );
      } else {
        // For other file types, show a generic preview with download option
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">{document?.name}</p>
              <p className="text-gray-500 mb-4">Preview not available for this file type</p>
              <Button
                variant="outline"
                onClick={handleDownloadDocument}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download to view
              </Button>
            </div>
          </div>
        );
      }
    }

    // No preview available
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No preview available</p>
        </div>
      </div>
    );
  };

  const handleVersionUploadSuccess = () => {
    setIsVersionUploadOpen(false);
    if (document?.id) {
      // Fetch the latest document details after version upload
      dispatch(fetchDocumentDetails(document.id));
      // Also refresh versions list immediately
      dispatch(fetchDocumentVersions(document.id));

      // Force refresh the file preview to show the latest version
      if (documentDetails?.files && documentDetails.files.length > 0) {
        // Get the latest file (should be the first one in the array after refresh)
        const latestFileId = documentDetails?.files[0]?.id;
        if (latestFileId) {
          dispatch(fetchFilePreview(latestFileId));
        }
      }
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  // If sidebar is not open, don't render anything
  if (!isOpen || !document) {
    return null;
  }

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 z-50 bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-hidden",
      isOpen ? "translate-x-0" : "translate-x-full",
      showPreview ? "w-full md:w-full" : "w-full md:w-1/3 lg:w-1/4"
    )}>
      {/* Version Upload Dialog */}
      <UploadVersionDialog
        open={isVersionUploadOpen}
        onOpenChange={(open) => setIsVersionUploadOpen(open)}
        document={document}
        onVersionUploaded={handleVersionUploadSuccess}
      />

      {/* Delete Document Modal */}
      <DeleteDocumentModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        document={document}
        onConfirm={confirmDeleteDocument}
        loading={isUpdating}
      />

      {showPreview ? (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to details
            </Button>
            <h2 className="text-lg font-medium">{document.name}</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {getFilePreview()}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">Document Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Version control */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Version {getLatestVersion()?.version || document.version || 1}</span>
                  {documentDetails && documentDetails.files && Array.isArray(documentDetails.files) && documentDetails.files.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {documentDetails.files.length} versions
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const willOpen = !showVersionHistory;
                    setShowVersionHistory(willOpen);
                    if (willOpen && document?.id) {
                      dispatch(fetchDocumentVersions(document.id));
                    }
                  }}
                  className="flex items-center gap-1 text-sm"
                >
                  History
                  {showVersionHistory ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Version history dropdown */}
              {showVersionHistory && (
                <div className="mt-2 border rounded-md p-2 bg-gray-50">
                  <div className="max-h-40 overflow-y-auto">
                    {(() => {
                      const list = (documentVersions && documentVersions.length > 0)
                        ? documentVersions
                        : (documentDetails && documentDetails.files && Array.isArray(documentDetails.files)
                          ? documentDetails.files
                          : []);
                      const sorted = [...list].sort((a: any, b: any) => {
                        const verDiff = (b?.version ?? 0) - (a?.version ?? 0);
                        if (verDiff !== 0) return verDiff;
                        const aTime = new Date(a?.createdAt).getTime();
                        const bTime = new Date(b?.createdAt).getTime();
                        return bTime - aTime;
                      });
                      return sorted.map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between py-2 px-1 hover:bg-gray-100 rounded-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">v{file.version}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              dispatch(fetchFilePreview(file.id));
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ));
                    })()}
                  </div>
                  <ActionButton
                    variant="secondary"
                    className="w-full mt-2 flex items-center justify-center gap-1"
                    onClick={() => setIsVersionUploadOpen(true)}
                    leftIcon={<Plus className="h-3 w-3" />}
                    text='Add a new version'
                  >
                  </ActionButton>
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div className="p-4 border-b">
              <div className="relative group cursor-pointer" onClick={() => {
                setShowPreview(true);
                const latestFileId = getLatestPreviewFileId();
                if (latestFileId) {
                  dispatch(fetchFilePreview(latestFileId));
                }
              }}>
                <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                  {document.url && document.files?.[0]?.fileType?.toLowerCase().includes('image') ? (
                    <img
                      src={document.url}
                      alt={document.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <Eye className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Document metadata */}
            <div className="p-4 border-b">
              <h4 className="font-medium mb-3 text-gray-900">{documentDetails?.name || document.name}</h4>
              <div className="space-y-3">
                {/* Date first */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Last Updated</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {(() => {
                      const latest = getLatestVersion();
                      const date = latest?.createdAt || documentDetails?.files?.[0]?.createdAt || document.createdAt;
                      try {
                        return date ? format(new Date(date), 'MMM d, yyyy HH:mm') : '—';
                      } catch {
                        return '—';
                      }
                    })()}
                  </span>
                </div>

                {/* Version and File Type below date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Version & Type</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      v{getLatestVersion()?.version || document.version || 1}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {formatFileType(getLatestVersion()?.fileType || documentDetails?.files?.[0]?.fileType || document.type) || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">File Size</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatFileSize(getLatestVersion()?.fileSize || documentDetails?.files?.[0]?.fileSize || document.size) || 'Unknown'}
                  </span>
                </div>

                {getUploaderInfo() && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Uploaded by</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {(() => { const info = getUploaderInfo(); return info ? `${info.type}: ${info.name}` : ''; })()}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadDocument}
                  className="flex items-center gap-2 justify-center"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm">Download</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit && onEdit(document)}
                  className="flex items-center gap-2 justify-center"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-sm">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteDocument}
                  className="flex items-center gap-2 justify-center text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Delete</span>
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Description</h4>
                {!isEditingDescription ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <ActionButton
                      variant="primary"
                      onClick={handleSaveDescription}
                      disabled={isUpdating}
                      className="h-8 px-3"
                      text={isUpdating ? "Saving..." : "Save"}
                    />
                  </div>
                )}
              </div>

              {isEditingDescription ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this document..."
                  className="w-full resize-none"
                  rows={4}
                />
              ) : (
                <div className="min-h-[60px] p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {description || "No description provided. Click the edit button to add one."}
                  </p>
                </div>
              )}
            </div>

            {/* Accessibility */}
            {!isRestrictedUploader && (
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Access Control</h4>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveAccessibility}
                    disabled={isUpdating}
                    className="h-8 px-3"
                  >
                    {isUpdating ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                    ) : (
                      <span className="text-sm">Save</span>
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <RadioGroup
                    value={accessType}
                    onValueChange={(value: AccessType.EVERYONE | AccessType.SELECTED_USERS) => {
                      setAccessType(value);
                      if (value === AccessType.EVERYONE) {
                        setSelectedUserIds([]);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="EVERYONE" id="everyone" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="everyone" className="text-sm font-medium cursor-pointer">Everyone</Label>
                        <p className="text-xs text-gray-500 mt-1">All users with document permissions can access</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="SELECTED_USERS" id="selected-users" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="selected-users" className="text-sm font-medium cursor-pointer">Selected Users Only</Label>
                        <p className="text-xs text-gray-500 mt-1">Only specific users can access this document</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {accessType === AccessType.SELECTED_USERS && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium mb-2 block text-blue-900">Select Users:</Label>
                    <UserSelectionComponent
                      selectedUserIds={selectedUserIds}
                      onChange={setSelectedUserIds}
                      projectId={documentDetails?.projectId || document?.projectId || ''}
                    />
                    {documentDetails?.userAccess && documentDetails.userAccess.length > 0 && (() => {
                      const filtered = documentDetails.userAccess.filter((access) => {
                        const currentId = currentUser?.id;
                        const currentEmail = (currentUser as any)?.email;
                        const isCurrent = (access.userId && currentId && access.userId === currentId)
                          || (access.user?.id && currentId && access.user.id === currentId)
                          || (access.user?.email && currentEmail && access.user.email === currentEmail);
                        const hasValidUser = access.user && (access.user.firstName || access.user.lastName || access.user.name);
                        return !isCurrent && hasValidUser;
                      });
                      if (filtered.length === 0) return null;
                      return (
                        <div className="mt-3">
                          <Label className="text-xs font-medium text-blue-800 mb-2 block">Current Access:</Label>
                          <div className="flex flex-wrap gap-2">
                            {filtered.map((access) => {
                              const label = access.user
                                ? ((access.user.firstName && access.user.lastName)
                                    ? `${access.user.firstName} ${access.user.lastName}`
                                    : (access.user.firstName || access.user.lastName || access.user.name || access.user.email || 'Unknown User'))
                                : 'Unknown User';
                              return (
                                <Badge key={access.userId} variant="secondary" className="text-xs">
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Task association */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Associated Task</h4>
                {!isEditingTask ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingTask(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingTask(false);
                        // Reset to the current task ID from document details or document
                        const currentTaskId = documentDetails?.taskId || document.taskId || '';
                        setSelectedTaskId(currentTaskId);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        handleSaveTaskAssociation();
                        setIsEditingTask(false);
                      }}
                      disabled={isUpdating}
                      className="h-8 px-3"
                    >
                      {isUpdating ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                      ) : (
                        <span className="text-sm">Save</span>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {isEditingTask ? (
                <Select
                  value={selectedTaskId || "no-task"}
                  onValueChange={(value) => {
                    setSelectedTaskId(value === "no-task" ? "" : value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-task">No task</SelectItem>
                    {parentProjectTasks && parentProjectTasks.length > 0 ? (
                      parentProjectTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            {/* <div className={cn(
                              "w-2 h-2 rounded-full",
                              task.priority === 'URGENT' ? 'bg-red-500' :
                              task.priority === 'HIGH' ? 'bg-orange-500' :
                              task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                            )}></div> */}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-tasks-available" disabled>
                        No tasks available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div 
                  className="bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onDoubleClick={() => setIsEditingTask(true)}
                >
                  {(document.taskId || documentDetails?.taskId) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm font-medium text-blue-900">
                        {(() => {
                          const taskId = document.taskId || documentDetails?.taskId;
                          const task = parentProjectTasks.find(task => task.id === taskId);
                          if (task) {
                            return task.title;
                          } else if (parentProjectTasks.length === 0) {
                            return 'Loading task...';
                          } else {
                            return 'Task not found';
                          }
                        })()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <p className="text-sm text-gray-600 italic">No task associated. Double-click to assign.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments section */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                {/* Comments Header */}
                <div
                  className="flex items-center justify-between mb-4 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">Comments</h4>
                    <Badge variant="secondary" className="text-xs">
                      {commentsLoading ? '...' : comments.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {commentsLoading && (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 rounded-full border-t-transparent"></div>
                    )}
                    {commentsError && (
                      <div className="text-xs text-red-500">Error</div>
                    )}
                    {isCommentsCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
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
                        <ActionButton variant="primary" motion="subtle" onClick={handleAddComment} disabled={isAddingComment} text="Comment" leftIcon={<Send className="h-4 w-4" />} />
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
                          {(() => {
                            const hierarchicalComments = buildCommentHierarchy(comments);
                            // Fallback: if no root comments found, show all comments
                            if (hierarchicalComments.length === 0 && comments.length > 0) {
                              return comments.map((comment) => renderComment(comment));
                            }
                            
                            return hierarchicalComments.map((comment) => renderComment(comment));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar;
