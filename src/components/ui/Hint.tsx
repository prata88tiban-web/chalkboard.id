'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconInfoCircle, IconAlertCircle, IconCheck, IconBulb, IconX } from '@tabler/icons-react';

interface HintProps {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const hintConfig = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    text: 'text-blue-800 dark:text-blue-300',
    icon: <IconInfoCircle className="w-5 h-5" />,
    accent: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    text: 'text-amber-800 dark:text-amber-300',
    icon: <IconAlertCircle className="w-5 h-5" />,
    accent: 'bg-amber-500',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: <IconCheck className="w-5 h-5" />,
    accent: 'bg-emerald-500',
  },
  tip: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800/50',
    text: 'text-violet-800 dark:text-violet-300',
    icon: <IconBulb className="w-5 h-5" />,
    accent: 'bg-violet-500',
  },
};

const Hint: React.FC<HintProps> = ({
  children,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const config = hintConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        relative overflow-hidden p-4 rounded-2xl border-2
        ${config.bg} ${config.border} ${className}
        shadow-sm flex gap-4
      `}
    >
      {/* Accent Strip */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${config.accent}`} />

      <div className={`flex-shrink-0 mt-0.5 ${config.text}`}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${config.text}`}>
            {title}
          </h4>
        )}
        <div className={`text-sm font-medium leading-relaxed ${config.text} opacity-90`}>
          {children}
        </div>
      </div>

      {dismissible && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${config.text}`}
        >
          <IconX className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export default Hint;
