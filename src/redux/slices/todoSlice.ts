
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

// API Todo interface
export interface ApiTodo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

// Todo type
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateTodoData {
  text: string;
  dueDate?: string;
  projectId: string;
}

export interface UpdateTodoData {
  text?: string;
  completed?: boolean;
  dueDate?: string;
}

// Transform API todo to frontend format
const transformApiTodo = (apiTodo: ApiTodo): Todo => ({
  id: apiTodo.id,
  text: apiTodo.text,
  completed: apiTodo.completed,
  dueDate: apiTodo.dueDate,
  projectId: apiTodo.projectId,
  createdAt: apiTodo.createdAt,
  updatedAt: apiTodo.updatedAt,
  project: apiTodo.project,
});

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Initial state
interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (params: { projectId?: string } = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }

      let url = `/todos?companyId=${companyId}`;
      if (params.projectId) {
        url += `&projectId=${params.projectId}`;
      }
      const response = await api.get(url) as ApiResponse<ApiTodo[]>;

      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch todos');
      }

      return (response.data || []).map(transformApiTodo);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch todos');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createTodo = createAsyncThunk(
  'todos/createTodo',
  async (todoData: CreateTodoData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }

      const response = await api.post('/todos', {
        ...todoData,
        companyId
      }) as ApiResponse<ApiTodo>;

      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create todo');
      }

      return transformApiTodo(response.data!);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create todo');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async ({ id, data }: { id: string; data: UpdateTodoData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }

      const response = await api.patch(`/todos/${id}?companyId=${companyId}`, data) as ApiResponse<ApiTodo>;

      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update todo');
      }

      return transformApiTodo(response.data!);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update todo');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteTodo = createAsyncThunk(
  'todos/deleteTodo',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }

      const response = await api.delete(`/todos/${id}?companyId=${companyId}`) as ApiResponse<null>;

      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete todo');
      }

      return id;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete todo');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create todo
      .addCase(createTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos.push(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update todo
      .addCase(updateTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.todos.findIndex(todo => todo.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete todo
      .addCase(deleteTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.filter(todo => todo.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError
} = todoSlice.actions;

export const selectAllTodos = (state: RootState) => state.todos.todos;
export const selectActiveTodos = (state: RootState) => state.todos.todos.filter(todo => !todo.completed);
export const selectCompletedTodos = (state: RootState) => state.todos.todos.filter(todo => todo.completed);
export const selectTodosByProject = (projectId: string) => (state: RootState) => 
  state.todos.todos.filter(todo => todo.projectId === projectId);

export default todoSlice.reducer;
