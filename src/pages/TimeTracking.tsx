
import React, { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import ActionButton from "@/components/ui/ActionButton";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
  Trash2,
  Pencil,
  ArrowUpDown,
} from "lucide-react";
import { RiArrowUpDownLine } from "@remixicon/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  fetchTimeEntrySummary,
  deleteTimeEntry,
  updateTimeEntryStatus,
  selectAllTimeEntries,
  selectTimeTrackingLoading,
  selectTimeTrackingError,
  selectTimeTrackingPagination,
  selectTimeEntrySummary,
  CreateTimeEntryData,
  UpdateTimeEntryData,
  StartTimerData,
  TimeEntryStatus,
} from "@/redux/slices/timeTrackingSlice";
import { useTimer } from "@/hooks/useTimer";
import { TimerConflictModal } from "@/components/timer/TimerConflictModal";
import { fetchProjects, selectAllProjects } from "@/redux/slices/projectsSlice";
import {
  fetchParentTasksByCompany,
  fetchParentTasksByProject,
  selectParentTasks,
  selectParentProjectTasks,
  Task,
} from "@/redux/slices/tasksSlice";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { convertToDecimalDuration } from "@/lib/timeUtils";
import usePermission from "@/hooks/usePermission";
import * as yup from 'yup';

const TimeTracking = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Redux selectors
  const timeEntries = useAppSelector(selectAllTimeEntries);
  const projects = useAppSelector(selectAllProjects);
  const tasks: Task[] = useAppSelector(selectParentTasks);
  const projectTasks: Task[] = useAppSelector(selectParentProjectTasks);
  const currentUser = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector(selectTimeTrackingLoading);
  const error = useAppSelector(selectTimeTrackingError);
  const pagination = useAppSelector(selectTimeTrackingPagination);
  const {hasPermission} = usePermission();
  
  // Use the timer hook
  const {
    isTimerRunning,
    runningTimeEntry,
    activeTimer,
    formatElapsedTime,
    handleStartTimer,
    handleStopTimer,
    handleStopAndStartNew,
    handleContinueCurrentTimer,
    isTimerForTask,
    isConflictModalOpen,
    pendingTimerData,
    setIsConflictModalOpen,
  } = useTimer();

  // Yup validation schema for new time entry
  const newTimeEntryValidationSchema = yup.object().shape({
    hours: yup.number().required('Hours is required').min(0, 'Hours must be 0 or greater').max(23, 'Hours cannot exceed 23'),
    minutes: yup.number().required('Minutes is required').min(0, 'Minutes must be 0 or greater').max(59, 'Minutes cannot exceed 59'),
    date: yup.string().required('Date is required'),
    projectId: yup.string().required('Project is required'),
    taskId: yup.string().required('Task is required'),
    status: yup.string().required('Status is required'),
    description: yup.string().optional(),
    isBillable: yup.boolean().optional(),
    hourlyRate: yup.number().optional().min(0, 'Hourly rate must be positive')
  }).test('duration-not-zero', 'Duration must be greater than 0', function(values) {
    const { hours, minutes } = values;
    if ((hours || 0) === 0 && (minutes || 0) === 0) {
      return this.createError({
        path: 'hours',
        message: 'Total duration must be greater than 0 minutes'
      });
    }
    return true;
  });

  // Yup validation schema for timer form
  const timerValidationSchema = yup.object().shape({
    projectId: yup.string().required('Project is required'),
    taskId: yup.string().optional(),
    description: yup.string().optional(),
    hourlyRate: yup.number().optional().min(0, 'Hourly rate must be positive'),
    isBillable: yup.boolean().optional()
  });

  // Local state
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<
    Partial<UpdateTimeEntryData & { startTimeInput?: string; endTimeInput?: string; taskId?: string; projectId?: string }>
  >({});
  
  // Timer modal state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timerFormData, setTimerFormData] = useState<
    Partial<StartTimerData>
  >({
    isBillable: true,
  });
  
  // New Time Entry modal state
  const [isNewTimeEntryModalOpen, setIsNewTimeEntryModalOpen] = useState(false);
  const [newTimeEntryFormData, setNewTimeEntryFormData] = useState<
    Partial<CreateTimeEntryData & { hours?: number; minutes?: number; status?: string }>
  >({
    date: new Date().toISOString().split('T')[0],
    isBillable: true,
    hours: 0,
    minutes: 0,
    status: 'TO_DO',
  });
  const [newTimeEntryErrors, setNewTimeEntryErrors] = useState<Record<string, string>>({});
  const [timerErrors, setTimerErrors] = useState<Record<string, string>>({});
  
  // Stop confirmation dialog state
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [pendingStopData, setPendingStopData] = useState<any>(null);
  const [stoppedElapsedTime, setStoppedElapsedTime] = useState<number>(0);
  
  // Custom date range state
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);

  // Helper functions for date ranges
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedTimeRange) {
      case "today":
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        };
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString()
        };
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString()
        };
      case "custom":
         if (customDateRange?.from && customDateRange?.to) {
           const startDate = new Date(customDateRange.from);
           const endDate = new Date(customDateRange.to);
           endDate.setHours(23, 59, 59, 999);
           return {
             startDate: startDate.toISOString(),
             endDate: endDate.toISOString()
           };
         }
         return {};
      case "all":
        return {}; // No date filters - show all entries
      default:
        return {};
    }
  };

  // Load data on component mount
  useEffect(() => {
    const dateRange = getDateRange();
    dispatch(fetchTimeEntries(dateRange));
    dispatch(fetchProjects());
    dispatch(fetchTimeEntrySummary(dateRange));
  }, [dispatch]);

  // Fetch project tasks when timer form project changes
  useEffect(() => {
    if (timerFormData.projectId) {
      dispatch(fetchParentTasksByProject(timerFormData.projectId));
    }
  }, [timerFormData.projectId, dispatch]);

  // Fetch project tasks when new time entry form project changes
  useEffect(() => {
    if (newTimeEntryFormData.projectId) {
      dispatch(fetchParentTasksByProject(newTimeEntryFormData.projectId));
    }
  }, [newTimeEntryFormData.projectId, dispatch]);

  // Fetch project tasks when edit form project changes
  useEffect(() => {
    if (editFormData.projectId) {
      dispatch(fetchParentTasksByProject(editFormData.projectId));
    }
  }, [editFormData.projectId, dispatch]);

  // Fetch project tasks when new time entry (legacy form) project changes
  useEffect(() => {
    if (newTimeEntry.projectId) {
      dispatch(fetchParentTasksByProject(newTimeEntry.projectId));
    }
  }, [newTimeEntry.projectId, dispatch]);
  
  // Fetch data when time range changes
  useEffect(() => {
    const dateRange = getDateRange();
    if (selectedTimeRange === "all" || selectedTimeRange !== "custom" || (customDateRange?.from && customDateRange?.to)) {
      dispatch(fetchTimeEntries(dateRange));
      dispatch(fetchTimeEntrySummary(dateRange));
    }
  }, [selectedTimeRange, customDateRange, dispatch]);
  


  // Calculate total hours for the selected time range
  const totalHours =
    timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0); // Duration is already in hours
  const billableHours =
    timeEntries
      .filter((entry) => entry.isBillable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);



  // Helper function to format duration from decimal hours to readable format
  const formatDuration = (durationInHours: number) => {
    if (!durationInHours || durationInHours === 0) return "0 minutes";
    const hours = Math.floor(durationInHours);
    const minutes = Math.round((durationInHours - hours) * 60);
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  // Filter time entries
  let filteredEntries = timeEntries.filter((entry) => {
    switch (filter) {
      case "billable":
        return entry.isBillable;
      case "nonbillable":
        return !entry.isBillable;
      case "pending":
        return entry.status === "To Do";
      default:
        return true;
    }
  });
  
  // Apply sorting
  if (sortConfig) {
    filteredEntries = [...filteredEntries].sort((a, b) => {
      let aValue = '';
      let bValue = '';
      switch (sortConfig.key) {
        case 'date':
          aValue = a.date || '';
          bValue = b.date || '';
          break;
        case 'project':
          aValue = a.project?.name?.toLowerCase() || '';
          bValue = b.project?.name?.toLowerCase() || '';
          break;
        case 'task':
          aValue = a.task?.title?.toLowerCase() || '';
          bValue = b.task?.title?.toLowerCase() || '';
          break;
        case 'user':
          aValue = a.user ? `${a.user.firstName} ${a.user.lastName}`.toLowerCase() : '';
          bValue = b.user ? `${b.user.firstName} ${b.user.lastName}`.toLowerCase() : '';
          break;
        default:
          return 0;
      }
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };



  // Handle timer actions
  const handleStartTimerModal = () => {
    setIsTimerModalOpen(true);
  };
  
  const validateTimerForm = async (): Promise<boolean> => {
    try {
      await timerValidationSchema.validate(timerFormData, { abortEarly: false });
      setTimerErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        setTimerErrors(errors);
      }
      return false;
    }
  };

  const handleStartTimerSubmit = async () => {
    const isValid = await validateTimerForm();
    if (!isValid) {
      return;
    }

    const timerData: StartTimerData = {
      projectId: timerFormData.projectId,
      taskId: timerFormData.taskId,
      description: timerFormData.description,
      isBillable: timerFormData.isBillable ?? true,
      hourlyRate: timerFormData.hourlyRate,
    };

    try {
      await handleStartTimer(timerData);
      setIsTimerModalOpen(false);
      setTimerFormData({ isBillable: true });
      setTimerErrors({});
      // Refresh time entries to get the new running entry
      dispatch(fetchTimeEntries({}));
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleStopTimerButton = async () => {
    if (!runningTimeEntry?.id) {
      toast({
        title: "Error",
        description: "No active timer found. Please start a timer first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Stop the timer first
      const stopData = {
        timeEntryId: runningTimeEntry.id,
        description: runningTimeEntry.description,
        isBillable: runningTimeEntry.isBillable,
        hourlyRate: runningTimeEntry.hourlyRate
      };
      
      await handleStopTimer(stopData);
      
      // Store the stop data and show confirmation dialog for saving
      setPendingStopData(stopData);
      setIsStopConfirmOpen(true);
      
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const confirmStopTimer = async () => {
    if (!pendingStopData) return;

    try {
      toast({
        title: "Timer Stopped",
        description: "Time entry has been saved",
      });
      // Refresh time entries to show the completed entry
      dispatch(fetchTimeEntries({}));
      dispatch(fetchTimeEntrySummary({}));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
    } finally {
      setIsStopConfirmOpen(false);
      setPendingStopData(null);
      setStoppedElapsedTime(0);
    }
  };

  const cancelStopTimer = async () => {
    if (!pendingStopData?.timeEntryId) {
      setIsStopConfirmOpen(false);
      setPendingStopData(null);
      setStoppedElapsedTime(0);
      return;
    }

    try {
      // Delete the time entry that was created when timer was stopped
      await dispatch(deleteTimeEntry(pendingStopData.timeEntryId)).unwrap();
      toast({
        title: "Time Entry Discarded",
        description: "The time entry has been discarded",
      });
      // Refresh time entries
      dispatch(fetchTimeEntries({}));
      dispatch(fetchTimeEntrySummary({}));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discard time entry",
        variant: "destructive",
      });
    } finally {
      setIsStopConfirmOpen(false);
      setPendingStopData(null);
      setStoppedElapsedTime(0);
    }
  };

  // Handle new time entry modal
  const handleNewTimeEntry = () => {
    setIsNewTimeEntryModalOpen(true);
  };

  const validateNewTimeEntry = async (): Promise<boolean> => {
    try {
      await newTimeEntryValidationSchema.validate(newTimeEntryFormData, { abortEarly: false });
      setNewTimeEntryErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        setNewTimeEntryErrors(errors);
      }
      return false;
    }
  };

  const handleNewTimeEntrySubmit = async () => {
    const isValid = await validateNewTimeEntry();
    if (!isValid) {
      return;
    }

    const hours = newTimeEntryFormData.hours || 0;
    const minutes = newTimeEntryFormData.minutes || 0;

    try {
      const duration = convertToDecimalDuration(hours, minutes);
      
      const timeEntryData: CreateTimeEntryData = {
        projectId: newTimeEntryFormData.projectId!,
        taskId: newTimeEntryFormData.taskId!,
        date: newTimeEntryFormData.date!,
        duration,
        description: newTimeEntryFormData.description,
        isBillable: newTimeEntryFormData.isBillable ?? true,
        hourlyRate: newTimeEntryFormData.hourlyRate,
        status: newTimeEntryFormData.status,
      };

      await dispatch(createTimeEntry(timeEntryData)).unwrap();
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
      
      setIsNewTimeEntryModalOpen(false);
      setNewTimeEntryFormData({
        date: new Date().toISOString().split('T')[0],
        isBillable: true,
        hours: 0,
        minutes: 0,
        status: 'TO_DO',
      });
      setNewTimeEntryErrors({});
      
      // Refresh time entries
      dispatch(fetchTimeEntries({}));
      dispatch(fetchTimeEntrySummary({}));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create time entry",
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
        status: 'DONE',
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

  const handleDeleteTimeEntry = async (entryId: string) => {
    try {
      await dispatch(deleteTimeEntry(entryId)).unwrap();
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
      // Refresh the time entries list
      dispatch(fetchTimeEntries({}));
      dispatch(fetchTimeEntrySummary({}));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (entryId: string, newStatus: string) => {
    try {
      const apiStatus: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' = newStatus === 'To Do' ? 'TO_DO' : 
                      newStatus === 'In Progress' ? 'IN_PROGRESS' : 
                      newStatus === 'In Review' ? 'IN_REVIEW' : 'DONE';
      
      await dispatch(updateTimeEntryStatus({ id: entryId, status: apiStatus })).unwrap();
      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
      });
      // Refresh the time entries list and summary
      dispatch(fetchTimeEntries({}));
      dispatch(fetchTimeEntrySummary({}));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEditFormData({
      description: entry.description || '',
      date: entry.date || '',
      startTimeInput: entry.startTime || '',
      endTimeInput: entry.endTime || '',
      duration: entry.duration || 0,
      isBillable: entry.isBillable || false,
      hourlyRate: entry.hourlyRate || 0,
      taskId: entry.task?.id || '',
      projectId: entry.project?.id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateTimeEntry = async () => {
    if (!editingEntry?.id) return;

    try {
      // Calculate duration from start/end times if not provided
      let calculatedDuration = editFormData.duration;
      if (
        !calculatedDuration &&
        editFormData.startTimeInput &&
        editFormData.endTimeInput
      ) {
        const [startHour, startMin] = editFormData.startTimeInput
          .split(":")
          .map(Number);
        const [endHour, endMin] = editFormData.endTimeInput
          .split(":")
          .map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        calculatedDuration = (endMinutes - startMinutes) / 60; // Convert to hours
      }

      const updateData: UpdateTimeEntryData = {
        description: editFormData.description,
        date: editFormData.date,
        startTime: editFormData.startTimeInput,
        endTime: editFormData.endTimeInput,
        duration: calculatedDuration,
        isBillable: editFormData.isBillable,
        hourlyRate: editFormData.hourlyRate,
        projectId: editFormData.projectId,
        taskId: editFormData.taskId,
      };

      await dispatch(updateTimeEntry({ id: editingEntry.id, data: updateData })).unwrap();
      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
      setIsEditModalOpen(false);
      setEditingEntry(null);
      setEditFormData({});
      // Refresh the time entries list and summary
      dispatch(fetchTimeEntries({}));
      dispatch(fetchTimeEntrySummary({}));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchTimeEntries({ page, limit: pagination.limit }));
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
            {/* <ActionButton
              variant="secondary"
              motion="subtle"
              leftIcon={<Download size={16} className="mr-2" />}
              text="Export"
            /> */}
            {hasPermission('time_tracking', 'create') && (
              <ActionButton
                variant="primary"
                motion="subtle"
                leftIcon={<Plus size={16} className="mr-2" />}
                text="New Time Entry"
                onClick={handleNewTimeEntry}
              />
            )}
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
                    {runningTimeEntry.task?.title || runningTimeEntry.description || "No description"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {runningTimeEntry.project?.name || "No project/task"}
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
                {isTimerRunning
                  ? formatElapsedTime()
                  : "00:00:00"}
              </div>

              {hasPermission('time_tracking', 'create') && (
                <MotionButton
                  variant={isTimerRunning ? "outline" : "default"}
                  size="icon"
                  motion="subtle"
                  onClick={isTimerRunning ? handleStopTimerButton : handleStartTimerModal}
                >
                  {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                </MotionButton>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in animation-delay-[0.1s]">
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-primary/10">
                <Clock size={16} className="text-primary sm:size-5" />
              </div>
              <h3 className="text-muted-foreground font-medium text-xs sm:text-sm">
                Total Hours
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-light">{formatDuration(totalHours)}</p>
            <div className="mt-2 text-xs sm:text-sm">
              <span className="text-green-600 font-medium">↑ 12%</span> from
              last {selectedTimeRange}
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-primary/10">
                <Hourglass size={16} className="text-primary sm:size-5" />
              </div>
              <h3 className="text-muted-foreground font-medium text-xs sm:text-sm">
                Billable Hours
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-light">{formatDuration(billableHours)}</p>
            <div className="mt-2 text-xs sm:text-sm">
              <span className="text-green-600 font-medium">↑ 8%</span> from last{" "}
              {selectedTimeRange}
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-primary/10">
                <FileText size={16} className="text-primary sm:size-5" />
              </div>
              <h3 className="text-muted-foreground font-medium text-xs sm:text-sm">
                Tracked Projects
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-light">3</p>
            <div className="mt-2 text-xs sm:text-sm">
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
                  onClick={() => setSelectedTimeRange("all")}
                  className={cn(
                    selectedTimeRange === "all" &&
                      "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  All
                </MotionButton>
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
                <Popover open={isCustomDatePickerOpen} onOpenChange={setIsCustomDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <MotionButton
                      variant="outline"
                      size="sm"
                      motion="subtle"
                      onClick={() => {
                        setSelectedTimeRange("custom");
                        setIsCustomDatePickerOpen(true);
                      }}
                      className={cn(
                        selectedTimeRange === "custom" &&
                          "bg-primary/10 text-primary border-primary/30"
                      )}
                    >
                      <Calendar size={16} className="mr-1" />
                      {customDateRange?.from && customDateRange?.to
                         ? `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`
                         : "Custom"}
                    </MotionButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      defaultMonth={customDateRange?.from || new Date()}
                      selected={customDateRange}
                      onSelect={(range: DateRange | undefined) => {
                        setCustomDateRange(range);
                        if (range?.from && range?.to) {
                          setIsCustomDatePickerOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <TabsContent value="entries" className="mt-0">
              <GlassCard>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 sm:p-4 gap-3 border-b border-border">
                  <div className="text-base sm:text-lg font-medium">Recent Time Entries</div>

                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <button
                      onClick={() => setFilter("all")}
                      className={cn(
                        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors",
                        filter === "all"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Filter size={12} className="sm:size-4" />
                      <span>All</span>
                    </button>
                    <button
                      onClick={() => setFilter("billable")}
                      className={cn(
                        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors",
                        filter === "billable"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Hourglass size={12} className="sm:size-4" />
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
                      <span>To Do</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:table-fixed">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left p-4 font-medium text-muted-foreground w-20 sm:w-24 md:w-28">
                          <button
                            onClick={() => handleSort('date')}
                            className="text-left p-0 font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                          >
                            Date
                            <RiArrowUpDownLine size={14} />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
                          <button
                            onClick={() => handleSort('project')}
                            className="text-left p-0 font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                          >
                            Project
                            <RiArrowUpDownLine size={14} />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground w-full sm:w-1/3 md:w-1/4 lg:w-1/5">
                          <button
                            onClick={() => handleSort('task')}
                            className="text-left p-0 font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                          >
                            Task
                            <RiArrowUpDownLine size={14} />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground w-24 sm:w-28 md:w-32">
                          <button
                            onClick={() => handleSort('user')}
                            className="text-left p-0 font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                          >
                            User
                            <RiArrowUpDownLine size={14} />
                          </button>
                        </th>
                        <th className="text-right p-4 font-medium text-muted-foreground w-16 sm:w-18 md:w-20">
                          Hours
                        </th>
                        <th className="text-right p-4 font-medium text-muted-foreground w-20 sm:w-22 md:w-24">
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
                            <td className="p-4 font-medium max-w-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span 
                                      className="cursor-pointer"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: '1.4em',
                                        maxHeight: '4.2em'
                                      }}
                                    >
                                      {entry.project?.name || "No project"}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start" className="max-w-xs">
                                     <p>{entry.project?.name || "No project"}</p>
                                   </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="p-4 max-w-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span 
                                      className="cursor-pointer"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: '1.4em',
                                        maxHeight: '4.2em'
                                      }}
                                    >
                                      {entry.task?.title || "No task"}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start" className="max-w-xs">
                                     <p>{entry.task?.title || "No task"}</p>
                                   </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="p-4 max-w-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span 
                                      className="cursor-pointer"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: '1.3em',
                                        maxHeight: '2.6em'
                                      }}
                                    >
                                      {entry.user
                                        ? `${entry.user.firstName} ${entry.user.lastName}`
                                        : "Unknown user"}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start" className="max-w-xs">
                                     <p>{entry.user
                                       ? `${entry.user.firstName} ${entry.user.lastName}`
                                       : "Unknown user"}</p>
                                   </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="p-4 text-right tabular-nums">
                              {formatDuration(entry.duration || 0)}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <MotionButton
                                  variant="ghost"
                                  size="sm"
                                  motion="subtle"
                                  onClick={() => handleEditEntry(entry)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Pencil size={16} />
                                </MotionButton>
                                <MotionButton
                                  variant="ghost"
                                  size="sm"
                                  motion="subtle"
                                  onClick={() => handleDeleteTimeEntry(entry.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </MotionButton>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pageNum === pagination.page}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <GlassCard className="p-8">
                <h3 className="text-xl font-medium mb-6">Time Summary Comming Soon ...</h3>

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                          <span>6 hours 30 minutes</span>
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
                          <span>4 hours</span>
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
                          <span>1 hour 30 minutes</span>
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
                          <span>9 hours 30 minutes</span>
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
                          <span>1 hour</span>
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
                          <span>1 hour 30 minutes</span>
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
                          <span>10 hours</span>
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
                          <span>2 hours</span>
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
                </div> */}
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* New Time Entry Form */}
        {hasPermission('time_tracking', 'create') && (
          <div className="animate-fade-in animation-delay-[0.3s]">
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-4">Add New Time Entry</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={newTimeEntry.projectId || ""}
                    onChange={(e) =>
                      setNewTimeEntry((prev) => ({
                        ...prev,
                        projectId: e.target.value || undefined,
                        taskId: undefined,
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
                  Task <span className="text-red-500">*</span>
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
                    {projectTasks.map((task) => (
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
                  Date <span className="text-red-500">*</span>
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
                  Start Time <span className="text-red-500">*</span>
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
                  End Time <span className="text-red-500">*</span>
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
                  Hourly Rate (AED)
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
                <ActionButton
                  variant="secondary"
                  motion="subtle"
                  leftIcon={<Play size={16} className="mr-2" />}
                  text="Start Timer"
                  onClick={handleStartTimerModal}
                >
                </ActionButton>
              )}
              <ActionButton
                variant="primary"
                motion="subtle"
                onClick={handleCreateTimeEntry}
                leftIcon={<Plus size={16} className="mr-2" />}
                text="Add Time Entry"
              >
              </ActionButton>
            </div>
          </GlassCard>
        </div>
        )}
      </div>

      {/* Edit Time Entry Modal */}
      {hasPermission('time_tracking', 'update') && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="w-5/6 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Time Entry</DialogTitle>
              <DialogDescription>
                Modify the details of your time entry.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="What did you work on?"
                value={editFormData.description || ''}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date || ''}
                onChange={(e) => handleEditFormChange('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project">Project</Label>
              <Select
                value={editFormData.projectId || ''}
                onValueChange={(value) => {
                  handleEditFormChange('projectId', value);
                  handleEditFormChange('taskId', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task">Task</Label>
              <Select
                value={editFormData.taskId || ''}
                onValueChange={(value) => handleEditFormChange('taskId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time</Label>
              <Input
                id="edit-start-time"
                type="time"
                value={editFormData.startTimeInput || ''}
                onChange={(e) => handleEditFormChange('startTimeInput', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time</Label>
              <Input
                id="edit-end-time"
                type="time"
                value={editFormData.endTimeInput || ''}
                onChange={(e) => handleEditFormChange('endTimeInput', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (hours)</Label>
              <Input
                id="edit-duration"
                type="number"
                step="0.25"
                min="0"
                placeholder="0.0"
                value={editFormData.duration || ''}
                onChange={(e) => handleEditFormChange('duration', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-hourly-rate">Hourly Rate</Label>
              <Input
                id="edit-hourly-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={editFormData.hourlyRate || ''}
                onChange={(e) => handleEditFormChange('hourlyRate', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                id="edit-billable"
                type="checkbox"
                checked={editFormData.isBillable || false}
                onChange={(e) => handleEditFormChange('isBillable', e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="edit-billable">Billable</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <ActionButton
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              motion="subtle"
              text="Cancel"
            />
            <ActionButton
              variant="primary"
              onClick={handleUpdateTimeEntry}
              motion="subtle"
              text="Update Entry"
            />
          </div>
        </DialogContent>
      </Dialog>
      )}
      {/* Timer Start Modal */}
      {hasPermission('time_tracking', 'create') && (
        <Dialog open={isTimerModalOpen} onOpenChange={setIsTimerModalOpen}>
        <DialogContent className="w-5/6 md:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start Timer</DialogTitle>
            <DialogDescription>
              Start tracking time for a project or task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="timer-project">Project <span className="text-red-500">*</span></Label>
              <Select
                value={timerFormData.projectId || ''}
                onValueChange={(value) => setTimerFormData(prev => ({ ...prev, projectId: value, taskId: undefined }))}
              >
                <SelectTrigger className={timerErrors.projectId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {timerErrors.projectId && (
                <p className="text-sm text-red-500">{timerErrors.projectId}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timer-task">Task</Label>
              <Select
                value={timerFormData.taskId || ''}
                onValueChange={(value) => setTimerFormData(prev => ({ ...prev, taskId: value }))}
              >
                <SelectTrigger className={timerErrors.taskId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {timerErrors.taskId && (
                <p className="text-sm text-red-500">{timerErrors.taskId}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timer-description">Description</Label>
              <Textarea
                id="timer-description"
                placeholder="What are you working on?"
                value={timerFormData.description || ''}
                onChange={(e) => setTimerFormData(prev => ({ ...prev, description: e.target.value }))}
                className={timerErrors.description ? 'border-red-500' : ''}
                rows={3}
              />
              {timerErrors.description && (
                <p className="text-sm text-red-500">{timerErrors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timer-hourly-rate">Hourly Rate</Label>
              <Input
                id="timer-hourly-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={timerFormData.hourlyRate || ''}
                onChange={(e) => setTimerFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || undefined }))}
                className={timerErrors.hourlyRate ? 'border-red-500' : ''}
              />
              {timerErrors.hourlyRate && (
                <p className="text-sm text-red-500">{timerErrors.hourlyRate}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="timer-billable"
                type="checkbox"
                checked={timerFormData.isBillable || false}
                onChange={(e) => setTimerFormData(prev => ({ ...prev, isBillable: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="timer-billable">Billable</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => setIsTimerModalOpen(false)}
              motion="subtle"
              text="Cancel"
            />
            <ActionButton
              variant="primary"
              onClick={handleStartTimerSubmit}
              motion="subtle"
              text="Start Timer"
              leftIcon={<Play size={16} />}
              className="bg-green-600 hover:bg-green-700"
            />
          </div>
        </DialogContent>
      </Dialog>
      )}
      
      {/* Stop Timer Confirmation Dialog */}
      <Dialog open={isStopConfirmOpen} onOpenChange={setIsStopConfirmOpen}>
        <DialogContent className="w-5/6 md:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Timer Stopped</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              The timer has been stopped. Would you like to save or discard this time entry?
            </p>
            
            {pendingStopData && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Duration:</span> {formatElapsedTime(stoppedElapsedTime)}
                </div>
                {pendingStopData.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span> {pendingStopData.description}
                  </div>
                )}
                {runningTimeEntry?.task && (
                  <div className="text-sm">
                    <span className="font-medium">Task:</span> {runningTimeEntry.task.title}
                  </div>
                )}
                {runningTimeEntry?.project && (
                  <div className="text-sm">
                    <span className="font-medium">Project:</span> {runningTimeEntry.project.name}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <ActionButton
              variant="secondary"
              onClick={cancelStopTimer}
              text="Discard"
            />
            <ActionButton
              onClick={confirmStopTimer}
              variant="primary"
              text="Save Entry"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* New Time Entry Modal */}
      {hasPermission('time_tracking', 'create') && (
        <Dialog open={isNewTimeEntryModalOpen} onOpenChange={setIsNewTimeEntryModalOpen}>
        <DialogContent className="w-5/6 sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Time Entry</DialogTitle>
            <DialogDescription>
              Create a new time entry for a project and task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-3">
            {/* Hours and Minutes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="hours" className="text-sm">Hours <span className="text-red-500">*</span></Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  placeholder="0"
                  className={`h-9 ${newTimeEntryErrors.hours ? 'border-red-500' : ''}`}
                  value={newTimeEntryFormData.hours || ''}
                  onChange={(e) => setNewTimeEntryFormData(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                />
                {newTimeEntryErrors.hours && (
                  <p className="text-sm text-red-500">{newTimeEntryErrors.hours}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="minutes" className="text-sm">Minutes <span className="text-red-500">*</span></Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  className={`h-9 ${newTimeEntryErrors.minutes ? 'border-red-500' : ''}`}
                  value={newTimeEntryFormData.minutes || ''}
                  onChange={(e) => setNewTimeEntryFormData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                />
                {newTimeEntryErrors.minutes && (
                  <p className="text-sm text-red-500">{newTimeEntryErrors.minutes}</p>
                )}
              </div>
            </div>
            
            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="date" className="text-sm">Date <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                className={`h-9 ${newTimeEntryErrors.date ? 'border-red-500' : ''}`}
                value={newTimeEntryFormData.date || ''}
                onChange={(e) => setNewTimeEntryFormData(prev => ({ ...prev, date: e.target.value }))}
              />
              {newTimeEntryErrors.date && (
                <p className="text-sm text-red-500">{newTimeEntryErrors.date}</p>
              )}
            </div>
            
            {/* Project */}
            <div className="space-y-1">
              <Label htmlFor="project" className="text-sm">Project <span className="text-red-500">*</span></Label>
              <Select
                value={newTimeEntryFormData.projectId || ''}
                onValueChange={(value) => setNewTimeEntryFormData(prev => ({ ...prev, projectId: value, taskId: undefined }))}
              >
                <SelectTrigger className={`h-9 ${newTimeEntryErrors.projectId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newTimeEntryErrors.projectId && (
                <p className="text-sm text-red-500">{newTimeEntryErrors.projectId}</p>
              )}
            </div>
            
            {/* Task */}
            <div className="space-y-1">
              <Label htmlFor="task" className="text-sm">Task <span className="text-red-500">*</span></Label>
              <Select
                value={newTimeEntryFormData.taskId || ''}
                onValueChange={(value) => setNewTimeEntryFormData(prev => ({ ...prev, taskId: value }))}
                disabled={!newTimeEntryFormData.projectId}
              >
                <SelectTrigger className={`h-9 ${newTimeEntryErrors.taskId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newTimeEntryErrors.taskId && (
                <p className="text-sm text-red-500">{newTimeEntryErrors.taskId}</p>
              )}
            </div>
            
            {/* Status */}
            <div className="space-y-1">
              <Label htmlFor="status" className="text-sm">Status <span className="text-red-500">*</span></Label>
              <Select
                value={newTimeEntryFormData.status || ''}
                onValueChange={(value) => setNewTimeEntryFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className={`h-9 ${newTimeEntryErrors.status ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_DO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
              {newTimeEntryErrors.status && (
                <p className="text-sm text-red-500">{newTimeEntryErrors.status}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm">Note</Label>
              <Textarea
                id="description"
                placeholder="Add a note..."
                value={newTimeEntryFormData.description || ''}
                onChange={(e) => setNewTimeEntryFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => setIsNewTimeEntryModalOpen(false)}
              motion="subtle"
              text="Cancel"
            />
            <ActionButton
              variant="primary"
              onClick={handleNewTimeEntrySubmit}
              motion="subtle"
              text="Save Entry"
            />
          </div>
        </DialogContent>
      </Dialog>
      )}
      
      {/* Timer Conflict Modal */}
      <TimerConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onStopAndStart={handleStopAndStartNew}
        onContinueCurrent={handleContinueCurrentTimer}
        currentTask={runningTimeEntry?.task ? {
          title: runningTimeEntry.task.title,
          project: runningTimeEntry.project,
        } : undefined}
        newTask={pendingTimerData ? {
          title: pendingTimerData.description || "New Timer",
          project: { name: "Selected Project" },
        } : undefined}
        elapsedTime={formatElapsedTime()}
      />
    </PageContainer>
  );
};

export default TimeTracking;
