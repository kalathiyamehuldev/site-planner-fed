import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchPhotos, selectAllPhotos, selectPhotosLoading, selectPhotosPagination, updatePhoto, deletePhoto } from "@/redux/slices/photosSlice";
import { fetchLocationsByProject } from "@/redux/slices/locationsSlice";
import { ArrowLeft, MapPin, Edit, Trash2, Check, Square, X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AllPhotosProject: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const projectId = params.get("projectId") || "";
  const photos = useAppSelector(selectAllPhotos);
  const loading = useAppSelector(selectPhotosLoading);
  const pagination = useAppSelector(selectPhotosPagination);
  const locations = useAppSelector((s) => (s as any).locations?.locations || []);
  const [locationId, setLocationId] = useState<string>("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<{ id: string; originalName: string; locationId: string | "" }>({ id: "", originalName: "", locationId: "" });
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    dispatch(fetchLocationsByProject(projectId) as any);
  }, [dispatch, projectId]);

  useEffect(() => {
    if (!projectId) return;
    const filters: any = { projectId, page: pagination.page || 1, limit: pagination.limit || 18 };
    if (locationId && locationId !== "all") filters.locationId = locationId;
    dispatch(fetchPhotos(filters) as any);
  }, [dispatch, projectId, locationId]);

  const handleBack = () => {
    navigate(-1);
  };

  const items = useMemo(() => photos, [photos]);

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedPhotoIds(new Set());
  };

  const togglePhotoSelection = (id: string) => {
    const next = new Set(selectedPhotoIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedPhotoIds(next);
  };

  const selectAllVisible = () => {
    const ids = new Set(items.map((p: any) => p.id));
    setSelectedPhotoIds(ids);
  };

  const clearSelection = () => setSelectedPhotoIds(new Set());

  const openEdit = (p: any) => {
    setEditData({ id: p.id, originalName: p.originalName || "", locationId: p.locationId || "" });
    setEditOpen(true);
  };

  const refresh = () => {
    const filters: any = { projectId, page: pagination.page || 1, limit: pagination.limit || 18 };
    if (locationId && locationId !== "all") filters.locationId = locationId;
    dispatch(fetchPhotos(filters) as any);
  };

  const saveEdit = async () => {
    if (!editData.id) return;
    const data: any = {
      originalName: editData.originalName.trim() || undefined,
      locationId: editData.locationId || undefined,
    };
    await dispatch(updatePhoto({ id: editData.id, data } as any));
    setEditOpen(false);
    setEditData({ id: "", originalName: "", locationId: "" });
    refresh();
  };

  const confirmDeleteSingle = async () => {
    if (!deletePhotoId) return;
    await dispatch(deletePhoto(deletePhotoId) as any);
    setDeletePhotoId(null);
    refresh();
  };

  const confirmBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;
    const promises = Array.from(selectedPhotoIds).map((id) => dispatch(deletePhoto(id) as any));
    await Promise.all(promises);
    setSelectedPhotoIds(new Set());
    setIsSelectionMode(false);
    setIsBulkDeleteOpen(false);
    refresh();
  };

  return (
    <>
    <PageContainer>
      <div className="flex flex-col mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex">
            <ActionButton
              variant="gray"
              motion="subtle"
              onClick={handleBack}
              leftIcon={<ArrowLeft size={16} />}
              text="Back"
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-light">All Photos</h1>
            <span className="mt-1 text-xs md:text-sm text-muted-foreground">All project photos with location filter</span>
          </div>
        </div>
      </div>

      <GlassCard className="p-3 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            <Select value={locationId} onValueChange={(val) => setLocationId(val)}>
              <SelectTrigger className="h-9 px-2 text-sm w-[220px]">
                <SelectValue placeholder="Filter by Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc: any) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-0 sm:ml-auto w-full sm:w-auto flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className={cn("px-3 text-xs", !isSelectionMode && "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100")}
            >
              {isSelectionMode ? <Check className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              {isSelectionMode ? "Cancel" : "Select"}
            </Button>
            {isSelectionMode && (
              <>
                <span className="basis-full sm:basis-auto text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-center">
                  {selectedPhotoIds.size} selected
                </span>
                <Button size="sm" variant="secondary" className="bg-gray-100 text-gray-800 px-3 text-xs" onClick={selectAllVisible}>
                  <Check className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <Button size="sm" variant="secondary" className="bg-gray-100 text-gray-800 px-3 text-xs" onClick={clearSelection}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <ActionButton
                  text="Delete"
                  variant="danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="px-3 text-xs whitespace-nowrap"
                />
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Loading photos...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No photos found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((p) => (
              <div key={p.id} className="group relative">
                <GlassCard
                  variant="clean"
                  className="p-2 hover:shadow-lg transition cursor-pointer"
                  onClick={() => isSelectionMode ? togglePhotoSelection(p.id) : navigate(`/photos/viewer/${p.id}`)}
                >
                  <div className="relative">
                    <img src={p.fileUrl} alt={p.originalName} className="w-full h-28 object-cover rounded" />
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2">
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center cursor-pointer transition",
                            selectedPhotoIds.has(p.id) ? "bg-blue-600 text-white shadow" : "bg-white/90 text-transparent border border-gray-300"
                          )}
                          onClick={(e) => { e.stopPropagation(); togglePhotoSelection(p.id); }}
                          aria-pressed={selectedPhotoIds.has(p.id)}
                        >
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
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                            className="flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeletePhotoId(p.id); }}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={14} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground truncate">{p.originalName}</div>
                </GlassCard>
              </div>
            ))}
        </div>
        )}
      </GlassCard>
  </PageContainer>

  {/* Edit Photo Dialog */}
  <Dialog open={editOpen} onOpenChange={setEditOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Photo</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="editOriginalName">Display Name</Label>
          <Input
            id="editOriginalName"
            value={editData.originalName}
            onChange={(e) => setEditData((prev) => ({ ...prev, originalName: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="editLocation">Location</Label>
          <Select value={editData.locationId || ""} onValueChange={(v) => setEditData((prev) => ({ ...prev, locationId: v === "no-location" ? "" : v }))}>
            <SelectTrigger id="editLocation">
              <SelectValue placeholder="Select location (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-location">No location</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
        <Button onClick={saveEdit}>Save</Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Delete Single Confirmation */}
  <AlertDialog open={!!deletePhotoId} onOpenChange={(open) => !open && setDeletePhotoId(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete photo?</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setDeletePhotoId(null)}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={confirmDeleteSingle} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  {/* Bulk Delete Confirmation */}
  <AlertDialog open={isBulkDeleteOpen} onOpenChange={(open) => !open && setIsBulkDeleteOpen(false)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete selected photos?</AlertDialogTitle>
        <AlertDialogDescription>{selectedPhotoIds.size} item(s) will be removed permanently.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setIsBulkDeleteOpen(false)}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  </>
  );
};

export default AllPhotosProject;
