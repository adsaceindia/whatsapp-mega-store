import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { motion, AnimatePresence } from 'motion/react';
import { getOrderById, Order } from '../../services/orderService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { formatPrice } from '../../utils/currency';

export function OrderTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get('id') || '';

  const [orderId, setOrderId] = useState(orderIdParam);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);

  useEffect(() => {
    getGeneralSettings().then(setGeneralSettings).catch(console.error);
  }, []);

  // Run search if URL has an ID on mount
  useEffect(() => {
    if (orderIdParam) {
      handleSearch(orderIdParam);
    }
  }, [orderIdParam]);

  const handleSearch = async (idToSearch: string) => {
    const cleanId = idToSearch.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setSearched(true);
    try {
      const fetchedOrder = await getOrderById(cleanId);
      setOrder(fetchedOrder);
      // Update URL param
      setSearchParams({ id: cleanId });
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(orderId);
  };

  // Status mapping and configuration
  const statusSteps = [
    { key: 'pending', label: 'Order Confirmed', icon: 'check_circle', desc: 'Your order has been received and verified.' },
    { key: 'processing', label: 'Processing', icon: 'inventory_2', desc: 'Our team is curating, inspecting, and packaging your bespoke items.' },
    { key: 'shipped', label: 'Dispatched', icon: 'local_shipping', desc: 'The order has left our boutique and is en route with our premium courier.' },
    { key: 'delivered', label: 'Delivered', icon: 'home', desc: 'Package successfully delivered and received.' },
  ];

  const getActiveStepIndex = (currentStatus: string) => {
    const status = (currentStatus || 'pending').toLowerCase();
    if (status === 'cancelled') return -1;
    
    const index = statusSteps.findIndex(s => s.key === status);
    if (index !== -1) return index;

    // Fallbacks
    if (status === 'completed') return 3;
    return 0; // pending
  };

  const getStepStatus = (index: number, activeIndex: number) => {
    if (activeIndex === -1) return 'cancelled';
    if (index < activeIndex) return 'completed';
    if (index === activeIndex) return 'active';
    return 'upcoming';
  };

  // Format date helper
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Estimated arrival simulation based on status and created date
  const getEstimatedArrival = (createdDateStr: string, currentStatus: string) => {
    if (!createdDateStr || currentStatus === 'delivered' || currentStatus === 'cancelled') return '';
    try {
      const date = new Date(createdDateStr);
      // Premium fast 3-day delivery window
      date.setDate(date.getDate() + 3);
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const activeIndex = order ? getActiveStepIndex(order.status) : 0;
  const estArrival = order ? getEstimatedArrival(order.createdAt, order.status) : '';
  const storePhone = generalSettings?.whatsappNumber?.replace(/[^0-9]/g, '') || "1234567890";
  const supportLink = order 
    ? `https://wa.me/${storePhone}?text=Hi! I am checking on the status of my Order ID: ${order.id}. Could you please share updates?`
    : `https://wa.me/${storePhone}?text=Hi! I need help with tracking an order.`;

  return (
    <div className="w-full min-h-screen bg-background py-8 md:py-12 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Page Title & Back link */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary mb-3 uppercase tracking-wider transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Boutique
          </Link>
          <span className="material-symbols-outlined text-primary text-4xl mb-2">local_shipping</span>
          <h1 className="text-3xl font-serif font-semibold text-on-surface">Track Your Order</h1>
          <p className="text-sm text-on-surface-variant max-w-md mt-1">
            Enter your unique Order ID to track real-time delivery status, curated milestones, and receipt details.
          </p>
        </div>

        {/* Search Bar Card */}
        <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg">tag</span>
              <input 
                type="text" 
                placeholder="Enter Order ID (e.g. ORD-48201)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-neutral-900 border border-transparent focus:border-primary/30 transition-all uppercase placeholder:normal-case"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-primary text-on-primary hover:bg-primary-fixed hover:text-on-primary-fixed transition-all duration-300 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm font-bold">search</span>
                  <span>Track Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Container with AnimatePresence */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Shimmer Skeleton for tracking page */}
              <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                    <div className="w-48 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                  </div>
                  <div className="w-32 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
                </div>
                
                {/* Stepper Shimmer */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center text-center space-y-3">
                      <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                      <div className="w-28 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                      <div className="w-20 h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Card Shimmer */}
              <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 space-y-4">
                <div className="w-36 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4 py-3 border-b border-outline-variant/10">
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                      <div className="flex-grow space-y-2">
                        <div className="w-1/2 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                        <div className="w-12 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : order ? (
            <motion.div
              key="order-found"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Order Status & Progress Milestone Card */}
              <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-outline-variant/10 mb-8">
                  <div>
                    <span className="text-xs font-bold text-primary font-mono bg-primary/5 dark:bg-primary/10 px-2.5 py-1 rounded-full uppercase">
                      ID: {order.id}
                    </span>
                    <h2 className="text-sm font-semibold text-on-surface-variant mt-2">
                      Placed on {formatDateString(order.createdAt)}
                    </h2>
                  </div>
                  
                  {order.status === 'cancelled' ? (
                    <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 px-4 py-2 rounded-2xl text-center text-xs font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      <span>ORDER CANCELLED</span>
                    </div>
                  ) : estArrival ? (
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 px-4 py-2.5 rounded-2xl text-left">
                      <span className="block text-[10px] font-bold text-primary uppercase tracking-widest">Estimated Delivery</span>
                      <span className="block text-sm font-bold text-on-surface">{estArrival}</span>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-900/30 px-4 py-2.5 rounded-2xl text-center text-xs font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>DELIVERED & COMPLETE</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {order.status !== 'cancelled' && (
                  <div className="relative w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-10 overflow-hidden">
                    <motion.div 
                      className="absolute left-0 top-0 h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(activeIndex + 1) * 25}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                )}

                {/* Vertical (Mobile) / Horizontal (Desktop) Stepper */}
                <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-4 gap-6">
                  {order.status === 'cancelled' ? (
                    <div className="col-span-4 p-6 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-start gap-4 text-left">
                      <span className="material-symbols-outlined text-red-500 text-3xl">cancel</span>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Bespoke Order Voided</h4>
                        <p className="text-xs text-on-surface-variant mt-1">
                          This order was cancelled. Any pre-authorized payment has been refunded to your source method. For details, please query boutique support.
                        </p>
                      </div>
                    </div>
                  ) : (
                    statusSteps.map((step, idx) => {
                      const stepStatus = getStepStatus(idx, activeIndex);
                      return (
                        <div key={step.key} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3 group">
                          {/* Step Icon circle */}
                          <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border
                            ${stepStatus === 'completed' ? 'bg-primary border-primary text-white' : 
                              stepStatus === 'active' ? 'bg-white dark:bg-neutral-950 border-primary text-primary shadow-md ring-4 ring-primary/15' : 
                              'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-on-surface-variant'}`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {stepStatus === 'completed' ? 'check' : step.icon}
                            </span>
                          </div>

                          {/* Step details */}
                          <div className="space-y-1">
                            <h3 className={`text-xs font-bold uppercase tracking-wider
                              ${stepStatus === 'active' ? 'text-primary' : 
                                stepStatus === 'completed' ? 'text-on-surface' : 'text-on-surface-variant'}`}
                            >
                              {step.label}
                            </h3>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-[180px]">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Customer and Order Summary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Shipping Details */}
                <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 shadow-sm text-left">
                  <h3 className="text-base font-serif font-semibold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    Delivery Address
                  </h3>
                  <div className="space-y-2.5 text-xs text-on-surface-variant">
                    <p className="font-bold text-on-surface text-sm">{order.customer.name}</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-sm">chat</span>
                      WhatsApp: {order.customer.whatsapp}
                    </p>
                    <div className="border-t border-outline-variant/10 my-2 pt-2 space-y-1.5">
                      <p className="font-medium text-on-surface leading-relaxed">{order.customer.address}</p>
                      <p className="font-medium">{order.customer.city} - {order.customer.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Help / Support */}
                <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 shadow-sm text-left flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-serif font-semibold text-on-surface mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">support_agent</span>
                      Boutique Support
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Need specialized assistance or looking to customize delivery preferences? Chat instantly with our concierge on WhatsApp.
                    </p>
                  </div>
                  <a
                    href={supportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#25D366] text-white hover:bg-[#20ba56] transition-colors rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

              </div>

              {/* Order Receipt and Items Table */}
              <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-8 shadow-sm text-left">
                <h3 className="text-base font-serif font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Items Curated
                </h3>
                
                <div className="space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex gap-4 pb-4 border-b border-outline-variant/10 last:border-0 last:pb-0 items-center">
                      <ResponsiveImage src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-xl border border-outline-variant/15" />
                      <div className="flex-grow">
                        <h4 className="text-xs font-bold text-on-surface">{item.title}</h4>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                          {formatPrice(item.price, generalSettings?.currency)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-xs font-bold text-on-surface">
                        {formatPrice(item.price * item.quantity, generalSettings?.currency)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & total summary */}
                <div className="border-t border-outline-variant/10 mt-6 pt-5 space-y-2.5">
                  <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal || order.total, generalSettings?.currency)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-xs text-green-600 font-semibold">
                      <span>Discount code</span>
                      <span>-{formatPrice(order.discount, generalSettings?.currency)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                      <span>Estimated Taxes</span>
                      <span>{formatPrice(order.tax, generalSettings?.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-outline-variant/20 pt-3 flex justify-between text-sm font-bold text-on-surface">
                    <span>Total price</span>
                    <span className="text-primary text-base font-serif font-semibold">
                      {formatPrice(order.total, generalSettings?.currency)}
                    </span>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : searched ? (
            <motion.div
              key="no-order"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-surface border border-outline-variant/15 rounded-3xl p-10 text-center space-y-4 shadow-sm"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/25 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/30">
                <span className="material-symbols-outlined text-2xl">error_outline</span>
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-lg font-serif font-semibold text-on-surface">Bespoke Record Not Found</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  We couldn't locate an order with ID <span className="font-mono font-bold uppercase text-on-surface">"{orderId}"</span>. Please check for typings or double check the confirmation receipt.
                </p>
              </div>
              <button
                onClick={() => setSearched(false)}
                className="mt-2 text-xs font-bold text-primary hover:text-primary-fixed hover:bg-primary/5 px-4 py-2 rounded-full transition-all"
              >
                Clear Search
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="prompt-search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="inline-flex p-4 rounded-full bg-surface border border-outline-variant/10 text-on-surface-variant mb-4">
                <span className="material-symbols-outlined text-3xl animate-gentle-float">saved_search</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                Enter your order tracking ID to request real-time delivery progress.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
