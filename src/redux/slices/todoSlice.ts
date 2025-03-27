
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for todos
const initialTodos = [
  { id: "1", text: "Review floor plans for Modern Loft project", completed: false, project: "Modern Loft Redesign", dueDate: "Tomorrow" },
  { id: "2", text: "Call vendor about furniture delivery", completed: false, project: "Coastal Vacation Home", dueDate: "Today" },
  { id: "3", text: "Prepare materials for client presentation", completed: false, project: "Corporate Office Revamp", dueDate: "Next Monday" },
  { id: "4", text: "Update project timeline", completed: true, project: "Modern Loft Redesign", dueDate: "Yesterday" },
  { id: "5", text: "Research sustainable building materials", completed: false, project: "Coastal Vacation Home", dueDate: "Next week" },
  { id: "6", text: "Follow up with contractor about permits", completed: true, project: "Modern Loft Redesign", dueDate: "2 days ago" },
];

export type Todo = typeof initialTodos[0];

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: initialTodos,
  loading: false,
  error: null
};

export const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    getTodos: (state) => {
      state.loading = false;
      state.error = null;
    },
    addTodo: (state, action: PayloadAction<Omit<Todo, 'id' | 'completed'>>) => {
      const newTodo = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
        completed: false
      };
      state.todos.unshift(newTodo);
    },
    updateTodo: (state, action: PayloadAction<{ id: string; todo: Partial<Todo> }>) => {
      const { id, todo } = action.payload;
      const index = state.todos.findIndex(t => t.id === id);
      if (index !== -1) {
        state.todos[index] = { ...state.todos[index], ...todo };
      }
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter(todo => todo.id !== action.payload);
    },
    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    }
  }
});

export const { 
  getTodos, 
  addTodo, 
  updateTodo, 
  deleteTodo,
  toggleTodo 
} = todoSlice.actions;

export const selectAllTodos = (state: RootState) => state.todos.todos;
export const selectActiveTodos = (state: RootState) => state.todos.todos.filter(todo => !todo.completed);
export const selectCompletedTodos = (state: RootState) => state.todos.todos.filter(todo => todo.completed);
export const selectTodosByProject = (projectId: string) => (state: RootState) => 
  state.todos.todos.filter(todo => todo.project === projectId);

export default todoSlice.reducer;
