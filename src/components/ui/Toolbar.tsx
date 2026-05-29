'use client';

import React from 'react';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

interface ToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface ToolbarDividerProps {
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        flex items-center gap-3 p-4
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

export const ToolbarDivider: React.FC<ToolbarDividerProps> = ({ className = '' }) => {
  return (
    <div className={`h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 ${className}`} />
  );
};

export default Toolbar;
