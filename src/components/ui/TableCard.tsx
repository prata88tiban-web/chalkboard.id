'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconToolsKitchen2,
  IconClock,
  IconTransfer,
  IconEdit,
  IconTrash,
  IconCurrencyDollar,
  IconUser,
  IconPackage,
  IconChevronDown,
  IconChevronUp,
  IconPin,
  IconPinFilled,
  IconInfoCircle,
} from '@tabler/icons-react';
import StatusBadge from './StatusBadge';
import Tooltip from './Tooltip';
import IconButton from './IconButton';

export interface TableSession {
  id: number;
  customerName: string;
  startTime: string;
  plannedDuration: number;
  durationType?: 'hourly' | 'per_minute';
}

export interface PricingPackage {
  id: string;
  name: string;
  category: string;
  hourlyRate?: string;
  perMinuteRate?: string;
  isDefault?: boolean;
}

export interface BilliardTable {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  pricingPackage?: PricingPackage;
}

export interface TableCardProps {
  table: BilliardTable;
  session?: TableSession;
  currentTime: Date;
  isPinned?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onFnb?: () => void;
  onDuration?: () => void;
  onMove?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  formatCurrency: (amount: number | string) => string;
  translations: {
    startTime: string;
    endTime: string;
    duration: string;
    cost: string;
    start: string;
    stop: string;
    fnb: string;
    edit: string;
    delete: string;
    move: string;
    available: string;
    occupied: string;
    maintenance: string;
    reserved: string;
  };
}

