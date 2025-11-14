import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import api from '@/lib/axios';

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  activeProjects: number;
  completedProjects: number;
  pendingTasks: number;
  totalHours: number;
}

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await api.get('/dashboard/stats');
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch dashboard stats');
      }
      return (response.data || response) as DashboardStats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload as DashboardStats;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectDashboardStats = (state: RootState) => state.dashboard.stats;
export const selectDashboardStatsLoading = (state: RootState) => state.dashboard.loading;
export const selectDashboardStatsError = (state: RootState) => state.dashboard.error;

export default dashboardSlice.reducer;

