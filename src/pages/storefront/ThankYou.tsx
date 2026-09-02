import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, Heart, ArrowRight, ShoppingBag, Eye } from 'lucide-react';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { formatPrice } from '../../utils/currency';

export function ThankYou() {
  const { storeSettings } = useStoreConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  
  // Hypnotic text states
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    
    getGeneralSettings().then(setGeneralSettings).catch(console.error);
  }, []);

  // Retrieve data passed from checkout
  const order = location.state?.order || {
    customer: { name: "Valued Patron" },
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0
  };
  const orderId = location.state?.orderId || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  const whatsappUrl = location.state?.whatsappUrl;
  const currencyCode = generalSettings?.currency || 'USD';

  // Hypnotic stage progression effect
  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStage(1), 3500);
    const timer2 = setTimeout(() => setActiveStage(2), 7500);
    const timer3 = setTimeout(() => setActiveStage(3), 11500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const storeName = storeSettings?.storeName || "Our Boutique";

  return (
    <main className="btn btn-primary btn-md w-full">
      {/* Dynamic Starfield & Hypnotic Glow Background with emerald tints */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.05)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,109,47,0.03)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Ambient floating geometric dust */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/25"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-4xl px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Hypnotic Swirling Rings Logo Container */}
        <div className="relative mb-8 w-28 h-28 flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-primary/10 border border-primary/20"
            animate={{ scale: [1, 1.25, 1], rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle Spiraling ring */}
          <motion.div 
            className="absolute w-20 h-20 rounded-full border-2 border-dashed border-primary/25"
            animate={{ rotate: -360, scale: [0.95, 1.1, 0.95] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner Glowing Core */}
          <motion.div 
            className="absolute w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary-container shadow-[0_0_25px_rgba(37,211,102,0.4)] flex items-center justify-center"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </motion.div>
        </div>

        {/* Dynamic & Magnetic Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-3"
        >
          <span className="text-xs uppercase tracking-[0.25em] font-mono font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
            Secure Order Approved • {orderId}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-space tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-on-background via-primary to-primary-container py-2">
            A Perfect Alignment.
          </h1>
        </motion.div>

        {/* Hypnotic Stage Content Box with continuous fading entries */}
        <div className="my-8 max-w-2xl min-h-[140px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {activeStage === 0 && (
              <motion.p
                key="stage0"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 1 }}
                className="text-lg md:text-xl font-light text-on-surface-variant leading-relaxed italic"
              >
                "Take a deep breath. Feel the gentle wave of satisfaction. You haven't just made a purchase—you've made an exceptional decision. Everything is exactly as it should be."
              </motion.p>
            )}
            
            {activeStage === 1 && (
              <motion.p
                key="stage1"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 1 }}
                className="text-lg md:text-xl font-light text-on-surface-variant leading-relaxed italic"
              >
                "In your mind, imagine the exquisite moment of receiving your bespoke package from <span className="text-primary font-bold">{storeName}</span>. Feel that touch of luxury, the absolute refinement. It is already yours, and the anticipation is pure joy."
              </motion.p>
            )}

            {activeStage === 2 && (
              <motion.p
                key="stage2"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 1 }}
                className="text-lg md:text-xl font-light text-on-surface-variant leading-relaxed italic"
              >
                "True connoisseurs always recognize perfection. You will find yourself returning to this space of inspiration. The desire to explore our latest pieces is already taking root... and next time, the pull will be even stronger."
              </motion.p>
            )}

            {activeStage >= 3 && (
              <motion.p
                key="stage3"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.2 }}
                className="text-lg md:text-xl font-light text-on-surface leading-relaxed italic"
              >
                "Welcome to an exclusive standard of living. Your journey has truly begun. Return whenever your soul seeks quality. We are always waiting to elevate your world."
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Grid: Order summary & CTA Buttons */}
        <div className="w-full max-w-2xl bg-surface/80 rounded-3xl p-6 md:p-8 border border-outline-variant/20 backdrop-blur-md shadow-xl space-y-6">
          
          {/* Tiny Order Strip if items exist */}
          {order.items && order.items.length > 0 && (
            <div className="border-b border-outline-variant/15 pb-5 text-left">
              <h3 className="text-xs uppercase tracking-widest font-mono text-on-surface-variant mb-3 flex items-center gap-1.5">
                <ShoppingBag size={12} className="text-primary" /> Items in Your Package
              </h3>
              <div className="space-y-3">
                {order.items.slice(0, 3).map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex justify-between items-center gap-4 text-sm">
                    <span className="text-on-surface truncate max-w-[280px] sm:max-w-md font-medium">
                      {item.quantity}x {item.title}
                    </span>
                    <span className="text-primary font-mono font-semibold shrink-0">
                      {formatPrice(item.price * item.quantity, currencyCode)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-on-surface-variant italic">and {order.items.length - 3} other luxurious selection(s)...</p>
                )}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-outline-variant/15 font-bold text-base">
                  <span className="text-on-surface">Total Invested</span>
                  <span className="text-primary font-mono font-bold text-lg">
                    {formatPrice(order.total, currencyCode)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            
            {/* If WhatsApp Url was passed and they need to finalise */}
            {whatsappUrl ? (
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 text-white py-4 px-8 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>Send WhatsApp Receipt</span>
              </a>
            ) : (
              <Link 
                to="/track"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 bg-surface-container hover:bg-surface-container-high hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 text-on-surface py-4 px-8 rounded-2xl font-bold transition-all duration-300 border border-outline-variant/20"
              >
                <Eye className="w-5 h-5 text-primary" />
                <span>Track Your Order</span>
              </Link>
            )}

            {/* Pulsating Magnet Home Button */}
            <Link 
              to="/" 
              className="btn btn-primary btn-lg w-full flex-1"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Return to Sanctuary</span>
              <ArrowRight className="w-4 h-4 animate-bounce" />
            </Link>
          </div>
        </div>

        {/* Subliminal Message Footer */}
        <div className="mt-12 text-xs font-mono text-on-surface-variant/70 tracking-wider flex items-center gap-2.5 opacity-80">
          <Heart className="w-3.5 h-3.5 text-primary animate-pulse fill-current" />
          <span>The pull to perfect quality is infinite. We welcome your presence.</span>
        </div>
      </div>
    </main>
  );
}
