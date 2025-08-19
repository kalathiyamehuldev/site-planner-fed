
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Plus,
  Play,
  Pause,
  Filter,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  Hourglass,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchTimeEntries,
  createTimeEntry,
  startTimer,
  stopTimer,
  getRunningTimer,
  fetchTimeEntrySummary,
  selectAllTimeEntries,
  selectActiveTimer,
  selectTimeTrackingLoading,
  selectTimeTrackingError,
  selectTimeTrackingPagination,
  selectTimeEntrySummary,
  selectIsTimerRunning,
  selectRunningTimeEntry,
  CreateTimeEntryData,
  StartTimerData,
} from "@/redux/slices/timeTrackingSlice";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import {
  fetchAllTasksByCompany,
  selectAllTasks,
} from "@/redux/slices/tasksSlice";
import { useToast } from "@/hooks/use-toast";

const TimeTracking = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Redux selectors
  const timeEntries = useAppSelector(selectAllTimeEntries);
  const activeTimer = useAppSelector(selectActiveTimer);
  const isTimerRunning = useAppSelector(selectIsTimerRunning);
  const runningTimeEntry = useAppSelector(selectRunningTimeEntry);
  const projects = useAppSelector(selectAllProjects);
  const tasks = useAppSelector(selectAllTasks);
  const currentUser = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector(selectTimeTrackingLoading);
  const error = useAppSelector(selectTimeTrackingError);
  const pagination = useAppSelector(selectTimeTrackingPagination);

  // Debug logging
  console.log('TimeTracking Debug:', {
    timeEntriesCount: timeEntries.length,
    timeEntries,
    loading,
    error,
    currentUser,
    pagination
  });

  // Local state
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "today" | "week" | "month" | "custom"
  >("week");
  const [filter, setFilter] = useState<
    "all" | "billable" | "nonbillable" | "pending"
  >("all");
  const [newTimeEntry, setNewTimeEntry] = useState<
    Partial<
      CreateTimeEntryData & { startTimeInput?: string; endTimeInput?: string }
    >
  >({
    date: new Date().toISOString().split("T")[0],
    isBillable: true,
    startTimeInput: "09:00",
    endTimeInput: "17:00",
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchTimeEntries({}));
    dispatch(fetchProjects());
    dispatch(fetchAllTasksByCompany());
    dispatch(getRunningTimer());
    dispatch(fetchTimeEntrySummary({}));
  }, [dispatch]);

  // Calculate total hours for the selected time range
  const totalHours =
    timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0); // Duration is already in hours
  const billableHours =
    timeEntries
      .filter((entry) => entry.isBillable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

  const formatElapsedTime = (startTime: Date) => {
    const elapsedMs = Date.now() - startTime.getTime();
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Filter time entries
  const filteredEntries = timeEntries.filter((entry) => {
    switch (filter) {
      case "billable":
        return entry.isBillable;
      case "nonbillable":
        return !entry.isBillable;
      case "pending":
        return entry.status === "Pending";
      default:
        return true;
    }
  });



  // Handle timer actions
  const handleStartTimer = async () => {
    if (!newTimeEntry.projectId && !newTimeEntry.taskId) {
      toast({
        title: "Error",
        description: "Please select a project or task to start the timer",
        variant: "destructive",
      });
      return;
    }

    const timerData: StartTimerData = {
      projectId: newTimeEntry.projectId,
      taskId: newTimeEntry.taskId,
      description: newTimeEntry.description,
      isBillable: newTimeEntry.isBillable,
      hourlyRate: newTimeEntry.hourlyRate,
    };

    try {
      await dispatch(startTimer(timerData)).unwrap();
      toast({
        title: "Timer Started",
        description: "Time tracking has begun",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const handleStopTimer = async () => {
    try {
      await dispatch(
        stopTimer({ description: newTimeEntry.description })
      ).unwrap();
      toast({
        title: "Timer Stopped",
        description: "Time entry has been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    }
  };

  const handleCreateTimeEntry = async () => {
    if (!newTimeEntry.projectId || !newTimeEntry.taskId) {
      toast({
        title: "Error",
        description: "Please select both a project and task",
        variant: "destructive",
      });
      return;
    }

    if (
      !newTimeEntry.duration &&
      (!newTimeEntry.startTimeInput || !newTimeEntry.endTimeInput)
    ) {
      toast({
        title: "Error",
        description: "Please provide either duration or start/end times",
        variant: "destructive",
      });
      return;
    }

    if (!newTimeEntry.date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate duration from start/end times if not provided
      let calculatedDuration = newTimeEntry.duration;
      if (
        !calculatedDuration &&
        newTimeEntry.startTimeInput &&
        newTimeEntry.endTimeInput
      ) {
        const [startHour, startMin] = newTimeEntry.startTimeInput
          .split(":")
          .map(Number);
        const [endHour, endMin] = newTimeEntry.endTimeInput
          .split(":")
          .map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        calculatedDuration = (endMinutes - startMinutes) / 60; // Convert to hours
      }

      // Format the data for the backend
      const timeEntryData: CreateTimeEntryData = {
        description: newTimeEntry.description,
        date: newTimeEntry.date,
        startTime: newTimeEntry.startTimeInput || "09:00", // Required field in HH:MM format
        endTime: newTimeEntry.endTimeInput,
        duration: calculatedDuration || 0,
        isBillable: newTimeEntry.isBillable ?? true,
        hourlyRate: newTimeEntry.hourlyRate,
        taskId: newTimeEntry.taskId,
        projectId: newTimeEntry.projectId,
      };

      await dispatch(createTimeEntry(timeEntryData)).unwrap();
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
      setNewTimeEntry({
        date: new Date().toISOString().split("T")[0],
        isBillable: true,
        startTimeInput: "09:00",
        endTimeInput: "17:00",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create time entry",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Time Tracking</h1>
            <p className="text-muted-foreground">
              Track and manage your working hours
            </p>
          </div>
          <div className="flex gap-3">
            <MotionButton variant="outline" size="sm" motion="subtle">
              <Download size={16} className="mr-2" /> Export
            </MotionButton>
            <MotionButton variant="default" size="sm" motion="subtle">
              <Plus size={16} className="mr-2" /> New Time Entry
            </MotionButton>
          </div>
        </div>

        {/* Active Timer Card */}
        <GlassCard className="p-6 animate-scale-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">
                CURRENTLY TRACKING
              </h3>
              {runningTimeEntry ? (
                <>
                  <div className="text-xl font-medium mb-1">
                    {runningTimeEntry.description || "No description"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {runningTimeEntry.project?.name ||
                      runningTimeEntry.task?.title ||
                      "No project/task"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-medium mb-1">
                    No active timer
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Start tracking time
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl font-light tabular-nums">
                {isTimerRunning && activeTimer.startTime
                  ? formatElapsedTime(new Date(activeTimer.startTime))
                  : "00:00:00"}
              </div>

              <MotionButton
                variant={isTimerRunning ? "outline" : "default"}
                size="icon"
                motion="subtle"
                onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
              >
                {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
              </MotionButton>
            </div>
          </div>
        </GlassCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in animation-delay-[0.1s]">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <Clock size={20} className="text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium text-sm">
                Total Hours
              </h3>
            </div>
            <p className="text-3xl font-light">{totalHours.toFixed(1)}</p>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">↑ 12%</span> from
              last {selectedTimeRange}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <Hourglass size={20} className="text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium text-sm">
                Billable Hours
              </h3>
            </div>
            <p className="text-3xl font-light">{billableHours.toFixed(1)}</p>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">↑ 8%</span> from last{" "}
              {selectedTimeRange}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <FileText size={20} className="text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium text-sm">
                Tracked Projects
              </h3>
            </div>
            <p className="text-3xl font-light">3</p>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">1 new</span> this{" "}
              {selectedTimeRange}
            </div>
          </GlassCard>
        </div>

        {/* Time Entries Table */}
        <div className="animate-fade-in animation-delay-[0.2s]">
          <Tabs defaultValue="entries" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <TabsList>
                <TabsTrigger value="entries">Time Entries</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap gap-2">
                <MotionButton
                  variant="outline"
                  size="sm"
                  motion="subtle"
                  onClick={() => setSelectedTimeRange("today")}
                  className={cn(
                    selectedTimeRange === "today" &&
                      "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  Today
                </MotionButton>
                <MotionButton
                  variant="outline"
                  size="sm"
                  motion="subtle"
                  onClick={() => setSelectedTimeRange("week")}
                  className={cn(
                    selectedTimeRange === "week" &&
                      "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  This Week
                </MotionButton>
                <MotionButton
                  variant="outline"
                  size="sm"
                  motion="subtle"
                  onClick={() => setSelectedTimeRange("month")}
                  className={cn(
                    selectedTimeRange === "month" &&
                      "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  This Month
                </MotionButton>
                <MotionButton
                  variant="outline"
                  size="sm"
                  motion="subtle"
                  onClick={() => setSelectedTimeRange("custom")}
                  className={cn(
                    selectedTimeRange === "custom" &&
                      "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  <Calendar size={16} className="mr-1" /> Custom
                </MotionButton>
              </div>
            </div>

            <TabsContent value="entries" className="mt-0">
              <GlassCard>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 border-b border-border">
                  <div className="text-lg font-medium">Recent Time Entries</div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilter("all")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        filter === "all"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Filter size={14} />
                      <span>All</span>
                    </button>
                    <button
                      onClick={() => setFilter("billable")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        filter === "billable"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Hourglass size={14} />
                      <span>Billable</span>
                    </button>
                    <button
                      onClick={() => setFilter("nonbillable")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        filter === "nonbillable"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Clock size={14} />
                      <span>Non-Billable</span>
                    </button>
                    <button
                      onClick={() => setFilter("pending")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        filter === "pending"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <RefreshCw size={14} />
                      <span>Pending</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Project
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Task
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          User
                        </th>
                        <th className="text-right p-4 font-medium text-muted-foreground">
                          Hours
                        </th>
                        <th className="text-center p-4 font-medium text-muted-foreground">
                          Billable
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right p-4 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw size={16} className="animate-spin" />
                              Loading time entries...
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-red-600">
                            <div className="flex flex-col items-center gap-2">
                              <span>Error loading time entries:</span>
                              <span className="text-sm">{error}</span>
                              <MotionButton
                                variant="outline"
                                size="sm"
                                motion="subtle"
                                onClick={() => dispatch(fetchTimeEntries({}))}
                                className="mt-2"
                              >
                                <RefreshCw size={16} className="mr-2" />
                                Retry
                              </MotionButton>
                            </div>
                          </td>
                        </tr>
                      ) : filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Clock size={24} className="text-muted-foreground/50" />
                              <span>No time entries found</span>
                              <span className="text-sm">Start tracking time or adjust your filters</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-muted/20 border-b border-border last:border-0"
                          >
                            <td className="p-4">{entry.date}</td>
                            <td className="p-4 font-medium">
                              {entry.project?.name || "No project"}
                            </td>
                            <td className="p-4">
                              {entry.task?.title || "No task"}
                            </td>
                            <td className="p-4">
                              {entry.user
                                ? `${entry.user.firstName} ${entry.user.lastName}`
                                : "Unknown user"}
                            </td>
                            <td className="p-4 text-right tabular-nums">
                              {((entry.duration || 0) / 3600).toFixed(1)}
                            </td>
                            <td className="p-4 text-center">
                              {entry.isBillable ? (
                                <span className="inline-block w-4 h-4 bg-green-500 rounded-full"></span>
                              ) : (
                                <span className="inline-block w-4 h-4 bg-gray-300 rounded-full"></span>
                              )}
                            </td>
                            <td className="p-4">
                              <span
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full font-medium inline-block",
                                  entry.status === "Approved"
                                    ? "bg-green-100 text-green-600"
                                    : entry.status === "Rejected"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-amber-100 text-amber-600"
                                )}
                              >
                                {entry.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <MotionButton
                                variant="ghost"
                                size="sm"
                                motion="subtle"
                              >
                                Edit
                              </MotionButton>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <GlassCard className="p-8">
                <h3 className="text-xl font-medium mb-6">Time Summary</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-muted-foreground font-medium mb-4">
                      Hours by Project
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            Modern Loft Redesign
                          </span>
                          <span>6.5 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: "65%" }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            Coastal Vacation Home
                          </span>
                          <span>4.0 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: "40%" }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            Corporate Office Revamp
                          </span>
                          <span>1.5 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: "15%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-muted-foreground font-medium mb-4">
                      Hours by User
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Alex Jones</span>
                          <span>9.5 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: "79%" }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Sarah Smith</span>
                          <span>1.0 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: "8%" }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Robert Lee</span>
                          <span>1.5 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: "13%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-muted-foreground font-medium mb-4">
                    Billable vs. Non-Billable
                  </h4>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-8 border-primary flex items-center justify-center font-medium text-lg">
                      83%
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Billable</span>
                          <span>10.0 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: "83%" }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Non-Billable</span>
                          <span>2.0 hrs</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400 rounded-full"
                            style={{ width: "17%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* New Time Entry Form */}
        <div className="animate-fade-in animation-delay-[0.3s]">
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium mb-4">Add New Time Entry</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Project
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={newTimeEntry.projectId || ""}
                    onChange={(e) =>
                      setNewTimeEntry((prev) => ({
                        ...prev,
                        projectId: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Task
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={newTimeEntry.taskId || ""}
                    onChange={(e) =>
                      setNewTimeEntry((prev) => ({
                        ...prev,
                        taskId: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">Select Task</option>
                    {tasks
                      .filter(
                        (task) =>
                          !newTimeEntry.projectId ||
                          task.project?.id === newTimeEntry.projectId
                      )
                      .map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newTimeEntry.date || ""}
                  onChange={(e) =>
                    setNewTimeEntry((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newTimeEntry.startTimeInput || ""}
                  onChange={(e) =>
                    setNewTimeEntry((prev) => ({
                      ...prev,
                      startTimeInput: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newTimeEntry.endTimeInput || ""}
                  onChange={(e) =>
                    setNewTimeEntry((prev) => ({
                      ...prev,
                      endTimeInput: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="0.0"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newTimeEntry.duration || ""}
                  onChange={(e) =>
                    setNewTimeEntry((prev) => ({
                      ...prev,
                      duration: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="What are you working on?"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={newTimeEntry.description || ""}
                onChange={(e) =>
                  setNewTimeEntry((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center mt-4 space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={newTimeEntry.isBillable || false}
                  onChange={(e) =>
                    setNewTimeEntry((prev) => ({
                      ...prev,
                      isBillable: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm">Billable</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newTimeEntry.hourlyRate || ""}
                  onChange={(e) =>
                    setNewTimeEntry((prev) => ({
                      ...prev,
                      hourlyRate: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {!isTimerRunning && (
                <MotionButton
                  variant="outline"
                  motion="subtle"
                  onClick={handleStartTimer}
                >
                  <Play size={16} className="mr-2" /> Start Timer
                </MotionButton>
              )}
              <MotionButton
                variant="default"
                motion="subtle"
                onClick={handleCreateTimeEntry}
              >
                <Plus size={16} className="mr-2" /> Add Time Entry
              </MotionButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
};

export default TimeTracking;
