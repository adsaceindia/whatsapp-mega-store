const fs = require('fs');
const content = `import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';

export function StorefrontCart() {
  const navigate = useNavigate();
  
  const [items, setItems] = useState([
    {
      id: '1',
      title: 'Bamboo Glass Bottle',
      variant: 'Color: Forest Green | 500ml',
      price: 24.00,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60',
      quantity: 1
    },
    {
      id: '2',
      title: 'QuietFlow Pro Headphones',
      variant: 'Edition: Limited Charcoal',
      price: 189.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
      quantity: 1
    }
  ]);

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  const tax = subtotal * 0.05; // ~5%
  const total = subtotal + tax - discount;

  const handleUpdateQty = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemove = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setItems([]);
  };

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'save10') {
      setDiscount(10);
    } else {
      setDiscount(0);
      alert("Invalid coupon code. Try SAVE10");
    }
  };

  return (
    <main className="w-full max-w-container-max mx-auto px-4 md:px-gutter py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Your Shopping Cart</h1>
        <p className="text-base text-on-surface-variant max-w-[400px]">Review your items before finishing your order.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          
          {items.length === 0 ? (
            <div className="bg-surface border border-outline-variant rounded-xl p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">production_quantity_limits</span>
              <h2 className="text-xl font-bold text-on-surface mb-2">Your cart is empty</h2>
              <p className="text-on-surface-variant mb-6">Looks like you haven't added anything yet.</p>
              <Link to="/" className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-surface border border-outline-variant rounded-xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-24 h-24 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                  <img className="w-full h-full object-cover" src={item.image} alt={item.title} />
                </div>
                <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">{item.title}</h3>
                    <p className="text-on-surface-variant text-sm">{item.variant}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
                      <button onClick={() => handleUpdateQty(item.id, -1)} className="px-2 py-1 hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="px-4 font-bold text-on-surface">{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item.id, 1)} className="px-2 py-1 hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <span className="block font-bold text-primary text-base">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="text-error hover:bg-error-container p-2 rounded-full transition-colors" title="Remove item">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {items.length > 0 && (
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="flex items-center gap-2 text-secondary text-xs font-semibold hover:underline">
                <span className="material-symbols-outlined">arrow_back</span>
                Continue Shopping
              </Link>
              <button onClick={handleClearCart} className="text-on-surface-variant text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined">delete_sweep</span>
                Clear Cart
              </button>
            </div>
          )}
          
          {/* Delivery Details Form */}
          <div className="bg-surface border border-outline-variant rounded-xl p-6 mt-2 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Delivery Details
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Full Name</label>
                <input type="text" className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" placeholder="John Doe" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">WhatsApp No.</label>
                <input type="tel" className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" placeholder="+1234567890" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Address</label>
                <input type="text" className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" placeholder="123 Main St, Apartment/Suite" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">City</label>
                <input type="text" className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" placeholder="City" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Pincode</label>
                <input type="text" className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" placeholder="123456" />
              </div>
            </form>
          </div>
        </div>
        
        {/* Order Summary Section */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-6">Order Summary</h2>
            
            {/* Coupon Code */}
            <div className="mb-6 flex gap-2">
              <input 
                type="text" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" 
                placeholder="Coupon Code" 
              />
              <button 
                onClick={handleApplyCoupon}
                className="bg-secondary text-white px-4 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm"
              >
                Apply
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-base">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-on-surface-variant">Estimated Shipping</span>
                <span className="text-secondary font-bold">FREE</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-base text-primary">
                  <span className="font-semibold">Discount</span>
                  <span className="font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base">
                <span className="text-on-surface-variant">Tax</span>
                <span className="text-on-surface font-bold">${tax.toFixed(2)}</span>
              </div>
              <div className="h-px bg-outline-variant my-4"></div>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-bold text-on-surface">Total</span>
                <span className="text-3xl font-bold text-primary">${total.toFixed(2)}</span>
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
              onClick={() => navigate('/checkout')}
              disabled={items.length === 0}
              className="w-full bg-primary-container text-on-primary-container hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-full py-4 px-6 flex items-center justify-center gap-4 font-semibold shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              Confirm Order
            </button>
            <p className="mt-4 text-center text-sm text-on-surface-variant">
              Payments are arranged directly via chat or securely in the next step.
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
`;
fs.writeFileSync('src/pages/storefront/StorefrontCart.tsx', content);
