'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StatusBadge } from '.';
import { StatusType } from './StatusBadge';

interface LegendItem {
  status: StatusType | string;
  count: number;
}

interface SmartLegendProps {
  items: LegendItem[];
  className?: string;
}

const SmartLegend: React.FC<SmartLegendProps> = ({ items, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm"
        >
          <StatusBadge status={item.status} size="xs" showDot={true} />
          <span className="text-xs font-black text-dark dark:text-white">
            {item.count}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default SmartLegend;
