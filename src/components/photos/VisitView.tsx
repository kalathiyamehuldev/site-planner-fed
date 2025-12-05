import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Plus,
  Download,
  Upload,
  Image as ImageIcon,
  Pencil,
  MoreHorizontal,
  MoreVertical,
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
import { useIsMobile } from "@/hooks/use-mobile";
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
import solar from "@solar-icons/react";
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

const VisitView: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    originalName: "",
    caption: "",
    tags: "",
    locationId: "",
  });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkLocationId, setBulkLocationId] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [pendingUploadLocationId, setPendingUploadLocationId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  

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
    const fromAlbumId = searchParams.get('fromAlbumId');
    if (fromAlbumId) {
      navigate(`/albums/${fromAlbumId}`);
      return;
    }
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
              locationId: pendingUploadLocationId || undefined,
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
        originalName: photo.originalName || "",
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
        originalName: editPhotoData.originalName.trim() || undefined,
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
      setEditPhotoData({ originalName: "", caption: "", tags: "", locationId: "" });
      
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
    if (!isSelectionMode || selectedPhotoIds.size === 0) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const selected = photos.filter(p => selectedPhotoIds.has(p.id));
      const promises: Promise<void>[] = [];

      selected.forEach((photo, index) => {
        promises.push(
          fetch(photo.fileUrl)
            .then(response => response.blob())
            .then(blob => {
              const fileName = `${String(index + 1).padStart(3, '0')}_${photo.originalName}`;
              zip.file(fileName, blob);
            })
            .catch(() => void 0)
        );
      });

      await Promise.all(promises);

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
      alert('Failed to export photos.');
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

  const photosByLocation = React.useMemo(() => {
    const map = new Map<string, typeof photos>();
    filteredAndSortedPhotos.forEach((p) => {
      const key = p.locationId || '__no_location__';
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    });
    return map;
  }, [filteredAndSortedPhotos]);

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
      <PageHeader
        title={formatVisitDate(visit.visitDate)}
        subtitle={visit.project ? visit.project.name : undefined}
        showBackButton
        onBackClick={handleBack}
      >
        {canUpload && (
          <>
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
              onClick={() => { setPendingUploadLocationId(null); document.getElementById('photo-upload')?.click(); }}
              className="cursor-pointer"
            />
          </>
        )}
        <ActionButton
          text="Export"
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handleBulkExport}
          disabled={!isSelectionMode || selectedPhotoIds.size === 0}
        />
      </PageHeader>

      {/* General Description */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              General Description
            </h2>
            {(description || visit.description) ? (
              <p className="text-gray-600 whitespace-pre-wrap">
                {description || visit.description}
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
        <div className="flex items-center justify-between gap-4 sm:flex-row sm:items-center">
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
            <div className="hidden md:flex items-center gap-2">
              <ActionButton
                text="Add pictures"
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={isUploading}
                onClick={() => { setPendingUploadLocationId(null); document.getElementById('photo-upload')?.click(); }}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>

        
        {/* Location anchors */}
        <div className="flex gap-2 flex-wrap items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('section-all-site-pictures')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="rounded-full"
          >
            All site pictures
          </Button>
          {availableProjectLocations.map((location) => (
            <Button
              key={location.id}
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`section-${location.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-full"
            >
              {location.name}
            </Button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="sm:hidden flex items-center gap-2 w-full flex-nowrap overflow-x-auto justify-between">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white flex-1 min-w-[180px]">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search photos by name, caption, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 border-0 bg-transparent p-0 outline-none focus:ring-0"
              />
            </div>
            <div className="flex rounded-md border flex-shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 rounded-r-none"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 rounded-l-none border-l"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="sm:hidden flex items-center justify-between w-full">
            {canManage && (
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                size="sm"
                onClick={toggleSelectionMode}
                className={cn(
                  "px-3",
                  !isSelectionMode && "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                )}
              >
                {isSelectionMode ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                <span className="ml-2">Select</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              aria-expanded={showMobileFilters}
              aria-label="Toggle filters"
              className="flex-shrink-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showMobileFilters && (
            <GlassCard className="p-4 sm:hidden w-full">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="mobile-location" className="block mb-1 text-sm text-gray-700">Location</Label>
                  <Select value={locationFilter} onValueChange={(val) => setLocationFilter(val === 'all' ? '' : val)}>
                    <SelectTrigger id="mobile-location" className="w-full">
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
                </div>
                <div>
                  <Label htmlFor="mobile-sort" className="block mb-1 text-sm text-gray-700">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'location') => setSortBy(value)}>
                    <SelectTrigger id="mobile-sort" className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Added</SelectItem>
                      <SelectItem value="name">File Name</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>
          )}
        
          {/* Desktop: Search only (Add lives in header) */}
          <div className="hidden sm:block sm:flex-1 sm:min-w-[300px]">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search photos by name, caption, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus:ring-0 outline-none p-0 w-full"
              />
            </div>
          </div>

          {/* Filters & Selection (desktop + shared) */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-full sm:w-auto sm:flex-shrink-0 mb-4 sm:mb-6">
            {/* Selection Mode Toggle - positioned first for visibility */}
            {canManage && (
              <Button
                variant={isSelectionMode ? 'default' : 'outline'}
                size="sm"
                onClick={toggleSelectionMode}
                className={cn(
                  "px-3 hidden sm:inline-flex",
                  !isSelectionMode && "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                )}
              >
                {isSelectionMode ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                <span className="ml-2">Select</span>
              </Button>
            )}

            {/* Location Filter */}
            <div className="hidden sm:block">
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
            </div>

            {/* Sort By */}
            <div className="hidden sm:block">
              <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'location') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="name">File Name</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex rounded-md border">
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
            {isSelectionMode && (
              <div className="flex items-center justify-between gap-2 ml-0 sm:ml-2 w-full sm:w-auto">
                <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {selectedPhotoIds.size} selected
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-gray-100 text-gray-800"
                  onClick={selectAllVisiblePhotos}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-gray-100 text-gray-800"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                {selectedPhotoIds.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary" className="bg-gray-100 text-gray-800">
                        <MoreHorizontal className="h-4 w-4 mr-1" />
                        Bulk
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                )}
              </div>
            )}
          </div>
        </div>

        {/* Inline Bulk Assign Location Dialog */}
        <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
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
                  <SelectTrigger id="bulk-location">
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

        {/* Grouped by Location */}
        {photosLoading && photos.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
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
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
          <div className="space-y-8">
            {/* Location sections */}
            {availableProjectLocations.map((location) => {
              const locPhotos = photosByLocation.get(location.id) || [];
              if (locPhotos.length === 0) return null;
              return (
                <div key={location.id} id={`section-${location.id}`} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div className="sm:col-span-1 sm:flex sm:flex-col sm:justify-center sm:items-start sm:text-left">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{location.name}</h3>
                        </div>
                        {isMobile && canUpload && (
                          <ActionButton
                            text="Add pictures"
                            variant="secondary"
                            leftIcon={<Plus className="h-4 w-4" />}
                            disabled={isUploading}
                            onClick={() => { setPendingUploadLocationId(location.id); document.getElementById('photo-upload')?.click(); }}
                            className="cursor-pointer"
                          />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{locPhotos.length} Photos</div>
                      {!isMobile && canUpload && (
                        <ActionButton
                          text="Add pictures"
                          variant="secondary"
                          leftIcon={<Plus className="h-4 w-4" />}
                          disabled={isUploading}
                          onClick={() => { setPendingUploadLocationId(location.id); document.getElementById('photo-upload')?.click(); }}
                          className="cursor-pointer mt-2"
                        />
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4")}> 
                        {locPhotos.map((photo) => (
                          <div key={photo.id} className="group relative">
                            <div
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => isSelectionMode ? togglePhotoSelection(photo.id) : handlePhotoClick(photo.id)}
                          >
                              <img src={photo.fileUrl} alt={photo.caption || photo.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            </div>
                            {isSelectionMode && (
                              <div className="absolute top-2 left-2">
                                <div className={cn("h-7 w-7 rounded-full flex items-center justify-center cursor-pointer transition", selectedPhotoIds.has(photo.id) ? "bg-blue-600 text-white shadow" : "bg-white/90 text-transparent border border-gray-300")} onClick={(e) => { e.stopPropagation(); togglePhotoSelection(photo.id); }} aria-pressed={selectedPhotoIds.has(photo.id)}>
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-7 h-7 p-0 text-[#1a2624]/60 hover:text-[#1a2624] hover:bg-gray-100 rounded"
                                  >
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditPhoto(photo.id); }} className="flex items-center gap-2">
                                    <Pencil size={14} />
                                    Edit
                                  </DropdownMenuItem>
                                  {canDelete && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                                      <Trash2 size={14} />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unassigned photos */}
            {(() => {
              const unassigned = photosByLocation.get('__no_location__') || [];
              return (
                <div id="section-all-site-pictures" className="space-y-3">
                  {isMobile && (
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">All site pictures</h3>
                      {canUpload && (
                        <ActionButton
                          text="Add pictures"
                          variant="secondary"
                          leftIcon={<Plus className="h-4 w-4" />}
                          disabled={isUploading}
                          onClick={() => { setPendingUploadLocationId(null); document.getElementById('photo-upload')?.click(); }}
                          className="cursor-pointer"
                        />
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div className="sm:col-span-1 sm:flex sm:flex-col sm:justify-center sm:items-start sm:text-left">
                      {!isMobile && (
                        <h3 className="text-lg font-semibold text-gray-900">All site pictures</h3>
                      )}
                      <div className="text-sm text-gray-600 mt-1">{unassigned.length} Photos</div>
                      {!isMobile && canUpload && (
                        <ActionButton
                          text="Add pictures"
                          variant="secondary"
                          leftIcon={<Plus className="h-4 w-4" />}
                          disabled={isUploading}
                          onClick={() => { setPendingUploadLocationId(null); document.getElementById('photo-upload')?.click(); }}
                          className="cursor-pointer mt-2"
                        />
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4"> 
                        {unassigned.map((photo) => (
                          <div key={photo.id} className="group relative">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => isSelectionMode ? togglePhotoSelection(photo.id) : handlePhotoClick(photo.id)}>
                              <img src={photo.fileUrl} alt={photo.caption || photo.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            </div>
                            {isSelectionMode && (
                              <div className="absolute top-2 left-2">
                                <div className={cn("h-7 w-7 rounded-full flex items-center justify-center cursor-pointer transition", selectedPhotoIds.has(photo.id) ? "bg-blue-600 text-white shadow" : "bg-white/90 text-transparent border border-gray-300")} aria-pressed={selectedPhotoIds.has(photo.id)} onClick={(e) => { e.stopPropagation(); togglePhotoSelection(photo.id); }}>
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-7 h-7 p-0 text-[#1a2624]/60 hover:text-[#1a2624] hover:bg-gray-100 rounded"
                                  >
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditPhoto(photo.id); }} className="flex items-center gap-2">
                                    <Pencil size={14} />
                                    Edit
                                  </DropdownMenuItem>
                                  {canDelete && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                                      <Trash2 size={14} />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
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

      {canUpload && (
        <Button
          variant="default"
          onClick={() => { setPendingUploadLocationId(null); document.getElementById('photo-upload')?.click(); }}
          className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
        >
          <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
        </Button>
      )}

      {/* Edit Photo Dialog */}
      <Dialog open={editPhotoId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditPhotoId(null);
          setEditPhotoData({ originalName: "", caption: "", tags: "", locationId: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Update the file name (display), caption, tags, and location.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="originalName">Display Name</Label>
              <Input
                id="originalName"
                placeholder="e.g. Kitchen before renovation"
                value={editPhotoData.originalName}
                onChange={(e) => setEditPhotoData(prev => ({ ...prev, originalName: e.target.value }))}
              />
            </div>
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
              setEditPhotoData({ originalName: "", caption: "", tags: "", locationId: "" });
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

export default VisitView;
