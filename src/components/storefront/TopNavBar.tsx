import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { getMenuItems, MenuItem } from '../../services/menuService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { useCart } from '../../context/CartContext';
import { getProducts, Product } from '../../services/productService';
import { slugify } from '../../utils/slugify';
import { Search, ShoppingBag, Heart, Menu, Sparkles, X, ChevronRight } from 'lucide-react';

export function TopNavBar() {
  const { storeSettings } = useStoreConfig();
  const { cartCount, wishlist, setIsMobileDrawerOpen } = useCart();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProducts().then(prods => {
      setProducts(prods);
      const cats = Array.from(new Set(prods.map(p => p.category))).filter(Boolean);
      setCategories(cats as string[]);
    }).catch(console.error);

    getMenuItems().then(setMenuItems).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestions = () => {
    if (!searchVal.trim()) return { matchedProducts: [], matchedCategories: [] };
    const term = searchVal.toLowerCase();
    const matchedCategories = categories.filter(c => c.toLowerCase().includes(term)).slice(0, 3);
    const matchedProducts = products.filter(p => p.title.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)).slice(0, 5);
    return { matchedProducts, matchedCategories };
  };

  const { matchedProducts, matchedCategories } = getSuggestions();

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal)}`);
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 h-14 md:h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-slate-800/80 z-40 transition-all">
      <div className="max-w-7xl mx-auto h-full px-2.5 md:px-8 flex items-center justify-between gap-2 md:gap-4">
        
        {/* Left Brand Area (Mobile App Header + Desktop Web Header) */}
        <div className="flex items-center gap-3">
          {/* Mobile App Menu Trigger */}
          <button 
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 -ml-1 text-neutral-700 dark:text-slate-200 hover:text-emerald-600 transition-transform active:scale-95 md:hidden"
            title="Open App Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Store Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {storeSettings.storeIcon ? (
              <img 
                src={storeSettings.storeIcon} 
                alt="Logo" 
                className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-xl shadow-xs border border-neutral-200/50 dark:border-slate-800 group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            )}

            {(storeSettings.showStoreName !== false || !storeSettings.storeIcon) && (
              <div className="flex flex-col">
                <span className="font-bold text-sm md:text-lg text-neutral-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px]">
                  {storeSettings.storeName}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide hidden sm:block">
                  Verified WhatsApp Store
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 ml-8">
          <Link 
            to="/" 
            className="text-sm font-semibold text-neutral-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/categories" 
            className="text-sm font-semibold text-neutral-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Categories
          </Link>
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.link}
              className="text-sm font-semibold text-neutral-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link 
            to="/track" 
            className="text-sm font-semibold text-neutral-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Track Order
          </Link>
        </nav>

        {/* Right Action Bar (Search, Wishlist, Cart) */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Desktop Search Bar with Live Suggestions */}
          <div className="hidden md:block relative w-64 lg:w-80" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={searchVal}
                onChange={e => { setSearchVal(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-neutral-100 dark:bg-slate-800 border border-neutral-200/60 dark:border-slate-700 rounded-full py-2 pl-4 pr-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-emerald-600 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Live Search Dropdown */}
            {showSuggestions && searchVal.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200/80 dark:border-slate-800 overflow-hidden text-xs z-50 animate-in fade-in slide-in-from-top-2">
                {matchedCategories.length > 0 && (
                  <div className="p-2 bg-neutral-50 dark:bg-slate-800/50 border-b border-neutral-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2">Categories</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matchedCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { navigate(`/categories?cat=${encodeURIComponent(cat)}`); setShowSuggestions(false); }}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg text-neutral-700 dark:text-slate-300 font-medium hover:text-emerald-600"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 py-1 block">Products</span>
                  {matchedProducts.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { navigate(`/product/${slugify(p.title)}`); setShowSuggestions(false); }} 
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-slate-800/80 text-neutral-800 dark:text-slate-200 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img src={p.image} alt={p.title} className="w-7 h-7 object-cover rounded-lg bg-neutral-100 dark:bg-slate-800" referrerPolicy="no-referrer" />
                        <span className="truncate font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{p.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                  {matchedProducts.length === 0 && (
                    <div className="p-4 text-center text-neutral-400 font-medium">
                      No matching items found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search Button (App View) */}
          <button 
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 text-neutral-700 dark:text-slate-200 hover:text-emerald-600 active:scale-95 transition-transform rounded-xl bg-neutral-100 dark:bg-slate-800"
            title="Search Store"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Wishlist Shortcut */}
          <Link
            to="/cart"
            className="relative p-2 text-neutral-700 dark:text-slate-200 hover:text-emerald-600 active:scale-95 transition-transform rounded-xl bg-neutral-100 dark:bg-slate-800 hidden sm:flex items-center justify-center"
            title="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlist && wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Desktop Cart Button */}
          <Link 
            to="/cart"
            className="hidden md:flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag</span>
            {cartCount > 0 && (
              <span className="bg-white text-emerald-700 text-[11px] font-extrabold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>

      {/* Mobile Search Bottom Sheet Overlay */}
      {mobileSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 p-3 md:hidden z-50 shadow-xl animate-in slide-in-from-top-2">
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileSearchOpen(false); }} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                autoFocus
                className="w-full bg-neutral-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-medium outline-none text-neutral-900 dark:text-white"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button 
              type="button" 
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-neutral-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
