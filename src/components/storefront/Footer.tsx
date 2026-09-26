import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStoreConfig } from '../../context/StoreConfigContext';

export function Footer() {
  const { storeSettings } = useStoreConfig();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => {
        setClickCount(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!e.shiftKey) return; // Must hold shift key
    const nextCount = clickCount + 1;
    if (nextCount >= 5) {
      setClickCount(0);
      navigate('/login');
    } else {
      setClickCount(nextCount);
    }
  };

  return (
    <footer className="w-full mt-24 bg-surface border-t border-outline-variant/20 pt-16 pb-8 text-left relative overflow-hidden" id="luxury-storefront-footer">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(37,211,102,0.02)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-none px-4 md:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-outline-variant/15">
        
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight font-space text-primary">
            {storeSettings.storeIcon ? (
              <img src={storeSettings.storeIcon} alt="Store Logo" className="w-7 h-7 rounded-lg object-contain" />
            ) : (
              <span className="material-symbols-outlined text-2xl">storefront</span>
            )}
            <span>{storeSettings.storeName}</span>
          </Link>
          <p className="text-sm text-on-surface-variant font-light leading-relaxed max-w-sm whitespace-pre-line">
            {storeSettings.storeDescription || "Curating exceptional creations of uncompromising premium quality. Experience the modern standard of simplified social commerce."}
          </p>
          
          {/* Trust Seal badges */}
          <div className="pt-2 flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container/10 border border-primary/20 rounded-full text-[11px] font-bold text-primary font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Verified WhatsApp Checkout
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-slate-800 border border-outline-variant/20 rounded-full text-[11px] font-bold text-on-surface-variant font-mono uppercase tracking-wider">
              Secure Encrypted SSL
            </span>
          </div>
        </div>

        {/* Quick Collections Link Grid */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold font-space uppercase tracking-[0.2em] text-neutral-400">Discover</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/categories" className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-1">
                <span>All Curated Collections</span>
              </Link>
            </li>
            <li>
              <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-medium">
                Latest Highlights
              </Link>
            </li>
            <li>
              <Link to="/track" className="text-on-surface-variant hover:text-primary transition-colors font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">local_shipping</span>
                <span>Track Package Delivery</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Support & Policies */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="text-xs font-bold font-space uppercase tracking-[0.2em] text-neutral-400">Services & Policy</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/info?tab=about" className="text-on-surface-variant hover:text-primary transition-colors font-medium">About Us</Link>
            </li>
            <li>
              <Link to="/info?tab=shipping" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Shipping & Delivery Logistics</Link>
            </li>
            <li>
              <Link to="/info?tab=terms" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Terms & Operating Agreement</Link>
            </li>
            <li>
              <span onClick={handleAdminClick} className="cursor-pointer text-on-surface-variant/50 hover:text-primary transition-colors text-[10px] uppercase tracking-widest select-none">
                Atelier Administration
              </span>
            </li>
          </ul>
        </div>

      </div>

      <div className="w-full max-w-none px-4 md:px-8 lg:px-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant opacity-80">
        <p className="font-medium">
          © {new Date().getFullYear()} {storeSettings.storeName}. All rights reserved globally.
        </p>
        <p className="font-mono flex items-center gap-1.5 cursor-pointer" onClick={handleAdminClick} title="ATELIER ADMINISTRATION">
          <span>Social Webstore Portal • Crafted to Perfection</span>
        </p>
      </div>
    </footer>
  );
}
