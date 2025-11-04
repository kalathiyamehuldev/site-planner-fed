import { useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { checkTimerStatus } from '@/redux/slices/timeTrackingSlice';

/**
 * Component that handles timer synchronization across tabs and app visibility changes
 */
export const TimerSync: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check timer status on mount
    dispatch(checkTimerStatus());

    // Handle visibility change (when user switches tabs or minimizes/restores app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App became visible, sync timer state
        dispatch(checkTimerStatus());
      }
    };

    // Handle focus events (when user clicks back into the app)
    const handleFocus = () => {
      dispatch(checkTimerStatus());
    };

    // Handle page show events (when user navigates back to the page)
    const handlePageShow = (event: PageTransitionEvent) => {
      // If the page was restored from cache, sync timer state
      if (event.persisted) {
        dispatch(checkTimerStatus());
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    // Periodic sync every 30 seconds when app is visible
    const syncInterval = setInterval(() => {
      if (!document.hidden) {
        dispatch(checkTimerStatus());
      }
    }, 30000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      clearInterval(syncInterval);
    };
  }, [dispatch]);

  // This component doesn't render anything
  return null;
};