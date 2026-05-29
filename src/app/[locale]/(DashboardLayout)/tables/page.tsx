"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button, Modal, TextInput, Label, Select } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IconPlus, 
  IconPlayerPlay, 
  IconPlayerStop,
  IconClock,
  IconCheck,
  IconToolsKitchen2,
  IconShoppingCart,
  IconMinus,
  IconX,
  IconSearch,
  IconFilter,
  IconLayoutGrid,
  IconSettings,
  IconChevronRight,
  IconHistory,
  IconChartBar,
  IconHelp,
  IconUser,
  IconTrash
} from "@tabler/icons-react";
import DefaultSpinner from "@/components/ui-components/Spinner/DefaultSpinner";
import DurationManagement from "@/components/tables/DurationManagement";
import MoveSessionModal from "@/components/tables/MoveSessionModal";
import EnhancedBillingModal from "@/components/tables/EnhancedBillingModal";
import { PricingPackage } from "@/schema";
import { calculateTax as calculateTaxFromSettings, formatTaxLabel } from "@/lib/tax";
import { printHtml } from "@/lib/print-html";

// Import enhanced UI components
import {
  ToastProvider,
  useToast,
  StatusBadge,
  Hint,
  AutoRefreshIndicator,
  SearchAutocomplete,
  Toolbar,
  ToolbarGroup,
  ToolbarDivider,
  TableCard,
  IconButton,
  Tooltip
} from "@/components/ui";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

interface BilliardTable {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning' | 'waiting' | 'overtime' | 'vip' | 'tournament';
  hourlyRate: string;
  perMinuteRate?: string;
  pricingPackageId?: string;
  arduinoRelay?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pricingPackage?: {
    id: string;
    name: string;
    description?: string;
    category: string;
    hourlyRate?: string;
    perMinuteRate?: string;
    isDefault: boolean;
    isActive: boolean;
  };
}

interface TableSession {
  id: number;
  tableId: number;
  customerName: string;
  startTime: string;
  plannedDuration: number;
  actualDuration?: number;
  originalDuration?: number;
  durationType?: 'hourly' | 'per_minute';
  status: string;
}

interface FnbCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

interface FnbItem {
  id: number;
  name: string;
  description: string;
  price: string;
  cost: string;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  unit: string;
}

interface ExistingOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  subtotal: string;
  tax: string;
  total: string;
  status: string;
  staffId: number;
  staffName: string;
  notes: string;
  createdAt: string;
  items: ExistingOrderItem[];
}

interface ExistingOrderItem {
  id: number;
  itemId: number;
  itemName: string;
  itemDescription: string;
  categoryName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  unit: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  isActive: boolean;
}

// Status filter options
const STATUS_FILTERS = [
  { value: 'all', label: 'All', color: 'bg-gray-500' },
  { value: 'available', label: 'Available', color: 'bg-emerald-500' },
  { value: 'occupied', label: 'Occupied', color: 'bg-rose-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-amber-500' },
  { value: 'reserved', label: 'Reserved', color: 'bg-sky-500' },
  { value: 'cleaning', label: 'Cleaning', color: 'bg-blue-500' },
  { value: 'waiting', label: 'Waiting', color: 'bg-indigo-500' },
  { value: 'overtime', label: 'Overtime', color: 'bg-orange-500' },
  { value: 'vip', label: 'VIP', color: 'bg-fuchsia-500' },
  { value: 'tournament', label: 'Tournament', color: 'bg-violet-500' },
];

