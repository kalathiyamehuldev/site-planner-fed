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

// Visit interfaces
export interface Visit {
  id: string;
  title: string;
  description?: string;
  visitDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  attendees?: any;
  notes?: string;
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  photos?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    caption?: string;
  }>;
  _count?: {
    photos: number;
  };
}

export interface CreateVisitData {
  title?: string;
  description?: string;
  visitDate: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  attendees?: any;
  notes?: string;
  projectId: string;
}

export interface UpdateVisitData {
  title?: string;
  description?: string;
  visitDate?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  attendees?: any;
  notes?: string;
}

export interface VisitFilterParams {
  projectId?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedVisitsResponse {
  items: Visit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AlbumStats {
  albumTitle: string;
  albumDate: string;
  totalPhotos: number;
  photosWithLocation: number;
  photosWithoutLocation: number;
  publicPhotos: number;
  privatePhotos: number;
  locationStats: Array<{
    locationId: string;
    locationName: string;
    photoCount: number;
  }>;
}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Async thunks
export const fetchVisits = createAsyncThunk(
  'visits/fetchVisits',
  async (filters: VisitFilterParams = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      
      if (!companyId) {
        console.warn('No company selected, proceeding without company filter');
      }
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response: any = await api.get(`/visits?${params.toString()}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch visits',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch visits');
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
      console.error('Error fetching visits:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch visits',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch visits');
    }
  }
);

export const fetchVisitsByProject = createAsyncThunk(
  'visits/fetchVisitsByProject',
  async (projectId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      
      if (!companyId) {
        console.warn('No company selected, proceeding without company filter');
      }
      
      const response: any = await api.get(`/visits/project/${projectId}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch project visits',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch project visits');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching project visits:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch project visits',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch project visits');
    }
  }
);

export const createVisit = createAsyncThunk(
  'visits/createVisit',
  async (visitData: CreateVisitData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: any = await api.post('/visits', visitData);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to create visit',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to create visit');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Visit created successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create visit',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to create visit');
    }
  }
);

export const updateVisit = createAsyncThunk(
  'visits/updateVisit',
  async ({ id, data }: { id: string; data: UpdateVisitData }, { rejectWithValue }) => {
    try {
      const response: any = await api.put(`/visits/${id}`, data);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to update visit',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to update visit');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Visit updated successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update visit',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to update visit');
    }
  }
);

export const deleteVisit = createAsyncThunk(
  'visits/deleteVisit',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/visits/${id}`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to delete visit',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to delete visit');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Visit deleted successfully',
      });
      
      return id;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete visit',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to delete visit');
    }
  }
);

export const fetchVisitById = createAsyncThunk(
  'visits/fetchVisitById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/visits/${id}`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch visit',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch visit');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching visit:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch visit details',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch visit');
    }
  }
);

export const fetchVisitPhotos = createAsyncThunk(
  'visits/fetchVisitPhotos',
  async (visitId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/visits/${visitId}/photos`);
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

export const fetchAlbumStats = createAsyncThunk(
  'visits/fetchAlbumStats',
  async (visitId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/visits/${visitId}/album-stats`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch album statistics',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch album statistics');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching album stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch album statistics',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch album statistics');
    }
  }
);

interface VisitsState {
  visits: Visit[];
  selectedVisit: Visit | null;
  visitPhotos: any[];
  albumStats: AlbumStats | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: VisitFilterParams;
  loading: boolean;
  error: string | null;
}

const initialState: VisitsState = {
  visits: [],
  selectedVisit: null,
  visitPhotos: [],
  albumStats: null,
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
  error: null,
};

export const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    setSelectedVisit: (state, action: PayloadAction<string>) => {
      state.selectedVisit = state.visits.find(visit => visit.id === action.payload) || null;
    },
    clearSelectedVisit: (state) => {
      state.selectedVisit = null;
      state.visitPhotos = [];
      state.albumStats = null;
    },
    setFilters: (state, action: PayloadAction<Partial<VisitFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 10 };
    },
    clearVisits: (state) => {
      state.visits = [];
    },
    clearVisitPhotos: (state) => {
      state.visitPhotos = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch visits
    builder
      .addCase(fetchVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.visits = action.payload.items;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch visits by project
      .addCase(fetchVisitsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitsByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.visits = action.payload;
      })
      .addCase(fetchVisitsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create visit
      .addCase(createVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.visits.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update visit
      .addCase(updateVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVisit.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.visits.findIndex(visit => visit.id === action.payload.id);
        if (index !== -1) {
          state.visits[index] = action.payload;
          if (state.selectedVisit?.id === action.payload.id) {
            state.selectedVisit = action.payload;
          }
        }
      })
      .addCase(updateVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete visit
      .addCase(deleteVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.visits = state.visits.filter(visit => visit.id !== action.payload);
        if (state.selectedVisit?.id === action.payload) {
          state.selectedVisit = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch visit by ID
      .addCase(fetchVisitById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVisit = action.payload;
        // Update in visits array if it exists
        const index = state.visits.findIndex(visit => visit.id === action.payload.id);
        if (index !== -1) {
          state.visits[index] = action.payload;
        }
      })
      .addCase(fetchVisitById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch visit photos
      .addCase(fetchVisitPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.visitPhotos = action.payload;
      })
      .addCase(fetchVisitPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch album stats
      .addCase(fetchAlbumStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbumStats.fulfilled, (state, action) => {
        state.loading = false;
        state.albumStats = action.payload;
      })
      .addCase(fetchAlbumStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedVisit,
  clearSelectedVisit,
  setFilters,
  clearFilters,
  clearVisits,
  clearVisitPhotos,
} = visitsSlice.actions;

// Selectors
export const selectAllVisits = (state: RootState) => state.visits.visits;
export const selectSelectedVisit = (state: RootState) => state.visits.selectedVisit;
export const selectVisitById = (id: string) => (state: RootState) =>
  state.visits.visits.find(visit => visit.id === id);
export const selectVisitsByProject = (projectId: string) => (state: RootState) =>
  state.visits.visits.filter(visit => visit.projectId === projectId);
export const selectVisitPhotos = (state: RootState) => state.visits.visitPhotos;
export const selectAlbumStats = (state: RootState) => state.visits.albumStats;
export const selectVisitsLoading = (state: RootState) => state.visits.loading;
export const selectVisitsError = (state: RootState) => state.visits.error;
export const selectVisitsPagination = (state: RootState) => state.visits.pagination;
export const selectVisitsFilters = (state: RootState) => state.visits.filters;

export default visitsSlice.reducer;