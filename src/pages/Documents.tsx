
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
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
  ArrowLeft
} from "lucide-react";
import {
  fetchDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  selectAllDocuments,
  Document,
  DocumentFilterParams
} from "@/redux/slices/documentsSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import { fetchAllTasksByCompany, selectAllTasks } from "@/redux/slices/tasksSlice";
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
  const tasks = useAppSelector(selectAllTasks);
  const folders = useAppSelector(selectAllFolders);
  const loading = useAppSelector((state) => state.documents.loading);
  const folderLoading = useAppSelector(selectFolderLoading);
  const error = useAppSelector((state) => state.documents.error);
  const folderError = useAppSelector(selectFolderError);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedTask, setSelectedTask] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  // Remove local folders state as it's now managed by Redux
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState<string>("");
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
    taskId: '',
    file: null as File | null
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchDocuments({ page: 1, limit: 10 }));
    dispatch(fetchProjects());
    dispatch(fetchAllTasksByCompany());
    dispatch(fetchFolders(undefined));
  }, [dispatch]);

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

  // Filter documents based on search and filters
  const filteredDocuments = documents;

  // Helper functions
  const getProjectName = (document: Document) => {
    return projects.find(p => p.id === document.projectId)?.title || 'No Project';
  };

  const getTaskName = (document: Document) => {
    return tasks.find(t => t.id === document.taskId)?.title || 'No Task';
  };

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
      toast({
        title: "Success",
        description: "Folder created successfully"
      });
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

  const deleteFolderById = async (folderId: string) => {
    try {
      await dispatch(deleteFolderAsync(folderId)).unwrap();
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        setFolderPath([]);
      }
      toast({
        title: "Success",
        description: "Folder deleted successfully"
      });
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

  // Folder navigation functions
  const handleFolderClick = (folderId: string) => {
    if (editingFolderId === folderId) return;
    
    navigateToFolder(folderId);
  };

  const navigateToFolder = (folderId: string | null) => {
    if (folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setSelectedFolderId(folderId);
        setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
      }
    } else {
      setSelectedFolderId(null);
      setFolderPath([]);
    }
  };

  const goBackToParent = () => {
    if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setSelectedFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
    }
  };

  // Get current folder content
  const getCurrentFolderContent = () => {
    const currentFolders = folders.filter(folder => 
      folder.parentId === selectedFolderId
    );
    
    const currentDocuments = selectedFolderId 
      ? folders.find(f => f.id === selectedFolderId)?.documents || []
      : filteredDocuments;
    
    return {
      folders: currentFolders,
      documents: currentDocuments
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
      deleteFolderById(contextMenu.folderId);
    }
    closeContextMenu();
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
      toast({
        title: "Success",
        description: "Folder updated successfully"
      });
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
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
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

  const handleDownloadDocument = (document: Document) => {
    toast({ title: "Download", description: `Downloading ${document.name}...` });
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <MotionButton 
              variant="outline" 
              size="sm" 
              motion="subtle" 
              className="w-full sm:w-auto"
              onClick={createNewFolder}
            >
              <FolderOpen size={16} className="mr-2" /> New Folder
            </MotionButton>
            <MotionButton 
              variant="default" 
              size="sm" 
              motion="subtle"
              onClick={() => setShowUploadModal(true)}
              className="w-full sm:w-auto"
            >
              <Upload size={16} className="mr-2" /> Upload Files
            </MotionButton>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 min-w-0 relative order-1 lg:order-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in animation-delay-[0.15s]">
          <span className="font-medium text-foreground">Documents</span>
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
                      {selectedFolderId ? 'This folder is empty.' : 'No documents match your current filters. Try a different search or category.'}
                    </p>
                    <MotionButton variant="default" motion="subtle" onClick={() => setShowUploadModal(true)}>
                      <Upload size={18} className="mr-2" /> Upload Documents
                    </MotionButton>
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
                  {currentDocuments.length > 0 && (
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
                              animationDelay: `${0.05 * (index % 4)}s`, 
                              animationFillMode: "forwards" 
                            }}
                          >
                            <div className="p-4 flex-1">
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
                                <button 
                                  onClick={() => handleEditDocument(doc)}
                                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div>List view not implemented</div>
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
              <button
                onClick={handleEditFolder}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={handleDownloadFolder}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download size={14} />
                Download
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={handleDeleteFolder}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
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
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
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
                <button
                  onClick={() => {
                    setShowEditFolderModal(false);
                    setSelectedFolderForEdit(null);
                    setEditFolderForm({ name: '', projectId: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Folder
                </button>
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
                <button
                  onClick={cancelDeleteDocument}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDocument}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Documents;
