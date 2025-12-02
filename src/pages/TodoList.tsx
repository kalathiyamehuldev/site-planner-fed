
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import ActionButton from "@/components/ui/ActionButton";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import solar, { Pen2, TrashBinTrash } from "@solar-icons/react";
import { MotionButton } from "@/components/ui/motion-button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { Pencil, Trash2 } from "lucide-react";

const TodoList = () => {
  const dispatch = useAppDispatch();
  const activeTodos = useAppSelector(selectActiveTodos);
  const completedTodos = useAppSelector(selectCompletedTodos);
  const allTodos = useAppSelector(selectAllTodos);
  const projects = useAppSelector(selectAllProjects);
  const { loading, error } = useAppSelector((state) => state.todos);

  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [editTodoId, setEditTodoId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const projectColors = [
    '#1B78F9', '#00C2FF', '#3DD598', '#FFB547', '#FF6B6B',
    '#A970FF', '#FF82D2', '#29C499', '#E89F3D', '#2F95D8'
  ];
  const getProjectColor = (name: string) => {
    const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % projectColors.length;
    return projectColors[idx];
  };

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    // Fetch all todos initially, then filter by project if filter is selected
    dispatch(fetchTodos(filterProject ? { projectId: filterProject } : {}));
  }, [dispatch, filterProject]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  

  const displayedTodos = (showCompletedOnly ? [...completedTodos] : [...allTodos])
    .filter((t) => (filterProject ? t.project?.id === filterProject : true))
    .filter((t) => (searchTerm ? t.text.toLowerCase().includes(searchTerm.toLowerCase()) : true));

  const handleAddTodo = () => {
    if (newTodoText.trim() === "" || !selectedProject) {
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
    setOpenAddDialog(false);
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

      <div className="max-w-4xl mr-auto space-y-4 md:space-y-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                placeholder="Search todos..."
                className="w-full rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden md:block relative">
              <select
                className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpenFilterDialog(true)}
              aria-label="Filter"
            >
              <Filter className="w-6 h-6 md:w-5 md:h-5" />
            </Button>
            <div className="hidden md:inline-flex">
              <ActionButton
                variant="primary"
                motion="subtle"
                text="Add"
                leftIcon={<solar.Ui.AddSquare className="w-5 h-5" />}
                onClick={() => setOpenAddDialog(true)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={showCompletedOnly}
              onCheckedChange={(v) => setShowCompletedOnly(!!v)}
              aria-label="Completed only"
            />
            <span className="text-xs md:text-sm text-muted-foreground">Completed only</span>
          </div>
        </div>

        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogContent className="w-5/6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Enter details for the new to-do item.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Task title"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
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
              </div>
              <div className="flex items-center gap-2">
                <solar.Time.ClockCircle className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <ActionButton
                variant="secondary"
                motion="subtle"
                text="Cancel"
                onClick={() => setOpenAddDialog(false)}
              />
              <ActionButton
                variant="primary"
                motion="subtle"
                text="Add"
                onClick={handleAddTodo}
                disabled={newTodoText.trim() === "" || !selectedProject || loading}
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openFilterDialog} onOpenChange={setOpenFilterDialog}>
          <DialogContent className="w-5/6 sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Filter</DialogTitle>
              <DialogDescription>Select a project to filter todos.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                >
                  <option value="">All projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <ActionButton
                variant="secondary"
                motion="subtle"
                text="Close"
                onClick={() => setOpenFilterDialog(false)}
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                        {todo.completed && <solar.Ui.CheckCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />}
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
                            (() => {
                              const color = getProjectColor(todo.project.name);
                              return (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[#1a2624]"
                                  style={{ backgroundColor: `${color}1A` }}
                                >
                                  {todo.project.name}
                                </span>
                              );
                            })()
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
                              <solar.Time.ClockCircle className="inline-block mr-1 w-4 h-4 md:w-3 md:h-3" /> {todo.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <MotionButton
                        variant="ghost"
                        size="sm"
                        motion="subtle"
                        onClick={() => startEdit(todo.id, todo.text)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        aria-label="Edit todo"
                      >
                        <Pencil className="w-5 h-5 md:w-4 md:h-4" />
                      </MotionButton>
                      <MotionButton
                        variant="ghost"
                        size="sm"
                        motion="subtle"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label="Delete todo"
                      >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                      </MotionButton>
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
      <Button
        variant="default"
        onClick={() => setOpenAddDialog(true)}
        className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2 py-2.5"
      >
        <solar.Ui.AddSquare className="w-7 h-7" style={{ width: 28, height: 28 }} />
      </Button>
    </PageContainer>
  );
};

export default TodoList;
