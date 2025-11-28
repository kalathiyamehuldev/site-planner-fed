import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface PreferencesState {
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
}

const initialState: PreferencesState = {
  preferences: { email: true, push: true, inApp: true },
  loading: false,
  error: null,
};

export const fetchPreferences = createAsyncThunk<
  NotificationPreferences,
  void,
  { rejectValue: string }
>(
  'notificationPreferences/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/preferences') as ApiResponse<any>;
      const status = response?.status;
      const message = response?.message;
      const data = response?.data || {};
      if (status !== 'success') {
        toast({ title: 'Error', description: message || 'Failed to load preferences', variant: 'destructive' });
        return rejectWithValue(message || 'Failed to load preferences');
      }
      return {
        email: !!data.email,
        push: !!data.push,
        inApp: !!data.inApp,
      } as NotificationPreferences;
    } catch (error: unknown) {
      const err: any = error as any;
      const msg = err?.response?.data?.message || err?.message || 'Failed to load preferences';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return rejectWithValue(msg);
    }
  }
);

export const updatePreferences = createAsyncThunk<
  NotificationPreferences,
  Partial<NotificationPreferences>,
  { rejectValue: string }
>(
  'notificationPreferences/update',
  async (prefs: Partial<NotificationPreferences>, { rejectWithValue }) => {
    try {
      const response = await api.put('/notifications/preferences', {}, {
        params: {
          email: prefs.email,
          push: prefs.push,
          inApp: prefs.inApp,
        },
      }) as ApiResponse<any>;
      const status = response?.status;
      const message = response?.message;
      const data = response?.data || {};
      if (status !== 'success') {
        toast({ title: 'Error', description: message || 'Failed to update preferences', variant: 'destructive' });
        return rejectWithValue(message || 'Failed to update preferences');
      }
      toast({ title: 'Success', description: message || 'Preferences updated' });
      return {
        email: !!data.email,
        push: !!data.push,
        inApp: !!data.inApp,
      } as NotificationPreferences;
    } catch (error: unknown) {
      const err: any = error as any;
      const msg = err?.response?.data?.message || err?.message || 'Failed to update preferences';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return rejectWithValue(msg);
    }
  }
);

const notificationPreferencesSlice = createSlice({
  name: 'notificationPreferences',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<NotificationPreferences>) => {
      state.preferences = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPreferences, clearError } = notificationPreferencesSlice.actions;
export const selectNotificationPreferences = (state: RootState) => state.notificationPreferences.preferences;
export const selectPreferencesLoading = (state: RootState) => state.notificationPreferences.loading;
export const selectPreferencesError = (state: RootState) => state.notificationPreferences.error;

export default notificationPreferencesSlice.reducer;
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}
