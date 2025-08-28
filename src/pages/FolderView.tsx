import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchDocumentsByFolder,
  deleteDocument,
  selectAllDocuments,
  Document
} from '@/redux/slices/documentsSlice';
import { fetchProjects, selectAllProjects } from '@/redux/slices/projectsSlice';
import { fetchAllTasksByCompany, selectAllTasks } from '@/redux/slices/tasksSlice';
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
import { MotionButton } from '@/components/ui/motion-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  MoreVertical,
  ArrowLeft,
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Trash2,
  Edit3,
  ChevronRight,
  Upload
} from 'lucide-react';
import UploadDocumentDialog from '@/components/documents/UploadDocumentDialog';
import DeleteFolderModal from '@/components/DeleteFolderModal';
import { useToast } from '@/hooks/use-toast';

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

// Utility function for formatting file size
const formatFileSize = (bytes: number | string): string => {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const documents = useAppSelector(selectAllDocuments);
  const projects = useAppSelector(selectAllProjects);
  const tasks = useAppSelector(selectAllTasks);
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
  const editInputRef = useRef<HTMLInputElement>(null);
  
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
    return currentFolder?.documents || documents.filter(doc => doc.folderId === folderId);
  }, [currentFolder, documents, folderId]);
  
  const subFolders = useMemo(() => {
    return currentFolder?.children || folders.filter(f => f.parentId === folderId);
  }, [currentFolder, folders, folderId]);
  
  // Add a separate loading state for initial folder data
  const [initialLoading, setInitialLoading] = useState(true);
  
  useEffect(() => {
    if (folderId) {
      setInitialLoading(true);
      
      // Always fetch folder by ID first to get project ID, then fetch tree
      dispatch(fetchFolderById(folderId)).then((action) => {
        if (action.payload && typeof action.payload === 'object' && 'projectId' in action.payload) {
          const folder = action.payload as FolderType;
          if (folder.projectId) {
            dispatch(fetchFolderTree(folder.projectId)).then(() => {
              setInitialLoading(false);
            });
          } else {
            setInitialLoading(false);
          }
        } else {
          setInitialLoading(false);
        }
      });
      
      // Fetch projects and tasks only if not already loaded
      if (projects.length === 0) {
        dispatch(fetchProjects());
      }
      if (tasks.length === 0) {
        dispatch(fetchAllTasksByCompany());
      }
    }
  }, [dispatch, folderId, projects.length, tasks.length]);
  
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
  
  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await dispatch(deleteDocument(id)).unwrap();
        // Success message will be handled by backend API
      } catch (error) {
        console.error('Failed to delete document:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete document',
          variant: 'destructive',
        });
      }
    }
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
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  const filteredDocuments = folderDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFolders = subFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
      <div className="space-y-8 w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4 mb-2">
              <MotionButton
                variant="outline"
                size="sm"
                motion="subtle"
                onClick={handleBackClick}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </MotionButton>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light mb-2 truncate">{currentFolder?.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage files and folders in this directory</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <MotionButton
              variant="outline"
              size="sm"
              motion="subtle"
              className="w-full sm:w-auto"
              onClick={handleCreateFolder}
            >
              <Plus size={16} className="mr-2" /> New Folder
            </MotionButton>
            <MotionButton
              variant="default"
              size="sm"
              motion="subtle"
              onClick={() => setIsUploadDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Upload size={16} className="mr-2" /> Upload Files
            </MotionButton>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in animation-delay-[0.1s]">
          <span 
            className="font-medium text-foreground cursor-pointer hover:text-primary"
            onClick={() => navigate('/documents')}
          >
            Documents
          </span>
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} />
              <span 
                className={cn(
                  index === breadcrumbs.length - 1 
                    ? 'text-foreground font-medium cursor-default' 
                    : 'cursor-pointer hover:text-foreground hover:underline'
                )}
                onClick={() => {
                  if (index !== breadcrumbs.length - 1) {
                    navigate(`/documents/folder/${folder.id}`);
                  }
                }}
              >
                {folder.name}
              </span>
            </React.Fragment>
          ))}
        </div>
        {/* Search */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 animate-fade-in animation-delay-[0.15s]">
          <div className="flex-1 min-w-0 relative order-1 lg:order-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search in this folder..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      
        {/* Content Area */}
        <div className="space-y-6 w-full animate-fade-in animation-delay-[0.2s]">
          {/* Folders */}
          {filteredFolders.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-4 text-foreground">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map((folder, index) => (
                <div 
                  key={folder.id}
                  className={cn(
                    "relative flex flex-col p-3 cursor-pointer group",
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
                            className="w-full bg-transparent border-none outline-none text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="font-medium truncate text-sm">{folder.name}</p>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingFolder(folder);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
          {/* Documents */}
          {filteredDocuments.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-4 text-foreground">Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((document, index) => {
                  const project = projects.find(p => p.id === document.projectId);
                  const task = tasks.find(t => t.id === document.taskId);
                  
                  return (
                    <div 
                      key={document.id}
                      className={cn(
                        "relative flex flex-col p-4 cursor-pointer group",
                        "opacity-0 animate-scale-in bg-white rounded-lg",
                        "border border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                        "transition-colors duration-150 shadow-sm hover:shadow-md overflow-hidden"
                      )}
                      style={{ 
                        animationDelay: `${0.05 * index}s`, 
                        animationFillMode: "forwards" 
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0">
                          {getFileIcon(document.type)}
                        </div>
                        
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-150"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(document.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm mb-2">{document.name}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <span className="truncate">{project?.title || 'No Project'}</span>
                          </div>
                          {task && (
                            <div className="flex items-center">
                              <span className="truncate">Task: {task.title}</span>
                            </div>
                          )}
                          <div className="text-gray-500">{formatFileSize(document.size)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        
          {/* Empty State */}
          {filteredFolders.length === 0 && filteredDocuments.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Folder className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-xl font-medium mb-2">This folder is empty</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'No items match your search.' : 'Create a new folder or upload documents to get started.'}
              </p>
              {!searchTerm && (
                <div className="flex items-center justify-center gap-3">
                  <MotionButton onClick={handleCreateFolder} variant="outline" motion="subtle">
                    <Plus size={18} className="mr-2" /> New Folder
                  </MotionButton>
                  <MotionButton onClick={() => setIsUploadDialogOpen(true)} variant="default" motion="subtle">
                    <Upload size={18} className="mr-2" /> Upload Files
                  </MotionButton>
                </div>
              )}
            </GlassCard>
          )}
        </div>
        
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
                <Button
                  variant="outline"
                  onClick={handleCancelCreateFolder}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolderSubmit}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
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
            // Refresh documents after upload
            if (folderId) {
              dispatch(fetchDocumentsByFolder(folderId));
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
      </div>
    </PageContainer>
  );
};

export default FolderView;