import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGeneralSettings, GeneralSettings } from '../services/settingsService';
import { getCurrencySymbol, formatPrice as utilsFormatPrice } from '../utils/currency';
import { addToFirestoreWishlist, removeFromFirestoreWishlist, syncLocalWishlistToFirestore, fetchUserWishlist } from '../services/wishlistService';
import { saveCartSession } from '../services/abandonedCartService';
import { trackAddToCart, trackRemoveFromCart } from '../utils/analytics';

export interface CustomerUser {
  id: string;
  email: string;
  name?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
}

interface CartContextType {
  items: CartItem[];
  cartSessionId: string;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  settings: GeneralSettings | null;
  currencyCode: string;
  currencySymbol: string;
  formatPrice: (price: number) => string;
  refreshSettings: () => Promise<void>;
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => boolean;
  isInWishlist: (productId: string) => boolean;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  customer: CustomerUser | null;
  showCustomerLogin: boolean;
  setShowCustomerLogin: (show: boolean) => void;
  loginCustomer: (email?: string, password?: string) => Promise<boolean>;
  logoutCustomer: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem('customer_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('store_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const savedWishlist = localStorage.getItem('store_wishlist');
    if (savedWishlist) {
      try {
        return JSON.parse(savedWishlist);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  
  const [cartSessionId, setCartSessionId] = useState<string>(() => {
    let sid = localStorage.getItem('store_cart_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('store_cart_session_id', sid);
    }
    return sid;
  });

  const fetchSettings = async () => {
    try {
      const data = await getGeneralSettings();
      setSettings(data);
    } catch (e) {
      console.error("Error loading general settings in CartProvider", e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (customer) {
      fetchUserWishlist(customer.id).then(remoteWishlist => {
        if (remoteWishlist && remoteWishlist.length > 0) {
          setWishlist(remoteWishlist);
        }
      });
    }
  }, [customer]);

  const loginCustomer = async (email?: string, password?: string): Promise<boolean> => {
    if (!email || !password) return false;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const cust: CustomerUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.storeName || 'Customer'
        };
        setCustomer(cust);
        localStorage.setItem('customer_user', JSON.stringify(cust));
        setShowCustomerLogin(false);
        return true;
      }
    } catch (e) {
      console.error("Customer login failed", e);
    }
    return false;
  };

  const logoutCustomer = async () => {
    setCustomer(null);
    localStorage.removeItem('customer_user');
    setWishlist([]);
  };

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('store_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (items.length > 0 && cartSessionId) {
      const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      saveCartSession(cartSessionId, items, subtotal).catch(console.error);
    }
  }, [items, cartSessionId]);

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    const id = `${newItem.productId}-${newItem.size || ''}-${newItem.color || ''}`;
    const itemWithId = { ...newItem, id };
    
    trackAddToCart(itemWithId);

    setItems(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + newItem.quantity } : i);
      }
      return [...prev, itemWithId];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      trackRemoveFromCart(item);
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    const newSid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('store_cart_session_id', newSid);
    setCartSessionId(newSid);
  };

  const toggleWishlist = (item: WishlistItem) => {
    setWishlist(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        if (customer) removeFromFirestoreWishlist(customer.id, item.id).catch(console.error);
        return prev.filter(i => i.id !== item.id);
      } else {
        if (customer) addToFirestoreWishlist(customer.id, item).catch(console.error);
        return [...prev, item];
      }
    });
    return true;
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const currencyCode = settings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const customFormatPrice = (price: number) => utilsFormatPrice(price, currencyCode);

  return (
    <CartContext.Provider value={{ 
      items, 
      cartSessionId,
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart, 
      cartCount,
      settings,
      currencyCode,
      currencySymbol,
      formatPrice: customFormatPrice,
      refreshSettings: fetchSettings,
      wishlist,
      toggleWishlist,
      isInWishlist,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      customer,
      showCustomerLogin,
      setShowCustomerLogin,
      loginCustomer,
      logoutCustomer,
      isWishlistOpen,
      setIsWishlistOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
