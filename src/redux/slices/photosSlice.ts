import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

// API Response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// Photo interfaces
export interface Photo {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  metadata?: any;
  caption?: string;
  tags: string[];
  isPublic: boolean;
  projectId?: string;
  visitId?: string;
  locationId?: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
  };
  visit?: {
    id: string;
    title: string;
  };
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreatePhotoData {
  caption?: string;
  tags?: string[];
  locationId?: string;
  visitId?: string;
  projectId?: string;
  isPublic?: boolean;
}

export interface UpdatePhotoData {
  caption?: string;
  tags?: string[];
  locationId?: string;
  isPublic?: boolean;
}

export interface AssignLocationData {
  locationId?: string;
}

export interface PhotoFilterParams {
  projectId?: string;
  locationId?: string;
  visitId?: string;
  isPublic?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPhotosResponse {
  items: Photo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Async thunks
export const fetchPhotos = createAsyncThunk(
  'photos/fetchPhotos',
  async (filters: PhotoFilterParams = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      
      if (!companyId) {
        console.warn('No company selected, proceeding without company filter');
      }
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const response: any = await api.get(`/photos?${params.toString()}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch photos',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch photos');
      }
      
      const paginatedData = response.data || {};
      
      return {
        items: paginatedData?.items || [],
        total: paginatedData?.total || 0,
        page: paginatedData?.page || 1,
        limit: paginatedData?.limit || 10,
        totalPages: paginatedData?.totalPages || 0,
      };
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch photos',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch photos');
    }
  }
);

export const fetchPhotosByProject = createAsyncThunk(
  'photos/fetchPhotosByProject',
  async (projectId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      
      if (!companyId) {
        console.warn('No company selected, proceeding without company filter');
      }
      
      const response: any = await api.get(`/photos/project/${projectId}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch project photos',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch project photos');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching project photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch project photos',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch project photos');
    }
  }
);

export const fetchPhotosByLocation = createAsyncThunk(
  'photos/fetchPhotosByLocation',
  async (locationId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/photos/location/${locationId}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch location photos',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch location photos');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching location photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch location photos',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch location photos');
    }
  }
);

export const fetchPhotosByVisit = createAsyncThunk(
  'photos/fetchPhotosByVisit',
  async (visitId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/photos/visit/${visitId}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch visit photos',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch visit photos');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching visit photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch visit photos',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch visit photos');
    }
  }
);

export const uploadPhoto = createAsyncThunk(
  'photos/uploadPhoto',
  async ({ file, data }: { file: File; data: CreatePhotoData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      const response: any = await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to upload photo',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to upload photo');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Photo uploaded successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to upload photo');
    }
  }
);

export const uploadPhotoToVisit = createAsyncThunk(
  'photos/uploadPhotoToVisit',
  async ({ visitId, file, data }: { visitId: string; file: File; data: Omit<CreatePhotoData, 'projectId' | 'visitId'> }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      const response: any = await api.post(`/photos/visit/${visitId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to upload photo to visit',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to upload photo to visit');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Photo uploaded to visit successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo to visit',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to upload photo to visit');
    }
  }
);

export const updatePhoto = createAsyncThunk(
  'photos/updatePhoto',
  async ({ id, data }: { id: string; data: UpdatePhotoData }, { rejectWithValue }) => {
    try {
      const response: any = await api.put(`/photos/${id}`, data);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to update photo',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to update photo');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Photo updated successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update photo',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to update photo');
    }
  }
);

export const deletePhoto = createAsyncThunk(
  'photos/deletePhoto',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/photos/${id}`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to delete photo',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to delete photo');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Photo deleted successfully',
      });
      
      return id;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to delete photo');
    }
  }
);

export const fetchPhotoById = createAsyncThunk(
  'photos/fetchPhotoById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/photos/${id}`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch photo',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch photo');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch photo details',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch photo');
    }
  }
);

export const assignLocation = createAsyncThunk(
  'photos/assignLocation',
  async ({ id, data }: { id: string; data: AssignLocationData }, { rejectWithValue }) => {
    try {
      const response: any = await api.put(`/photos/${id}/assign-location`, data);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to assign location',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to assign location');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Location assigned successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign location',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to assign location');
    }
  }
);

