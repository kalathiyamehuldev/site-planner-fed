
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";

import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  FolderOpen, 
  File, 
  FileText, 
  FileImage, 
  Download,
  Upload,
  Trash2,
  MoreHorizontal,
  Calendar,
  UserCircle,
  Clock,
  Folder,
  Edit3,
  X,
  ChevronRight,
  ArrowLeft,
  Grid3X3,
  List
} from "lucide-react";
import {
  fetchDocuments,
  fetchDocumentsByFolder,
  fetchRootDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  selectAllDocuments,
  Document,
  DocumentFilterParams
} from "@/redux/slices/documentsSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import {
  fetchFolders,
  createFolder,
  updateFolderAsync,
  deleteFolderAsync,
  selectAllFolders,
  selectFolderLoading,
  selectFolderError,
  updateFolderProjectName,
  Folder as ReduxFolder
} from "@/redux/slices/foldersSlice";
import { useToast } from "@/hooks/use-toast";
import DeleteFolderModal from '@/components/modals/DeleteFolderModal';
import DocumentPreviewModal from '@/components/documents/DocumentPreviewModal';
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import usePermission from "@/hooks/usePermission";
import ActionButton from "@/components/ui/ActionButton";

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

// Utility functions
const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};

const formatFileSize = (bytes: number | string): string => {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatFileType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'application/pdf': 'PDF Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/png': 'PNG Image',
    'application/zip': 'ZIP Archive',
    'text/plain': 'Text Document',
    'application/json': 'JSON File'
  };
  
  return typeMap[type] || type.split('/').pop()?.toUpperCase() || 'Unknown';
};

// Use the Redux Folder type
type Folder = ReduxFolder;

