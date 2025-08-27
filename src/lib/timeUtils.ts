/**
 * Utility functions for time-related operations
 */

/**
 * Converts hours and minutes to decimal duration
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @returns Decimal duration (e.g., 8.5 for 8 hours 30 minutes)
 */
export const convertToDecimalDuration = (hours: number, minutes: number): number => {
  return hours + (minutes / 60);
};

/**
 * Converts decimal duration to hours and minutes
 * @param duration - Decimal duration (e.g., 8.5)
 * @returns Object with hours and minutes
 */
export const convertFromDecimalDuration = (duration: number): { hours: number; minutes: number } => {
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  return { hours, minutes };
};

/**
 * Formats decimal duration to readable string
 * @param duration - Decimal duration
 * @returns Formatted string (e.g., "8h 30m")
 */
export const formatDuration = (duration: number): string => {
  const { hours, minutes } = convertFromDecimalDuration(duration);
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

/**
 * Validates time input format (HH:MM)
 * @param timeString - Time string to validate
 * @returns Boolean indicating if format is valid
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Calculates duration between start and end time
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in decimal hours
 */
export const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return 0;
  }

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  // Handle overnight shifts
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }

  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return durationMinutes / 60;
};