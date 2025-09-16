
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

interface CreateDocumentResponse {
  document?: ApiDocument;
  conflict?: boolean;
  existingDocument?: ApiDocument;
  message?: string;
}

// API Document interface (matching backend DTOs)
export interface ApiDocument {
  id: string;
  name: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  projectId?: string;
  taskId?: string;
  folderId?: string;
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
  folder?: {
    id: string;
    name: string;
  };
  files?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    version: number;
  }[];
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
  folderId?: string;
  folder?: string;
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
  fileId?: string; // ID of the latest file for download
}

// Create/Update Document Data interfaces
export interface CreateDocumentData {
  name: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  projectId?: string;
  taskId?: string;
  folderId?: string;
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
  const fileName = apiDoc.name || 'Untitled Document';
  
  // Get the latest file (first in array since backend orders by version desc)
  const latestFile = apiDoc.files && apiDoc.files.length > 0 ? apiDoc.files[0] : null;
  
  return {
    id: apiDoc.id,
    name: fileName,
    type: fileExtension,
    size: latestFile ? `${Math.round(latestFile.fileSize / 1024)} KB` : '0 KB',
    date: new Date(apiDoc.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    projectId: apiDoc.projectId,
    project: apiDoc.project?.name || '',
    taskId: apiDoc.taskId,
    task: apiDoc.task?.title || '',
    folderId: apiDoc.folderId,
    folder: apiDoc.folder?.name || '',
    userId: '', // Will be populated from user data
    user: '', // Will be populated from user data
    category: getCategoryFromFileType(apiDoc.fileType || ''),
    description: apiDoc.description || '',
    tags: [],
    thumbnail: null,
    url: latestFile?.fileUrl || apiDoc.fileUrl || '#',
    version: latestFile?.version || 1,
    isShared: false,
    createdAt: apiDoc.createdAt,
    updatedAt: apiDoc.updatedAt,
    fileId: latestFile?.id, // Extract file ID for download
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


export const fetchDocumentDetails = createAsyncThunk(
  'documents/fetchDocumentDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/documents/${id}`);
      
      if (response.data.status === 'error') {
        return rejectWithValue(response.data.error || response.data.message || 'Failed to fetch document details');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch document details');
      }
      return rejectWithValue(error.message || 'Failed to fetch document details');
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
      
      let response: ApiResponse<CreateDocumentResponse>;
      
      // Check if file upload is included
      if (documentData.file) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('name', documentData.name);
        if (documentData.description) formData.append('description', documentData.description);
        if (documentData.projectId) formData.append('projectId', documentData.projectId);
        if (documentData.taskId) formData.append('taskId', documentData.taskId);
        if (documentData.folderId) formData.append('folderId', documentData.folderId);
        formData.append('file', documentData.file);
        
        response = await api.post(`/documents?companyId=${companyId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }) as ApiResponse<CreateDocumentResponse>;
      } else {
        // Regular JSON request for documents without files
        response = await api.post(`/documents?companyId=${companyId}`, documentData) as ApiResponse<CreateDocumentResponse>;
      }
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create document');
      }
      
      if (!response.data) {
        return rejectWithValue('No document data received');
      }
      
      // Check if the response indicates a conflict
      if (response.data.conflict) {
        console.log('Conflict detected in API response:', response.data);
        console.log('Existing document from API:', response.data.existingDocument);
        const conflictData = {
          conflict: true,
          existingDocument: response.data.existingDocument,
          message: response.data.message || 'Document name conflict detected'
        };
        console.log('Conflict data to be rejected:', conflictData);
        return rejectWithValue(conflictData);
      }
      
      // For successful creation, the document is directly in response.data
      console.log('Successful document creation, response.data:', response.data);
      
      // Add validation to ensure we have valid document data
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response data structure:', response.data);
        return rejectWithValue('Invalid document data received from API');
      }
      
      // Check if response.data has the required fields for a document
      const resdocumentData = response.data as any;
      if (!resdocumentData.id || !resdocumentData.name) {
        console.error('Missing required document fields:', resdocumentData);
        return rejectWithValue('Invalid document data received from API');
      }
      
      return transformApiDocument(response.data as ApiDocument);
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

export const fetchDocumentsByFolder = createAsyncThunk(
  'documents/fetchDocumentsByFolder',
  async (folderId: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(folderId)) {
        console.error('Invalid folder ID format:', folderId);
        return rejectWithValue('Invalid folder ID format');
      }
      
      console.log('Fetching documents for folder:', { folderId, companyId });
      const response: ApiResponse<ApiDocument[]> = await api.get(`/documents/folder/${folderId}?companyId=${companyId}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch folder documents');
      }
      
      return (response.data || [])
        .filter((item: any) => item && typeof item === 'object')
        .map(transformApiDocument);
    } catch (error: any) {
      console.error('Error fetching documents by folder:', { folderId, error: error.response?.data || error.message });
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch folder documents');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchRootDocuments = createAsyncThunk(
  'documents/fetchRootDocuments',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: ApiResponse<ApiDocument[]> = await api.get(`/documents/root?companyId=${companyId}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch root documents');
      }
      
      return (response.data || [])
        .filter((item: any) => item && typeof item === 'object')
        .map(transformApiDocument);
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch root documents');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const replaceDocument = createAsyncThunk(
  'documents/replaceDocument',
  async ({ id, file, notes }: { id: string; file: File; notes?: string }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        return rejectWithValue('No company selected');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await api.post<ApiResponse<ApiDocument>>(`/documents/${id}/replace`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.status === 'success' && response.data.data) {
        return transformApiDocument(response.data.data);
      } else {
        return rejectWithValue(response.data.message || 'Failed to replace document');
      }
    } catch (error: any) {
      console.error('Error replacing document:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to replace document');
    }
  }
);

export const uploadDocumentVersion = createAsyncThunk(
  'documents/uploadDocumentVersion',
  async ({ id, file, versionNotes }: { id: string; file: File; versionNotes?: string }, { rejectWithValue, getState }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (versionNotes) {
        formData.append('versionNotes', versionNotes);
      }

      const response:any = await api.post<ApiResponse<ApiDocument>>(`/documents/${id}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });console.log('response', response);
      
      
      if (response.status === 'success' && response.data) {
        return transformApiDocument(response.data);
      } else {
        return rejectWithValue(response.message || 'Failed to upload document version');
      }
    } catch (error: any) {
      console.error('Error uploading document version:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to upload document version');
    }
  }
);

