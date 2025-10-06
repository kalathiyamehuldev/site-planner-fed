
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import TaskTable from "@/components/TaskTable";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, Calendar, Clock, User, List, LayoutGrid } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAllTasks,
  fetchAllTasksByCompany,
  setSelectedTask,
  deleteTaskAsync,
  updateTaskStatusAsync,
} from "@/redux/slices/tasksSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import { useToast } from "@/hooks/use-toast";
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

const Tasks = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
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
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  useEffect(() => {
    dispatch(fetchAllTasksByCompany());
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
        return task.priority === "HIGH";
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
        toast({
          title: "Success",
          description: "Task deleted successfully!",
        });
        // Refresh tasks list
        dispatch(fetchAllTasksByCompany());
      } else {
        throw new Error(result.payload as string || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingTask(null);
    // Refresh tasks list
    dispatch(fetchAllTasksByCompany());
  };

  const handleNewTaskSuccess = () => {
    setShowNewTaskDialog(false);
    // Refresh tasks list
    dispatch(fetchAllTasksByCompany());
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const result = await dispatch(updateTaskStatusAsync({ 
        id: taskId, 
        status: newStatus as 'TODO' | 'IN_PROGRESS' | 'DONE'
      }));
      
      if (updateTaskStatusAsync.fulfilled.match(result)) {
        toast({
          title: "Success",
          description: "Task status updated successfully!",
        });
        // Refresh tasks list
        dispatch(fetchAllTasksByCompany());
      } else {
        throw new Error(result.payload as string || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task status. Please try again.",
        variant: "destructive",
      });
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
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  viewMode === "kanban"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid size={16} />
                Board
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List size={16} />
                List
              </button>
            </div>
            {hasPermission('tasks', 'create') && (
            <MotionButton 
              variant="default" 
              motion="subtle"
              onClick={() => setShowNewTaskDialog(true)}
            >
              <Plus size={18} className="mr-2" /> New Task
            </MotionButton>
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
               setShowNewTaskDialog(true);
               // You could set a default status here if needed
             }}
             onUpdateTaskStatus={handleUpdateTaskStatus}
             className="animate-fade-in"
           />
         ):(
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
          onOpenChange={(open) => !open && setShowNewTaskDialog(false)}
          projectId={''}
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
