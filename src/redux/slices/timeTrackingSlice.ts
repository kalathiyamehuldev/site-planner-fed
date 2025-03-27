
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for time entries
const initialTimeEntries = [
  {
    id: "time1",
    taskId: "t1",
    projectId: "p1",
    userId: "user1",
    description: "Working on floor plans",
    date: "2023-08-15",
    startTime: "09:00",
    endTime: "12:30",
    duration: 3.5,
    isBillable: true,
    hourlyRate: 85,
    billableAmount: 297.5,
    status: "Approved" as const,
  },
  {
    id: "time2",
    taskId: "t3",
    projectId: "p1",
    userId: "user1",
    description: "Client call about material selection",
    date: "2023-08-16",
    startTime: "14:00",
    endTime: "15:00",
    duration: 1,
    isBillable: true,
    hourlyRate: 85,
    billableAmount: 85,
    status: "Approved" as const,
  },
  {
    id: "time3",
    taskId: "t2",
    projectId: "p2",
    userId: "user2",
    description: "Researching furniture options",
    date: "2023-08-16",
    startTime: "10:00",
    endTime: "13:00",
    duration: 3,
    isBillable: true,
    hourlyRate: 75,
    billableAmount: 225,
    status: "Pending" as const,
  },
  {
    id: "time4",
    taskId: "t4",
    projectId: "p1",
    userId: "user3",
    description: "Lighting design work",
    date: "2023-08-17",
    startTime: "09:30",
    endTime: "12:30",
    duration: 3,
    isBillable: true,
    hourlyRate: 80,
    billableAmount: 240,
    status: "Pending" as const,
  },
  {
    id: "time5",
    taskId: "t5",
    projectId: "p3",
    userId: "user2",
    description: "Creating color schemes",
    date: "2023-08-17",
    startTime: "13:00",
    endTime: "15:30",
    duration: 2.5,
    isBillable: true,
    hourlyRate: 75,
    billableAmount: 187.5,
    status: "Approved" as const,
  },
];

const users = [
  { id: "user1", name: "Alex Jones", hourlyRate: 85 },
  { id: "user2", name: "Sarah Smith", hourlyRate: 75 },
  { id: "user3", name: "Robert Lee", hourlyRate: 80 },
  { id: "user4", name: "Emma Watson", hourlyRate: 90 },
];

export type TimeEntry = typeof initialTimeEntries[0];
export type TimeEntryStatus = 'Pending' | 'Approved' | 'Rejected';
export type User = typeof users[0];

interface TimeTrackingState {
  timeEntries: TimeEntry[];
  users: User[];
  activeTimer: {
    taskId: string | null;
    projectId: string | null;
    startTime: string | null;
    isRunning: boolean;
  };
  selectedEntry: TimeEntry | null;
  loading: boolean;
  error: string | null;
}

const initialState: TimeTrackingState = {
  timeEntries: initialTimeEntries,
  users,
  activeTimer: {
    taskId: null,
    projectId: null,
    startTime: null,
    isRunning: false,
  },
  selectedEntry: null,
  loading: false,
  error: null
};

export const timeTrackingSlice = createSlice({
  name: 'timeTracking',
  initialState,
  reducers: {
    getTimeEntries: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedTimeEntry: (state, action: PayloadAction<string>) => {
      state.selectedEntry = state.timeEntries.find(entry => entry.id === action.payload) || null;
    },
    clearSelectedTimeEntry: (state) => {
      state.selectedEntry = null;
    },
    addTimeEntry: (state, action: PayloadAction<Omit<TimeEntry, 'id'>>) => {
      const newEntry = {
        ...action.payload,
        id: `time${state.timeEntries.length + 1}`,
      };
      state.timeEntries.push(newEntry);
    },
    updateTimeEntry: (state, action: PayloadAction<{ id: string; entry: Partial<TimeEntry> }>) => {
      const { id, entry } = action.payload;
      const index = state.timeEntries.findIndex(e => e.id === id);
      if (index !== -1) {
        state.timeEntries[index] = { ...state.timeEntries[index], ...entry };
        if (state.selectedEntry?.id === id) {
          state.selectedEntry = state.timeEntries[index];
        }
      }
    },
    deleteTimeEntry: (state, action: PayloadAction<string>) => {
      state.timeEntries = state.timeEntries.filter(entry => entry.id !== action.payload);
      if (state.selectedEntry?.id === action.payload) {
        state.selectedEntry = null;
      }
    },
    startTimer: (state, action: PayloadAction<{ taskId: string; projectId: string }>) => {
      const { taskId, projectId } = action.payload;
      state.activeTimer = {
        taskId,
        projectId,
        startTime: new Date().toISOString(),
        isRunning: true,
      };
    },
    stopTimer: (state, action: PayloadAction<{ description: string; isBillable: boolean; userId: string }>) => {
      const { description, isBillable, userId } = action.payload;
      
      if (state.activeTimer.isRunning && state.activeTimer.taskId && state.activeTimer.startTime) {
        const startTime = new Date(state.activeTimer.startTime);
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const roundedDuration = Math.round(durationHours * 100) / 100; // Round to 2 decimal places
        
        const user = state.users.find(u => u.id === userId);
        const hourlyRate = user ? user.hourlyRate : 0;
        const billableAmount = isBillable ? roundedDuration * hourlyRate : 0;
        
        const newEntry: TimeEntry = {
          id: `time${state.timeEntries.length + 1}`,
          taskId: state.activeTimer.taskId,
          projectId: state.activeTimer.projectId!,
          userId,
          description,
          date: startTime.toISOString().split('T')[0],
          startTime: startTime.toTimeString().split(' ')[0].substring(0, 5),
          endTime: endTime.toTimeString().split(' ')[0].substring(0, 5),
          duration: roundedDuration,
          isBillable,
          hourlyRate,
          billableAmount,
          status: 'Pending',
        };
        
        state.timeEntries.push(newEntry);
      }
      
      state.activeTimer = {
        taskId: null,
        projectId: null,
        startTime: null,
        isRunning: false,
      };
    },
    cancelTimer: (state) => {
      state.activeTimer = {
        taskId: null,
        projectId: null,
        startTime: null,
        isRunning: false,
      };
    },
    updateTimeEntryStatus: (state, action: PayloadAction<{ id: string; status: TimeEntryStatus }>) => {
      const { id, status } = action.payload;
      const entry = state.timeEntries.find(e => e.id === id);
      if (entry) {
        entry.status = status;
      }
    }
  }
});

export const { 
  getTimeEntries, 
  setSelectedTimeEntry, 
  clearSelectedTimeEntry, 
  addTimeEntry, 
  updateTimeEntry, 
  deleteTimeEntry,
  startTimer,
  stopTimer,
  cancelTimer,
  updateTimeEntryStatus 
} = timeTrackingSlice.actions;

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

export default timeTrackingSlice.reducer;
