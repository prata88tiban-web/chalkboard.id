'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const variants = {
  default: 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800',
  primary: 'bg-primary/5 border-primary/20',
  secondary: 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700',
  glass: 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-white/20 dark:border-gray-700/30',
  outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
};

const paddings = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' } : {}}
      className={`
        rounded-[32px] border shadow-sm transition-all duration-300
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;
