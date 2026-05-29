'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClock } from '@tabler/icons-react';
import Card from './Card';

export interface ActivityItem {
  id: string;
  type: 'session_start' | 'session_end' | 'fnb_order' | 'payment';
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, title = 'Recent Activity' }) => {
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-dark dark:text-white tracking-tight">
          {title}
        </h3>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <IconClock size={20} className="text-bodytext" />
        </div>
      </div>

      <div className="space-y-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />

        <AnimatePresence initial={false}>
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 relative z-10"
              >
                <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-black text-dark dark:text-white truncate">
                      {activity.title}
                    </h4>
                    <span className="text-[10px] font-bold text-bodytext opacity-60 flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-bodytext leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-bodytext opacity-40">No recent activity</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityFeed;
