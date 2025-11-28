import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import axios from '@/lib/axios';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  documentId?: string;
  metadata?: {
    task?: {
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      member?: any;
      project?: {
        id: string;
        name: string;
      };
    };
    project?: {
      id: string;
      name: string;
    };
    document?: any;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  document?: any;
  link?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  activeFilter: 'all' | 'unread' | 'read';
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  loading: false,
  error: null,
  activeFilter: 'all',
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/notifications');
      // Handle ResponseHelper format: response.data.data contains the actual data
      const data = response.data || {};
      return {
        notifications: data.items || [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 100,
        totalPages: data.totalPages || 1
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Remove these - we'll filter on frontend instead

export const fetchNotificationCounts = createAsyncThunk(
  'notifications/fetchNotificationCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/notifications/count');
      // Handle ResponseHelper format: response.data.data contains the actual data
      return response.data.data || {};
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notification counts');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/notifications/count/unread');
      // Handle ResponseHelper format: response.data.data contains the actual data
      return response.data.data || {};
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.put('/notifications/read-all');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const markAsUnread = createAsyncThunk(
  'notifications/markAsUnread',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await axios.put(`/notifications/${notificationId}/unread`);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as unread');
    }
  }
);

export const createTestNotification = createAsyncThunk(
  'notifications/createTestNotification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/notifications/test');
      // Handle ResponseHelper format: response.data.data contains the actual data
      return response.data.data || {};
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create test notification');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.totalCount = 0;
    },
    setActiveFilter: (state, action: PayloadAction<'all' | 'unread' | 'read'>) => {
      state.activeFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.totalCount = action.payload.total || 0;
        // Calculate unread count from notifications
        state.unreadCount = state.notifications.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch notification counts
      .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
        state.totalCount = action.payload.total || 0;
        state.unreadCount = action.payload.unread || 0;
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count || 0;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark as unread
      .addCase(markAsUnread.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && notification.read) {
          notification.read = false;
          state.unreadCount += 1;
        }
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.read = true);
        state.unreadCount = 0;
      })
      // Create test notification
      .addCase(createTestNotification.fulfilled, (state, action) => {
        const newNotification = action.payload.notification;
        if (newNotification) {
          state.notifications.unshift(newNotification);
          if (!newNotification.read) {
            state.unreadCount += 1;
          }
        }
      });
  },
});

export const { addNotification, clearNotifications, setActiveFilter } = notificationsSlice.actions;

// Base selectors
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectTotalCount = (state: RootState) => state.notifications.totalCount;
export const selectNotificationsLoading = (state: RootState) => state.notifications.loading;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectActiveFilter = (state: RootState) => state.notifications.activeFilter;

// Memoized selectors - filter from main notifications array
export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => !n.read)
);

export const selectReadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => n.read)
);

// Memoized selector to get filtered notifications based on active filter
export const selectFilteredNotifications = createSelector(
  [selectNotifications, selectActiveFilter],
  (notifications, activeFilter) => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }
);

export default notificationsSlice.reducer;
