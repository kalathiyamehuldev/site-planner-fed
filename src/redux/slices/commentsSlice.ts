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

// Comment interfaces
export interface Comment {
  id: string;
  content: string;
  commentType: 'GENERAL' | 'REVIEW' | 'APPROVAL';
  documentId: string;
  parentId?: string;
  fromUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mentionedUsers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface CreateCommentData {
  content: string;
  commentType: 'GENERAL' | 'REVIEW' | 'APPROVAL';
  documentId: string;
  mentionedUserIds?: string[];
  parentId?: string;
}

export interface UpdateCommentData {
  content?: string;
}

// Async thunks
export const fetchDocumentComments = createAsyncThunk(
  'comments/fetchDocumentComments',
  async ({ documentId, parentId }: { documentId: string; parentId?: string }, { rejectWithValue }) => {
    try {
      const url = parentId 
        ? `/comments/document/${documentId}?parentId=${parentId}`
        : `/comments/document/${documentId}`;
      
      const response = await api.get(url) as ApiResponse<Comment[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch comments');
      }
      
      return response.data || [];
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch comments');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchCommentThread = createAsyncThunk(
  'comments/fetchCommentThread',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/comments/thread/${commentId}`) as ApiResponse<{
        comment: Comment;
        replies: Comment[];
      }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch comment thread');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch comment thread');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchCommentById = createAsyncThunk(
  'comments/fetchCommentById',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/comments/${commentId}`) as ApiResponse<Comment>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch comment');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch comment');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async (commentData: CreateCommentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/comments', commentData) as ApiResponse<Comment>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create comment');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create comment');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ id, commentData }: { id: string; commentData: UpdateCommentData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/comments/${id}`, commentData) as ApiResponse<Comment>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update comment');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update comment');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/comments/${commentId}`) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete comment');
      }
      
      return commentId;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete comment');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const addMentionToComment = createAsyncThunk(
  'comments/addMentionToComment',
  async ({ commentId, userIds }: { commentId: string; userIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/comments/${commentId}/mention`, { userIds }) as ApiResponse<Comment>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to add mention');
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to add mention');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchProjectMembers = createAsyncThunk(
  'comments/fetchProjectMembers',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/comments/project/${projectId}/users`) as ApiResponse<ProjectMember[]>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch project members');
      }
      
      const members = response.data || [];
      return members;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch project members');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

interface CommentsState {
  comments: Comment[];
  commentThreads: { [commentId: string]: { comment: Comment; replies: Comment[] } };
  projectMembers: ProjectMember[];
  selectedComment: Comment | null;
  loading: boolean;
  error: string | null;
  membersLoading: boolean;
  membersError: string | null;
}

const initialState: CommentsState = {
  comments: [],
  commentThreads: {},
  projectMembers: [],
  selectedComment: null,
  loading: false,
  error: null,
  membersLoading: false,
  membersError: null,
};

export const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    setSelectedComment: (state, action: PayloadAction<string>) => {
      state.selectedComment = state.comments.find(comment => comment.id === action.payload) || null;
    },
    clearSelectedComment: (state) => {
      state.selectedComment = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMembersError: (state) => {
      state.membersError = null;
    },
    clearComments: (state) => {
      state.comments = [];
      state.commentThreads = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch document comments
      .addCase(fetchDocumentComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
        state.error = null;
      })
      .addCase(fetchDocumentComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch comment thread
      .addCase(fetchCommentThread.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentThread.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.commentThreads[action.payload.comment.id] = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchCommentThread.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch comment by ID
      .addCase(fetchCommentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.selectedComment = action.payload;
          // Update comment in list if it exists
          const index = state.comments.findIndex(c => c.id === action.payload!.id);
          if (index !== -1) {
            state.comments[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(fetchCommentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create comment
      .addCase(createComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.comments.push(action.payload);
        }
        state.error = null;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.comments.findIndex(c => c.id === action.payload!.id);
          if (index !== -1) {
            state.comments[index] = action.payload;
          }
          if (state.selectedComment?.id === action.payload.id) {
            state.selectedComment = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = state.comments.filter(comment => comment.id !== action.payload);
        if (state.selectedComment?.id === action.payload) {
          state.selectedComment = null;
        }
        // Remove from comment threads
        delete state.commentThreads[action.payload];
        state.error = null;
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add mention to comment
      .addCase(addMentionToComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMentionToComment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.comments.findIndex(c => c.id === action.payload!.id);
          if (index !== -1) {
            state.comments[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(addMentionToComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch project members
      .addCase(fetchProjectMembers.pending, (state) => {
        state.membersLoading = true;
        state.membersError = null;
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.projectMembers = action.payload;
        state.membersError = null;
      })
      .addCase(fetchProjectMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.membersError = action.payload as string;
      });
  }
});

export const {
  setSelectedComment,
  clearSelectedComment,
  clearError,
  clearMembersError,
  clearComments,
} = commentsSlice.actions;

// Selectors
export const selectAllComments = (state: RootState) => state.comments.comments;
export const selectCommentThreads = (state: RootState) => state.comments.commentThreads;
export const selectProjectMembers = (state: RootState) => state.comments.projectMembers;
export const selectSelectedComment = (state: RootState) => state.comments.selectedComment;
export const selectCommentsLoading = (state: RootState) => state.comments.loading;
export const selectCommentsError = (state: RootState) => state.comments.error;
export const selectMembersLoading = (state: RootState) => state.comments.membersLoading;
export const selectMembersError = (state: RootState) => state.comments.membersError;
export const selectCommentById = (id: string) => (state: RootState) =>
  state.comments.comments.find(comment => comment.id === id);
export const selectCommentThread = (commentId: string) => (state: RootState) =>
  state.comments.commentThreads[commentId];

export default commentsSlice.reducer;