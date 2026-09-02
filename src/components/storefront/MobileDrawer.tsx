import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../context/CartContext';
import { getCategories, Category } from '../../services/categoryService';
import { useStoreConfig } from '../../context/StoreConfigContext';

export function MobileDrawer() {
  const { storeSettings } = useStoreConfig();
  const { isMobileDrawerOpen, setIsMobileDrawerOpen, cartCount, wishlist, cartSessionId, customer, setShowCustomerLogin, logoutCustomer, setIsWishlistOpen } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    if (isMobileDrawerOpen) {
      getCategories().then(setCategories).catch(console.error);
    }
  }, [isMobileDrawerOpen]);
  const [clickCount, setClickCount] = useState(0);
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('store_customer_name') || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(customerName);

  // Reset clicks after inactivity
  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => {
        setClickCount(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  // Handle save customer name
  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextCount = clickCount + 1;
    if (nextCount >= 5) {
      setClickCount(0);
      setIsMobileDrawerOpen(false);
      
      const isAdmin = localStorage.getItem('admin_logged_in') === 'true';
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/login');
      }
    } else {
      setClickCount(nextCount);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    setCustomerName(trimmed);
    localStorage.setItem('store_customer_name', trimmed);
    setIsEditingName(false);
  };

  const handleCategoryClick = (catName: string) => {
    setIsMobileDrawerOpen(false);
    navigate('/categories', { state: { category: catName } });
  };

  const handleNavClick = (path: string) => {
    setIsMobileDrawerOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMobileDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content Body (Left Sidebar) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-0 left-0 bottom-0 w-[85vw] sm:w-[350px] bg-surface dark:bg-slate-900 shadow-[8px_0_30px_rgb(0,0,0,0.12)] flex flex-col overflow-hidden text-on-surface dark:text-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/15 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                {storeSettings?.storeIcon ? (
                  <img src={storeSettings.storeIcon} alt="Store Logo" className="w-8 h-8 rounded-lg object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
                )}
                <div>
                  <h2 className="text-base font-extrabold tracking-tight font-space text-on-surface dark:text-white leading-none">
                    {storeSettings?.storeName || 'My Store'}
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-mono tracking-wider">Mobile Portal</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 pb-12">
              
              {/* Account/User Info Card */}
              <div className="p-4 bg-primary-container/20 dark:bg-slate-800/50 rounded-2xl border border-primary/10 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary dark:text-sky-400">account_circle</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Account & Session</span>
                  </div>
                  {!isEditingName && (
                    <button 
                      onClick={() => {
                        setNameInput(customerName);
                        setIsEditingName(true);
                      }}
                      className="text-[11px] font-bold text-primary dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your name..."
                      className="flex-grow bg-white dark:bg-slate-950 border border-neutral-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="btn btn-primary btn-sm"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold text-on-surface dark:text-white">
                      {customer ? `Welcome back, ${customer.displayName || 'Customer'}!` : customerName ? `Welcome back, ${customerName}!` : 'Welcome Guest Patron'}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                      Session ID: <span className="font-semibold">{cartSessionId.substring(0, 12)}...</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div>
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2.5 px-1">Navigation</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleNavClick('/')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">storefront</span>
                    <span className="text-xs font-bold">Showcase Home</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('/categories')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">grid_view</span>
                    <span className="text-xs font-bold">All Collections</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('/track')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">local_shipping</span>
                    <span className="text-xs font-bold">Track Shipment</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('/track')}
                    className="relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">local_shipping</span>
                    <span className="text-xs font-bold">Track Order</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/cart')}
                    className="relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">shopping_cart</span>
                    <span className="text-xs font-bold">My Shopping Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setIsMobileDrawerOpen(false); setIsWishlistOpen(true); }}
                    className="relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">favorite</span>
                    <span className="text-xs font-bold">My Wishlist</span>
                    {wishlist.length > 0 && (
                      <span className="absolute top-2.5 right-2.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                  >
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                    <span className="text-xs font-bold">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                  {customer ? (
                    <button
                      onClick={() => { setIsMobileDrawerOpen(false); logoutCustomer(); }}
                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-rose-600 transition-all text-center group"
                    >
                      <span className="material-symbols-outlined text-2xl text-rose-500 mb-1">logout</span>
                      <span className="text-xs font-bold text-rose-600">Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setIsMobileDrawerOpen(false); setShowCustomerLogin(true); }}
                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800/80 hover:text-primary transition-all text-center group"
                    >
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary mb-1">login</span>
                      <span className="text-xs font-bold">Sign In</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Categories Grid */}
              <div>
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3.5 px-1">Browse Categories</h3>
                {categories.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic px-1">No collections available</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id || cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/30 border border-neutral-100 dark:border-slate-800/50 hover:bg-neutral-100 dark:hover:bg-slate-800/70 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-neutral-400 text-xl">sell</span>
                          )}
                          <span className="text-xs font-bold text-on-surface dark:text-slate-100">{cat.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-neutral-400 text-sm">chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Info & Administration */}
              <div className="pt-2 border-t border-outline-variant/10 space-y-2.5">
                <Link
                  to="/info?tab=about"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-1 py-1.5 text-xs text-on-surface-variant hover:text-primary font-medium"
                >
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>About our Story</span>
                </Link>
                <Link
                  to="/info?tab=shipping"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-1 py-1.5 text-xs text-on-surface-variant hover:text-primary font-medium"
                >
                  <span className="material-symbols-outlined text-base">local_shipping</span>
                  <span>Shipping & Policy</span>
                </Link>
                <div
                  onClick={handleAdminClick}
                  className="flex items-center gap-3 px-1 py-1.5 text-xs text-on-surface-variant hover:text-primary font-bold border-t border-dashed border-outline-variant/10 pt-2 cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-base text-primary">admin_panel_settings</span>
                  <span>Administrative Console</span>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
