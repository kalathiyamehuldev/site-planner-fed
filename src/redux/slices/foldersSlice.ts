import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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

// API Document interface
export interface ApiDocument {
  id: string;
  name: string;
  description?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// API Folder interface
export interface ApiFolder {
  id: string;
  name: string;
  description?: string;
  path: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  companyId: string;
  parent?: ApiFolder;
  children: ApiFolder[];
  documents?: ApiDocument[];
  _count: {
    documents: number;
  };
}

export interface CreateFolderData {
  name: string;
  projectId: string;
  parentId?: string;
  description?: string;
}

export interface UpdateFolderData {
  name?: string;
  projectId?: string;
  parentId?: string;
  description?: string;
}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Transform API folder to frontend format
const transformApiFolder = (apiFolder: ApiFolder) => ({
  id: apiFolder.id,
  name: apiFolder.name,
  description: apiFolder.description,
  path: apiFolder.path,
  parentId: apiFolder.parentId,
  projectId: apiFolder.projectId,
  companyId: apiFolder.companyId,
  createdAt: apiFolder.createdAt,
  updatedAt: apiFolder.updatedAt,
  parent: apiFolder.parent ? transformApiFolder(apiFolder.parent) : null,
  children: apiFolder.children?.map(transformApiFolder) || [],
  documents: apiFolder.documents || [],
  documentCount: apiFolder._count?.documents || 0,
  isEditing: false,
  projectName: '' // This will be populated from projects data
});

export type Folder = ReturnType<typeof transformApiFolder>;

// Async thunks
export const fetchFolders = createAsyncThunk(
  'folders/fetchFolders',
  async (projectId: string | undefined, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      let url = `/folders/company/${companyId}`;
      if (projectId) {
        url += `?projectId=${projectId}`;
      }
      
      const response: any = await api.get(url);
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch folders');
      }
      return (response?.data?.folders || response?.items || []).map(transformApiFolder);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch folders');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchFolderById = createAsyncThunk(
  'folders/fetchFolderById',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.get(`/folders/${id}?companyId=${companyId}`) as ApiResponse<{ folder: ApiFolder }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch folder');
      }
      
      return transformApiFolder(response.data!.folder);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch folder');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createFolder = createAsyncThunk(
  'folders/createFolder',
  async (folderData: CreateFolderData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.post(`/folders?companyId=${companyId}`, folderData) as ApiResponse<{ folder: ApiFolder }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create folder');
      }
      
