import React from 'react';
import { Link, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { useCart } from '../../context/CartContext';

export function BottomNavBar() {

  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const { cartCount, isMobileDrawerOpen, setIsMobileDrawerOpen } = useCart();

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
  }, []);

  const storePhone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || "1234567890";

  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center py-2 px-8">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center rounded-full px-4 py-1 scale-90 duration-150 ${path === '/' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
        >
          <span className="material-symbols-outlined" style={path === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>storefront</span>
          <span className="text-[10px] font-semibold uppercase mt-1">Shop</span>
        </Link>
        
        <Link 
          to="/cart" 
          className={`relative flex flex-col items-center justify-center px-4 py-1 rounded-full scale-90 duration-150 ${path === '/cart' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
        >
          <span className="material-symbols-outlined" style={path === '/cart' ? { fontVariationSettings: "'FILL' 1" } : {}}>shopping_bag</span>
          <span className="text-[10px] font-semibold uppercase mt-1">Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-3 bg-primary text-white text-[10px] font-bold px-1.5 rounded-full border border-surface">{cartCount}</span>
          )}
        </Link>
        
        <a 
          href={`https://wa.me/${storePhone}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 rounded-full hover:bg-surface-container-highest scale-90 duration-150"
        >
          <span className="material-symbols-outlined">chat</span>
          <span className="text-[10px] font-semibold uppercase mt-1">Contact</span>
        </a>

        <button 
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-full scale-90 duration-150 ${isMobileDrawerOpen ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
        >
          <span className="material-symbols-outlined" style={isMobileDrawerOpen ? { fontVariationSettings: "'FILL' 1" } : {}}>menu</span>
          <span className="text-[10px] font-semibold uppercase mt-1">Menu</span>
        </button>
      </div>
    </nav>
  );
}
