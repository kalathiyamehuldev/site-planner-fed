
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
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
  parent?: {
    id: string;
    title: string;
  };
  assigneeType?: 'VENDOR' | 'USER';
  assigneeId?: string;
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
  parent?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
  assigneeType?: 'VENDOR' | 'USER';
  assigneeId?: string;
  assignedUserIds?: string[];
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Comments interfaces
export interface TaskComment {
  id: string;
  content: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  mentionUserIds?: string[];
  reactions?: any[];
  attachments?: any[];
}

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
  parent: apiTask.parent ? { id: apiTask.parent.id, title: apiTask.parent.title } : undefined,
  createdAt: apiTask.createdAt,
  updatedAt: apiTask.updatedAt,
  assigneeType: apiTask.assigneeType,
  assigneeId: apiTask.assigneeId,
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

      //toast.success(message || 'Tasks fetched successfully');
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

// Fetch only parent tasks (for Tasks page, TaskView, TaskTimeline)
export const fetchParentTasksByCompany = createAsyncThunk(
  'tasks/fetchParentTasksByCompany',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tasks?parentId=null');
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch parent tasks';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Parent tasks fetched successfully');
      // Handle both paginated and array responses
      const items = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data as any)
          ? (data as any)
          : [];
      return items.map(transformApiTask);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch parent tasks';
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
        //toast.success(message || 'Project tasks fetched successfully');
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

