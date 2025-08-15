
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

// Task interfaces from taskService
export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  projectId: string;
  memberId?: string;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  projectId: string;
  memberId?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> { }

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  memberId?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}



// Task interfaces
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  assignee?: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Transform API task to frontend format
const transformApiTask = (apiTask: ApiTask): Task => ({
  id: apiTask.id,
  title: apiTask.title,
  description: apiTask.description,
  status: apiTask.status,
  priority: apiTask.priority,
  dueDate: apiTask.dueDate,
  estimatedHours: apiTask.estimatedHours,
  assignee: apiTask.member ? `${apiTask.member.firstName} ${apiTask.member.lastName}` : undefined,
  member: apiTask.member,
  project: apiTask.project,
  createdAt: apiTask.createdAt,
  updatedAt: apiTask.updatedAt,
});

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params: TaskFilterParams | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get('/tasks', { params }) as ApiResponse<{ tasks: ApiTask[]; total: number; page: number; limit: number }>;
      if (response.status === 'success' && response.data) {
        return {
          tasks: response.data.tasks.map(transformApiTask),
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch tasks');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTasksByProject = createAsyncThunk(
  'tasks/fetchTasksByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`) as ApiResponse<ApiTask[]>;
      if (response.status === 'success' && response.data) {
        return response.data.map(transformApiTask);
      } else {
        return rejectWithValue(response.message || 'Failed to fetch project tasks');
      }
    } catch (error: any) {
      console.log("error", error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tasks/${id}`) as ApiResponse<ApiTask>;
      if (response.status === 'success' && response.data) {
        return transformApiTask(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to fetch task');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task');
    }
  }
);

export const createTaskAsync = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/tasks', taskData) as ApiResponse<ApiTask>;
      if (response.status === 'success' && response.data) {
        return transformApiTask(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to create task');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTaskAsync = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, taskData }: { id: string; taskData: UpdateTaskData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${id}`, taskData) as ApiResponse<ApiTask>;
      if (response.status === 'success' && response.data) {
        return transformApiTask(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to update task');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/tasks/${id}`) as ApiResponse<void>;
      if (response.status === 'success') {
        return id;
      } else {
        return rejectWithValue(response.message || 'Failed to delete task');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const updateTaskStatusAsync = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }: { id: string; status: Task['status'] }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${id}`, { status }) as ApiResponse<ApiTask>;
      if (response.status === 'success' && response.data) {
        return transformApiTask(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to update task status');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
    }
  }
);

interface TasksState {
  tasks: Task[];
  projectTasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: TasksState = {
  tasks: [],
  projectTasks: [],
  selectedTask: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<string>) => {
      state.selectedTask = state.tasks.find(task => task.id === action.payload) || null;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch tasks by project
      .addCase(fetchTasksByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projectTasks = action.payload;
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch task by ID
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTask = action.payload;
        // Update task in list if it exists
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create task
      .addCase(createTaskAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
        state.total += 1;
        // Don't push to projectTasks - let the component refetch via fetchTasksByProject
      })
      .addCase(createTaskAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update task
      .addCase(updateTaskAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete task
      .addCase(deleteTaskAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null;
        }
        state.total -= 1;
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update task status
      .addCase(updateTaskStatusAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatusAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(updateTaskStatusAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setSelectedTask, 
  clearSelectedTask,
  clearError
} = tasksSlice.actions;

export const selectAllTasks = (state: RootState) => state.tasks.tasks;
export const selectProjectTasks = (state: RootState) => state.tasks.projectTasks;
export const selectSelectedTask = (state: RootState) => state.tasks.selectedTask;
export const selectTaskById = (id: string) => (state: RootState) => 
  state.tasks.tasks.find(task => task.id === id);
export const selectTasksByProject = (projectId: string) => (state: RootState) => 
  state.tasks.tasks.filter(task => task.project?.id === projectId);
export const selectTaskLoading = (state: RootState) => state.tasks.loading;
export const selectTaskError = (state: RootState) => state.tasks.error;
export const selectTaskTotal = (state: RootState) => state.tasks.total;
export const selectTaskPage = (state: RootState) => state.tasks.page;
export const selectTaskLimit = (state: RootState) => state.tasks.limit;
export const selectTasksByStatus = (status: TaskStatus) => (state: RootState) =>
  state.tasks.tasks.filter(task => task.status === status);
export const selectTasksByPriority = (priority: TaskPriority) => (state: RootState) =>
  state.tasks.tasks.filter(task => task.priority === priority);
export const selectTasksByAssignee = (assigneeId: string) => (state: RootState) =>
  state.tasks.tasks.filter(task => task.member?.id === assigneeId);

export default tasksSlice.reducer;
