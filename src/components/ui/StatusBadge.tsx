'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  IconCheck,
  IconX,
  IconClock,
  IconTools,
  IconUsers,
  IconPlayerPlay,
  IconAlertTriangle,
  IconTrophy,
  IconStar,
  IconBrush,
  IconHourglassLow,
} from '@tabler/icons-react';

export type StatusType =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'reserved'
  | 'cleaning'
  | 'waiting'
  | 'overtime'
  | 'vip'
  | 'tournament'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  showDot?: boolean;
  showIcon?: boolean;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string; icon: React.ElementType; glow?: string }
> = {
  available: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    label: 'Available',
    icon: IconCheck,
    glow: 'shadow-emerald-500/20',
  },
  occupied: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    label: 'Occupied',
    icon: IconPlayerPlay,
    glow: 'shadow-rose-500/20',
  },
  maintenance: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    label: 'Maintenance',
    icon: IconTools,
    glow: 'shadow-amber-500/20',
  },
  reserved: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    label: 'Reserved',
    icon: IconClock,
    glow: 'shadow-sky-500/20',
  },
  cleaning: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    label: 'Cleaning',
    icon: IconBrush,
    glow: 'shadow-blue-500/20',
  },
  waiting: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    label: 'Waiting',
    icon: IconHourglassLow,
    glow: 'shadow-indigo-500/20',
  },
  overtime: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    label: 'Overtime',
    icon: IconAlertTriangle,
    glow: 'shadow-orange-500/40',
  },
  vip: {
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-500',
    label: 'VIP',
    icon: IconStar,
    glow: 'shadow-fuchsia-500/40',
  },
  tournament: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    label: 'Tournament',
    icon: IconTrophy,
    glow: 'shadow-violet-500/40',
  },
  cleaning: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
    label: 'Cleaning',
  },
  overtime: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    label: 'Overtime',
  },
  paused: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
    label: 'Paused',
  },
  tournament: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    label: 'Tournament',
  },
  payment_pending: {
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-500',
    label: 'Payment Pending',
  },
  pending: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    label: 'Pending',
    icon: IconClock,
  },
  completed: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
    label: 'Completed',
    icon: IconCheck,
  },
  cancelled: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-500',
    label: 'Cancelled',
    icon: IconX,
  },
  active: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
    label: 'Active',
    icon: IconUsers,
  },
  inactive: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    label: 'Inactive',
    icon: IconX,
  },
};

const sizeConfig = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-sm',
};

const dotSizeConfig = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

const iconSizeConfig = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  pulse = false,
  className = '',
  showDot = true,
  showIcon = false,
}) => {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-500',
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: IconAlertTriangle,
  };

  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider
        shadow-sm transition-all duration-300
        ${config.bg} ${config.text} ${sizeConfig[size]} ${config.glow || ''} ${className}
      `}
    >
      {showDot && (
        <span className={`relative flex ${dotSizeConfig[size]}`}>
          <span className={`rounded-full ${config.dot} w-full h-full`} />
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75 animate-ping`}
            />
          )}
        </span>
      )}
      {showIcon && <Icon size={iconSizeConfig[size]} className="opacity-80" />}
      {config.label}
    </motion.span>
  );
};

export default StatusBadge;
