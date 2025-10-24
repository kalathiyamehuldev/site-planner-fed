
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '@/lib/axios';
import { toast } from 'sonner';

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
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  projectId: string;
  memberId?: string;
  parentId?: string; // added for parent linking
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
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  projectId: string;
  memberId?: string;
  parentId?: string; // Added to support subtask creation
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
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
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
  parentId?: string; // added for parent linking
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
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
  parentId: apiTask.parentId, // map parentId
  createdAt: apiTask.createdAt,
  updatedAt: apiTask.updatedAt,
});

export const fetchAllTasksByCompany = createAsyncThunk(
  'tasks/fetchAllTasksByCompany',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tasks');
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch tasks';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      toast.success(message || 'Tasks fetched successfully');
      // Handle both paginated and array responses
      const items = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data as any)
          ? (data as any)
          : [];
      return items.map(transformApiTask);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch tasks';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchTasksByProject = createAsyncThunk(
  'tasks/fetchTasksByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      const { status, data, message, error } = response as unknown as ApiResponse<ApiTask[]>;

      if (status === 'success' && data) {
        toast.success(message || 'Project tasks fetched successfully');
        return data.map(transformApiTask);
      } else {
        const errMsg = error || message || 'Failed to fetch project tasks';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch project tasks';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      const { status, data, message, error } = response as unknown as ApiResponse<ApiTask>;

      if (status === 'success' && data) {
        toast.success(message || 'Task fetched successfully');
        return transformApiTask(data);
      } else {
        const errMsg = error || message || 'Failed to fetch task';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch task';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const createTaskAsync = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/tasks', taskData);
      const { status, data, message, error } = response as unknown as ApiResponse<ApiTask>;

      if (status === 'success' && data) {
        toast.success(message || 'Task created successfully');
        return transformApiTask(data);
      } else {
        const errMsg = error || message || 'Failed to create task';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to create task';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateTaskAsync = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, taskData }: { id: string; taskData: UpdateTaskData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${id}`, taskData);
      const { status, data, message, error } = response as unknown as ApiResponse<ApiTask>;

      if (status === 'success' && data) {
        toast.success(message || 'Task updated successfully');
        return transformApiTask(data);
      } else {
        const errMsg = error || message || 'Failed to update task';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to update task';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      const { status, message, error } = response as unknown as ApiResponse<void>;

      if (status === 'success') {
        toast.success(message || 'Task deleted successfully');
        return id;
      } else {
        const errMsg = error || message || 'Failed to delete task';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to delete task';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateTaskStatusAsync = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }: { id: string; status: Task['status'] }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${id}`, { status });
      const { status: respStatus, data, message, error } = response as unknown as ApiResponse<ApiTask>;

      if (respStatus === 'success' && data) {
        toast.success(message || 'Task status updated successfully');
        return transformApiTask(data);
      } else {
        const errMsg = error || message || 'Failed to update task status';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to update task status';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
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
      // Fetch all tasks by company
      .addCase(fetchAllTasksByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTasksByCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchAllTasksByCompany.rejected, (state, action) => {
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
