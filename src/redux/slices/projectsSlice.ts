
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

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
}

const initialState: ProjectsState = {
  projects: initialProjects,
  selectedProject: null,
  loading: false,
  error: null
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    getProjects: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedProject: (state, action: PayloadAction<string>) => {
      state.selectedProject = state.projects.find(project => project.id === action.payload) || null;
    },

    // Clear selected project
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
    addProject: (state, action: PayloadAction<Omit<Project, 'id'>>) => {
      const newProject = {
        ...action.payload,
        id: `p${state.projects.length + 1}`,
      };
      state.projects.push(newProject);
    },
    updateProject: (state, action: PayloadAction<{ id: string; project: Partial<Project> }>) => {
      const { id, project } = action.payload;
      const index = state.projects.findIndex(p => p.id === id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...project };
        if (state.selectedProject?.id === id) {
          state.selectedProject = state.projects[index];
        }
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(project => project.id !== action.payload);
      if (state.selectedProject?.id === action.payload) {
        state.selectedProject = null;
      }
    }
  }
});

export const { 
  getProjects, 
  setSelectedProject, 
  clearSelectedProject, 
  addProject, 
  updateProject, 
  deleteProject 
} = projectsSlice.actions;

// Selectors
export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectSelectedProject = (state: RootState) => state.projects.selectedProject;
export const selectProjectById = (id: string) => (state: RootState) => 
  state.projects.projects.find(project => project.id === id);
export const selectProjectLoading = (state: RootState) => state.projects.loading;
export const selectProjectError = (state: RootState) => state.projects.error;


export default projectsSlice.reducer;
