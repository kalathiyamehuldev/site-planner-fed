import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchTaskById,
  selectSelectedTask,
  selectTaskLoading,
  type Task as TaskType,
  updateTaskAsync,
  deleteTaskAsync,
} from "@/redux/slices/tasksSlice";
import {
  startTimer,
  stopTimer,
  selectActiveTimer,
  selectIsTimerRunning,
} from "@/redux/slices/timeTrackingSlice";
import api from "@/lib/axios";
import solar, { TrashBinTrash } from "@solar-icons/react";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { getProjectMembers } from "@/redux/slices/projectsSlice";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const statusLabel: Record<string, string> = {
  TODO: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
};

const statusColor: Record<string, string> = {
  TODO: "bg-gray-200 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

// Helper to render initials avatar for assignee
function getAvatarData(name?: string) {
  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const colors = [
    { bg: "#FDE68A", color: "#92400E" },
    { bg: "#A7F3D0", color: "#065F46" },
    { bg: "#BFDBFE", color: "#1E40AF" },
    { bg: "#FECACA", color: "#7F1D1D" },
    { bg: "#DDD6FE", color: "#4C1D95" },
  ];
  const idx = name
    ? (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length
    : 0;
  return { initials, bgColor: colors[idx].bg, color: colors[idx].color };
}

const TaskView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const task = useAppSelector(selectSelectedTask);
  const loading = useAppSelector(selectTaskLoading);
  const activeTimer = useAppSelector(selectActiveTimer);
  const isTimerRunning = useAppSelector(selectIsTimerRunning);

  const [subtasks, setSubtasks] = useState<TaskType[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtasksError, setSubtasksError] = useState<string | null>(null);
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Inline edit toggles
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingHeaderStatus, setEditingHeaderStatus] = useState(false);
  const [parentTask, setParentTask] = useState<{ id: string; title: string } | null>(null);
  const [subtaskEditing, setSubtaskEditing] = useState<Record<string, { title?: boolean; status?: boolean; priority?: boolean; dueDate?: boolean; assignee?: boolean }>>({});

  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    setSubtasksLoading(true);
    setSubtasksError(null);
    api
      .get(`/tasks/parent/${id}`)
      .then((response: any) => {
        const { status, data, error, message } = response || {};
        if (status === 'error') {
          setSubtasksError(error || message || 'Failed to fetch subtasks');
          setSubtasks([]);
          return;
        }
        const items = Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray(data as any)
            ? (data as any)
            : [];
        const mapped: TaskType[] = items.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          estimatedHours: t.estimatedHours,
          assignee: t.member ? `${t.member.firstName} ${t.member.lastName}` : undefined,
          member: t.member,
          project: t.project,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }));
        setSubtasks(mapped);
      })
      .catch((err: any) => {
        setSubtasksError(err?.message || 'Unknown error fetching subtasks');
        setSubtasks([]);
      })
      .finally(() => setSubtasksLoading(false));
  }, [id]);

  // Fetch members for inline assignment editing
  useEffect(() => {
    const pid = task?.project?.id;
    if (!pid) return;
    setMembersLoading(true);
    dispatch(getProjectMembers(pid))
      .unwrap()
      .then((resp: any) => setMembers(resp.members || []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [task?.project?.id, dispatch]);

  const refetchSubtasks = () => {
    if (!id) return;
    setSubtasksLoading(true);
    api.get(`/tasks/parent/${id}`)
      .then((response: any) => {
        const { status, data } = response || {};
        const items = Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray(data as any)
            ? (data as any)
            : [];
        const mapped: TaskType[] = items.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          estimatedHours: t.estimatedHours,
          assignee: t.member ? `${t.member.firstName} ${t.member.lastName}` : undefined,
          member: t.member,
          project: t.project,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }));
        setSubtasks(mapped);
      })
      .finally(() => setSubtasksLoading(false));
  };

  const toggleSubtaskEdit = (
    taskId: string,
    field: 'title' | 'status' | 'priority' | 'dueDate' | 'assignee',
    value: boolean
  ) => {
    setSubtaskEditing((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [field]: value,
      },
    }));
  };

  const timerForThisTask = useMemo(() => {
    return isTimerRunning && activeTimer.taskId === task?.id;
  }, [isTimerRunning, activeTimer, task]);

  const handleStartTimer = () => {
    if (!task) return;
    dispatch(
      startTimer({
        taskId: task.id,
        projectId: task.project?.id,
        description: `Working on: ${task.title}`,
        isBillable: true,
        hourlyRate: 40,
      })
    );
  };

  const handleStopTimer = () => {
    const timeEntryId = activeTimer.timeEntry?.id;
    if (!timeEntryId) return;
    dispatch(
      stopTimer({
        timeEntryId,
      })
    );
  };

  const assignedName = task?.assignee || (task?.member ? `${task.member.firstName} ${task.member.lastName}` : undefined);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
            {/* Left section */}
            <div className="flex flex-col">
              {/* Desktop: back then space then title below */}
              <div className="hidden md:flex flex-col">
                <Link to="/tasks" className="text-foreground flex items-center gap-1.5 mb-2">
                  <solar.Arrows.AltArrowLeft className="size-4" weight="Linear" />
                  <span className="font-semibold">Back</span>
                </Link>
                {editingTitle ? (
                  <input
                    className="w-full text-lg md:text-xl font-light leading-tight bg-transparent border-b outline-none"
                    defaultValue={task?.title || ''}
                    onBlur={(e) => {
                      setEditingTitle(false);
                      if (!task) return;
                      const val = e.currentTarget.value.trim();
                      if (val && val !== task.title) {
                        dispatch(updateTaskAsync({ id: task.id, taskData: { title: val } }));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                    }}
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-lg md:text-xl font-light leading-tight cursor-pointer"
                    onClick={() => setEditingTitle(true)}
                  >
                    {task?.title || 'Task'}
                  </h1>
                )}
              </div>
              {/* Mobile: icon and title inline */}
              <div className="md:hidden flex items-center gap-2">
                <Link to="/tasks" className="text-foreground flex items-center">
                  <solar.Arrows.AltArrowLeft className="size-5" weight="Linear" />
                </Link>
                {editingTitle ? (
                  <input
                    className="flex-1 w-full text-base font-light leading-tight bg-transparent border-b outline-none"
                    defaultValue={task?.title || ''}
                    onBlur={(e) => {
                      setEditingTitle(false);
                      if (!task) return;
                      const val = e.currentTarget.value.trim();
                      if (val && val !== task.title) {
                        dispatch(updateTaskAsync({ id: task.id, taskData: { title: val } }));
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-base font-light leading-tight cursor-pointer flex-1"
                    onClick={() => setEditingTitle(true)}
                  >
                    {task?.title || 'Task'}
                  </h1>
                )}
              </div>
              {/* Mobile-only: status + timer below title */}
              <div className="md:hidden flex items-center gap-2 mt-3">
                {editingHeaderStatus ? (
                  <Select
                    value={task?.status || 'TODO'}
                    onValueChange={(val) => {
                      if (!task) return;
                      if (val !== task.status) {
                        dispatch(updateTaskAsync({ id: task.id, taskData: { status: val as TaskType['status'] } }));
                      }
                      setEditingHeaderStatus(false);
                    }}
                  >
                    <SelectTrigger className="h-8 px-2 text-xs w-[160px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <button
                    className={cn(
                      "px-2 py-1 rounded-md text-xs",
                      statusColor[task?.status || 'TODO']
                    )}
                    onClick={() => setEditingHeaderStatus(true)}
                  >
                    {statusLabel[task?.status || 'TODO']}
                  </button>
                )}
                {timerForThisTask ? (
                  <Button size="sm" variant="secondary" onClick={handleStopTimer}>
                    <solar.Time.Stopwatch className="mr-2 size-4" weight="Bold" /> Stop Timer
                  </Button>
                ) : (
                  <Button size="sm" variant="default" onClick={handleStartTimer}>
                    <solar.Time.Stopwatch className="mr-2 size-4" weight="Bold" /> Start Timer
                  </Button>
                )}
              </div>
            </div>

            {/* Right (desktop): status + timer */}
            <div className="hidden md:flex items-center gap-2">
              {editingHeaderStatus ? (
                <Select
                  value={task?.status || 'TODO'}
                  onValueChange={(val) => {
                    if (!task) return;
                    if (val !== task.status) {
                      dispatch(updateTaskAsync({ id: task.id, taskData: { status: val as TaskType['status'] } }));
                    }
                    setEditingHeaderStatus(false);
                  }}
                >
                  <SelectTrigger className="h-9 px-2 text-sm w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <button
                  className={cn(
                    "px-2 py-1 rounded-md text-sm",
                    statusColor[task?.status || 'TODO']
                  )}
                  onClick={() => setEditingHeaderStatus(true)}
                >
                  {statusLabel[task?.status || 'TODO']}
                </button>
              )}
              {timerForThisTask ? (
                <Button variant="secondary" onClick={handleStopTimer}>
                  <solar.Time.Stopwatch className="mr-2 size-4" weight="Bold" /> Stop Timer
                </Button>
              ) : (
                <Button variant="default" onClick={handleStartTimer}>
                  <solar.Time.Stopwatch className="mr-2 size-4" weight="Bold" /> Start Timer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-6">
            <GlassCard className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-3">
                <solar.Notes.ArchiveMinimalistic className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-medium">Description</h2>
                {/* Removed Add Sub-task button from Description */}
              </div>
              {editingDescription ? (
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={task?.description || ""}
                  onBlur={(e) => {
                    const val = e.currentTarget.value.trim();
                    if (!task || val === task.description) { setEditingDescription(false); return; }
                    dispatch(updateTaskAsync({ id: task.id, taskData: { description: val || undefined } }));
                    setEditingDescription(false);
                  }}
                  autoFocus
                  rows={3}
                />
              ) : (
                <p
                  className="text-sm md:text-base leading-relaxed text-[#2a2e35] cursor-pointer"
                  onClick={() => setEditingDescription(true)}
                >
                  {task?.description || "No description provided."}
                </p>
              )}
            </GlassCard>

            {/* Subtasks - show only when exists */}
            {subtasks.length > 0 && (
              <GlassCard className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <solar.List.ChecklistMinimalistic className="size-4 text-muted-foreground" />
                  <h2 className="text-lg font-medium">Subtasks</h2>
                </div>
                <div className="space-y-2">
                  {/* Desktop table-like list */}
                  <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Priority</div>
                    <div className="col-span-2">Assigned</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-1"></div>
                  </div>
                  {subtasks.map((st) => (
                    <div key={st.id} className="group">
                      <div className="hidden md:grid grid-cols-12 gap-3 py-2 border-b hover:bg-secondary/50 rounded-md">
                        <div className="col-span-4 truncate font-medium text-left flex items-center gap-2">
                          <button onClick={() => navigate(`/tasks/${st.id}`)} className="truncate text-left flex-1">
                            {st.title}
                          </button>
                          <button
                            aria-label="Edit title"
                            className="opacity-60 hover:opacity-100"
                            onClick={() => toggleSubtaskEdit(st.id, 'title', true)}
                          >
                            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"/></svg>
                          </button>
                        </div>
                        {/* Title inline edit */}
                        {subtaskEditing[st.id]?.title && (
                          <div className="col-span-12 mb-2">
                            <input
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                              defaultValue={st.title}
                              onBlur={(e) => {
                                const val = e.currentTarget.value.trim();
                                toggleSubtaskEdit(st.id, 'title', false);
                                if (val && val !== st.title) {
                                  dispatch(updateTaskAsync({ id: st.id, taskData: { title: val } })).unwrap()
                                    .then(() => setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: val } : s)));
                                }
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                        <div className="col-span-2">
                          {subtaskEditing[st.id]?.status ? (
                            <Select
                              value={st.status || 'TODO'}
                              onValueChange={(val) => {
                                if (val !== (st.status || 'TODO')) {
                                  dispatch(updateTaskAsync({ id: st.id, taskData: { status: val as TaskType['status'] } })).unwrap()
                                    .then(() => setSubtasks(prev => prev.map(x => x.id === st.id ? { ...x, status: val as TaskType['status'] } : x)));
                                }
                                toggleSubtaskEdit(st.id, 'status', false);
                              }}
                            >
                              <SelectTrigger className="h-8 px-2 text-xs w-[160px]">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TODO">Not Started</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="DONE">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <button
                              className={cn("px-2 py-1 rounded-md text-xs", statusColor[st.status || 'TODO'])}
                              onClick={() => toggleSubtaskEdit(st.id, 'status', true)}
                            >
                              {statusLabel[st.status || 'TODO']}
                            </button>
                          )}
                        </div>
                        <div className="col-span-1 flex items-center gap-2">
                          {subtaskEditing[st.id]?.priority ? (
                            <Select
                              value={st.priority || 'MEDIUM'}
                              onValueChange={(val) => {
                                if (val !== (st.priority || 'MEDIUM')) {
                                  dispatch(updateTaskAsync({ id: st.id, taskData: { priority: val as TaskType['priority'] } })).unwrap()
                                    .then(() => setSubtasks(prev => prev.map(x => x.id === st.id ? { ...x, priority: val as TaskType['priority'] } : x)));
                                }
                                toggleSubtaskEdit(st.id, 'priority', false);
                              }}
                            >
                              <SelectTrigger className="h-8 px-2 text-xs w-[160px]">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW"><span className="inline-flex items-center gap-1">{renderPriorityIcon('LOW')}<span>Low</span></span></SelectItem>
                                <SelectItem value="MEDIUM"><span className="inline-flex items-center gap-1">{renderPriorityIcon('MEDIUM')}<span>Medium</span></span></SelectItem>
                                <SelectItem value="HIGH"><span className="inline-flex items-center gap-1">{renderPriorityIcon('HIGH')}<span>High</span></span></SelectItem>
                                <SelectItem value="URGENT"><span className="inline-flex items-center gap-1">{renderPriorityIcon('URGENT')}<span>Urgent</span></span></SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <button
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                                st.priority === 'URGENT' ? 'bg-red-100 text-red-700' : st.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : st.priority === 'MEDIUM' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'
                              )}
                              onClick={() => toggleSubtaskEdit(st.id, 'priority', true)}
                              title={st.priority || 'MEDIUM'}
                            >
                              {renderPriorityIcon(st.priority)}
                            </button>
                          )}
                        </div>
                        {/* Assigned member */}
                        <div className="col-span-2">
                          {subtaskEditing[st.id]?.assignee ? (
                            <Select
                              value={st.member?.id || 'unassigned'}
                              onValueChange={(val) => {
                                const memberId = val === 'unassigned' ? undefined : val;
                                const selected = members.find((m: any) => m.user.id === memberId);
                                const updatedMember = selected
                                  ? {
                                      id: selected.user.id,
                                      firstName: selected.user.firstName,
                                      lastName: selected.user.lastName,
                                      email: selected.user.email,
                                    }
                                  : undefined;
                                const updatedAssignee = selected
                                  ? `${selected.user.firstName} ${selected.user.lastName}`
                                  : undefined;
                                dispatch(updateTaskAsync({ id: st.id, taskData: { memberId } }))
                                  .unwrap()
                                  .then(() =>
                                    setSubtasks((prev) =>
                                      prev.map((s) =>
                                        s.id === st.id ? { ...s, member: updatedMember, assignee: updatedAssignee } : s
                                      )
                                    )
                                  );
                                toggleSubtaskEdit(st.id, 'assignee', false);
                              }}
                            >
                              <SelectTrigger className="h-8 px-2 text-xs w-[180px]">
                                <SelectValue placeholder="Assign member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {members.map((m: any) => (
                                  <SelectItem key={m.user.id} value={m.user.id}>
                                    {m.user.firstName} {m.user.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <button
                              className="flex items-center gap-2"
                              onClick={() => toggleSubtaskEdit(st.id, 'assignee', true)}
                            >
                              {(() => {
                                const assignedName = st.assignee || (st.member ? `${st.member.firstName} ${st.member.lastName}` : undefined);
                                const avatar = getAvatarData(assignedName);
                                return (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                    style={{ backgroundColor: avatar.bgColor, color: avatar.color }}
                                  >
                                    {avatar.initials}
                                  </div>
                                );
                              })()}
                              <span className="text-sm truncate">{st.assignee || (st.member ? `${st.member.firstName} ${st.member.lastName}` : '-')}</span>
                            </button>
                          )}
                        </div>
                        {/* Due date */}
                        <div className="col-span-2 text-sm">
                          {subtaskEditing[st.id]?.dueDate ? (
                            <input
                              type="date"
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              defaultValue={st.dueDate ? st.dueDate.split('T')[0] : ''}
                              onBlur={() => toggleSubtaskEdit(st.id, 'dueDate', false)}
                              onChange={(e) => {
                                const val = e.currentTarget.value || undefined;
                                toggleSubtaskEdit(st.id, 'dueDate', false);
                                if (val !== (st.dueDate ? st.dueDate.split('T')[0] : undefined)) {
                                  dispatch(updateTaskAsync({ id: st.id, taskData: { dueDate: val } })).unwrap()
                                    .then(() => setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, dueDate: val } : s)));
                                }
                              }}
                            />
                          ) : (
                            <button className="text-muted-foreground" onClick={() => toggleSubtaskEdit(st.id, 'dueDate', true)}>
                              {formatDate(st.dueDate)}
                            </button>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            aria-label="Delete subtask"
                            onClick={() => {
                              dispatch(deleteTaskAsync(st.id)).unwrap()
                                .then(() => setSubtasks((prev) => prev.filter(s => s.id !== st.id)));
                            }}
                            className="opacity-70 group-hover:opacity-100 mx-auto"
                            title="Delete"
                          >
                              <TrashBinTrash weight="Bold" color="red" size={20}/>
                          </button>
                        </div>
                      </div>
                      {/* Mobile card */}
                      <div className="md:hidden flex items-start justify-between gap-2 py-3 border-b">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/tasks/${st.id}`)} className="font-medium text-left flex-1">
                              {st.title}
                            </button>
                            <button aria-label="Edit title" onClick={() => toggleSubtaskEdit(st.id, 'title', true)} className="opacity-60 hover:opacity-100">
                              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"/></svg>
                            </button>
                          </div>
                          {subtaskEditing[st.id]?.title && (
                            <input
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm mt-1"
                              defaultValue={st.title}
                              onBlur={(e) => {
                                const val = e.currentTarget.value.trim();
                                toggleSubtaskEdit(st.id, 'title', false);
                                if (val && val !== st.title) {
                                  dispatch(updateTaskAsync({ id: st.id, taskData: { title: val } })).unwrap()
                                    .then(() => setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, title: val } : s)));
                                }
                              }}
                              autoFocus
                            />
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                            {subtaskEditing[st.id]?.status ? (
                              <Select
                                value={st.status || 'TODO'}
                                onValueChange={(val) => {
                                  if (val !== (st.status || 'TODO')) {
                                    dispatch(updateTaskAsync({ id: st.id, taskData: { status: val as TaskType['status'] } })).unwrap()
                                      .then(() => setSubtasks(prev => prev.map(x => x.id === st.id ? { ...x, status: val as TaskType['status'] } : x)));
                                  }
                                  toggleSubtaskEdit(st.id, 'status', false);
                                }}
                              >
                                <SelectTrigger className="h-8 px-2 text-xs w-[160px]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TODO">Not Started</SelectItem>
                                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                  <SelectItem value="DONE">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <button className={cn("px-2 py-1 rounded-md", statusColor[st.status || 'TODO'])} onClick={() => toggleSubtaskEdit(st.id, 'status', true)}>
                                {statusLabel[st.status || 'TODO']}
                              </button>
                            )}
                            {subtaskEditing[st.id]?.priority ? (
                              <Select
                                value={st.priority || 'MEDIUM'}
                                onValueChange={(val) => {
                                  if (val !== (st.priority || 'MEDIUM')) {
                                    dispatch(updateTaskAsync({ id: st.id, taskData: { priority: val as TaskType['priority'] } })).unwrap()
                                      .then(() => setSubtasks(prev => prev.map(x => x.id === st.id ? { ...x, priority: val as TaskType['priority'] } : x)));
                                  }
                                  toggleSubtaskEdit(st.id, 'priority', false);
                                }}
                              >
                                <SelectTrigger className="h-8 px-2 text-xs w-[160px]">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LOW"><span className="inline-flex items-center gap-1">{renderPriorityIcon('LOW')}<span>Low</span></span></SelectItem>
                                  <SelectItem value="MEDIUM"><span className="inline-flex items-center gap-1">{renderPriorityIcon('MEDIUM')}<span>Medium</span></span></SelectItem>
                                  <SelectItem value="HIGH"><span className="inline-flex items-center gap-1">{renderPriorityIcon('HIGH')}<span>High</span></span></SelectItem>
                                  <SelectItem value="URGENT"><span className="inline-flex items-center gap-1">{renderPriorityIcon('URGENT')}<span>Urgent</span></span></SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <button
                                className={cn(
                                  'px-2 py-1 rounded-md',
                                  st.priority === 'URGENT' ? 'bg-red-100 text-red-700' : st.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : st.priority === 'MEDIUM' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'
                                )}
                                onClick={() => toggleSubtaskEdit(st.id, 'priority', true)}
                                title={st.priority || 'MEDIUM'}
                              >
                                {renderPriorityIcon(st.priority)}
                              </button>
                            )}
                            {subtaskEditing[st.id]?.dueDate ? (
                              <input
                                type="date"
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                defaultValue={st.dueDate ? st.dueDate.split('T')[0] : ''}
                                onBlur={() => toggleSubtaskEdit(st.id, 'dueDate', false)}
                                onChange={(e) => {
                                  const val = e.currentTarget.value || undefined;
                                  toggleSubtaskEdit(st.id, 'dueDate', false);
                                  if (val !== (st.dueDate ? st.dueDate.split('T')[0] : undefined)) {
                                    dispatch(updateTaskAsync({ id: st.id, taskData: { dueDate: val } })).unwrap()
                                      .then(() => setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, dueDate: val } : s)));
                                  }
                                }}
                              />
                            ) : (
                              <button className="text-muted-foreground" onClick={() => toggleSubtaskEdit(st.id, 'dueDate', true)}>
                                Due: {formatDate(st.dueDate)}
                              </button>
                            )}
                            {subtaskEditing[st.id]?.assignee ? (
                              <Select
                                value={st.member?.id || 'unassigned'}
                                onValueChange={(val) => {
                                  const memberId = val === 'unassigned' ? undefined : val;
                                  const selected = members.find((m: any) => m.user.id === memberId);
                                  const updatedMember = selected
                                    ? {
                                        id: selected.user.id,
                                        firstName: selected.user.firstName,
                                        lastName: selected.user.lastName,
                                        email: selected.user.email,
                                      }
                                    : undefined;
                                  const updatedAssignee = selected
                                    ? `${selected.user.firstName} ${selected.user.lastName}`
                                    : undefined;
                                  dispatch(updateTaskAsync({ id: st.id, taskData: { memberId } }))
                                    .unwrap()
                                    .then(() =>
                                      setSubtasks((prev) =>
                                        prev.map((s) =>
                                          s.id === st.id ? { ...s, member: updatedMember, assignee: updatedAssignee } : s
                                        )
                                      )
                                    );
                                  toggleSubtaskEdit(st.id, 'assignee', false);
                                }}
                              >
                                <SelectTrigger className="h-8 px-2 text-xs w-[180px]">
                                  <SelectValue placeholder="Assign member" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {members.map((m: any) => (
                                    <SelectItem key={m.user.id} value={m.user.id}>
                                      {m.user.firstName} {m.user.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              (() => {
                                const assignedName = st.assignee || (st.member ? `${st.member.firstName} ${st.member.lastName}` : undefined);
                                const avatar = getAvatarData(assignedName);
                                return (
                                  <button className="flex items-center gap-1" onClick={() => toggleSubtaskEdit(st.id, 'assignee', true)}>
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
                                      style={{ backgroundColor: avatar.bgColor, color: avatar.color }}
                                    >
                                      {avatar.initials}
                                    </div>
                                    <span className="text-muted-foreground">{assignedName || '-'}</span>
                                  </button>
                                );
                              })()
                            )}
                          </div>
                        </div>
                        <button
                          aria-label="Delete subtask"
                          onClick={() => {
                            dispatch(deleteTaskAsync(st.id)).unwrap()
                              .then(() => setSubtasks((prev) => prev.filter(s => s.id !== st.id)));
                          }}
                          title="Delete"
                        >
                          <TrashBinTrash weight="Bold" size={20} color="red"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3">
                  <Button size="sm" variant="default" onClick={() => setIsAddSubtaskOpen(true)}>
                    + Add Sub-task
                  </Button>
                </div>
              </GlassCard>
            )}

            {/* Comments */}
            <GlassCard className="p-4 md:p-6">
              <h2 className="text-lg font-medium mb-4">Comments</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <solar.Security.ShieldUser className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button size="sm">Post</Button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right column (Task Info) */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard className="p-4 md:p-6">
              <h2 className="text-lg font-medium mb-4">Task Info</h2>
              <div className="space-y-3 text-sm">
                {/* Status removed as per request */}
                <InfoRow label="Project">
                  <div className="flex items-center gap-2">
                    <span>{task?.project?.name || '-'}</span>
                  </div>
                </InfoRow>
                {task?.parentId && (
                  <InfoRow label="Parent Task">
                    {parentTask ? (
                      <Link to={`/tasks/${parentTask.id}`} className="text-primary hover:underline">{parentTask.title}</Link>
                    ) : (
                      <span className="text-muted-foreground">Loading...</span>
                    )}
                  </InfoRow>
                )}
                <InfoRow label="Assigned">
                  {editingAssignee ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        disabled={membersLoading}
                        defaultValue={task?.member?.id || 'unassigned'}
                        onBlur={() => setEditingAssignee(false)}
                        onChange={(e) => {
                          if (!task) return;
                          const val = e.currentTarget.value;
                          const memberId = val === 'unassigned' ? undefined : val;
                          const currentId = task.member?.id;
                          if (memberId !== currentId) {
                            dispatch(updateTaskAsync({ id: task.id, taskData: { memberId } }));
                          }
                          setEditingAssignee(false);
                        }}
                      >
                        <option value="unassigned">Unassigned</option>
                        {members.map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.firstName} {m.user.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <button className="flex items-center gap-2" onClick={() => setEditingAssignee(true)}>
                      <span>{assignedName || '-'}</span>
                    </button>
                  )}
                </InfoRow>
                <InfoRow label="Start Date">
                  <div className="flex items-center gap-2">
                    <solar.Time.ClockCircle className="size-4 text-muted-foreground" />
                    <span>{formatDate(task?.createdAt)}</span>
                  </div>
                </InfoRow>
                <InfoRow label="Updated">
                  <div className="flex items-center gap-2">
                    <solar.Time.ClockCircle className="size-4 text-muted-foreground" />
                    <span className="truncate md:whitespace-normal">{formatDate(task?.updatedAt)}</span>
                  </div>
                </InfoRow>
                <InfoRow label="Due Date">
                  {editingDueDate ? (
                    <div className="flex items-center gap-2">
                      <solar.Time.ClockCircle className="size-4 text-muted-foreground" />
                      <input
                        type="date"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        defaultValue={task?.dueDate ? task.dueDate.split('T')[0] : ''}
                        onBlur={() => setEditingDueDate(false)}
                        onChange={(e) => {
                          if (!task) return;
                          const val = e.currentTarget.value || undefined;
                          const current = task?.dueDate ? task.dueDate.split('T')[0] : undefined;
                          if (val !== current) {
                            dispatch(updateTaskAsync({ id: task.id, taskData: { dueDate: val } }));
                          }
                          setEditingDueDate(false);
                        }}
                      />
                    </div>
                  ) : (
                    <button className="flex items-center gap-2" onClick={() => setEditingDueDate(true)}>
                      <solar.Time.ClockCircle className="size-4 text-muted-foreground" />
                      <span>{formatDate(task?.dueDate)}</span>
                    </button>
                  )}
                </InfoRow>
                <InfoRow label="Priority">
                  {editingPriority ? (
                    <Select
                      value={task?.priority || 'MEDIUM'}
                      onValueChange={(val) => {
                        if (!task) return;
                        if (val !== task.priority) {
                          dispatch(updateTaskAsync({ id: task.id, taskData: { priority: val as TaskType['priority'] } }));
                        }
                        setEditingPriority(false);
                      }}
                    >
                      <SelectTrigger className="h-9 px-2 text-sm w-[200px]">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW"><span className="inline-flex items-center gap-2">{renderPriorityIcon('LOW')}<span>Low</span></span></SelectItem>
                        <SelectItem value="MEDIUM"><span className="inline-flex items-center gap-2">{renderPriorityIcon('MEDIUM')}<span>Medium</span></span></SelectItem>
                        <SelectItem value="HIGH"><span className="inline-flex items-center gap-2">{renderPriorityIcon('HIGH')}<span>High</span></span></SelectItem>
                        <SelectItem value="URGENT"><span className="inline-flex items-center gap-2">{renderPriorityIcon('URGENT')}<span>Urgent</span></span></SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <button
                      className={cn(
                        'px-2 py-1 rounded-md',
                        (task?.priority || 'MEDIUM') === 'URGENT' ? 'bg-red-100 text-red-700' : (task?.priority || 'MEDIUM') === 'HIGH' ? 'bg-orange-100 text-orange-700' : (task?.priority || 'MEDIUM') === 'MEDIUM' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'
                      )}
                      onClick={() => setEditingPriority(true)}
                      title={task?.priority || 'MEDIUM'}
                    >
                      {task?.priority}
                    </button>
                  )}
                </InfoRow>
                <div className="pt-3">
                  <Button size="sm" variant="default" onClick={() => setIsAddSubtaskOpen(true)}>
                    + Add Sub-task
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Add Sub-task dialog */}
      {task && (
        <AddTaskDialog
          open={isAddSubtaskOpen}
          onOpenChange={(open) => setIsAddSubtaskOpen(open)}
          projectId={task.project?.id || ''}
          fromProject
          initialStatus="TODO"
          parentId={task.id}
          onSuccess={() => { setIsAddSubtaskOpen(false); refetchSubtasks(); }}
        />
      )}
    </PageContainer>
  );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
};

function formatDate(date?: string) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return date;
  }
}

function renderPriorityIcon(priority?: string) {
  const p = priority || 'MEDIUM';
  const color = p === 'URGENT' ? '#DC2626' : p === 'HIGH' ? '#F59E0B' : p === 'MEDIUM' ? '#6B7280' : '#10B981';
  switch (p) {
    case 'LOW':
      return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={color} strokeWidth="2">
          <path d="M6 8l6 6 6-6" />
        </svg>
      );
    case 'MEDIUM':
      return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={color} strokeWidth="2">
          <path d="M4 10h16" />
          <path d="M4 14h16" />
        </svg>
      );
    case 'HIGH':
      return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={color} strokeWidth="2">
          <path d="M6 16l6-6 6 6" />
        </svg>
      );
    case 'URGENT':
      return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={color} strokeWidth="2">
          <path d="M6 18l6-6 6 6" />
          <path d="M6 12l6-6 6 6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={color} strokeWidth="2">
          <path d="M4 10h16" />
          <path d="M4 14h16" />
        </svg>
      );
  }
}

export default TaskView;