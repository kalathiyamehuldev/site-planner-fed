
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '@/lib/axios';

// API Response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// API interfaces
export interface ApiTimeEntry {
  id: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  isBillable: boolean;
  hourlyRate?: number;
  billableAmount?: number;
  status: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  isRunning: boolean;
  taskId?: string;
  projectId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTimeEntryData {
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  isBillable: boolean;
  hourlyRate?: number;
  taskId?: string;
  projectId?: string;
  userId?: string;
  status?: string;
}

export interface UpdateTimeEntryData {
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  isBillable?: boolean;
  hourlyRate?: number;
  status?: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
}

export interface TimeEntryFilterParams {
  projectId?: string;
  taskId?: string;
  userId?: string;
  status?: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  isBillable?: boolean;
  isRunning?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StartTimerData {
  taskId?: string;
  projectId?: string;
  description?: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

export interface StopTimerData {
  timeEntryId: string;
  description?: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

export interface TimerStatus {
  isRunning: boolean;
  timeEntry?: ApiTimeEntry;
}

export interface TimeEntrySummary {
  totalHours: number;
  billableHours: number;
  totalAmount: number;
  entriesCount: number;
  byProject: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    amount: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    hours: number;
    amount: number;
  }>;
}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Frontend TimeEntry interface
export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  isBillable: boolean;
  hourlyRate: number;
  billableAmount: number;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
  isRunning: boolean;
  task?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type TimeEntryStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

// Transform API time entry to frontend format
const transformApiTimeEntry = (apiTimeEntry: ApiTimeEntry): TimeEntry => ({
  id: apiTimeEntry.id,
  taskId: apiTimeEntry.taskId || '',
  projectId: apiTimeEntry.projectId || '',
  userId: apiTimeEntry.userId,
  description: apiTimeEntry.description || '',
  date: apiTimeEntry.date,
  startTime: apiTimeEntry.startTime || '',
  endTime: apiTimeEntry.endTime || '',
  duration: apiTimeEntry.duration || 0,
  isBillable: apiTimeEntry.isBillable,
  hourlyRate: apiTimeEntry.hourlyRate || 0,
  billableAmount: apiTimeEntry.billableAmount || 0,
  status: apiTimeEntry.status === 'TO_DO' ? 'To Do' as const :
          apiTimeEntry.status === 'IN_PROGRESS' ? 'In Progress' as const :
          apiTimeEntry.status === 'IN_REVIEW' ? 'In Review' as const :
          'Done' as const,
  isRunning: apiTimeEntry.isRunning,
  task: apiTimeEntry.task,
  project: apiTimeEntry.project,
  user: apiTimeEntry.user,
  createdAt: apiTimeEntry.createdAt,
  updatedAt: apiTimeEntry.updatedAt,
});

// Helper function to calculate total hours from time entries
const calculateTotalHours = (timeEntries: TimeEntry[]): number => {
  return timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
};

const users = [
  { id: "user1", name: "Alex Jones", hourlyRate: 85 },
  { id: "user2", name: "Sarah Smith", hourlyRate: 75 },
  { id: "user3", name: "Robert Lee", hourlyRate: 80 },
  { id: "user4", name: "Emma Watson", hourlyRate: 90 },
];

export type User = typeof users[0];

// Async thunks
export const fetchTimeEntries = createAsyncThunk(
  'timeTracking/fetchTimeEntries',
  async (filters: TimeEntryFilterParams = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      
      // Skip company ID check if not available (for development/testing)
      if (!companyId) {
        console.warn('No company selected, proceeding without company filter');
      }
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response: any = await api.get(`/time-tracking?${params.toString()}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch time entries');
      }
      
      // The backend returns data wrapped in ApiResponse.data
      const paginatedData = response.data || {};
      
      return {
        items: (paginatedData?.items || []).map(transformApiTimeEntry),
        total: paginatedData?.total || 0,
        page: paginatedData?.page || 1,
        limit: paginatedData?.limit || 10,
        totalPages: paginatedData?.totalPages || 0,
      };
    } catch (error: any) {
      console.error('Error fetching time entries:', error);
      return rejectWithValue(error.message || 'Failed to fetch time entries');
    }
  }
);

export const createTimeEntry = createAsyncThunk(
  'timeTracking/createTimeEntry',
  async (timeEntryData: CreateTimeEntryData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: any = await api.post('/time-tracking', timeEntryData);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create time entry');
      }
      
      return transformApiTimeEntry(response.data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create time entry');
    }
  }
);

export const updateTimeEntry = createAsyncThunk(
  'timeTracking/updateTimeEntry',
  async ({ id, data }: { id: string; data: UpdateTimeEntryData }, { rejectWithValue }) => {
    try {
      const response: any = await api.patch(`/time-tracking/${id}`, data);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update time entry');
      }
      
      return transformApiTimeEntry(response.data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update time entry');
    }
  }
);

export const deleteTimeEntry = createAsyncThunk(
  'timeTracking/deleteTimeEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/time-tracking/${id}`);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete time entry');
      }
      
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete time entry');
    }
  }
);

export const startTimer = createAsyncThunk(
  'timeTracking/startTimer',
  async (timerData: StartTimerData, { rejectWithValue }) => {
    try {
      const response: any = await api.post('/time-tracking/timer/start', timerData);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to start timer');
      }
      
      return transformApiTimeEntry(response.data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start timer');
    }
  }
);

export const stopTimer = createAsyncThunk(
  'timeTracking/stopTimer',
  async (stopData: StopTimerData, { rejectWithValue }) => {
    try {
      const response: any = await api.post('/time-tracking/timer/stop', stopData);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to stop timer');
      }
      
      return transformApiTimeEntry(response.data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to stop timer');
    }
  }
);



export const fetchTimeEntrySummary = createAsyncThunk(
  'timeTracking/fetchTimeEntrySummary',
  async (filters: Omit<TimeEntryFilterParams, 'page' | 'limit'> = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response: any = await api.get(`/time-tracking/summary?${params.toString()}`);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch summary');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch summary');
    }
  }
);