      return transformApiFolder(response.data!.folder);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create folder');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateFolderAsync = createAsyncThunk(
  'folders/updateFolder',
  async ({ id, folderData }: { id: string; folderData: UpdateFolderData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/folders/${id}`, folderData) as ApiResponse<{ folder: ApiFolder }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update folder');
      }
      
      return transformApiFolder(response.data!.folder);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update folder');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteFolderAsync = createAsyncThunk(
  'folders/deleteFolder',
  async ({ id, cascade = false }: { id: string; cascade?: boolean }, { rejectWithValue }) => {
    try {
      const url = cascade ? `/folders/${id}?cascade=true` : `/folders/${id}`;
      const response = await api.delete(url) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete folder');
      }
      
      return id;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete folder');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchFolderPath = createAsyncThunk(
  'folders/fetchFolderPath',
  async (folderId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/folders/${folderId}/path`) as ApiResponse<{
        id: string;
        name: string;
        path: string;
        parts: string[];
      }>;
      
      if (response.status === 'error') {
        toast({
          title: 'Error',
          description: response.error || response.message || 'Failed to fetch folder path',
          variant: 'destructive',
        });
        return rejectWithValue(response.error || response.message || 'Failed to fetch folder path');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        toast({
          title: 'Error',
          description: apiError.error || apiError.message || 'Failed to fetch folder path',
          variant: 'destructive',
        });
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch folder path');
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchFolderTree = createAsyncThunk(
  'folders/fetchFolderTree',
  async (projectId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.get(`/folders/tree/${projectId}`) as ApiResponse<{ folders: ApiFolder[] }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch folder tree');
      }
      
      return response.data!.folders.map(transformApiFolder);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch folder tree');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

interface FoldersState {
  folders: Folder[];
  folderTree: Folder[];
  selectedFolder: Folder | null;
  loading: boolean;
  treeLoading: boolean;
  error: string | null;
  currentPath: string[];
  folderPath: {
    id: string;
    name: string;
    path: string;
    parts: string[];
  } | null;
}

const initialState: FoldersState = {
  folders: [],
  folderTree: [],
  selectedFolder: null,
  loading: false,
  treeLoading: false,
  error: null,
  currentPath: [],
  folderPath: null,
};

export const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    setSelectedFolder: (state, action: PayloadAction<string>) => {
      state.selectedFolder = state.folders.find(folder => folder.id === action.payload) || null;
    },
    clearSelectedFolder: (state) => {
      state.selectedFolder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPath: (state, action: PayloadAction<string[]>) => {
      state.currentPath = action.payload;
    },
    navigateToFolder: (state, action: PayloadAction<string>) => {
      const folder = state.folders.find(f => f.id === action.payload);
      if (folder) {
        state.currentPath = [...state.currentPath, folder.id];
      }
    },
    navigateBack: (state) => {
      state.currentPath = state.currentPath.slice(0, -1);
    },
    navigateToRoot: (state) => {
      state.currentPath = [];
    },
    startEditingFolder: (state, action: PayloadAction<string>) => {
      const folder = state.folders.find(f => f.id === action.payload);
      if (folder) {
        folder.isEditing = true;
      }
    },
    stopEditingFolder: (state, action: PayloadAction<string>) => {
      const folder = state.folders.find(f => f.id === action.payload);
      if (folder) {
        folder.isEditing = false;
      }
    },
    updateFolderProjectName: (state, action: PayloadAction<{ folderId: string; projectName: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        folder.projectName = action.payload.projectName;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch folders
      .addCase(fetchFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload;
        state.error = null;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch folder by ID
      .addCase(fetchFolderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedFolder = action.payload;
        state.error = null;
        // Update folder in list if it exists
        const index = state.folders.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.folders[index] = action.payload;
        }
      })
      .addCase(fetchFolderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create folder
      .addCase(createFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.folders.push(action.payload);
        state.error = null;
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update folder
      .addCase(updateFolderAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFolderAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.folders.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.folders[index] = { ...action.payload, isEditing: false };
        }
        if (state.selectedFolder?.id === action.payload.id) {
          state.selectedFolder = action.payload;
        }
        state.error = null;
      })
      .addCase(updateFolderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete folder
      .addCase(deleteFolderAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFolderAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = state.folders.filter(folder => folder.id !== action.payload);
        if (state.selectedFolder?.id === action.payload) {
          state.selectedFolder = null;
        }
        state.error = null;
      })
      .addCase(deleteFolderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch folder path
      .addCase(fetchFolderPath.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolderPath.fulfilled, (state, action) => {
        state.loading = false;
        state.folderPath = action.payload;
        state.error = null;
      })
      .addCase(fetchFolderPath.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch folder tree
      .addCase(fetchFolderTree.pending, (state) => {
        state.treeLoading = true;
        state.error = null;
      })
      .addCase(fetchFolderTree.fulfilled, (state, action) => {
        state.treeLoading = false;
        state.folderTree = action.payload;
        state.error = null;
      })
      .addCase(fetchFolderTree.rejected, (state, action) => {
        state.treeLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setSelectedFolder,
  clearSelectedFolder,
  clearError,
  setCurrentPath,
  navigateToFolder,
  navigateBack,
  navigateToRoot,
  startEditingFolder,
  stopEditingFolder,
  updateFolderProjectName
} = foldersSlice.actions;

// Selectors
export const selectAllFolders = (state: RootState) => state.folders.folders;
export const selectSelectedFolder = (state: RootState) => state.folders.selectedFolder;
export const selectFolderById = (id: string) => (state: RootState) =>
  state.folders.folders.find(folder => folder.id === id);
export const selectFolderLoading = (state: RootState) => state.folders.loading;
export const selectFolderError = (state: RootState) => state.folders.error;
export const selectCurrentPath = (state: RootState) => state.folders.currentPath;
export const selectCurrentFolders = (state: RootState) => {
  const currentFolderId = state.folders.currentPath[state.folders.currentPath.length - 1];
  if (!currentFolderId) {
    // Return root level folders (no parent)
    return state.folders.folders.filter(folder => !folder.parentId);
  }
  // Return children of current folder
  return state.folders.folders.filter(folder => folder.parentId === currentFolderId);
};
export const selectFoldersByProject = (projectId: string) => (state: RootState) =>
  state.folders.folders.filter(folder => folder.projectId === projectId);
export const selectFolderPath = (state: RootState) => state.folders.folderPath;
export const selectFolderTree = (state: RootState) => state.folders.folderTree;
export const selectTreeLoading = (state: RootState) => state.folders.treeLoading;

export default foldersSlice.reducer;