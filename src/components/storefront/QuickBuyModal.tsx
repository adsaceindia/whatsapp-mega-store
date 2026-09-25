import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from '../../context/CartContext';
import { addOrder } from '../../services/orderService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { Coupon, getCoupons } from '../../services/couponService';
import { 
  X, 
  Tag, 
  MapPin, 
  Plus, 
  Minus, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Truck,
  MessageSquare
} from 'lucide-react';

interface QuickBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string | number;
    title: string;
    price: number;
    image: string;
    sizes?: string[];
    colors?: string[];
    category?: string;
  } | null;
}

export function QuickBuyModal({ isOpen, onClose, product }: QuickBuyModalProps) {
  const { storeSettings } = useStoreConfig();
  const navigate = useNavigate();
  const { formatPrice } = useCart();

  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const [customer, setCustomer] = useState({
    name: '',
    whatsapp: '',
    address: '',
    city: '',
    pincode: ''
  });

  const [couponCode, setCouponCode] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setSelectedSize(product.sizes?.[0] || '');
        setSelectedColor(product.colors?.[0] || '');
        setQuantity(1);
        setCouponCode('');
        setDiscount(0);
        setCouponError(null);
        setCouponSuccess(null);
        setErrorMsg(null);
      }

      try {
        const saved = localStorage.getItem('saved_customer_details');
        if (saved) {
          setCustomer(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error loading saved details', err);
      }

      getGeneralSettings().then(setSettings).catch(console.error);
      getCoupons().then(coupons => {
        setAvailableCoupons(coupons.filter(c => c.active !== false));
      }).catch(console.error);
    }
  }, [isOpen, product]);

  const subtotal = useMemo(() => {
    if (!product) return 0;
    return product.price * quantity;
  }, [product, quantity]);

  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => Math.max(0, subtotal + tax - discount), [subtotal, tax, discount]);

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
        setCouponError(`Requires min order of ${formatPrice(coupon.minOrderValue)}.`);
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

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!product) return;

    if (!customer.name.trim() || !customer.whatsapp.trim() || !customer.address.trim() || !customer.city.trim() || !customer.pincode.trim()) {
      setErrorMsg("Please fill in all delivery details.");
      return;
    }

    setIsSubmitting(true);

    try {
      const item = {
        productId: String(product.id),
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
        size: selectedSize || undefined,
        color: selectedColor || undefined
      };

      const orderData = {
        items: [item],
        customer,
        subtotal,
        tax,
        discount,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const orderId = await addOrder(orderData);
      localStorage.setItem('saved_customer_details', JSON.stringify(customer));

      const storePhone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || "1234567890";
      const currentStoreName = storeSettings?.storeName || "My Store";
      const intro = `Hello, I'd like to place an order on ${currentStoreName}!%0AOrder ID: ${orderId}%0A%0A*⚡ QUICK BUY ORDER:*%0A*Customer Details:*%0AName: ${customer.name}%0APhone: ${customer.whatsapp}%0AAddress: ${customer.address}, ${customer.city} - ${customer.pincode}%0A%0A*Order Item:*%0A`;
      
      let itemText = `- ${quantity}x ${product.title} (${formatPrice(product.price)})`;
      const variants = [];
      if (selectedSize) variants.push(selectedSize);
      if (selectedColor) variants.push(selectedColor);
      if (variants.length > 0) {
        itemText += ` [${variants.join(', ')}]`;
      }

      const totalMsg = `%0A%0A*Subtotal:* ${formatPrice(subtotal)}%0A*Discount:* -${formatPrice(discount)}%0A*Total:* ${formatPrice(total)}`;
      const url = `https://wa.me/${storePhone}?text=${intro}${itemText}${totalMsg}`;

      const completedOrder = { ...orderData, id: orderId };
      onClose();
      navigate('/checkout', { state: { order: completedOrder, orderId, whatsappUrl: url } });
    } catch (err) {
      console.error('Error placing order', err);
      setErrorMsg('Error compiling order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex items-end md:items-center justify-center p-0 md:p-4">
        
        {/* Dark Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Responsive Sheet (Bottom-Sheet on Mobile, Modal on Desktop) */}
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200/80 dark:border-slate-800 flex flex-col z-10 text-left"
        >
          {/* Mobile Bottom-Sheet Grab Handle */}
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-slate-700 rounded-full mx-auto my-2 md:hidden" />

          {/* Header */}
          <div className="px-5 py-3 md:px-6 md:py-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Truck className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h2 className="text-sm md:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Direct WhatsApp Quick Buy
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto space-y-5">
            {/* Product Overview Summary */}
            <div className="flex gap-3.5 bg-neutral-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-2xl border border-neutral-200/60 dark:border-slate-700/60">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200/60 dark:border-slate-700 p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="max-w-full max-h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-bold text-xs md:text-sm text-neutral-900 dark:text-white leading-snug mt-0.5 line-clamp-2">{product.title}</h3>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base md:text-xl font-extrabold text-neutral-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-[10px] text-neutral-400">per item</span>
                </div>
              </div>
            </div>

            {/* Error alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Options Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                {/* Variant selection */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`h-8 px-3 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5
                            ${selectedColor === color 
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500' 
                              : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300'}`}
                        >
                          {color.startsWith('#') && (
                            <span className="w-2.5 h-2.5 rounded-full border border-neutral-300" style={{ backgroundColor: color }} />
                          )}
                          <span>{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Size</label>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`h-8 px-3.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center
                            ${selectedSize === size 
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500' 
                              : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Incrementor */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Quantity</label>
                  <div className="flex items-center gap-3 bg-neutral-100 dark:bg-slate-800 w-max p-1 rounded-xl border border-neutral-200/60 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-200 transition-all font-bold active:scale-95 disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-neutral-800 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(99, prev + 1))}
                      disabled={quantity >= 99}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-200 transition-all font-bold active:scale-95 disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div className="bg-neutral-50 dark:bg-slate-800/40 p-3.5 md:p-4 rounded-2xl border border-neutral-200/60 dark:border-slate-700/60 space-y-2.5">
                <h4 className="text-[11px] font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Shipping Destination
                </h4>

                <div className="space-y-2.5">
                  <input 
                    type="text" 
                    required
                    value={customer.name}
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                  />
                  <input 
                    type="tel" 
                    required
                    value={customer.whatsapp}
                    onChange={e => setCustomer({...customer, whatsapp: e.target.value})}
                    placeholder="WhatsApp Number"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                  />
                  <input 
                    type="text" 
                    required
                    value={customer.address}
                    onChange={e => setCustomer({...customer, address: e.target.value})}
                    placeholder="Street Address, House No."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      required
                      value={customer.city}
                      onChange={e => setCustomer({...customer, city: e.target.value})}
                      placeholder="City"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                    />
                    <input 
                      type="text" 
                      required
                      value={customer.pincode}
                      onChange={e => setCustomer({...customer, pincode: e.target.value})}
                      placeholder="Pincode / ZIP"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coupons & Price Summary */}
            <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider">Coupon Code</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Voucher Code"
                    className="flex-1 px-3 py-1.5 bg-neutral-100 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs outline-none uppercase font-bold text-neutral-900 dark:text-white"
                  />
                  <button 
                    type="button"
                    onClick={() => handleApplyCoupon(couponCode)}
                    className="px-3.5 py-1.5 bg-neutral-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-neutral-800"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-600 font-semibold">{couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="bg-neutral-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-neutral-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-neutral-800 dark:text-slate-200">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-dashed border-neutral-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-extrabold text-neutral-900 dark:text-white">Total:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