export const updateTimeEntryStatus = createAsyncThunk(
  'timeTracking/updateTimeEntryStatus',
  async ({ id, status }: { id: string; status: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' }, { rejectWithValue }) => {
    try {
      const response: any = await api.patch(`/time-tracking/${id}/status`, { status });
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update status');
      }
      
      return transformApiTimeEntry(response.data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update status');
    }
  }
);

interface TimeTrackingState {
  timeEntries: TimeEntry[];
  users: User[];
  activeTimer: {
    taskId: string | null;
    projectId: string | null;
    startTime: string | null;
    isRunning: boolean;
    timeEntry?: TimeEntry | null;
  };
  selectedEntry: TimeEntry | null;
  summary: TimeEntrySummary | null;
  totalHours: number; // Store total hours locally
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: TimeEntryFilterParams;
  loading: boolean;
  error: string | null;
}

const initialState: TimeTrackingState = {
  timeEntries: [],
  users,
  activeTimer: {
    taskId: null,
    projectId: null,
    startTime: null,
    isRunning: false,
    timeEntry: null,
  },
  selectedEntry: null,
  summary: null,
  totalHours: 0, // Initialize total hours
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
  error: null
};

export const timeTrackingSlice = createSlice({
  name: 'timeTracking',
  initialState,
  reducers: {
    setSelectedTimeEntry: (state, action: PayloadAction<string>) => {
      state.selectedEntry = state.timeEntries.find(entry => entry.id === action.payload) || null;
    },
    clearSelectedTimeEntry: (state) => {
      state.selectedEntry = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TimeEntryFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 10 };
    },
    cancelTimer: (state) => {
      state.activeTimer = {
        taskId: null,
        projectId: null,
        startTime: null,
        isRunning: false,
        timeEntry: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch time entries
    builder
      .addCase(fetchTimeEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.timeEntries = action.payload.items;
        state.totalHours = calculateTotalHours(action.payload.items);
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create time entry
      .addCase(createTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimeEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.timeEntries.unshift(action.payload);
        state.totalHours = calculateTotalHours(state.timeEntries);
        state.pagination.total += 1;
      })
      .addCase(createTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update time entry
      .addCase(updateTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimeEntry.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.timeEntries.findIndex(entry => entry.id === action.payload.id);
        if (index !== -1) {
          state.timeEntries[index] = action.payload;
          state.totalHours = calculateTotalHours(state.timeEntries);
          if (state.selectedEntry?.id === action.payload.id) {
            state.selectedEntry = action.payload;
          }
        }
      })
      .addCase(updateTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete time entry
      .addCase(deleteTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTimeEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.timeEntries = state.timeEntries.filter(entry => entry.id !== action.payload);
        state.totalHours = calculateTotalHours(state.timeEntries);
        if (state.selectedEntry?.id === action.payload) {
          state.selectedEntry = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Start timer
      .addCase(startTimer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTimer.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTimer = {
          taskId: action.payload.taskId || null,
          projectId: action.payload.projectId || null,
          startTime: action.payload.startTime || null,
          isRunning: action.payload.isRunning,
          timeEntry: action.payload,
        };
      })
      .addCase(startTimer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Stop timer
      .addCase(stopTimer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopTimer.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTimer = {
          taskId: null,
          projectId: null,
          startTime: null,
          isRunning: false,
          timeEntry: null,
        };
        // Add the completed time entry to the list
        state.timeEntries.unshift(action.payload);
        state.totalHours = calculateTotalHours(state.timeEntries);
        state.pagination.total += 1;
      })
      .addCase(stopTimer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch summary
      .addCase(fetchTimeEntrySummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      // Update time entry status
      .addCase(updateTimeEntryStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimeEntryStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.timeEntries.findIndex(entry => entry.id === action.payload.id);
        if (index !== -1) {
          state.timeEntries[index] = action.payload;
          state.totalHours = calculateTotalHours(state.timeEntries);
          if (state.selectedEntry?.id === action.payload.id) {
            state.selectedEntry = action.payload;
          }
        }
      })
      .addCase(updateTimeEntryStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setSelectedTimeEntry, 
  clearSelectedTimeEntry, 
  setFilters,
  clearFilters,
  cancelTimer
} = timeTrackingSlice.actions;

// Selectors
export const selectAllTimeEntries = (state: RootState) => state.timeTracking.timeEntries;
export const selectSelectedTimeEntry = (state: RootState) => state.timeTracking.selectedEntry;
export const selectTimeEntryById = (id: string) => (state: RootState) => 
  state.timeTracking.timeEntries.find(entry => entry.id === id);
export const selectTimeEntriesByProject = (projectId: string) => (state: RootState) => 
  state.timeTracking.timeEntries.filter(entry => entry.projectId === projectId);
export const selectTimeEntriesByTask = (taskId: string) => (state: RootState) => 
  state.timeTracking.timeEntries.filter(entry => entry.taskId === taskId);
export const selectTimeEntriesByUser = (userId: string) => (state: RootState) => 
  state.timeTracking.timeEntries.filter(entry => entry.userId === userId);
export const selectActiveTimer = (state: RootState) => state.timeTracking.activeTimer;
export const selectUsers = (state: RootState) => state.timeTracking.users;
export const selectTimeTrackingLoading = (state: RootState) => state.timeTracking.loading;
export const selectTimeTrackingError = (state: RootState) => state.timeTracking.error;
export const selectTimeTrackingPagination = (state: RootState) => state.timeTracking.pagination;
export const selectTimeTrackingFilters = (state: RootState) => state.timeTracking.filters;
export const selectTimeEntrySummary = (state: RootState) => state.timeTracking.summary;
export const selectRunningTimeEntry = (state: RootState) => state.timeTracking.activeTimer.timeEntry;
export const selectIsTimerRunning = (state: RootState) => state.timeTracking.activeTimer.isRunning;
export const selectTotalHours = (state: RootState) => state.timeTracking.totalHours;

export default timeTrackingSlice.reducer;
