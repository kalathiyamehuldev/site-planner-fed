
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import TaskTable from "@/components/TaskTable";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import TaskTimeline from "@/components/tasks/TaskTimeline";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, Calendar, Clock, User, List, LayoutGrid } from "lucide-react";
import solar from "@solar-icons/react";
import ActionButton from "@/components/ui/ActionButton";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAllTasks,
  fetchAllTasksByCompany,
  fetchParentTasksByCompany,
  setSelectedTask,
  deleteTaskAsync,
  updateTaskStatusAsync,
} from "@/redux/slices/tasksSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
// removed useToast import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import usePermission from "@/hooks/usePermission";
import { useNavigate } from "react-router-dom";

const Tasks = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // removed useToast usage
  const allTasks = useAppSelector(selectAllTasks);
  const projects = useAppSelector(selectAllProjects);
  const { hasPermission } = usePermission();

  const [filter, setFilter] = useState<
    "all" | "mine" | "high-priority" | "upcoming"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE" | null>(null);
  const [lockNewTaskStatus, setLockNewTaskStatus] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "kanban" | "timeline">("kanban");

  useEffect(() => {
    dispatch(fetchParentTasksByCompany());
    dispatch(fetchProjects());
  }, [dispatch]);

  const filteredTasks = allTasks.filter((task) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(term) ||
        (task.project?.name || "").toLowerCase().includes(term) ||
        (task.assignee || "").toLowerCase().includes(term)
      );
    }

    switch (filter) {
      case "mine":
        return task.assignee === "Alex Jones"; // For demo purposes
      case "high-priority":
        return task.priority === "HIGH" || task.priority === "URGENT";
      case "upcoming":
        return (
          task.dueDate && (
            task.dueDate.includes("Tomorrow") ||
            task.dueDate.includes("This week")
          )
        );
      default:
        return true;
    }
  });

  const FilterButton = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: typeof filter;
    icon: React.ElementType;
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
        filter === value
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary"
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  const handleTaskClick = (taskId: string) => {
    dispatch(setSelectedTask(taskId));
    navigate(`/tasks/${taskId}`);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTaskId) return;

    try {
      const result = await dispatch(deleteTaskAsync(deletingTaskId));
      if (deleteTaskAsync.fulfilled.match(result)) {
        dispatch(fetchParentTasksByCompany());
      } else {
        throw new Error((result.payload as string) || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingTask(null);
    // Refresh tasks list
    dispatch(fetchParentTasksByCompany());
  };

  const handleNewTaskSuccess = () => {
    setShowNewTaskDialog(false);
    setNewTaskInitialStatus(null);
    setLockNewTaskStatus(false);
    // Refresh tasks list
    dispatch(fetchParentTasksByCompany());
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const result = await dispatch(updateTaskStatusAsync({ 
        id: taskId, 
        status: newStatus as 'TODO' | 'IN_PROGRESS' | 'DONE'
      }));
      if (updateTaskStatusAsync.fulfilled.match(result)) {
        dispatch(fetchParentTasksByCompany());
      } else {
        throw new Error((result.payload as string) || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track all your project tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <ActionButton
                text="Board"
                variant={viewMode === "kanban" ? "secondary" : "gray"}
                leftIcon={<LayoutGrid size={16} />}
                className="px-3 py-2 text-sm"
                onClick={() => setViewMode("kanban")}
              />
              <ActionButton
                text="List"
                variant={viewMode === "list" ? "secondary" : "gray"}
                leftIcon={<List size={16} />}
                className="px-3 py-2 text-sm"
                onClick={() => setViewMode("list")}
              />
              <ActionButton
                text="Timeline"
                variant={viewMode === "timeline" ? "secondary" : "gray"}
                leftIcon={<solar.Time.Stopwatch className="h-4 w-4" />}
                className="px-3 py-2 text-sm"
                onClick={() => setViewMode("timeline")}
              />
            </div>
            {hasPermission('tasks', 'create') && (
            <ActionButton 
              variant="primary" 
              // motion="subtle"
              leftIcon={<Plus size={18} className="mr-2" />}
              text="New Task"
              onClick={() => {
                setLockNewTaskStatus(false);
                setNewTaskInitialStatus(null);
                setShowNewTaskDialog(true);
              }}
            >
              {/* <Plus size={18} className="mr-2" /> New Task */}
            </ActionButton>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <FilterButton label="All Tasks" value="all" icon={Filter} />
            <FilterButton label="My Tasks" value="mine" icon={User} />
            <FilterButton
              label="High Priority"
              value="high-priority"
              icon={Clock}
            />
            <FilterButton label="Upcoming" value="upcoming" icon={Calendar} />
          </div>
        </div>

        {viewMode === "kanban" ? (
           <KanbanBoard
             tasks={filteredTasks}
             onTaskClick={handleTaskClick}
             onEditTask={handleEditTask}
             onDeleteTask={handleDeleteTask}
            onAddTask={(status) => {
              setNewTaskInitialStatus(status as 'TODO' | 'IN_PROGRESS' | 'DONE');
              setLockNewTaskStatus(true);
              setShowNewTaskDialog(true);
            }}
             onUpdateTaskStatus={handleUpdateTaskStatus}
             className="animate-fade-in"
           />
         ) : viewMode === "timeline" ? (
          <div className="animate-fade-in">
            <TaskTimeline />
          </div>
         ) : (
          <TaskTable
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            className="animate-fade-in"
            showProject={true}
          />
        )}

        {/* New Task Dialog */}
        <AddTaskDialog
          open={showNewTaskDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowNewTaskDialog(false);
              setNewTaskInitialStatus(null);
              setLockNewTaskStatus(false);
            } else {
              setShowNewTaskDialog(true);
            }
          }}
          projectId={''}
          initialStatus={newTaskInitialStatus || undefined}
          lockStatus={lockNewTaskStatus}
          onSuccess={handleNewTaskSuccess}
        />

        {/* Edit Task Dialog */}
        <AddTaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          projectId={editingTask?.project?.id || ''}
          task={editingTask}
          onSuccess={handleEditSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingTaskId} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTask} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
};

export default Tasks;
