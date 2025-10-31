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
  fetchTaskCommentsAsync,
  createTaskCommentAsync,
  deleteTaskCommentAsync,
  selectCommentsByTaskId,
  selectCommentsLoading,
  selectCommentsError,
  addTaskCommentReactionAsync,
  removeTaskCommentReactionAsync,
  updateTaskCommentAsync,
  fetchSubtasksByParent,
  selectSubtasksByParentId,
  selectSubtasksLoading,
} from "@/redux/slices/tasksSlice";
import {
  startTimer,
  stopTimer,
  selectActiveTimer,
  selectIsTimerRunning,
} from "@/redux/slices/timeTrackingSlice";
import solar, { Pen2, TrashBinTrash } from "@solar-icons/react";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import ActionButton from "@/components/ui/ActionButton";
import { getProjectMembers } from "@/redux/slices/projectsSlice";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

import { selectUser } from "@/redux/slices/authSlice";
import usePermission from "@/hooks/usePermission";

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
  const currentUser = useAppSelector(selectUser);
  const { hasPermission } = usePermission();

  const subtasks = useAppSelector(selectSubtasksByParentId(id || ""));
  const subtasksLoading = useAppSelector(selectSubtasksLoading);
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Comments: use Redux slice selectors; keep local input state
  const comments = useAppSelector(selectCommentsByTaskId(id || ''));
  const commentsLoading = useAppSelector(selectCommentsLoading);
  const commentsError = useAppSelector(selectCommentsError);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [newCommentMentions, setNewCommentMentions] = useState<string[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { text: string; posting: boolean; mentions: string[]; mentionOpen: boolean; mentionQuery: string }>>({});
  const [editingComments, setEditingComments] = useState<Record<string, { text: string; saving: boolean }>>({});

  // Restore inline edit toggles and subtask edit tracking
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingHeaderStatus, setEditingHeaderStatus] = useState(false);
  // Resolve parent task title from Redux store (no extra fetch that would override selectedTask)
  const parentTitle = useAppSelector((state) =>
    task?.parentId ? state.tasks.tasks.find((t) => t.id === task.parentId)?.title : undefined
  );
  const [subtaskEditing, setSubtaskEditing] = useState<Record<string, { title?: boolean; status?: boolean; priority?: boolean; dueDate?: boolean; assignee?: boolean }>>({});

  // Fetch task and comments on load/id change
  useEffect(() => {
    if (!id) return;
    dispatch(fetchTaskById(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchTaskCommentsAsync(id));
  }, [id, dispatch]);

  const threaded = useMemo(() => {
    const byParent: Record<string, any[]> = {};
    const tops: any[] = [];
    comments.forEach((c: any) => {
      const pid = c?.parentId;
      if (pid) {
        (byParent[pid] ||= []).push(c);
      } else {
        tops.push(c);
      }
    });
    return { tops, byParent };
  }, [comments]);

  const allDescendantIds = (rootId: string) => {
    const res: string[] = [];
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop()!;
      const kids = threaded.byParent[cur] || [];
      for (const k of kids) {
        res.push(k.id);
        stack.push(k.id);
      }
    }
    return res;
  };

  useEffect(() => {
    const match = newComment.match(/@([\w\s]*)$/);
    if (match) {
      setMentionOpen(true);
      setMentionQuery(match[1].trim());
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  }, [newComment]);

  const handlePostComment = async () => {
    const content = newComment.trim();
    if (!id || !content) return;
    if (!hasPermission('tasks', 'update')) return;
    setPostingComment(true);
    try {
      await dispatch(createTaskCommentAsync({ taskId: id, content, mentionUserIds: newCommentMentions })).unwrap();
      setNewComment("");
      setNewCommentMentions([]);
      setMentionOpen(false);
      setMentionQuery("");
    } catch (_) {
      // Errors toasted in slice
    } finally {
      setPostingComment(false);
    }
  };

  const handleSelectMentionMain = (user: any) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const replaced = newComment.replace(/@([\w\s]*)$/, `@${fullName} `);
    setNewComment(replaced);
    setNewCommentMentions((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    setMentionOpen(false);
    setMentionQuery("");
  };

  const toggleReaction = (commentId: string, type: 'thumbs_up' | 'heart' | 'laugh') => {
    if (!id || !currentUser?.id) return;
    if (!hasPermission('tasks', 'update')) return;
    const comment = comments.find((x: any) => x.id === commentId);
    const myReaction = (comment?.reactions || []).find((r: any) => r?.userId === currentUser.id);
    if (myReaction?.type === type) {
      dispatch(removeTaskCommentReactionAsync({ taskId: id, commentId, type }));
      return;
    }
    if (myReaction && myReaction.type !== type) {
      dispatch(removeTaskCommentReactionAsync({ taskId: id, commentId, type: myReaction.type }))
        .unwrap()
        .finally(() => {
          dispatch(addTaskCommentReactionAsync({ taskId: id, commentId, type }));
        });
      return;
    }
    dispatch(addTaskCommentReactionAsync({ taskId: id, commentId, type }));
  };

  const handleDeleteCommentWithThread = async (comment: any) => {
    if (!id || !comment?.id) return;
    try {
      // Delete only the selected comment. Backend enforces author-only deletion.
      await dispatch(deleteTaskCommentAsync({ taskId: id, commentId: comment.id })).unwrap();
    } catch (_) {
      // Errors toasted in slice
    }
  };

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

  // Ensure subtasks fetched via slice when id changes
  useEffect(() => {
    // Prohibit multi-level nesting: only fetch subtasks for top-level tasks
    if (id && !task?.parentId) {
      dispatch(fetchSubtasksByParent(id));
    }
  }, [id, task?.parentId, dispatch]);
  const toggleSubtaskEdit = (
    taskId: string,
    field: 'title' | 'status' | 'priority' | 'dueDate' | 'assignee',
    value: boolean
  ) => {
    if (!hasPermission('tasks', 'update')) return;
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
  const canAddSubtask = !task?.parentId; // if current task is a subtask, prohibit adding subtasks

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
                    onClick={() => hasPermission('tasks', 'update') && setEditingTitle(true)}
                  >
                    {task?.title || 'Task'}
                  </h1>
                )}
                {task?.parentId && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <solar.Arrows.AltArrowUp className="size-4" weight="Linear" />
                    <span>Parent:</span>
                    <Link
                      to={`/tasks/${task.parentId}`}
                      className="text-foreground font-medium hover:underline"
                    >
                      {parentTitle || 'Open Parent'}
                    </Link>
                  </div>
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
                    onClick={() => hasPermission('tasks', 'update') && setEditingTitle(true)}
                  >
                    {task?.title || 'Task'}
                  </h1>
                )}
              </div>
              {task?.parentId && (
                <div className="md:hidden mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <solar.Arrows.AltArrowUp className="size-4" weight="Linear" />
                  <span>Parent:</span>
                  <Link
                    to={`/tasks/${task.parentId}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {parentTitle || 'Open Parent'}
                  </Link>
                </div>
              )}
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
                    onClick={() => hasPermission('tasks', 'update') && setEditingHeaderStatus(true)}
                  >
                    {statusLabel[task?.status || 'TODO']}
                  </button>
                )}
                {timerForThisTask ? (
                  <ActionButton
                    variant="gray"
                    onClick={handleStopTimer}
                    leftIcon={<solar.Time.Stopwatch className="size-4" weight="Bold" />}
                    text="Stop Timer"
                  />
                ) : (
                  <ActionButton
                    variant="secondary"
                    onClick={handleStartTimer}
                    leftIcon={<solar.Time.Stopwatch className="size-4" weight="Bold" />}
                    text="Start Timer"
                  />
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
                  onClick={() => hasPermission('tasks', 'update') && setEditingHeaderStatus(true)}
                >
                  {statusLabel[task?.status || 'TODO']}
                </button>
              )}
              {timerForThisTask ? (
                <ActionButton
                  variant="secondary"
                  onClick={handleStopTimer}
                  leftIcon={<solar.Time.Stopwatch className="size-4" weight="Bold" />}
                  text="Stop Timer"
                />
              ) : (
                <ActionButton
                  variant="secondary"
                  onClick={handleStartTimer}
                  leftIcon={<solar.Time.Stopwatch className="size-4" weight="Bold" />}
                  text="Start Timer"
                />
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
                <h2 className="font-medium">Description</h2>
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
                  onClick={() => hasPermission('tasks', 'update') && setEditingDescription(true)}
                >
                  {task?.description || "No description provided."}
                </p>
              )}
            </GlassCard>

            {/* Subtasks */}
            <GlassCard className={!canAddSubtask ? "hidden" : "p-4 md:p-6"}>
              <div className="flex items-center gap-2 mb-3">
                <solar.List.ChecklistMinimalistic className="size-4 text-muted-foreground" />
                <h2 className="font-medium">Subtasks</h2>
              </div>
              {subtasks.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center">
                  <div className="text-sm text-muted-foreground mb-3">No sub-task found. Add a Sub-task</div>
                  <ActionButton
                    variant="primary"
                    onClick={() => setIsAddSubtaskOpen(true)}
                    leftIcon={<solar.Ui.AddSquare className="size-3" weight="Outline" />}
                    text="Add Subtask"
                  />
                </div>
              ) : (
                <>
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
                            <button
                              onClick={() => navigate(`/tasks/${st.id}`)}
                              className="truncate text-left flex-1"
                              title={st.title}
                            >
                              {st.title}
                            </button>
                            <button
                              aria-label="Edit title"
                              className="opacity-60 hover:opacity-100"
                              onClick={() => toggleSubtaskEdit(st.id, 'title', true)}
                            >
                              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" /></svg>
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
                                      .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                      .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                      .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                    .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                      .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                  .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
                              }}
                              className="opacity-70 group-hover:opacity-100 mx-auto"
                              title="Delete"
                            >
                              <TrashBinTrash weight="Bold" color="red" size={20} />
                            </button>
                          </div>
                        </div>
                        {/* Mobile card */}
                        <div className="md:hidden flex items-start justify-between gap-2 py-3 border-b">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/tasks/${st.id}`)}
                                className="font-medium text-left flex-1 truncate"
                                title={st.title}
                              >
                                {st.title}
                              </button>
                              <button aria-label="Edit title" onClick={() => toggleSubtaskEdit(st.id, 'title', true)} className="opacity-60 hover:opacity-100">
                                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" /></svg>
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
                                      .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                        .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                        .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                        .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                                      .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
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
                          <Button
                            aria-label="Delete subtask"
                            onClick={() => {
                              dispatch(deleteTaskAsync(st.id)).unwrap()
                                .then(() => { if (id) dispatch(fetchSubtasksByParent(id)); });
                            }}
                            className="opacity-70 group-hover:opacity-100"
                            title="Delete"
                          >
                            <TrashBinTrash weight="Bold" size={20} color="red" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3">
                    {canAddSubtask && (
                      <ActionButton
                        variant="primary"
                        onClick={() => setIsAddSubtaskOpen(true)}
                        leftIcon={<solar.Ui.AddSquare className="size-3" weight="Outline" />}
                        text="Add Subtask"
                      />
                    )}
                  </div>
                </>
              )}
            </GlassCard>

            {/* Comments */}
            <GlassCard className="p-4 md:p-6">
              <h2 className="font-medium mb-4">Comments</h2>
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading comments...</div>
                ) : commentsError ? (
                  <div className="text-sm text-red-600">{commentsError}</div>
                ) : comments.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <solar.Security.ShieldUser className="size-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {threaded.tops.map((c: any) => {
                      const authorName = c?.fromUser ? `${c.fromUser.firstName} ${c.fromUser.lastName}` : "Unknown";
                      const avatar = getAvatarData(authorName);
                      const count = (t: string) => (c.reactions || []).filter((r: any) => r?.type === t).length;
                      const reacted = (t: string) => (c.reactions || []).some((r: any) => r?.type === t && r?.userId === currentUser?.id);
                      return (
                        <div key={c.id} className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{ backgroundColor: avatar.bgColor, color: avatar.color }}
                              aria-label={authorName}
                            >
                              {avatar.initials}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  {authorName}
                                  {c?.updatedAt && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {new Date(c.updatedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {currentUser?.id && String(c?.fromUser?.id ?? c?.author?.id) === String(currentUser?.id) && (
                                    <button
                                      className="p-1 text-primary hover:underline text-xs opacity-70 group-hover:opacity-100"
                                      title="Edit comment"
                                      onClick={() => setEditingComments((prev) => ({ ...prev, [c.id]: { text: c.content, saving: false } }))}
                                    >
                                      <Pen2 weight="Outline" color="blue" size={20} />
                                    </button>
                                  )}
                                  {currentUser?.id && String(c?.fromUser?.id ?? c?.author?.id) === String(currentUser?.id) && (
                                    <button
                                      className="p-1 opacity-70 group-hover:opacity-100"
                                      title="Delete comment"
                                      onClick={() => handleDeleteCommentWithThread(c)}
                                    >
                                      <TrashBinTrash weight="Bold" color="red" size={20} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {editingComments[c.id] ? (
                                <div className="mt-1 space-y-2">
                                  <input
                                    type="text"
                                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
                                    value={editingComments[c.id].text}
                                    disabled={editingComments[c.id].saving}
                                    onChange={(e) => setEditingComments((prev) => ({ ...prev, [c.id]: { ...(prev[c.id] || { text: '', saving: false }), text: e.target.value } }))}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      disabled={!editingComments[c.id].text.trim() || editingComments[c.id].saving}
                                      onClick={async () => {
                                        if (!id) return;
                                        setEditingComments((prev) => ({ ...prev, [c.id]: { ...(prev[c.id] || { text: '', saving: false }), saving: true } }));
                                        try {
                                          await dispatch(updateTaskCommentAsync({ taskId: id, commentId: c.id, content: editingComments[c.id].text.trim() })).unwrap();
                                          setEditingComments((prev) => { const next = { ...prev }; delete next[c.id]; return next; });
                                        } catch (_) {
                                          setEditingComments((prev) => ({ ...prev, [c.id]: { ...(prev[c.id] || { text: '', saving: false }), saving: false } }));
                                        }
                                      }}
                                    >
                                      {editingComments[c.id].saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingComments((prev) => { const next = { ...prev }; delete next[c.id]; return next; })}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                              )}

                              {/* Reactions and actions */}
                              <div className="mt-2 flex items-center gap-3">
                                <button
                                  className={cn("inline-flex items-center gap-1 text-xs", reacted('thumbs_up') ? 'text-blue-600' : 'text-muted-foreground')}
                                  onClick={() => hasPermission('tasks', 'update') && toggleReaction(c.id, 'thumbs_up')}
                                >
                                  <solar.Like.Like className="size-4" weight={reacted('thumbs_up') ? 'Bold' : 'Linear'} /> {count('thumbs_up') || ''}
                                </button>
                                <button
                                  className={cn("inline-flex items-center gap-1 text-xs", reacted('heart') ? 'text-red-600' : 'text-muted-foreground')}
                                  onClick={() => hasPermission('tasks', 'update') && toggleReaction(c.id, 'heart')}
                                >
                                  <solar.Like.Heart className="size-4" weight={reacted('heart') ? 'Bold' : 'Linear'} /> {count('heart') || ''}
                                </button>
                                <button
                                  className={cn("inline-flex items-center gap-1 text-xs", reacted('laugh') ? 'text-amber-600' : 'text-muted-foreground')}
                                  onClick={() => hasPermission('tasks', 'update') && toggleReaction(c.id, 'laugh')}
                                >
                                  <solar.Faces.SmileCircle className="size-4" weight={reacted('laugh') ? 'Bold' : 'Linear'} /> {count('laugh') || ''}
                                </button>
                                {hasPermission('tasks', 'update') && (
                                  <button
                                    className="text-xs text-primary hover:underline"
                                    onClick={() => setReplyDrafts((prev) => ({ ...prev, [c.id]: prev[c.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' } }))}
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>

                              {/* Reply draft */}
                              {replyDrafts[c.id] && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Write a reply"
                                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                                      disabled={!hasPermission('tasks', 'update')}
                                      value={replyDrafts[c.id].text}
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        const match = text.match(/@([\w\s]*)$/);
                                        setReplyDrafts((prev) => ({
                                          ...prev,
                                          [c.id]: {
                                            ...(prev[c.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' }),
                                            text,
                                            mentionOpen: !!match,
                                            mentionQuery: match ? match[1].trim() : '',
                                          },
                                        }));
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      disabled={!replyDrafts[c.id].text.trim() || replyDrafts[c.id].posting || !hasPermission('tasks', 'update')}
                                      onClick={async () => {
                                        if (!id || !hasPermission('tasks', 'update')) return;
                                        setReplyDrafts((prev) => ({ ...prev, [c.id]: { ...(prev[c.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' }), posting: true } }));
                                        try {
                                          await dispatch(createTaskCommentAsync({ taskId: id, content: replyDrafts[c.id].text.trim(), parentId: c.id, mentionUserIds: replyDrafts[c.id].mentions })).unwrap();
                                          setReplyDrafts((prev) => ({ ...prev, [c.id]: { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' } }));
                                        } catch (_) {
                                          setReplyDrafts((prev) => ({ ...prev, [c.id]: { ...(prev[c.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' }), posting: false } }));
                                        }
                                      }}
                                    >
                                      {replyDrafts[c.id].posting ? 'Posting...' : 'Send'}
                                    </Button>
                                  </div>

                                  {/* Mention dropdown for reply */}
                                  {replyDrafts[c.id].mentionOpen && members.length > 0 && (
                                    <div className="border rounded-md bg-popover p-2 text-sm max-h-40 overflow-auto w-full md:w-1/2">
                                      {(members || [])
                                        .filter((m: any) => {
                                          const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
                                          return name.includes((replyDrafts[c.id].mentionQuery || '').toLowerCase());
                                        })
                                        .map((m: any) => (
                                          <button
                                            key={m.user.id}
                                            className="block w-full text-left px-2 py-1 hover:bg-muted"
                                            onClick={() => {
                                              const fullName = `${m.user.firstName} ${m.user.lastName}`;
                                              setReplyDrafts((prev) => {
                                                const curr = prev[c.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' };
                                                const replaced = curr.text.replace(/@([\w\s]*)$/, `@${fullName} `);
                                                const nextMentions = curr.mentions.includes(m.user.id) ? curr.mentions : [...curr.mentions, m.user.id];
                                                return {
                                                  ...prev,
                                                  [c.id]: { ...curr, text: replaced, mentions: nextMentions, mentionOpen: false, mentionQuery: '' },
                                                };
                                              });
                                            }}
                                          >
                                            {m.user.firstName} {m.user.lastName}
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Replies - nested with edit and reply */}
                              <div className="mt-3 ml-10 space-y-2">
                                {(threaded.byParent[c.id] || []).map((rc: any) => {
                                  const rAuthor = rc?.fromUser ? `${rc.fromUser.firstName} ${rc.fromUser.lastName}` : 'Unknown';
                                  const rAvatar = getAvatarData(rAuthor);
                                  const rCount = (t: string) => (rc.reactions || []).filter((r: any) => r?.type === t).length;
                                  const rReacted = (t: string) => (rc.reactions || []).some((r: any) => r?.type === t && r?.userId === currentUser?.id);
                                  const rOwn = !!currentUser?.id && String(rc?.fromUser?.id ?? rc?.author?.id) === String(currentUser.id);
                                  const rEditing = !!editingComments[rc.id];
                                  return (
                                    <div key={rc.id} className="flex items-start gap-3">
                                      <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium"
                                        style={{ backgroundColor: rAvatar.bgColor, color: rAvatar.color }}
                                        aria-label={rAuthor}
                                      >
                                        {rAvatar.initials}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm font-medium">
                                            {rAuthor}
                                            {rc?.updatedAt && (
                                              <span className="ml-2 text-xs text-muted-foreground">
                                                {new Date(rc.updatedAt).toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {String(rc?.fromUser?.id ?? rc?.author?.id) === String(currentUser?.id) && (
                                              <button
                                                className="p-1 text-primary hover:underline text-xs opacity-70 group-hover:opacity-100"
                                                title="Edit reply"
                                                onClick={() => setEditingComments((prev) => ({ ...prev, [rc.id]: { text: rc.content, saving: false } }))}
                                              >
                                                <Pen2 weight="Outline" color="blue" size={20} />
                                              </button>
                                            )}
                                            {rOwn && (
                                              <button
                                                className="p-1 opacity-70 group-hover:opacity-100"
                                                title="Delete reply"
                                                onClick={() => handleDeleteCommentWithThread(rc)}
                                              >
                                                <TrashBinTrash weight="Bold" color="red" size={20} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        {rEditing ? (
                                          <div className="mt-1 space-y-2">
                                            <input
                                              type="text"
                                              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
                                              value={editingComments[rc.id].text}
                                              disabled={editingComments[rc.id].saving}
                                              onChange={(e) => setEditingComments((prev) => ({ ...prev, [rc.id]: { ...(prev[rc.id] || { text: '', saving: false }), text: e.target.value } }))}
                                            />
                                            <div className="flex items-center gap-2">
                                              <Button
                                                size="sm"
                                                disabled={!editingComments[rc.id].text.trim() || editingComments[rc.id].saving}
                                                onClick={async () => {
                                                  if (!id) return;
                                                  setEditingComments((prev) => ({ ...prev, [rc.id]: { ...(prev[rc.id] || { text: '', saving: false }), saving: true } }));
                                                  try {
                                                    await dispatch(updateTaskCommentAsync({ taskId: id, commentId: rc.id, content: editingComments[rc.id].text.trim() })).unwrap();
                                                    setEditingComments((prev) => { const next = { ...prev }; delete next[rc.id]; return next; });
                                                  } catch (_) {
                                                    setEditingComments((prev) => ({ ...prev, [rc.id]: { ...(prev[rc.id] || { text: '', saving: false }), saving: false } }));
                                                  }
                                                }}
                                              >
                                                {editingComments[rc.id].saving ? 'Saving...' : 'Save'}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingComments((prev) => { const next = { ...prev }; delete next[rc.id]; return next; })}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-foreground whitespace-pre-wrap">{rc.content}</p>
                                        )}

                                        <div className="mt-2 flex items-center gap-3">
                                          <button
                                            className={cn("inline-flex items-center gap-1 text-xs", rReacted('thumbs_up') ? 'text-blue-600' : 'text-muted-foreground')}
                                            onClick={() => hasPermission('tasks', 'update') && toggleReaction(rc.id, 'thumbs_up')}
                                          >
                                            <solar.Like.Like className="size-4" weight={rReacted('thumbs_up') ? 'Bold' : 'Linear'} /> {rCount('thumbs_up') || ''}
                                          </button>
                                          <button
                                            className={cn("inline-flex items-center gap-1 text-xs", rReacted('heart') ? 'text-red-600' : 'text-muted-foreground')}
                                            onClick={() => hasPermission('tasks', 'update') && toggleReaction(rc.id, 'heart')}
                                          >
                                            <solar.Like.Heart className="size-4" weight={rReacted('heart') ? 'Bold' : 'Linear'} /> {rCount('heart') || ''}
                                          </button>
                                          <button
                                            className={cn("inline-flex items-center gap-1 text-xs", rReacted('laugh') ? 'text-amber-600' : 'text-muted-foreground')}
                                            onClick={() => hasPermission('tasks', 'update') && toggleReaction(rc.id, 'laugh')}
                                          >
                                            <solar.Faces.SmileCircle className="size-4" weight={rReacted('laugh') ? 'Bold' : 'Linear'} /> {rCount('laugh') || ''}
                                          </button>
                                          {hasPermission('tasks', 'update') && (
                                            <button
                                              className="text-xs text-primary hover:underline"
                                              onClick={() => setReplyDrafts((prev) => ({ ...prev, [rc.id]: prev[rc.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' } }))}
                                            >
                                              Reply
                                            </button>
                                          )}
                                        </div>

                                        {replyDrafts[rc.id] && (
                                          <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                placeholder="Write a reply"
                                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                                                disabled={!hasPermission('tasks', 'update')}
                                                value={replyDrafts[rc.id].text}
                                                onChange={(e) => {
                                                  const text = e.target.value;
                                                  const match = text.match(/@([\w\s]*)$/);
                                                  setReplyDrafts((prev) => ({
                                                    ...prev,
                                                    [rc.id]: {
                                                      ...(prev[rc.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' }),
                                                      text,
                                                      mentionOpen: !!match,
                                                      mentionQuery: match ? match[1].trim() : '',
                                                    },
                                                  }));
                                                }}
                                              />
                                              <Button
                                                size="sm"
                                                disabled={!replyDrafts[rc.id].text.trim() || replyDrafts[rc.id].posting || !hasPermission('tasks', 'update')}
                                                onClick={async () => {
                                                  if (!id || !hasPermission('tasks', 'update')) return;
                                                  setReplyDrafts((prev) => ({ ...prev, [rc.id]: { ...(prev[rc.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' }), posting: true } }));
                                                  try {
                                                    await dispatch(createTaskCommentAsync({ taskId: id, content: replyDrafts[rc.id].text.trim(), parentId: rc.id, mentionUserIds: replyDrafts[rc.id].mentions })).unwrap();
                                                    setReplyDrafts((prev) => ({ ...prev, [rc.id]: { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' } }));
                                                  } catch (_) {
                                                    setReplyDrafts((prev) => ({ ...prev, [rc.id]: { ...(prev[rc.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' }), posting: false } }));
                                                  }
                                                }}
                                              >
                                                {replyDrafts[rc.id].posting ? 'Posting...' : 'Send'}
                                              </Button>
                                            </div>

                                            {replyDrafts[rc.id].mentionOpen && members.length > 0 && (
                                              <div className="border rounded-md bg-popover p-2 text-sm max-h-40 overflow-auto w-full md:w-1/2">
                                                {(members || [])
                                                  .filter((m: any) => {
                                                    const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
                                                    return name.includes((replyDrafts[rc.id].mentionQuery || '').toLowerCase());
                                                  })
                                                  .map((m: any) => (
                                                    <button
                                                      key={m.user.id}
                                                      className="block w-full text-left px-2 py-1 hover:bg-muted"
                                                      onClick={() => {
                                                        const fullName = `${m.user.firstName} ${m.user.lastName}`;
                                                        setReplyDrafts((prev) => {
                                                          const curr = prev[rc.id] || { text: '', posting: false, mentions: [], mentionOpen: false, mentionQuery: '' };
                                                          const replaced = curr.text.replace(/@([\w\s]*)$/, `@${fullName} `);
                                                          const nextMentions = curr.mentions.includes(m.user.id) ? curr.mentions : [...curr.mentions, m.user.id];
                                                          return {
                                                            ...prev,
                                                            [rc.id]: { ...curr, text: replaced, mentions: nextMentions, mentionOpen: false, mentionQuery: '' },
                                                          };
                                                        });
                                                      }}
                                                    >
                                                      {m.user.firstName} {m.user.lastName}
                                                    </button>
                                                  ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Children of reply (second level) */}
                                        {(threaded.byParent[rc.id] || []).length > 0 && (
                                          <div className="mt-3 ml-10 space-y-2">
                                            {(threaded.byParent[rc.id] || []).map((rrc: any) => {
                                              const rrAuthor = rrc?.fromUser ? `${rrc.fromUser.firstName} ${rrc.fromUser.lastName}` : 'Unknown';
                                              const rrAvatar = getAvatarData(rrAuthor);
                                              const rrCount = (t: string) => (rrc.reactions || []).filter((r: any) => r?.type === t).length;
                                              const rrReacted = (t: string) => (rrc.reactions || []).some((r: any) => r?.type === t && r?.userId === currentUser?.id);
                                              const rrOwn = !!currentUser?.id && String(rrc?.fromUser?.id ?? rrc?.author?.id) === String(currentUser.id);
                                              const rrEditing = !!editingComments[rrc.id];
                                              return (
                                                <div key={rrc.id} className="flex items-start gap-3">
                                                  <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium"
                                                    style={{ backgroundColor: rrAvatar.bgColor, color: rrAvatar.color }}
                                                    aria-label={rrAuthor}
                                                  >
                                                    {rrAvatar.initials}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                      <div className="text-sm font-medium">
                                                        {rrAuthor}
                                                        {rrc?.updatedAt && (
                                                          <span className="ml-2 text-xs text-muted-foreground">
                                                            {new Date(rrc.updatedAt).toLocaleString()}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        {rrOwn && (
                                                          <button
                                                            className="p-1 text-primary hover:underline text-[10px] opacity-70 group-hover:opacity-100"
                                                            title="Edit reply"
                                                            onClick={() => setEditingComments((prev) => ({ ...prev, [rrc.id]: { text: rrc.content, saving: false } }))}
                                                          >
                                                            <Pen2 weight="Outline" color="blue" size={16} />
                                                          </button>
                                                        )}
                                                        {rrOwn && (
                                                          <button
                                                            className="p-1 opacity-70 group-hover:opacity-100"
                                                            title="Delete reply"
                                                            onClick={() => handleDeleteCommentWithThread(rrc)}
                                                          >
                                                            <TrashBinTrash weight="Bold" color="red" size={16} />
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {rrEditing ? (
                                                      <div className="mt-1 space-y-2">
                                                        <input
                                                          type="text"
                                                          className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm w-full"
                                                          value={editingComments[rrc.id].text}
                                                          disabled={editingComments[rrc.id].saving}
                                                          onChange={(e) => setEditingComments((prev) => ({ ...prev, [rrc.id]: { ...(prev[rrc.id] || { text: '', saving: false }), text: e.target.value } }))}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                          <Button
                                                            size="sm"
                                                            disabled={!editingComments[rrc.id].text.trim() || editingComments[rrc.id].saving}
                                                            onClick={async () => {
                                                              if (!id) return;
                                                              setEditingComments((prev) => ({ ...prev, [rrc.id]: { ...(prev[rrc.id] || { text: '', saving: false }), saving: true } }));
                                                              try {
                                                                await dispatch(updateTaskCommentAsync({ taskId: id, commentId: rrc.id, content: editingComments[rrc.id].text.trim() })).unwrap();
                                                                setEditingComments((prev) => { const next = { ...prev }; delete next[rrc.id]; return next; });
                                                              } catch (_) {
                                                                setEditingComments((prev) => ({ ...prev, [rrc.id]: { ...(prev[rrc.id] || { text: '', saving: false }), saving: false } }));
                                                              }
                                                            }}
                                                          >
                                                            {editingComments[rrc.id].saving ? 'Saving...' : 'Save'}
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingComments((prev) => { const next = { ...prev }; delete next[rrc.id]; return next; })}
                                                          >
                                                            Cancel
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <p className="text-sm text-foreground whitespace-pre-wrap">{rrc.content}</p>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-3">
                                                      <button
                                                        className={cn("inline-flex items-center gap-1 text-xs", rrReacted('thumbs_up') ? 'text-blue-600' : 'text-muted-foreground')}
                                                        onClick={() => hasPermission('tasks', 'update') && toggleReaction(rrc.id, 'thumbs_up')}
                                                      >
                                                        <solar.Like.Like className="size-4" weight={rrReacted('thumbs_up') ? 'Bold' : 'Linear'} /> {rrCount('thumbs_up') || ''}
                                                      </button>
                                                      <button
                                                        className={cn("inline-flex items-center gap-1 text-xs", rrReacted('heart') ? 'text-red-600' : 'text-muted-foreground')}
                                                        onClick={() => hasPermission('tasks', 'update') && toggleReaction(rrc.id, 'heart')}
                                                      >
                                                        <solar.Like.Heart className="size-4" weight={rrReacted('heart') ? 'Bold' : 'Linear'} /> {rrCount('heart') || ''}
                                                      </button>
                                                      <button
                                                        className={cn("inline-flex items-center gap-1 text-xs", rrReacted('laugh') ? 'text-amber-600' : 'text-muted-foreground')}
                                                        onClick={() => hasPermission('tasks', 'update') && toggleReaction(rrc.id, 'laugh')}
                                                      >
                                                        <solar.Faces.SmileCircle className="size-4" weight={rrReacted('laugh') ? 'Bold' : 'Linear'} /> {rrCount('laugh') || ''}
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2 relative">
                  <input
                    type="text"
                    placeholder="Add a comment"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!hasPermission('tasks', 'update')}
                  />
                  <Button size="sm" onClick={handlePostComment} disabled={!newComment.trim() || postingComment || !hasPermission('tasks', 'update')}>
                    {postingComment ? "Posting..." : "Post"}
                  </Button>
                </div>

                {/* Mention dropdown for main composer */}
                {mentionOpen && members.length > 0 && (
                  <div className="border rounded-md bg-popover p-2 text-sm max-h-40 overflow-auto w-full md:w-1/2">
                    {(members || [])
                      .filter((m: any) => {
                        const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
                        return name.includes((mentionQuery || '').toLowerCase());
                      })
                      .map((m: any) => (
                        <button
                          key={m.user.id}
                          className="block w-full text-left px-2 py-1 hover:bg-muted"
                          onClick={() => handleSelectMentionMain(m.user)}
                        >
                          {m.user.firstName} {m.user.lastName}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right column (Task Info) */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard className="p-4 md:p-6">
              <h2 className="font-medium mb-4">Task Info</h2>
              <div className="space-y-3 text-sm">
                {/* Status removed as per request */}
                <InfoRow label="Project">
                  <div className="flex items-center gap-2">
                    <span>{task?.project?.name || '-'}</span>
                  </div>
                </InfoRow>
                {task?.parentId && (
                  <InfoRow label="Parent Task">
                    <Link to={`/tasks/${task.parentId}`} className="text-primary hover:underline">
                      {task.parent?.title || parentTitle || 'Open Parent'}
                    </Link>
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
                    <button className="flex items-center gap-2" onClick={() => hasPermission('tasks', 'update') && setEditingAssignee(true)}>
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
                    <button className="flex items-center gap-2" onClick={() => hasPermission('tasks', 'update') && setEditingDueDate(true)}>
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
                      onClick={() => hasPermission('tasks', 'update') && setEditingPriority(true)}
                      title={task?.priority || 'MEDIUM'}
                    >
                      {task?.priority}
                    </button>
                  )}
                </InfoRow>
                {/* Add Subtask removed from Task Info to avoid duplication */}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Add Sub-task dialog */}
      {task && canAddSubtask && (
        <AddTaskDialog
          open={isAddSubtaskOpen}
          onOpenChange={(open) => setIsAddSubtaskOpen(open)}
          projectId={task.project?.id || ''}
          fromProject
          initialStatus="TODO"
          parentId={task.id}
          onSuccess={() => { setIsAddSubtaskOpen(false); if (id) dispatch(fetchSubtasksByParent(id)); }}
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