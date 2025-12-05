import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Trash2,
  X,
  Search,
  Plus,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import usePermission from "@/hooks/usePermission";
import {
  fetchPhotoById,
  deletePhoto,
  assignLocation,
  selectSelectedPhoto,
  selectPhotosLoading,
  selectPhotosError,
  clearSelectedPhoto,
} from "@/redux/slices/photosSlice";
import {
  fetchPhotosByVisit,
  selectAllPhotos,
} from "@/redux/slices/photosSlice";
import {
  fetchLocationsByProject,
  createLocation,
  selectLocationsByProject,
  selectLocationsLoading,
} from "@/redux/slices/locationsSlice";
import ActionButton from "../ui/ActionButton";

const PhotoViewer: React.FC = () => {
  const { photoId } = useParams<{ photoId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visitId');
  const { hasPermission } = usePermission();

  // Redux state
  const photo = useAppSelector(selectSelectedPhoto);
  const photos = useAppSelector(selectAllPhotos);
  const photoLoading = useAppSelector(selectPhotosLoading);
  const photoError = useAppSelector(selectPhotosError);
  const locations = useAppSelector(state => selectLocationsByProject(state, photo?.projectId || ''));
  const locationsLoading = useAppSelector(selectLocationsLoading);

  // Local state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLocationPanelOpen, setIsLocationPanelOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);

  // Permissions
  const canView = hasPermission("photos", "read");
  const canManage = hasPermission("photos", "manage");
  const canDelete = hasPermission("photos", "delete");

  // Find current photo index for navigation
  const currentPhotoIndex = photos.findIndex(p => p.id === photoId);
  const hasNext = currentPhotoIndex < photos.length - 1;
  const hasPrevious = currentPhotoIndex > 0;

  useEffect(() => {
    if (!canView) {
      navigate("/photos");
      return;
    }

    if (photoId) {
      dispatch(fetchPhotoById(photoId));
    }

    // Fetch photos from visit for navigation
    if (visitId) {
      dispatch(fetchPhotosByVisit(visitId));
    }

    return () => {
      dispatch(clearSelectedPhoto());
    };
  }, [dispatch, photoId, visitId, canView, navigate]);

  useEffect(() => {
    // Fetch locations for the project when photo is loaded
    if (photo?.projectId) {
      dispatch(fetchLocationsByProject(photo.projectId));
    }
  }, [dispatch, photo?.projectId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleNext = () => {
    if (hasNext && visitId) {
      const nextPhoto = photos[currentPhotoIndex + 1];
      navigate(`/photos/viewer/${nextPhoto.id}?visitId=${visitId}`);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious && visitId) {
      const prevPhoto = photos[currentPhotoIndex - 1];
      navigate(`/photos/viewer/${prevPhoto.id}?visitId=${visitId}`);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleBack();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPhotoIndex]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDelete = async () => {
    if (!canDelete || !photo) return;
    
    if (window.confirm("Are you sure you want to delete this photo?")) {
      try {
        await dispatch(deletePhoto(photo.id));
        handleBack();
      } catch (error) {
        console.error("Failed to delete photo:", error);
      }
    }
  };

  const handleDownload = () => {
    if (photo) {
      const link = document.createElement('a');
      link.href = photo.fileUrl;
      link.download = photo.originalName;
      link.click();
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleAssignLocation = async (locationId: string | null) => {
    if (!canManage || !photo) return;

    try {
      await dispatch(assignLocation({
        id: photo.id,
        data: { locationId }
      }));
      
      // Refresh photo data
      dispatch(fetchPhotoById(photo.id));
    } catch (error) {
      console.error("Failed to assign location:", error);
    }
  };

  const handleCreateLocation = async () => {
    if (!canManage || !photo?.projectId || !newLocationName.trim()) return;

    try {
      await dispatch(createLocation({
        name: newLocationName.trim(),
        projectId: photo.projectId
      }));

      // Refresh locations
      dispatch(fetchLocationsByProject(photo.projectId));
      
      setNewLocationName("");
      setIsCreateLocationOpen(false);
    } catch (error) {
      console.error("Failed to create location:", error);
    }
  };

  if (!canView) {
    return null;
  }

  if (photoLoading || !photo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (photoError) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-white">Failed to load photo</h3>
          <p className="text-gray-300">{photoError}</p>
          <Button variant="outline" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Main Photo Area */}
      <div className="flex-1 relative">
        {/* Top Controls */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleBack}
              className="bg-black/20 border-0 text-white hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3">
              <p className="text-white text-xs sm:text-sm">
                {currentPhotoIndex + 1} of {photos.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile: Show fewer controls */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="bg-black/20 border-0 text-white hover:bg-black/40 disabled:opacity-50"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
              </div>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="bg-black/20 border-0 text-white hover:bg-black/40 disabled:opacity-50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={handleRotate}
                className="bg-black/20 border-0 text-white hover:bg-black/40"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={handleResetView}
                className="bg-black/20 border-0 text-white hover:bg-black/40"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {canManage && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsLocationPanelOpen(!isLocationPanelOpen)}
                className="bg-black/20 border-0 text-white hover:bg-black/40 h-8 w-8 sm:hidden"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/20 border-0 text-white hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Mobile: Include zoom controls in dropdown */}
                <div className="sm:hidden">
                  <DropdownMenuItem onClick={handleZoomOut} disabled={zoom <= 0.25}>
                    <ZoomOut className="h-4 w-4 mr-2" />
                    Zoom Out ({Math.round(zoom * 100)}%)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleZoomIn} disabled={zoom >= 3}>
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom In ({Math.round(zoom * 100)}%)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRotate}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rotate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResetView}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset View
                  </DropdownMenuItem>
                  <div className="border-t border-gray-200 my-1"></div>
                </div>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Photo */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={photo.fileUrl}
            alt={photo.caption || photo.originalName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {hasPrevious && (
          <Button
            variant="secondary"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/20 border-0 text-white hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}

        {hasNext && (
          <Button
            variant="secondary"
            size="icon"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/20 border-0 text-white hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
      </div>

      {/* Location Sidebar */}
      {canManage && (
        <div className={cn(
          "bg-white border-l border-gray-200 flex flex-col transition-transform duration-300",
          // Mobile: Full screen overlay, Desktop: Sidebar
          "sm:w-80 fixed sm:static inset-0 sm:inset-auto z-50 sm:z-auto",
          isLocationPanelOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location on Site
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLocationPanelOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Locations */}
          <div className="p-4 space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Assign Location
            </Label>
            
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search locations..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full !pl-16 pr-3"
              />
            </div>
          </div>

          {/* Locations List */}
          <div className="flex-1 overflow-y-auto">
            {locationsLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Locations</h4>
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50",
                      photo.locationId === location.id && "bg-blue-50 border border-blue-200"
                    )}
                    onClick={() => handleAssignLocation(location.id)}
                  >
                    <span className="text-sm text-gray-900">{location.name}</span>
                    {photo.locationId === location.id && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                ))}
                
                {filteredLocations.length === 0 && locationSearch && (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-gray-500">
                      No locations found for "{locationSearch}"
                    </p>
                    {canManage && photo?.projectId && (
                      <ActionButton
                        variant="primary"
                        onClick={() => { setNewLocationName(locationSearch); setIsCreateLocationOpen(true); }}
                        className="inline-flex items-center justify-center"
                        text="Add new location"
                        leftIcon={<Plus className="h-4 w-4 mr-2" />}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Toggle Button */}
      {canManage && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsLocationPanelOpen(!isLocationPanelOpen)}
          className={cn(
            "hidden sm:inline-flex absolute bg-black/20 border-0 text-white hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10",
            // Position based on whether location panel is open
            isLocationPanelOpen 
              ? "top-2 right-2 sm:top-4 sm:right-[336px]" // 336px = 320px width + 16px margin
              : "top-2 right-2 sm:top-4 sm:right-4"
          )}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      )}

      {/* Create Location Dialog */}
      <Dialog open={isCreateLocationOpen} onOpenChange={setIsCreateLocationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Add the location name, then save.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                placeholder="e.g. Living Room, Kitchen, Bathroom..."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateLocationOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLocation}
              disabled={!newLocationName.trim()}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoViewer;
