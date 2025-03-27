
import React, { useState } from "react";
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
  Folder
} from "lucide-react";

// Mock data for documents
const documents = [
  {
    id: "d1",
    name: "Initial Contract.pdf",
    type: "PDF",
    size: "1.2 MB",
    date: "August 15, 2023",
    project: "Modern Loft Redesign",
    user: "Alex Jones",
    category: "Contracts",
    thumbnail: null
  },
  {
    id: "d2",
    name: "Floor Plan v1.pdf",
    type: "PDF",
    size: "3.4 MB",
    date: "August 22, 2023",
    project: "Modern Loft Redesign",
    user: "Sarah Smith",
    category: "Floor Plans",
    thumbnail: null
  },
  {
    id: "d3",
    name: "Client Requirements.docx",
    type: "DOCX",
    size: "845 KB",
    date: "August 18, 2023",
    project: "Modern Loft Redesign",
    user: "Alex Jones", 
    category: "Requirements",
    thumbnail: null
  },
  {
    id: "d4",
    name: "Mood Board.jpg",
    type: "JPG",
    size: "5.1 MB",
    date: "August 30, 2023",
    project: "Modern Loft Redesign",
    user: "Sarah Smith",
    category: "Images",
    thumbnail: null
  },
  {
    id: "d5",
    name: "Budget Estimate.xlsx",
    type: "XLSX",
    size: "1.7 MB",
    date: "September 5, 2023",
    project: "Coastal Vacation Home",
    user: "Robert Lee",
    category: "Financials",
    thumbnail: null
  },
  {
    id: "d6",
    name: "Material Samples.zip",
    type: "ZIP",
    size: "12.3 MB",
    date: "September 10, 2023",
    project: "Coastal Vacation Home",
    user: "Alex Jones",
    category: "Materials",
    thumbnail: null
  },
  {
    id: "d7",
    name: "Final Presentation.pptx",
    type: "PPTX",
    size: "8.5 MB",
    date: "September 15, 2023",
    project: "Corporate Office Revamp",
    user: "Sarah Smith",
    category: "Presentations",
    thumbnail: null
  },
  {
    id: "d8",
    name: "Installation Instructions.pdf",
    type: "PDF",
    size: "2.8 MB",
    date: "September 20, 2023",
    project: "Corporate Office Revamp",
    user: "Robert Lee",
    category: "Instructions",
    thumbnail: null
  }
];

// Categories for filtering
const categories = [
  "All",
  "Contracts",
  "Floor Plans",
  "Images",
  "Requirements",
  "Financials",
  "Materials",
  "Presentations",
  "Instructions"
];

// Projects for filtering
const projects = [
  "All",
  "Modern Loft Redesign",
  "Coastal Vacation Home",
  "Corporate Office Revamp"
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  
  // Filter documents based on search, category, and project
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory;
    const matchesProject = selectedProject === "All" || doc.project === selectedProject;
    
    return matchesSearch && matchesCategory && matchesProject;
  });
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="text-red-500" />;
      case "DOCX":
        return <FileText className="text-blue-500" />;
      case "JPG":
      case "PNG":
        return <FileImage className="text-purple-500" />;
      case "XLSX":
        return <FileText className="text-green-500" />;
      case "PPTX":
        return <FileText className="text-orange-500" />;
      case "ZIP":
        return <File className="text-gray-500" />;
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
            <MotionButton variant="default" size="sm" motion="subtle">
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
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
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project}
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
                <span className="font-medium text-foreground">{selectedProject}</span>
                <span>/</span>
              </>
            )}
            {selectedCategory !== "All" && (
              <span className="font-medium text-foreground">{selectedCategory}</span>
            )}
          </div>
        </div>

        {/* Document Grid/List */}
        {viewMode === "grid" ? (
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
                          {doc.type} • {doc.size}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          <span>{doc.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-2 px-4 pb-4 border-t border-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-muted-foreground">{doc.project}</span>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                          <Download size={14} />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
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
                      <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
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
                        <td className="p-4">{doc.project}</td>
                        <td className="p-4">{doc.category}</td>
                        <td className="p-4">{doc.type}</td>
                        <td className="p-4">{doc.size}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span>{doc.date}</span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <UserCircle size={12} className="mr-1" /> {doc.user}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <Download size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
                              <Trash2 size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                              <MoreHorizontal size={16} />
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
    </PageContainer>
  );
};

export default Documents;
