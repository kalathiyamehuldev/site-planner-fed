
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { 
  Check, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  Clock 
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAllTodos,
  selectActiveTodos,
  selectCompletedTodos,
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  clearError,
  CreateTodoData,
  UpdateTodoData,
} from "@/redux/slices/todoSlice";
import { selectAllProjects, fetchProjects } from "@/redux/slices/projectsSlice";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const TodoList = () => {
  const dispatch = useAppDispatch();
  const activeTodos = useAppSelector(selectActiveTodos);
  const completedTodos = useAppSelector(selectCompletedTodos);
  const projects = useAppSelector(selectAllProjects);
  const { loading, error } = useAppSelector((state) => state.todos);

  const [showCompleted, setShowCompleted] = useState(true);
  const [segment, setSegment] = useState<'all'|'active'|'completed'>('all');
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [editTodoId, setEditTodoId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    // Fetch all todos initially, then filter by project if filter is selected
    dispatch(fetchTodos(filterProject ? { projectId: filterProject } : {}));
  }, [dispatch, filterProject]);

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (segment === 'completed') {
      setShowCompleted(true);
    } else if (segment === 'active') {
      setShowCompleted(false);
    }
  }, [segment]);

  // Filter view by segment
  const displayedTodos = segment === 'all'
    ? (showCompleted ? [...completedTodos] : [...activeTodos])
    : segment === 'active'
      ? [...activeTodos]
      : [...completedTodos];

  const handleAddTodo = () => {
    if (newTodoText.trim() === "" || !selectedProject) {
      alert("Please enter todo text and select a project");
      return;
    }

    const todoData: CreateTodoData = {
      text: newTodoText,
      projectId: selectedProject,
      ...(selectedDueDate && { dueDate: selectedDueDate }),
    };

    dispatch(createTodo(todoData));

    setNewTodoText("");
    setSelectedDueDate("");
  };

  const handleToggleTodo = (id: string, completed: boolean) => {
    const updateData: UpdateTodoData = {
      completed: !completed,
    };
    dispatch(updateTodo({ id, data: updateData }));
  };

  const handleDeleteTodo = (id: string) => {
    dispatch(deleteTodo(id));
  };

  const startEdit = (todoId: string, text: string) => {
    setEditTodoId(todoId);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editText.trim() === "" || !editTodoId) return;

    const updateData: UpdateTodoData = {
      text: editText,
    };

    dispatch(
      updateTodo({
        id: editTodoId,
        data: updateData,
      })
    );

    setEditTodoId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditTodoId(null);
    setEditText("");
  };

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="To-Do List" 
        subtitle="Keep track of your project tasks"
      />

      {error && (
        <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="hidden md:block overflow-x-auto pb-1 -mx-1 px-1">
              <ToggleGroup type="single" value={segment} onValueChange={(v) => v && setSegment(v as 'all'|'active'|'completed')} variant="outline" size="sm" className="gap-2">
                <ToggleGroupItem value="all" aria-label="Show all">All</ToggleGroupItem>
                <ToggleGroupItem value="active" aria-label="Show active">Active</ToggleGroupItem>
                <ToggleGroupItem value="completed" aria-label="Show completed">Completed</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="md:hidden flex items-center gap-2 w-full overflow-x-auto pb-1">
              <div className="min-w-[5.5rem]">
                <Select value={segment} onValueChange={(v) => setSegment(v as 'all'|'active'|'completed')}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1 min-w-0">
                <select
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                >
                  <option value="">Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={14}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Switch
                  checked={showCompleted}
                  onCheckedChange={(v) => {
                    const checked = !!v;
                    setShowCompleted(checked);
                    setSegment((prev) => prev === 'all' ? prev : (checked ? 'completed' : 'active'));
                  }}
                  aria-label="Show completed"
                />
                <span className="text-xs text-muted-foreground">Done</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative md:w-48">
                <select
                  className="w-full h-8 text-sm rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                >
                  <option value="">Filter by project</option>
                  {projects.map((project) => (
                     <option key={project.id} value={project.id}>
                       {project.title}
                     </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={14}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showCompleted}
                  onCheckedChange={(v) => {
                    const checked = !!v;
                    setShowCompleted(checked);
                    setSegment((prev) => prev === 'all' ? prev : (checked ? 'completed' : 'active'));
                  }}
                  aria-label="Show completed"
                />
                <span className="text-xs md:text-sm text-muted-foreground">Show completed</span>
              </div>
            </div>
          </div>

        {/* Add Todo Form */}
        <GlassCard className="p-4 animate-scale-in">
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 rounded-xl border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
              />

              <ActionButton
                variant="primary"
                onClick={handleAddTodo}
                disabled={
                  newTodoText.trim() === "" || !selectedProject || loading
                }
                motion="subtle"
                leftIcon={<Plus size={18} />}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <select
                  className="rounded-lg border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
                  size={16}
                />
              </div>

              <div className="flex items-center gap-1">
                <Clock size={14} className="text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Due date"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Todo List */}
        <div className="space-y-2 animate-fade-in animation-delay-[0.1s]">
          {loading && (
            <GlassCard className="p-8 text-center">
              <div className="text-2xl mb-2">⏳</div>
              <h3 className="text-lg font-medium mb-1">Loading...</h3>
              <p className="text-muted-foreground">Fetching your todos...</p>
            </GlassCard>
          )}

          {!loading && displayedTodos.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <div className="text-2xl mb-2">✓</div>
              <h3 className="text-lg font-medium mb-1">No todos found!</h3>
              <p className="text-muted-foreground">
                {filterProject 
                  ? "No todos found for the selected project. Add some tasks to get started."
                  : "Your to-do list is empty. Add some tasks to get started."
                }
              </p>
            </GlassCard>
          ) : (
            displayedTodos.map((todo) => (
              <GlassCard
                key={todo.id}
                className={cn(
                  "p-4 transition-all rounded-xl",
                  todo.completed && "opacity-60"
                )}
              >
                {editTodoId === todo.id ? (
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      className="flex-1 rounded-xl border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <ActionButton
                      variant="primary"
                      onClick={saveEdit}
                      disabled={editText.trim() === ""}
                      motion="subtle"
                      text="Save"
                    />
                    <ActionButton
                      variant="secondary"
                      onClick={cancelEdit}
                      motion="subtle"
                      text="Cancel"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() =>
                          handleToggleTodo(todo.id, todo.completed)
                        }
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full border transition-colors mt-1",
                          todo.completed
                            ? "bg-primary border-primary text-white flex items-center justify-center"
                            : "border-gray-300 hover:border-primary"
                        )}
                        aria-label={todo.completed ? 'Mark as active' : 'Mark as completed'}
                      >
                        {todo.completed && <Check size={14} />}
                      </button>

                      <div className="space-y-1">
                        <p
                          className={cn(
                            "text-[15px]",
                            todo.completed &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {todo.text}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {todo.project && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {todo.project.name}
                            </span>
                          )}

                          {todo.dueDate && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full",
                                todo.dueDate === "Today" &&
                                  "bg-amber-100 text-amber-600",
                                todo.dueDate === "Tomorrow" &&
                                  "bg-blue-100 text-blue-600",
                                todo.dueDate.includes("ago") &&
                                  "bg-red-100 text-red-600",
                                !todo.dueDate.includes("Today") &&
                                  !todo.dueDate.includes("Tomorrow") &&
                                  !todo.dueDate.includes("ago") &&
                                  "bg-gray-100 text-gray-600"
                              )}
                            >
                              <Clock size={10} className="inline-block mr-1" /> {todo.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(todo.id, todo.text)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
                        aria-label="Edit todo"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-muted-foreground hover:text-red-500 p-1 rounded-md hover:bg-secondary"
                        aria-label="Delete todo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))
          )}

          {activeTodos.length > 0 && (
            <div className="text-sm text-muted-foreground mt-2 pl-2">
              {activeTodos.length} {activeTodos.length === 1 ? "task" : "tasks"}{" "}
              remaining
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default TodoList;