interface PhotosState {
  photos: Photo[];
  selectedPhoto: Photo | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: PhotoFilterParams;
  loading: boolean;
  uploadProgress: number;
  error: string | null;
}

const initialState: PhotosState = {
  photos: [],
  selectedPhoto: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: {
    page: 1,
    limit: 10,
  },
  loading: false,
  uploadProgress: 0,
  error: null,
};

export const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setSelectedPhoto: (state, action: PayloadAction<string>) => {
      state.selectedPhoto = state.photos.find(photo => photo.id === action.payload) || null;
    },
    clearSelectedPhoto: (state) => {
      state.selectedPhoto = null;
    },
    setFilters: (state, action: PayloadAction<Partial<PhotoFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 10 };
    },
    clearPhotos: (state) => {
      state.photos = [];
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch photos
    builder
      .addCase(fetchPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload.items;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch photos by project
      .addCase(fetchPhotosByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotosByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
      })
      .addCase(fetchPhotosByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch photos by location
      .addCase(fetchPhotosByLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotosByLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
      })
      .addCase(fetchPhotosByLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch photos by visit
      .addCase(fetchPhotosByVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotosByVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
      })
      .addCase(fetchPhotosByVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upload photo
      .addCase(uploadPhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.photos.unshift(action.payload);
        state.pagination.total += 1;
        state.uploadProgress = 0;
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.uploadProgress = 0;
      })
      // Upload photo to visit
      .addCase(uploadPhotoToVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadPhotoToVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.photos.unshift(action.payload);
        state.pagination.total += 1;
        state.uploadProgress = 0;
      })
      .addCase(uploadPhotoToVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.uploadProgress = 0;
      })
      // Update photo
      .addCase(updatePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhoto.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.photos.findIndex(photo => photo.id === action.payload.id);
        if (index !== -1) {
          state.photos[index] = action.payload;
          if (state.selectedPhoto?.id === action.payload.id) {
            state.selectedPhoto = action.payload;
          }
        }
      })
      .addCase(updatePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete photo
      .addCase(deletePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = state.photos.filter(photo => photo.id !== action.payload);
        if (state.selectedPhoto?.id === action.payload) {
          state.selectedPhoto = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deletePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch photo by ID
      .addCase(fetchPhotoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotoById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPhoto = action.payload;
        // Update in photos array if it exists
        const index = state.photos.findIndex(photo => photo.id === action.payload.id);
        if (index !== -1) {
          state.photos[index] = action.payload;
        }
      })
      .addCase(fetchPhotoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Assign location
      .addCase(assignLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignLocation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.photos.findIndex(photo => photo.id === action.payload.id);
        if (index !== -1) {
          state.photos[index] = action.payload;
          if (state.selectedPhoto?.id === action.payload.id) {
            state.selectedPhoto = action.payload;
          }
        }
      })
      .addCase(assignLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedPhoto,
  clearSelectedPhoto,
  setFilters,
  clearFilters,
  clearPhotos,
  setUploadProgress,
} = photosSlice.actions;

// Selectors
export const selectAllPhotos = (state: RootState) => state.photos.photos;
export const selectSelectedPhoto = (state: RootState) => state.photos.selectedPhoto;
export const selectPhotoById = (id: string) => (state: RootState) =>
  state.photos.photos.find(photo => photo.id === id);
export const selectPhotosByProject = (projectId: string) => (state: RootState) =>
  state.photos.photos.filter(photo => photo.projectId === projectId);
export const selectPhotosByLocation = (locationId: string) => (state: RootState) =>
  state.photos.photos.filter(photo => photo.locationId === locationId);
export const selectPhotosByVisit = (visitId: string) => (state: RootState) =>
  state.photos.photos.filter(photo => photo.visitId === visitId);
export const selectPhotosLoading = (state: RootState) => state.photos.loading;
export const selectPhotosError = (state: RootState) => state.photos.error;
export const selectPhotosPagination = (state: RootState) => state.photos.pagination;
export const selectPhotosFilters = (state: RootState) => state.photos.filters;
export const selectUploadProgress = (state: RootState) => state.photos.uploadProgress;

export default photosSlice.reducer;