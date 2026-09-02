import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { addOrder } from '../../services/orderService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { useCart } from '../../context/CartContext';
import { Coupon, getCoupons } from '../../services/couponService';
import { convertCartSession, updateCartSessionCustomer } from '../../services/abandonedCartService';
import { BlurImage } from '../../components/storefront/BlurImage';
import { trackBeginCheckout, trackPurchase, trackAddShippingInfo, trackAddPaymentInfo } from '../../utils/analytics';

export function StorefrontCart() {
  const { storeSettings } = useStoreConfig();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  React.useEffect(() => {
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

  // Debounced effect to sync customer details into our abandoned cart session
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
      }, 1000); // 1s debounce
      return () => clearTimeout(timer);
    }
  }, [customer, cartSessionId, items.length]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  const tax = subtotal * 0.05; // ~5%
  const total = Math.max(0, subtotal + tax - discount);

  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(items, total);
    }
  }, [items.length]);

  const applySpecificCoupon = async (codeToApply: string) => {
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
        setCouponError(`This coupon requires a minimum order value of ${formatPrice(coupon.minOrderValue)}.`);
        return;
      }

      let calculatedDiscount = 0;
      if (coupon.discountType === 'percentage') {
        calculatedDiscount = subtotal * (coupon.discountValue / 100);
      } else {
        calculatedDiscount = Math.min(coupon.discountValue, subtotal);
      }
      
      setDiscount(calculatedDiscount);
      setCouponSuccess(`Coupon "${coupon.code}" applied! You saved ${formatPrice(calculatedDiscount)}`);
    } catch (error) {
      console.error("Error applying coupon", error);
      setCouponError("Error applying coupon.");
    }
  };

  const handleApplyCoupon = async () => {
    await applySpecificCoupon(couponCode);
  };

  const handleSelectCoupon = (code: string) => {
    setCouponCode(code);
    applySpecificCoupon(code);
  };

  const handleConfirmOrder = async () => {
    if (!customer.name || !customer.whatsapp || !customer.address || !customer.city || !customer.pincode) {
      alert("Please fill in all delivery details");
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
      
      trackAddShippingInfo(items, total, 'Standard Delivery');
      trackAddPaymentInfo(items, total, 'Cash on Delivery (WhatsApp)');
      const orderId = await addOrder(orderData);
      
      // Mark cart session as converted/ordered
      if (cartSessionId) {
        await convertCartSession(cartSessionId);
      }
      
      const storePhone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || "1234567890";
      const currentStoreName = storeSettings?.storeName || "My Store";
      const intro = `Hello, I'd like to place an order on ${currentStoreName}!%0AOrder ID: ${orderId}%0A%0A*Customer Details:*%0AName: ${customer.name}%0APhone: ${customer.whatsapp}%0AAddress: ${customer.address}, ${customer.city} - ${customer.pincode}%0A%0A*Order Items:*%0A`;
      
      const itemsList = items.map(item => {
        let text = `- ${item.quantity}x ${item.title} (${formatPrice(item.price)})`;
        const variants = [];
        if (item.size) variants.push(item.size);
        if (item.color) variants.push(item.color);
        if (variants.length > 0) {
          text += ` [${variants.join(', ')}]`;
        }
        return text;
      }).join('%0A');
      
      const totalMsg = `%0A%0A*Subtotal:* ${formatPrice(subtotal)}%0A*Discount:* -${formatPrice(discount)}%0A*Total:* ${formatPrice(total)}`;
      const url = `https://wa.me/${storePhone}?text=${intro}${itemsList}${totalMsg}`;
      
      const completedOrder = { ...orderData, id: orderId };
      
      // Tracking
      trackPurchase(orderId, items, total, tax, 0, couponCode);

      clearCart();
      navigate('/checkout', { state: { order: completedOrder, orderId, whatsappUrl: url } });
    } catch (error) {
      console.error("Error confirming order", error);
      alert("There was an error confirming your order.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full py-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items & Delivery Details */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 md:p-6 shadow-sm">
            {items.length > 0 ? (
              <div className="flex flex-col gap-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl border border-outline-variant bg-neutral-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <BlurImage src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-on-surface leading-tight mb-1">{item.title}</h3>
                          <p className="text-[10px] md:text-xs text-on-surface-variant font-medium">
                            {item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}
                          </p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-outline hover:text-error transition-colors p-1 md:p-2">
                          <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                        </button>
                      </div>
                      <div className="mt-auto flex justify-between items-end">
                        <p className="text-sm md:text-base font-bold text-primary">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-2 md:gap-3 bg-surface border border-outline-variant rounded-lg px-1.5 py-0.5 md:px-2 md:py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-on-surface-variant hover:text-on-surface w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">remove</span>
                          </button>
                          <span className="font-bold text-xs md:text-sm w-4 md:w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="text-on-surface-variant hover:text-on-surface w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
                  <span className="material-symbols-outlined text-3xl md:text-4xl">shopping_cart</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-on-surface mb-2">Your cart is empty</h2>
                <p className="text-on-surface-variant mb-6">Looks like you haven't added anything yet.</p>
                <Link to="/categories" className="btn btn-primary btn-lg">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
          
          {/* Delivery Details Form */}
          <div className="bg-surface border border-outline-variant rounded-xl p-6 mt-2 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Delivery Details
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                  placeholder="John Doe" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">WhatsApp No.</label>
                <input 
                  type="tel" 
                  value={customer.whatsapp}
                  onChange={e => setCustomer({...customer, whatsapp: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                  placeholder="+1234567890" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Address</label>
                <input 
                  type="text" 
                  value={customer.address}
                  onChange={e => setCustomer({...customer, address: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                  placeholder="123 Main St, Apartment/Suite" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  value={customer.city}
                  onChange={e => setCustomer({...customer, city: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                  placeholder="City" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Pincode</label>
                <input 
                  type="text" 
                  value={customer.pincode}
                  onChange={e => setCustomer({...customer, pincode: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                  placeholder="123456" 
                />
              </div>
            </form>
          </div>
        </div>
        
        {/* Order Summary Section */}
        <div className="lg:col-span-4 sticky top-24 h-fit">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-on-surface mb-6">Order Summary</h2>
            
            {/* Coupon Code */}
            <div className="mb-4 flex gap-2">
              <input 
                type="text" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm uppercase" 
                placeholder="Coupon Code" 
              />
              <button 
                onClick={handleApplyCoupon}
                className="bg-secondary text-white px-4 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm"
              >
                Apply
              </button>
            </div>

            {/* Error or Success notification */}
            {couponError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                <span>{couponError}</span>
              </div>
            )}
            {couponSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>{couponSuccess}</span>
              </div>
            )}

            {/* Available Coupon Codes display */}
            {availableCoupons.length > 0 && (
              <div className="mb-6 bg-surface border border-outline-variant p-3.5 rounded-xl">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">sell</span>
                  Available Coupons:
                </p>
                <div className="flex flex-col gap-2">
                  {availableCoupons.map((coupon) => {
                    const isMinApplicable = coupon.minOrderValue ? subtotal >= coupon.minOrderValue : true;
                    return (
                      <button
                        key={coupon.id}
                        type="button"
                        onClick={() => isMinApplicable && handleSelectCoupon(coupon.code)}
                        className={`w-full text-xs p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          !isMinApplicable 
                            ? 'opacity-50 border-outline-variant bg-surface-container-low cursor-not-allowed' 
                            : couponCode.toUpperCase() === coupon.code.toUpperCase()
                              ? 'border-primary bg-primary/10 text-primary font-bold scale-[1.01]'
                              : 'border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-on-surface'
                        }`}
                        title={!isMinApplicable ? `Requires a minimum subtotal of ${formatPrice(coupon.minOrderValue || 0)}` : 'Click to apply coupon'}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-mono uppercase font-bold tracking-wider text-sm">{coupon.code}</span>
                          {coupon.minOrderValue && (
                            <span className="text-[10px] text-on-surface-variant">
                              Min. spend: {formatPrice(coupon.minOrderValue)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] bg-primary/15 text-primary px-2 py-0.5 rounded-md font-bold">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${formatPrice(coupon.discountValue)} OFF`}
                          </span>
                          {isMinApplicable ? (
                            <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-base">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-on-surface-variant">Estimated Shipping</span>
                <span className="text-secondary font-bold">FREE</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-base text-primary">
                  <span className="font-semibold">Discount</span>
                  <span className="font-bold">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base">
                <span className="text-on-surface-variant">Tax</span>
                <span className="text-on-surface font-bold">{formatPrice(tax)}</span>
              </div>
              <div className="h-px bg-outline-variant my-4"></div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg md:text-xl font-bold text-on-surface">Total</span>
                <span className="text-2xl md:text-3xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            
            <div className="bg-primary-container/10 rounded-xl p-4 mb-6 border border-primary-container/30">
              <div className="flex gap-2 mb-1">
                <span className="material-symbols-outlined text-primary">info</span>
                <span className="font-bold text-on-primary-container text-xs">How it works</span>
              </div>
              <p className="text-sm text-on-primary-container">
                Once you confirm, we'll open WhatsApp on your device with your order details pre-filled. Just hit send to finalize with the seller!
              </p>
            </div>
            
            <button 
              id="confirm-order-button"
              onClick={handleConfirmOrder}
              disabled={items.length === 0 || isSubmitting}
              className="w-full bg-primary-container text-on-primary-container hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.96] active:translate-y-0 transition-all duration-300 ease-out rounded-full py-4 px-6 flex items-center justify-center gap-4 font-semibold shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              {isSubmitting ? 'Processing...' : 'Confirm Order'}
            </button>
            <p className="mt-4 text-center text-sm text-on-surface-variant">
              Payments are arranged directly via chat.
            </p>
          </div>
          
          <div className="mt-6 p-4 border border-outline-variant border-dashed rounded-xl flex items-center gap-4 bg-surface">
            <span className="material-symbols-outlined text-on-surface-variant">verified_user</span>
            <div>
              <p className="font-bold text-on-surface text-xs">Secure Messaging</p>
              <p className="text-on-surface-variant text-sm">Your order privacy is protected.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
