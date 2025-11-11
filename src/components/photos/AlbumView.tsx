import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  Image as ImageIcon,
  Pencil,
  MoreHorizontal,
  X,
  Search,
  Filter,
  Grid,
  List,
  Check,
  Square,
  MapPin,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import usePermission from "@/hooks/usePermission";
import {
  fetchVisitById,
  updateVisit,
  selectSelectedVisit,
  selectVisitsLoading,
  selectVisitsError,
  clearSelectedVisit,
} from "@/redux/slices/visitsSlice";
import {
  fetchPhotosByVisit,
  uploadPhotoToVisit,
  updatePhoto,
  assignLocation,
  deletePhoto,
  selectAllPhotos,
  selectPhotosLoading,
  selectPhotosError,
  selectUploadProgress,
  clearPhotos,
} from "@/redux/slices/photosSlice";
import {
  fetchLocationsByProject,
  selectLocationsByProject,
} from "@/redux/slices/locationsSlice";

const AlbumView: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();

  // Redux state
  const visit = useAppSelector(selectSelectedVisit);
  const photos = useAppSelector(selectAllPhotos);
  const visitLoading = useAppSelector(selectVisitsLoading);
  const photosLoading = useAppSelector(selectPhotosLoading);
  const visitError = useAppSelector(selectVisitsError);
  const photosError = useAppSelector(selectPhotosError);
  const uploadProgress = useAppSelector(selectUploadProgress);
  const availableProjectLocations = useAppSelector(state => selectLocationsByProject(state, visit?.projectId || ''));

  // Local state
  const [isEditDescriptionOpen, setIsEditDescriptionOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'location'>('date');
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null);
  const [editPhotoData, setEditPhotoData] = useState({
    caption: "",
    tags: "",
    locationId: "",
  });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkLocationId, setBulkLocationId] = useState("");
  

  // Permissions
  const canView = hasPermission("photos", "read");
  const canManage = hasPermission("photos", "manage");
  const canUpload = hasPermission("photos", "create");
  const canDelete = hasPermission("photos", "delete");

  useEffect(() => {
    if (!canView) {
      navigate("/photos");
      return;
    }

    if (visitId) {
      // Fetch visit details and photos
      dispatch(fetchVisitById(visitId));
      dispatch(fetchPhotosByVisit(visitId));
    }

    return () => {
      dispatch(clearSelectedVisit());
      dispatch(clearPhotos());
    };
  }, [dispatch, visitId, canView, navigate]);

  useEffect(() => {
    if (visit?.description) {
      setDescription(visit.description);
    }
  }, [visit]);

  // Fetch locations for the project
  useEffect(() => {
    if (visit?.projectId) {
      dispatch(fetchLocationsByProject(visit.projectId));
    }
  }, [dispatch, visit?.projectId]);

  const handleBack = () => {
    navigate("/photos");
  };

  const handleEditDescription = async () => {
    if (!visitId || !canManage) return;

    try {
      await dispatch(updateVisit({ 
        id: visitId, 
        data: { description } 
      }));
      setIsEditDescriptionOpen(false);
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

  const validateImageFiles = (files: FileList | null): { validFiles: File[], invalidFiles: File[] } => {
    if (!files) return { validFiles: [], invalidFiles: [] };
    
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml',
      'image/heic',
      'image/heif'
    ];
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
      const isValidSize = file.size <= maxFileSize;
      
      if (isValidType && isValidSize) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });
    
    return { validFiles, invalidFiles };
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !canUpload) return;
    
    const { validFiles, invalidFiles } = validateImageFiles(files);
    
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
      alert(`The following files are not valid images or exceed 10MB: ${invalidFileNames}`);
    }
    
    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      handleUpload(validFiles);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!visitId || !canUpload) return;

    setIsUploading(true);
    
    // Initialize upload tracking for each file
    const uploadTrackers = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadingFiles(uploadTrackers);

    try {
      // Upload files in parallel but limit concurrency to 3
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Update progress to show upload started
          setUploadingFiles(prev => 
            prev.map((item, i) => 
              i === index ? { ...item, progress: 10 } : item
            )
          );

          await dispatch(uploadPhotoToVisit({
            visitId,
            file,
            data: {
              isPublic: false,
            }
          }));

          // Mark as completed
          setUploadingFiles(prev => 
            prev.map((item, i) => 
              i === index ? { ...item, progress: 100, status: 'completed' } : item
            )
          );
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          // Mark as error
          setUploadingFiles(prev => 
            prev.map((item, i) => 
              i === index ? { 
                ...item, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } : item
            )
          );
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Refresh photos after a short delay to allow uploads to be processed
      setTimeout(() => {
        dispatch(fetchPhotosByVisit(visitId));
      }, 1000);

    } catch (error) {
      console.error("Failed to upload photos:", error);
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      
      // Clear upload trackers after 3 seconds
      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    }
  };


  const handlePhotoClick = (photoId: string) => {
    navigate(`/photos/viewer/${photoId}?visitId=${visitId}`);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!canDelete) return;
    
    if (window.confirm("Are you sure you want to delete this photo?")) {
      try {
        await dispatch(deletePhoto(photoId));
        // Refresh photos
        if (visitId) {
          dispatch(fetchPhotosByVisit(visitId));
        }
      } catch (error) {
        console.error("Failed to delete photo:", error);
      }
    }
  };

  const handleEditPhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo && canManage) {
      setEditPhotoId(photoId);
      setEditPhotoData({
        caption: photo.caption || "",
        tags: photo.tags?.join(", ") || "",
        locationId: photo.locationId || "",
      });
    }
  };

  const handleSavePhotoEdit = async () => {
    if (!editPhotoId || !canManage) return;

    try {
      const updateData = {
        caption: editPhotoData.caption.trim() || undefined,
        tags: editPhotoData.tags.trim() 
          ? editPhotoData.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
          : [],
        locationId: editPhotoData.locationId || undefined,
      };

      await dispatch(updatePhoto({ 
        id: editPhotoId, 
        data: updateData 
      }));
      
      setEditPhotoId(null);
      setEditPhotoData({ caption: "", tags: "", locationId: "" });
      
      // Refresh photos
      if (visitId) {
        dispatch(fetchPhotosByVisit(visitId));
      }
    } catch (error) {
      console.error("Failed to update photo:", error);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPhotoIds(new Set());
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotoIds);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotoIds(newSelection);
  };

  const selectAllVisiblePhotos = () => {
    const allPhotoIds = new Set(filteredAndSortedPhotos.map(photo => photo.id));
    setSelectedPhotoIds(allPhotoIds);
  };

  const clearSelection = () => {
    setSelectedPhotoIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedPhotoIds.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedPhotoIds.size} photo(s)?`)) {
      try {
        const deletePromises = Array.from(selectedPhotoIds).map(photoId => 
          dispatch(deletePhoto(photoId))
        );
        
        await Promise.all(deletePromises);
        
        setSelectedPhotoIds(new Set());
        setIsSelectionMode(false);
        
        // Refresh photos
        if (visitId) {
          dispatch(fetchPhotosByVisit(visitId));
        }
      } catch (error) {
        console.error("Failed to delete photos:", error);
      }
    }
  };

  const handleBulkAssignLocation = async () => {
    if (!canManage || selectedPhotoIds.size === 0) return;

    try {
      const updatePromises = Array.from(selectedPhotoIds).map(photoId => 
        dispatch(updatePhoto({ 
          id: photoId, 
          data: { locationId: bulkLocationId || undefined } 
        }))
      );
      
      await Promise.all(updatePromises);
      
      setSelectedPhotoIds(new Set());
      setIsSelectionMode(false);
      setIsBulkActionOpen(false);
      setBulkLocationId("");
      
      // Refresh photos
      if (visitId) {
        dispatch(fetchPhotosByVisit(visitId));
      }
    } catch (error) {
      console.error("Failed to assign location to photos:", error);
    }
  };

  const handleBulkExport = async () => {
    if (photos.length === 0) return;

    try {
      // Create a zip file with all photos
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const promises: Promise<void>[] = [];

      photos.forEach((photo, index) => {
        promises.push(
          fetch(photo.fileUrl)
            .then(response => response.blob())
            .then(blob => {
              const fileName = `${String(index + 1).padStart(3, '0')}_${photo.originalName}`;
              zip.file(fileName, blob);
            })
            .catch(error => {
              console.warn(`Failed to download ${photo.originalName}:`, error);
            })
        );
      });

      await Promise.all(promises);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visit?.project?.name || 'photos'}_${formatVisitDate(visit?.visitDate || '')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export photos:', error);
      alert('Failed to export photos. Please try again.');
    }
  };

  const formatVisitDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  // Filter and sort photos
  const filteredAndSortedPhotos = React.useMemo(() => {
    let filtered = [...photos]; // Create a copy to avoid mutating the original array

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(photo => 
        locationFilter === 'no-location' 
          ? !photo.locationId 
          : photo.locationId === locationFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'location':
          const aLocation = a.location?.name || 'No Location';
          const bLocation = b.location?.name || 'No Location';
          return aLocation.localeCompare(bLocation);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [photos, searchTerm, locationFilter, sortBy]);

  // Get unique locations for filter
  const availableLocations = React.useMemo(() => {
    const locationMap = new Map();
    photos.forEach(photo => {
      if (photo.location) {
        locationMap.set(photo.location.id, photo.location);
      }
    });
    return Array.from(locationMap.values());
  }, [photos]);

  if (!canView) {
    return null;
  }

  if (visitLoading && !visit) {
    return (
      <PageContainer className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!visit) {
    return (
      <PageContainer className="space-y-6">
        <GlassCard className="p-12 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Visit not found</h3>
            <p className="text-gray-500">
              The requested visit could not be found or you don't have permission to view it.
            </p>
            <Button onClick={handleBack}>
              Go back to Photos
            </Button>
          </div>
        </GlassCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-gray-100 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {formatVisitDate(visit.visitDate)}
            </h1>
            {visit.project && (
              <p className="text-sm text-gray-500 truncate">
                {visit.project.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canUpload && (
            <>
              {/* Regular file upload */}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="photo-upload"
              />
              <ActionButton
                text="Import"
                variant="secondary"
                leftIcon={<Upload className="h-4 w-4" />}
                disabled={isUploading}
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="cursor-pointer"
              />
            </>
          )}
          
          {photos.length > 0 && (
            <ActionButton
              text="Export"
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleBulkExport}
            />
          )}
        </div>
      </div>

      {/* General Description */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              General Description
            </h2>
            {visit.description ? (
              <p className="text-gray-600 whitespace-pre-wrap">
                {visit.description}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                No description provided
              </p>
            )}
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDescriptionOpen(true)}
              className="hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Photos Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Photos
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {filteredAndSortedPhotos.length}
            </span>
            {filteredAndSortedPhotos.length !== photos.length && (
              <span className="text-sm text-gray-500">
                (filtered from {photos.length})
              </span>
            )}
          </h2>
          
          {canUpload && (
            <div className="flex items-center gap-2">
              <ActionButton
                text="Add pictures"
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={isUploading}
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search photos by name, caption, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Location Filter */}
            <Select value={locationFilter} onValueChange={(val) => setLocationFilter(val === 'all' ? '' : val)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem value="no-location">No location</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'location') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Selection Mode Toggle */}
            {canManage && (
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                size="sm"
                onClick={toggleSelectionMode}
                className="px-3"
              >
                {isSelectionMode ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                <span className="ml-2">Select</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {isSelectionMode && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                {selectedPhotoIds.size} photo{selectedPhotoIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={selectAllVisiblePhotos}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>
            
            {selectedPhotoIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setIsBulkActionOpen(true)}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Assign Location
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={handleBulkDelete}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Location to Photos</DialogTitle>
                      <DialogDescription>
                        Select a location to assign to {selectedPhotoIds.size} selected photo{selectedPhotoIds.size !== 1 ? 's' : ''}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bulk-location">Location</Label>
                        <Select 
                          value={bulkLocationId} 
                          onValueChange={(val) => setBulkLocationId(val === 'no-location' ? '' : val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-location">No location</SelectItem>
                            {availableProjectLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsBulkActionOpen(false);
                        setBulkLocationId("");
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkAssignLocation}>
                        Assign Location
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}


        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-2 bg-gray-50 rounded-lg p-4 border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Uploading {uploadingFiles.length} file{uploadingFiles.length !== 1 ? 's' : ''}...
            </h4>
            {uploadingFiles.map((upload, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1 mr-2">
                    {upload.file.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {upload.status === 'completed' && (
                      <span className="text-green-600 text-xs">✓ Completed</span>
                    )}
                    {upload.status === 'error' && (
                      <span className="text-red-600 text-xs">✗ Failed</span>
                    )}
                    {upload.status === 'uploading' && (
                      <span className="text-blue-600 text-xs">{upload.progress}%</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      upload.status === 'completed' ? "bg-green-500" : 
                      upload.status === 'error' ? "bg-red-500" : "bg-blue-500"
                    )}
                    style={{ width: `${upload.status === 'completed' ? 100 : upload.progress}%` }}
                  ></div>
                </div>
                {upload.error && (
                  <p className="text-xs text-red-600">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photos Grid */}
        {photosLoading && photos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">No photos yet</h3>
                <p className="text-gray-500 mt-1">
                  Add photos to this visit to get started.
                </p>
              </div>
              {canUpload && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <ActionButton
                    text="Add your first photo"
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="cursor-pointer"
                  />
                </div>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "space-y-3"
          )}>
            {filteredAndSortedPhotos.map((photo) => (
              <div key={photo.id} className="group relative">
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => isSelectionMode ? togglePhotoSelection(photo.id) : handlePhotoClick(photo.id)}
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || photo.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2">
                        <Button
                          size="sm"
                          variant={selectedPhotoIds.has(photo.id) ? "default" : "secondary"}
                          className="h-6 w-6 p-0 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoSelection(photo.id);
                          }}
                        >
                          {selectedPhotoIds.has(photo.id) && <Check className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}
                    
                    {/* Grid Photo Actions */}
                    {!isSelectionMode && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(photo.fileUrl, '_blank')}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {canManage && (
                            <DropdownMenuItem onClick={() => handleEditPhoto(photo.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem 
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    )}
                  </>
                ) : (
                  // List View
                  <div 
                    className="flex items-center gap-4 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => isSelectionMode ? togglePhotoSelection(photo.id) : handlePhotoClick(photo.id)}
                  >
                    {/* Selection Checkbox for List View */}
                    {isSelectionMode && (
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant={selectedPhotoIds.has(photo.id) ? "default" : "secondary"}
                          className="h-6 w-6 p-0 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoSelection(photo.id);
                          }}
                        >
                          {selectedPhotoIds.has(photo.id) && <Check className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || photo.originalName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Photo Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {photo.originalName}
                          </p>
                          {photo.caption && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {photo.caption}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{format(new Date(photo.createdAt), "MMM d, yyyy")}</span>
                            {photo.location && (
                              <>
                                <span>•</span>
                                <span>{photo.location.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* List Photo Actions */}
                        {!isSelectionMode && (
                          <div className="flex-shrink-0 ml-2">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                window.open(photo.fileUrl, '_blank');
                              }}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPhoto(photo.id);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePhoto(photo.id);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {photosError && (
          <GlassCard className="p-6 border-red-200 bg-red-50">
            <div className="text-center space-y-2">
              <p className="text-red-800 font-medium">Failed to load photos</p>
              <p className="text-red-600 text-sm">{photosError}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => visitId && dispatch(fetchPhotosByVisit(visitId))}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Edit Photo Dialog */}
      <Dialog open={editPhotoId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditPhotoId(null);
          setEditPhotoData({ caption: "", tags: "", locationId: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Update the caption, tags, and location for this photo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Enter photo caption..."
                value={editPhotoData.caption}
                onChange={(e) => setEditPhotoData(prev => ({ ...prev, caption: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Tag1, Tag2, Tag3..."
                value={editPhotoData.tags}
                onChange={(e) => setEditPhotoData(prev => ({ ...prev, tags: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select 
                value={editPhotoData.locationId} 
                onValueChange={(value) => setEditPhotoData(prev => ({ ...prev, locationId: value === 'no-location' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-location">No location</SelectItem>
                  {availableProjectLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setEditPhotoId(null);
              setEditPhotoData({ caption: "", tags: "", locationId: "" });
            }}>
              Cancel
            </Button>
            <Button onClick={handleSavePhotoEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Description Dialog */}
      <Dialog open={isEditDescriptionOpen} onOpenChange={setIsEditDescriptionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>
              Update the description for this visit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter visit description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDescriptionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDescription}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AlbumView;