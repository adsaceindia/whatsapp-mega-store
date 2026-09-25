import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Store, Grid, MessageSquare, Menu } from 'lucide-react';

export function BottomNavBar() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const { cartCount, isMobileDrawerOpen, setIsMobileDrawerOpen } = useCart();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
  }, []);

  const storePhone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || "1234567890";

  const navItems = [
    {
      label: 'Home',
      to: '/',
      icon: Store,
      isActive: path === '/'
    },
    {
      label: 'Categories',
      to: '/categories',
      icon: Grid,
      isActive: path.startsWith('/categories') || path.startsWith('/category')
    },
    {
      label: 'Cart',
      to: '/cart',
      icon: ShoppingBag,
      isActive: path === '/cart',
      badge: cartCount
    }
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden pointer-events-auto">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800/80 shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-3xl px-3 py-2 flex items-center justify-around">
        
        {/* Nav Links */}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                item.isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {/* Active Glow Pill Backdrop */}
              {item.isActive && (
                <span className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl animate-fade-in" />
              )}
              
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[10px] tracking-tight mt-1 font-medium ${item.isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Instant WhatsApp Action */}
        <a
          href={`https://wa.me/${storePhone}`}
          target="_blank"
          rel="noreferrer"
          className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-emerald-600 dark:text-emerald-400 active:scale-90 transition-all"
          title="Direct WhatsApp Support"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight mt-1">
            WhatsApp
          </span>
        </a>

        {/* Menu Drawer Toggle */}
        <button
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl active:scale-90 transition-all ${
            isMobileDrawerOpen
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-slate-400'
          }`}
        >
          {isMobileDrawerOpen && (
            <span className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl" />
          )}
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 font-medium">
            Menu
          </span>
        </button>

      </div>
    </nav>
  );
}
