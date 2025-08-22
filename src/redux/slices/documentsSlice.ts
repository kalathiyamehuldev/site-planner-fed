
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

// API Document interface (from backend response)
export interface ApiDocument {
  id: string;
  title: string;
  content: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  taskId?: string;
  task?: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    estimatedHours: number;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    memberId: string;
  };
}

// Transform API document to frontend Document format
const transformApiDocument = (apiDoc: ApiDocument): Document => ({
  id: apiDoc.id,
  name: apiDoc.title,
  type: apiDoc.fileType.toUpperCase(),
  size: 'Unknown', // API doesn't provide size, could be calculated
  date: new Date(apiDoc.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }),
  projectId: apiDoc.projectId,
  project: '', // Could be populated from project data
  userId: apiDoc.task?.memberId || '',
  user: '', // Could be populated from member data
  category: 'Documents', // Default category
  description: apiDoc.content,
  tags: [],
  thumbnail: null,
  url: apiDoc.fileUrl,
  version: 1,
  isShared: false,
  // Add API-specific properties
  title: apiDoc.title,
  fileType: apiDoc.fileType,
  fileUrl: apiDoc.fileUrl,
  createdAt: apiDoc.createdAt,
  updatedAt: apiDoc.updatedAt,
  content: apiDoc.content,
  taskId: apiDoc.taskId,
  task: apiDoc.task
});

// Async thunks for API calls
export const fetchDocumentsByProject = createAsyncThunk(
  'documents/fetchByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/documents/project/${projectId}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch documents');
    }
  }
);

// Mock data for documents (keeping for fallback)
const initialDocuments = [
  {
    id: "d1",
    name: "Initial Contract.pdf",
    type: "PDF",
    size: "1.2 MB",
    date: "August 15, 2023",
    projectId: "p1",
    project: "Modern Loft Redesign",
    userId: "user1",
    user: "Alex Jones",
    category: "Contracts",
    description: "Initial agreement with client",
    tags: ["contract", "agreement", "client"],
    thumbnail: null,
    url: "#", // In a real app, this would be the file URL
    version: 1,
    isShared: false,
  },
  {
    id: "d2",
    name: "Floor Plan v1.pdf",
    type: "PDF",
    size: "3.4 MB",
    date: "August 22, 2023",
    projectId: "p1",
    project: "Modern Loft Redesign",
    userId: "user2",
    user: "Sarah Smith",
    category: "Floor Plans",
    description: "First draft of floor plans",
    tags: ["floor plan", "draft", "layout"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: true,
  },
  {
    id: "d3",
    name: "Client Requirements.docx",
    type: "DOCX",
    size: "845 KB",
    date: "August 18, 2023",
    projectId: "p1",
    project: "Modern Loft Redesign",
    userId: "user1", 
    user: "Alex Jones",
    category: "Requirements",
    description: "Detailed client requirements and preferences",
    tags: ["requirements", "client", "specs"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: false,
  },
  {
    id: "d4",
    name: "Mood Board.jpg",
    type: "JPG",
    size: "5.1 MB",
    date: "August 30, 2023",
    projectId: "p1",
    project: "Modern Loft Redesign",
    userId: "user2",
    user: "Sarah Smith",
    category: "Images",
    description: "Design inspiration and color palette",
    tags: ["mood board", "inspiration", "colors"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: true,
  },
  {
    id: "d5",
    name: "Budget Estimate.xlsx",
    type: "XLSX",
    size: "1.7 MB",
    date: "September 5, 2023",
    projectId: "p2",
    project: "Coastal Vacation Home",
    userId: "user3",
    user: "Robert Lee",
    category: "Financials",
    description: "Detailed budget breakdown",
    tags: ["budget", "costs", "estimate"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: false,
  },
  {
    id: "d6",
    name: "Material Samples.zip",
    type: "ZIP",
    size: "12.3 MB",
    date: "September 10, 2023",
    projectId: "p2",
    project: "Coastal Vacation Home",
    userId: "user1",
    user: "Alex Jones",
    category: "Materials",
    description: "Compressed folder with all material samples",
    tags: ["materials", "samples", "textures"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: false,
  },
  {
    id: "d7",
    name: "Final Presentation.pptx",
    type: "PPTX",
    size: "8.5 MB",
    date: "September 15, 2023",
    projectId: "p3",
    project: "Corporate Office Revamp",
    userId: "user2",
    user: "Sarah Smith",
    category: "Presentations",
    description: "Client presentation with all design concepts",
    tags: ["presentation", "client", "proposal"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: true,
  },
  {
    id: "d8",
    name: "Installation Instructions.pdf",
    type: "PDF",
    size: "2.8 MB",
    date: "September 20, 2023",
    projectId: "p3",
    project: "Corporate Office Revamp",
    userId: "user3",
    user: "Robert Lee",
    category: "Instructions",
    description: "Detailed installation guidelines for contractors",
    tags: ["installation", "instructions", "contractor"],
    thumbnail: null,
    url: "#",
    version: 1,
    isShared: false,
  }
];

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  projectId: string;
  project: string;
  userId: string;
  user: string;
  category: string;
  description: string;
  tags: string[];
  thumbnail: any;
  url: string;
  version: number;
  isShared: boolean;
  // API-specific properties
  title?: string;
  fileType?: string;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  content?: string;
  taskId?: string;
  task?: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    estimatedHours: number;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    memberId: string;
  };
}

interface DocumentsState {
  documents: Document[];
  projectDocuments: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  projectDocumentsLoading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: initialDocuments,
  projectDocuments: [],
  selectedDocument: null,
  loading: false,
  projectDocumentsLoading: false,
  error: null
};

export const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    getDocuments: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedDocument: (state, action: PayloadAction<string>) => {
      state.selectedDocument = state.documents.find(doc => doc.id === action.payload) || null;
    },
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
    },
    addDocument: (state, action: PayloadAction<Omit<Document, 'id'>>) => {
      const newDocument = {
        ...action.payload,
        id: `d${state.documents.length + 1}`,
        version: 1,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      };
      state.documents.push(newDocument);
    },
    updateDocument: (state, action: PayloadAction<{ id: string; document: Partial<Document> }>) => {
      const { id, document } = action.payload;
      const index = state.documents.findIndex(d => d.id === id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...document };
        
        // If this is a content update, increment version
        if (document.url) {
          state.documents[index].version = (state.documents[index].version || 1) + 1;
        }
        
        if (state.selectedDocument?.id === id) {
          state.selectedDocument = state.documents[index];
        }
      }
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      if (state.selectedDocument?.id === action.payload) {
        state.selectedDocument = null;
      }
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
      // Fetch documents by project
      .addCase(fetchDocumentsByProject.pending, (state) => {
        state.projectDocumentsLoading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByProject.fulfilled, (state, action) => {
        state.projectDocumentsLoading = false;
        // action.payload is already the response data due to axios interceptor
        const documents = Array.isArray(action.payload) ? action.payload : [];
        state.projectDocuments = documents.map(transformApiDocument);
        state.error = null;
      })
      .addCase(fetchDocumentsByProject.rejected, (state, action) => {
        state.projectDocumentsLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  getDocuments, 
  setSelectedDocument, 
  clearSelectedDocument, 
  addDocument, 
  updateDocument, 
  deleteDocument,
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
