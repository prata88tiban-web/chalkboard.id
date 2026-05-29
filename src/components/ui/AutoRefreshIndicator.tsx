'use client';

import React from 'react';
import { IconRefresh } from '@tabler/icons-react';

interface AutoRefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefresh?: Date;
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
  const formatLastRefresh = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={onManualRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${isRefreshing
            ? 'bg-primary/10 text-primary cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-800 text-bodytext hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        title="Click to refresh manually"
      >
        <IconRefresh
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>
      
      {lastRefresh && !isRefreshing && (
        <span className="text-xs text-bodytext">
          Last: {formatLastRefresh(lastRefresh)} | Auto: {interval}s
        </span>
      )}
      
      {/* Live indicator dot */}
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
    </div>
  );
};

export default AutoRefreshIndicator;
