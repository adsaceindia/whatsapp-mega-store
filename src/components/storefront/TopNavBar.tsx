import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { getMenuItems, MenuItem } from '../../services/menuService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { useCart } from '../../context/CartContext';
import { getProducts, Product } from '../../services/productService';
import { slugify } from '../../utils/slugify';

export function TopNavBar() {
  const { storeSettings } = useStoreConfig();
  const { cartCount, setIsMobileDrawerOpen } = useCart();
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
    if (!searchVal.trim()) return { matchedProducts: [], matchedCategories: [], totalMatchCount: 0 };
    const term = searchVal.toLowerCase();
    const matchedCategories = categories.filter(c => c.toLowerCase().includes(term)).slice(0, 3);
    const matchedProducts = products.filter(p => p.title.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)).slice(0, 4);
    return { matchedProducts, matchedCategories, totalMatchCount: products.filter(p => p.title.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)).length };
  };

  const { matchedProducts, matchedCategories, totalMatchCount } = getSuggestions();

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal)}`);
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 z-40 flex items-center px-4 md:px-8">
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <button 
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-all flex items-center justify-center active:scale-95 md:hidden"
          title="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <Link to="/" className="text-lg md:text-xl font-bold text-primary flex items-center gap-2.5">
          {storeSettings.storeIcon && (
            <img 
               src={storeSettings.storeIcon} 
               alt="Logo" 
               style={{ width: `${storeSettings.logoSize || 32}px`, height: 'auto', maxHeight: '3rem' }} 
               className="object-contain rounded" 
             />
          )}
          {(storeSettings.showStoreName !== false || !storeSettings.storeIcon) && (
            <span className="truncate max-w-[120px] md:max-w-[200px]">{storeSettings.storeName}</span>
          )}
        </Link>
      </div>
      
      <nav className="hidden md:flex gap-4 lg:gap-8 flex-shrink-0 items-center ml-8">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.link}
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 ml-4">
        {/* Desktop Search */}
        <div className="hidden md:flex relative max-w-sm w-full" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-neutral-100 dark:bg-slate-800 border-none rounded-full py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </form>
          {showSuggestions && searchVal.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-outline-variant/10 overflow-hidden text-sm z-50">
               {matchedProducts.map(p => (
                 <button key={p.id} onClick={() => { navigate(`/product/${slugify(p.title)}`); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-slate-800 text-on-surface flex items-center gap-3">
                   <img src={p.image} alt={p.title} className="w-8 h-8 object-contain rounded bg-neutral-100" referrerPolicy="no-referrer" />
                   <span className="truncate">{p.title}</span>
                 </button>
               ))}
               {matchedProducts.length === 0 && <div className="p-4 text-center text-neutral-500">No results found</div>}
            </div>
          )}
        </div>

        {/* Mobile Search Icon */}
        <button 
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-transform scale-95"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
        
        {/* Cart Icon */}
        <Link 
          to="/cart"
          className="relative p-2 text-on-surface-variant hover:text-primary transition-transform scale-95 flex items-center justify-center"
          title="Shopping Cart"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-surface border-b border-outline-variant/20 p-4 md:hidden z-50 animate-in slide-in-from-top-2">
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileSearchOpen(false); }} className="relative">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              autoFocus
              className="w-full bg-neutral-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-on-surface"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