// Fetch only parent tasks by project (for Tasks page, TaskView, TaskTimeline)
export const fetchParentTasksByProject = createAsyncThunk(
  'tasks/fetchParentTasksByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}?parentId=null`);
      const { status, data, message, error } = response as unknown as ApiResponse<ApiTask[]>;

      if (status === 'success' && data) {
        //toast.success(message || 'Parent project tasks fetched successfully');
        return data.map(transformApiTask);
      } else {
        const errMsg = error || message || 'Failed to fetch parent project tasks';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch parent project tasks';
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
        //toast.success(message || 'Task fetched successfully');
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
        //toast.success(message || 'Task created successfully');
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
        //toast.success(message || 'Task updated successfully');
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
        //toast.success(message || 'Task deleted successfully');
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
        //toast.success(message || 'Task status updated successfully');
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

export const assignVendorToTaskAsync = createAsyncThunk(
  'tasks/assignVendorToTask',
  async (
    { id, vendorId }: { id: string; vendorId: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const response = await api.post(`/tasks/${id}/assign-vendor/${vendorId}`);
      const { status, data, message, error } = response as unknown as ApiResponse<any>;
      if (status === 'error') {
        const errMsg = error || message || 'Failed to assign vendor';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
      const state = getState() as RootState;
      const vendors = (state as any)?.admin?.vendors?.items || [];
      const vendor = vendors.find((v: any) => v.id === data?.assigneeId);
      const updated: Partial<Task> = {
        assigneeType: 'VENDOR',
        assigneeId: data?.assigneeId,
        assignee: vendor ? `${vendor.firstName} ${vendor.lastName}` : undefined,
        member: undefined,
      };
      return { id, updated } as { id: string; updated: Partial<Task> };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to assign vendor';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const assignUsersToTaskAsync = createAsyncThunk(
  'tasks/assignUsersToTask',
  async (
    { id, userIds }: { id: string; userIds: string[] },
    { rejectWithValue, getState }
  ) => {
    try {
      const response = await api.post(`/tasks/${id}/assign-users`, { userIds });
      const { status, data, message, error } = response as unknown as ApiResponse<any>;
      if (status === 'error') {
        const errMsg = error || message || 'Failed to assign users';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
      const state = getState() as RootState;
      const allTasks = (state as any)?.tasks?.tasks || [];
      const selected = (state as any)?.tasks?.selectedTask || undefined;
      const task = selected?.id === id ? selected : allTasks.find((t: any) => t.id === id);
      const projectId = task?.project?.id;
      const membersMap = ((state as any)?.projects?.projectMembers || {})[projectId || ''] || [];
      const names = (data?.userIds || userIds || []).map((uid: string) => {
        const m = membersMap.find((pm: any) => pm.user?.id === uid);
        return m ? `${m.user.firstName} ${m.user.lastName}` : undefined;
      }).filter(Boolean);
      const updated: Partial<Task> = {
        assigneeType: 'USER',
        assigneeId: undefined,
        assignedUserIds: data?.userIds || userIds,
        assignee: names && names.length ? names.join(', ') : undefined,
        member: undefined,
      };
      return { id, updated } as { id: string; updated: Partial<Task> };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to assign users';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Comments thunks
export const fetchTaskCommentsAsync = createAsyncThunk(
  'tasks/fetchTaskComments',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch comments';
        toast.error(errMsg);
        return rejectWithValue({ taskId, error: errMsg });
      }

      const items = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data as any)
          ? (data as any)
          : [];

      //toast.success(message || 'Comments fetched successfully');
      return { taskId, comments: items as TaskComment[] };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch comments';
      toast.error(errMsg);
      return rejectWithValue({ taskId, error: errMsg });
    }
  }
);

export const createTaskCommentAsync = createAsyncThunk(
  'tasks/createTaskComment',
  async (
    { taskId, content, parentId, mentionUserIds }: { taskId: string; content: string; parentId?: string; mentionUserIds?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, { content, parentId, mentionUserIds });
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to create comment';
        toast.error(errMsg);
        return rejectWithValue({ taskId, error: errMsg });
      }

      //toast.success(message || 'Comment posted');
      return { taskId, comment: data as TaskComment };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to create comment';
      toast.error(errMsg);
      return rejectWithValue({ taskId, error: errMsg });
    }
  }
);

// Add: update comment thunk
export const updateTaskCommentAsync = createAsyncThunk(
  'tasks/updateTaskComment',
  async (
    { taskId, commentId, content }: { taskId: string; commentId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(`/tasks/comments/${commentId}`, { content });
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to update comment';
        toast.error(errMsg);
        return rejectWithValue({ taskId, error: errMsg });
      }

      //toast.success(message || 'Comment updated');
      return { taskId, comment: data as TaskComment };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to update comment';
      toast.error(errMsg);
      return rejectWithValue({ taskId, error: errMsg });
    }
  }
);

export const deleteTaskCommentAsync = createAsyncThunk(
  'tasks/deleteTaskComment',
  async (
    { taskId, commentId }: { taskId: string; commentId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.delete(`/tasks/comments/${commentId}`);
      const { status, message, error } = response as unknown as ApiResponse<void>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to delete comment';
        toast.error(errMsg);
        return rejectWithValue({ taskId, error: errMsg });
      }

      //toast.success(message || 'Comment deleted');
      return { taskId, commentId };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to delete comment';
      toast.error(errMsg);
      return rejectWithValue({ taskId, error: errMsg });
    }
  }
);

export const addTaskCommentReactionAsync = createAsyncThunk(
  'tasks/addTaskCommentReaction',
  async (
    { taskId, commentId, type }: { taskId: string; commentId: string; type: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/tasks/comments/${commentId}/reactions`, { type });
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to add reaction';
        toast.error(errMsg);
        return rejectWithValue({ taskId, error: errMsg });
      }

      //toast.success(message || 'Reaction added');
      return { taskId, commentId, reaction: data };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to add reaction';
      toast.error(errMsg);
      return rejectWithValue({ taskId, error: errMsg });
    }
  }
);

export const removeTaskCommentReactionAsync = createAsyncThunk(
  'tasks/removeTaskCommentReaction',
  async (
    { taskId, commentId, type }: { taskId: string; commentId: string; type: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const response = await api.delete(`/tasks/comments/${commentId}/reactions`, { data: { type } });
      const { status, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to remove reaction';
        toast.error(errMsg);
        return rejectWithValue({ taskId, error: errMsg });
      }

      const state = getState() as RootState;
      const userId = (state as any)?.auth?.user?.id;

      //toast.success(message || 'Reaction removed');
      return { taskId, commentId, type, userId };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to remove reaction';
      toast.error(errMsg);
      return rejectWithValue({ taskId, error: errMsg });
    }
  }
);

// Fetch subtasks by parent ID (company is derived from JWT on backend)
// Module-scoped guard to dedupe concurrent fetches across components
const inflightSubtaskFetches = new Set<string>();

export const fetchSubtasksByParent = createAsyncThunk(
  'tasks/fetchSubtasksByParent',
  async (parentId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const alreadyLoaded = parentId in state.tasks.subtasksByParentId;
      if (alreadyLoaded || inflightSubtaskFetches.has(parentId)) {
        // Return cached subtasks to avoid network call
        const cached = state.tasks.subtasksByParentId[parentId] || [];
        return { parentId, subtasks: cached } as { parentId: string; subtasks: Task[] };
      }

      inflightSubtaskFetches.add(parentId);

      const response = await api.get(`/tasks/parent/${parentId}`);
      const { status, data, message, error } = response as unknown as ApiResponse<any>;

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch subtasks';
        inflightSubtaskFetches.delete(parentId);
        toast.error(errMsg);
        return rejectWithValue({ parentId, error: errMsg });
      }

      const items = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data as any)
          ? (data as any)
          : [];

      const mapped = items.map(transformApiTask);
      inflightSubtaskFetches.delete(parentId);
      //toast.success(message || 'Subtasks fetched successfully');
      return { parentId, subtasks: mapped } as { parentId: string; subtasks: Task[] };
    } catch (error: any) {
      inflightSubtaskFetches.delete(parentId);
      const errMsg = error?.message || 'Failed to fetch subtasks';
      toast.error(errMsg);
      return rejectWithValue({ parentId, error: errMsg });
    }
  },
  {
    // Skip dispatch entirely if already loaded or in-flight in Redux state
    condition: (parentId, { getState }) => {
      const state = getState() as RootState;
      const alreadyLoaded = parentId in state.tasks.subtasksByParentId;
      const inFlight = !!state.tasks.inflightSubtaskParentIds?.[parentId];
      return !alreadyLoaded && !inFlight;
    },
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
  // Comments state
  commentsByTaskId: Record<string, TaskComment[]>;
  commentsLoading: boolean;
  commentsError: string | null;
  // Subtasks state
  subtasksByParentId: Record<string, Task[]>;
  subtasksLoading: boolean;
  inflightSubtaskParentIds: Record<string, boolean>;
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
  // Comments initial state
  commentsByTaskId: {},
  commentsLoading: false,
  commentsError: null,
  // Subtasks initial state
  subtasksByParentId: {},
  subtasksLoading: false,
  inflightSubtaskParentIds: {},
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
      // Fetch parent tasks by company
      .addCase(fetchParentTasksByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentTasksByCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchParentTasksByCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch parent tasks by project
      .addCase(fetchParentTasksByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projectTasks = action.payload;
      })
      .addCase(fetchParentTasksByProject.rejected, (state, action) => {
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
        // If the created task is a subtask, immediately insert it under its parent
        const parentId = action.payload.parentId;
        if (parentId) {
          const existing = state.subtasksByParentId[parentId] || [];
          state.subtasksByParentId[parentId] = [...existing, action.payload];
          // Ensure in-flight flag is reset for this parent if it was set
          state.inflightSubtaskParentIds[parentId] = false;
        }
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
        const deletedId = action.payload as string;
        state.tasks = state.tasks.filter(task => task.id !== deletedId);
        if (state.selectedTask?.id === deletedId) {
          state.selectedTask = null;
        }
        state.total -= 1;
        // Also remove from any cached subtasks lists so UI updates without refetch
        Object.keys(state.subtasksByParentId).forEach((pid) => {
          const existing = state.subtasksByParentId[pid] || [];
          const filtered = existing.filter(t => t.id !== deletedId);
          // Assign back even if unchanged to be explicit; empty array is considered loaded
          state.subtasksByParentId[pid] = filtered;
        });
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
      })
      .addCase(assignVendorToTaskAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignVendorToTaskAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updated } = action.payload as { id: string; updated: Partial<Task> };
        const idx = state.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          state.tasks[idx] = { ...state.tasks[idx], ...updated } as Task;
        }
        if (state.selectedTask?.id === id) {
          state.selectedTask = { ...state.selectedTask, ...updated } as Task;
        }
      })
      .addCase(assignVendorToTaskAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(assignUsersToTaskAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignUsersToTaskAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updated } = action.payload as { id: string; updated: Partial<Task> };
        const idx = state.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          state.tasks[idx] = { ...state.tasks[idx], ...updated } as Task;
        }
        if (state.selectedTask?.id === id) {
          state.selectedTask = { ...state.selectedTask, ...updated } as Task;
        }
      })
      .addCase(assignUsersToTaskAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Comments reducers
      .addCase(fetchTaskCommentsAsync.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(fetchTaskCommentsAsync.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { taskId, comments } = action.payload as { taskId: string; comments: TaskComment[] };
        state.commentsByTaskId[taskId] = comments;
      })
      .addCase(fetchTaskCommentsAsync.rejected, (state, action) => {
        state.commentsLoading = false;
        const payload = action.payload as any;
        state.commentsError = payload?.error || (action.error.message ?? 'Failed to fetch comments');
      })
      .addCase(createTaskCommentAsync.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(createTaskCommentAsync.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { taskId, comment } = action.payload as { taskId: string; comment: TaskComment };
        const existing = state.commentsByTaskId[taskId] || [];
        state.commentsByTaskId[taskId] = [...existing, comment];
      })
      .addCase(createTaskCommentAsync.rejected, (state, action) => {
        state.commentsLoading = false;
        const payload = action.payload as any;
        state.commentsError = payload?.error || (action.error.message ?? 'Failed to create comment');
      })
      // Insert: update comment reducers
      .addCase(updateTaskCommentAsync.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(updateTaskCommentAsync.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { taskId, comment } = action.payload as { taskId: string; comment: TaskComment };
        const existing = state.commentsByTaskId[taskId] || [];
        const idx = existing.findIndex(c => c.id === comment.id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...comment };
          state.commentsByTaskId[taskId] = [...existing];
        }
      })
      .addCase(updateTaskCommentAsync.rejected, (state, action) => {
        state.commentsLoading = false;
        const payload = action.payload as any;
        state.commentsError = payload?.error || (action.error.message ?? 'Failed to update comment');
      })
      .addCase(deleteTaskCommentAsync.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(deleteTaskCommentAsync.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { taskId, commentId } = action.payload as { taskId: string; commentId: string };
        const existing = state.commentsByTaskId[taskId] || [];
        state.commentsByTaskId[taskId] = existing.filter(c => c.id !== commentId);
      })
      .addCase(deleteTaskCommentAsync.rejected, (state, action) => {
        state.commentsLoading = false;
        const payload = action.payload as any;
        state.commentsError = payload?.error || (action.error.message ?? 'Failed to delete comment');
      })
      // Comment reactions
      .addCase(addTaskCommentReactionAsync.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(addTaskCommentReactionAsync.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { taskId, commentId, reaction } = action.payload as { taskId: string; commentId: string; reaction: any };
        const comments = state.commentsByTaskId[taskId] || [];
        const idx = comments.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          const c = comments[idx];
          const existingReactions = c.reactions || [];
          c.reactions = [...existingReactions, reaction];
        }
      })
      .addCase(addTaskCommentReactionAsync.rejected, (state, action) => {
        state.commentsLoading = false;
        const payload = action.payload as any;
        state.commentsError = payload?.error || (action.error.message ?? 'Failed to add reaction');
      })
      .addCase(removeTaskCommentReactionAsync.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(removeTaskCommentReactionAsync.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { taskId, commentId, type, userId } = action.payload as { taskId: string; commentId: string; type: string; userId?: string };
        const comments = state.commentsByTaskId[taskId] || [];
        const idx = comments.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          const c = comments[idx];
          c.reactions = (c.reactions || []).filter((r: any) => !(r?.type === type && (r?.userId === userId)));
        }
      })
      .addCase(removeTaskCommentReactionAsync.rejected, (state, action) => {
        state.commentsLoading = false;
        const payload = action.payload as any;
        state.commentsError = payload?.error || (action.error.message ?? 'Failed to remove reaction');
      })
      // Subtasks reducers
      .addCase(fetchSubtasksByParent.pending, (state, action) => {
        state.subtasksLoading = true;
        const parentId = action.meta.arg as string;
        state.inflightSubtaskParentIds[parentId] = true;
      })
      .addCase(fetchSubtasksByParent.fulfilled, (state, action) => {
        state.subtasksLoading = false;
        const { parentId, subtasks } = action.payload as { parentId: string; subtasks: Task[] };
        state.subtasksByParentId[parentId] = subtasks;
        state.inflightSubtaskParentIds[parentId] = false;
      })
      .addCase(fetchSubtasksByParent.rejected, (state, action) => {
        state.subtasksLoading = false;
        const parentId = (action.meta?.arg as string) ?? undefined;
        if (parentId) state.inflightSubtaskParentIds[parentId] = false;
      });
  },
});

export const { 
  setSelectedTask, 
  clearSelectedTask,
  clearError
} = tasksSlice.actions;

export const selectAllTasks = (state: RootState) => state.tasks.tasks;
// Selector for parent tasks only from all company tasks - used for time tracking
export const selectParentTasks = createSelector(
  [(state: RootState) => state.tasks.tasks],
  (tasks) => tasks.filter(task => !task.parentId)
);
export const selectProjectTasks = (state: RootState) => state.tasks.projectTasks;
// Selector for parent tasks only (tasks without parentId) - used for document task selection
export const selectParentProjectTasks = createSelector(
  [(state: RootState) => state.tasks.projectTasks],
  (projectTasks) => projectTasks.filter(task => !task.parentId)
);
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

// Comments selectors
export const selectCommentsByTaskId = (taskId: string) => createSelector(
  [(state: RootState) => state.tasks.commentsByTaskId[taskId]],
  (comments) => comments || []
);
export const selectCommentsLoading = (state: RootState) => state.tasks.commentsLoading;
export const selectCommentsError = (state: RootState) => state.tasks.commentsError;
// Subtasks selectors
export const selectSubtasksByParentId = (parentId: string) => createSelector(
  [(state: RootState) => state.tasks.subtasksByParentId[parentId]],
  (subtasks) => subtasks || []
);
export const selectSubtasksLoading = (state: RootState) => state.tasks.subtasksLoading;

export default tasksSlice.reducer;
