import React from 'react';
import { cn } from '@/lib/utils';

// Normalize backend status codes to human-friendly labels used across the app
const normalizeStatusLabel = (status: string): 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' => {
  const codeMap: Record<string, 'Not Started' | 'In Progress' | 'On Hold' | 'Completed'> = {
    TODO: 'Not Started',
    IN_PROGRESS: 'In Progress',
    DONE: 'Completed',
    CANCELLED: 'On Hold',
  };
  const labelMap: Record<string, 'Not Started' | 'In Progress' | 'On Hold' | 'Completed'> = {
    'Not Started': 'Not Started',
    'In Progress': 'In Progress',
    'On Hold': 'On Hold',
    'Completed': 'Completed',
  };
  return codeMap[status] || labelMap[status] || 'Not Started';
};

const statusConfig: Record<'Not Started' | 'In Progress' | 'On Hold' | 'Completed', { bg: string; text: string; label: string }> = {
  'Not Started': {
    bg: 'bg-gray-200',
    text: 'text-[#1a2624]',
    label: 'Not Started',
  },
  'In Progress': {
    bg: 'bg-[#e0f3ff]',
    text: 'text-[#6c96b0]',
    label: 'In Progress',
  },
  'On Hold': {
    bg: 'bg-[#fef3e2]',
    text: 'text-[#f59e0b]',
    label: 'On Hold',
  },
  'Completed': {
    bg: 'bg-[#eaf6ec]',
    text: 'text-[#27ae60]',
    label: 'Completed',
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const label = normalizeStatusLabel(status);
  const config = statusConfig[label];
  return (
    <div className={cn("px-1.5 sm:px-2 py-0.5 rounded-sm inline-flex items-center max-w-full whitespace-nowrap overflow-hidden w-fit", config.bg, className)}>
      <div className={cn("text-center text-xs font-normal font-['Manrope'] leading-none truncate", config.text)}>
        {config.label}
      </div>
    </div>
  );
};

export default StatusBadge;
export { normalizeStatusLabel };