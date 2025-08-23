
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
  X
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

// Format date to match existing format (e.g., 'August 15, 2023')
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Format file size
const formatFileSize = (bytes: number | string): string => {
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) || 0 : bytes;
  if (numBytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format file type to display simplified version
const formatFileType = (type: string): string => {
  if (!type) return 'Unknown';
  
  // If it's already a simple extension, return as is
  if (!type.includes('/')) {
    return type.toUpperCase();
  }
  
  // Map common MIME types to simple extensions
  const mimeTypeMap: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/msword': 'DOC',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.ms-powerpoint': 'PPT',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
    'application/json': 'JSON',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'application/javascript': 'JS',
    'text/javascript': 'JS'
  };
  
  // Return mapped type or extract extension from MIME type
  if (mimeTypeMap[type]) {
    return mimeTypeMap[type];
  }
  
  // For other MIME types, try to extract a meaningful part
  const parts = type.split('/');
  if (parts.length === 2) {
    const subtype = parts[1];
    // Remove common prefixes and suffixes
    const cleaned = subtype
      .replace(/^vnd\./, '')
      .replace(/^x-/, '')
      .replace(/\+.*$/, '')
      .toUpperCase();
    return cleaned || 'FILE';
  }
  
  return 'FILE';
};

const Documents = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Redux selectors
  const documents = useAppSelector(selectAllDocuments);
  const projects = useAppSelector(selectAllProjects);
  const tasks = useAppSelector(selectAllTasks);
  const loading = useAppSelector((state) => state.documents.loading);
  const error = useAppSelector((state) => state.documents.error);
  
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
  }, [dispatch]);
  
  // Use documents directly since filtering is handled by the API
  const filteredDocuments = documents;
  
  // Get project name from document data
  const getProjectName = (document: Document) => {
    return document.project || 'No Project';
  };
  
  // Get task name from document data
  const getTaskName = (document: Document) => {
    return document.task || 'No Task';
  };
  
  // Handle document deletion
  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      await dispatch(deleteDocument(documentToDelete.id)).unwrap();
      
      // Refetch documents to ensure UI is up to date
      const filters: DocumentFilterParams = {
        page: 1,
        limit: 10
      };
      if (searchTerm) filters.search = searchTerm;
      if (selectedFileType !== "All") filters.fileType = selectedFileType.toLowerCase();
      if (selectedProject !== "All") filters.projectId = selectedProject;
      if (selectedTask !== "All") filters.taskId = selectedTask;
      
      dispatch(fetchDocuments(filters));
      
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
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDeleteDocument = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };
  
  // Handle edit document
  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setIsEditModalOpen(true);
  };
  
  // Handle download document
  const handleDownloadDocument = (document: Document) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };
  
  // Apply filters when selections change
  useEffect(() => {
    const filters: DocumentFilterParams = {
      page: 1,
      limit: 10
    };
    if (searchTerm) filters.search = searchTerm;
    if (selectedFileType !== "All") filters.fileType = selectedFileType.toLowerCase();
    if (selectedProject !== "All") filters.projectId = selectedProject;
    if (selectedTask !== "All") filters.taskId = selectedTask;
    
    dispatch(fetchDocuments(filters));
    dispatch(fetchAllTasksByCompany());
  }, [dispatch, searchTerm, selectedFileType, selectedProject, selectedTask]);
  
  const getFileIcon = (type: string = "") => {
    const formattedType = formatFileType(type);
    switch (formattedType) {
      case "PDF":
        return <FileText className="text-red-500" />;
      case "DOCX":
      case "DOC":
        return <FileText className="text-blue-500" />;
      case "JPG":
      case "PNG":
      case "GIF":
      case "SVG":
        return <FileImage className="text-purple-500" />;
      case "XLSX":
      case "XLS":
      case "CSV":
        return <FileText className="text-green-500" />;
      case "PPTX":
      case "PPT":
        return <FileText className="text-orange-500" />;
      case "ZIP":
        return <File className="text-gray-500" />;
      case "TXT":
      case "HTML":
      case "CSS":
      case "JS":
      case "JSON":
        return <FileText className="text-blue-400" />;
      default:
        return <File className="text-gray-400" />;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Documents</h1>
            <p className="text-muted-foreground">Store and organize all your project files</p>
          </div>
          <div className="flex gap-3">
            <MotionButton variant="outline" size="sm" motion="subtle">
              <FolderOpen size={16} className="mr-2" /> New Folder
            </MotionButton>
            <MotionButton 
              variant="default" 
              size="sm" 
              motion="subtle"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload size={16} className="mr-2" /> Upload Files
            </MotionButton>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="relative">
              <select
                className="appearance-none px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
              >
                {fileTypeCategories.map(fileType => (
                  <option key={fileType} value={fileType}>
                    {fileType}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground" size={16} />
            </div>
            
            <div className="relative">
              <select
                className="appearance-none px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="All">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground" size={16} />
            </div>
            
            <div className="relative">
              <select
                className="appearance-none px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
              >
                <option value="All">All Tasks</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground" size={16} />
            </div>
            
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                className={cn(
                  "px-3 py-2 text-sm",
                  viewMode === "grid" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-background text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </button>
              <button
                className={cn(
                  "px-3 py-2 text-sm",
                  viewMode === "list" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-background text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Document Navigation */}
        <div className="animate-fade-in animation-delay-[0.1s]">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Folder size={16} />
            <span>Documents</span>
            <span>/</span>
            {selectedProject !== "All" && (
              <>
                <span className="font-medium text-foreground">
                  {projects.find(p => p.id === selectedProject)?.title || selectedProject}
                </span>
                <span>/</span>
              </>
            )}
            {selectedFileType !== "All" && (
              <span className="font-medium text-foreground">{selectedFileType}</span>
            )}
          </div>
        </div>

        {/* Document Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">Error loading documents:</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in animation-delay-[0.2s]">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full">
                <GlassCard className="p-8 text-center">
                  <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-xl font-medium mb-2">No Documents Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No documents match your current filters. Try a different search or category.
                  </p>
                  <MotionButton variant="default" motion="subtle">
                    <Upload size={18} className="mr-2" /> Upload Documents
                  </MotionButton>
                </GlassCard>
              </div>
            ) : (
              <>
                {filteredDocuments.map((doc, index) => (
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
                          <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary">
                            <MoreHorizontal size={16} />
                          </button>
                          {/* Dropdown menu would go here */}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium truncate mb-1" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatFileType(doc.type)}
                           {/*  • {formatFileSize(doc.size || 0)} */}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-2 px-4 pb-4 border-t border-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-muted-foreground">{getProjectName(doc)}</span>
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
              </>
            )}
          </div>
        ) : (
          <GlassCard className="animate-fade-in animation-delay-[0.2s]">
            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-xl font-medium mb-2">No Documents Found</h3>
                <p className="text-muted-foreground mb-6">
                  No documents match your current filters. Try a different search or category.
                </p>
                <MotionButton variant="default" motion="subtle">
                  <Upload size={18} className="mr-2" /> Upload Documents
                </MotionButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Task</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Size</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Modified</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 flex items-center gap-2">
                          {getFileIcon(doc.type)}
                          <span className="font-medium">{doc.name}</span>
                        </td>
                        <td className="p-4">{getProjectName(doc)}</td>
                        <td className="p-4">{getTaskName(doc)}</td>
                        <td className="p-4">{formatFileType(doc.type)}</td>
                        <td className="p-4">{formatFileSize(doc.size || 0)}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span>{formatDate(doc.createdAt)}</span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <UserCircle size={12} className="mr-1" /> Unknown
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={() => handleEditDocument(doc)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteDocument(doc)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        )}
      </div>
      
      {/* Edit Document Modal */}
      {isEditModalOpen && editingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Document</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Name</label>
                <input 
                  type="text" 
                  value={editingDocument.name}
                  onChange={(e) => setEditingDocument({...editingDocument, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select 
                  value={editingDocument.projectId || ''}
                  onChange={(e) => setEditingDocument({...editingDocument, projectId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Task</label>
                <select 
                  value={editingDocument.taskId || ''}
                  onChange={(e) => setEditingDocument({...editingDocument, taskId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Task</option>
                  {tasks
                    .filter(task => !editingDocument.projectId || task.project?.id === editingDocument.projectId)
                    .map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1">Description</label>
                 <textarea 
                   value={editingDocument.description || ''}
                   onChange={(e) => setEditingDocument({...editingDocument, description: e.target.value})}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Document description..."
                 />
               </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                   try {
                     const result = await dispatch(updateDocument({
                       id: editingDocument.id,
                       documentData: {
                         title: editingDocument.name,
                         projectId: editingDocument.projectId,
                         taskId: editingDocument.taskId,
                         content: editingDocument.description
                       }
                     })).unwrap();
                     
                     // Refetch documents to ensure UI is up to date
                      const filters: DocumentFilterParams = {
                        page: 1,
                        limit: 10
                      };
                      if (searchTerm) filters.search = searchTerm;
                      if (selectedFileType !== "All") filters.fileType = selectedFileType;
                      if (selectedProject !== "All") filters.projectId = selectedProject;
                      if (selectedTask !== "All") filters.taskId = selectedTask;
                      
                      dispatch(fetchDocuments(filters));
                     
                     setIsEditModalOpen(false);
                     toast({
                       title: "Success",
                       description: result.message || "Document updated successfully",
                     });
                   } catch (error) {
                     toast({
                       title: "Error",
                       description: typeof error === 'string' ? error : "Failed to update document",
                       variant: "destructive"
                     });
                   }
                 }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Document</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Document title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Document description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select 
                  value={uploadForm.projectId}
                  onChange={(e) => setUploadForm({...uploadForm, projectId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Task (Optional)</label>
                <select 
                  value={uploadForm.taskId}
                  onChange={(e) => setUploadForm({...uploadForm, taskId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Task</option>
                  {tasks
                    .filter(task => !uploadForm.projectId || task.project?.id === uploadForm.projectId)
                    .map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">File (Optional)</label>
                <input 
                  type="file"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                />
                <p className="text-sm text-gray-500 mt-1">Upload a file or create a text-only document</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                    if (uploadForm.title) {
                      try {
                        const documentData = {
                          title: uploadForm.title,
                          content: uploadForm.description,
                          projectId: uploadForm.projectId || undefined,
                          taskId: uploadForm.taskId || undefined,
                          file: uploadForm.file || undefined
                        };
                        
                        await dispatch(createDocument(documentData)).unwrap();
                        toast({ title: 'Success', description: uploadForm.file ? 'Document uploaded successfully' : 'Document created successfully' });
                        setShowUploadModal(false);
                        setUploadForm({ title: '', description: '', projectId: '', taskId: '', file: null });
                      } catch (error) {
                        toast({ title: 'Error', description: 'Failed to create document', variant: 'destructive' });
                      }
                    }
                  }}
                disabled={!uploadForm.title}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Delete Document</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Are you sure you want to permanently delete this document?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                   <p className="font-medium text-gray-900 dark:text-gray-100">
                     {documentToDelete.name}
                   </p>
                 </div>
              </div>
            </div>
            <div className="flex justify-between gap-3">
              <button
                onClick={cancelDeleteDocument}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocument}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Documents;