export const downloadDocument = createAsyncThunk(
  'documents/downloadDocument',
  async (fileId: string, { rejectWithValue }) => {
    try {
      // Use direct fetch call to avoid JSON parsing interceptor
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_BASE_URL}/documents/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      // Get the blob and filename
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*?)\1/);
        if (filenameMatch && filenameMatch[2]) {
          filename = filenameMatch[2];
        }
      }
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      window.document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return {
        success: true,
        filename: filename
      };
    } catch (error: any) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchFilePreview = createAsyncThunk(
  'documents/fetchFilePreview',
  async (fileId: string, { rejectWithValue }) => {
    try {
      const response: ApiResponse = await api.get(`/documents/files/${fileId}/preview`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch file preview');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch file preview');
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
  conflict?: {
    conflict: boolean;
    existingDocument?: any;
    message?: string;
  } | null;
  filePreview?: {
    previewUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    version: number;
    documentName: string;
  } | null;
  previewLoading: boolean;
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
  conflict: null,
  filePreview: null,
  previewLoading: false,
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
    },
    clearConflict: (state) => {
      state.conflict = null;
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
      // Create Document
      .addCase(createDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.conflict = null; // Clear any previous conflict
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.conflict = null; // Clear any previous conflict
        state.documents.push(action.payload as Document);
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false;
        console.log('Create document rejected with payload:', action.payload);
        // Check if this is a conflict rejection
        if (action.payload && typeof action.payload === 'object' && 'conflict' in action.payload) {
          console.log('Conflict detected in reducer:', action.payload);
          // This is a conflict - store conflict data
          state.conflict = action.payload as any;
          state.error = null; // Don't set error for conflicts
        } else {
          // This is a regular error
          state.error = action.payload as string;
          state.conflict = null;
        }
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
        state.projectDocuments = state.projectDocuments.filter(doc => doc.id !== action.payload);
        if (state.selectedDocument?.id === action.payload) {
          state.selectedDocument = null;
        }
        // Update total count
        state.total = Math.max(0, state.total - 1);
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
      })
      // Fetch Documents By Folder
      .addCase(fetchDocumentsByFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchDocumentsByFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Root Documents
      .addCase(fetchRootDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRootDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchRootDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Replace Document
      .addCase(replaceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(replaceDocument.fulfilled, (state, action) => {
        state.loading = false;
        const replacedDocument = action.payload;
        const index = state.documents.findIndex(doc => doc.id === replacedDocument.id);
        if (index !== -1) {
          state.documents[index] = replacedDocument;
        }
        const projectIndex = state.projectDocuments.findIndex(doc => doc.id === replacedDocument.id);
        if (projectIndex !== -1) {
          state.projectDocuments[projectIndex] = replacedDocument;
        }
        if (state.selectedDocument?.id === replacedDocument.id) {
          state.selectedDocument = replacedDocument;
        }
      })
      .addCase(replaceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upload Document Version
      .addCase(uploadDocumentVersion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocumentVersion.fulfilled, (state, action) => {
        state.loading = false;
        const versionedDocument = action.payload;
        const index = state.documents.findIndex(doc => doc.id === versionedDocument.id);
        if (index !== -1) {
          state.documents[index] = versionedDocument;
        }
        const projectIndex = state.projectDocuments.findIndex(doc => doc.id === versionedDocument.id);
        if (projectIndex !== -1) {
          state.projectDocuments[projectIndex] = versionedDocument;
        }
        if (state.selectedDocument?.id === versionedDocument.id) {
          state.selectedDocument = versionedDocument;
        }
      })
      .addCase(uploadDocumentVersion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch File Preview
      .addCase(fetchFilePreview.pending, (state) => {
        state.previewLoading = true;
        state.error = null;
      })
      .addCase(fetchFilePreview.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.filePreview = action.payload.data;
      })
      .addCase(fetchFilePreview.rejected, (state, action) => {
        state.previewLoading = false;
        state.error = action.payload as string;
        state.filePreview = null;
      });
  }
});

export const { 
  setSelectedDocument, 
  clearSelectedDocument, 
  shareDocument,
  updateDocumentTags,
  clearConflict
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
export const selectDocumentConflict = (state: RootState) => state.documents.conflict;
export const selectFilePreview = (state: RootState) => state.documents.filePreview;
export const selectPreviewLoading = (state: RootState) => state.documents.previewLoading;

export default documentsSlice.reducer;
