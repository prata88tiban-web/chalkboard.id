'use client';

import React from 'react';
import { IconQuestionMark, IconInfoCircle, IconBulb } from '@tabler/icons-react';

type HintType = 'info' | 'tip' | 'help';

interface HintProps {
  type?: HintType;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const hintConfig: Record<HintType, { bg: string; border: string; icon: React.ReactNode; iconBg: string }> = {
  info: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-100 dark:bg-sky-800',
    icon: <IconInfoCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  },
  tip: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-800',
    icon: <IconBulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  help: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-800',
    icon: <IconQuestionMark className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
  },
};

const Hint: React.FC<HintProps> = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const config = hintConfig[type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border
        ${config.bg} ${config.border} ${className}
      `}
      role="note"
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-dark dark:text-white text-sm mb-1">{title}</p>
        )}
        <div className="text-sm text-bodytext">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <svg className="w-4 h-4 text-bodytext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Hint;
