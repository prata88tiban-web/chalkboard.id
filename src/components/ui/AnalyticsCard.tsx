'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from '@tabler/icons-react';
import Card from './Card';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  icon: React.ElementType;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  error: 'bg-rose-500/10 text-rose-500',
  info: 'bg-sky-500/10 text-sky-500',
};

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'primary',
  loading = false,
}) => {
  return (
    <Card hover padding="md" className="relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} stroke={2} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-black ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span>{trend.isUp ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-60 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-black text-dark dark:text-white mb-1">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
          ) : (
            value
          )}
        </h3>
        {subtitle && (
          <p className="text-xs font-bold text-bodytext opacity-80">
            {subtitle}
          </p>
        )}
      </div>

      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={120} stroke={1} />
      </div>
    </Card>
  );
};

export default AnalyticsCard;
