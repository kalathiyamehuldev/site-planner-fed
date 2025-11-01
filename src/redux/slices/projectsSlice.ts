
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
  role: {
    id: string;
    name: string;
  };
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
  status: apiProject.status === 'ACTIVE' ? 'Active' as const :
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
  createdAt: apiProject.createdAt,
});

export type Project = ReturnType<typeof transformApiProject>;
export type ProjectStatus = 'Not Started' | 'Active' | 'In Progress' | 'On Hold' | 'Completed';

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue, getState }) => {
    try {
      const companyId = getSelectedCompanyId(getState);
      if (!companyId) {
        const errMsg = 'No company selected';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }
      const response: any = await api.get(`/projects?companyId=${companyId}`);
      const { status, data, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch projects';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Projects fetched successfully');
      const items = (data?.items ?? response?.items ?? data ?? []);
      return (items || []).map(transformApiProject);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch projects';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/projects/${id}`);
      const { status, data, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch project';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Project fetched successfully');
      const project = data?.project ?? response?.data?.project ?? response?.project ?? data;
      return transformApiProject(project);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch project';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: Omit<CreateProjectData, 'companyId'>, { rejectWithValue }) => {
    try {
      const apiData = {
        ...projectData,
        startDate: projectData.startDate ? projectData.startDate.toISOString() : undefined,
        endDate: projectData.endDate ? projectData.endDate.toISOString() : undefined,
      };

      const response: any = await api.post('/projects', apiData);
      const { status, data, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to create project';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Project created successfully');
      const project = data?.project ?? response?.data?.project ?? response?.project ?? data;
      return transformApiProject(project);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to create project';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateProjectAsync = createAsyncThunk(
  'projects/updateProject',
  async ({ id, projectData }: { id: string; projectData: UpdateProjectData }, { rejectWithValue }) => {
    try {
      const response: any = await api.put(`/projects/${id}`, projectData);
      const { status, data, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to update project';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Project updated successfully');
      const project = data?.project ?? response?.data?.project ?? response?.project ?? data;
      return transformApiProject(project);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to update project';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteProjectAsync = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/projects/${id}`);
      const { status, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to delete project';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Project deleted successfully');
      return id;
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to delete project';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Project member management async thunks
export const addMemberToProject = createAsyncThunk(
  'projects/addMemberToProject',
  async ({ projectId, userId, role = 'VIEWER' }: { projectId: string; userId: string; role?: string }, { rejectWithValue }) => {
    try {
      const response: any = await api.post(`/projects/${projectId}/members/${userId}`, { role });
      const { status, data, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to add member to project';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Member added successfully');
      return (data?.projectMember ?? response?.data?.projectMember ?? data);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to add member to project';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const removeMemberFromProject = createAsyncThunk(
  'projects/removeMemberFromProject',
  async ({ projectId, userId }: { projectId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response: any = await api.delete(`/projects/${projectId}/members/${userId}`);
      const { status, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to remove member from project';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Member removed successfully');
      return { projectId, userId };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to remove member from project';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const getProjectMembers = createAsyncThunk(
  'projects/getProjectMembers',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response: any = await api.get(`/projects/${projectId}/members`);
      const { status, data, message, error } = response || {};

      if (status === 'error') {
        const errMsg = error || message || 'Failed to fetch project members';
        toast.error(errMsg);
        return rejectWithValue(errMsg);
      }

      //toast.success(message || 'Project members fetched successfully');
      return { projectId, members: (data?.members ?? response?.data?.members ?? data ?? []) };
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to fetch project members';
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  projectMembers: {
    [projectId: string]: ProjectMember[];
  };
  projectMembersLoading: boolean;
  projectMembersError: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  projectMembers: {},
  projectMembersLoading: false,
  projectMembersError: null,
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
      // Get project members
      .addCase(getProjectMembers.pending, (state) => {
        state.projectMembersLoading = true;
        state.projectMembersError = null;
      })
      .addCase(getProjectMembers.fulfilled, (state, action) => {
        state.projectMembersLoading = false;
        state.projectMembers[action.payload.projectId] = action.payload.members;
        state.projectMembersError = null;
      })
      .addCase(getProjectMembers.rejected, (state, action) => {
        state.projectMembersLoading = false;
        state.projectMembersError = action.payload as string;
      })
      // Add member to project
      .addCase(addMemberToProject.pending, (state) => {
        state.projectMembersLoading = true;
        state.projectMembersError = null;
      })
      .addCase(addMemberToProject.fulfilled, (state, action) => {
        state.projectMembersLoading = false;
        const projectId = action.meta.arg.projectId;
        if (state.projectMembers[projectId]) {
          state.projectMembers[projectId].push(action.payload);
        }
        state.projectMembersError = null;
      })
      .addCase(addMemberToProject.rejected, (state, action) => {
        state.projectMembersLoading = false;
        state.projectMembersError = action.payload as string;
      })
      // Remove member from project
      .addCase(removeMemberFromProject.pending, (state) => {
        state.projectMembersLoading = true;
        state.projectMembersError = null;
      })
      .addCase(removeMemberFromProject.fulfilled, (state, action) => {
        state.projectMembersLoading = false;
        const { projectId, userId } = action.payload;
        if (state.projectMembers[projectId]) {
          state.projectMembers[projectId] = state.projectMembers[projectId].filter(
            member => member.user.id !== userId
          );
        }
        state.projectMembersError = null;
      })
      .addCase(removeMemberFromProject.rejected, (state, action) => {
        state.projectMembersLoading = false;
        state.projectMembersError = action.payload as string;
      });
  }
});

export const { 
  setSelectedProject, 
  clearSelectedProject,
  clearError
} = projectsSlice.actions;

// Selectors
export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectSelectedProject = (state: RootState) => state.projects.selectedProject;
export const selectProjectById = (id: string) => (state: RootState) => 
  state.projects.projects.find(project => project.id === id);
export const selectProjectLoading = (state: RootState) => state.projects.loading;
export const selectProjectError = (state: RootState) => state.projects.error;

// Project members selectors
export const selectProjectMembers = (projectId: string) => (state: RootState) => 
  state.projects.projectMembers[projectId] || [];
export const selectProjectMembersLoading = (state: RootState) => state.projects.projectMembersLoading;
export const selectProjectMembersError = (state: RootState) => state.projects.projectMembersError;



export default projectsSlice.reducer;
