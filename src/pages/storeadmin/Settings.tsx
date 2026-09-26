import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Plus, 
  Trash2, 
  CreditCard, 
  Truck, 
  Lock, 
  Key, 
  Mail, 
  Smartphone,
  Eye,
  EyeOff,
  Sliders,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Globe,
  Coins,
  FileText,
  Cpu,
  Loader2
} from 'lucide-react';
import { 
  getGeneralSettings, 
  saveGeneralSettings, 
  GeneralSettings,
  getPaymentSettings,
  savePaymentSettings,
  PaymentSettings,
  getCourierSettings,
  saveCourierSettings,
  CourierSettings,
  getAuthSettings,
  saveAuthSettings,
  AuthSettings,
  getPageSettings,
  savePageSettings,
  PageSettings,
  getAutomationSettings,
  saveAutomationSettings,
  AutomationSettings
} from '../../services/settingsService';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'courier' | 'auth' | 'pages' | 'automation'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    whatsappNumber: '+1234567890',
    currency: 'USD'
  });
  const [currencies, setCurrencies] = useState<{value: string, label: string}[]>([
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' }
  ]);
  const [newCurrencyValue, setNewCurrencyValue] = useState('');
  const [newCurrencyLabel, setNewCurrencyLabel] = useState('');
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);

  // Payment Gateways State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    paytmEnabled: false,
    paytmMerchantId: '',
    paytmMerchantKey: '',
    upiEnabled: false,
    upiId: '',
    upiName: '',
    cardsEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalEnabled: false,
    paypalEmail: '',
    internationalEnabled: false,
    internationalProvider: 'PayPal',
    codEnabled: true
  });

  // Courier State
  const [courierSettings, setCourierSettings] = useState<CourierSettings>({
    shiprocketEnabled: false,
    shiprocketEmail: '',
    shiprocketPassword: '',
    delhiveryEnabled: false,
    delhiveryApiKey: '',
    customCourierEnabled: false,
    customCourierName: '',
    customCourierRate: 0
  });

  // Admin Account State
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    email: '',
    mobile: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Custom Store Pages State
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    aboutUs: '',
    shippingPolicy: '',
    termsOfService: ''
  });

  // Automation & Integrations State
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    webhookUrl: '',
    enabled: false,
    triggerOnCreated: true,
    triggerOnUpdated: false,
    triggerOnDeleted: false
  });

  useEffect(() => {
    const fetchAllSettings = async () => {
      setLoading(true);
      try {
        const general = await getGeneralSettings();
        setGeneralSettings(general);
        if (general.customCurrencies) {
          setCurrencies(prev => {
            const defaults = prev.filter(c => ['USD', 'EUR', 'GBP', 'INR'].includes(c.value));
            const merged = [...defaults];
            general.customCurrencies?.forEach(cc => {
              if (!merged.find(m => m.value === cc.value)) {
                merged.push(cc);
              }
            });
            return merged;
          });
        }

        const payment = await getPaymentSettings();
        setPaymentSettings(payment);

        const courier = await getCourierSettings();
        setCourierSettings(courier);

        const auth = await getAuthSettings();
        if (auth) setAuthSettings(auth);

        const pages = await getPageSettings();
        setPageSettings(pages);

        const automation = await getAutomationSettings();
        setAutomationSettings(automation);
      } catch (error) {
        console.error("Error loading settings:", error);
        setErrorMsg("Failed to load settings from database.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllSettings();
  }, []);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 4000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalSettings.whatsappNumber) {
      triggerToast("Please enter a valid WhatsApp number.", true);
      return;
    }
    setSaving(true);
    try {
      const defaultCodes = ['USD', 'EUR', 'GBP', 'INR'];
      const customCurrencies = currencies.filter(c => !defaultCodes.includes(c.value));
      const payload = {
        ...generalSettings,
        customCurrencies
      };
      await saveGeneralSettings(payload);
      triggerToast("General settings saved successfully!");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to save general settings.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePaymentSettings(paymentSettings);
      triggerToast("Payment gateways configuration updated successfully!");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to save payment gateway settings.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCourierSettings(courierSettings);
      triggerToast("Courier integrations settings updated!");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to save courier configurations.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authSettings.password || authSettings.password.length < 6) {
      triggerToast("Password must be at least 6 characters long.", true);
      return;
    }
    setSaving(true);
    try {
      await saveAuthSettings(authSettings);
      triggerToast("Login credentials updated successfully!");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to update credentials.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePages = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePageSettings(pageSettings);
      triggerToast("Legal & Info pages saved successfully!");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to save store pages settings.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAutomationSettings(automationSettings);
      triggerToast("Automation and Webhook settings saved successfully!");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to save automation settings.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!automationSettings.webhookUrl) {
      triggerToast("Please enter a Webhook URL first.", true);
      return;
    }
    try {
      triggerToast("Sending test webhook request...");
      const response = await fetch(automationSettings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-Event': 'test.ping'
        },
        body: JSON.stringify({
          event: 'test.ping',
          timestamp: new Date().toISOString(),
          message: 'Hello from your My Store! Webhook configuration is active.',
          data: {
            storeName: 'Boutique Storefront',
            test: true
          }
        })
      });
      if (response.ok || response.status === 200) {
        triggerToast("Test webhook delivered successfully!");
      } else {
        triggerToast(`Webhook responded with status ${response.status}`, true);
      }
    } catch (error) {
      console.error(error);
      triggerToast("Webhook delivery initiated. (CORS restriction might hide response, check destination tool).");
    }
  };

  const handleAddCurrency = () => {
    if (newCurrencyValue && newCurrencyLabel) {
      if (currencies.find(c => c.value === newCurrencyValue)) {
        triggerToast("Currency code already exists.", true);
        return;
      }
      setCurrencies(prev => [...prev, { value: newCurrencyValue, label: newCurrencyLabel }]);
      setNewCurrencyValue('');
      setNewCurrencyLabel('');
      setIsAddingCurrency(false);
    }
  };

  const handleRemoveCurrency = (value: string) => {
    setCurrencies(prev => prev.filter(c => c.value !== value));
    if (generalSettings.currency === value) {
      setGeneralSettings(prev => ({ ...prev, currency: currencies[0]?.value || '' }));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="text-primary w-8 h-8 animate-spin-slow" />
          Settings Panel
        </h1>
        <p className="text-gray-500">Manage integrations, payments, courier providers, and administrator security.</p>
      </div>

      {/* Dynamic Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="text-rose-500 w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium text-sm ${
              activeTab === 'general'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sliders className="w-5 h-5" />
            General & Currencies
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium text-sm ${
              activeTab === 'payment'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Online Payments
          </button>
          <button
            onClick={() => setActiveTab('courier')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium text-sm ${
              activeTab === 'courier'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Truck className="w-5 h-5" />
            Courier Services
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium text-sm ${
              activeTab === 'auth'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Lock className="w-5 h-5" />
            Admin Login Account
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium text-sm ${
              activeTab === 'pages'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Store Pages (About, Policies)
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium text-sm ${
              activeTab === 'automation'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Cpu className="w-5 h-5" />
            Integrations & Webhooks
          </button>
        </div>

        {/* Configurations Forms Container */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-9 h-9 animate-spin text-primary" />
              <p className="text-gray-500 mt-2 font-medium">Retrieving settings...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: GENERAL & CURRENCIES */}
              {activeTab === 'general' && (
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">General Preferences</h2>
                    <p className="text-sm text-gray-500 mb-4">Set up primary parameters for order routing.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">WhatsApp Number</label>
                    <p className="text-xs text-gray-500 mb-2">The standard phone number where customer cart checkouts will be redirected.</p>
                    <input 
                      type="text" 
                      value={generalSettings.whatsappNumber || ''} 
                      onChange={e => setGeneralSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white" 
                      required
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Store Currency</label>
                    <div className="flex items-center gap-3 mb-4">
                      <select 
                        value={generalSettings.currency}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      >
                        {currencies.map(c => (
                          <option key={c.value} value={c.value}>{c.value} - {c.label}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => setIsAddingCurrency(!isAddingCurrency)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-xl transition-colors flex-shrink-0"
                        title="Add Custom Currency"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {/* Custom currency manager inside block */}
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Available Currencies</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currencies.map(c => (
                          <div key={c.value} className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                            <span>{c.value} - {c.label}</span>
                            {currencies.length > 1 && (
                              <button type="button" onClick={() => handleRemoveCurrency(c.value)} className="text-red-400 hover:text-red-600 ml-1">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {isAddingCurrency && (
                        <div className="flex items-end gap-2 bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 mb-1 font-semibold">CODE (e.g. AUD)</label>
                            <input 
                              type="text" 
                              value={newCurrencyValue}
                              onChange={e => setNewCurrencyValue(e.target.value.toUpperCase())}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 mb-1 font-semibold">LABEL (e.g. Australian Dollar)</label>
                            <input 
                              type="text" 
                              value={newCurrencyLabel}
                              onChange={e => setNewCurrencyLabel(e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleAddCurrency}
                            disabled={!newCurrencyValue || !newCurrencyLabel}
                            className="btn btn-primary btn-sm"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save General Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ONLINE PAYMENTS */}
              {activeTab === 'payment' && (
                <form onSubmit={handleSavePayments} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Online Payment Options</h2>
                    <p className="text-sm text-gray-500 mb-4">Enable online payment options like Razorpay, Paytm, UPI, and global banking cards.</p>
                  </div>

                  {/* 1. Razorpay Option */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-blue-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Razorpay Gateway Integration</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.razorpayEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, razorpayEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {paymentSettings.razorpayEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Razorpay Key ID</label>
                          <input 
                            type="text" 
                            value={paymentSettings.razorpayKeyId} 
                            onChange={e => setPaymentSettings({...paymentSettings, razorpayKeyId: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="rzp_live_xxxxxxxxxxxx"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Razorpay Secret Key</label>
                          <input 
                            type="password" 
                            value={paymentSettings.razorpayKeySecret} 
                            onChange={e => setPaymentSettings({...paymentSettings, razorpayKeySecret: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="•••••••••••••••••••••"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Paytm Option */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-cyan-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Paytm Payment Gateway</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.paytmEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, paytmEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {paymentSettings.paytmEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Paytm Merchant ID</label>
                          <input 
                            type="text" 
                            value={paymentSettings.paytmMerchantId} 
                            onChange={e => setPaymentSettings({...paymentSettings, paytmMerchantId: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="Enter Merchant ID"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Paytm Merchant Key</label>
                          <input 
                            type="password" 
                            value={paymentSettings.paytmMerchantKey} 
                            onChange={e => setPaymentSettings({...paymentSettings, paytmMerchantKey: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="•••••••••••••••••••••"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. UPI Option */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="text-purple-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Direct UPI Transfer (GPay, PhonePe, Paytm QR)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.upiEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, upiEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {paymentSettings.upiEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">UPI ID (VPA)</label>
                          <input 
                            type="text" 
                            value={paymentSettings.upiId} 
                            onChange={e => setPaymentSettings({...paymentSettings, upiId: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="merchant@upi"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Merchant / Account Name</label>
                          <input 
                            type="text" 
                            value={paymentSettings.upiName} 
                            onChange={e => setPaymentSettings({...paymentSettings, upiName: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="Store Name Pvt Ltd"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Global Credit/Debit Card Option (Stripe) */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="text-rose-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Online Banking Card Payments (Stripe)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.cardsEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, cardsEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {paymentSettings.cardsEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe Publishable Key</label>
                          <input 
                            type="text" 
                            value={paymentSettings.stripePublicKey} 
                            onChange={e => setPaymentSettings({...paymentSettings, stripePublicKey: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="pk_live_xxxxxxxxxxxxxx"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe Secret Key</label>
                          <input 
                            type="password" 
                            value={paymentSettings.stripeSecretKey} 
                            onChange={e => setPaymentSettings({...paymentSettings, stripeSecretKey: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="•••••••••••••••••••••"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. PayPal Gateway */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="text-indigo-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">PayPal Gateway</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.paypalEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, paypalEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {paymentSettings.paypalEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">PayPal Business Email</label>
                          <input 
                            type="email" 
                            value={paymentSettings.paypalEmail} 
                            onChange={e => setPaymentSettings({...paymentSettings, paypalEmail: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="paypal@yourstore.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. International Payment */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="text-emerald-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">International Payment Option</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.internationalEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, internationalEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {paymentSettings.internationalEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred International Gateway</label>
                          <select 
                            value={paymentSettings.internationalProvider} 
                            onChange={e => setPaymentSettings({...paymentSettings, internationalProvider: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary bg-white"
                          >
                            <option value="PayPal">PayPal Business</option>
                            <option value="Stripe">Stripe International</option>
                            <option value="Wise">Wise / TransferWise</option>
                            <option value="Payoneer">Payoneer Merchant</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 7. Cash on Delivery (COD) */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-amber-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Cash on Delivery (COD) Option</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paymentSettings.codEnabled} 
                          onChange={e => setPaymentSettings({...paymentSettings, codEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Payment Gateways'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: COURIER SERVICES */}
              {activeTab === 'courier' && (
                <form onSubmit={handleSaveCourier} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Courier & Delivery Integrations</h2>
                    <p className="text-sm text-gray-500 mb-4">Configure courier provider services like Shiprocket, Delhivery, or set a custom rate.</p>
                  </div>

                  {/* 1. Shiprocket Service */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="text-amber-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Shiprocket Automated Shipping</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={courierSettings.shiprocketEnabled} 
                          onChange={e => setCourierSettings({...courierSettings, shiprocketEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {courierSettings.shiprocketEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Shiprocket Registered Email</label>
                          <input 
                            type="email" 
                            value={courierSettings.shiprocketEmail} 
                            onChange={e => setCourierSettings({...courierSettings, shiprocketEmail: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="shiprocket@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Shiprocket API Password</label>
                          <input 
                            type="password" 
                            value={courierSettings.shiprocketPassword} 
                            onChange={e => setCourierSettings({...courierSettings, shiprocketPassword: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="•••••••••••••••••••••"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Delhivery Service */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="text-violet-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Delhivery Express Logistics</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={courierSettings.delhiveryEnabled} 
                          onChange={e => setCourierSettings({...courierSettings, delhiveryEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {courierSettings.delhiveryEnabled && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Delhivery Client API Token</label>
                        <input 
                          type="text" 
                          value={courierSettings.delhiveryApiKey} 
                          onChange={e => setCourierSettings({...courierSettings, delhiveryApiKey: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                          placeholder="delhivery_api_key_xxxxxxxxxxxxx"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Custom Courier Rates */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="text-teal-600 w-5 h-5" />
                        <span className="font-bold text-sm text-gray-800">Manual / Flat Rate Courier Shipping</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={courierSettings.customCourierEnabled} 
                          onChange={e => setCourierSettings({...courierSettings, customCourierEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {courierSettings.customCourierEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Courier Service Name</label>
                          <input 
                            type="text" 
                            value={courierSettings.customCourierName} 
                            onChange={e => setCourierSettings({...courierSettings, customCourierName: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="Standard Home Delivery"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Shipping Cost Flat Rate ({generalSettings.currency})</label>
                          <input 
                            type="number" 
                            value={courierSettings.customCourierRate} 
                            onChange={e => setCourierSettings({...courierSettings, customCourierRate: Number(e.target.value)})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                            placeholder="5.00"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Courier Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: ADMIN LOGIN ACCOUNT */}
              {activeTab === 'auth' && (
                <form onSubmit={handleSaveAuth} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Administrator Access Credentials</h2>
                    <p className="text-sm text-gray-500 mb-4">Change your login details including registered Email, Mobile, and Password.</p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      Security Advisory
                    </h4>
                    <p className="text-xs">
                      Updating these details allows logging into the administrator portal using an Email or Mobile number combined with a Password. Keep these details secure!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Registered Administrator Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                        <input 
                          type="email" 
                          value={authSettings.email || ''} 
                          onChange={e => setAuthSettings({...authSettings, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white" 
                          required
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Registered Mobile Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                        <input 
                          type="text" 
                          value={authSettings.mobile || ''} 
                          onChange={e => setAuthSettings({...authSettings, mobile: e.target.value})}
                          className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white" 
                          required
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Administrator Login Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={authSettings.password || ''} 
                        onChange={e => setAuthSettings({...authSettings, password: e.target.value})}
                        className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-12 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white" 
                        required
                        placeholder="Enter secure password (min. 6 chars)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 px-1 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={16} />
                      {saving ? 'Updating...' : 'Update Login Credentials'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: CUSTOM PAGES EDITING */}
              {activeTab === 'pages' && (
                <form onSubmit={handleSavePages} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Legal & Information Pages</h2>
                    <p className="text-sm text-gray-500 mb-4">Draft and customize standard business page details for the boutique storefront.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">About Us</label>
                    <p className="text-xs text-gray-500 mb-2">A concise brief about your story, heritage, and unique craftsmanship.</p>
                    <textarea 
                      value={pageSettings.aboutUs || ''} 
                      onChange={e => setPageSettings(prev => ({ ...prev, aboutUs: e.target.value }))}
                      rows={5}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y" 
                      required
                      placeholder="We are a boutique fashion and craft store..."
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Shipping & Delivery Policy</label>
                    <p className="text-xs text-gray-500 mb-2">Details on processing speeds, transit windows, packaging care, and tracking numbers.</p>
                    <textarea 
                      value={pageSettings.shippingPolicy || ''} 
                      onChange={e => setPageSettings(prev => ({ ...prev, shippingPolicy: e.target.value }))}
                      rows={5}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y" 
                      required
                      placeholder="We offer premium shipping options..."
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Terms of Service</label>
                    <p className="text-xs text-gray-500 mb-2">Legal parameters governing sales, custom order requests, cancellation boundaries, and returns.</p>
                    <textarea 
                      value={pageSettings.termsOfService || ''} 
                      onChange={e => setPageSettings(prev => ({ ...prev, termsOfService: e.target.value }))}
                      rows={5}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y" 
                      required
                      placeholder="By placing an order, you agree to our policies..."
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Legal & Info Pages'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 6: WEBHOOK & AUTOMATIONS */}
              {activeTab === 'automation' && (
                <form onSubmit={handleSaveAutomation} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Integrations & Outbound Webhooks</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Connect your storefront with automation tools like <strong className="text-gray-800">n8n</strong>, <strong className="text-gray-800">Make (Integromat)</strong>, or <strong className="text-gray-800">Zapier</strong> to sync orders, print invoices, or trigger custom notifications.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Enable Automation Webhooks</h4>
                      <p className="text-xs text-gray-500">Enable or disable outbound HTTP POST request hooks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={automationSettings.enabled || false}
                        onChange={e => setAutomationSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Target Webhook URL</label>
                      <p className="text-xs text-gray-500 mb-2">The HTTP POST endpoint URL provided by your automation platform where the JSON payload will be sent.</p>
                      <input 
                        type="url" 
                        value={automationSettings.webhookUrl || ''} 
                        onChange={e => setAutomationSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        disabled={!automationSettings.enabled}
                        className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white disabled:opacity-50 font-mono" 
                        placeholder="https://your-n8n-domain/webhook/order-received"
                        required={automationSettings.enabled}
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Event Triggers</label>
                      <p className="text-xs text-gray-500 mb-4">Choose which database actions will trigger a webhook transmission.</p>
                      
                      <div className="space-y-3">
                        <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${!automationSettings.enabled ? 'opacity-50 pointer-events-none bg-gray-50/50' : 'hover:bg-gray-50 border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={automationSettings.triggerOnCreated || false}
                            onChange={e => setAutomationSettings(prev => ({ ...prev, triggerOnCreated: e.target.checked }))}
                            disabled={!automationSettings.enabled}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              Order Created <span className="text-[10px] font-mono px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">order.created</span>
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Triggers immediately when a customer submits a new checkout order.</p>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${!automationSettings.enabled ? 'opacity-50 pointer-events-none bg-gray-50/50' : 'hover:bg-gray-50 border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={automationSettings.triggerOnUpdated || false}
                            onChange={e => setAutomationSettings(prev => ({ ...prev, triggerOnUpdated: e.target.checked }))}
                            disabled={!automationSettings.enabled}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              Order Updated <span className="text-[10px] font-mono px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100">order.updated</span>
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Triggers when an administrative staff updates the order status, payment, or shipping carrier.</p>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${!automationSettings.enabled ? 'opacity-50 pointer-events-none bg-gray-50/50' : 'hover:bg-gray-50 border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={automationSettings.triggerOnDeleted || false}
                            onChange={e => setAutomationSettings(prev => ({ ...prev, triggerOnDeleted: e.target.checked }))}
                            disabled={!automationSettings.enabled}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              Order Deleted <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">order.deleted</span>
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Triggers when an order is removed or deleted from the administrative console.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {automationSettings.enabled && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-blue-900">Test Your Automation Flow</h4>
                        <p className="text-xs text-blue-700">Send a live test webhook containing a mock payload (<code className="font-mono bg-blue-100/50 px-1 py-0.5 rounded text-[10px]">test.ping</code>) to auto-configure and verify your flow schema mapping inside n8n, Make, or Zapier.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        <Cpu size={14} />
                        Deliver Test Payload
                      </button>
                    </div>
                  )}

                  <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Integration Configuration Tips</h4>
                    <ul className="text-xs text-gray-500 space-y-2 font-sans list-disc list-inside">
                      <li><strong className="text-gray-700">Zapier:</strong> Create a new Zap. Set the App trigger to <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">Webhooks by Zapier</code> and selection as <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">Catch Hook</code>. Paste the hook URL in the input field above.</li>
                      <li><strong className="text-gray-700">n8n:</strong> Drop a <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">Webhook</code> node into your workflow canvas, set the method to <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">POST</code>, and copy the Production/Test URL.</li>
                      <li><strong className="text-gray-700">Make (Integromat):</strong> Add a new Scenario, choose the <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">Webhooks</code> module, add a <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">Custom Webhook</code>, and copy the hook URL.</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Automation Config'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
