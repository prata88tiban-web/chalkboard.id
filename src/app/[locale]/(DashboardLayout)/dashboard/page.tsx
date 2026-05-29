"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button, Modal, TextInput, Label, Select, Alert } from "flowbite-react";
import Link from "next/link";
import { 
  IconClock, 
  IconUsers, 
  IconCoffee, 
  IconChartBar,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconCreditCard,
  IconCurrencyDollar,
  IconDeviceAnalytics,
  IconReceipt2,
  IconHistory
} from "@tabler/icons-react";
import DefaultSpinner from "@/components/ui-components/Spinner/DefaultSpinner";
import {
  AnalyticsCard,
  SmartLegend,
  ActivityFeed,
  TableCard,
  Card,
  StatusBadge,
  ActivityItem
} from "@/components/ui";

interface Table {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning' | 'waiting' | 'overtime' | 'vip' | 'tournament';
  hourlyRate: string;
  isActive: boolean;
  pricingPackage?: any;
}

interface TableSession {
  id: number;
  tableId: number;
  customerName: string;
  startTime: string;
  plannedDuration: number;
  status: string;
}

const B3BillingDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const tSessionModal = useTranslations('SessionModal');
  const tAlerts = useTranslations('Alerts');

  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<{ [key: number]: TableSession }>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [stats, setStats] = useState({
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0,
    totalRevenue: 0,
  });

  const [dailyStats, setDailyStats] = useState({
    sessions: { totalRevenue: 0, count: 0 },
    fnb: { totalRevenue: 0, count: 0 }
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Form state for session modal
  const [sessionData, setSessionData] = useState({
    customerName: '',
    mode: 'open' as 'open' | 'planned',
    plannedDuration: 60
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/analytics/daily-stats?date=${today}&days=1`);
      if (response.ok) {
        const data = await response.json();
        setDailyStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        const sortedTables = data.sort((a: Table, b: Table) => {
          const numA = parseInt((a.name.match(/(\d+)/) || ['0', '0'])[1], 10);
          const numB = parseInt((b.name.match(/(\d+)/) || ['0', '0'])[1], 10);
          return numA - numB || a.name.localeCompare(b.name);
        });
        setTables(sortedTables);
        
        const totalTables = data.length;
        const occupiedTables = data.filter((table: Table) => table.status === 'occupied').length;
        const availableTables = data.filter((table: Table) => table.status === 'available').length;
        
        setStats(prev => ({
          ...prev,
          totalTables,
          occupiedTables,
          availableTables,
        }));

        // Fetch current sessions for occupied tables
        data.forEach(async (table: Table) => {
          if (table.status === 'occupied') {
            const sessionResponse = await fetch(`/api/tables/${table.id}/current-session`);
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              if (sessionData.session) {
                setSessions(prev => ({
                  ...prev,
                  [table.id]: sessionData.session
                }));
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock activities for now - in real app would fetch from API
  useEffect(() => {
    setActivities([
      {
        id: '1',
        type: 'session_start',
        title: 'Table 5 Started',
        description: 'New session started for John Doe',
        time: '5 mins ago',
        icon: IconPlayerPlay,
        color: 'bg-emerald-500',
      },
      {
        id: '2',
        type: 'fnb_order',
        title: 'F&B Order - Table 2',
        description: '2x Ice Lemon Tea, 1x French Fries',
        time: '12 mins ago',
        icon: IconCoffee,
        color: 'bg-amber-500',
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment Received',
        description: 'Table 8 completed payment of IDR 150.000',
        time: '25 mins ago',
        icon: IconCreditCard,
        color: 'bg-primary',
      },
    ]);
  }, []);

  useEffect(() => {
    if (session) {
      fetchTables();
      fetchDailyStats();
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session) {
        fetchTables();
        fetchDailyStats();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleStartSession = async () => {
    if (!selectedTable) return;
    try {
      const response = await fetch(`/api/tables/${selectedTable.id}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: sessionData.customerName,
          plannedDuration: sessionData.mode === 'planned' ? sessionData.plannedDuration : null,
        }),
      });

      if (response.ok) {
        showAlert('success', tAlerts('sessionStartedSuccess'));
        setShowSessionModal(false);
        setSessionData({ customerName: '', mode: 'open', plannedDuration: 60 });
        fetchTables();
      } else {
        showAlert('error', tAlerts('genericError'));
      }
    } catch (error) {
      showAlert('error', tAlerts('genericError'));
    }
  };

  const handleEndSession = async (tableId: number) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/end-session`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setBillingData(data);
        setShowBillingModal(true);
        fetchTables();
      } else {
        showAlert('error', tAlerts('genericError'));
      }
    } catch (error) {
      showAlert('error', tAlerts('genericError'));
    }
  };

  const formatCurrency = (amount: number | string) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <DefaultSpinner />
      </div>
    );
  }

  const tableStatusCounts = [
    { status: 'available', count: tables.filter(t => t.status === 'available').length },
    { status: 'occupied', count: tables.filter(t => t.status === 'occupied').length },
    { status: 'maintenance', count: tables.filter(t => t.status === 'maintenance').length },
    { status: 'reserved', count: tables.filter(t => t.status === 'reserved').length },
    { status: 'overtime', count: tables.filter(t => t.status === 'overtime').length },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Alert System */}
      {alert && (
        <div className="fixed top-20 right-8 z-[100] w-96 animate-in slide-in-from-right duration-300">
          <Alert color={alert.type === 'success' ? 'success' : 'failure'} onDismiss={() => setAlert(null)}>
            <span className="font-bold">{alert.message}</span>
          </Alert>
        </div>
      )}

      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-dark dark:text-white tracking-tight mb-2">
            {t('title')}
          </h1>
          <p className="text-bodytext font-bold">
            Welcome back, <span className="text-primary">{session?.user?.name}</span>. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/tables">
            <Button color="primary" className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              <IconPlus className="w-5 h-5 mr-2" stroke={3} />
              Manage Tables
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Daily Revenue"
          value={formatCurrency(dailyStats.sessions.totalRevenue + dailyStats.fnb.totalRevenue)}
          subtitle="Combined Table & F&B"
          icon={IconCurrencyDollar}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <AnalyticsCard
          title="Active Sessions"
          value={stats.occupiedTables}
          subtitle={`${stats.availableTables} tables available`}
          icon={IconUsers}
          color="success"
        />
        <AnalyticsCard
          title="F&B Orders"
          value={dailyStats.fnb.count || 0}
          subtitle={`Revenue: ${formatCurrency(dailyStats.fnb.totalRevenue)}`}
          icon={IconCoffee}
          color="warning"
        />
        <AnalyticsCard
          title="Utilization"
          value={`${Math.round((stats.occupiedTables / (stats.totalTables || 1)) * 100)}%`}
          subtitle="Overall table usage"
          icon={IconDeviceAnalytics}
          color="info"
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Table Management Section */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-dark dark:text-white tracking-tight">
                Live Table Status
              </h2>
              <SmartLegend items={tableStatusCounts.filter(i => i.count > 0)} />
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-40">
                Last updated: {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                session={sessions[table.id]}
                currentTime={currentTime}
                formatCurrency={formatCurrency}
                onStart={() => {
                  setSelectedTable(table);
                  setShowSessionModal(true);
                }}
                onStop={() => handleEndSession(table.id)}
                onFnb={() => router.push(`/${locale}/pos?tableId=${table.id}`)}
                onEdit={() => router.push(`/${locale}/tables?edit=${table.id}`)}
                translations={{
                  startTime: tCommon('startTime'),
                  endTime: tCommon('endTime'),
                  duration: tCommon('duration'),
                  cost: tCommon('cost'),
                  start: tCommon('start'),
                  stop: tCommon('stop'),
                  fnb: tCommon('fnb'),
                  edit: tCommon('edit'),
                  delete: tCommon('delete'),
                  move: tCommon('move'),
                  available: tCommon('available'),
                  occupied: tCommon('occupied'),
                  maintenance: tCommon('maintenance'),
                  reserved: tCommon('reserved'),
                }}
              />
            ))}
          </div>

          {tables.length === 0 && (
            <Card padding="lg" className="flex flex-col items-center justify-center text-center py-20 border-dashed border-2">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <IconDeviceAnalytics className="w-10 h-10 text-bodytext opacity-20" />
              </div>
              <h3 className="text-xl font-black text-dark dark:text-white mb-2">No Tables Found</h3>
              <p className="text-bodytext font-bold mb-8 max-w-xs">Start by adding your first billiard table to the system.</p>
              <Link href="/tables">
                <Button color="primary" className="rounded-2xl px-8 font-black uppercase tracking-widest">
                  <IconPlus className="w-5 h-5 mr-2" />
                  Create Table
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Sidebar Section */}
        <div className="col-span-12 xl:col-span-4 space-y-8">
          {/* Quick Actions Card */}
          <Card padding="lg" className="bg-primary/5 border-primary/20">
            <h3 className="text-xl font-black text-dark dark:text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push(`/${locale}/pos`)} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <IconCoffee size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">New Order</span>
              </button>
              <button onClick={() => router.push(`/${locale}/transactions`)} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <IconReceipt2 size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">Payments</span>
              </button>
              <button onClick={() => router.push(`/${locale}/analytics`)} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <IconChartBar size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">Reports</span>
              </button>
              <button onClick={() => router.push(`/${locale}/history`)} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <IconHistory size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">Log History</span>
              </button>
            </div>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Start Session Modal */}
      <Modal show={showSessionModal} onClose={() => setShowSessionModal(false)} size="md">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <IconPlayerPlay size={24} stroke={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-dark dark:text-white leading-tight">Start Session</h3>
              <p className="text-sm font-bold text-bodytext">{selectedTable?.name}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-60">Customer Name</Label>
              <TextInput
                value={sessionData.customerName}
                onChange={(e) => setSessionData({ ...sessionData, customerName: e.target.value })}
                placeholder="Enter customer name..."
                required
                className="[&>div>input]:rounded-2xl [&>div>input]:h-12 [&>div>input]:font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-60">Session Mode</Label>
              <Select
                value={sessionData.mode}
                onChange={(e) => setSessionData({ ...sessionData, mode: e.target.value as 'open' | 'planned' })}
                className="[&>div>select]:rounded-2xl [&>div>select]:h-12 [&>div>select]:font-bold"
              >
                <option value="open">Open Duration (Pay as you go)</option>
                <option value="planned">Fixed Duration (Pre-paid / Planned)</option>
              </Select>
            </div>
            {sessionData.mode === 'planned' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-60">Duration</Label>
                <Select
                  value={sessionData.plannedDuration}
                  onChange={(e) => setSessionData({ ...sessionData, plannedDuration: parseInt(e.target.value) })}
                  className="[&>div>select]:rounded-2xl [&>div>select]:h-12 [&>div>select]:font-bold"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                  <option value={180}>3 Hours</option>
                </Select>
              </div>
            )}

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-bodytext">Estimated Cost</span>
                <span className="text-lg font-black text-primary">
                  {formatCurrency(((sessionData.plannedDuration / 60) * parseFloat(selectedTable?.hourlyRate || '0')))}
                </span>
              </div>
              <p className="text-[10px] font-bold text-bodytext opacity-50">Rate: {formatCurrency(selectedTable?.hourlyRate || 0)} / hour</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button color="light" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest" onClick={() => setShowSessionModal(false)}>
                Cancel
              </Button>
              <Button color="primary" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleStartSession}>
                Open Table
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Billing Modal */}
      <Modal show={showBillingModal} onClose={() => setShowBillingModal(false)} size="lg">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <IconReceipt2 size={24} stroke={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-dark dark:text-white leading-tight">Session Billing</h3>
              <p className="text-sm font-bold text-bodytext">Ready for checkout</p>
            </div>
          </div>

          {billingData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-60 mb-1">Customer</p>
                  <p className="font-black text-dark dark:text-white">{billingData.session.customerName}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bodytext opacity-60 mb-1">Duration</p>
                  <p className="font-black text-dark dark:text-white">{formatDuration(billingData.billing.actualDuration * 60)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-bodytext opacity-60 px-1">Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-bold text-bodytext">Table Cost ({billingData.billing.billableHours} hrs)</span>
                    <span className="font-black text-dark dark:text-white">{formatCurrency(billingData.billing.tableCost)}</span>
                  </div>
                  {billingData.billing.fnbTotalCost > 0 && (
                    <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-bold text-bodytext">F&B Total</span>
                      <span className="font-black text-dark dark:text-white">{formatCurrency(billingData.billing.fnbTotalCost)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-primary text-white rounded-[32px] shadow-xl shadow-primary/30 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Amount Due</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{formatCurrency(billingData.billing.totalCost)}</span>
                  </div>
                </div>
                <IconCurrencyDollar className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" stroke={1} />
              </div>

              <div className="flex gap-3 pt-4">
                <Button color="light" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest" onClick={() => setShowBillingModal(false)}>
                  Close
                </Button>
                <Button color="primary" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={() => {
                  router.push(`/${locale}/transactions`);
                  setShowBillingModal(false);
                }}>
                  <IconCreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default B3BillingDashboard;
