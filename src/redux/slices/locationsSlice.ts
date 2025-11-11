import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
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

// Location interfaces
export interface Location {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationData {
  name: string;
  projectId: string;
}

export interface UpdateLocationData {
  name?: string;
}

export interface LocationFilterParams {
  projectId?: string;
  search?: string;
}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Async thunks
export const fetchLocationsByProject = createAsyncThunk(
  'locations/fetchLocationsByProject',
  async (projectId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      
      if (!companyId) {
        console.warn('No company selected, proceeding without company filter');
      }
      
      const response: any = await api.get(`/locations/project/${projectId}`);
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch locations',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch locations');
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch locations',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch locations');
    }
  }
);

export const createLocation = createAsyncThunk(
  'locations/createLocation',
  async (locationData: CreateLocationData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: any = await api.post('/locations', locationData);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to create location',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to create location');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Location created successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create location',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to create location');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async ({ id, data }: { id: string; data: UpdateLocationData }, { rejectWithValue }) => {
    try {
      const response: any = await api.put(`/locations/${id}`, data);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to update location',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to update location');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Location updated successfully',
      });
      
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update location',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to update location');
    }
  }
);

export const deleteLocation = createAsyncThunk(
  'locations/deleteLocation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/locations/${id}`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to delete location',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to delete location');
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Location deleted successfully',
      });
      
      return id;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete location',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to delete location');
    }
  }
);

export const fetchLocationById = createAsyncThunk(
  'locations/fetchLocationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/locations/${id}`);
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch location',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch location');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching location:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch location details',
        variant: 'destructive',
      });
      return rejectWithValue(error.message || 'Failed to fetch location');
    }
  }
);

interface LocationsState {
  locations: Location[];
  selectedLocation: Location | null;
  loading: boolean;
  error: string | null;
  filters: LocationFilterParams;
}

const initialState: LocationsState = {
  locations: [],
  selectedLocation: null,
  loading: false,
  error: null,
  filters: {},
};

export const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setSelectedLocation: (state, action: PayloadAction<string>) => {
      state.selectedLocation = state.locations.find(location => location.id === action.payload) || null;
    },
    clearSelectedLocation: (state) => {
      state.selectedLocation = null;
    },
    setFilters: (state, action: PayloadAction<Partial<LocationFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearLocations: (state) => {
      state.locations = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch locations by project
    builder
      .addCase(fetchLocationsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationsByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocationsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create location
      .addCase(createLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.locations.push(action.payload);
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update location
      .addCase(updateLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.locations.findIndex(location => location.id === action.payload.id);
        if (index !== -1) {
          state.locations[index] = action.payload;
          if (state.selectedLocation?.id === action.payload.id) {
            state.selectedLocation = action.payload;
          }
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete location
      .addCase(deleteLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = state.locations.filter(location => location.id !== action.payload);
        if (state.selectedLocation?.id === action.payload) {
          state.selectedLocation = null;
        }
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch location by ID
      .addCase(fetchLocationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedLocation = action.payload;
        // Update in locations array if it exists
        const index = state.locations.findIndex(location => location.id === action.payload.id);
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
      })
      .addCase(fetchLocationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedLocation,
  clearSelectedLocation,
  setFilters,
  clearFilters,
  clearLocations,
} = locationsSlice.actions;

// Selectors
export const selectAllLocations = (state: RootState) => state.locations.locations;
export const selectSelectedLocation = (state: RootState) => state.locations.selectedLocation;
export const selectLocationById = (id: string) => (state: RootState) =>
  state.locations.locations.find(location => location.id === id);

// Memoized selector to prevent unnecessary rerenders
export const selectLocationsByProject = createSelector(
  [(state: RootState) => state.locations.locations, (_: RootState, projectId: string) => projectId],
  (locations, projectId) => locations.filter(location => location.projectId === projectId)
);

export const selectLocationsLoading = (state: RootState) => state.locations.loading;
export const selectLocationsError = (state: RootState) => state.locations.error;
export const selectLocationsFilters = (state: RootState) => state.locations.filters;

export default locationsSlice.reducer;