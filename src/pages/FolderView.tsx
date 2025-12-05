import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import PageHeader from '@/components/layout/PageHeader';
import {
  fetchDocumentsByFolder,
  deleteDocument,
  updateDocument,
  selectAllDocuments,
  Document,
  downloadDocument,
  AccessType,
  fetchDocumentDetails
} from '@/redux/slices/documentsSlice';
import { fetchProjects, selectAllProjects } from '@/redux/slices/projectsSlice';
import { selectUser } from '@/redux/slices/authSlice';
import { fetchParentTasksByProject, selectParentProjectTasks } from '@/redux/slices/tasksSlice';
import {
  fetchFolders,
  fetchFolderById,
  fetchFolderPath,
  fetchFolderTree,
  createFolder,
  updateFolderAsync,
  deleteFolderAsync,
  selectAllFolders,
  selectFolderPath,
  selectFolderTree,
  selectTreeLoading,
  Folder as FolderType
} from '@/redux/slices/foldersSlice';
import PageContainer from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import ActionButton from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  MoreVertical,
  MoreHorizontal,
  ArrowLeft,
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Trash2,
  Edit3,
  ChevronRight,
  Upload,
  Download,
  Calendar,
  Grid3X3,
  List,
  X,
  Filter,
} from 'lucide-react';
import solar from '@solar-icons/react';
import DeleteFolderModal from '@/components/modals/DeleteFolderModal';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { useToast } from '@/hooks/use-toast';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { UploadVersionDialog } from '@/components/documents/UploadVersionDialog';
import DocumentSidebar from '@/components/documents/DocumentSidebar';
import usePermission from '@/hooks/usePermission';
import { formatFileSize, formatFileType } from '@/utils/helper';

