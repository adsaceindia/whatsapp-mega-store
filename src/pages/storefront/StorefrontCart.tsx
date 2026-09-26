import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { addOrder } from '../../services/orderService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { useCart } from '../../context/CartContext';
import { Coupon, getCoupons } from '../../services/couponService';
import { convertCartSession, updateCartSessionCustomer } from '../../services/abandonedCartService';
import { BlurImage } from '../../components/storefront/BlurImage';
import { ShoppingBag, Trash2, Plus, Minus, Tag, MapPin, CheckCircle, AlertCircle, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';

export function StorefrontCart() {
  const { storeSettings } = useStoreConfig();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
    getCoupons().then(coupons => {
      setAvailableCoupons(coupons.filter(c => c.active !== false));
    }).catch(console.error);
  }, []);

  const navigate = useNavigate();
  const { items, cartSessionId, updateQuantity, removeFromCart, clearCart, formatPrice } = useCart();
  
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState({
    name: '',
    whatsapp: '',
    address: '',
    city: '',
    pincode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const hasSomeDetail = !!(
      customer.name.trim() || 
      customer.whatsapp.trim() || 
      customer.address.trim() || 
      customer.city.trim() || 
      customer.pincode.trim()
    );
    if (cartSessionId && hasSomeDetail && items.length > 0) {
      const timer = setTimeout(() => {
        updateCartSessionCustomer(cartSessionId, customer).catch(console.error);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [customer, cartSessionId, items.length]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  const tax = subtotal * 0.05;
  const total = Math.max(0, subtotal + tax - discount);

  const handleApplyCoupon = async (codeToApply: string) => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!codeToApply) {
      setDiscount(0);
      return;
    }

    try {
      const targetCode = codeToApply.toUpperCase().replace(/\s+/g, '');
      const coupons = await getCoupons();
      const coupon = coupons.find(c => c.code.toUpperCase() === targetCode);

      if (!coupon) {
        setDiscount(0);
        setCouponError("Invalid coupon code.");
        return;
      }

      if (coupon.active === false) {
        setDiscount(0);
        setCouponError("This coupon is no longer active.");
        return;
      }

      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        setDiscount(0);
        setCouponError(`Requires a minimum order value of ${formatPrice(coupon.minOrderValue)}.`);
        return;
      }

      let calculatedDiscount = 0;
      if (coupon.discountType === 'percentage') {
        calculatedDiscount = subtotal * (coupon.discountValue / 100);
      } else {
        calculatedDiscount = coupon.discountValue;
      }

      setDiscount(calculatedDiscount);
      setCouponSuccess(`Coupon "${coupon.code}" applied: -${formatPrice(calculatedDiscount)}`);
    } catch (err) {
      console.error('Error applying coupon', err);
      setCouponError('Error verifying coupon.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    if (!customer.name.trim() || !customer.whatsapp.trim() || !customer.address.trim() || !customer.city.trim() || !customer.pincode.trim()) {
      alert("Please fill in all delivery details before placing your order.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        items,
        customer,
        subtotal,
        tax,
        discount,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const orderId = await addOrder(orderData);
      
      if (cartSessionId) {
        await convertCartSession(cartSessionId);
      }

      const storePhone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || "1234567890";
      const currentStoreName = storeSettings?.storeName || "My Store";
      const intro = `Hello, I'd like to place an order on ${currentStoreName}!%0AOrder ID: ${orderId}%0A%0A*Customer Details:*%0AName: ${customer.name}%0APhone: ${customer.whatsapp}%0AAddress: ${customer.address}, ${customer.city} - ${customer.pincode}%0A%0A*Order Items:*%0A`;
      
      const itemText = items.map((item) => {
        let details = `- ${item.quantity}x ${item.title} (${formatPrice(item.price)})`;
        const variants = [];
        if (item.size) variants.push(item.size);
        if (item.color) variants.push(item.color);
        if (variants.length > 0) {
          details += ` [${variants.join(', ')}]`;
        }
        return details;
      }).join('%0A');

      const totalMsg = `%0A%0A*Subtotal:* ${formatPrice(subtotal)}%0A*Discount:* -${formatPrice(discount)}%0A*Total:* ${formatPrice(total)}`;
      const url = `https://wa.me/${storePhone}?text=${intro}${itemText}${totalMsg}`;

      const completedOrder = { ...orderData, id: orderId };
      clearCart();
      navigate('/checkout', { state: { order: completedOrder, orderId, whatsappUrl: url } });
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Error placing order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="w-full min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 text-center max-w-md w-full border border-neutral-200/70 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-neutral-900 dark:text-white mb-2">Your Shopping Bag is Empty</h2>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mb-6">Looks like you haven't added any products to your bag yet.</p>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full bg-white dark:bg-slate-950 min-h-screen pb-28 md:pb-12 text-left">
      <div className="w-full max-w-none px-3 md:px-8 lg:px-12 pt-3 md:pt-8">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg md:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          <button 
            onClick={clearCart}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Clear Bag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 space-y-3">
            {items.map((item) => (
              <div 
                key={`${item.productId}-${item.size}-${item.color}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200/70 dark:border-slate-800 p-3 md:p-4 flex gap-3 md:gap-4 items-center shadow-xs"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-50 dark:bg-slate-800 rounded-xl overflow-hidden p-1 border border-neutral-100 dark:border-slate-700 flex-shrink-0">
                  <BlurImage src={item.image} alt={item.title} className="w-full h-full object-contain" />
                </div>

                {/* Info & Quantity Controls */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs md:text-sm text-neutral-900 dark:text-white truncate mb-1">{item.title}</h3>
                  
                  {/* Variant info tags */}
                  {(item.size || item.color) && (
                    <div className="flex gap-1.5 mb-2">
                      {item.size && <span className="bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">Size: {item.size}</span>}
                      {item.color && <span className="bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">Color: {item.color}</span>}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="font-extrabold text-sm md:text-base text-neutral-900 dark:text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-slate-800 p-1 rounded-xl border border-neutral-200/60 dark:border-slate-700">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size, item.color)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-200 font-bold active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs text-neutral-800 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size, item.color)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-200 font-bold active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove Trash Icon */}
                <button
                  onClick={() => removeFromCart(item.productId, item.size, item.color)}
                  className="p-2 text-neutral-400 hover:text-rose-600 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Delivery Destination Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-4 md:p-6 shadow-xs mt-6">
              <h3 className="text-xs md:text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Shipping Destination & Contact
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="text"
                  required
                  placeholder="Full Name"
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                />
                <input 
                  type="tel"
                  required
                  placeholder="WhatsApp Mobile Number"
                  value={customer.whatsapp}
                  onChange={e => setCustomer({...customer, whatsapp: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                />
                <input 
                  type="text"
                  required
                  placeholder="Street Address, Flat / House No."
                  value={customer.address}
                  onChange={e => setCustomer({...customer, address: e.target.value})}
                  className="sm:col-span-2 w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                />
                <input 
                  type="text"
                  required
                  placeholder="City"
                  value={customer.city}
                  onChange={e => setCustomer({...customer, city: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                />
                <input 
                  type="text"
                  required
                  placeholder="Pincode / ZIP Code"
                  value={customer.pincode}
                  onChange={e => setCustomer({...customer, pincode: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Summary Card */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Voucher / Coupon Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-4 md:p-6 shadow-xs">
              <label className="block text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                Have a Promo Voucher?
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Enter Voucher Code"
                  className="flex-1 px-3.5 py-2 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs uppercase font-bold outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                />
                <button 
                  onClick={() => handleApplyCoupon(couponCode)}
                  className="bg-neutral-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[10px] text-rose-600 font-semibold mt-1">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold mt-1">{couponSuccess}</p>}
            </div>

            {/* Price Calculations & Order Checkout Button */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-4 md:p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-100 dark:border-slate-800 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs text-neutral-600 dark:text-slate-300 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. GST / Tax (5%):</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{formatPrice(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Voucher Discount:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-slate-700 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-neutral-900 dark:text-white uppercase">Grand Total:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Order via WhatsApp</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Mobile App Floating Bottom Summary Bar */}
      <div className="fixed bottom-16 left-3 right-3 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl border border-neutral-200/80 dark:border-slate-800 z-40 md:hidden flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">Total Amount</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Checkout</span>
        </button>
      </div>

    </main>
  );
}
