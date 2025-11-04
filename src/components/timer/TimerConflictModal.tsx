import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ActionButton from "@/components/ui/ActionButton";
import { Clock, AlertTriangle } from "lucide-react";

interface TimerConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStopAndStart: () => void;
  onContinueCurrent: () => void;
  currentTask?: {
    title?: string;
    project?: { name?: string };
  };
  newTask?: {
    title?: string;
    project?: { name?: string };
  };
  elapsedTime?: string;
}

export const TimerConflictModal: React.FC<TimerConflictModalProps> = ({
  isOpen,
  onClose,
  onStopAndStart,
  onContinueCurrent,
  currentTask,
  newTask,
  elapsedTime = "00:00:00",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-5/6 md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Timer Already Running
          </DialogTitle>
          <DialogDescription>
            You already have a timer running for another task. Do you want to stop the current timer and start a new one?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Current Timer Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="size-4" />
              Currently Running Timer
            </div>
            <div className="text-sm">
              <div className="font-medium">
                {currentTask?.title || "Unknown Task"}
              </div>
              {currentTask?.project?.name && (
                <div className="text-muted-foreground">
                  Project: {currentTask.project.name}
                </div>
              )}
              <div className="text-primary font-mono text-lg mt-1">
                {elapsedTime}
              </div>
            </div>
          </div>

          {/* New Timer Info */}
          {newTask && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-primary">
                New Timer Request
              </div>
              <div className="text-sm">
                <div className="font-medium">
                  {newTask.title || "Unknown Task"}
                </div>
                {newTask.project?.name && (
                  <div className="text-muted-foreground">
                    Project: {newTask.project.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <ActionButton
            variant="primary"
            onClick={onStopAndStart}
            text="Yes, Stop Current & Start New Timer"
            className="w-full"
          />
          <ActionButton
            variant="secondary"
            onClick={onContinueCurrent}
            text="No, Continue Current Timer"
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};