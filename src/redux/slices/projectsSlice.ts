
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

// API Project interface
export interface ApiProject {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'IN_PROGRESS' | 'NOT_STARTED';
  startDate?: string;
  endDate?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

// Helper function to get selected company ID from state
const getSelectedCompanyId = (getState: any) => {
  const state = getState();
  return state.auth.selectedCompany?.id || JSON.parse(localStorage.getItem('selectedCompany') || '{}')?.id;
};

// Transform API project to frontend format
const transformApiProject = (apiProject: ApiProject) => ({
  id: apiProject.id,
  title: apiProject.name,
  client: '',
  status: apiProject.status === 'ACTIVE' ? 'In Progress' as const :
          apiProject.status === 'COMPLETED' ? 'Completed' as const :
          apiProject.status === 'ON_HOLD' ? 'On Hold' as const :
          apiProject.status === 'IN_PROGRESS' ? 'In Progress' as const :
          'Not Started' as const,
  dueDate: '',
  team: apiProject.members?.map(member => `${member.user.firstName} ${member.user.lastName}`) || [],
  progress: 0,
  description: apiProject.description || '',
  budget: apiProject.budget || 0,
  startDate: apiProject.startDate || '',
  endDate: apiProject.endDate || '',
});

export type Project = ReturnType<typeof transformApiProject>;
export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response: any = await api.get(`/projects?companyId=${companyId}`);
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch projects');
      }
      console.log("response", response)
      return (response?.items || []).map(transformApiProject);
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch projects');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.get(`/projects/${id}?companyId=${companyId}`) as ApiResponse<{ project: ApiProject }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch project');
      }
      
      return transformApiProject(response.data!.project);
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch project');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: Omit<CreateProjectData, 'companyId'>, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      // Convert Date objects to ISO strings for API
      const apiData = {
        ...projectData,
        startDate: projectData.startDate ? projectData.startDate.toISOString() : undefined,
        endDate: projectData.endDate ? projectData.endDate.toISOString() : undefined,
      };

      const response = await api.post(`/projects?companyId=${companyId}`, apiData) as ApiResponse<{ project: ApiProject }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to create project');
      }
      
      return transformApiProject(response.data!.project);
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to create project');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateProjectAsync = createAsyncThunk(
  'projects/updateProject',
  async ({ id, projectData }: { id: string; projectData: UpdateProjectData }, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.put(`/projects/${id}?companyId=${companyId}`, projectData) as ApiResponse<{ project: ApiProject }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to update project');
      }
      
      return transformApiProject(response.data!.project);
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to update project');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const deleteProjectAsync = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      const response = await api.delete(`/projects/${id}?companyId=${companyId}`) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to delete project');
      }
      
      return id;
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to delete project');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Project member management async thunks
export const addMemberToProject = createAsyncThunk(
  'projects/addMemberToProject',
  async ({ projectId, userId, role = 'VIEWER' }: { projectId: string; userId: string; role?: string }, { rejectWithValue }) => {
    try {
      
      const response = await api.post(`/projects/${projectId}/members/${userId}`, { role }) as ApiResponse<{ projectMember: ProjectMember }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to add member to project');
      }
      
      return response.data!.projectMember;
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to add member to project');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const removeMemberFromProject = createAsyncThunk(
  'projects/removeMemberFromProject',
  async ({ projectId, userId }: { projectId: string; userId: string }, { rejectWithValue }) => {
    try {
      
      const response = await api.delete(`/projects/${projectId}/members/${userId}`) as ApiResponse<null>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to remove member from project');
      }
      
      return { projectId, userId };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to remove member from project');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const getProjectMembers = createAsyncThunk(
  'projects/getProjectMembers',
  async (projectId: string, { rejectWithValue }) => {
    try {
      
      const response = await api.get(`/projects/${projectId}/members`) as ApiResponse<{ members: ProjectMember[] }>;
      
      if (response.status === 'error') {
        return rejectWithValue(response.error || response.message || 'Failed to fetch project members');
      }
      
      return { projectId, members: response.data!.members };
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        const apiError = error.response.data as ApiResponse;
        return rejectWithValue(apiError.error || apiError.message || 'Failed to fetch project members');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  memberLoading: boolean;
  memberError: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  memberLoading: false,
  memberError: null
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<string>) => {
      state.selectedProject = state.projects.find(project => project.id === action.payload) || null;
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMemberError: (state) => {
      state.memberError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProject = action.payload;
        state.error = null;
        // Update project in list if it exists
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
        state.error = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update project
      .addCase(updateProjectAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProjectAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProjectAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete project
      .addCase(deleteProjectAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProjectAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(project => project.id !== action.payload);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
        state.error = null;
      })
      .addCase(deleteProjectAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add member to project
      .addCase(addMemberToProject.pending, (state) => {
        state.memberLoading = true;
        state.memberError = null;
      })
      .addCase(addMemberToProject.fulfilled, (state, action) => {
        state.memberLoading = false;
        state.memberError = null;
        // Update project members if selected project matches
        if (state.selectedProject?.id === action.meta.arg.projectId) {
          const currentMembers = state.selectedProject.team || [];
          const newMemberName = `${action.payload.user.firstName} ${action.payload.user.lastName}`;
          if (!currentMembers.includes(newMemberName)) {
            state.selectedProject.team = [...currentMembers, newMemberName];
          }
        }
      })
      .addCase(addMemberToProject.rejected, (state, action) => {
        state.memberLoading = false;
        state.memberError = action.payload as string;
      })
      // Remove member from project
      .addCase(removeMemberFromProject.pending, (state) => {
        state.memberLoading = true;
        state.memberError = null;
      })
      .addCase(removeMemberFromProject.fulfilled, (state, action) => {
        state.memberLoading = false;
        state.memberError = null;
        // Update project members if selected project matches
        if (state.selectedProject?.id === action.payload.projectId) {
          // Note: We would need user info to remove the specific member name
          // This is a limitation of the current data structure
        }
      })
      .addCase(removeMemberFromProject.rejected, (state, action) => {
        state.memberLoading = false;
        state.memberError = action.payload as string;
      })
      // Get project members
      .addCase(getProjectMembers.pending, (state) => {
        state.memberLoading = true;
        state.memberError = null;
      })
      .addCase(getProjectMembers.fulfilled, (state, action) => {
        state.memberLoading = false;
        state.memberError = null;
        // Update project members if selected project matches
        if (state.selectedProject?.id === action.payload.projectId) {
          state.selectedProject.team = action.payload.members.map(member => 
            `${member.user.firstName} ${member.user.lastName}`
          );
        }
      })
      .addCase(getProjectMembers.rejected, (state, action) => {
        state.memberLoading = false;
        state.memberError = action.payload as string;
      });
  }
});

export const { 
  setSelectedProject, 
  clearSelectedProject,
  clearError,
  clearMemberError
} = projectsSlice.actions;

// Selectors
export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectSelectedProject = (state: RootState) => state.projects.selectedProject;
export const selectProjectById = (id: string) => (state: RootState) => 
  state.projects.projects.find(project => project.id === id);
export const selectProjectLoading = (state: RootState) => state.projects.loading;
export const selectProjectError = (state: RootState) => state.projects.error;
export const selectMemberLoading = (state: RootState) => state.projects.memberLoading;
export const selectMemberError = (state: RootState) => state.projects.memberError;


export default projectsSlice.reducer;
