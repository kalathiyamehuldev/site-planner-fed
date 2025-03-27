import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { projectService } from '@/services/project.service';
import type { CreateProjectDto, UpdateProjectDto, PaginationDto, FilterDto } from '@/common/types/project.types';

// Mock data for projects
const initialProjects = [
  {
    id: "p1",
    title: "Modern Loft Redesign",
    client: "Jane Cooper",
    status: "In Progress" as const,
    dueDate: "Aug 24, 2023",
    team: ["Alex Jones", "Sarah Smith", "Robert Lee"],
    progress: 65,
    description: "Complete redesign of a downtown loft space with modern finishes",
    budget: 75000,
    startDate: "2023-05-15",
    endDate: "2023-09-30",
  },
  {
    id: "p2",
    title: "Coastal Vacation Home",
    client: "Michael Scott",
    status: "Not Started" as const,
    dueDate: "Sep 15, 2023",
    team: ["Alex Jones", "Sarah Smith"],
    progress: 0,
    description: "Interior design for a beachfront vacation property",
    budget: 120000,
    startDate: "2023-09-01",
    endDate: "2023-12-15",
  },
  {
    id: "p3",
    title: "Corporate Office Revamp",
    client: "Acme Corp",
    status: "On Hold" as const,
    dueDate: "Oct 30, 2023",
    team: ["Alex Jones", "Robert Lee", "Emma Watson", "John Doe"],
    progress: 35,
    description: "Modernization of corporate headquarters, 3 floors",
    budget: 250000,
    startDate: "2023-07-10",
    endDate: "2023-11-30",
  },
  {
    id: "p4",
    title: "Luxury Apartment Redesign",
    client: "David Miller",
    status: "Completed" as const,
    dueDate: "Jul 10, 2023",
    team: ["Sarah Smith", "Emma Watson"],
    progress: 100,
    description: "Complete interior redesign of a luxury penthouse apartment",
    budget: 180000,
    startDate: "2023-03-15",
    endDate: "2023-07-10",
  },
  {
    id: "p5",
    title: "Restaurant Interior",
    client: "Fine Dining Inc.",
    status: "In Progress" as const,
    dueDate: "Nov 5, 2023",
    team: ["Alex Jones", "John Doe"],
    progress: 40,
    description: "Design for a new upscale restaurant, including dining area and bar",
    budget: 95000,
    startDate: "2023-08-01",
    endDate: "2023-12-01",
  },
  {
    id: "p6",
    title: "Boutique Hotel Lobby",
    client: "Elegance Hotels",
    status: "Not Started" as const,
    dueDate: "Dec 15, 2023",
    team: ["Robert Lee", "Emma Watson"],
    progress: 0,
    description: "Redesign of the main lobby and reception area",
    budget: 85000,
    startDate: "2023-10-15",
    endDate: "2024-01-15",
  },
];

export type Project = typeof initialProjects[0];
export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: ProjectsState = {
  projects: initialProjects,
  selectedProject: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async ({ pagination, filters }: { pagination?: PaginationDto; filters?: FilterDto }, { rejectWithValue }) => {
    try {
      const response = await projectService.getAll(pagination, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string, { rejectWithValue }) => {
    try {
      const project = await projectService.getById(id);
      return project;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (project: CreateProjectDto, { rejectWithValue }) => {
    try {
      const newProject = await projectService.create(project);
      return newProject;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, project }: { id: string; project: UpdateProjectDto }, { rejectWithValue }) => {
    try {
      const updatedProject = await projectService.update(id, project);
      return updatedProject;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectService.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(project => project.id !== action.payload);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedProject, clearSelectedProject } = projectsSlice.actions;

export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectSelectedProject = (state: RootState) => state.projects.selectedProject;
export const selectProjectById = (id: string) => (state: RootState) => 
  state.projects.projects.find(project => project.id === id);
export const selectProjectLoading = (state: RootState) => state.projects.loading;
export const selectProjectError = (state: RootState) => state.projects.error;
export const selectProjectPagination = (state: RootState) => state.projects.pagination;

export default projectsSlice.reducer;
