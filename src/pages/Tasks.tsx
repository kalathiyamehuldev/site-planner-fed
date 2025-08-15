
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import TaskTable from "@/components/TaskTable";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, Calendar, Clock, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAllTasks,
  fetchTasks,
  setSelectedTask,
} from "@/redux/slices/tasksSlice";

const Tasks = () => {
  const dispatch = useAppDispatch();
  const allTasks = useAppSelector(selectAllTasks);

  const [filter, setFilter] = useState<
    "all" | "mine" | "high-priority" | "upcoming"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchTasks(null));
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
          <MotionButton variant="default" motion="subtle">
            <Plus size={18} className="mr-2" /> New Task
          </MotionButton>
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

        <TaskTable
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          className="animate-fade-in"
          showProject={true}
        />
      </div>
    </PageContainer>
  );
};

export default Tasks;
