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
  ShoppingBag, 
  Tag, 
  Phone, 
  MapPin, 
  User, 
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

  // Settings
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Selection states
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Delivery details form
  const [customer, setCustomer] = useState({
    name: '',
    whatsapp: '',
    address: '',
    city: '',
    pincode: ''
  });

  // Coupons states
  const [couponCode, setCouponCode] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Statuses
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch settings & coupons & check localStorage for saved details
  useEffect(() => {
    if (isOpen) {
      // Set defaults for size and color
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

      // Load saved details
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

  // Pricing calculations
  const subtotal = useMemo(() => {
    if (!product) return 0;
    return product.price * quantity;
  }, [product, quantity]);

  const tax = useMemo(() => subtotal * 0.05, [subtotal]); // 5% matching checkout
  const total = useMemo(() => Math.max(0, subtotal + tax - discount), [subtotal, tax, discount]);

  // Apply Coupon Logic
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
        setCouponError(`This coupon requires a minimum order value of ${formatPrice(coupon.minOrderValue)}.`);
        return;
      }

      let calculatedDiscount = 0;
      if (coupon.discountType === 'percentage') {
        calculatedDiscount = subtotal * (coupon.discountValue / 100);
      } else {
        calculatedDiscount = coupon.discountValue;
      }

      setDiscount(calculatedDiscount);
      setCouponSuccess(`Success! Coupon "${coupon.code}" applied: -${formatPrice(calculatedDiscount)}`);
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
      // Build order item
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

      // Add order
      const orderId = await addOrder(orderData);

      // Save customer details in localStorage
      localStorage.setItem('saved_customer_details', JSON.stringify(customer));

      // Build WhatsApp payload
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
      setErrorMsg('There was an error compiling your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/20 flex flex-col z-10 text-left"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Truck size={20} className="text-primary" />
                Direct Quick Buy Checkout
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Product Overview Section */}
            <div className="flex flex-col sm:flex-row gap-5 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-neutral-200/50 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="max-w-full max-h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{product.category}</span>
                  <h3 className="font-bold text-base text-gray-900 leading-snug mt-0.5">{product.title}</h3>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-black text-primary font-space">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">per unit</span>
                </div>
              </div>
            </div>

            {/* Error alerts */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2.5">
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Variant selection */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Color Option</label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`h-9 px-3.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5
                            ${selectedColor === color 
                              ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                          {color.startsWith('#') && (
                            <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                          )}
                          <span>{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Size Selection</label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`h-9 px-4.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center
                            ${selectedSize === size 
                              ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Incrementor */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Quantity</label>
                  <div className="flex items-center gap-3 bg-gray-100 w-max p-1 rounded-xl border border-gray-200/40">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 transition-all font-bold active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm text-gray-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(99, prev + 1))}
                      disabled={quantity >= 99}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 transition-all font-bold active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div className="bg-neutral-50/50 p-4.5 rounded-2xl border border-gray-100 space-y-3.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <MapPin size={14} className="text-primary" />
                  Delivery Destination
                </h4>

                <div className="space-y-3">
                  <div>
                    <input 
                      type="text" 
                      required
                      value={customer.name}
                      onChange={e => setCustomer({...customer, name: e.target.value})}
                      placeholder="Receiver's Full Name"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" 
                      required
                      value={customer.whatsapp}
                      onChange={e => setCustomer({...customer, whatsapp: e.target.value})}
                      placeholder="WhatsApp Mobile Number (e.g., +1...)"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      required
                      value={customer.address}
                      onChange={e => setCustomer({...customer, address: e.target.value})}
                      placeholder="Street Address, Appt/Suite"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      required
                      value={customer.city}
                      onChange={e => setCustomer({...customer, city: e.target.value})}
                      placeholder="City"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                    <input 
                      type="text" 
                      required
                      value={customer.pincode}
                      onChange={e => setCustomer({...customer, pincode: e.target.value})}
                      placeholder="Pincode / ZIP"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Pricing Details / Coupons Section */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon code input */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Promotional Coupon</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Enter Code"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white uppercase focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => handleApplyCoupon(couponCode)}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={12} />
                    {couponSuccess}
                  </p>
                )}

                {/* Dynamic coupon suggestion pills */}
                {availableCoupons.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Tap to apply available codes:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableCoupons.map(coupon => (
                        <button
                          key={coupon.id}
                          type="button"
                          onClick={() => {
                            setCouponCode(coupon.code);
                            handleApplyCoupon(coupon.code);
                          }}
                          className="bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1"
                        >
                          <Tag size={10} />
                          {coupon.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price calculations */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'}):</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Est. GST / Tax (5%):</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span>Coupon Discount:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-sm">
                  <span className="font-black text-gray-900 uppercase">Grand Total:</span>
                  <span className="font-black text-primary text-base">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 hover:scale-[1.01] active:scale-[0.97] text-gray-600 text-xs font-bold rounded-xl transition-all duration-200"
              >
                Close & Keep Shopping
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={isSubmitting}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} />
                    <span>⚡ Order via WhatsApp</span>
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
