'use client';

import React, { useState } from 'react';
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

// Color variants for cards based on status
const cardColors: Record<string, { gradient: string; border: string; shadow: string }> = {
  available: {
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-200 dark:border-emerald-800',
    shadow: 'shadow-emerald-500/10',
  },
  occupied: {
    gradient: 'from-rose-500/10 to-rose-600/5',
    border: 'border-rose-200 dark:border-rose-800',
    shadow: 'shadow-rose-500/10',
  },
  maintenance: {
    gradient: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-200 dark:border-amber-800',
    shadow: 'shadow-amber-500/10',
  },
  reserved: {
    gradient: 'from-sky-500/10 to-sky-600/5',
    border: 'border-sky-200 dark:border-sky-800',
    shadow: 'shadow-sky-500/10',
  },
};

const statusHeaderColors: Record<string, string> = {
  available: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  occupied: 'bg-gradient-to-r from-rose-500 to-rose-600',
  maintenance: 'bg-gradient-to-r from-amber-500 to-amber-600',
  reserved: 'bg-gradient-to-r from-sky-500 to-sky-600',
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
  const headerColor = statusHeaderColors[table.status] || statusHeaderColors.available;

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
    <div
      className={`
        relative rounded-2xl overflow-hidden
        bg-gradient-to-br ${colors.gradient}
        border-2 ${colors.border}
        shadow-lg ${colors.shadow}
        transition-all duration-300 ease-out
        hover:shadow-xl hover:-translate-y-1
        ${isPinned ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
      role="article"
      aria-label={`${table.name} - ${table.status}`}
    >
      {/* Status Header Bar */}
      <div className={`h-1.5 w-full ${headerColor}`} />

      {/* Pin Button */}
      <button
        onClick={onPin}
        className={`
          absolute top-3 right-3 z-10 p-1.5 rounded-lg
          transition-all duration-200
          ${isPinned 
            ? 'bg-primary text-white' 
            : 'bg-white/80 dark:bg-gray-800/80 text-bodytext hover:text-primary'
          }
        `}
        title={isPinned ? 'Unpin table' : 'Pin table'}
      >
        {isPinned ? <IconPinFilled className="w-4 h-4" /> : <IconPin className="w-4 h-4" />}
      </button>

      {/* Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-dark dark:text-white truncate">
              {table.name}
            </h3>
            
            {/* Pricing Package Info */}
            {table.pricingPackage && (
              <div className="flex items-center gap-1.5 mt-1">
                <IconPackage className="w-3.5 h-3.5 text-bodytext" />
                <span className="text-xs text-bodytext truncate">
                  {table.pricingPackage.name}
                </span>
                {table.pricingPackage.isDefault && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                    Default
                  </span>
                )}
              </div>
            )}

            {/* Customer Name */}
            {isOccupied && session && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <IconUser className="w-3.5 h-3.5 text-bodytext" />
                <span className="text-sm font-medium text-dark dark:text-white truncate">
                  {session.customerName}
                </span>
              </div>
            )}
          </div>

          <StatusBadge
            status={table.status}
            size="sm"
            pulse={isOccupied}
          />
        </div>

        {/* Session Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
            <p className="text-[10px] uppercase tracking-wide text-bodytext mb-0.5">
              {t.startTime}
            </p>
            <p className="text-sm font-semibold text-dark dark:text-white font-mono">
              {isOccupied && session ? formatTime(session.startTime) : '--:--'}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
            <p className="text-[10px] uppercase tracking-wide text-bodytext mb-0.5">
              {t.duration}
            </p>
            <p className="text-sm font-semibold text-dark dark:text-white font-mono">
              {isOccupied && session ? formatDuration(elapsedTime) : '--:--:--'}
            </p>
          </div>
        </div>

        {/* Cost Display */}
        {isOccupied && session && (
          <div className="bg-primary/10 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCurrencyDollar className="w-5 h-5 text-primary" />
                <span className="text-sm text-bodytext">{t.cost}</span>
              </div>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(cost)}
              </span>
            </div>
            <p className="text-xs text-bodytext mt-1">
              {table.pricingPackage?.category === 'per_minute'
                ? `${Math.ceil(elapsedTime / 60)} min x ${formatCurrency(table.pricingPackage?.perMinuteRate || '0')}`
                : `${Math.ceil(elapsedTime / 3600)} hr x ${formatCurrency(table.pricingPackage?.hourlyRate || '0')}`
              }
            </p>
          </div>
        )}

        {/* Primary Actions */}
        <div className="flex gap-2 mb-2">
          {isOccupied ? (
            <>
              <Tooltip content="Add F&B Order" position="top">
                <button
                  onClick={onFnb}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <IconToolsKitchen2 className="w-4 h-4" />
                  {t.fnb}
                </button>
              </Tooltip>
              <Tooltip content="End Session & Billing" position="top">
                <button
                  onClick={onStop}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-500 text-white font-medium text-sm hover:bg-rose-600 transition-colors shadow-sm"
                >
                  <IconPlayerStop className="w-4 h-4" />
                  {t.stop}
                </button>
              </Tooltip>
            </>
          ) : (
            <Tooltip content="Start New Session" position="top">
              <button
                onClick={onStart}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <IconPlayerPlay className="w-4 h-4" />
                {t.start}
              </button>
            </Tooltip>
          )}
        </div>

        {/* Expandable Actions */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-bodytext hover:text-dark dark:hover:text-white transition-colors"
        >
          {isExpanded ? (
            <>
              <IconChevronUp className="w-4 h-4" />
              Hide Actions
            </>
          ) : (
            <>
              <IconChevronDown className="w-4 h-4" />
              More Actions
            </>
          )}
        </button>

        {/* Secondary Actions */}
        {isExpanded && (
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {isOccupied && session && (
              <div className="flex gap-2">
                <Tooltip content="Manage Duration" position="top">
                  <IconButton
                    icon={<IconClock />}
                    onClick={onDuration}
                    variant="secondary"
                    size="sm"
                    tooltip="Duration"
                  />
                </Tooltip>
                <Tooltip content="Move to Another Table" position="top">
                  <IconButton
                    icon={<IconTransfer />}
                    onClick={onMove}
                    variant="secondary"
                    size="sm"
                    tooltip="Move"
                  />
                </Tooltip>
              </div>
            )}
            
            {!isOccupied && (
              <div className="flex gap-2">
                <Tooltip content="Edit Table Settings" position="top">
                  <IconButton
                    icon={<IconEdit />}
                    onClick={onEdit}
                    variant="secondary"
                    size="sm"
                    tooltip="Edit"
                    className="flex-1"
                  />
                </Tooltip>
                <Tooltip content="Delete Table" position="top">
                  <IconButton
                    icon={<IconTrash />}
                    onClick={onDelete}
                    variant="error"
                    size="sm"
                    tooltip="Delete"
                    className="flex-1"
                  />
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableCard;
