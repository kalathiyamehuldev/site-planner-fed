
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  Image, 
  Download, 
  Trash2,
  Grid,
  List,
  MoreHorizontal,
  FileImage, 
  ArrowUpToLine,
  Copy
} from "lucide-react";

// Mock data for images
const mockImages = [
  {
    id: "img1",
    name: "Mood Board - Modern Loft",
    category: "Mood Boards",
    project: "Modern Loft Redesign",
    date: "2023-08-15",
    type: "JPG",
    size: "5.1 MB",
    tags: ["modern", "loft", "inspiration"],
    thumbnail: null
  },
  {
    id: "img2",
    name: "Material Palette",
    category: "Materials",
    project: "Modern Loft Redesign",
    date: "2023-08-20",
    type: "PNG",
    size: "3.8 MB",
    tags: ["materials", "palette", "textures"],
    thumbnail: null
  },
  {
    id: "img3",
    name: "Living Room Concept",
    category: "Renderings",
    project: "Coastal Vacation Home",
    date: "2023-08-25",
    type: "JPG",
    size: "8.2 MB",
    tags: ["living room", "concept", "rendering"],
    thumbnail: null
  },
  {
    id: "img4",
    name: "Kitchen Elevation",
    category: "Elevations",
    project: "Modern Loft Redesign",
    date: "2023-09-01",
    type: "JPG",
    size: "4.5 MB",
    tags: ["kitchen", "elevation", "drawing"],
    thumbnail: null
  },
  {
    id: "img5",
    name: "Color Scheme Options",
    category: "Color Schemes",
    project: "Corporate Office Revamp",
    date: "2023-09-05",
    type: "PNG",
    size: "2.7 MB",
    tags: ["colors", "palette", "corporate"],
    thumbnail: null
  },
  {
    id: "img6",
    name: "Bathroom Fixtures",
    category: "Product Photos",
    project: "Luxury Apartment Redesign",
    date: "2023-09-10",
    type: "JPG",
    size: "6.3 MB",
    tags: ["bathroom", "fixtures", "products"],
    thumbnail: null
  },
  {
    id: "img7",
    name: "Furniture Layout",
    category: "Space Planning",
    project: "Corporate Office Revamp",
    date: "2023-09-15",
    type: "PNG",
    size: "4.9 MB",
    tags: ["layout", "furniture", "planning"],
    thumbnail: null
  },
  {
    id: "img8",
    name: "Lighting Concepts",
    category: "Lighting",
    project: "Restaurant Interior",
    date: "2023-09-20",
    type: "JPG",
    size: "5.5 MB",
    tags: ["lighting", "concept", "restaurant"],
    thumbnail: null
  }
];

// Categories for filtering
const categories = [
  "All",
  "Mood Boards",
  "Materials",
  "Renderings",
  "Elevations",
  "Color Schemes",
  "Product Photos",
  "Space Planning",
  "Lighting"
];

// Projects for filtering
const projects = [
  "All",
  "Modern Loft Redesign",
  "Coastal Vacation Home",
  "Corporate Office Revamp",
  "Luxury Apartment Redesign",
  "Restaurant Interior"
];

const ImageLibrary = () => {
  const [images, setImages] = useState(mockImages);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filter images based on search, category and project
  const filteredImages = images.filter(image => {
    const matchesSearch = 
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || image.category === selectedCategory;
    const matchesProject = selectedProject === "All" || image.project === selectedProject;
    
    return matchesSearch && matchesCategory && matchesProject;
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Image Library</h1>
            <p className="text-muted-foreground">Store and organize design images and inspiration</p>
          </div>
          <MotionButton variant="default" motion="subtle">
            <ArrowUpToLine size={18} className="mr-2" /> Upload Images
          </MotionButton>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search images by name or tags..."
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
                <Grid size={16} />
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
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Image Library */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in animation-delay-[0.2s]">
            {filteredImages.length === 0 ? (
              <div className="col-span-full">
                <GlassCard className="p-8 text-center">
                  <FileImage className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-xl font-medium mb-2">No Images Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No images match your current filters. Try a different search or category.
                  </p>
                  <MotionButton variant="default" motion="subtle">
                    <ArrowUpToLine size={18} className="mr-2" /> Upload New Images
                  </MotionButton>
                </GlassCard>
              </div>
            ) : (
              filteredImages.map((image, index) => (
                <GlassCard 
                  key={image.id}
                  className="overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center relative group">
                    {image.thumbnail ? (
                      <img 
                        src={image.thumbnail} 
                        alt={image.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="text-muted-foreground" size={48} />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-white">
                        <Download size={18} />
                      </button>
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-white">
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium truncate" title={image.name}>
                          {image.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{image.project}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                        {image.type}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {image.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(image.date)}
                      </span>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                          <Download size={16} />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        ) : (
          <GlassCard className="animate-fade-in animation-delay-[0.2s]">
            {filteredImages.length === 0 ? (
              <div className="p-8 text-center">
                <FileImage className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-xl font-medium mb-2">No Images Found</h3>
                <p className="text-muted-foreground mb-6">
                  No images match your current filters. Try a different search or category.
                </p>
                <MotionButton variant="default" motion="subtle">
                  <ArrowUpToLine size={18} className="mr-2" /> Upload New Images
                </MotionButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Preview</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date Added</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Size</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredImages.map(image => (
                      <tr key={image.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-12 bg-secondary/50 rounded flex items-center justify-center">
                            {image.thumbnail ? (
                              <img 
                                src={image.thumbnail} 
                                alt={image.name} 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <FileImage className="text-muted-foreground" size={24} />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium">
                          <div>
                            <p>{image.name}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {image.tags.map((tag, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{image.category}</td>
                        <td className="p-4">{image.project}</td>
                        <td className="p-4">{formatDate(image.date)}</td>
                        <td className="p-4">{image.type}</td>
                        <td className="p-4">{image.size}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <Download size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <Copy size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
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
    </PageContainer>
  );
};

export default ImageLibrary;
