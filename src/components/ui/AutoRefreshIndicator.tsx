'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IconRefresh, IconCheck } from '@tabler/icons-react';

interface AutoRefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefresh: Date;
  interval?: number;
  onManualRefresh?: () => void;
  className?: string;
}

const AutoRefreshIndicator: React.FC<AutoRefreshIndicatorProps> = ({
  isRefreshing,
  lastRefresh,
  interval = 30,
  onManualRefresh,
  className = '',
}) => {
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (isRefreshing) {
      setProgress(100);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diff = (now.getTime() - lastRefresh.getTime()) / 1000;
      const newProgress = Math.max(0, 100 - (diff / interval) * 100);
      setProgress(newProgress);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRefreshing, lastRefresh, interval]);

  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-primary/20 transition-all ${className}`}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Progress Circle Background */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200 dark:text-gray-700"
          />
          <motion.circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="88"
            animate={{ strokeDashoffset: 88 - (88 * progress) / 100 }}
            className="text-primary"
          />
        </svg>

        <button
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className={`relative z-10 flex items-center justify-center transition-transform active:scale-90 ${isRefreshing ? 'animate-spin' : ''}`}
        >
          {isRefreshing ? (
            <IconRefresh className="w-4 h-4 text-primary" />
          ) : (
            <IconCheck className="w-4 h-4 text-emerald-500" />
          )}
        </button>
      </div>

      <div className="hidden sm:block">
        <p className="text-[10px] font-black uppercase tracking-widest text-bodytext leading-none mb-1">
          {isRefreshing ? 'Updating...' : 'Live Sync'}
        </p>
        <p className="text-[10px] font-medium text-bodytext opacity-60 leading-none">
          Next: {Math.ceil((progress / 100) * interval)}s
        </p>
      </div>
    </div>
  );
};

export default AutoRefreshIndicator;
