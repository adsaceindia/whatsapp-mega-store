import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Save, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Trash2, 
  MessageSquare, 
  Search, 
  Filter, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Users,
  Eye,
  Settings
} from 'lucide-react';
import { 
  getAnalyticsSettings, 
  saveAnalyticsSettings, 
  getGeneralSettings, 
  getStoreSettings, 
  AnalyticsSettings, 
  GeneralSettings, 
  StoreSettings 
} from '../../services/settingsService';
import { 
  getCartSessions, 
  deleteCartSession, 
  convertCartSession,
  AbandonedCartSession 
} from '../../services/abandonedCartService';
import { formatPrice } from '../../utils/currency';

export function Analytics() {
  const [activeTab, setActiveTab] = useState<'recovery' | 'settings'>('recovery');
  
  // Script Settings State
  const [settings, setSettings] = useState<AnalyticsSettings>({
    googleAnalyticsId: '',
    metaPixelId: '',
    gtmId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Abandoned Carts State
  const [sessions, setSessions] = useState<AbandonedCartSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'converted'>('all');

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const loadAllData = async () => {
    setLoading(true);
    setLoadingSessions(true);
    try {
      // Load Analytics Configuration
      const config = await getAnalyticsSettings();
      setSettings(config);

      // Load general & store settings for currency & store name
      const gen = await getGeneralSettings();
      setGeneralSettings(gen);
      const store = await getStoreSettings();
      setStoreSettings(store);

      // Load Tracked Cart Sessions
      const tracked = await getCartSessions();
      setSessions(tracked);
    } catch (error) {
      console.error("Error loading analytics dashboards:", error);
      triggerToast("Error loading statistics.", true);
    } finally {
      setLoading(false);
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefreshSessions = async () => {
    setLoadingSessions(true);
    try {
      const tracked = await getCartSessions();
      setSessions(tracked);
      triggerToast("Dashboard stats refreshed!");
    } catch (error) {
      triggerToast("Failed to refresh sessions.", true);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSaveScripts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAnalyticsSettings(settings);
      triggerToast('Tracking and script configurations saved successfully!');
    } catch (error) {
      console.error("Error saving Analytics settings:", error);
      triggerToast('Failed to save configuration.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this cart session record?")) {
      return;
    }
    try {
      await deleteCartSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      triggerToast("Session record deleted.");
    } catch (error) {
      triggerToast("Error deleting session.", true);
    }
  };

  const handleMarkConverted = async (id: string) => {
    try {
      await convertCartSession(id);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'converted' } : s));
      triggerToast("Cart marked as successfully converted!");
    } catch (error) {
      triggerToast("Error updating session status.", true);
    }
  };

  // Helper to pre-fill recovery messages
  const getWhatsAppRecoveryUrl = (session: AbandonedCartSession) => {
    if (!session.customer?.whatsapp) return '';
    const phone = session.customer.whatsapp.replace(/[^0-9]/g, '');
    const name = session.customer.name || 'there';
    const store = storeSettings?.storeName || 'our store';
    
    const itemsText = session.items.map(item => {
      let text = `• ${item.quantity}x ${item.title}`;
      const vars = [];
      if (item.size) vars.push(item.size);
      if (item.color) vars.push(item.color);
      if (vars.length > 0) text += ` [${vars.join(', ')}]`;
      return text;
    }).join('\n');
    
    const formattedPrice = formatPrice(session.total, generalSettings?.currency);
    const text = `Hi ${name}! We noticed you left some items in your cart at ${store} 🛍️\n\nHere is what you selected:\n${itemsText}\nTotal: ${formattedPrice}\n\nWould you like some help completing your order? We can arrange delivery and payment right here in chat! Let us know! 😊`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Calculations for Abandoned Carts Metrics
  const currencyCode = generalSettings?.currency || 'USD';
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'active');
  const convertedSessions = sessions.filter(s => s.status === 'converted');

  const potentialLostSales = activeSessions.reduce((sum, s) => sum + (s.total || 0), 0);
  const recoveredSales = convertedSessions.reduce((sum, s) => sum + (s.total || 0), 0);
  const recoveryRate = totalSessions > 0 ? (convertedSessions.length / totalSessions) * 100 : 0;

  // Filter matching sessions
  const filteredSessions = sessions.filter(session => {
    // Filter status
    if (statusFilter === 'active' && session.status !== 'active') return false;
    if (statusFilter === 'converted' && session.status !== 'converted') return false;

    // Search query matches customer name, WhatsApp, or product title
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = session.customer?.name?.toLowerCase().includes(term);
      const phoneMatch = session.customer?.whatsapp?.includes(term);
      const itemMatch = session.items.some(item => item.title.toLowerCase().includes(term));
      return nameMatch || phoneMatch || itemMatch;
    }

    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <LineChart className="text-primary w-8 h-8" />
            Analytics & Lost Sales Recovery
          </h1>
          <p className="text-gray-500">Track dynamic shopping behaviors, monitor potential lost sales, and recover abandoned carts with automated CRM recovery prompts.</p>
        </div>
        
        {activeTab === 'recovery' && (
          <button
            onClick={handleRefreshSessions}
            disabled={loadingSessions}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all shadow-xs self-start md:self-center disabled:opacity-50"
          >
            <RotateCw size={14} className={loadingSessions ? 'animate-spin' : ''} />
            Refresh Carts
          </button>
        )}
      </div>

      {/* Dynamic Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm text-left">
          <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 shadow-sm text-left">
          <AlertTriangle className="text-rose-500 w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Primary Tab Bar */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('recovery')}
          className={`px-5 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'recovery' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <ShoppingBag size={18} />
          Cart Recovery Dashboard
          {activeSessions.length > 0 && (
            <span className="bg-red-500 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-full animate-pulse ml-1">
              {activeSessions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'settings' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Settings size={18} />
          Tracking Scripts (GTAG, Facebook)
        </button>
      </div>

      {/* Tab View 1: Cart Recovery System */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          {/* Key Metric Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Potential Lost Revenue</p>
                  <h3 className="text-2xl font-black text-rose-600 mt-2">{formatPrice(potentialLostSales, currencyCode)}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-4 leading-normal">Total value of all incomplete checkout sessions left behind.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recovered Revenue</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-2">{formatPrice(recoveredSales, currencyCode)}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-4 leading-normal">Total value of orders converted from tracked cart sessions.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recovery Rate</p>
                  <h3 className="text-2xl font-black text-primary mt-2">{recoveryRate.toFixed(1)}%</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <Clock size={20} />
                </div>
              </div>
              {/* Simple progress visual bar */}
              <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, recoveryRate)}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Abandoned Carts</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-2">{activeSessions.length} <span className="text-xs text-gray-400 font-medium">/ {totalSessions} total</span></h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-4 leading-normal">Currently pending active sessions vs. total carts generated.</p>
            </div>
          </div>

          {/* Filtering Control Bar */}
          <div className="bg-white border border-gray-200/60 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between text-left shadow-xs">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by name, whatsapp, or product title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Segment Controls */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/40 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-400 hover:text-gray-800'
                }`}
              >
                All Sessions
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                  statusFilter === 'active' ? 'bg-white text-rose-600 shadow-xs' : 'text-gray-400 hover:text-gray-800'
                }`}
              >
                Abandoned ({activeSessions.length})
              </button>
              <button
                onClick={() => setStatusFilter('converted')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                  statusFilter === 'converted' ? 'bg-white text-emerald-600 shadow-xs' : 'text-gray-400 hover:text-gray-800'
                }`}
              >
                Recovered ({convertedSessions.length})
              </button>
            </div>
          </div>

          {/* Sessions List Table Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
            {loadingSessions ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <RotateCw className="animate-spin text-primary w-8 h-8" />
                <p className="text-gray-500 font-medium text-sm">Compiling lost cart statistics...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-20 text-center px-4">
                <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-800">No tracked cart sessions match criteria</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">Carts created by storefront visitors will automatically display in this panel.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Headers */}
                <div className="hidden lg:grid grid-cols-12 bg-gray-50/50 p-4 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <div className="col-span-3">Customer Details</div>
                  <div className="col-span-5">Cart Items Selected</div>
                  <div className="col-span-2 text-center">Value / Date</div>
                  <div className="col-span-2 text-center">Recovery Actions</div>
                </div>

                {/* Rows */}
                {filteredSessions.map((session) => {
                  const isConverted = session.status === 'converted';
                  const hasCustomerDetails = !!(session.customer?.name || session.customer?.whatsapp);
                  const waUrl = getWhatsAppRecoveryUrl(session);

                  return (
                    <div key={session.id} className="p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 items-start gap-4 hover:bg-gray-50/20 transition-colors">
                      {/* Customer Details info */}
                      <div className="col-span-1 lg:col-span-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isConverted ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className={`font-extrabold text-sm ${hasCustomerDetails ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                            {session.customer?.name || 'Anonymous Guest'}
                          </span>
                        </div>

                        {hasCustomerDetails ? (
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p className="font-semibold text-primary">{session.customer?.whatsapp}</p>
                            {session.customer?.address && (
                              <p className="line-clamp-2">
                                {session.customer.address}, {session.customer.city} - {session.customer.pincode}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 leading-normal bg-gray-50 p-2 rounded-xl border border-gray-100 border-dashed">
                            Left products in cart, did not finalize shipping form fields yet.
                          </span>
                        )}
                      </div>

                      {/* Cart Items detail list */}
                      <div className="col-span-1 lg:col-span-5 flex flex-col gap-2.5">
                        <p className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Selected Items</p>
                        <div className="flex flex-col gap-2">
                          {session.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2.5 items-center bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                              <div className="w-9 h-9 rounded bg-white border border-gray-100 p-0.5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate leading-snug">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[10px] font-mono text-gray-400">Qty: {item.quantity}</span>
                                  {item.size && (
                                    <span className="bg-gray-100 text-[9px] font-bold text-gray-500 px-1 rounded">Size: {item.size}</span>
                                  )}
                                  {item.color && (
                                    <span className="bg-gray-100 text-[9px] font-bold text-gray-500 px-1 rounded">Color: {item.color}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-extrabold font-mono text-gray-600 flex-shrink-0">
                                {formatPrice(item.price * item.quantity, currencyCode)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals & activity dates column */}
                      <div className="col-span-1 lg:col-span-2 text-left lg:text-center flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-2 py-2 lg:py-0 border-t border-b border-dashed lg:border-none border-gray-100">
                        <div>
                          <p className="lg:hidden text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Cart Total</p>
                          <span className="text-base font-black text-gray-900">{formatPrice(session.total, currencyCode)}</span>
                        </div>
                        <div className="text-right lg:text-center text-[10px] text-gray-400 leading-normal">
                          <p className="font-semibold">Active {new Date(session.updatedAt).toLocaleDateString()}</p>
                          <p>{new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>

                      {/* Status and Action Buttons Column */}
                      <div className="col-span-1 lg:col-span-2 flex flex-col items-stretch lg:items-center justify-center gap-2">
                        {/* Status Label badge */}
                        <div className="self-start lg:self-center">
                          {isConverted ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border border-emerald-100 shadow-xs">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Recovered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border border-amber-100 shadow-xs">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              Abandoned
                            </span>
                          )}
                        </div>

                        {/* CRM actions */}
                        <div className="flex flex-row lg:flex-col items-stretch gap-1.5 w-full">
                          {!isConverted && waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-colors"
                              title="Engage customer on WhatsApp with recovery script"
                            >
                              <MessageSquare size={13} />
                              <span>Recover via WA</span>
                            </a>
                          )}

                          {!isConverted && (
                            <button
                              onClick={() => handleMarkConverted(session.id)}
                              className="flex-1 lg:flex-none flex items-center justify-center gap-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-600 hover:text-emerald-700 font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all"
                              title="Mark order successfully completed manually"
                            >
                              Mark Converted
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="flex items-center justify-center border border-gray-200 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 p-1.5 rounded-xl transition-colors self-center"
                            title="Delete record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab View 2: Existing Settings Form */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl text-left animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">External Tracking & Analytics Scripts</h2>
            <p className="text-sm text-gray-500">Inject dynamic event containers and traffic measurement codes directly into your production storefront.</p>
          </div>

          {loading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2">
              <RotateCw className="animate-spin text-primary" size={18} />
              <p className="text-gray-500 text-sm">Retrieving script configuration...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSaveScripts}>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Google Analytics Measurement ID</label>
                <p className="text-xs text-gray-500 mb-2">Starts with 'G-' (e.g., G-XXXXXXXXXX) for storefront traffic reports.</p>
                <input 
                  type="text" 
                  placeholder="G-XXXXXXXXXX" 
                  value={settings.googleAnalyticsId} 
                  onChange={(e) => setSettings({...settings, googleAnalyticsId: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" 
                />
              </div>
              
              <div className="pt-4 border-t border-gray-100"></div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Google Tag Manager Container ID</label>
                <p className="text-xs text-gray-500 mb-2">Starts with 'GTM-' (e.g., GTM-XXXXXXX). This container script is injected on standard head tags.</p>
                <input 
                  type="text" 
                  placeholder="GTM-XXXXXXX" 
                  value={settings.gtmId || ''} 
                  onChange={(e) => setSettings({...settings, gtmId: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" 
                />
              </div>
              
              <div className="pt-4 border-t border-gray-100"></div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Meta (Facebook) Pixel ID</label>
                <p className="text-xs text-gray-500 mb-2">A 15 or 16 digit number to calculate ad conversions.</p>
                <input 
                  type="text" 
                  placeholder="Enter Pixel ID" 
                  value={settings.metaPixelId} 
                  onChange={(e) => setSettings({...settings, metaPixelId: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" 
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn btn-primary btn-md"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Tracking IDs'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
