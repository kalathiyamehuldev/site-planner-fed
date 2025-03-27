
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for tasks
const initialTasks = [
  {
    id: "t1",
    title: "Finalize floor plans",
    projectId: "p1",
    projectName: "Modern Loft Redesign",
    status: "In Progress" as const,
    priority: "High" as const,
    dueDate: "Tomorrow",
    estimatedHours: 4,
    assignedTo: "Alex Jones",
    description: "Complete the final floor plans for client approval",
    completedDate: null,
  },
  {
    id: "t2",
    title: "Source furniture options",
    projectId: "p2",
    projectName: "Coastal Vacation Home",
    status: "Not Started" as const,
    priority: "Medium" as const,
    dueDate: "This week",
    estimatedHours: 8,
    assignedTo: "Sarah Smith",
    description: "Research and compile furniture options for living room and bedrooms",
    completedDate: null,
  },
  {
    id: "t3",
    title: "Client meeting for material selection",
    projectId: "p1",
    projectName: "Modern Loft Redesign",
    status: "Not Started" as const,
    priority: "Medium" as const,
    dueDate: "Next Monday",
    estimatedHours: 2,
    assignedTo: "Alex Jones",
    description: "Present material samples and get client approval on selections",
    completedDate: null,
  },
  {
    id: "t4",
    title: "Lighting design plan",
    projectId: "p1",
    projectName: "Modern Loft Redesign",
    status: "Not Started" as const,
    priority: "Low" as const,
    dueDate: "Next week",
    estimatedHours: 6,
    assignedTo: "Robert Lee",
    description: "Design lighting layout for all rooms and specify fixtures",
    completedDate: null,
  },
  {
    id: "t5",
    title: "Select color palette options",
    projectId: "p3",
    projectName: "Corporate Office Revamp",
    status: "Not Started" as const,
    priority: "Medium" as const,
    dueDate: "In 2 weeks",
    estimatedHours: 3,
    assignedTo: "Sarah Smith",
    description: "Create color scheme options for client review",
    completedDate: null,
  },
  {
    id: "t6",
    title: "Create 3D renders of kitchen",
    projectId: "p1",
    projectName: "Modern Loft Redesign",
    status: "On Hold" as const,
    priority: "High" as const,
    dueDate: "Next month",
    estimatedHours: 10,
    assignedTo: "Robert Lee",
    description: "Produce photorealistic 3D renderings of kitchen design",
    completedDate: null,
  },
];

export type Task = typeof initialTasks[0];
export type TaskStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: initialTasks,
  selectedTask: null,
  loading: false,
  error: null
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    getTasks: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedTask: (state, action: PayloadAction<string>) => {
      state.selectedTask = state.tasks.find(task => task.id === action.payload) || null;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    addTask: (state, action: PayloadAction<Omit<Task, 'id'>>) => {
      const newTask = {
        ...action.payload,
        id: `t${state.tasks.length + 1}`,
      };
      state.tasks.push(newTask);
    },
    updateTask: (state, action: PayloadAction<{ id: string; task: Partial<Task> }>) => {
      const { id, task } = action.payload;
      const index = state.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...task };
        if (state.selectedTask?.id === id) {
          state.selectedTask = state.tasks[index];
        }
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
      if (state.selectedTask?.id === action.payload) {
        state.selectedTask = null;
      }
    },
    updateTaskStatus: (state, action: PayloadAction<{ id: string; status: TaskStatus }>) => {
      const { id, status } = action.payload;
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.status = status;
        if (status === 'Completed') {
          task.completedDate = new Date().toISOString();
        } else {
          task.completedDate = null;
        }
      }
    }
  }
});

export const { 
  getTasks, 
  setSelectedTask, 
  clearSelectedTask, 
  addTask, 
  updateTask, 
  deleteTask,
  updateTaskStatus 
} = tasksSlice.actions;

export const selectAllTasks = (state: RootState) => state.tasks.tasks;
export const selectSelectedTask = (state: RootState) => state.tasks.selectedTask;
export const selectTaskById = (id: string) => (state: RootState) => 
  state.tasks.tasks.find(task => task.id === id);
export const selectTasksByProject = (projectId: string) => (state: RootState) => 
  state.tasks.tasks.filter(task => task.projectId === projectId);
export const selectTaskLoading = (state: RootState) => state.tasks.loading;
export const selectTaskError = (state: RootState) => state.tasks.error;

export default tasksSlice.reducer;
