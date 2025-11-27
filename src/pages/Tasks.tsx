
import React, { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
// Removed unused GlassCard import
import TaskTable from "@/components/TaskTable";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import TaskTimeline from "@/components/tasks/TaskTimeline";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, Calendar, Clock, User, List, LayoutGrid } from "lucide-react";
import solar from "@solar-icons/react";
import ActionButton from "@/components/ui/ActionButton";
import { addDays, isSameDay, isWithinInterval } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAllTasks,
  fetchAllTasksByCompany,
  setSelectedTask,
  deleteTaskAsync,
  updateTaskStatusAsync,
} from "@/redux/slices/tasksSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import { selectUser } from "@/redux/slices/authSlice";
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
  const currentUser = useAppSelector(selectUser);
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
    dispatch(fetchAllTasksByCompany());
    dispatch(fetchProjects());
  }, [dispatch]);

  const isVendor = currentUser?.userType === 'VENDOR';
  const visibleAllTasks = useMemo(() => {
    return isVendor
      ? (allTasks || []).filter(t => t.assigneeType === 'VENDOR' && t.assigneeId === currentUser?.id)
      : (allTasks || []);
  }, [allTasks, currentUser?.id, isVendor]);

  // Helper function to check if a task matches the current filter
  const taskMatchesFilter = (task: any) => {
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
        if (currentUser?.userType === 'VENDOR') {
          return task.assigneeType === 'VENDOR' && task.assigneeId === currentUser?.id;
        }
        return task.member?.id === currentUser?.id;
      case "high-priority":
        return task.priority === "HIGH" || task.priority === "URGENT";
      case "upcoming":
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        
        // Check if date is valid
        if (isNaN(dueDate.getTime())) return false;
        
        const today = new Date();
        const nextWeek = addDays(today, 7);
        
        // Include tasks due today or within the next 7 days (excluding past dates)
        return isSameDay(dueDate, today) || isWithinInterval(dueDate, {
          start: addDays(today, 1), // Tomorrow
          end: nextWeek
        });
      default:
        return true;
    }
  };

  // Enhanced filtering that considers both parent tasks and subtasks
  const filteredTasks = useMemo(() => {
    const isVendor = currentUser?.userType === 'VENDOR';
    const vendorScoped = isVendor
      ? (allTasks || []).filter(t => t.assigneeType === 'VENDOR' && t.assigneeId === currentUser?.id)
      : (allTasks || []);
    const accessibleIds = new Set((projects || []).map(p => p.id));
    const parentTasks = vendorScoped.filter(task => !task.parentId && (!task.project?.id || accessibleIds.has(task.project.id)));
    const subtasks = vendorScoped.filter(task => task.parentId && (!task.project?.id || accessibleIds.has(task.project.id)));
    
    const result: any[] = [];

    parentTasks.forEach(parentTask => {
      const parentMatches = taskMatchesFilter(parentTask);
      const taskSubtasks = subtasks.filter(subtask => subtask.parentId === parentTask.id);
      const matchingSubtasks = taskSubtasks.filter(subtask => taskMatchesFilter(subtask));
      
      // Include parent if either parent matches OR any subtask matches
      if (parentMatches || matchingSubtasks.length > 0) {
        result.push(parentTask);
        
        // Add all subtasks if parent matches, or only matching subtasks if parent doesn't match
        if (parentMatches) {
          result.push(...taskSubtasks);
        } else {
          result.push(...matchingSubtasks);
        }
      }
    });

    return result;
  }, [allTasks, filter, searchTerm, currentUser?.id, currentUser?.userType]);

  const kanbanTasks = useMemo(() => {
    const isVendor = currentUser?.userType === 'VENDOR';
    const vendorScoped = isVendor
      ? (allTasks || []).filter(t => t.assigneeType === 'VENDOR' && t.assigneeId === currentUser?.id)
      : (allTasks || []);
    const accessibleIds = new Set((projects || []).map(p => p.id));
    return vendorScoped
      .filter(task => !task.parentId && (!task.project?.id || accessibleIds.has(task.project.id)))
      .filter(taskMatchesFilter);
  }, [allTasks, projects, filter, searchTerm, currentUser?.id, currentUser?.userType]);

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
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors border",
        filter === value
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-transparent border-input text-muted-foreground"
      )}
    >
      <span className="hidden md:inline-block"><Icon size={14} /></span>
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
        dispatch(fetchAllTasksByCompany());
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
    dispatch(fetchAllTasksByCompany());
  };

  const handleNewTaskSuccess = () => {
    setShowNewTaskDialog(false);
    setNewTaskInitialStatus(null);
    setLockNewTaskStatus(false);
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
        dispatch(fetchAllTasksByCompany());
      } else {
        throw new Error((result.payload as string) || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4 md:space-y-8">
        {/* Desktop Header */}
        <PageHeader 
          title="Tasks" 
          subtitle="Manage and track all your project tasks"
        >
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
        </PageHeader>

        {/* Mobile Search & Filters (List/Timeline only) */}
        {viewMode !== "kanban" && (
        <div className="md:hidden animate-fade-in animation-delay-[0.1s] w-full space-y-2">
          <div className="relative">
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterButton label="All Tasks" value="all" icon={Filter} />
            <FilterButton label="My Tasks" value="mine" icon={User} />
            <FilterButton label="High Priority" value="high-priority" icon={Clock} />
            <FilterButton label="Upcoming" value="upcoming" icon={Calendar} />
          </div>
        </div>
        )}

        <div className="hidden md:flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
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

        {/* Desktop Filter Info Banner */}
        {(filter !== "all" || searchTerm) && (
          <div className="hidden md:block bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Filter size={16} />
              <span>
                {searchTerm ? (
                  <>Showing tasks matching "{searchTerm}"</>
                ) : (
                  <>Showing {filter === "mine" ? "your tasks" : filter === "high-priority" ? "high priority tasks" : "upcoming tasks"}</>
                )}
                {viewMode === "kanban" 
                  ? " (Kanban groups tasks by status)" 
                  : " (includes parent tasks when subtasks match)"
                }
              </span>
            </div>
          </div>
        )}

        {viewMode === "kanban" ? (
          <KanbanBoard
             tasks={kanbanTasks}
             allTasks={visibleAllTasks}
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
             // Mobile controls props
             viewMode={viewMode}
             onViewModeChange={setViewMode}
             onNewTask={() => {
               setLockNewTaskStatus(false);
               setNewTaskInitialStatus(null);
               setShowNewTaskDialog(true);
             }}
             searchTerm={searchTerm}
             onSearchChange={setSearchTerm}
             filter={filter}
             onFilterChange={setFilter}
             hasCreatePermission={hasPermission('tasks', 'create')}
           />
         ) : viewMode === "timeline" ? (
          <div className="animate-fade-in">
            <TaskTimeline tasks={filteredTasks} />
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
