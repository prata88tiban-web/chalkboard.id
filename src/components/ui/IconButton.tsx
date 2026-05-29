'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20',
  error: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20',
  ghost: 'bg-transparent text-bodytext hover:bg-gray-100 dark:hover:bg-gray-800',
  glass: 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20',
};

const sizeStyles = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-11 h-11 rounded-2xl',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-16 h-16 rounded-3xl',
};

const iconSizeStyles = {
  xs: '[&>svg]:w-3.5 [&>svg]:h-3.5',
  sm: '[&>svg]:w-4.5 [&>svg]:h-4.5',
  md: '[&>svg]:w-5.5 [&>svg]:h-5.5',
  lg: '[&>svg]:w-7 [&>svg]:h-7',
  xl: '[&>svg]:w-8 [&>svg]:h-8',
};

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  tooltip,
  className = '',
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary/40
        disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${iconSizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <svg
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
    </motion.button>
  );
};

export default IconButton;
