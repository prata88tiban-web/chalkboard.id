"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Alert, Card, Button, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { IconSettings, IconCheck, IconX, IconPercentage, IconBuilding, IconUser, IconPrinter, IconCpu, IconBulb } from "@tabler/icons-react";
import DefaultSpinner from "@/components/ui-components/Spinner/DefaultSpinner";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('AdminPage');
  const tAlerts = useTranslations('Alerts');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [taxSettings, setTaxSettings] = useState({
    enabled: false,
    percentage: 11,
    name: 'PPN',
    applyToTables: false,
    applyToFnb: true
  });
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_notes: ''
  });
  const [storeLoading, setStoreLoading] = useState(false);
  const [staffList, setStaffList] = useState<{ id: number; name: string; role: string }[]>([]);
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [printersList, setPrintersList] = useState<any[]>([]);
  const [newPrinter, setNewPrinter] = useState({ name: '', type: 'usb', address: '', location: 'cashier' });
  const [arduinoSettings, setArduinoSettings] = useState({ port: '', baud: '9600', command: 'RELAY_{id}_{STATE}' });
  const [serialPorts, setSerialPorts] = useState<string[]>([]);
  const [defaultStaffId, setDefaultStaffId] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/authentication/login");
      return;
    }
    fetchTaxSettings();
    fetchStoreSettings();
    fetchStaffData();
    fetchTablesData();
    fetchPrintersData();
    fetchSerialPorts();
  }, [session, status, router]);

  const fetchTablesData = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTablesList(data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const fetchPrintersData = async () => {
    try {
      const response = await fetch('/api/admin/printers');
      if (response.ok) {
        const data = await response.json();
        setPrintersList(data);
      }
    } catch (error) {
      console.error('Failed to fetch printers:', error);
    }
  };

  const fetchSerialPorts = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const ports = await invoke('list_serial_ports') as string[];
        setSerialPorts(ports);
      } catch (error) {
        console.error('Failed to fetch serial ports:', error);
      }
    }
  };

  const fetchTaxSettings = async () => {
    try {
      const response = await fetch('/api/settings/tax');
      if (response.ok) {
        const settings = await response.json();
        setTaxSettings(settings);
      }
    } catch (error) {
      console.error('Failed to fetch tax settings:', error);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const s = data.settings || {};
        setStoreSettings({
          store_name: s.store_name || '',
          store_address: s.store_address || '',
          store_phone: s.store_phone || '',
          store_notes: s.store_notes || ''
        });
        setDefaultStaffId(s.default_staff_id || '');
        setArduinoSettings({
          port: s.arduino_port || '',
          baud: s.arduino_baud || '9600',
          command: s.arduino_command || 'RELAY_{id}_{STATE}'
        });
      }
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
    }
  };

  const fetchStaffData = async () => {
    try {
      const response = await fetch('/api/staff?active=true');
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleStoreSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoading(true);
    try {
      const entries = Object.entries(storeSettings);
      for (const [key, value] of entries) {
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: value || ' ', description: `Store ${key}` }),
        });
      }
      setAlert({ type: 'success', message: 'Store settings saved successfully' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save store settings' });
    } finally {
      setStoreLoading(false);
    }
  };

  const handleDefaultStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoading(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'default_staff_id', value: defaultStaffId || '0', description: 'Default staff member ID' }),
      });
      setAlert({ type: 'success', message: 'Default staff saved successfully' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save default staff' });
    } finally {
      setStaffLoading(false);
    }
  };

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrinter),
      });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Printer added successfully' });
        setNewPrinter({ name: '', type: 'usb', address: '', location: 'cashier' });
        fetchPrintersData();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to add printer' });
    }
  };

  const handleDeletePrinter = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/printers?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Printer deleted successfully' });
        fetchPrintersData();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete printer' });
    }
  };

  const handleArduinoSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'arduino_port', value: arduinoSettings.port, description: 'Arduino Serial Port' }),
      });
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'arduino_baud', value: arduinoSettings.baud, description: 'Arduino Baud Rate' }),
      });
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'arduino_command', value: arduinoSettings.command, description: 'Arduino Command Template' }),
      });
      setAlert({ type: 'success', message: 'Arduino settings saved' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save Arduino settings' });
    }
  };

  const handleTableRelayUpdate = async (tableId: number, relayId: string) => {
    try {
      await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arduinoRelay: relayId === '' ? null : parseInt(relayId) }),
      });
      fetchTablesData();
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update table relay' });
    }
  };

  const handleTaxSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/settings/tax', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taxSettings),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: tAlerts('taxSettingsUpdatedSuccess') });
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || tAlerts('failedToUpdateTaxSettings') });
      }
    } catch (error) {
      setAlert({ type: 'error', message: tAlerts('failedToUpdateTaxSettings') });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <DefaultSpinner />
      </div>
    );
  }

  if (!session) return null;

  const th = useTranslations('AdminPage.hardware');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white flex items-center gap-2">
          <IconSettings className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-bodytext mt-2">{t('subtitle')}</p>
      </div>

      {alert && (
        <Alert
          color={alert.type === 'success' ? 'success' : 'failure'}
          className="mb-6"
          onDismiss={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Settings Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-dark dark:text-white mb-2 flex items-center gap-2">
                <IconPercentage className="h-5 w-5" />
                {t('taxSettings.title')}
              </h3>
              <p className="text-bodytext text-sm mb-4">
                {t('taxSettings.subtitle')}
              </p>
            </div>

            <form onSubmit={handleTaxSettingsSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxEnabled"
                  checked={taxSettings.enabled}
                  onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
                />
                <Label htmlFor="taxEnabled">{t('taxSettings.enableTax')}</Label>
              </div>

              {taxSettings.enabled && (
                <>
                  <div>
                    <Label htmlFor="taxPercentage">{t('taxSettings.taxPercentage')}</Label>
                    <TextInput
                      id="taxPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxSettings.percentage}
                      onChange={(e) => setTaxSettings({ ...taxSettings, percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="11"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxName">{t('taxSettings.taxName')}</Label>
                    <TextInput
                      id="taxName"
                      value={taxSettings.name}
                      onChange={(e) => setTaxSettings({ ...taxSettings, name: e.target.value })}
                      placeholder="PPN"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('taxSettings.applyTaxTo')}</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="applyToTables"
                        checked={taxSettings.applyToTables}
                        onChange={(e) => setTaxSettings({ ...taxSettings, applyToTables: e.target.checked })}
                      />
                      <Label htmlFor="applyToTables">{t('taxSettings.tableSessions')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="applyToFnb"
                        checked={taxSettings.applyToFnb}
                        onChange={(e) => setTaxSettings({ ...taxSettings, applyToFnb: e.target.checked })}
                      />
                      <Label htmlFor="applyToFnb">{t('taxSettings.fnbOrders')}</Label>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>{t('taxSettings.note')}</strong> {t('taxSettings.noteText')}
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? t('taxSettings.saving') : t('taxSettings.saveTaxSettings')}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Store Settings Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-dark dark:text-white mb-2 flex items-center gap-2">
                <IconBuilding className="h-5 w-5" />
                {t('storeSettings.title')}
              </h3>
              <p className="text-bodytext text-sm mb-4">
                {t('storeSettings.subtitle')}
              </p>
            </div>

            <form onSubmit={handleStoreSettingsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="storeName">{t('storeSettings.storeName')}</Label>
                <TextInput
                  id="storeName"
                  value={storeSettings.store_name}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                  placeholder={t('storeSettings.storeNamePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="storeAddress">{t('storeSettings.storeAddress')}</Label>
                <TextInput
                  id="storeAddress"
                  value={storeSettings.store_address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value })}
                  placeholder={t('storeSettings.storeAddressPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="storePhone">{t('storeSettings.storePhone')}</Label>
                <TextInput
                  id="storePhone"
                  value={storeSettings.store_phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_phone: e.target.value })}
                  placeholder={t('storeSettings.storePhonePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="storeNotes">{t('storeSettings.storeNotes')}</Label>
                <Textarea
                  id="storeNotes"
                  rows={3}
                  value={storeSettings.store_notes}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_notes: e.target.value })}
                  placeholder={t('storeSettings.storeNotesPlaceholder')}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={storeLoading}>
                  {storeLoading ? t('storeSettings.saving') : t('storeSettings.saveStoreSettings')}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Default Staff Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-dark dark:text-white mb-2 flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                {t('defaultStaff.title')}
              </h3>
              <p className="text-bodytext text-sm mb-4">
                {t('defaultStaff.subtitle')}
              </p>
            </div>

            <form onSubmit={handleDefaultStaffSubmit} className="space-y-4">
              <div>
                <Label htmlFor="defaultStaff">{t('defaultStaff.selectStaff')}</Label>
                <Select
                  id="defaultStaff"
                  value={defaultStaffId}
                  onChange={(e) => setDefaultStaffId(e.target.value)}
                >
                  <option value="">{t('defaultStaff.noDefault')}</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name} - {s.role}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={staffLoading}>
                  {staffLoading ? t('defaultStaff.saving') : t('defaultStaff.saveDefaultStaff')}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Printer Management Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-dark dark:text-white mb-2 flex items-center gap-2">
                <IconPrinter className="h-5 w-5" />
                {th('printerTitle')}
              </h3>
              <p className="text-bodytext text-sm mb-4">
                {th('printerSubtitle')}
              </p>
            </div>

            <form onSubmit={handleAddPrinter} className="space-y-4 border-b pb-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printerName">{th('printerName')}</Label>
                  <TextInput id="printerName" value={newPrinter.name} onChange={(e) => setNewPrinter({...newPrinter, name: e.target.value})} placeholder="e.g. Epson TM-T88" required />
                </div>
                <div>
                  <Label htmlFor="printerType">{th('printerType')}</Label>
                  <Select id="printerType" value={newPrinter.type} onChange={(e) => setNewPrinter({...newPrinter, type: e.target.value})} required>
                    <option value="usb">{th('usbLocal')}</option>
                    <option value="ip">{th('networkIp')}</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="printerAddress">{th('addressIp')}</Label>
                  <TextInput id="printerAddress" value={newPrinter.address} onChange={(e) => setNewPrinter({...newPrinter, address: e.target.value})} placeholder="e.g. 192.168.1.100 or POS-80" required />
                </div>
                <div>
                  <Label htmlFor="printerLoc">{th('location')}</Label>
                  <Select id="printerLoc" value={newPrinter.location} onChange={(e) => setNewPrinter({...newPrinter, location: e.target.value})} required>
                    <option value="cashier">{th('cashier')}</option>
                    <option value="kitchen">{th('kitchen')}</option>
                    <option value="bar">{th('bar')}</option>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm">{th('addPrinter')}</Button>
              </div>
            </form>

            <div className="space-y-2">
              {printersList.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{p.name} ({th(p.location)})</p>
                    <p className="text-xs text-bodytext">{p.type === 'usb' ? th('usbLocal') : th('networkIp')} - {p.address}</p>
                  </div>
                  <Button color="failure" size="xs" onClick={() => handleDeletePrinter(p.id)}><IconX size={14} /></Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Arduino Configuration Card */}
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-dark dark:text-white mb-2 flex items-center gap-2">
                <IconCpu className="h-5 w-5" />
                {th('arduinoTitle')}
              </h3>
              <p className="text-bodytext text-sm mb-4">
                {th('arduinoSubtitle')}
              </p>
            </div>

            <form onSubmit={handleArduinoSettingsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="arduinoPort">{th('serialPort')}</Label>
                <Select id="arduinoPort" value={arduinoSettings.port} onChange={(e) => setArduinoSettings({...arduinoSettings, port: e.target.value})}>
                  <option value="">{th('serialPort')}</option>
                  {serialPorts.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="arduinoBaud">{th('baudRate')}</Label>
                <Select id="arduinoBaud" value={arduinoSettings.baud} onChange={(e) => setArduinoSettings({...arduinoSettings, baud: e.target.value})}>
                  <option value="9600">9600</option>
                  <option value="115200">115200</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="arduinoCommand">{th('arduinoCommand')}</Label>
                <TextInput id="arduinoCommand" value={arduinoSettings.command} onChange={(e) => setArduinoSettings({...arduinoSettings, command: e.target.value})} placeholder={th('arduinoCommandPlaceholder')} />
              </div>
              <div className="flex justify-end">
                <Button type="submit">{th('saveArduino')}</Button>
              </div>
            </form>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2"><IconBulb size={18} /> {th('tableRelayMapping')}</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {tablesList.map((table) => (
                  <div key={table.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{table.name}</span>
                    <TextInput
                      type="number"
                      size="sm"
                      className="w-24"
                      placeholder={th('relayId')}
                      value={table.arduinoRelay ?? ''}
                      onChange={(e) => handleTableRelayUpdate(table.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Existing Billing System Card */}
        <Card>
          <div>
            <h3 className="text-xl font-semibold text-dark dark:text-white mb-2">
              {t('billingSystem.title')}
            </h3>
            <p className="text-bodytext text-sm mb-4">
              {t('billingSystem.subtitle')}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
              ✅ {t('billingSystem.perMinuteAvailable')}
            </h4>
            <ul className="text-sm text-green-600 dark:text-green-400 space-y-2">
              <li>• {t('billingSystem.features.individualConfig')}</li>
              <li>• {t('billingSystem.features.hourlyBilling')}</li>
              <li>• {t('billingSystem.features.perMinuteBilling')}</li>
              <li>• {t('billingSystem.features.easyManagement')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
              📋 {t('billingSystem.howToTitle')}
            </h4>
            <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>1. {t('billingSystem.steps.step1')}</li>
              <li>2. {t('billingSystem.steps.step2')}</li>
              <li>3. {t('billingSystem.steps.step3')}</li>
              <li>4. {t('billingSystem.steps.step4')}</li>
            </ol>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-medium text-dark dark:text-white">{t('systemInfo.title')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-bodytext">{t('systemInfo.version')}</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bodytext">{t('systemInfo.perMinuteBilling')}</span>
                <span className="font-medium text-green-600">{t('systemInfo.active')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bodytext">{t('systemInfo.individualTableConfig')}</span>
                <span className="font-medium text-green-600">{t('systemInfo.enabled')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bodytext">{t('systemInfo.apiEndpoints')}</span>
                <span className="font-medium text-green-600">{t('systemInfo.active')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}