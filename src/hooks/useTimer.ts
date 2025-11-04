import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  startTimer,
  stopTimer,
  checkTimerStatus,
  forceStopTimer,
  selectActiveTimer,
  selectIsTimerRunning,
  selectRunningTimeEntry,
  selectFrontendStartTime,
  setFrontendStartTime,
  StartTimerData,
  StopTimerData,
} from '@/redux/slices/timeTrackingSlice';
import { useToast } from '@/hooks/use-toast';

export const useTimer = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const activeTimer = useAppSelector(selectActiveTimer);
  const isTimerRunning = useAppSelector(selectIsTimerRunning);
  const runningTimeEntry = useAppSelector(selectRunningTimeEntry);
  const frontendStartTime = useAppSelector(selectFrontendStartTime);
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingTimerData, setPendingTimerData] = useState<StartTimerData | null>(null);

  // Check timer status on mount
  useEffect(() => {
    dispatch(checkTimerStatus());
  }, [dispatch]);

  // Set frontend start time when timer starts running
  useEffect(() => {
    if (isTimerRunning && !frontendStartTime) {
      dispatch(setFrontendStartTime(Date.now()));
    } else if (!isTimerRunning && frontendStartTime) {
      dispatch(setFrontendStartTime(null));
    }
  }, [isTimerRunning, frontendStartTime, dispatch]);

  // Live timer update effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatElapsedTime = useCallback((elapsedTimeMs?: number) => {
    let elapsedMs: number;
    
    if (elapsedTimeMs !== undefined) {
      // Use provided elapsed time (for stopped timer display)
      elapsedMs = elapsedTimeMs;
    } else if (frontendStartTime) {
      // Always use frontend timer start time when available (for running timer)
      elapsedMs = currentTime - frontendStartTime;
    } else {
      // No timer running or no start time available
      elapsedMs = 0;
    }
    
    // Ensure non-negative elapsed time
    elapsedMs = Math.max(0, elapsedMs);
    
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [currentTime, frontendStartTime]);

  const handleStartTimer = useCallback(async (timerData: StartTimerData) => {
    // Check if there's already a timer running
    if (isTimerRunning) {
      // Show conflict modal
      setPendingTimerData(timerData);
      setIsConflictModalOpen(true);
      return;
    }

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
  }, [dispatch, toast, isTimerRunning]);

  const handleStopTimer = useCallback(async (stopData: StopTimerData) => {
    try {
      await dispatch(stopTimer(stopData)).unwrap();
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
  }, [dispatch, toast]);

  const handleStopAndStartNew = useCallback(async () => {
    if (!pendingTimerData || !runningTimeEntry) return;

    try {
      // Stop current timer using regular stop API (not force stop)
      await dispatch(stopTimer({
        timeEntryId: runningTimeEntry.id,
        description: runningTimeEntry.description,
        isBillable: runningTimeEntry.isBillable,
        hourlyRate: runningTimeEntry.hourlyRate,
      })).unwrap();
      
      // Start new timer
      await dispatch(startTimer(pendingTimerData)).unwrap();
      
      toast({
        title: "Timer Switched",
        description: "Previous timer stopped and new timer started",
      });
      
      setIsConflictModalOpen(false);
      setPendingTimerData(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to switch timer",
        variant: "destructive",
      });
    }
  }, [dispatch, toast, pendingTimerData, runningTimeEntry]);

  const handleContinueCurrentTimer = useCallback(() => {
    setIsConflictModalOpen(false);
    setPendingTimerData(null);
  }, []);

  const isTimerForTask = useCallback((taskId: string) => {
    return isTimerRunning && activeTimer.taskId === taskId;
  }, [isTimerRunning, activeTimer.taskId]);

  return {
    // State
    isTimerRunning,
    runningTimeEntry,
    activeTimer,
    currentTime,
    frontendStartTime,
    isConflictModalOpen,
    pendingTimerData,
    
    // Functions
    formatElapsedTime,
    handleStartTimer,
    handleStopTimer,
    handleStopAndStartNew,
    handleContinueCurrentTimer,
    isTimerForTask,
    
    // Modal controls
    setIsConflictModalOpen,
  };
};