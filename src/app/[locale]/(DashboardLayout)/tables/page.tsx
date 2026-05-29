"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { Button, Modal, TextInput, Label, Select, Tabs } from "flowbite-react";
import { 
  IconPlus, 
  IconPlayerPlay, 
  IconPlayerStop,
  IconCurrencyDollar,
  IconClock,
  IconCheck,
  IconToolsKitchen2,
  IconShoppingCart,
  IconMinus,
  IconX,
  IconChevronRight,
  IconChevronLeft,
  IconFilter,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconInfoCircle,
  IconBulb
} from "@tabler/icons-react";
import DefaultSpinner from "@/components/ui-components/Spinner/DefaultSpinner";
import DurationManagement from "@/components/tables/DurationManagement";
import MoveSessionModal from "@/components/tables/MoveSessionModal";
import EnhancedBillingModal from "@/components/tables/EnhancedBillingModal";
import { PricingPackage } from "@/schema";
import { calculateTax as calculateTaxFromSettings, formatTaxLabel } from "@/lib/tax";
import { printHtml } from "@/lib/print-html";

// Import new UI components
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
  status: string;
  hourlyRate: string;
  perMinuteRate?: string;
  pricingPackageId?: string;
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
  { value: 'all', label: 'All Tables', color: 'bg-gray-500' },
  { value: 'available', label: 'Available', color: 'bg-emerald-500' },
  { value: 'occupied', label: 'Occupied', color: 'bg-rose-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-amber-500' },
  { value: 'reserved', label: 'Reserved', color: 'bg-sky-500' },
];

// Card color configurations
const cardColors: Record<string, { gradient: string; border: string; header: string }> = {
  available: {
    gradient: 'from-emerald-500/5 via-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400',
    header: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  },
  occupied: {
    gradient: 'from-rose-500/5 via-rose-500/10 to-rose-600/5',
    border: 'border-rose-200 dark:border-rose-800 hover:border-rose-400',
    header: 'bg-gradient-to-r from-rose-500 to-rose-600',
  },
  maintenance: {
    gradient: 'from-amber-500/5 via-amber-500/10 to-amber-600/5',
    border: 'border-amber-200 dark:border-amber-800 hover:border-amber-400',
    header: 'bg-gradient-to-r from-amber-500 to-amber-600',
  },
  reserved: {
    gradient: 'from-sky-500/5 via-sky-500/10 to-sky-600/5',
    border: 'border-sky-200 dark:border-sky-800 hover:border-sky-400',
    header: 'bg-gradient-to-r from-sky-500 to-sky-600',
  },
};

