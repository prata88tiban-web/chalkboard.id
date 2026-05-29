'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type StatusType = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'pending' | 'completed' | 'cancelled' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  available: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    label: 'Available',
  },
  occupied: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    label: 'Occupied',
  },
  maintenance: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    label: 'Maintenance',
  },
  reserved: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    label: 'Reserved',
  },
  pending: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    label: 'Pending',
  },
  completed: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-500',
    label: 'Cancelled',
  },
  active: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    label: 'Inactive',
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

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  pulse = false,
  className = '',
  showDot = true,
}) => {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-500',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider
        shadow-sm transition-all duration-300
        ${config.bg} ${config.text} ${sizeConfig[size]} ${className}
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
      {config.label}
    </motion.span>
  );
};

export default StatusBadge;
