'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-wrap items-center gap-4 p-4
        bg-white dark:bg-gray-900
        border border-gray-100 dark:border-gray-800
        rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

interface ToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

export const ToolbarDivider: React.FC = () => {
  return (
    <div className="hidden lg:block w-px h-10 bg-gray-100 dark:bg-gray-800 mx-2" />
  );
};
