import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export type VisibilityScope = 'ALL_USERS' | 'CUSTOMER';

export interface Album {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  visibility: VisibilityScope;
  projectId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { children: number; photos: number };
}

export interface Photo {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  caption?: string;
  tags?: string[];
  projectId: string;
  albumId?: string;
  locationId?: string;
  visitId?: string;
  createdAt: string;
}

export const fetchCompanyRootAlbums = createAsyncThunk<Album[], void, { rejectValue: string }>(
  'albums/fetchCompanyRoot',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<Album[]>>('/albums/root');
      if (res.data.status === 'success') {
        return res.data.data || [];
      }
      return rejectWithValue(res.data.error || 'Failed to fetch root albums');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const fetchChildrenAlbums = createAsyncThunk<Album[], string, { rejectValue: string }>(
  'albums/fetchChildren',
  async (parentId, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<Album[]>>(`/albums/${parentId}/children`);
      if (res.data.status === 'success') {
        return res.data.data || [];
      }
      return rejectWithValue(res.data.error || 'Failed to fetch child albums');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const fetchAlbum = createAsyncThunk<Album, string, { rejectValue: string }>(
  'albums/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<Album>>(`/albums/${id}`);
      if (res.data.status === 'success' && res.data.data) {
        return res.data.data;
      }
      return rejectWithValue(res.data.error || 'Failed to fetch album');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const createAlbum = createAsyncThunk<Album, { name: string; projectId: string; parentId?: string; description?: string; visibility?: VisibilityScope }, { rejectValue: string }>(
  'albums/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post<ApiResponse<Album>>('/albums', payload);
      if (res.data.status === 'success' && res.data.data) {
        toast({ title: 'Album created' });
        return res.data.data;
      }
      return rejectWithValue(res.data.error || 'Failed to create album');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const updateAlbum = createAsyncThunk<Album, { id: string; name?: string; description?: string; parentId?: string; visibility?: VisibilityScope }, { rejectValue: string }>(
  'albums/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.put<ApiResponse<Album>>(`/albums/${id}`, data);
      if (res.data.status === 'success' && res.data.data) {
        toast({ title: 'Album updated' });
        return res.data.data;
      }
      return rejectWithValue(res.data.error || 'Failed to update album');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const deleteAlbum = createAsyncThunk<string, string, { rejectValue: string }>(
  'albums/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete<ApiResponse<Album>>(`/albums/${id}`);
      if (res.data.status === 'success') {
        toast({ title: 'Album deleted' });
        return id;
      }
      return rejectWithValue(res.data.error || 'Failed to delete album');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const fetchAlbumPhotos = createAsyncThunk<Photo[], string, { rejectValue: string }>(
  'albums/fetchPhotos',
  async (albumId, { rejectWithValue }) => {
    try {
      const res = await api.get<ApiResponse<Photo[]>>(`/albums/${albumId}/photos`);
      if (res.data.status === 'success') {
        return res.data.data || [];
      }
      return rejectWithValue(res.data.error || 'Failed to fetch album photos');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const addPhotoToAlbum = createAsyncThunk<Photo, { albumId: string; photoId: string }, { rejectValue: string }>(
  'albums/addPhoto',
  async ({ albumId, photoId }, { rejectWithValue }) => {
    try {
      const res = await api.put<ApiResponse<Photo>>(`/albums/${albumId}/add-photo/${photoId}`);
      if (res.data.status === 'success' && res.data.data) {
        toast({ title: 'Photo added to album' });
        return res.data.data;
      }
      return rejectWithValue(res.data.error || 'Failed to add photo');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const uploadPhotoToAlbum = createAsyncThunk<Photo, { albumId: string; file: File; caption?: string; tags?: string[]; locationId?: string; isPublic?: boolean }, { rejectValue: string }>(
  'albums/uploadPhoto',
  async ({ albumId, file, caption, tags, locationId, isPublic }, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append('file', file);
      if (caption) form.append('caption', caption);
      if (tags) form.append('tags', JSON.stringify(tags));
      if (locationId) form.append('locationId', locationId);
      if (isPublic !== undefined) form.append('isPublic', String(isPublic));
      form.append('albumId', albumId);

      const res = await api.post<ApiResponse<Photo>>('/photos/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status === 'success' && res.data.data) {
        toast({ title: 'Photo uploaded' });
        return res.data.data;
      }
      return rejectWithValue(res.data.error || 'Failed to upload photo');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

interface AlbumsState {
  root: Album[];
  byParent: Record<string, Album[]>;
  details: Record<string, Album>;
  photosByAlbum: Record<string, Photo[]>;
  loading: boolean;
  error?: string;
}

const initialState: AlbumsState = {
  root: [],
  byParent: {},
  details: {},
  photosByAlbum: {},
  loading: false,
};

const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyRootAlbums.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchCompanyRootAlbums.fulfilled, (state, action) => {
        state.loading = false;
        state.root = action.payload;
      })
      .addCase(fetchCompanyRootAlbums.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchChildrenAlbums.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchChildrenAlbums.fulfilled, (state, action) => {
        state.loading = false;
        state.byParent[action.meta.arg] = action.payload;
      })
      .addCase(fetchChildrenAlbums.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAlbum.fulfilled, (state, action) => {
        state.details[action.payload.id] = action.payload;
      })
      .addCase(createAlbum.fulfilled, (state, action) => {
        const album = action.payload;
        if (album.parentId) {
          const arr = state.byParent[album.parentId] || [];
          state.byParent[album.parentId] = [album, ...arr];
        } else {
          state.root = [album, ...state.root];
        }
      })
      .addCase(updateAlbum.fulfilled, (state, action) => {
        const album = action.payload;
        state.details[album.id] = album;
        state.root = state.root.map((a) => (a.id === album.id ? album : a));
        if (album.parentId) {
          const parentArr = state.byParent[album.parentId] || [];
          state.byParent[album.parentId] = parentArr.map((a) => (a.id === album.id ? album : a));
        }
      })
      .addCase(deleteAlbum.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.details[id];
        state.root = state.root.filter((a) => a.id !== id);
        Object.keys(state.byParent).forEach((pid) => {
          state.byParent[pid] = (state.byParent[pid] || []).filter((a) => a.id !== id);
        });
      })
      .addCase(fetchAlbumPhotos.fulfilled, (state, action) => {
        state.photosByAlbum[action.meta.arg] = action.payload;
      })
      .addCase(addPhotoToAlbum.fulfilled, (state, action) => {
        const photo = action.payload;
        const albumId = photo.albumId as string;
        const arr = state.photosByAlbum[albumId] || [];
        const idx = arr.findIndex((p) => p.id === photo.id);
        if (idx >= 0) arr[idx] = photo; else state.photosByAlbum[albumId] = [photo, ...arr];
      })
      .addCase(uploadPhotoToAlbum.fulfilled, (state, action) => {
        const photo = action.payload;
        const albumId = photo.albumId as string;
        const arr = state.photosByAlbum[albumId] || [];
        state.photosByAlbum[albumId] = [photo, ...arr];
      });
  },
});

export const selectCompanyRootAlbums = (state: RootState) => state.albums.root || [];
export const selectAlbumsByParent = (state: RootState, parentId: string) => state.albums.byParent[parentId] || [];
export const selectAlbumDetails = (state: RootState, id: string) => state.albums.details[id];
export const selectAlbumPhotos = (state: RootState, albumId: string) => state.albums.photosByAlbum[albumId] || [];

export default albumsSlice.reducer;