const TablesManagementContent = () => {
  const sessionHook = useSession();
  const { data: session, status } = sessionHook || { data: null, status: 'loading' };
  const router = useRouter();
  const locale = useLocale();
  const { addToast } = useToast();

  const t = useTranslations('TablesManagement');
  const tCards = useTranslations('TableCard');
  const tAlerts = useTranslations('Alerts');
  const tSessionModal = useTranslations('SessionModal');
  const tModals = useTranslations('Modals');
  const tCommon = useTranslations('Common');
  const tPOS = useTranslations('POS');
  
  // State
  const [tables, setTables] = useState<BilliardTable[]>([]);
  const [sessions, setSessions] = useState<{ [key: number]: TableSession }>({});
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showFnbModal, setShowFnbModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showMoveSessionModal, setShowMoveSessionModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<BilliardTable | null>(null);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [taxSettings, setTaxSettings] = useState({
    enabled: false,
    percentage: 11,
    name: 'PPN',
    applyToTables: false,
    applyToFnb: true
  });

  // UI State
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedTables, setPinnedTables] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showHints, setShowHints] = useState(true);

  // F&B Modal States
  const [categories, setCategories] = useState<FnbCategory[]>([]);
  const [items, setItems] = useState<FnbItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingOrders, setExistingOrders] = useState<ExistingOrder[]>([]);
  const [fnbLoading, setFnbLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [fnbSearchQuery, setFnbSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    status: 'available' as 'available' | 'maintenance' | 'reserved'
  });

  const [sessionData, setSessionData] = useState({
    customerName: '',
    mode: 'open' as 'open' | 'planned',
    plannedDuration: 60,
    pricingPackageId: ''
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const autoEndTriggeredRef = useRef<Set<number>>(new Set());
  const defaultStaffIdRef = useRef<string>('');
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([]);
  const [arduinoConfig, setArduinoConfig] = useState({ port: '', baud: '9600', command: 'RELAY_{id}_{STATE}' });
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [tableToStop, setTableToStop] = useState<BilliardTable | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Show toast notification
  const showAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    addToast({ type, title: type.charAt(0).toUpperCase() + type.slice(1), message });
  }, [addToast]);

  // Fetch tables data
  const fetchTables = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/fnb/orders')
      ]);

      if (tablesRes.ok) {
        const data = await tablesRes.json();
        const sortedTables = data.sort((a: BilliardTable, b: BilliardTable) => {
          const numA = parseInt((a.name.match(/(\d+)/) || ['0', '0'])[1], 10);
          const numB = parseInt((b.name.match(/(\d+)/) || ['0', '0'])[1], 10);
          return numA - numB || a.name.localeCompare(b.name);
        });
        setTables(sortedTables);
        
        // Fetch current sessions for occupied tables
        data.forEach(async (table: BilliardTable) => {
          if (table.status === 'occupied') {
            try {
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
            } catch (error) {
              console.error('Failed to fetch session for table', table.id, error);
            }
          }
        });
      }

      if (ordersRes.ok) {
        setAllOrders(await ordersRes.json());
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      showAlert('error', tAlerts('genericError'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showAlert, tAlerts]);

  // Fetch F&B data for modal
  const fetchFnbData = async () => {
    setFnbLoading(true);
    try {
      const [categoriesRes, itemsRes, staffRes] = await Promise.all([
        fetch('/api/fnb/categories'),
        fetch('/api/fnb/items'),
        fetch('/api/staff')
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }
    } catch (error) {
      console.error('Failed to fetch F&B data:', error);
      showAlert('error', tAlerts('failedToLoadFnBData'));
    } finally {
      setFnbLoading(false);
    }
  };

  // Fetch pricing packages
  const fetchPricingPackages = async () => {
    try {
      const response = await fetch('/api/pricing-packages?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setPricingPackages(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing packages:', error);
    }
  };

  // Fetch existing orders for a table
  const fetchExistingOrders = async (tableId: number) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/orders`);
      if (response.ok) {
        const ordersData = await response.json();
        setExistingOrders(ordersData);
      } else {
        setExistingOrders([]);
      }
    } catch (error) {
      console.error('Error fetching existing orders:', error);
      setExistingOrders([]);
    }
  };

  const fetchDefaultStaff = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const defaultId = data.settings?.default_staff_id;
        if (defaultId && defaultId !== '0') {
          defaultStaffIdRef.current = defaultId;
          setSelectedStaffId(defaultId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch default staff:', error);
    }
  };

  const fetchTaxSettings = async () => {
    try {
      const response = await fetch('/api/settings/tax/client');
      if (response.ok) {
        const settings = await response.json();
        setTaxSettings(settings);
      }
    } catch (error) {
      console.error('Failed to fetch tax settings:', error);
    }
  };

  const fetchArduinoConfig = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setArduinoConfig({
          port: data.settings?.arduino_port || '',
          baud: data.settings?.arduino_baud || '9600',
          command: data.settings?.arduino_command || 'RELAY_{id}_{STATE}'
        });
      }
    } catch (error) {
      console.error('Failed to fetch Arduino config:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTables();
      fetchTaxSettings();
      fetchPricingPackages();
      fetchDefaultStaff();
      fetchArduinoConfig();
    }
  }, [session, fetchTables]);

  // Auto-refresh logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (session && !isRefreshing) fetchTables();
    }, 30000);
    return () => clearInterval(interval);
  }, [session, isRefreshing, fetchTables]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time Expired Alerts
  useEffect(() => {
    tables.forEach((table) => {
      const tableSession = sessions[table.id];
      if (!tableSession || (tableSession.plannedDuration || 0) <= 0) return;

      const start = new Date(tableSession.startTime);
      const elapsed = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
      const remaining = tableSession.plannedDuration * 60 - elapsed;

      if (remaining <= 0 && !autoEndTriggeredRef.current.has(table.id)) {
        autoEndTriggeredRef.current.add(table.id);
        showAlert('warning', t('timeExpired.notification', { tableName: table.name }));
      }
    });
  }, [currentTime, sessions, tables, showAlert, t]);

  // Filter and sort tables
  const filteredTables = useMemo(() => {
    let result = [...tables];
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        (sessions[t.id]?.customerName?.toLowerCase().includes(query))
      );
    }
    result.sort((a, b) => {
      const aPinned = pinnedTables.includes(a.id);
      const bPinned = pinnedTables.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
    return result;
  }, [tables, statusFilter, searchQuery, pinnedTables, sessions]);

  const searchItems = useMemo(() => {
    const tableItems = tables.map(t => ({
      id: t.id,
      type: 'table' as const,
      label: t.name,
      sublabel: sessions[t.id]?.customerName || undefined,
      status: t.status,
    }));

    const orderItems = allOrders.map(o => ({
      id: o.id,
      type: 'order' as const,
      label: `Order #${o.orderNumber}`,
      sublabel: o.customerName || 'Walk-in Customer',
      status: o.status,
    }));

    return [...tableItems, ...orderItems];
  }, [tables, sessions, allOrders]);

  // Table Handlers
  const handleCreateTable = async () => {
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlert('success', tAlerts('tableCreatedSuccess'));
        setShowCreateModal(false);
        setFormData({ name: '', status: 'available' });
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToCreateTable'));
      }
    } catch (error) {
      showAlert('error', tAlerts('failedToCreateTable'));
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable) return;
    try {
      const response = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlert('success', tAlerts('tableUpdatedSuccess'));
        setShowEditModal(false);
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToUpdateTable'));
      }
    } catch (error) {
      showAlert('error', tAlerts('failedToUpdateTable'));
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    try {
      const response = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showAlert('success', tAlerts('tableDeletedSuccess'));
        setShowDeleteModal(false);
        setSelectedTable(null);
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToDeleteTable'));
      }
    } catch (error) {
      showAlert('error', tAlerts('failedToDeleteTable'));
    }
  };

  const triggerArduinoLight = async (relayId: number | null, state: 'ON' | 'OFF') => {
    if (!relayId || !arduinoConfig.port) return;

    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const command = arduinoConfig.command
          .replace('{id}', relayId.toString())
          .replace('{STATE}', state);

        await invoke('send_arduino_command', {
          portName: arduinoConfig.port,
          baudRate: parseInt(arduinoConfig.baud),
          command: command
        });
      } catch (error) {
        console.error('Failed to trigger Arduino light:', error);
      }
    }
  };

  const handleStartSession = async () => {
    if (!selectedTable) return;
    if (!sessionData.pricingPackageId) {
      showAlert('error', tSessionModal('packageRequired'));
      return;
    }

    try {
      const response = await fetch(`/api/tables/${selectedTable.id}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        // Trigger Light ON
        if ((selectedTable as any).arduinoRelay) {
          triggerArduinoLight((selectedTable as any).arduinoRelay, 'ON');
        }

        showAlert('success', tAlerts('sessionStartedSuccess'));
        setShowSessionModal(false);
        setSelectedTable(null);
        setSessionData({ customerName: '', mode: 'open', plannedDuration: 60, pricingPackageId: '' });
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToStartSession'));
      }
    } catch (error) {
      showAlert('error', tAlerts('failedToStartSession'));
    }
  };

  const handleEndSession = async (tableId: number) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/end-session`, { method: 'POST' });
      if (response.ok) {
        // Trigger Light OFF
        const table = tables.find(t => t.id === tableId);
        if (table && (table as any).arduinoRelay) {
          triggerArduinoLight((table as any).arduinoRelay, 'OFF');
        }

        const data = await response.json();
        setBillingData(data);
        setShowBillingModal(true);
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToEndSession'));
      }
    } catch (error) {
      showAlert('error', tAlerts('failedToEndSession'));
    }
  };

  // F&B Handlers
  const fetchFnbData = async () => {
    setFnbLoading(true);
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch('/api/fnb/categories'),
        fetch('/api/fnb/items')
      ]);
      if (categoriesRes.ok) {
        const cats = await categoriesRes.json();
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      }
      if (itemsRes.ok) setItems(await itemsRes.json());
    } finally {
      setFnbLoading(false);
    }
  };

  const openFnbModal = async (table: BilliardTable) => {
    setSelectedTable(table);
    setShowFnbModal(true);
    if (categories.length === 0) await fetchFnbData();
    try {
      const res = await fetch(`/api/tables/${table.id}/orders`);
      setExistingOrders(res.ok ? await res.json() : []);
    } catch {
      setExistingOrders([]);
    }
  };

  const addToCart = (item: FnbItem) => {
    if (item.stockQuantity <= 0) {
      showAlert('error', tAlerts('itemOutOfStockNamed', { itemName: item.name }));
      return;
    }
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stockQuantity) {
        showAlert('error', tAlerts('notEnoughStockAvailable'));
        return;
      }
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1, unit: item.unit }]);
    }
  };

  const processFnbOrder = async () => {
    if (!selectedTable || !sessions[selectedTable.id] || cart.length === 0 || !selectedStaffId) {
      showAlert('error', 'Please fill all required fields');
      return;
    }

    try {
      const tableSession = sessions[selectedTable.id];
      const subtotal = cart.reduce((acc, c) => acc + parseFloat(c.price) * c.quantity, 0);
      const tax = calculateTaxFromSettings(subtotal, taxSettings, false);
      const total = subtotal + tax;

      const response = await fetch('/api/fnb/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'table_session',
          customerName: tableSession.customerName,
          tableId: selectedTable.id,
          staffId: parseInt(selectedStaffId),
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          notes: `Order for ${selectedTable.name}`,
          items: cart.map(item => ({
            itemId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: (parseFloat(item.price) * item.quantity).toFixed(2)
          }))
        })
      });

      if (response.ok) {
        showAlert('success', 'Order added to bill');
        setCart([]);
        setShowFnbModal(false);
        fetchTables();
      }
    } catch {
      showAlert('error', 'Failed to process order');
    }
  };

  const printCheckoutReceipt = (paymentData: any, billingDataParam: any) => {
    const billing = billingDataParam.billing;
    const tableSession = billingDataParam.session;

    const formatCurrencyReceipt = (amount: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        const s = data.settings || {};
        const storeName = (s.store_name || 'B3-BILLING BILLIARD BATAM').trim();
        const storeAddress = (s.store_address || '').trim();
        const storePhone = (s.store_phone || '').trim();
        const storeNotes = (s.store_notes || '').trim();

        const fnbSection = billing.fnbOrders && billing.fnbOrders.length > 0
          ? `<div class="section">
              <h3>F&B ORDERS</h3>
              ${billing.fnbOrders.map((order: any) =>
                order.items && order.items.length > 0
                  ? order.items.map((item: any) =>
                      `<div class="item-row">
                        <span class="item-name">${item.quantity}x ${item.itemName || 'Item'}</span>
                        <span class="item-price">${formatCurrencyReceipt(parseFloat(item.subtotal))}</span>
                      </div>`
                    ).join('')
                  : `<div class="item-row">
                      <span class="item-name">${order.orderNumber}</span>
                      <span class="item-price">${formatCurrencyReceipt(parseFloat(order.total))}</span>
                    </div>`
              ).join('')}
            </div>`
          : '';

        const taxSection = billing.totalTaxAmount > 0
          ? `<div class="subtotal-row">
              <span>${billing.taxSettings?.name || 'Tax'} (${billing.taxSettings?.percentage || 0}%):</span>
              <span>${formatCurrencyReceipt(billing.totalTaxAmount)}</span>
            </div>`
          : '';

        const receiptHtml = `
          <!DOCTYPE html>
          <html><head>
            <meta charset="UTF-8">
            <title>Receipt - ${paymentData.transactionNumber}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { font-family: 'Courier New', monospace; width: 72mm; max-width: 72mm; box-sizing: border-box; margin: 0 auto; padding: 10px; font-size: 12px; line-height: 1.4; }
              .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .header h1 { margin: 0; font-size: 16px; font-weight: bold; }
              .header p { margin: 2px 0; font-size: 10px; }
              .section { margin: 10px 0; border-bottom: 1px dashed #000; padding-bottom: 8px; }
              .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
              .item-name { flex: 1; margin-right: 10px; }
              .item-price { text-align: right; min-width: 60px; }
              .subtotal-row { display: flex; justify-content: space-between; margin: 2px 0; }
              .total-row { display: flex; justify-content: space-between; font-weight: bold; margin: 5px 0 2px 0; border-top: 1px solid #000; padding-top: 3px; }
              .footer { text-align: center; margin-top: 15px; font-size: 10px; border-top: 2px dashed #000; padding-top: 10px; }
            </style>
          </head><body>
            <div class="header">
              <h1>${storeName.toUpperCase()}</h1>
              ${storeAddress ? `<p>${storeAddress}</p>` : ''}
              ${storePhone ? `<p>${storePhone}</p>` : ''}
              <p>Struk Pembayaran</p>
              <p style="font-size:13px; font-weight:bold; margin-top:4px">${paymentData.transactionNumber}</p>
              <p>${new Date().toLocaleString('id-ID')}</p>
            </div>

            <div class="section">
              <p><strong>Customer:</strong> ${tableSession.customerName}</p>
            </div>

            <div class="section">
              <h3>TABLE SESSION</h3>
              <div class="item-row">
                <span class="item-name">
                  Duration: ${billing.actualDuration} min
                  (${billing.billingDetails.type === 'hourly'
                    ? billing.billingDetails.billableHours + ' hr'
                    : billing.billingDetails.billableMinutes + ' min'})
                </span>
                <span class="item-price">${formatCurrencyReceipt(billing.tableCost)}</span>
              </div>
            </div>

            ${fnbSection}

            <div class="section">
              <h3>PAYMENT SUMMARY</h3>
              <div class="subtotal-row">
                <span>Table:</span>
                <span>${formatCurrencyReceipt(billing.tableCost)}</span>
              </div>
              ${billing.fnbTotalCost > 0 ? `
                <div class="subtotal-row">
                  <span>F&B:</span>
                  <span>${formatCurrencyReceipt(billing.fnbTotalCost)}</span>
                </div>
              ` : ''}
              ${taxSection}
              <div class="total-row">
                <span>TOTAL:</span>
                <span>${formatCurrencyReceipt(billing.totalCost)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Terima kasih atas kunjungan Anda!</p>
              ${storeNotes ? `<p style="margin-top:4px">${storeNotes}</p>` : ''}
              <p>${storeName}</p>
            </div>
          </body></html>
        `;

        printHtml(receiptHtml).catch((error) => {
          console.error('Failed to print receipt', error);
        });
      })
      .catch(() => {
        console.error('Failed to print receipt');
      });
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center items-center h-screen"><DefaultSpinner /></div>;
  }

  const translations = {
    startTime: tCards('startTime'),
    endTime: tCards('endTime'),
    duration: tCards('duration'),
    cost: tCards('cost'),
    start: tCards('start'),
    stop: tCards('stop'),
    fnb: tCards('fnb'),
    edit: tCards('edit'),
    delete: tCards('delete'),
    move: tCards('move'),
    available: tCards('available'),
    occupied: tCards('occupied'),
    maintenance: tCards('maintenance'),
    reserved: tCards('reserved'),
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 md:p-8 space-y-8">
      {/* Dynamic Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <IconLayoutGrid className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-dark dark:text-white tracking-tight">
              {t('title')}
            </h1>
          </div>
          <p className="text-bodytext font-medium opacity-70">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden sm:flex p-1.5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`
                  px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                  ${statusFilter === f.value
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-bodytext hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Tooltip content="Live Table Insights">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <IconChartBar className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-dark dark:text-white">
                {tables.filter(t => t.status === 'occupied').length}/{tables.length}
              </span>
            </div>
          </Tooltip>
        </div>
      </div>

      <AnimatePresence>
        {showHints && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Hint type="tip" title="Quick Search" dismissible onDismiss={() => setShowHints(false)}>
              Press <span className="font-black px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 rounded">⌘ K</span> to quickly jump to any table or active order.
            </Hint>
            <Hint type="info" title="Session Colors">
              Tables are color-coded by status. <span className="text-emerald-600 font-bold">Green</span> for available, <span className="text-rose-600 font-bold">Red</span> for occupied sessions.
            </Hint>
            <Hint type="success" title="Auto-Sync Active">
              Table statuses and timers refresh automatically every 30 seconds for real-time accuracy.
            </Hint>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Toolbar */}
      <Toolbar className="sticky top-4 z-30 shadow-2xl shadow-primary/5">
        <ToolbarGroup className="flex-1 min-w-[300px]">
          <SearchAutocomplete
            items={searchItems}
            onSelect={(item) => {
              if (item.type === 'table') {
                const table = tables.find(t => t.id === item.id);
                if (table) table.status === 'occupied' ? openFnbModal(table) : (setSelectedTable(table), setShowSessionModal(true));
              } else if (item.type === 'order') {
                router.push(`/${locale}/fnb?orderId=${item.id}`);
              }
            }}
            placeholder="Jump to Table or Order..."
            className="w-full"
          />
        </ToolbarGroup>
        
        <ToolbarDivider />
        
        <ToolbarGroup>
          <AutoRefreshIndicator
            isRefreshing={isRefreshing}
            lastRefresh={lastRefresh}
            onManualRefresh={fetchTables}
          />
          <IconButton
            icon={<IconPlus />}
            variant="primary"
            size="lg"
            tooltip="Add New Table"
            onClick={() => setShowCreateModal(true)}
          />
          <IconButton icon={<IconSettings />} variant="secondary" size="lg" tooltip="Table Settings" />
        </ToolbarGroup>
      </Toolbar>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTables.slice(0, 36).map((table) => (
            <TableCard
              key={table.id}
              table={table}
              session={sessions[table.id]}
              currentTime={currentTime}
              isPinned={pinnedTables.includes(table.id)}
              onPin={() => setPinnedTables(p => p.includes(table.id) ? p.filter(id => id !== table.id) : [...p, table.id])}
              onStart={() => (setSelectedTable(table), setShowSessionModal(true))}
              onStop={() => (setTableToStop(table), setShowStopConfirmModal(true))}
              onFnb={() => openFnbModal(table)}
              onDuration={() => (setSelectedTable(table), setSelectedSession(sessions[table.id]), setShowDurationModal(true))}
              onMove={() => (setSelectedTable(table), setSelectedSession(sessions[table.id]), setShowMoveSessionModal(true))}
              onEdit={() => (setSelectedTable(table), setFormData({ name: table.name, status: table.status }), setShowEditModal(true))}
              onDelete={() => (setSelectedTable(table), setShowDeleteModal(true))}
              formatCurrency={formatCurrency}
              translations={translations}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty States & Pagination */}
      {filteredTables.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800"
        >
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <IconSearch className="w-12 h-12 text-bodytext opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-dark dark:text-white mb-2">No Tables Found</h2>
          <p className="text-bodytext max-w-sm text-center">Try adjusting your filters or search query to find what you're looking for.</p>
        </motion.div>
      )}

      {/* All Modals (Integrated with new styling) */}

      {/* Create Table Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} size="md">
        <div className="p-8">
          <h3 className="text-2xl font-black text-dark dark:text-white mb-6">Create New Table</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Table Identity</Label>
              <TextInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Table 01"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Initial Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
                <option value="waiting">Waiting</option>
                <option value="overtime">Overtime</option>
                <option value="vip">VIP</option>
                <option value="tournament">Tournament</option>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button color="primary" className="flex-1 rounded-2xl h-12" onClick={handleCreateTable}>Create Table</Button>
              <Button color="light" className="flex-1 rounded-2xl h-12" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Table Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="md">
        <div className="p-8">
          <h3 className="text-2xl font-black text-dark dark:text-white mb-6">Edit Table</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Table Identity</Label>
              <TextInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Table 01"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
                <option value="waiting">Waiting</option>
                <option value="overtime">Overtime</option>
                <option value="vip">VIP</option>
                <option value="tournament">Tournament</option>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button color="primary" className="flex-1 rounded-2xl h-12" onClick={handleUpdateTable}>Update Table</Button>
              <Button color="light" className="flex-1 rounded-2xl h-12" onClick={() => setShowEditModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Start Session Modal */}
      <Modal show={showSessionModal} onClose={() => setShowSessionModal(false)} size="lg">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <IconPlayerPlay className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-dark dark:text-white">Start Session</h3>
              <p className="text-bodytext font-medium">{selectedTable?.name}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Customer Name</Label>
              <TextInput
                icon={IconUser}
                value={sessionData.customerName}
                onChange={(e) => setSessionData({ ...sessionData, customerName: e.target.value })}
                placeholder="Guest Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Pricing Package</Label>
                <Select
                  value={sessionData.pricingPackageId}
                  onChange={(e) => setSessionData({ ...sessionData, pricingPackageId: e.target.value })}
                >
                  <option value="">Select Package</option>
                  {pricingPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Session Mode</Label>
                <Select
                  value={sessionData.mode}
                  onChange={(e) => setSessionData({ ...sessionData, mode: e.target.value as any })}
                >
                  <option value="open">Open Time</option>
                  <option value="planned">Planned Duration</option>
                </Select>
              </div>
            </div>

            {sessionData.mode === 'planned' && (
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-bodytext">Duration (Minutes)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[60, 120, 180, 240].map(m => (
                    <button
                      key={m}
                      onClick={() => setSessionData({...sessionData, plannedDuration: m})}
                      className={`py-3 rounded-xl text-sm font-black transition-all ${sessionData.plannedDuration === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 dark:bg-gray-800 text-bodytext hover:bg-gray-200'}`}
                    >
                      {m/60}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button color="primary" className="flex-1 rounded-2xl h-14 text-lg font-black" onClick={handleStartSession}>
                Confirm & Start
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* F&B Order Modal */}
      <Modal show={showFnbModal} onClose={() => setShowFnbModal(false)} size="7xl">
        <div className="flex flex-col lg:flex-row h-[85vh] overflow-hidden">
          {/* Menu Explorer */}
          <div className="flex-1 flex flex-col p-8 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-dark dark:text-white">F&B Menu</h3>
                <p className="text-bodytext text-sm">{selectedTable?.name} • {sessions[selectedTable?.id || 0]?.customerName}</p>
              </div>
              <div className="relative w-64">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bodytext" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={fnbSearchQuery}
                  onChange={(e) => setFnbSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 dark:bg-gray-800 text-bodytext hover:bg-gray-200'}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 dark:bg-gray-800 text-bodytext hover:bg-gray-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
              {items.filter(i => (!activeCategory || i.categoryId === activeCategory) && (i.name.toLowerCase().includes(fnbSearchQuery.toLowerCase()))).map(item => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(item)}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border-2 border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-gray-800 text-left transition-all group"
                >
                  <div className="mb-4 aspect-square bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md transition-all">
                    🍔
                  </div>
                  <h4 className="font-black text-dark dark:text-white text-sm line-clamp-1 mb-1">{item.name}</h4>
                  <p className="text-primary font-black text-base">{formatCurrency(item.price)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-bodytext opacity-50">{item.stockQuantity} Left</span>
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <IconPlus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Checkout Side */}
          <div className="w-full lg:w-[400px] bg-gray-50 dark:bg-[#0f172a] border-l border-gray-100 dark:border-gray-800 flex flex-col">
            <div className="p-8 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-dark dark:text-white">Current Order</h3>
                <button onClick={() => setCart([])} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence initial={false}>
                  {cart.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-4 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm text-dark dark:text-white truncate">{item.name}</h4>
                        <p className="text-xs font-bold text-primary">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        <button
                          onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, quantity: Math.max(0, c.quantity - 1)} : c).filter(c => c.quantity > 0))}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-gray-700 shadow-sm"
                        >
                          <IconMinus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-black text-sm">{item.quantity}</span>
                        <button
                          onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c))}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20"
                        >
                          <IconPlus className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <IconShoppingCart className="w-16 h-16 mb-4" />
                    <p className="font-black uppercase tracking-widest text-sm">Cart is empty</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-bodytext">Assign Staff</Label>
                  <Select
                    sizing="sm"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-bodytext">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.reduce((acc, c) => acc + parseFloat(c.price)*c.quantity, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-bodytext">
                    <span>Tax</span>
                    <span>{formatCurrency(calculateTaxFromSettings(cart.reduce((acc, c) => acc + parseFloat(c.price)*c.quantity, 0), taxSettings, false))}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black text-dark dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(cart.reduce((acc, c) => acc + parseFloat(c.price)*c.quantity, 0) + calculateTaxFromSettings(cart.reduce((acc, c) => acc + parseFloat(c.price)*c.quantity, 0), taxSettings, false))}</span>
                  </div>
                </div>

                <Button
                  color="primary"
                  disabled={cart.length === 0 || !selectedStaffId}
                  className="w-full rounded-[24px] h-16 text-lg font-black"
                  onClick={processFnbOrder}
                >
                  Place Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Legacy Modals (Updated wrappers) */}
      <EnhancedBillingModal
        show={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        billingData={billingData}
        onConfirmPayment={async (final) => {
          try {
            const b = final.billing;
            const res = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: b.sessionId || final.session.id,
                tableId: b.tableId,
                customerName: b.customerName || final.session.customerName,
                tableAmount: b.tableCost,
                fnbAmount: b.fnbTotalCost,
                taxAmount: b.totalTaxAmount || 0,
                totalAmount: b.totalCost,
                staffId: b.staffId,
                paymentMethods: [{ type: 'cash', amount: b.totalCost }],
              }),
            });

            if (res.ok) {
              const payment = await res.json();
              printCheckoutReceipt(payment, final);
              router.push(`/${locale}/transactions?paymentId=${payment.id}`);
            }
          } catch {
            showAlert('error', 'Payment processing failed');
          }
        }}
      />

      <MoveSessionModal
        show={showMoveSessionModal}
        onClose={() => setShowMoveSessionModal(false)}
        currentTableId={selectedTable?.id || 0}
        currentTableName={selectedTable?.name || ''}
        sessionId={selectedSession?.id || 0}
        customerName={selectedSession?.customerName || ''}
        tables={tables}
        onSessionMoved={() => {
          showAlert('success', 'Session moved successfully');
          setShowMoveSessionModal(false);
          fetchTables();
        }}
      />

      <Modal show={showStopConfirmModal} onClose={() => setShowStopConfirmModal(false)} size="md">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconPlayerStop className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-dark dark:text-white mb-2">End Session?</h3>
          <p className="text-bodytext mb-8">Are you sure you want to stop the session for <strong>{tableToStop?.name}</strong>? This will calculate the final billing.</p>
          <div className="flex gap-4">
            <Button color="error" className="flex-1 rounded-2xl h-12" onClick={() => { if(tableToStop) handleEndSession(tableToStop.id); setShowStopConfirmModal(false); }}>Yes, Stop</Button>
            <Button color="light" className="flex-1 rounded-2xl h-12" onClick={() => setShowStopConfirmModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconTrash className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black mb-2">Delete Table?</h3>
          <p className="text-bodytext mb-8">Permanently delete <strong>{selectedTable?.name}</strong>? This action cannot be reversed.</p>
          <div className="flex gap-4">
            <Button color="error" className="flex-1 rounded-2xl" onClick={async () => {
              if(!selectedTable) return;
              const res = await fetch(`/api/tables/${selectedTable.id}`, { method: 'DELETE' });
              if(res.ok) { showAlert('success', 'Table deleted'); setShowDeleteModal(false); fetchTables(); }
            }}>Delete</Button>
            <Button color="light" className="flex-1 rounded-2xl" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default function TablesManagement() {
  return (
    <ToastProvider>
      <TablesManagementContent />
    </ToastProvider>
  );
}
