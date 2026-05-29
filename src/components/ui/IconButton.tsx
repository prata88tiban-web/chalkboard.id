'use client';

import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
  error: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
  ghost: 'bg-transparent text-bodytext hover:bg-gray-100 dark:hover:bg-gray-800',
};

const sizeStyles = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizeStyles = {
  xs: '[&>svg]:w-3.5 [&>svg]:h-3.5',
  sm: '[&>svg]:w-4 [&>svg]:h-4',
  md: '[&>svg]:w-5 [&>svg]:h-5',
  lg: '[&>svg]:w-6 [&>svg]:h-6',
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
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      className={`
        inline-flex items-center justify-center rounded-xl
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary/50
        disabled:opacity-50 disabled:cursor-not-allowed
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
    </button>
  );
};

export default IconButton;