const Documents = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Redux selectors
  const documents = useAppSelector(selectAllDocuments);
  const projects = useAppSelector(selectAllProjects);
  const folders = useAppSelector(selectAllFolders);
  const loading = useAppSelector((state) => state.documents.loading);
  const folderLoading = useAppSelector(selectFolderLoading);
  const error = useAppSelector((state) => state.documents.error);
  const folderError = useAppSelector(selectFolderError);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  // const [selectedTask, setSelectedTask] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  // Remove local folders state as it's now managed by Redux
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState<string>("");
  const [deleteFolderModal, setDeleteFolderModal] = useState<{
    isOpen: boolean;
    folder: Folder | null;
  }>({ isOpen: false, folder: null });
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    folderId: string | null;
    x: number;
    y: number;
  }>({ isOpen: false, folderId: null, x: 0, y: 0 });
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [selectedFolderForEdit, setSelectedFolderForEdit] = useState<Folder | null>(null);
  const [editFolderForm, setEditFolderForm] = useState({
    name: '',
    projectId: ''
  });
  const [newFolderForm, setNewFolderForm] = useState({
    name: '',
    projectId: ''
  });
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    projectId: '',
    // taskId: '',
    file: null as File | null
  });
  const { hasPermission } = usePermission();
  // Load data on component mount
  useEffect(() => {
    // dispatch(fetchRootDocuments());
    
    // Fetch projects only if not already loaded
    if (projects.length === 0) {
      dispatch(fetchProjects());
    }
    
    dispatch(fetchFolders(undefined));
  }, [dispatch, projects.length]);

  // Update folder project names when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && folders.length > 0) {
      folders.forEach(folder => {
        if (folder.projectId && !folder.projectName) {
          const project = projects.find(p => p.id === folder.projectId);
          if (project) {
            dispatch(updateFolderProjectName({ folderId: folder.id, projectName: project.title }));
          }
        }
      });
    }
  }, [projects, folders, dispatch]);

  // Helper functions
  const getProjectName = (document: Document) => {
    return projects.find(p => p.id === document.projectId)?.title || 'No Project';
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(document => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = document.name.toLowerCase().includes(searchLower);
      const matchesDescription = document.description?.toLowerCase().includes(searchLower);
      const matchesProject = getProjectName(document).toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesDescription && !matchesProject) {
        return false;
      }
    }
    
    // Project filter
    if (selectedProject !== "All") {
      if (document.projectId !== selectedProject) {
        return false;
      }
    }
    
    // Task filter
    // if (selectedTask !== "All") {
    //   if (document.taskId !== selectedTask) {
    //     return false;
    //   }
    // }
    
    // File type filter
    if (selectedFileType !== "All") {
      const fileExtension = document.name.split('.').pop()?.toUpperCase();
      const documentType = document.type?.toUpperCase();
      
      // Map file types to extensions and MIME types
      const typeMatches = {
        'PDF': fileExtension === 'PDF' || documentType?.includes('PDF'),
        'DOCX': fileExtension === 'DOCX' || documentType?.includes('WORD') || documentType?.includes('DOCUMENT'),
        'XLSX': fileExtension === 'XLSX' || documentType?.includes('EXCEL') || documentType?.includes('SHEET'),
        'PPTX': fileExtension === 'PPTX' || documentType?.includes('POWERPOINT') || documentType?.includes('PRESENTATION'),
        'JPG': fileExtension === 'JPG' || fileExtension === 'JPEG' || documentType?.includes('JPEG'),
        'PNG': fileExtension === 'PNG' || documentType?.includes('PNG'),
        'ZIP': fileExtension === 'ZIP' || documentType?.includes('ZIP')
      };
      
      if (!typeMatches[selectedFileType as keyof typeof typeMatches]) {
        return false;
      }
    }
    
    return true;
  });
  
  // Filter folders based on search and project
  const filteredFolders = folders.filter(folder => {
    // Only show folders in current directory
    if (folder.parentId !== selectedFolderId) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = folder.name.toLowerCase().includes(searchLower);
      const matchesProject = folder.projectName?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesProject) {
        return false;
      }
    }
    
    // Project filter
    if (selectedProject !== "All") {
      if (folder.projectId !== selectedProject) {
        return false;
      }
    }
    
    return true;
  });

  // Folder management functions
  const createNewFolder = () => {
    setNewFolderForm({ name: '', projectId: '' });
    setShowCreateFolderModal(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderForm.name.trim() || !newFolderForm.projectId) {
      toast({
        title: "Error",
        description: "Please enter a folder name and select a project",
        variant: "destructive"
      });
      return;
    }

    try {
      await dispatch(createFolder({
        name: newFolderForm.name.trim(),
        projectId: newFolderForm.projectId,
        parentId: selectedFolderId || undefined
      })).unwrap();
      
      setShowCreateFolderModal(false);
      setNewFolderForm({ name: '', projectId: '' });
      // Success message will be handled by backend API
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const updateFolderName = async (folderId: string, newName: string) => {
    if (!newName.trim()) {
      cancelEditingFolder();
      return;
    }
    
    try {
      await dispatch(updateFolderAsync({
        id: folderId,
        folderData: { name: newName.trim() }
      })).unwrap();
      setEditingFolderId(null);
      setFolderNameInput('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update folder name",
        variant: "destructive"
      });
      cancelEditingFolder();
    }
  };

  const deleteFolderById = async (folderId: string, cascade: boolean = false) => {
    try {
      await dispatch(deleteFolderAsync({ id: folderId, cascade })).unwrap();
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        setFolderPath([]);
      }
      setDeleteFolderModal({ isOpen: false, folder: null });
      // Success message will be handled by backend API
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  };

  const startEditingFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setFolderNameInput(folder.name);
  };

  const cancelEditingFolder = () => {
    setEditingFolderId(null);
    setFolderNameInput('');
  };

  // Navigation
  const navigate = useNavigate();

  // Folder navigation functions
  const handleFolderClick = (folderId: string) => {
    if (editingFolderId === folderId) return;
    
    navigate(`/documents/folder/${folderId}`);
  };

  const navigateToFolder = (folderId: string | null) => {
    if (folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setSelectedFolderId(folderId);
        setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
        // Fetch documents for this folder
        dispatch(fetchDocumentsByFolder(folderId));
      } else {
        console.error('Folder not found:', folderId);
      }
    } else {
      setSelectedFolderId(null);
      setFolderPath([]);
      // Fetch root documents when going back to root
      // dispatch(fetchRootDocuments());
    }
  };

  const goBackToParent = () => {
    if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      const newSelectedFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      setSelectedFolderId(newSelectedFolderId);
      
      // Fetch documents for the parent folder or all documents if at root
      if (newSelectedFolderId) {
        dispatch(fetchDocumentsByFolder(newSelectedFolderId));
      } 
      // else {
      //   dispatch(fetchRootDocuments());
      // }
    }
  };

  // Get current folder content
  const getCurrentFolderContent = () => {
    return {
      folders: filteredFolders,
      documents: filteredDocuments
    };
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

  const handleDeleteFolder = () => {
    if (contextMenu.folderId) {
      const folder = folders.find(f => f.id === contextMenu.folderId);
      if (folder) {
        setDeleteFolderModal({ isOpen: true, folder });
      }
    }
    closeContextMenu();
  };

  const openDeleteFolderModal = (folder: Folder) => {
    setDeleteFolderModal({ isOpen: true, folder });
  };

  const handleDownloadFolder = () => {
    toast({ title: "Download", description: "Folder download functionality not implemented yet." });
    closeContextMenu();
  };

  const handleEditFolder = () => {
     if (contextMenu.folderId) {
       const folder = folders.find(f => f.id === contextMenu.folderId);
       if (folder) {
         setEditFolderForm({
           name: folder.name,
           projectId: folder.projectId || ''
         });
         setSelectedFolderForEdit(folder);
         setShowEditFolderModal(true);
       }
     }
     closeContextMenu();
   };

  const handleUpdateFolder = async () => {
    if (!selectedFolderForEdit || !editFolderForm.name.trim() || !editFolderForm.projectId) {
      toast({
        title: "Error",
        description: "Please enter a folder name and select a project",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await dispatch(updateFolderAsync({
        id: selectedFolderForEdit.id,
        folderData: {
          name: editFolderForm.name.trim(),
          projectId: editFolderForm.projectId
        }
      })).unwrap();
      
      setShowEditFolderModal(false);
      setSelectedFolderForEdit(null);
      setEditFolderForm({ name: '', projectId: '' });
      // Success message will be handled by backend API
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive"
      });
    }
  };

  // Document management functions
  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (documentToDelete) {
      try {
        await dispatch(deleteDocument(documentToDelete.id)).unwrap();
        // Success message will be handled by backend API
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    }
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const cancelDeleteDocument = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setIsEditModalOpen(true);
  };

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
      
      if (downloadDocument.fulfilled.match(result)) {
        toast({
          title: "Success",
          description: `${document.name} downloaded successfully`,
        });
      } else {
        throw new Error(result.payload as string || 'Download failed');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // File icon helper
  const getFileIcon = (type: string = "") => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('pdf')) {
      return <FileText className="text-red-500" size={20} />;
    } else if (lowerType.includes('doc') || lowerType.includes('word')) {
      return <FileText className="text-blue-500" size={20} />;
    } else if (lowerType.includes('xls') || lowerType.includes('excel') || lowerType.includes('sheet')) {
      return <FileText className="text-green-500" size={20} />;
    } else if (lowerType.includes('ppt') || lowerType.includes('presentation')) {
      return <FileText className="text-orange-500" size={20} />;
    } else if (lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('png') || lowerType.includes('image')) {
      return <FileImage className="text-purple-500" size={20} />;
    } else if (lowerType.includes('zip') || lowerType.includes('archive')) {
      return <File className="text-gray-500" size={20} />;
    } else {
      return <File className="text-gray-500" size={20} />;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8 w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-light mb-2 truncate">Documents</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Store and organize all your project files</p>
          </div>
          {hasPermission('folders', 'create') && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
              <ActionButton 
                variant="primary" 
                motion="subtle" 
                className="w-full sm:w-auto"
                onClick={createNewFolder}
                text="New Folder"
                leftIcon={<FolderOpen size={16} className="mr-2" />}
              >
              </ActionButton>
            </div>
          )}
        </div>

        {/* Search and Filters - Single Line */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 animate-fade-in animation-delay-[0.1s] w-full">
          {/* Search Input */}
          <div className="flex-1 min-w-[180px] max-w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Project Filter */}
          {/* <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[110px] max-w-[150px] flex-shrink-0"
          >
            <option value="All">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          
          {/* Task Filter */}
          {/* <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[100px] max-w-[140px] flex-shrink-0"
          >
            <option value="All">All Tasks</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select> */}
          
          {/* File Type Filter */}
          {/* <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[90px] max-w-[120px] flex-shrink-0"
          >
            {fileTypeCategories.map(type => (
              <option key={type} value={type}>
                {type === "All" ? "All Types" : type}
              </option>
            ))}
          </select> */}
          
          {/* View Mode Toggle */}
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
          
          {/* Clear Filters Button */}
          {(searchTerm || selectedProject !== "All" || selectedFileType !== "All") && (
            <ActionButton
              variant="secondary"
              motion="subtle"
              onClick={() => {
                setSearchTerm("");
                setSelectedProject("All");
                // setSelectedTask("All");
                setSelectedFileType("All");
              }}
              className="whitespace-nowrap"
              text="Clear"
              leftIcon={<X size={16} />}
            />
          )}
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in animation-delay-[0.15s]">
          <span className="font-medium text-foreground">Project Folders</span>
          {folderPath.length > 0 && (
            <>
              <button
                onClick={goBackToParent}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight size={14} />
                  <button
                    onClick={() => {
                      const newPath = folderPath.slice(0, index + 1);
                      setFolderPath(newPath);
                      setSelectedFolderId(folder.id);
                    }}
                    className="hover:text-foreground hover:underline"
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        {/* Content Area */}
        {(loading || folderLoading) ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (error || folderError) ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading data: {error || folderError}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-6 w-full animate-fade-in animation-delay-[0.2s]">
            {(() => {
              const { folders: currentFolders, documents: currentDocuments } = getCurrentFolderContent();
              
              if (currentFolders.length === 0 && currentDocuments.length === 0) {
                return (
                  <GlassCard className="p-8 text-center">
                    <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-xl font-medium mb-2">No Items Found</h3>
                    <p className="text-muted-foreground mb-6">
                      {selectedFolderId ? 'This folder is empty.' : 'No Documents found.'}
                    </p>
                    {hasPermission('folders', 'create') && (
                      <ActionButton 
                        variant="primary" 
                        motion="subtle" 
                        className="w-full sm:w-auto"
                        onClick={createNewFolder}
                        text="New Folder"
                        leftIcon={<FolderOpen size={16} className="mr-2" />}
                      >
                      </ActionButton>
                    )}
                  </GlassCard>
                );
              }
              
              return (
                <>
                  {/* Folders Section */}
                  {currentFolders.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium mb-4 text-foreground">Folders</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentFolders.map((folder, index) => (
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
                            onClick={() => handleFolderClick(folder.id)}
                          >
                            <div className="flex items-center justify-between h-full">
                              <div className="flex items-center flex-1 min-w-0 pr-2">
                                <div className="w-10 h-10 rounded bg-blue-100 border border-blue-200 flex items-center justify-center mr-3 flex-shrink-0">
                                   <Folder className="text-blue-600" size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingFolderId === folder.id ? (
                                    <input
                                      type="text"
                                      value={folderNameInput}
                                      onChange={(e) => setFolderNameInput(e.target.value)}
                                      onBlur={() => updateFolderName(folder.id, folderNameInput)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          updateFolderName(folder.id, folderNameInput);
                                        } else if (e.key === 'Escape') {
                                          cancelEditingFolder();
                                        }
                                      }}
                                      className="font-medium text-sm bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 focus:outline-none focus:border-gray-400 w-full"
                                      autoFocus
                                      onFocus={(e) => e.target.select()}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <div className="space-y-1">
                                      <h3 
                                         className="font-semibold text-sm truncate text-gray-800 leading-tight" 
                                         title={folder.name}
                                       >
                                         {folder.name}
                                       </h3>
                                       {folder.projectName && (
                                         <p className="text-xs text-gray-500 truncate leading-tight" title={folder.projectName}>
                                           {folder.projectName}
                                         </p>
                                       )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <button 
                                   className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-150"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     openContextMenu(e, folder.id);
                                   }}
                                 >
                                   <MoreHorizontal size={16} />
                                 </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Documents Section */}
                  {/* {currentDocuments.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium mb-4 text-foreground">Files</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {currentDocuments.map((doc, index) => (
                          <GlassCard 
                            key={doc.id}
                            className={cn(
                              "flex flex-col h-full overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer group",
                              "opacity-0 animate-scale-in"
                            )}
                            style={{ 
                              animationDelay: `${0.05 * (currentFolders.length + index)}s`, 
                              animationFillMode: "forwards" 
                            }}
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDocumentPreview(true);
                            }}
                          >
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  {getFileIcon(doc.type)}
                                </div>
                                <div className="relative">
                                  <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                                    <MoreHorizontal size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-medium truncate mb-1" title={doc.name}>
                                  {doc.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {formatFileType(doc.type)}
                                </p>
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar size={12} />
                                  <span>{formatDate(doc.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-auto pt-2 px-4 pb-4 border-t border-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-muted-foreground truncate" title={getProjectName(doc)}>{getProjectName(doc)}</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                                >
                                  <Download size={14} />
                                </button>
                                {hasPermission('documents', 'update') && (
                                  <button 
                                    onClick={() => handleEditDocument(doc)}
                                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                )}
                                {hasPermission('documents', 'delete') && (
                                  <button 
                                    onClick={() => handleDeleteDocument(doc)}
                                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  )} */}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-6 w-full animate-fade-in animation-delay-[0.2s]">
            {(() => {
              const { folders: currentFolders, documents: currentDocuments } = getCurrentFolderContent();
              
              if (currentFolders.length === 0 && currentDocuments.length === 0) {
                return (
                  <GlassCard className="p-8 text-center">
                    <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-xl font-medium mb-2">No Items Found</h3>
                    <p className="text-muted-foreground mb-6">
                      {selectedFolderId ? 'This folder is empty.' : 'No Documents found.'}
                    </p>
                    {hasPermission('folders', 'create') && (
                      <ActionButton 
                        variant="primary" 
                        motion="subtle" 
                        className="w-full sm:w-auto"
                        onClick={createNewFolder}
                        text="New Folder"
                        leftIcon={<FolderOpen size={16} className="mr-2" />}
                      >
                      </ActionButton>
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
                      <div className="col-span-2">Project</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Modified</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    
                    {/* Folders */}
                    {currentFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer rounded-lg group"
                        onClick={() => handleFolderClick(folder.id)}
                        onContextMenu={(e) => openContextMenu(e, folder.id)}
                      >
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          <Folder className="text-blue-500 flex-shrink-0" size={20} />
                          {editingFolderId === folder.id ? (
                            <input
                              type="text"
                              value={folderNameInput}
                              onChange={(e) => setFolderNameInput(e.target.value)}
                              onBlur={() => updateFolderName(folder.id, folderNameInput)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateFolderName(folder.id, folderNameInput);
                                } else if (e.key === 'Escape') {
                                  cancelEditingFolder();
                                }
                              }}
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
                          {folder.projectName || '-'}
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          Folder
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          {formatDate(folder.createdAt)}
                        </div>
                        <div className="col-span-1 flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openContextMenu(e, folder.id);
                            }}
                            className="p-1 hover:bg-accent rounded text-[#1a2624]/60 hover:text-[#1a2624]"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Documents */}
                    {currentDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-accent/50 transition-colors rounded-lg group cursor-pointer"
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowDocumentPreview(true);
                        }}
                      >
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          {getFileIcon(document.type)}
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
                          {getProjectName(document)}
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          <div>
                            <div>{formatFileType(document.type || '')}</div>
                            <div className="text-xs">{formatFileSize(document.size || 0)}</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                          {formatDate(document.updatedAt)}
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-accent rounded text-[#1a2624]/60 hover:text-[#1a2624]"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadDocument(document);
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
                                    handleEditDocument(document);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {hasPermission('documents', 'delete') && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDocument(document);
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
                  </div>
                </GlassCard>
              );
            })()}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={closeContextMenu}
            />
            <div 
              className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              {hasPermission('folders', 'update') && (
              <button
                onClick={handleEditFolder}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Edit
              </button>)}
              <button
                onClick={handleDownloadFolder}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download size={14} />
                Download
              </button>
              <div className="border-t border-gray-200 my-1" />
              {hasPermission('folders', 'delete') && (
                <button
                  onClick={handleDeleteFolder}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </>
        )}

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Create New Folder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Folder Name</label>
                  <input
                    type="text"
                    value={newFolderForm.name}
                    onChange={(e) => setNewFolderForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter folder name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project</label>
                  <select
                    value={newFolderForm.projectId}
                    onChange={(e) => setNewFolderForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <ActionButton
                  onClick={() => setShowCreateFolderModal(false)}
                  variant="secondary"
                  motion="subtle"
                  text="Cancel"
                />
                <ActionButton
                  onClick={handleCreateFolder}
                  variant="primary"
                  motion="subtle"
                  text="Create"
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Folder Modal */}
        {showEditFolderModal && selectedFolderForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Edit Folder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Folder Name</label>
                  <input
                    type="text"
                    value={editFolderForm.name}
                    onChange={(e) => setEditFolderForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter folder name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project</label>
                  <select
                    value={editFolderForm.projectId}
                    onChange={(e) => setEditFolderForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <ActionButton
                  onClick={() => {
                    setShowEditFolderModal(false);
                    setSelectedFolderForEdit(null);
                    setEditFolderForm({ name: '', projectId: '' });
                  }}
                  variant="secondary"
                  motion="subtle"
                  text="Cancel"
                />
                <ActionButton
                  onClick={handleUpdateFolder}
                  variant="primary"
                  motion="subtle"
                  text="Update Folder"
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && documentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Delete Document</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{documentToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <ActionButton
                  onClick={cancelDeleteDocument}
                  variant="secondary"
                  motion="subtle"
                  text="Cancel"
                />
                <ActionButton
                  onClick={confirmDeleteDocument}
                  variant="primary"
                  motion="subtle"
                  text="Delete"
                  className="bg-red-600 hover:bg-red-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Document Dialog */}
        <UploadDocumentDialog
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          folderId={selectedFolderId}
          folderName={selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : undefined}
          folderProjectId={selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.projectId : undefined}
          onDocumentUploaded={() => {
            // Refresh documents after upload
            dispatch(fetchDocuments({ page: 1, limit: 10 }));
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
              deleteFolderById(deleteFolderModal.folder.id, cascade);
            }
          }}
        />

        {/* Document Preview Modal */}
        {selectedDocument && (
          <DocumentPreviewModal
            document={selectedDocument}
            isOpen={showDocumentPreview}
            onClose={() => {
              setShowDocumentPreview(false);
              setSelectedDocument(null);
            }}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default Documents;