// Main component wrapped with Toast provider
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
    status: 'available'
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
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
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
        setLastRefresh(new Date());
      }
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

  useEffect(() => {
    if (session) {
      fetchTables();
      fetchTaxSettings();
      fetchPricingPackages();
      fetchDefaultStaff();
    }
  }, [session, fetchTables]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (session && !isRefreshing) {
        fetchTables();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [session, isRefreshing, fetchTables]);

  // Update current time every second for real-time duration display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show notification when planned sessions expire
  useEffect(() => {
    tables.forEach((table) => {
      const tableSession = sessions[table.id];
      if (!tableSession) return;
      if ((tableSession.plannedDuration || 0) <= 0) return;
      const elapsed = calculateElapsedTime(tableSession.startTime);
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
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        (sessions[t.id]?.customerName?.toLowerCase().includes(query))
      );
    }
    
    // Sort: pinned first, then by name
    result.sort((a, b) => {
      const aPinned = pinnedTables.includes(a.id);
      const bPinned = pinnedTables.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
    
    return result;
  }, [tables, statusFilter, searchQuery, pinnedTables, sessions]);

  // Search autocomplete items
  const searchItems = useMemo(() => {
    return tables.map(t => ({
      id: t.id,
      type: 'table' as const,
      label: t.name,
      sublabel: sessions[t.id]?.customerName || undefined,
      status: t.status,
    }));
  }, [tables, sessions]);

  // Stats
  const stats = useMemo(() => ({
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    maintenance: tables.filter(t => t.status === 'maintenance').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  }), [tables]);

  // Toggle pin
  const togglePin = (tableId: number) => {
    setPinnedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  // F&B Cart Functions
  const addToCart = (item: FnbItem) => {
    if (item.stockQuantity <= 0) {
      showAlert('error', tAlerts('itemOutOfStockNamed', { itemName: item.name }));
      return;
    }

    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity >= item.stockQuantity) {
        showAlert('error', tAlerts('notEnoughStockAvailable'));
        return;
      }
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        unit: item.unit
      }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (item && quantity > item.stockQuantity) {
      showAlert('error', tAlerts('notEnoughStockAvailable'));
      return;
    }

    setCart(cart.map(cartItem => 
      cartItem.id === itemId 
        ? { ...cartItem, quantity }
        : cartItem
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addFromExistingToCart = (orderItem: ExistingOrderItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === orderItem.itemId);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === orderItem.itemId 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: orderItem.itemId,
        name: orderItem.itemName,
        price: orderItem.unitPrice,
        quantity: 1,
        unit: orderItem.unit
      }]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const calculateTax = (subtotal: number) => {
    return calculateTaxFromSettings(subtotal, taxSettings, false);
  };

  // Process F&B Order
  const processFnbOrder = async () => {
    if (!selectedTable || !sessions[selectedTable.id]) {
      showAlert('error', tAlerts('tableSessionNotFound'));
      return;
    }

    if (cart.length === 0) {
      showAlert('error', tAlerts('cartIsEmpty'));
      return;
    }

    if (!selectedStaffId) {
      showAlert('error', tAlerts('pleaseSelectStaffMember'));
      return;
    }

    try {
      const tableSession = sessions[selectedTable.id];
      const subtotal = calculateTotal();
      const tax = calculateTax(subtotal);
      const total = subtotal + tax;

      const orderPayload = {
        context: 'table_session',
        customerName: tableSession.customerName,
        customerPhone: null,
        tableId: selectedTable.id,
        staffId: parseInt(selectedStaffId),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes: `Order for table ${selectedTable.name}`,
        items: cart.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: (parseFloat(item.price) * item.quantity).toFixed(2)
        }))
      };

      const response = await fetch('/api/fnb/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const orderResult = await response.json();
        showAlert('success', tAlerts('orderCreatedAddedToBill', { orderNumber: orderResult.orderNumber, tableName: selectedTable.name }));
        clearCart();
        setSelectedStaffId(defaultStaffIdRef.current);
        if (selectedTable) {
          await fetchExistingOrders(selectedTable.id);
        }
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToCreateOrder'));
      }
    } catch (error) {
      console.error('Error processing F&B order:', error);
      showAlert('error', tAlerts('failedToProcessOrder'));
    }
  };

  // Open F&B Modal
  const openFnbModal = async (table: BilliardTable) => {
    if (!sessions[table.id]) {
      showAlert('error', tAlerts('noActiveSessionFound'));
      return;
    }
    
    setSelectedTable(table);
    setShowFnbModal(true);
    
    if (categories.length === 0) {
      await fetchFnbData();
    }

    await fetchExistingOrders(table.id);
  };

  // Table CRUD handlers
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
        setSelectedTable(null);
        setFormData({ name: '', status: 'available' });
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
      const response = await fetch(`/api/tables/${tableId}/end-session`, {
        method: 'POST',
      });

      if (response.ok) {
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

  const openEditModal = (table: BilliardTable) => {
    setSelectedTable(table);
    setFormData({ name: table.name, status: table.status });
    setShowEditModal(true);
  };

  const openDeleteModal = (table: BilliardTable) => {
    setSelectedTable(table);
    setShowDeleteModal(true);
  };

  const openSessionModal = (table: BilliardTable) => {
    setSelectedTable(table);
    setSessionData({ customerName: '', mode: 'open', plannedDuration: 60, pricingPackageId: '' });
    setShowSessionModal(true);
  };

  const openDurationModal = (table: BilliardTable, tableSession: TableSession) => {
    setSelectedTable(table);
    setSelectedSession(tableSession);
    setShowDurationModal(true);
  };

  const openMoveSessionModal = (table: BilliardTable, tableSession: TableSession) => {
    setSelectedTable(table);
    setSelectedSession(tableSession);
    setShowMoveSessionModal(true);
  };

  const handleDurationUpdate = async (sessionId: number, newDuration: number) => {
    try {
      const tableSession = selectedSession || sessions[selectedTable?.id || 0];
      const response = await fetch(`/api/table-sessions/${sessionId}/update-duration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationType: tableSession?.durationType || 'hourly',
          actualDuration: newDuration
        }),
      });

      if (response.ok) {
        showAlert('success', tAlerts('durationUpdatedSuccess'));
        fetchTables();
      } else {
        const error = await response.json();
        showAlert('error', error.message || tAlerts('failedToUpdateDuration'));
      }
    } catch (error) {
      showAlert('error', tAlerts('failedToUpdateDuration'));
    }
  };

  const handleSessionMove = (newTableId: number, newTableName: string) => {
    showAlert('success', tAlerts('sessionMovedSuccess', { tableName: newTableName }));
    setShowMoveSessionModal(false);
    fetchTables();
  };

  const handleBillingConfirm = async (finalBillingData: any) => {
    try {
      const billing = finalBillingData.billing;
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: billing.sessionId || finalBillingData.session.id,
          tableId: billing.tableId,
          customerName: billing.customerName || finalBillingData.session.customerName,
          customerPhone: billing.customerPhone || finalBillingData.session.customerPhone,
          tableAmount: billing.tableCost,
          fnbAmount: billing.fnbTotalCost,
          taxAmount: billing.totalTaxAmount || 0,
          totalAmount: billing.totalCost,
          staffId: billing.staffId,
          paymentMethods: [{ type: 'cash', amount: billing.totalCost }],
        }),
      });

      if (response.ok) {
        const paymentData = await response.json();
        printCheckoutReceipt(paymentData, finalBillingData);
        setShowBillingModal(false);
        setBillingData(null);
        router.push(`/${locale}/transactions?paymentId=${paymentData.id}`);
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to process payment');
      }
    } catch (error) {
      showAlert('error', 'Failed to process payment');
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

  // Helper functions
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

  const formatTime = (dateTime: string | Date) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const calculateCost = (table: BilliardTable, totalSeconds: number, tableSession?: TableSession) => {
    const pricingPackage = (tableSession as any)?.pricingPackage || table.pricingPackage;
    if (!pricingPackage) return 0;

    if (pricingPackage.category === 'per_minute') {
      const rate = parseFloat(pricingPackage.perMinuteRate || '0');
      const minutes = Math.ceil(totalSeconds / 60);
      return minutes * rate;
    } else {
      const rate = parseFloat(pricingPackage.hourlyRate || '0');
      const hours = Math.ceil(totalSeconds / 3600);
      return hours * rate;
    }
  };

  const getStockStatus = (item: FnbItem) => {
    if (item.stockQuantity <= 0) {
      return { color: 'error', text: 'Out of Stock', bgColor: 'bg-rose-50', textColor: 'text-rose-600' };
    } else if (item.stockQuantity <= item.minStockLevel) {
      return { color: 'warning', text: 'Low Stock', bgColor: 'bg-amber-50', textColor: 'text-amber-600' };
    } else {
      return { color: 'success', text: 'In Stock', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' };
    }
  };

  const filteredFnbItems = items.filter(item => {
    const categoryMatch = activeCategory ? item.categoryId === activeCategory : true;
    const searchMatch = fnbSearchQuery.trim() === '' || 
      item.name.toLowerCase().includes(fnbSearchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(fnbSearchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <DefaultSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Hints */}
      {showHints && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Hint type="info" title="Quick Start Guide" dismissible onDismiss={() => setShowHints(false)}>
            <p>Click on a table card to manage sessions. Green cards are available, red cards are occupied.</p>
          </Hint>
          <Hint type="tip" title="Pro Tip">
            <p>Use the search bar to quickly find tables or customers. Pin frequently used tables for quick access.</p>
          </Hint>
        </div>
      )}

      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">{t('title')}</h1>
            <p className="text-bodytext mt-1">{t('subtitle')}</p>
          </div>
          
          {/* Stats Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <span className="text-sm text-bodytext">Total:</span>
              <span className="font-bold text-dark dark:text-white">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">{stats.available}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-rose-700 dark:text-rose-300">{stats.occupied}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-700 dark:text-amber-300">{stats.maintenance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar>
        <ToolbarGroup className="flex-1">
          <SearchAutocomplete
            items={searchItems}
            onSelect={(item) => {
              const table = tables.find(t => t.id === item.id);
              if (table) {
                if (table.status === 'occupied') {
                  openFnbModal(table);
                } else {
                  openSessionModal(table);
                }
              }
            }}
            placeholder="Search tables, customers..."
            className="w-full max-w-md"
          />
        </ToolbarGroup>
        
        <ToolbarDivider />
        
        <ToolbarGroup>
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${statusFilter === filter.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-bodytext hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </ToolbarGroup>
        
        <ToolbarDivider />
        
        <ToolbarGroup>
          <AutoRefreshIndicator
            isRefreshing={isRefreshing}
            lastRefresh={lastRefresh}
            interval={30}
            onManualRefresh={fetchTables}
          />
        </ToolbarGroup>
        
        <ToolbarDivider />
        
        <Button color="primary" onClick={() => setShowCreateModal(true)}>
          <IconPlus className="w-4 h-4 mr-2" />
          {t('addNewTable')}
        </Button>
      </Toolbar>

      {/* Tables Grid - 36 tables max per screen (6x6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredTables.slice(0, 36).map((table) => {
          const tableSession = sessions[table.id];
          const isOccupied = table.status === 'occupied';
          const elapsedTime = tableSession ? calculateElapsedTime(tableSession.startTime) : 0;
          const cost = calculateCost(table, elapsedTime, tableSession);
          const isPinned = pinnedTables.includes(table.id);
          const colors = cardColors[table.status] || cardColors.available;

          return (
            <div
              key={table.id}
              className={`
                relative rounded-2xl overflow-hidden
                bg-gradient-to-br ${colors.gradient}
                border-2 ${colors.border}
                shadow-md hover:shadow-xl
                transition-all duration-300 ease-out
                hover:-translate-y-1
                ${isPinned ? 'ring-2 ring-primary ring-offset-2' : ''}
              `}
            >
              {/* Status Header */}
              <div className={`h-1.5 w-full ${colors.header}`} />

              {/* Pin indicator */}
              {isPinned && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                </div>
              )}

              {/* Card Content */}
              <div className="p-3">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-dark dark:text-white truncate">
                      {table.name}
                    </h3>
                    {table.pricingPackage && (
                      <p className="text-[10px] text-bodytext truncate">
                        {table.pricingPackage.name}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={table.status as any} size="xs" pulse={isOccupied} />
                </div>

                {/* Session Info */}
                {isOccupied && tableSession && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs font-medium text-dark dark:text-white truncate">
                      {tableSession.customerName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-bodytext">
                      <span>Start: {formatTime(tableSession.startTime)}</span>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-bodytext">Duration</span>
                        <span className="text-sm font-bold font-mono text-dark dark:text-white">
                          {formatDuration(elapsedTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-bodytext">Cost</span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(cost)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {isOccupied ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openFnbModal(table)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
                        title="Add F&B Order"
                      >
                        <IconToolsKitchen2 className="w-3.5 h-3.5" />
                        F&B
                      </button>
                      <button
                        onClick={() => { setTableToStop(table); setShowStopConfirmModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors"
                        title="End Session"
                      >
                        <IconPlayerStop className="w-3.5 h-3.5" />
                        Stop
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openSessionModal(table)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                      title="Start Session"
                    >
                      <IconPlayerPlay className="w-4 h-4" />
                      Start
                    </button>
                  )}

                  {/* Secondary Actions */}
                  {isOccupied && tableSession && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openDurationModal(table, tableSession)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-bodytext text-[10px] font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Manage Duration"
                      >
                        <IconClock className="w-3 h-3" />
                        Duration
                      </button>
                      <button
                        onClick={() => openMoveSessionModal(table, tableSession)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-bodytext text-[10px] font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Move Session"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Move
                      </button>
                    </div>
                  )}

                  {!isOccupied && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEditModal(table)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-bodytext text-[10px] font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Edit Table"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePin(table.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                          isPinned 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-bodytext hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={isPinned ? 'Unpin' : 'Pin'}
                      >
                        {isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination hint */}
      {filteredTables.length > 36 && (
        <div className="text-center py-4">
          <p className="text-sm text-bodytext">
            Showing 36 of {filteredTables.length} tables. Use filters to narrow down results.
          </p>
        </div>
      )}

      {/* Empty State */}
      {filteredTables.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
            <IconSearch className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-dark dark:text-white mb-2">
            {searchQuery ? 'No tables found' : t('noTables.title')}
          </h3>
          <p className="text-bodytext mb-4 max-w-md mx-auto">
            {searchQuery 
              ? `No tables match "${searchQuery}". Try a different search term or clear filters.`
              : t('noTables.subtitle')
            }
          </p>
          {searchQuery && (
            <Button color="light" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* All Modals - keeping existing functionality */}
      {/* F&B Modal */}
      <Modal show={showFnbModal} onClose={() => setShowFnbModal(false)} size="7xl">
        <Modal.Header>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <IconToolsKitchen2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">F&B Order - {selectedTable?.name}</h3>
              <p className="text-sm text-bodytext">
                Customer: {selectedTable && sessions[selectedTable.id] ? sessions[selectedTable.id].customerName : 'N/A'}
              </p>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          {fnbLoading ? (
            <div className="flex justify-center items-center py-12">
              <DefaultSpinner />
            </div>
          ) : (
            <div className="flex gap-6 h-[600px]">
              {/* Left Pane - Menu Items */}
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 h-full">
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">
                    {tCommon('menuItems')}
                  </h3>
                  
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <IconSearch className="w-4 h-4 text-gray-400" />
                    </div>
                    <TextInput
                      type="search"
                      placeholder="Search menu items..."
                      value={fnbSearchQuery}
                      onChange={(e) => setFnbSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Categories */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <Button
                      color={!activeCategory ? "primary" : "light"}
                      size="xs"
                      onClick={() => setActiveCategory(null)}
                      className="whitespace-nowrap"
                    >
                      All
                    </Button>
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        color={activeCategory === category.id ? "primary" : "light"}
                        size="xs"
                        onClick={() => setActiveCategory(category.id)}
                        className="whitespace-nowrap"
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto">
                    {filteredFnbItems.map(item => {
                      const stockStatus = getStockStatus(item);
                      const isOutOfStock = item.stockQuantity <= 0;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => !isOutOfStock && addToCart(item)}
                          className={`
                            p-3 rounded-xl border-2 transition-all cursor-pointer
                            ${isOutOfStock 
                              ? 'opacity-50 cursor-not-allowed border-gray-200' 
                              : `hover:shadow-md hover:-translate-y-0.5 ${stockStatus.bgColor} border-transparent`
                            }
                          `}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-dark dark:text-white text-sm truncate flex-1">
                              {item.name}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${stockStatus.bgColor} ${stockStatus.textColor}`}>
                              {item.stockQuantity}
                            </span>
                          </div>
                          <p className="font-bold text-primary text-sm">
                            {formatCurrency(parseFloat(item.price))}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Pane - Cart */}
              <div className="w-96">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 h-full flex flex-col">
                  {/* Existing Orders */}
                  {existingOrders.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-dark dark:text-white mb-2">Current Orders</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {existingOrders.map(order => (
                          <div key={order.id} className="p-2 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-200 dark:border-sky-800">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium">#{order.orderNumber}</span>
                              <span className="font-bold text-primary">{formatCurrency(parseFloat(order.total))}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cart */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-dark dark:text-white">
                        New Order ({cart.length})
                      </h4>
                      {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs text-rose-600 hover:text-rose-700">
                          Clear
                        </button>
                      )}
                    </div>

                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <IconShoppingCart className="w-12 h-12 text-bodytext mx-auto mb-2" />
                        <p className="text-sm text-bodytext">Cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-bodytext">{formatCurrency(parseFloat(item.price))}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                              >
                                <IconMinus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                              >
                                <IconPlus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded bg-rose-100 text-rose-600 flex items-center justify-center ml-1"
                              >
                                <IconX className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Staff Selection & Total */}
                  {cart.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="mb-3">
                        <Label htmlFor="staffSelect" value="Staff *" className="text-xs" />
                        <Select
                          id="staffSelect"
                          value={selectedStaffId}
                          onChange={(e) => setSelectedStaffId(e.target.value)}
                          sizing="sm"
                        >
                          <option value="">Select staff</option>
                          {staff.filter(s => s.isActive).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </Select>
                      </div>
                      
                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{formatTaxLabel(taxSettings)}</span>
                          <span>{formatCurrency(calculateTax(calculateTotal()))}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(calculateTotal() + calculateTax(calculateTotal()))}</span>
                        </div>
                      </div>

                      <Button
                        color="primary"
                        className="w-full"
                        onClick={processFnbOrder}
                        disabled={!selectedStaffId}
                      >
                        <IconCheck className="w-4 h-4 mr-2" />
                        Add to Bill
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Create Table Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <Modal.Header>{tModals('tableModal.createTitle')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" value={tModals('tableModal.tableName')} />
              <TextInput
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={tModals('tableModal.tableNamePlaceholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="status" value={tModals('tableModal.status')} />
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleCreateTable}>
            {tModals('tableModal.createButton')}
          </Button>
          <Button color="secondary" onClick={() => setShowCreateModal(false)}>
            {tModals('tableModal.cancelButton')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Table Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <Modal.Header>{tModals('tableModal.editTitle')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName" value="Table Name" />
              <TextInput
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editStatus" value="Status" />
              <Select
                id="editStatus"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleUpdateTable}>Update Table</Button>
          <Button color="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Header>Delete Table</Modal.Header>
        <Modal.Body>
          <p className="text-bodytext">
            Are you sure you want to delete <strong>{selectedTable?.name}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="error" onClick={handleDeleteTable}>Delete</Button>
          <Button color="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Start Session Modal */}
      <Modal show={showSessionModal} onClose={() => setShowSessionModal(false)}>
        <Modal.Header>{tSessionModal('startTitle', { tableName: selectedTable?.name || '' })}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <Hint type="info">
              <p>Enter customer name and select a pricing package to start the session.</p>
            </Hint>
            <div>
              <Label htmlFor="customerName" value={tSessionModal('customerLabel')} />
              <TextInput
                id="customerName"
                value={sessionData.customerName}
                onChange={(e) => setSessionData({ ...sessionData, customerName: e.target.value })}
                placeholder={tSessionModal('customerPlaceholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="sessionMode" value={tSessionModal('modeLabel')} />
              <Select
                id="sessionMode"
                value={sessionData.mode}
                onChange={(e) => setSessionData({ ...sessionData, mode: e.target.value as 'open' | 'planned' })}
              >
                <option value="open">{tSessionModal('modeOptions.open')}</option>
                <option value="planned">{tSessionModal('modeOptions.planned')}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="pricingPackage" value={tSessionModal('pricingPackageLabel')} />
              <Select
                id="pricingPackage"
                value={sessionData.pricingPackageId}
                onChange={(e) => setSessionData({ ...sessionData, pricingPackageId: e.target.value })}
                required
              >
                <option value="">{tSessionModal('selectPackage')}</option>
                {pricingPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.category === 'hourly' 
                      ? `${formatCurrency(Number(pkg.hourlyRate))}/hour`
                      : `${formatCurrency(Number(pkg.perMinuteRate))}/min`
                    }
                    {pkg.isDefault && ' (Default)'}
                  </option>
                ))}
              </Select>
            </div>
            {sessionData.mode === 'planned' && (
              <div>
                <Label htmlFor="plannedDuration" value={tSessionModal('plannedDurationLabel')} />
                <Select
                  id="plannedDuration"
                  value={sessionData.plannedDuration}
                  onChange={(e) => setSessionData({ ...sessionData, plannedDuration: parseInt(e.target.value) })}
                >
                  <option value={30}>{tSessionModal('durationOptions.30minutes')}</option>
                  <option value={60}>{tSessionModal('durationOptions.60minutes')}</option>
                  <option value={90}>{tSessionModal('durationOptions.90minutes')}</option>
                  <option value={120}>{tSessionModal('durationOptions.120minutes')}</option>
                  <option value={180}>{tSessionModal('durationOptions.180minutes')}</option>
                </Select>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleStartSession}>
            <IconPlayerPlay className="w-4 h-4 mr-2" />
            Start Session
          </Button>
          <Button color="secondary" onClick={() => setShowSessionModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Billing Modal */}
      <EnhancedBillingModal
        show={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        billingData={billingData}
        onConfirmPayment={handleBillingConfirm}
      />

      {/* Duration Management Modal */}
      <Modal show={showDurationModal} onClose={() => setShowDurationModal(false)} size="md">
        <Modal.Header>{tCommon('durationManagement')}</Modal.Header>
        <Modal.Body>
          {selectedSession && selectedTable && (
            <DurationManagement
              sessionId={selectedSession.id}
              currentDurationType={(selectedSession as any).durationType || 'hourly'}
              elapsedMinutes={calculateElapsedTime(selectedSession.startTime) / 60}
              onDurationUpdate={(newDuration) => handleDurationUpdate(selectedSession.id, newDuration)}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button color="secondary" onClick={() => setShowDurationModal(false)}>{tCommon('close')}</Button>
        </Modal.Footer>
      </Modal>

      {/* Stop Session Confirmation Modal */}
      <Modal show={showStopConfirmModal} onClose={() => setShowStopConfirmModal(false)} size="md">
        <Modal.Header>{t('stopConfirmation.title')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-dark dark:text-white">
              {t('stopConfirmation.message', { tableName: tableToStop?.name || '' })}
            </p>
            {tableToStop && sessions[tableToStop.id] && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                <p className="text-sm text-bodytext">
                  {t('stopConfirmation.currentDuration')}:{' '}
                  <span className="font-bold text-dark dark:text-white">
                    {Math.floor(calculateElapsedTime(sessions[tableToStop.id].startTime) / 60)} {tCommon('minutes')}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="error"
            onClick={() => {
              if (tableToStop) handleEndSession(tableToStop.id);
              setShowStopConfirmModal(false);
              setTableToStop(null);
            }}
          >
            {t('stopConfirmation.confirm')}
          </Button>
          <Button color="secondary" onClick={() => { setShowStopConfirmModal(false); setTableToStop(null); }}>
            {t('stopConfirmation.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Move Session Modal */}
      <MoveSessionModal
        show={showMoveSessionModal}
        onClose={() => setShowMoveSessionModal(false)}
        currentTableId={selectedTable?.id || 0}
        currentTableName={selectedTable?.name || ''}
        sessionId={selectedSession?.id || 0}
        customerName={selectedSession?.customerName || ''}
        tables={tables}
        onSessionMoved={handleSessionMove}
      />
    </div>
  );
};

// Main export with ToastProvider wrapper
const TablesManagement = () => {
  return (
    <ToastProvider>
      <TablesManagementContent />
    </ToastProvider>
  );
};

export default TablesManagement;
