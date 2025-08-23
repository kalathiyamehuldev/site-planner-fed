
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

// API Document interface (matching backend DTOs)
export interface ApiDocument {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  projectId?: string;
  taskId?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

// Frontend Document interface
export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  projectId?: string;
  project?: string;
  taskId?: string;
  task?: string;
  userId?: string;
  user?: string;
  category: string;
  description?: string;
  tags: string[];
  thumbnail?: string | null;
  url: string;
  version: number;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create/Update Document Data interfaces
export interface CreateDocumentData {
  title: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  projectId?: string;
  taskId?: string;
  file?: File;
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {}

export interface DocumentFilterParams {
  search?: string;
  fileType?: string;
  projectId?: string;
  taskId?: string;
  page?: number;
  limit?: number;
}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Transform API document to frontend format
const transformApiDocument = (apiDoc: ApiDocument): Document => {
  // Add null checking for apiDoc
  if (!apiDoc || typeof apiDoc !== 'object') {
    throw new Error('Invalid document data received from API');
  }
  
  const fileExtension = apiDoc.fileType?.toUpperCase() || 'FILE';
  const fileName = apiDoc.title || 'Untitled Document';
  
  return {
    id: apiDoc.id,
    name: fileName,
    type: fileExtension,
    size: '0 KB', // Will be updated when we get actual file info
    date: new Date(apiDoc.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    projectId: apiDoc.projectId,
    project: apiDoc.project?.name || '',
    taskId: apiDoc.taskId,
    task: apiDoc.task?.title || '',
    userId: '', // Will be populated from user data
    user: '', // Will be populated from user data
    category: getCategoryFromFileType(apiDoc.fileType || ''),
    description: apiDoc.content || '',
    tags: [],
    thumbnail: null,
    url: apiDoc.fileUrl || '#',
    version: 1,
    isShared: false,
    createdAt: apiDoc.createdAt,
    updatedAt: apiDoc.updatedAt,
  };
};

// Helper function to determine category from file type
const getCategoryFromFileType = (fileType: string): string => {
  if (fileType.includes('pdf')) return 'Documents';
  if (fileType.includes('image')) return 'Images';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Financials';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentations';
  if (fileType.includes('word') || fileType.includes('document')) return 'Requirements';
  if (fileType.includes('zip') || fileType.includes('archive')) return 'Materials';
  return 'Documents';
};

// Async thunks
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (filters: DocumentFilterParams = {}, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const params = new URLSearchParams();
      // Add companyId to filters
      params.append('companyId', companyId);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response: ApiResponse = await api.get(`/documents?${params.toString()}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch documents');
      }
      
      // The response.data contains the paginated data
      const paginatedData = response.data || {};
      const documents = (paginatedData.items || [])
        .filter((item: any) => item && typeof item === 'object')
        .map(transformApiDocument);
      
      return {
        documents,
        pagination: {
          total: paginatedData.total || 0,
          page: paginatedData.page || 1,
          limit: paginatedData.limit || 10,
          totalPages: paginatedData.totalPages || 1
        }
      };
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch documents');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchDocumentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: ApiResponse<ApiDocument> = await api.get(`/documents/${id}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch document');
      }
      
      if (!response.data) {
        return rejectWithValue('No document data received');
      }
      return transformApiDocument(response.data);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch document');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createDocument = createAsyncThunk(
  'documents/createDocument',
  async (documentData: CreateDocumentData, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      let response: ApiResponse<ApiDocument>;
      
      // Check if file upload is included
      if (documentData.file) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('title', documentData.title);
        if (documentData.content) formData.append('content', documentData.content);
        if (documentData.projectId) formData.append('projectId', documentData.projectId);
        if (documentData.taskId) formData.append('taskId', documentData.taskId);
        formData.append('file', documentData.file);
        
        response = await api.post(`/documents?companyId=${companyId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }) as ApiResponse<ApiDocument>;
      } else {
        // Regular JSON request for documents without files
        response = await api.post(`/documents?companyId=${companyId}`, documentData) as ApiResponse<ApiDocument>;
      }
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create document');
      }
      
      if (!response.data) {
        return rejectWithValue('No document data received');
      }
      return transformApiDocument(response.data);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create document');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async ({ id, documentData }: { id: string; documentData: UpdateDocumentData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: ApiResponse<ApiDocument> = await api.patch(`/documents/${id}?companyId=${companyId}`, documentData);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update document');
      }
      
      if (!response.data) {
        return rejectWithValue('No document data received');
      }
      return {
        document: transformApiDocument(response.data),
        message: response.message || 'Document updated successfully'
      };
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update document');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: ApiResponse = await api.delete(`/documents/${id}?companyId=${companyId}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete document');
      }
      
      return id;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete document');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchDocumentsByProject = createAsyncThunk(
  'documents/fetchDocumentsByProject',
  async (projectId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: ApiResponse<ApiDocument[]> = await api.get(`/documents/project/${projectId}?companyId=${companyId}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch project documents');
      }
      
      return (response.data || [])
        .filter((item: any) => item && typeof item === 'object')
        .map(transformApiDocument);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch project documents');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchDocumentsByTask = createAsyncThunk(
  'documents/fetchDocumentsByTask',
  async (taskId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: ApiResponse<ApiDocument[]> = await api.get(`/documents/task/${taskId}?companyId=${companyId}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch task documents');
      }
      
      return (response.data || [])
        .filter((item: any) => item && typeof item === 'object')
        .map(transformApiDocument);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch task documents');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

interface DocumentsState {
  documents: Document[];
  projectDocuments: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  projectDocumentsLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: DocumentsState = {
  documents: [],
  projectDocuments: [],
  selectedDocument: null,
  loading: false,
  projectDocumentsLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

export const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setSelectedDocument: (state, action: PayloadAction<string>) => {
      state.selectedDocument = state.documents.find(doc => doc.id === action.payload) || null;
    },
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
    },
    shareDocument: (state, action: PayloadAction<{ id: string; isShared: boolean }>) => {
      const { id, isShared } = action.payload;
      const document = state.documents.find(d => d.id === id);
      if (document) {
        document.isShared = isShared;
      }
    },
    updateDocumentTags: (state, action: PayloadAction<{ id: string; tags: string[] }>) => {
      const { id, tags } = action.payload;
      const document = state.documents.find(d => d.id === id);
      if (document) {
        document.tags = tags;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.documents;
        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
        state.limit = action.payload.pagination.limit;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Document By ID
      .addCase(fetchDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDocument = action.payload;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Document
      .addCase(createDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents.push(action.payload);
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Document
      .addCase(updateDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.loading = false;
        const updatedDocument = action.payload.document;
        const index = state.documents.findIndex(doc => doc.id === updatedDocument.id);
        if (index !== -1) {
          state.documents[index] = updatedDocument;
        }
        if (state.selectedDocument?.id === updatedDocument.id) {
          state.selectedDocument = updatedDocument;
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = state.documents.filter(doc => doc.id !== action.payload);
        if (state.selectedDocument?.id === action.payload) {
          state.selectedDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch documents by project
      .addCase(fetchDocumentsByProject.pending, (state) => {
        state.projectDocumentsLoading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByProject.fulfilled, (state, action) => {
        state.projectDocumentsLoading = false;
        // action.payload is already transformed Document objects from the thunk
        state.projectDocuments = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchDocumentsByProject.rejected, (state, action) => {
        state.projectDocumentsLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Documents By Task
      .addCase(fetchDocumentsByTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByTask.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchDocumentsByTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  setSelectedDocument, 
  clearSelectedDocument, 
  shareDocument,
  updateDocumentTags
} = documentsSlice.actions;

export const selectAllDocuments = (state: RootState) => state.documents.documents;
export const selectProjectDocuments = (state: RootState) => state.documents.projectDocuments;
export const selectProjectDocumentsLoading = (state: RootState) => state.documents.projectDocumentsLoading;
export const selectSelectedDocument = (state: RootState) => state.documents.selectedDocument;
export const selectDocumentById = (id: string) => (state: RootState) => 
  state.documents.documents.find(doc => doc.id === id);
export const selectDocumentsByProject = (projectId: string) => (state: RootState) => 
  state.documents.documents.filter(doc => doc.projectId === projectId);
export const selectDocumentsByCategory = (category: string) => (state: RootState) => 
  state.documents.documents.filter(doc => doc.category === category);
export const selectDocumentsByUser = (userId: string) => (state: RootState) => 
  state.documents.documents.filter(doc => doc.userId === userId);
export const selectSharedDocuments = (state: RootState) => 
  state.documents.documents.filter(doc => doc.isShared);

export default documentsSlice.reducer;
