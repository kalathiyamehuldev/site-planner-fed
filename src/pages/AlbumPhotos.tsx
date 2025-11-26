import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import usePermission from "@/hooks/usePermission";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, Image, MoreVertical, Plus, Bell, Upload, Download, Square, Check, Trash2, X, Pencil } from "lucide-react";
import { fetchAlbum, fetchAlbumPhotos, fetchChildrenAlbums, selectAlbumDetails, selectAlbumPhotos, uploadPhotoToAlbum } from "@/redux/slices/albumsSlice";
import { selectAlbumsByParent, createAlbum } from "@/redux/slices/albumsSlice";
import { fetchVisits, selectVisitsByProject, selectVisitsLoading, createVisit } from "@/redux/slices/visitsSlice";
import ActionButton from "@/components/ui/ActionButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { updateAlbum, deleteAlbum } from "@/redux/slices/albumsSlice";
import { updateVisit, deleteVisit } from "@/redux/slices/visitsSlice";
import { deletePhoto } from "@/redux/slices/photosSlice";

const AlbumPhotos: React.FC = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();
  const album = useAppSelector((s) => selectAlbumDetails(s, albumId || ""));
  const photos = useAppSelector((s) => selectAlbumPhotos(s, albumId || ""));
  const children = useAppSelector((s) => selectAlbumsByParent(s, albumId || ""));
  const visitsLoading = useAppSelector(selectVisitsLoading);
  const projectVisits = useAppSelector(selectVisitsByProject(album?.projectId || ""));
  const [isCreateVisitOpen, setIsCreateVisitOpen] = useState(false);
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);
  const [visitTitle, setVisitTitle] = useState("");
  const [visitDescription, setVisitDescription] = useState("");
  const [visitVisibility, setVisitVisibility] = useState<"ALL_USERS" | "CUSTOMER" | "">("");
  const [albumName, setAlbumName] = useState("");
  const [albumVisibility, setAlbumVisibility] = useState<"ALL_USERS" | "CUSTOMER" | "">("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ file: File; progress: number; status: 'uploading' | 'completed' | 'error'; error?: string }>>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [filterVisitDate, setFilterVisitDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"visitDate" | "photos" | "createdBy">("visitDate");
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false);
  const [isEditVisitOpen, setIsEditVisitOpen] = useState(false);
  const [editAlbumData, setEditAlbumData] = useState<{ id?: string; name: string; visibility: "ALL_USERS" | "CUSTOMER" }>({ name: "", visibility: "ALL_USERS" });
  const [editVisitData, setEditVisitData] = useState<{ id?: string; title?: string; description?: string; visitDate?: string; visibility?: "ALL_USERS" | "CUSTOMER" }>({});

  useEffect(() => {
    if (albumId) {
      dispatch(fetchAlbum(albumId));
      dispatch(fetchAlbumPhotos(albumId));
      dispatch(fetchChildrenAlbums(albumId));
    }
  }, [dispatch, albumId]);

  useEffect(() => {
    if (album?.projectId && !album?.parentId) {
      dispatch(fetchVisits({ projectId: album.projectId }));
    }
  }, [dispatch, album?.projectId, album?.parentId]);

  const handleBack = () => {
    if (album?.parentId) navigate(`/albums/${album.parentId}`);
    else navigate("/photos");
  };

  const handleOpenAlbum = (id: string) => navigate(`/albums/${id}`);
  const handleOpenVisit = (id: string) => navigate(`/photos/album/${id}?fromAlbumId=${albumId}`);

  const handleCreateVisit = async () => {
    if (!album?.projectId || !visitDate) return;
    const title = visitTitle.trim();
    const payload: any = { title: title ? title : undefined, description: visitDescription, visitDate: visitDate.toISOString(), projectId: album.projectId };
    if (visitVisibility) payload.visibility = visitVisibility as any;
    await dispatch(createVisit(payload));
    setIsCreateVisitOpen(false);
    setVisitDate(undefined);
    setVisitTitle("");
    setVisitDescription("");
    setVisitVisibility("");
    dispatch(fetchVisits({ projectId: album.projectId }));
  };

  const handleCreateAlbum = async () => {
    if (!album?.projectId || !albumName.trim() || !albumId) return;
    const payload: any = { name: albumName.trim(), projectId: album.projectId, parentId: albumId };
    if (albumVisibility) payload.visibility = albumVisibility as any;
    await dispatch(createAlbum(payload));
    setIsCreateAlbumOpen(false);
    setAlbumName("");
    setAlbumVisibility("");
  };

  const validateImageFiles = (files: FileList | null): { validFiles: File[]; invalidFiles: File[] } => {
    if (!files) return { validFiles: [], invalidFiles: [] };
    const allowedTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/bmp','image/svg+xml','image/heic','image/heif'];
    const maxFileSize = 10 * 1024 * 1024;
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    Array.from(files).forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
      const isValidSize = file.size <= maxFileSize;
      if (isValidType && isValidSize) validFiles.push(file); else invalidFiles.push(file);
    });
    return { validFiles, invalidFiles };
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !albumId || !hasPermission('photos','create')) return;
    const { validFiles, invalidFiles } = validateImageFiles(files);
    if (invalidFiles.length > 0) {
      const names = invalidFiles.map(f => f.name).join(', ');
      alert(`Invalid or too large files: ${names}`);
    }
    setSelectedFiles(validFiles);
    if (validFiles.length > 0) handleUpload(validFiles);
  };

  const handleUpload = async (files: File[]) => {
    if (!albumId || !hasPermission('photos','create')) return;
    setIsUploading(true);
    const trackers = files.map(file => ({ file, progress: 0, status: 'uploading' as const }));
    setUploadingFiles(trackers);
    try {
      const promises = files.map(async (file, index) => {
        try {
          setUploadingFiles(prev => prev.map((it, i) => i === index ? { ...it, progress: 10 } : it));
          await dispatch(uploadPhotoToAlbum({ albumId, file } as any));
          setUploadingFiles(prev => prev.map((it, i) => i === index ? { ...it, progress: 100, status: 'completed' } : it));
        } catch (err: any) {
          setUploadingFiles(prev => prev.map((it, i) => i === index ? { ...it, status: 'error', error: err?.message || 'Upload failed' } : it));
        }
      });
      await Promise.all(promises);
      setTimeout(() => { if (albumId) dispatch(fetchAlbumPhotos(albumId)); }, 800);
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      setTimeout(() => setUploadingFiles([]), 2500);
    }
  };
  const filteredVisits = React.useMemo(() => {
    let arr = [...projectVisits];
    if (filterVisitDate) {
      const day = filterVisitDate.toDateString();
      arr = arr.filter(v => new Date(v.visitDate).toDateString() === day);
    }
    switch (sortBy) {
      case 'photos':
        return arr.sort((a, b) => (b._count?.photos || 0) - (a._count?.photos || 0));
      case 'createdBy': {
        const getName = (v: any) => v.createdBy ? `${v.createdBy.firstName} ${v.createdBy.lastName}` : '';
        return arr.sort((a, b) => getName(a).localeCompare(getName(b)));
      }
      case 'visitDate':
      default:
        return arr.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    }
  }, [projectVisits, filterVisitDate, sortBy]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedPhotoIds(new Set());
  };

  const selectAllVisiblePhotos = () => {
    const ids = new Set(photos.map(p => p.id));
    setSelectedPhotoIds(ids);
  };

  const clearSelection = () => {
    setSelectedPhotoIds(new Set());
  };

  const togglePhotoSelection = (photoId: string) => {
    const next = new Set(selectedPhotoIds);
    if (next.has(photoId)) next.delete(photoId); else next.add(photoId);
    setSelectedPhotoIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedPhotoIds.size} photo(s)?`)) return;
    try {
      const promises = Array.from(selectedPhotoIds).map(id => dispatch(deletePhoto(id)) as any);
      await Promise.all(promises);
      if (albumId) dispatch(fetchAlbumPhotos(albumId));
      setSelectedPhotoIds(new Set());
      setIsSelectionMode(false);
    } catch {}
  };

  const handleBulkExport = async () => {
    if (!isSelectionMode || selectedPhotoIds.size === 0) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const list = photos.filter(p => selectedPhotoIds.has(p.id));
    const promises = list.map((photo, idx) =>
      fetch(photo.fileUrl)
        .then(r => r.blob())
        .then(blob => zip.file(`${String(idx + 1).padStart(3,'0')}_${photo.originalName}`, blob))
        .catch(() => void 0)
    );
    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${album?.name || 'album'}_${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const openEditAlbum = (a: any) => {
    setEditAlbumData({ id: a.id, name: a.name, visibility: a.visibility });
    setIsEditAlbumOpen(true);
  };
  const saveEditAlbum = async () => {
    if (!editAlbumData.id) return;
    const payload: any = { id: editAlbumData.id, name: editAlbumData.name };
    if (editAlbumData.visibility) payload.visibility = editAlbumData.visibility;
    await dispatch(updateAlbum(payload));
    setIsEditAlbumOpen(false);
  };
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [deleteVisitId, setDeleteVisitId] = useState<string | null>(null);
  const removeAlbum = async (id: string) => {
    setDeleteAlbumId(id);
  };

  const openEditVisit = (v: any) => {
    setEditVisitData({ id: v.id, title: v.title, description: v.description, visitDate: v.visitDate, visibility: v.visibility });
    setIsEditVisitOpen(true);
  };
  const saveEditVisit = async () => {
    if (!editVisitData.id) return;
    const { id, ...data } = editVisitData as any;
    await dispatch(updateVisit({ id, data }));
    setIsEditVisitOpen(false);
  };
  const removeVisit = async (id: string) => {
    setDeleteVisitId(id);
  };

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={album?.name || "Album"}
        showBackButton
        onBackClick={handleBack}
      >
        {album?.parentId && (
          <ActionButton
            text="Add pictures"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => document.getElementById('album-photo-upload')?.click()}
          />
        )}
      </PageHeader>

      {/* Visits section (hidden for child albums) */}
      {album && !album.parentId && (
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start w-full">
              <h2 className="text-lg font-semibold text-gray-900">Visits</h2>
              <div className="sm:hidden">
                <ActionButton text="Create visit" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateVisitOpen(true)} />
              </div>
            </div>
            <div className="w-full sm:w-auto flex items-center sm:gap-2">
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
                <Input type="date" value={filterVisitDate ? new Date(filterVisitDate).toISOString().slice(0,10) : ''} onChange={(e) => setFilterVisitDate(e.target.value ? new Date(e.target.value) : undefined)} className="w-full sm:w-[160px]" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitDate">Visit Date</SelectItem>
                    <SelectItem value="photos">Photos Count</SelectItem>
                    <SelectItem value="createdBy">Created By</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:block">
                <ActionButton text="Create visit" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateVisitOpen(true)} size="m" className="px-4 whitespace-nowrap" />
              </div>
            </div>
          </div>
          {visitsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3">
              {[...Array(6)].map((_, i) => (
                <GlassCard key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </GlassCard>
              ))}
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border">
                <Image className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-gray-600 mt-3">No visits yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3">
              {filteredVisits.map((visit) => (
                <GlassCard key={visit.id} className="p-4 hover:shadow-lg cursor-pointer" onClick={() => handleOpenVisit(visit.id)}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-b from-blue-50 to-white rounded-lg border flex items-center justify-center">
                      <Image className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-gray-900 truncate">{visit.title || 'Site Visit'}</div>
                      <div className="text-sm text-gray-600 truncate">{visit.createdBy ? `${visit.createdBy.firstName} ${visit.createdBy.lastName}` : 'Unknown'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditVisit(visit); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); removeVisit(visit.id); }} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Children albums section (hidden for child albums) */}
      {album && !album.parentId && (
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start w-full">
              <h2 className="text-lg font-semibold text-gray-900">Albums</h2>
              <div className="sm:hidden">
                <ActionButton text="Create album" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateAlbumOpen(true)} />
              </div>
            </div>
            <div className="hidden sm:flex">
              <ActionButton text="Create album" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateAlbumOpen(true)} className="px-4 whitespace-nowrap" />
            </div>
          </div>
          {children.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border">
                <Image className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-gray-600 mt-3">No child albums</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3">
              {children.map((child) => (
                <GlassCard key={child.id} className="p-3 sm:p-6 hover:shadow-lg cursor-pointer" onClick={() => handleOpenAlbum(child.id)}>
                  <div className="h-20 bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border">
                    <Image className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-gray-900 truncate">{child.name}</div>
                      {child.isDefault && <div className="text-xs text-blue-700">Default</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditAlbum(child); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); removeAlbum(child.id); }} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photos upload (child albums only) */}
      {album && album.parentId && (
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
            {hasPermission('photos','create') && (
              <>
                <input type="file" multiple accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="album-photo-upload" />
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <ActionButton text={isUploading ? 'Uploading...' : 'Import'} variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => document.getElementById('album-photo-upload')?.click()} />
              {photos.length > 0 && (
                <>
                  <ActionButton text="Export" variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleBulkExport} disabled={!isSelectionMode || selectedPhotoIds.size === 0} />
                  <Button
                    variant={isSelectionMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className={cn(!isSelectionMode && 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100')}
                  >
                    {isSelectionMode ? <Check className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                    {isSelectionMode ? 'Cancel' : 'Select'}
                  </Button>
                  {isSelectionMode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {selectedPhotoIds.size} selected
                      </span>
                      <Button size="sm" variant="secondary" className="bg-gray-100 text-gray-800" onClick={selectAllVisiblePhotos}>
                        <Check className="h-4 w-4 mr-1" />
                        Select All
                      </Button>
                      <Button size="sm" variant="secondary" className="bg-gray-100 text-gray-800" onClick={clearSelection}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      {selectedPhotoIds.size > 0 && (
                        <ActionButton text="Delete selected" variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleBulkDelete} />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
              </>
            )}
          </div>
          {uploadingFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadingFiles.map((u, i) => (
                <GlassCard key={i} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-900 truncate">{u.file.name}</div>
                    <div className="text-xs text-gray-500">{u.status === 'uploading' ? `${u.progress}%` : u.status}</div>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded">
                    <div className={"h-2 bg-blue-500 rounded"} style={{ width: `${u.progress}%` }}></div>
                  </div>
                  {u.error && <div className="mt-2 text-xs text-red-600">{u.error}</div>}
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photos grid */}
      {(album?.parentId && photos.length === 0) ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border">
            <Image className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-gray-600 mt-3">No photos in this album</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={p.fileUrl} alt={p.caption || p.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
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
            </div>
          ))}
        </div>
      )}

      {/* Create Visit Dialog */}
      <Dialog open={isCreateVisitOpen} onOpenChange={setIsCreateVisitOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new visit</DialogTitle>
            <DialogDescription>Create a new site visit for this project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="visitTitle" className="text-sm font-medium">Title (optional)</label>
              <Input id="visitTitle" value={visitTitle} onChange={(e) => setVisitTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="visitDate" className="text-sm font-medium">Visit Date</label>
              <Input type="date" id="visitDate" onChange={(e) => setVisitDate(e.target.value ? new Date(e.target.value) : undefined)} />
            </div>
          <div className="grid gap-2">
            <label htmlFor="visitDescription" className="text-sm font-medium">Description</label>
            <Input id="visitDescription" value={visitDescription} onChange={(e) => setVisitDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="visitVisibility" className="text-sm font-medium">Visibility (optional)</label>
            <Select value={visitVisibility} onValueChange={(v) => setVisitVisibility(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_USERS">All Users</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateVisitOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVisit} disabled={!visitDate || (!!visitTitle && !visitTitle.trim())}>Create Visit</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Album Dialog */}
      <Dialog open={isCreateAlbumOpen} onOpenChange={setIsCreateAlbumOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new album</DialogTitle>
            <DialogDescription>Create an album under this project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="albumName" className="text-sm font-medium">Album Name</label>
              <Input id="albumName" value={albumName} onChange={(e) => setAlbumName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="visibility" className="text-sm font-medium">Visibility</label>
              <Select value={albumVisibility} onValueChange={(v) => setAlbumVisibility(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateAlbumOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAlbum} disabled={!albumName.trim()}>Create Album</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={isEditAlbumOpen} onOpenChange={setIsEditAlbumOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit album</DialogTitle>
            <DialogDescription>Update album details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="editAlbumName" className="text-sm font-medium">Name</label>
              <Input id="editAlbumName" value={editAlbumData.name} onChange={(e) => setEditAlbumData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editAlbumVisibility" className="text-sm font-medium">Visibility</label>
              <Select value={editAlbumData.visibility} onValueChange={(v) => setEditAlbumData(prev => ({ ...prev, visibility: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditAlbumOpen(false)}>Cancel</Button>
            <Button onClick={saveEditAlbum} disabled={!editAlbumData.name.trim()}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditVisitOpen} onOpenChange={setIsEditVisitOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit visit</DialogTitle>
            <DialogDescription>Update visit details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="editVisitTitle" className="text-sm font-medium">Title</label>
              <Input id="editVisitTitle" value={editVisitData.title || ''} onChange={(e) => setEditVisitData(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editVisitDate" className="text-sm font-medium">Date</label>
              <Input type="date" id="editVisitDate" value={editVisitData.visitDate ? new Date(editVisitData.visitDate).toISOString().slice(0,10) : ''} onChange={(e) => setEditVisitData(prev => ({ ...prev, visitDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editVisitDescription" className="text-sm font-medium">Description</label>
              <Input id="editVisitDescription" value={editVisitData.description || ''} onChange={(e) => setEditVisitData(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editVisitVisibility" className="text-sm font-medium">Visibility</label>
              <Select value={editVisitData.visibility} onValueChange={(v) => setEditVisitData(prev => ({ ...prev, visibility: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditVisitOpen(false)}>Cancel</Button>
            <Button onClick={saveEditVisit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Album Confirmation */}
      <AlertDialog open={!!deleteAlbumId} onOpenChange={(open) => !open && setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete album?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlbumId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteAlbumId) return;
                await dispatch(deleteAlbum(deleteAlbumId));
                setDeleteAlbumId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Visit Confirmation */}
      <AlertDialog open={!!deleteVisitId} onOpenChange={(open) => !open && setDeleteVisitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete visit?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteVisitId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteVisitId) return;
                await dispatch(deleteVisit(deleteVisitId));
                setDeleteVisitId(null);
                if (album?.projectId) dispatch(fetchVisits({ projectId: album.projectId }));
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default AlbumPhotos;