// Vibrant color variants for cards based on status
const cardColors: Record<string, { gradient: string; border: string; shadow: string; accent: string; text: string }> = {
  available: {
    gradient: 'from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-gray-900 dark:to-emerald-950/10',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    shadow: 'shadow-emerald-500/5 hover:shadow-emerald-500/20',
    accent: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  occupied: {
    gradient: 'from-rose-50 via-white to-rose-50/30 dark:from-rose-950/20 dark:via-gray-900 dark:to-rose-950/10',
    border: 'border-rose-200 dark:border-rose-800/50',
    shadow: 'shadow-rose-500/5 hover:shadow-rose-500/20',
    accent: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
  },
  maintenance: {
    gradient: 'from-amber-50 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-gray-900 dark:to-amber-950/10',
    border: 'border-amber-200 dark:border-amber-800/50',
    shadow: 'shadow-amber-500/5 hover:shadow-amber-500/20',
    accent: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
  reserved: {
    gradient: 'from-sky-50 via-white to-sky-50/30 dark:from-sky-950/20 dark:via-gray-900 dark:to-sky-950/10',
    border: 'border-sky-200 dark:border-sky-800/50',
    shadow: 'shadow-sky-500/5 hover:shadow-sky-500/20',
    accent: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
  },
};

const TableCard: React.FC<TableCardProps> = ({
  table,
  session,
  currentTime,
  isPinned = false,
  onStart,
  onStop,
  onFnb,
  onDuration,
  onMove,
  onEdit,
  onDelete,
  onPin,
  formatCurrency,
  translations: t,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOccupied = table.status === 'occupied';
  const colors = cardColors[table.status] || cardColors.available;

  // Calculate elapsed time
  const calculateElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    return Math.floor((currentTime.getTime() - start.getTime()) / 1000);
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const calculateCost = () => {
    if (!session || !table.pricingPackage) return 0;
    const elapsed = calculateElapsedTime(session.startTime);
    const pkg = table.pricingPackage;
    
    if (pkg.category === 'per_minute') {
      const rate = parseFloat(pkg.perMinuteRate || '0');
      const minutes = Math.ceil(elapsed / 60);
      return minutes * rate;
    } else {
      const rate = parseFloat(pkg.hourlyRate || '0');
      const hours = Math.ceil(elapsed / 3600);
      return hours * rate;
    }
  };

  const elapsedTime = session ? calculateElapsedTime(session.startTime) : 0;
  const cost = calculateCost();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative rounded-2xl overflow-hidden
        bg-gradient-to-br ${colors.gradient}
        border-2 ${colors.border}
        shadow-lg ${colors.shadow}
        transition-all duration-300
        ${isPinned ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}
      `}
    >
      {/* Dynamic Status Header */}
      <div className={`h-1.5 w-full ${colors.accent}`} />

      {/* Pin & Info Buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <Tooltip content="Quick Info" position="left">
          <button className="p-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 text-bodytext hover:text-primary transition-all">
            <IconInfoCircle className="w-4 h-4" />
          </button>
        </Tooltip>
        <button
          onClick={onPin}
          className={`
            p-1.5 rounded-lg transition-all duration-200
            ${isPinned
              ? 'bg-primary text-white shadow-md'
              : 'bg-white/80 dark:bg-gray-800/80 text-bodytext hover:text-primary'
            }
          `}
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          {isPinned ? <IconPinFilled className="w-4 h-4" /> : <IconPin className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-4">
        {/* Table Identity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-black text-dark dark:text-white tracking-tight">
              {table.name}
            </h3>
            <StatusBadge status={table.status} size="xs" pulse={isOccupied} />
          </div>

          {table.pricingPackage && (
            <div className="flex items-center gap-1.5">
              <IconPackage className="w-3.5 h-3.5 text-bodytext" />
              <span className="text-[11px] font-bold text-bodytext uppercase tracking-wider">
                {table.pricingPackage.name}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Content Area */}
        <AnimatePresence mode="wait">
          {isOccupied && session ? (
            <motion.div
              key="occupied"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Customer Chip */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <div className={`p-1.5 rounded-lg ${colors.accent} bg-opacity-10`}>
                  <IconUser className={`w-4 h-4 ${colors.text}`} />
                </div>
                <span className="text-sm font-bold text-dark dark:text-white truncate">
                  {session.customerName}
                </span>
              </div>

              {/* Time Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-100/50 dark:border-gray-700/30">
                  <p className="text-[9px] font-black uppercase text-bodytext tracking-tighter mb-1 opacity-60">
                    {t.startTime}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <IconClock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-black text-dark dark:text-white font-mono">
                      {formatTime(session.startTime)}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-100/50 dark:border-gray-700/30">
                  <p className="text-[9px] font-black uppercase text-bodytext tracking-tighter mb-1 opacity-60">
                    {t.duration}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <IconClock className="w-3.5 h-3.5 text-rose-500" />
                    </motion.div>
                    <span className="text-sm font-black text-dark dark:text-white font-mono">
                      {formatDuration(elapsedTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="relative overflow-hidden p-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <IconCurrencyDollar className="w-12 h-12" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                  Current Billing
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">
                    {formatCurrency(cost)}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="available"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="py-8 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className={`w-16 h-16 rounded-3xl ${colors.accent} bg-opacity-10 flex items-center justify-center`}>
                <IconPlayerPlay className={`w-8 h-8 ${colors.text} opacity-40`} />
              </div>
              <div>
                <p className="text-sm font-bold text-dark dark:text-white">Ready for Action</p>
                <p className="text-xs text-bodytext">Click start to open session</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            {isOccupied ? (
              <>
                <button
                  onClick={onFnb}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <IconToolsKitchen2 className="w-4 h-4" />
                  {t.fnb}
                </button>
                <button
                  onClick={onStop}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm transition-all shadow-md shadow-rose-500/20 active:scale-95"
                >
                  <IconPlayerStop className="w-4 h-4" />
                  {t.stop}
                </button>
              </>
            ) : (
              <button
                onClick={onStart}
                disabled={table.status === 'maintenance'}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-black text-base transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <IconPlayerPlay className="w-5 h-5" />
                {t.start}
              </button>
            )}
          </div>

          {/* Collapsible Sub-actions */}
          <div className="pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-bodytext hover:text-dark dark:hover:text-white transition-colors"
            >
              {isExpanded ? <IconChevronUp className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
              {isExpanded ? 'Show Less' : 'More Options'}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 mt-3 p-1">
                    {isOccupied ? (
                      <>
                        <IconButton
                          icon={<IconClock />}
                          onClick={onDuration}
                          variant="secondary"
                          size="md"
                          tooltip="Manage Timer"
                          className="flex-1 rounded-xl"
                        />
                        <IconButton
                          icon={<IconTransfer />}
                          onClick={onMove}
                          variant="secondary"
                          size="md"
                          tooltip="Move Table"
                          className="flex-1 rounded-xl"
                        />
                      </>
                    ) : (
                      <>
                        <IconButton
                          icon={<IconEdit />}
                          onClick={onEdit}
                          variant="secondary"
                          size="md"
                          tooltip="Edit Table"
                          className="flex-1 rounded-xl"
                        />
                        <IconButton
                          icon={<IconTrash />}
                          onClick={onDelete}
                          variant="error"
                          size="md"
                          tooltip="Delete Table"
                          className="flex-1 rounded-xl"
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TableCard;
