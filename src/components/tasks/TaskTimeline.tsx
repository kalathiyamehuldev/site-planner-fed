import React, { useMemo, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { selectAllTasks, type Task, fetchSubtasksByParent, selectSubtasksLoading } from '@/redux/slices/tasksSlice';
import { format, parseISO, addDays, differenceInDays, startOfDay, endOfDay, max, min, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import solar from '@solar-icons/react';
import StatusBadge from '@/components/shared/StatusBadge';

// Subtasks are standard Task items from the slice

interface TimelineTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subtasks?: Task[];
  color: string;
}

const TaskTimeline: React.FC = () => {
  const tasks = useAppSelector(selectAllTasks);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const subtasksByParent = useAppSelector((state) => state.tasks.subtasksByParentId);
  const loadingSubtasks = useAppSelector(selectSubtasksLoading);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Colors from SCSS palette (color-support-01..10)
  // Order: blue, green, yellow, then remaining
  const palette = [
    '#1B78F9', // support-01 blue
    '#3DD598', // support-03 green
    '#FFB547', // support-04 yellow
    '#FF6B6B', // support-05 red
    '#A970FF', // support-06 purple
    '#FF82D2', // support-07 pink
    '#29C499', // support-08 teal
    '#E89F3D', // support-09 orange
    '#2F95D8', // support-10 blue
    '#00C2FF', // support-02 sky
  ];

  // Color assignment will be derived directly from parent order; no state

  const lighten = (hex: string, amt = 0.25) => {
    const n = hex.replace('#','');
    const r = parseInt(n.substring(0,2),16);
    const g = parseInt(n.substring(2,4),16);
    const b = parseInt(n.substring(4,6),16);
    const lr = Math.round(r + (255 - r) * amt);
    const lg = Math.round(g + (255 - g) * amt);
    const lb = Math.round(b + (255 - b) * amt);
    return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
  };

  // Fetch subtasks for all parent tasks via Redux slice
  useEffect(() => {
    const parentTasks = tasks.filter(task => !task.parentId);
    parentTasks.forEach((task) => {
      dispatch(fetchSubtasksByParent(task.id));
    });
  }, [tasks, dispatch]);

  // Filter and transform parent tasks for timeline using createdAt/dueDate only
  const timelineTasks = useMemo(() => {
    const parentTasks = tasks.filter(task => !task.parentId);

    return parentTasks.map((task, idx) => {
      const subtasks = subtasksByParent[task.id] || [];
      const startDate = task.createdAt ? parseISO(task.createdAt) : new Date();
      const endDate = task.dueDate ? parseISO(task.dueDate) : startDate;

      return {
        id: task.id,
        title: task.title,
        startDate,
        endDate,
        status: task.status,
        priority: task.priority,
        subtasks,
        color: palette[idx % palette.length],
      } as TimelineTask;
    });
  }, [tasks, subtasksByParent]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (timelineTasks.length === 0) return { start: new Date(), end: addDays(new Date(), 30) };
    
    const allDates = timelineTasks.flatMap(task => [
      task.startDate,
      task.endDate,
    ]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    return {
      start: startOfDay(minDate),
      end: endOfDay(maxDate),
    };
  }, [timelineTasks]);

  const totalDays = differenceInDays(timelineBounds.end, timelineBounds.start) + 1;

  // Generate month markers spanning the current timeline bounds
  const monthMarkers = useMemo(() => {
    const months: Date[] = [];
    let current = startOfMonth(timelineBounds.start);
    const end = endOfMonth(timelineBounds.end);
    while (current <= end) {
      months.push(new Date(current));
      current = addMonths(current, 1);
    }
    return months;
  }, [timelineBounds]);

  // StatusBadge now handles consistent styling; color helper removed

  const calculatePosition = (date: Date) => {
    const daysDiff = differenceInDays(date, timelineBounds.start);
    return (daysDiff / totalDays) * 100;
  };

  const calculateWidth = (startDate: Date, endDate: Date) => {
    const duration = differenceInDays(endDate, startDate) + 1;
    return (duration / totalDays) * 100;
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const toggleExpand = (taskId: string) => {
    setExpandedParents(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (timelineTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <solar.Notes.ArchiveMinimalistic className="w-12 h-12 text-[#9AA5B1] mb-4" />
        <h3 className="text-lg font-medium text-[#1F2937] mb-2">No Parent Tasks Found</h3>
        <p className="text-[#4B5563]">Create some parent tasks to see the timeline view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Timeline View (responsive) */}
      <div className="block w-full max-w-full">
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E4E7EB] p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <solar.Time.Stopwatch className="w-5 h-5 text-[#1B78F9]" />
            <h2 className="text-lg font-semibold text-[#1F2937]">Project Timeline</h2>
            {loadingSubtasks && (
              <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                <div className="w-4 h-4 border-2 border-[#1B78F9] border-t-transparent rounded-full animate-spin"></div>
                Loading subtasks...
              </div>
            )}
          </div>
          
          {/* Left headers stay fixed; right panel scrolls */}
          <div className="flex w-full max-w-full overflow-hidden">
            {/* Left headers */}
            <div className=" shrink-0 w-[420px] md:w-[550px] bg-[#FFFFFF]">
              <div className="grid grid-cols-[12px_160px_64px_64px_120px] md:grid-cols-[16px_224px_80px_80px_150px] items-center text-xs text-[#6B7280] h4 font-bold my-2 px-2">
                <div></div>
                <div className="font-extrabold">Tasks</div>
                <div className="text-center">Start</div>
                <div className="text-center">End</div>
                <div className="text-center">Status</div>
              </div>
              {/* Left rows */}
              <div className="space-y-4">
                {timelineTasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <div className="grid grid-cols-[12px_160px_64px_64px_120px] md:grid-cols-[16px_224px_80px_80px_150px] items-center gap-2 px-2 h-8">
                      {(task.subtasks && task.subtasks.length > 0) ? (
                        <button
                          aria-label="Expand subtasks"
                          className="w-full h-full flex items-center justify-center text-[#6B7280] hover:text-[#1B78F9]"
                          onClick={() => toggleExpand(task.id)}
                        >
                          {expandedParents[task.id] ? (
                            <solar.Arrows.AltArrowDown className="w-3 h-3 md:w-4 md:h-4" />
                          ) : (
                            <solar.Arrows.AltArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </button>
                      ) : (
                        <div className="w-full h-full" />
                      )}
                      <h4
                        className="text-sm font-medium text-[#1F2937] truncate cursor-pointer hover:text-[#1B78F9]"
                        onClick={() => handleTaskClick(task.id)}
                        title="Click to view task details"
                      >
                        {task.title}
                      </h4>
                      <div className="text-xs text-[#4B5563]">{format(task.startDate, 'dd/MMM/yy')}</div>
                      <div className="text-xs text-[#4B5563]">{format(task.endDate, 'dd/MMM/yy')}</div>
                      <StatusBadge status={task.status} />
                    </div>
                    {expandedParents[task.id] && task.subtasks && task.subtasks.length > 0 && (
                      <div className="space-y-1">
                        {task.subtasks.map((st) => {
                          const sStart = parseISO(st.createdAt);
                          const sEnd = st.dueDate ? parseISO(st.dueDate) : sStart;
                          return (
                            <div key={st.id} className="grid grid-cols-[12px_160px_64px_64px_120px] md:grid-cols-[16px_224px_80px_80px_150px] items-center gap-2 pl-2 pr-2 h-6">
                              <div></div>
                              <div className="text-xs text-[#1F2937] truncate">{st.title}</div>
                              <div className="text-xs text-[#4B5563]">{format(sStart, 'dd/MMM/yy')}</div>
                              <div className="text-xs text-[#4B5563]">{format(sEnd, 'dd/MMM/yy')}</div>
                              <StatusBadge status={st.status} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right timeline: only months + bars horizontally scroll */}
            <div className="flex-1 min-w-0 relative z-0">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[700px] md:min-w-[800px] lg:min-w-[900px]">
                  {/* Months scale only above timeline (widths proportional to days per month in bounds) */}
                  <div className="relative mb-2">
                    <div className="flex text-xs text-[#4B5563] select-none">
                      {monthMarkers.map((m, idx) => {
                        const monthStart = max([startOfMonth(m), timelineBounds.start]);
                        const monthEnd = min([endOfMonth(m), timelineBounds.end]);
                        const monthDays = Math.max(0, differenceInDays(monthEnd, monthStart) + 1);
                        const widthPct = (monthDays / totalDays) * 100;
                        return (
                          <div
                            key={idx}
                            className="text-center border-b border-[#E4E7EB]"
                            style={{ width: `${widthPct}%` }}
                          >
                            {format(m, 'MMM')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Timeline rows */}
                  <div className="space-y-4">
                    {timelineTasks.map((task) => {
                      const leftPosition = calculatePosition(task.startDate);
                      const width = calculateWidth(task.startDate, task.endDate);
                      return (
                        <div key={task.id}>
                          <div className="relative h-8 bg-[#F5F7FA] rounded overflow-hidden">
                            <div
                              className="absolute top-1 bottom-1 rounded shadow-sm z-0"
                              style={{
                                left: `${leftPosition}%`,
                                width: `${width}%`,
                                minWidth: '24px',
                                backgroundColor: task.color,
                              }}
                            ></div>
                          </div>
                          {expandedParents[task.id] && task.subtasks && task.subtasks.length > 0 && (
                            <div className="space-y-1 mt-1">
                              {task.subtasks.map((st) => {
                                const sStart = parseISO(st.createdAt);
                                const sEnd = st.dueDate ? parseISO(st.dueDate) : sStart;
                                const sLeft = calculatePosition(sStart);
                                const sWidth = calculateWidth(sStart, sEnd);
                                const barColor = lighten(task.color, 0.25);
                                return (
                                  <div key={st.id} className="relative h-6 bg-[#F5F7FA] rounded overflow-hidden">
                                    <div
                                      className="absolute top-1 bottom-1 rounded z-0"
                                      style={{
                                        left: `${sLeft}%`,
                                        width: `${sWidth}%`,
                                        minWidth: '16px',
                                        backgroundColor: barColor,
                                      }}
                                    ></div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTimeline;