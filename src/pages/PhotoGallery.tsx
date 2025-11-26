import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import { format } from "date-fns";
import {
  Image,
  MoreVertical,
  Trash2Icon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import usePermission from "@/hooks/usePermission";
import { fetchVisits, createVisit, selectAllVisits, selectVisitsLoading, selectVisitsError, selectVisitsPagination, clearVisits } from "@/redux/slices/visitsSlice";
import {
  selectUser,
  selectSelectedCompany,
  selectAuthLoading,
} from "@/redux/slices/authSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import { fetchCompanyRootAlbums, fetchChildrenAlbums, selectCompanyRootAlbums, updateAlbum, deleteAlbum } from "@/redux/slices/albumsSlice";
import { Search } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CreateVisitFormData {
  description: string;
  visitDate: Date | undefined;
  projectId: string;
  visibility?: 'ALL_USERS' | 'CUSTOMER';
}

const PhotoGallery: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();

  // Redux state
  const error = useAppSelector(selectVisitsError);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const authLoading = useAppSelector(selectAuthLoading);
  const rootAlbums = useAppSelector(selectCompanyRootAlbums);
  const albumsByParent = useAppSelector((state) => state.albums.byParent);
  const albumsLoading = useAppSelector((state) => state.albums.loading);
  const albumsError = useAppSelector((state) => state.albums.error);

  // Local state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateVisitFormData>({
    description: "",
    visitDate: undefined,
    projectId: "",
  });
  const [albumSearch, setAlbumSearch] = useState<string>("");
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false);
  const [editAlbumData, setEditAlbumData] = useState<{ id?: string; name: string; visibility: "ALL_USERS" | "CUSTOMER" }>({ name: "", visibility: "ALL_USERS" });
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);

  // Check permissions
  const canView = hasPermission("photos", "read");
  const canManage = hasPermission("photos", "manage");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch, selectedCompany]);

  useEffect(() => {
    dispatch(fetchCompanyRootAlbums());
  }, [dispatch]);

  useEffect(() => {
    const onFocus = () => dispatch(fetchCompanyRootAlbums());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [dispatch]);

  useEffect(() => {
    rootAlbums.forEach((album) => {
      if (!albumsByParent[album.id]) {
        dispatch(fetchChildrenAlbums(album.id));
      }
    });
  }, [dispatch, rootAlbums, albumsByParent]);

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

  const removeAlbum = async (id: string) => {
    setDeleteAlbumId(id);
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    return words.length >= 2 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Generate avatar colors based on user name
  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700' },
      { bg: 'bg-green-100', text: 'text-green-700' },
      { bg: 'bg-purple-100', text: 'text-purple-700' },
      { bg: 'bg-pink-100', text: 'text-pink-700' },
      { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      { bg: 'bg-red-100', text: 'text-red-700' },
      { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      { bg: 'bg-teal-100', text: 'text-teal-700' },
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  const handleCreateVisit = async () => {
    if (!createFormData.visitDate || !createFormData.projectId) return;

    try {
      const visitData = {
        description: createFormData.description,
        visitDate: createFormData.visitDate.toISOString(),
        projectId: createFormData.projectId,
      };
      if (createFormData.visibility) {
        (visitData as any).visibility = createFormData.visibility;
      }

      await dispatch(createVisit(visitData));
      
      // Reset form and close dialog
      setCreateFormData({
        description: "",
        visitDate: undefined,
        projectId: "",
      });
      setIsCreateDialogOpen(false);
      
      // Refresh visits list
      dispatch(fetchVisits({}));
    } catch (error) {
      console.error("Failed to create visit:", error);
    }
  };

  const handleVisitClick = (visitId: string) => {
    navigate(`/photos/album/${visitId}`);
  };

  const formatVisitDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };


  if (!canView && authLoading) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="Photos" />
        <GlassCard className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-24 bg-gray-100 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </PageContainer>
    );
  }

  const filteredAlbums = React.useMemo(() => {
    const term = albumSearch.trim().toLowerCase();
    if (!term) return rootAlbums;
    return rootAlbums.filter(a => a.name?.toLowerCase().includes(term));
  }, [rootAlbums, albumSearch]);

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Photos" 
      />

      

      {/* Albums section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Albums
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {rootAlbums.length}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Browse company albums and their children.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search albums..."
                value={albumSearch}
                onChange={(e) => setAlbumSearch(e.target.value)}
                className="border-0 focus-visible:ring-0 focus:ring-0 outline-none p-0 w-[220px]"
              />
            </div>
          </div>
        </div>

        

        

        {albumsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={`alb-skel-${i}`} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </GlassCard>
            ))}
          </div>
        ) : rootAlbums.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border">
                <Image className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-gray-600 mt-3">No projects yet</p>
              {albumsError && (
                <div className="mt-3">
                  <p className="text-red-600 text-sm">{albumsError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(fetchCompanyRootAlbums())}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredAlbums.map((album) => (
              <GlassCard key={album.id} className="p-3 sm:p-6 hover:shadow-lg">
                <div
                  className="h-24 bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border cursor-pointer"
                  onClick={() => navigate(`/albums/${album.id}`)}
                >
                  <Image className="h-8 w-8 text-blue-400" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-semibold text-gray-900 truncate">{album.name}</div>
                    {album.isDefault && <div className="text-xs text-blue-700">Default</div>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditAlbum(album); }}>Edit</DropdownMenuItem> */}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); removeAlbum(album.id); }} className="text-red-600 flex items-center gap-2"><Trash2Icon size={14}/>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <GlassCard className="p-6 border-red-200 bg-red-50">
            <div className="text-center space-y-2">
              <p className="text-red-800 font-medium">Failed to load visits</p>
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => dispatch(fetchVisits({}))}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
      {/* Edit Album Dialog */}
      <Dialog open={isEditAlbumOpen} onOpenChange={setIsEditAlbumOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit album</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editAlbumName" className="text-sm font-medium">Name</Label>
              <Input id="editAlbumName" value={editAlbumData.name} onChange={(e) => setEditAlbumData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editAlbumVisibility" className="text-sm font-medium">Visibility</Label>
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

      {/* Delete Album Confirmation */}
      <AlertDialog open={!!deleteAlbumId} onOpenChange={(open) => !open && setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete album?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
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

    </PageContainer>
  );
};

export default PhotoGallery;