// Add CSS animations
const styles = `
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Utility function for formatting date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// File type categories for filtering
const fileTypeCategories = [
  "All",
  "PDF",
  "DOCX",
  "XLSX",
  "PPTX",
  "JPG",
  "PNG",
  "ZIP"
];

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const documents = useAppSelector(selectAllDocuments);
  const projects = useAppSelector(selectAllProjects);
  const tasks = useAppSelector(selectParentProjectTasks);
  const currentUser = useAppSelector(selectUser);
  const isVendor = currentUser?.userType === 'VENDOR';
  const visibleTasks = useMemo(() => {
    return isVendor
      ? (tasks || []).filter(t => t.assigneeType === 'VENDOR' && t.assigneeId === currentUser?.id)
      : (tasks || []);
  }, [tasks, currentUser?.id, isVendor]);
  const folders = useAppSelector(selectAllFolders);
  const folderTree = useAppSelector(selectFolderTree);
  const documentsLoading = useAppSelector((state) => state.documents.loading);
  const foldersLoading = useAppSelector((state) => state.folders.loading);
  const treeLoading = useAppSelector(selectTreeLoading);
  const selectedFolder = useAppSelector((state) => state.folders.selectedFolder);
  const currentPath = useAppSelector((state) => state.folders.currentPath);
  const folderPath = useAppSelector(selectFolderPath);

  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    folderId: string | null;
    x: number;
    y: number;
  }>({ isOpen: false, folderId: null, x: 0, y: 0 });
  const [deleteFolderModal, setDeleteFolderModal] = useState<{
    isOpen: boolean;
    folder: FolderType | null;
  }>({ isOpen: false, folder: null });
  const [renameDocumentModal, setRenameDocumentModal] = useState<{ isOpen: boolean; document: Document | null }>({ isOpen: false, document: null });
  const [newDocumentName, setNewDocumentName] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [versionUploadModal, setVersionUploadModal] = useState<{ isOpen: boolean; document: Document | null }>({ isOpen: false, document: null });

  // Filter states
  const [selectedTask, setSelectedTask] = useState<string>('All');
  const [selectedFileType, setSelectedFileType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for getting names
  const getTaskName = (document) => {
    if (!document.taskId) return 'No Task';
    const task = visibleTasks.find(t => t.id === document.taskId);
    return task ? task.title : 'Unknown Task';
  };


  const getProjectName = (document: Document) => {
    return projects.find(p => p.id === document.projectId)?.title || 'No Project';
  };

  const handleRenameDocument = async () => {
    if (!renameDocumentModal.document || !newDocumentName.trim()) return;

    try {
      await dispatch(updateDocument({
        id: renameDocumentModal.document.id,
        documentData: {
          name: newDocumentName.trim(),
          accessType: renameDocumentModal.document.accessType,
          userIds: renameDocumentModal.document.userAccess?.map(user => user.userId) || []
        }
      })).unwrap();
      dispatch(fetchDocumentDetails(renameDocumentModal.document.id));
      toast({
        title: "Success",
        description: "Document renamed successfully.",
      });

      // Refresh documents after rename
      if (folderId) {
        dispatch(fetchDocumentsByFolder(folderId));
      }

      // Refresh folder tree to update document count and structure
      const projectId = getProjectId();
      if (projectId) {
        dispatch(fetchFolderTree(projectId));
      }

      setRenameDocumentModal({ isOpen: false, document: null });
      setNewDocumentName('');
    } catch (error) {
      console.error('Error renaming document:', error);
      toast({
        title: "Error",
        description: "Failed to rename document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRename = () => {
    setRenameDocumentModal({ isOpen: false, document: null });
    setNewDocumentName('');
  };

  // Helper function to find a folder in the tree structure
  const findFolderInTree = (tree: FolderType[], targetId: string): FolderType | null => {
    for (const folder of tree) {
      if (folder.id === targetId) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderInTree(folder.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to get project ID from folder tree or current folder
  const getProjectId = useCallback(() => {
    if (folderTree.length > 0) {
      return folderTree[0].projectId;
    }
    if (selectedFolder) {
      return selectedFolder.projectId;
    }
    return null;
  }, [folderTree, selectedFolder]);

  const currentFolder = useMemo(() => {
    return findFolderInTree(folderTree, folderId || '') || selectedFolder || folders.find(f => f.id === folderId);
  }, [folderTree, folderId, selectedFolder, folders]);

  const folderDocuments = useMemo(() => {
    // Always prefer documents from Redux store (which has full data) over folder tree documents (which may have limited data)
    const reduxDocuments = documents.filter(doc => doc.folderId === folderId);

    // Only use folder tree documents if Redux documents are empty
    if (reduxDocuments.length > 0) {
      return reduxDocuments;
    }

    return currentFolder?.documents || [];
  }, [currentFolder, documents, folderId]);

  const subFolders = useMemo(() => {
    return currentFolder?.children || folders.filter(f => f.parentId === folderId);
  }, [currentFolder, folders, folderId]);

  // Filtered documents based on search and filters
  const filteredDocuments = useMemo(() => {
    let filtered = folderDocuments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply task filter
    if (selectedTask !== 'All') {
      filtered = filtered.filter(doc => {
        // Handle case where document has no task assigned
        if (!doc.taskId && selectedTask === 'no-task') {
          return true;
        }
        return doc.taskId === selectedTask;
      });
    }

    // Apply file type filter
    if (selectedFileType !== 'All') {
      filtered = filtered.filter(doc => {
        const fileExtension = doc.files?.[0]?.fileType?.toUpperCase();
        return fileExtension === selectedFileType;
      });
    }

    return filtered;
  }, [folderDocuments, searchTerm, selectedTask, selectedFileType]);

  // Filtered folders based on search
  const filteredFolders = useMemo(() => {
    if (!searchTerm) return subFolders;

    return subFolders.filter(folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subFolders, searchTerm]);

  // Add a separate loading state for initial folder data
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (folderId) {
      setInitialLoading(true);

      // Always fetch folder by ID first to get project ID, then fetch tree and documents
      dispatch(fetchFolderById(folderId)).then((action) => {
        if (action.payload && typeof action.payload === 'object' && 'projectId' in action.payload) {
          const folder = action.payload as FolderType;
          if (folder.projectId) {
            // Fetch both folder tree and documents in parallel
            Promise.all([
              dispatch(fetchFolderTree(folder.projectId)),
              dispatch(fetchDocumentsByFolder(folderId))
            ]).then(() => {
              setInitialLoading(false);
            });
          } else {
            // Still fetch documents even if no project ID
            dispatch(fetchDocumentsByFolder(folderId)).then(() => {
              setInitialLoading(false);
            });
          }
        } else {
          // Fallback: still try to fetch documents
          dispatch(fetchDocumentsByFolder(folderId)).then(() => {
            setInitialLoading(false);
          });
        }
      });

      // Fetch projects only if not already loaded
      if (projects.length === 0) {
        dispatch(fetchProjects());
      }
    }
  }, [dispatch, folderId, projects.length]);

  // Reset filter states when navigating to different folders
  useEffect(() => {
    setSelectedTask('All');
    setSelectedFileType('All');
    setSearchTerm('');
  }, [folderId]);

  // Fetch tasks for the current folder's project
  useEffect(() => {
    const projectId = getProjectId();
    if (projectId) {
      dispatch(fetchParentTasksByProject(projectId));
    }
  }, [dispatch, getProjectId, folderId]);

  // Fetch folder path for accurate breadcrumbs
  useEffect(() => {
    if (folderId) {
      dispatch(fetchFolderPath(folderId));
    }
  }, [dispatch, folderId]);

  useEffect(() => {
    if (editingFolderId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFolderId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.isOpen]);

  const handleCreateFolder = () => {
    setNewFolderName('');
    setShowCreateFolderModal(true);
  };

  const handleCreateFolderSubmit = async () => {
    if (!currentFolder || !newFolderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newFolder = {
        name: newFolderName.trim(),
        projectId: currentFolder.projectId,
        parentId: folderId || null
      };

      await dispatch(createFolder(newFolder)).unwrap();

      // Refresh folder tree after successful creation
      if (currentFolder.projectId) {
        dispatch(fetchFolderTree(currentFolder.projectId));
      }

      setShowCreateFolderModal(false);
      setNewFolderName('');
      // Success message will be handled by backend API
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const handleCancelCreateFolder = () => {
    setShowCreateFolderModal(false);
    setNewFolderName('');
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    if (!name.trim()) return;

    try {
      await dispatch(updateFolderAsync({
        id,
        folderData: { name: name.trim() }
      })).unwrap();

      // Refresh folder tree after successful update
      const projectId = getProjectId();
      if (projectId) {
        dispatch(fetchFolderTree(projectId));
      }

      setEditingFolderId(null);
      setEditingFolderName('');
      // Success message will be handled by backend API
    } catch (error) {
      console.error('Failed to update folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFolder = async (id: string, cascade: boolean = false) => {
    try {
      await dispatch(deleteFolderAsync({ id, cascade })).unwrap();

      // Refresh folder tree after successful deletion
      const projectId = getProjectId();
      if (projectId) {
        dispatch(fetchFolderTree(projectId));
      }

      // Success message will be handled by backend API
      setDeleteFolderModal({ isOpen: false, folder: null });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  };

  const openDeleteFolderModal = (folder: FolderType) => {
    setDeleteFolderModal({ isOpen: true, folder });
  };



  const handleFolderClick = (folder: FolderType) => {
    // Navigate to the folder - the tree data will be available from the parent component
    navigate(`/documents/folder/${folder.id}`);
  };

  const handleBackClick = () => {
    if (currentFolder?.parentId) {
      navigate(`/documents/folder/${currentFolder.parentId}`);
    } else {
      navigate('/documents');
    }
  };

  const startEditingFolder = (folder: FolderType) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const cancelEditingFolder = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, folderId: string) => {
    if (e.key === 'Enter') {
      handleUpdateFolder(folderId, editingFolderName);
    } else if (e.key === 'Escape') {
      cancelEditingFolder();
    }
  };

  // Context menu functions
  const openContextMenu = (event: React.MouseEvent, folderId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      isOpen: true,
      folderId,
      x: event.clientX,
      y: event.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, folderId: null, x: 0, y: 0 });
  };

  const handleEditFolderFromMenu = () => {
    if (contextMenu.folderId) {
      const folder = folders.find(f => f.id === contextMenu.folderId);
      if (folder) {
        setEditingFolderId(folder.id);
        setEditingFolderName(folder.name);
      }
    }
    closeContextMenu();
  };

  const handleDeleteFolderFromMenu = () => {
    if (contextMenu.folderId) {
      handleDeleteFolder(contextMenu.folderId);
    }
    closeContextMenu();
  };

  const getFileIcon = (type: string | undefined | null) => {
    if (!type) {
      return <File className="h-4 w-4" />;
    }
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'pptx':
      case 'ppt':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-purple-500" />;
      case 'zip':
      case 'rar':
        return <File className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Document handling functions
  const handleDownloadDocument = async (document: Document) => {
    if (!document.id) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(downloadDocument(document.id));

      // if (downloadDocument.fulfilled.match(result)) {
      //   toast({
      //     title: 'Success',
      //     description: 'Document downloaded successfully',
      //   });
      // } else {
      //   throw new Error(result.payload as string || 'Download failed');
      // }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleEditDocument = (doc: Document) => {
    setRenameDocumentModal({ isOpen: true, document: doc });
    setNewDocumentName(doc.name);
  };

  const handleDeleteDocumentFile = async (documentId: string) => {
    try {
      await dispatch(deleteDocument(documentId)).unwrap();
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });

      // Refresh documents after deletion
      if (folderId) {
        dispatch(fetchDocumentsByFolder(folderId));
      }

      // Refresh folder tree to update document count and structure
      const projectId = getProjectId();
      if (projectId) {
        dispatch(fetchFolderTree(projectId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateVersion = (document: Document) => {
    setVersionUploadModal({ isOpen: true, document });
  };

  const handleVersionUploadSuccess = () => {
    // Refresh documents after version upload
    if (folderId) {
      dispatch(fetchDocumentsByFolder(folderId));
    }
    setVersionUploadModal({ isOpen: false, document: null });
  };



  const breadcrumbs = useMemo(() => {
    if (folderPath && folderPath.parts && folderPath.parts.length > 0 && folderTree) {
      // Helper function to find folder ID by path in tree
      const findFolderByPath = (folders: FolderType[], targetPath: string[]): FolderType | null => {
        if (targetPath.length === 0) return null;

        for (const folder of folders) {
          if (folder.name === targetPath[0]) {
            if (targetPath.length === 1) {
              return folder;
            } else {
              return findFolderByPath(folder.children, targetPath.slice(1));
            }
          }
        }
        return null;
      };

      // Convert path parts to breadcrumb objects, including the current folder
      const pathParts = folderPath.parts;
      return pathParts.map((name, index) => {
        const partialPath = pathParts.slice(0, index + 1);
        const folder = findFolderByPath(folderTree, partialPath);

        return {
          id: folder?.id || `breadcrumb-${index}`,
          name: name,
          path: partialPath.join('/'),
          parentId: folder?.parentId || (index > 0 ? `breadcrumb-${index - 1}` : null),
          projectId: folder?.projectId || currentFolder?.projectId || '',
          companyId: folder?.companyId || currentFolder?.companyId || '',
          createdAt: folder?.createdAt || '',
          updatedAt: folder?.updatedAt || '',
          parent: null,
          children: [],
          documents: [],
          documentCount: 0,
          isEditing: false,
          projectName: ''
        };
      });
    }

    // Fallback to tree structure for breadcrumbs if path API data is not available
    const buildBreadcrumbsFromTree = (folderId: string): FolderType[] => {
      const breadcrumbs: FolderType[] = [];

      const findFolderPath = (folders: FolderType[], targetId: string, path: FolderType[] = []): FolderType[] | null => {
        for (const folder of folders) {
          const currentPath = [...path, folder];

          if (folder.id === targetId) {
            return currentPath;
          }

          if (folder.children && folder.children.length > 0) {
            const result = findFolderPath(folder.children, targetId, currentPath);
            if (result) return result;
          }
        }
        return null;
      };

      if (folderTree && folderTree.length > 0) {
        const path = findFolderPath(folderTree, folderId);
        if (path) {
          return path.slice(0, -1); // Exclude the current folder from breadcrumbs
        }
      }

      return breadcrumbs;
    };

    if (folderTree && currentFolder) {
      return buildBreadcrumbsFromTree(currentFolder.id);
    }

    return [];
  }, [folderPath, folderTree, currentFolder]);

  const resolveFolderIdFromPath = useCallback((targetPath: string[], projectId?: string): string | null => {
    const findFolderByPath = (folders: FolderType[], path: string[]): FolderType | null => {
      if (!folders || path.length === 0) return null;
      for (const f of folders) {
        if (f.name === path[0]) {
          if (path.length === 1) return f;
          return findFolderByPath(f.children, path.slice(1));
        }
      }
      return null;
    };
    const folderFromTree = findFolderByPath(folderTree, targetPath);
    if (folderFromTree?.id) return folderFromTree.id;

    let parentId: string | null = null;
    for (let i = 0; i < targetPath.length; i++) {
      const name = targetPath[i];
      const candidate = folders.find(
        (f) => f.name === name && (i === 0 ? f.parentId === null : f.parentId === parentId) && (!projectId || f.projectId === projectId)
      );
      if (!candidate) return null;
      parentId = candidate.id;
    }
    return parentId;
  }, [folderTree, folders]);

  // Show loading during initial folder fetch or when documents are loading
  if (initialLoading || documentsLoading || (foldersLoading && !currentFolder)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If we have a folderId but no currentFolder and we're not loading, 
  // it means the folder doesn't exist
  if (folderId && !currentFolder && !initialLoading && !treeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Folder not found</div>
      </div>
    );
  }

  // If we don't have currentFolder yet but we're not in an error state, show loading
  if (!currentFolder && (initialLoading || treeLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4 md:space-y-8 w-full max-w-full overflow-hidden">
        {/* Header */}
        <PageHeader 
          title={currentFolder?.name || "Folder"} 
          showBackButton={true}
          subtitle='Manage files and folders in this directory'
          onBackClick={handleBackClick}
        >
          <div className="flex w-full justify-between sm:w-auto sm:justify-start gap-1 sm:gap-2">
            {hasPermission('folders', 'create') && (
              <ActionButton
                variant="secondary"
                motion="subtle"
                className="w-auto"
                onClick={handleCreateFolder}
                text="New Folder"
                leftIcon={<Plus size={16} />}
              />
            )}
            {hasPermission('documents', 'create') && (
              <div className="hidden md:flex items-center gap-2">
                <ActionButton
                  variant="primary"
                  motion="subtle"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="w-auto"
                  text="Upload Files"
                  leftIcon={<Upload size={16} />}
                />
              </div>
            )}
          </div>
        </PageHeader>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in animation-delay-[0.1s]">
          <span
            className="font-medium text-foreground cursor-pointer hover:text-primary"
            onClick={() => navigate('/documents')}
          >
            Documents
          </span>
          {breadcrumbs.map((folder, index) => [
            <ChevronRight key={`chevron-${folder.id}`} size={14} />,
            <span
              key={`span-${folder.id}`}
              className={cn(
                index === breadcrumbs.length - 1
                  ? 'text-foreground font-medium cursor-default'
                  : 'cursor-pointer hover:text-foreground hover:underline'
              )}
              onClick={() => {
                if (index !== breadcrumbs.length - 1) {
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                  if (uuidRegex.test(folder.id)) {
                    navigate(`/documents/folder/${folder.id}`);
                  } else {
                    const targetId = resolveFolderIdFromPath(folder.path.split('/'), folder.projectId);
                    if (targetId && uuidRegex.test(targetId)) {
                      navigate(`/documents/folder/${targetId}`);
                    }
                  }
                }
              }}
            >
              {folder.name}
            </span>
          ]).flat()}
        </div>
        {/* Search and Filters */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-4 lg:justify-start animate-fade-in animation-delay-[0.15s]">
          <div className="flex-1 min-w-[180px] max-w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search in this folder..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Task Filter */}
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="hidden sm:block rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[100px] max-w-[140px] flex-shrink-0"
          >
            <option value="All">All Tasks</option>
            {visibleTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>

          {/* File Type Filter */}
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="hidden sm:block rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[90px] max-w-[120px] flex-shrink-0"
          >
            {fileTypeCategories.map(type => (
              <option key={type} value={type}>
                {type === "All" ? "All Types" : type}
              </option>
            ))}
          </select>
          {/* Unified Controls Row (mobile: single line) */}
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 flex-shrink-0">
            <FilterDropdown
              filters={[
                {
                  id: 'task',
                  label: 'Tasks',
                  options: [
                    { value: 'All', label: 'All Tasks' },
                    { value: 'no-task', label: 'No Task Assigned' },
                    ...visibleTasks.map(task => ({ value: task.id, label: task.title }))
                  ]
                },
                {
                  id: 'fileType',
                  label: 'File Types',
                  options: fileTypeCategories.map(type => ({
                    value: type,
                    label: type === "All" ? "All Types" : type
                  }))
                }
              ]}
              selectedFilters={{
                task: selectedTask !== 'All' ? [selectedTask] : [],
                fileType: selectedFileType !== 'All' ? [selectedFileType] : []
              }}
              onFilterChange={(filterId, values) => {
                if (filterId === 'task') {
                  setSelectedTask(values.length > 0 ? values[0] : 'All');
                } else if (filterId === 'fileType') {
                  setSelectedFileType(values.length > 0 ? values[0] : 'All');
                }
              }}
              className="flex-shrink-0"
            />

            <div className="flex border border-input rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                <List size={16} />
              </button>
            </div>

            {(searchTerm || selectedTask !== "All" || selectedFileType !== "All") && (
              <ActionButton
                variant="secondary"
                motion="subtle"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTask("All");
                  setSelectedFileType("All");
                }}
                className="whitespace-nowrap"
                text="Clear"
                leftIcon={<X size={16} />}
              />
            )}
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'grid' ? (
          <div className="space-y-6 w-full animate-fade-in animation-delay-[0.2s]">
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4 text-foreground">Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredFolders.map((folder, index) => (
                    <div
                      key={folder.id}
                      className={cn(
                        "relative flex flex-col p-4 cursor-pointer group",
                        "opacity-0 animate-scale-in bg-gray-50 rounded-lg",
                        "border border-gray-200 hover:border-gray-300 hover:bg-gray-100",
                        "h-24 w-full transition-colors duration-150 shadow-sm hover:shadow-md overflow-hidden"
                      )}
                      style={{
                        animationDelay: `${0.05 * index}s`,
                        animationFillMode: "forwards"
                      }}
                      onClick={() => handleFolderClick(folder)}
                    >
                      <div className="flex items-center justify-between h-full">
                        <div className="flex items-center flex-1 min-w-0 pr-2">
                          <div className="w-10 h-10 rounded bg-blue-100 border border-blue-200 flex items-center justify-center mr-3 flex-shrink-0">
                            <Folder className="text-blue-600" size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingFolderId === folder.id ? (
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                onBlur={() => handleUpdateFolder(folder.id, editingFolderName)}
                                onKeyDown={(e) => handleKeyPress(e, folder.id)}
                                className="w-full bg-white border border-blue-300 rounded px-2 py-1 outline-none text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <p className="font-medium truncate text-sm">{folder.name}</p>
                            )}
                          </div>
                        </div>

                        {(hasPermission('folders', 'update') || hasPermission('folders', 'delete')) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="left" sideOffset={5} className="w-48">
                              {hasPermission('folders', 'update') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingFolder(folder);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>)}
                              {hasPermission('folders', 'delete') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteFolderModal(folder);
                                  }}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredDocuments.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4 text-foreground">Files</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "relative cursor-pointer group opacity-0 animate-scale-in",
                        "bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100",
                        "transition-colors duration-150 shadow-sm hover:shadow-md",
                        "flex flex-col p-4 h-full w-full min-h-[130px]"
                      )}
                      style={{
                        animationDelay: `${0.05 * (filteredFolders.length + index)}s`,
                        animationFillMode: "forwards"
                      }}
                      onClick={() => {
                        setSelectedDocument(doc);
                        setShowDocumentPreview(true);
                      }}
                    >
                      <div className="flex flex-col h-full">
                        {/* Header with file icon, name and menu */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-8 h-8 rounded bg-blue-100 border border-blue-200 flex items-center justify-center mr-2 flex-shrink-0">
                              {getFileIcon(doc.files?.[0]?.fileType || doc.type)}
                            </div>
                            <p className="font-medium truncate text-sm leading-tight" title={doc.name}>
                              {doc.name}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors duration-150 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="left" sideOffset={5} className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadDocument(doc);
                                }}
                                className="cursor-pointer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              {hasPermission('documents', 'update') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDocument(doc);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>)}
                              {hasPermission('documents', 'update') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateVersion(doc);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Create Version
                                </DropdownMenuItem>
                              )}
                              {hasPermission('documents', 'delete') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDocumentFile(doc.id);
                                  }}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* File details */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="uppercase font-medium">
                            {doc?.files?.[0]?.fileType || doc.type || 'FILE'}
                          </span>
                          {(doc.files?.[0]?.fileSize || doc.size !== '0 KB') && (
                            <span className="font-medium">
                              {doc.files?.[0]?.fileSize ? formatFileSize(doc.files[0].fileSize) : doc.size}
                            </span>
                          )}
                        </div>

                        {/* Bottom row with date and badges */}
                        <div className="flex items-center justify-between mt-auto pb-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(doc.files?.[0]?.updatedAt ? new Date(doc.files[0].updatedAt).toISOString() : doc.updatedAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            {((doc?.files?.[0]?.version && doc.files[0].version > 1) || (doc.version && doc.version > 1)) && (
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm text-[10px] font-medium">
                                v{doc?.files?.[0]?.version || doc.version || 1}
                              </span>
                            )}
                            {doc.accessType === 'SELECTED_USERS' && (
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm text-[10px] font-medium">
                                Restricted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {filteredDocuments.length === 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4 text-foreground">Files</h2>
                <GlassCard className="p-8 text-center">
                  <File className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-xl font-medium mb-2">No files found</h3>
                  <p className="text-muted-foreground">Try uploading files or adjusting filters.</p>
                  {hasPermission('documents', 'create') && (
                    <div className="mt-6 flex justify-center">
                      <ActionButton onClick={() => setIsUploadDialogOpen(true)} variant="primary" motion="subtle" text="Upload Files" leftIcon={<Upload size={18} />} />
                    </div>
                  )}
                </GlassCard>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 w-full animate-fade-in animation-delay-[0.2s]">
            {(() => {
              if (filteredFolders.length === 0 && filteredDocuments.length === 0) {
                return (
                  <GlassCard className="p-8 text-center">
                    <Folder className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-xl font-medium mb-2">This folder is empty</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm ? 'No items match your search.' : 'No files or folders found. Upload files or create a new folder to get started.'}
                    </p>
                    {!searchTerm && (
                      <div className="flex items-center justify-center gap-3">
                        {hasPermission('folders', 'create') && (
                          <ActionButton onClick={handleCreateFolder} variant="secondary" motion="subtle" text="New Folder" leftIcon={<Plus size={18} />} />
                        )}
                        {hasPermission('documents', 'create') && (
                          <ActionButton onClick={() => setIsUploadDialogOpen(true)} variant="primary" motion="subtle" text="Upload Files" leftIcon={<Upload size={18} />} />
                        )}
                      </div>
                    )}
                  </GlassCard>
                );
              }

              return (
                <GlassCard className="p-6">
                  <div className="space-y-2">
                    {/* List Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                      <div className="col-span-5">Name</div>
                      <div className="col-span-2">Task</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Modified</div>
                      {(hasPermission('folders', 'update') || hasPermission('folders', 'delete')) && <div className="col-span-1">Actions</div>}
                    </div>

                    {/* Folders */}
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer rounded-lg group"
                        onClick={() => handleFolderClick(folder)}
                      >
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <Folder className="text-blue-500 flex-shrink-0" size={20} />
                          {editingFolderId === folder.id ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onBlur={() => handleUpdateFolder(folder.id, editingFolderName)}
                              onKeyDown={(e) => handleKeyPress(e, folder.id)}
                              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="font-medium truncate group-hover:text-primary transition-colors">
                              {folder.name}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground truncate">
                          {projects.find(p => p.id === folder.projectId)?.title || '-'}
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          Folder
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          {formatDate(folder.createdAt)}
                        </div>
                        <div className="col-span-1 flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="left" sideOffset={5} className="w-48">
                              {hasPermission('folders', 'update') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingFolder(folder);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>)}
                              {hasPermission('folders', 'delete') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteFolderModal(folder);
                                  }}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}

                    {filteredDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-accent/50 transition-colors rounded-lg group cursor-pointer"
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowDocumentPreview(true);
                        }}
                      >
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          {getFileIcon(document.files?.[0]?.fileType || document.type)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate group-hover:text-primary transition-colors">
                              {document.name}
                            </div>
                            {document.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {document.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground truncate">
                          {getTaskName(document)}
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{formatFileType(document.files?.[0]?.fileType || document.type || '')}</span>
                              {((document.files?.[0]?.version && document.files[0].version > 1) || (document.version && document.version > 1)) && (
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm text-[10px] font-medium">
                                  v{document.files?.[0]?.version || document.version || 1}
                                </span>
                              )}
                            </div>
                            <div className="text-xs">
                              {document.files?.[0]?.fileSize ? formatFileSize(document.files[0].fileSize) : document.size}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          <div>
                            <div>{formatDate(document.files?.[0]?.updatedAt ? new Date(document.files[0].updatedAt).toISOString() : document.updatedAt)}</div>
                            <div className="text-xs">
                              {document.files?.[0]?.createdAt ? 'File uploaded' : 'Document created'}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-1 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(document);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          {hasPermission('documents', 'update') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDocument(document);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {hasPermission('documents', 'create') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateVersion(document);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                              title="Create Version"
                            >
                              <Upload size={14} />
                            </button>
                          )}
                          {hasPermission('documents', 'delete') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocumentFile(document.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded text-destructive"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>)}
                        </div>
                      </div>
                    ))}
                    {filteredDocuments.length === 0 && (
                      <div className="py-6">
                        <GlassCard className="p-8 text-center">
                          <File className="mx-auto mb-4 text-muted-foreground" size={48} />
                          <h3 className="text-xl font-medium mb-2">No files found</h3>
                          <p className="text-muted-foreground">Try uploading files or adjusting filters.</p>
                          {hasPermission('documents', 'create') && (
                            <div className="mt-6 flex justify-center">
                              <ActionButton onClick={() => setIsUploadDialogOpen(true)} variant="primary" motion="subtle" text="Upload Files" leftIcon={<Upload size={18} />} />
                            </div>
                          )}
                        </GlassCard>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })()}
          </div>
        )}

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Create New Folder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Folder Name</label>
                  <Input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolderSubmit();
                      } else if (e.key === 'Escape') {
                        handleCancelCreateFolder();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <ActionButton
                  variant="secondary"
                  motion="subtle"
                  onClick={handleCancelCreateFolder}
                  text="Cancel"
                />
                <ActionButton
                  variant="primary"
                  motion="subtle"
                  onClick={handleCreateFolderSubmit}
                  disabled={!newFolderName.trim()}
                  text="Create"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Dialog */}
        <UploadDocumentDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          folderId={folderId}
          folderName={currentFolder?.name}
          folderProjectId={currentFolder?.projectId}
          onDocumentUploaded={() => {
            try {
              // Refresh documents and folder tree after upload
              if (folderId) {
                dispatch(fetchDocumentsByFolder(folderId));
              }
              const projectId = getProjectId();
              if (projectId) {
                dispatch(fetchFolderTree(projectId));
              }
            } catch (error) {
              console.error('Error refreshing after upload:', error);
            }
          }}
        />

        {/* Delete Folder Modal */}
        <DeleteFolderModal
          open={deleteFolderModal.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteFolderModal({ isOpen: false, folder: null });
            }
          }}
          folder={deleteFolderModal.folder}
          onConfirm={(cascade) => {
            if (deleteFolderModal.folder) {
              handleDeleteFolder(deleteFolderModal.folder.id, cascade);
            }
          }}
        />

        {/* Rename Document Modal */}
        {renameDocumentModal.isOpen && renameDocumentModal.document && (
          <Dialog open={renameDocumentModal.isOpen} onOpenChange={(open) => setRenameDocumentModal({ isOpen: open, document: null })}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Rename Document</DialogTitle>
                <DialogDescription>
                  Enter a new name for the document.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Document Name</label>
                  <Input
                    type="text"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder="Enter document name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameDocument();
                      } else if (e.key === 'Escape') {
                        handleCancelRename();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <ActionButton
                  variant="secondary"
                  motion="subtle"
                  onClick={handleCancelRename}
                  text="Cancel"
                />
                <ActionButton
                  variant="primary"
                  motion="subtle"
                  onClick={handleRenameDocument}
                  disabled={!newDocumentName.trim()}
                  text="Rename"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Document Sidebar */}
        <DocumentSidebar
          document={selectedDocument}
          isOpen={showDocumentPreview}
          onClose={() => {
            setShowDocumentPreview(false);
            setSelectedDocument(null);
          }}
          onDelete={(documentId) => {
            // Close sidebar immediately after deletion
            setShowDocumentPreview(false);
            setSelectedDocument(null);

            // Refresh documents after deletion
            if (folderId) {
              dispatch(fetchDocumentsByFolder(folderId));
            }

            // Refresh folder tree to update document count and structure
            const projectId = getProjectId();
            if (projectId) {
              dispatch(fetchFolderTree(projectId));
            }
          }}
          onEdit={(document) => {
            handleEditDocument(document);
          }}
          onMove={(document) => {
            // Future implementation for move functionality
            toast({
              title: "Coming Soon",
              description: "Move functionality will be available soon.",
            });
          }}
          onRefresh={() => {
            // Refresh documents and folder tree
            if (folderId) {
              dispatch(fetchDocumentsByFolder(folderId));
            }

            const projectId = getProjectId();
            if (projectId) {
              dispatch(fetchFolderTree(projectId));
            }
          }}
        />

        {/* Upload Version Dialog */}
        {versionUploadModal.isOpen && versionUploadModal.document && (
          <UploadVersionDialog
            open={versionUploadModal.isOpen}
            onOpenChange={(open) => {
              if (!open) {
                setVersionUploadModal({ isOpen: false, document: null });
              }
            }}
            document={versionUploadModal.document}
            onVersionUploaded={handleVersionUploadSuccess}
          />
        )}
      </div>
      {hasPermission('documents', 'create') && (
        <Button
          variant="default"
          onClick={() => setIsUploadDialogOpen(true)}
          className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
        >
          <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
        </Button>
      )}
    </PageContainer>
  );
};

export default FolderView;
