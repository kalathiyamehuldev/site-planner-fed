// Utility functions for project calculations

/**
 * Calculate project progress based on task completion
 * Logic:
 * - If a parent task has subtasks, consider only the subtasks for progress
 * - If a parent task has no subtasks, consider the parent task itself
 * - Progress = (completed tasks / total relevant tasks) * 100
 */
export const calculateProjectProgress = (tasks: any[]): number => {
  if (!tasks || tasks.length === 0) return 0;
  
  // Separate parent tasks and subtasks
  const parentTasks = tasks.filter(task => !task.parentId);
  const subtasks = tasks.filter(task => task.parentId);
  
  // Create a set of parent task IDs that have subtasks
  const parentTasksWithSubtasks = new Set(subtasks.map(subtask => subtask.parentId));
  
  // Determine which tasks to consider for progress calculation
  const tasksToConsider = getTasksForProgressCalculation(parentTasks, subtasks, parentTasksWithSubtasks);
  
  if (tasksToConsider.length === 0) return 0;
  
  const completedTasks = tasksToConsider.filter(task => task.status === 'DONE').length;
  const progress = Math.round((completedTasks / tasksToConsider.length) * 100);
  
  return progress;
};

/**
 * Helper function to determine which tasks should be considered for progress calculation
 */
const getTasksForProgressCalculation = (
  parentTasks: any[], 
  subtasks: any[], 
  parentTasksWithSubtasks: Set<string>
): any[] => {
  const tasksToConsider: any[] = [];
  
  parentTasks.forEach(parentTask => {
    if (parentTasksWithSubtasks.has(parentTask.id)) {
      // This parent has subtasks, so include its subtasks instead of the parent
      const parentSubtasks = subtasks.filter(subtask => subtask.parentId === parentTask.id);
      tasksToConsider.push(...parentSubtasks);
    } else {
      // This parent has no subtasks, so include the parent task itself
      tasksToConsider.push(parentTask);
    }
  });
  
  return tasksToConsider;
};

/**
 * Example usage and test cases:
 * 
 * Case 1: Parent task with subtasks
 * - Parent Task A (TODO) -> Subtask A1 (DONE), Subtask A2 (TODO)
 * - Result: Consider only subtasks A1 and A2, progress = 50%
 * 
 * Case 2: Parent task without subtasks
 * - Parent Task B (DONE)
 * - Result: Consider Parent Task B, progress = 100%
 * 
 * Case 3: Mixed scenario
 * - Parent Task A (TODO) -> Subtask A1 (DONE), Subtask A2 (DONE)
 * - Parent Task B (DONE) (no subtasks)
 * - Result: Consider subtasks A1, A2, and Parent Task B, progress = 100%
 */

export const formatProjectDate = (date: string | null | undefined, fallbackDate?: string): string => {
  const dateToUse = date || fallbackDate;
  
  if (!dateToUse) return 'No date set';
  
  try {
    return new Date(dateToUse).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric",
    });
  } catch {
    return 'Invalid date';
  }
};