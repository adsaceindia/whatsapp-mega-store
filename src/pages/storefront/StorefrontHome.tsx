import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { useNavigate, useLocation } from 'react-router';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { getBanners, Banner } from '../../services/bannerService';
import { getProducts, getDeterministicRating } from '../../services/productService';
import { getOrders } from '../../services/orderService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { slugify } from '../../utils/slugify';
import { getCategories, Category } from '../../services/categoryService';
import { getCoupons, Coupon } from '../../services/couponService';
import { QuickBuyModal } from '../../components/storefront/QuickBuyModal';
import { SkeletonProductCard, SkeletonBanner, SkeletonCategoryCircles } from '../../components/storefront/Skeleton';
import { InterestingLoader } from '../../components/storefront/InterestingLoader';
import { ProductGridItem } from '../../components/storefront/ProductGridItem';
import { FAQSection } from '../../components/storefront/FAQSection';
import { TestimonialsSection } from '../../components/storefront/TestimonialsSection';
import { Sparkles, Flame, CheckCircle, Tag, ArrowRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export function StorefrontHome() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, formatPrice, toggleWishlist, isInWishlist } = useCart();
  const { storeSettings } = useStoreConfig();
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const DEFAULT_BANNERS: Banner[] = [
    {
      id: 'default_1',
      title: 'Exclusive Collection - Modern Lifestyle Essentials',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      link: '/categories'
    },
    {
      id: 'default_2',
      title: 'Special Mega Discounts - Limited Time Deals',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
      link: '/categories'
    },
    {
      id: 'default_3',
      title: 'Fast Direct Order via WhatsApp',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
      link: '/categories'
    }
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        const [genSettings, bannerData, couponData, catData, orderData, prodData] = await Promise.all([
          getGeneralSettings().catch(() => null),
          getBanners().catch(() => []),
          getCoupons().catch(() => []),
          getCategories().catch(() => []),
          getOrders().catch(() => []),
          getProducts().catch(() => [])
        ]);

        if (!isMounted) return;

        if (genSettings) setSettings(genSettings);
        if (bannerData && bannerData.length > 0) {
          setBanners(bannerData);
        } else {
          setBanners(DEFAULT_BANNERS);
        }
        setLoadingBanners(false);
        setCoupons(couponData || []);
        setDbCategories(catData || []);
        setOrders(orderData || []);
        setProducts((prodData || []).filter((p: any) => p.active !== false));
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const DEFAULT_RECTANGLE_BANNERS: Banner[] = [
    {
      id: 'rect_1',
      title: 'SUMMER ESSENTIALS',
      subtitle: 'Lightweight linen & organic cottons crafted for warmer days',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1000&q=80',
      link: '/categories',
      buttonText: 'EXPLORE NOW',
      tag: 'SEASONAL EDIT'
    },
    {
      id: 'rect_2',
      title: 'THE ACCESSORY EDIT',
      subtitle: 'Handcrafted leather totes, silk scarves & 18k gold jewelry',
      image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=1000&q=80',
      link: '/categories',
      buttonText: 'SHOP EDIT',
      tag: 'NEW ARRIVALS'
    }
  ];

  const heroBanners = banners.filter(b => (!b.position || b.position === 1 || b.type === 'hero'));
  const activeHeroBanners = heroBanners.length > 0 ? heroBanners : DEFAULT_BANNERS;

  const customRectangleBanners = banners.filter(b => b.position === 2 || b.type === 'rectangle');
  const activeRectangleBanners = customRectangleBanners.length > 0 ? customRectangleBanners : DEFAULT_RECTANGLE_BANNERS;

  useEffect(() => {
    if (activeHeroBanners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeHeroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeHeroBanners]);

  // Derive categories and filtered products
  const categoryNames = Array.from(new Set([
    ...dbCategories.map(c => c.name),
    ...products.map(p => p.category)
  ])).filter(Boolean);

  const allCategories = ['All', ...categoryNames];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const spotlightProducts = products.filter(p => p.spotlight);
  const spotlightCoupon = coupons.find(c => c.spotlight && c.active);

  if (loading) {
    return <InterestingLoader message="Curating Store Experience..." fullScreen />;
  }

  return (
    <div className="w-full bg-white dark:bg-slate-950 min-h-screen pb-12">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce text-xs font-semibold border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Buy Modal Drawer */}
      {quickBuyProduct && (
        <QuickBuyModal 
          product={quickBuyProduct} 
          isOpen={!!quickBuyProduct} 
          onClose={() => setQuickBuyProduct(null)} 
        />
      )}

      {/* 1. Open Fashion Category Reels */}
      <section className="bg-white dark:bg-slate-900 border-b border-neutral-200/50 dark:border-slate-800/80 py-3 px-2 md:px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 min-w-max mx-auto max-w-7xl justify-start sm:justify-center">
          {categoryNames.map((cat, idx) => {
            const dbCat = dbCategories.find(c => c.name === cat);
            const catProduct = products.find(p => p.category === cat);
            const imageToShow = dbCat?.image || catProduct?.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60";
            const isSelected = selectedCategory === cat;

            return (
              <div 
                key={cat}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
                onClick={() => {
                  setSelectedCategory(cat);
                  navigate('/categories', { state: { category: cat } });
                }}
              >
                {/* Copper Avatar Ring */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 transition-all duration-300 ${
                  isSelected 
                    ? 'border-2 border-[#DD8560] scale-105 shadow-sm' 
                    : 'border border-neutral-200 dark:border-slate-700 group-hover:border-[#DD8560]'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#F9F9F9] dark:bg-slate-900 p-0.5">
                    <img 
                      src={imageToShow} 
                      alt={cat} 
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                <span className={`text-[10px] font-tenor uppercase tracking-widest max-w-[70px] truncate text-center transition-colors ${
                  isSelected ? 'text-[#DD8560] font-bold' : 'text-neutral-700 dark:text-slate-300 group-hover:text-[#DD8560]'
                }`}>
                  {cat}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Open Fashion Editorial Hero Slider */}
      <section className="w-full max-w-none px-0 sm:px-4 md:px-8 lg:px-12 mt-0 sm:mt-3 md:mt-6">
        {loadingBanners ? (
          <SkeletonBanner />
        ) : activeHeroBanners.length > 0 ? (
          <div className="relative w-full h-[220px] sm:h-[320px] md:h-[420px] lg:h-[480px] rounded-none sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-md group">
            {activeHeroBanners.map((banner, index) => (
              <div 
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img 
                  src={banner.image} 
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/85 via-black/40 to-transparent flex items-end md:items-center">
                  <div className="text-white p-5 sm:p-8 md:p-14 max-w-lg text-left">
                    <span className="inline-block font-tenor uppercase tracking-luxury text-[10px] md:text-xs text-[#DD8560] font-bold mb-2">
                      Luxury Collection
                    </span>
                    <h2 className="font-tenor text-lg sm:text-3xl md:text-5xl uppercase tracking-wider leading-tight mb-3 font-normal">
                      {banner.title}
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-300 font-sans opacity-90 mb-5 hidden sm:block">
                      Discover refined craftsmanship and modern elegance.
                    </p>
                    <button 
                      onClick={() => navigate(banner.link || "/categories")}
                      className="bg-[#111111] hover:bg-[#DD8560] text-white px-5 py-2.5 md:px-7 md:py-3 font-tenor uppercase tracking-luxury text-xs transition-colors shadow-lg border border-white/20 active:scale-95 flex items-center gap-2"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Controls */}
            {activeHeroBanners.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + activeHeroBanners.length) % activeHeroBanners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 hover:bg-white text-neutral-800 dark:text-white p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % activeHeroBanners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 hover:bg-white text-neutral-800 dark:text-white p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Pagination */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {activeHeroBanners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'bg-[#DD8560] w-6' : 'bg-white/50 w-1.5'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>

      {/* 3. Spotlight Coupon Alert Bar (If Available) */}
      {spotlightCoupon && (
        <section className="w-full max-w-none px-3 md:px-8 lg:px-12 mt-3 sm:mt-4">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-md flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Tag className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-emerald-200">Exclusive Voucher Code</span>
                <p className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight">
                  Use code <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-emerald-100 border border-white/30">{spotlightCoupon.code}</span> for instant discount!
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(spotlightCoupon.code);
                triggerToast(`Copied code "${spotlightCoupon.code}"!`);
              }}
              className="bg-white text-emerald-800 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl font-bold text-[11px] md:text-xs hover:bg-emerald-50 active:scale-95 transition-all flex-shrink-0 shadow-sm"
            >
              Copy Code
            </button>
          </div>
        </section>
      )}

      {/* 4. Horizontal Spotlight Products Reel (Flash Deals) */}
      {spotlightProducts.length > 0 && (
        <section className="w-full max-w-none px-3 md:px-8 lg:px-12 mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-rose-500/10 text-rose-500 rounded-lg">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <h2 className="text-sm md:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Flash Spotlight Deals
              </h2>
            </div>
            <button 
              onClick={() => navigate('/categories')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2.5 md:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 md:mx-0 md:px-0">
            {spotlightProducts.map((p) => (
              <div key={p.id} className="w-[155px] sm:w-[210px] md:w-[240px] flex-shrink-0">
                <ProductGridItem 
                  product={p} 
                  triggerToast={triggerToast} 
                  onQuickBuy={setQuickBuyProduct} 
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Sticky Category Filter Tab Bar */}
      <section className="sticky top-14 md:top-20 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md py-3 border-y border-neutral-200/50 dark:border-slate-800 mt-6 shadow-xs">
        <div className="w-full max-w-none px-3 md:px-8 lg:px-12 flex items-center justify-center gap-6 overflow-x-auto no-scrollbar">
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`pb-1 text-xs font-tenor uppercase tracking-luxury whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? 'text-[#DD8560] border-b-2 border-[#DD8560] font-bold'
                    : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5.5 Rectangle Promo Banner Grid (Mobile-Optimized Rectangular Cards Above New Arrivals) */}
      <section className="w-full max-w-none px-3 md:px-8 lg:px-12 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-6">
          {activeRectangleBanners.slice(0, 2).map((b) => (
            <div 
              key={b.id || b.title}
              onClick={() => navigate(b.link || '/categories')}
              className="relative h-[150px] sm:h-[180px] md:h-[220px] rounded-2xl overflow-hidden cursor-pointer group shadow-xs hover:shadow-md transition-all active:scale-[0.99] border border-neutral-200/60 dark:border-slate-800"
            >
              <img 
                src={b.image} 
                alt={b.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6 flex flex-col justify-end text-left text-white">
                <span className="text-[9px] sm:text-[10px] font-tenor uppercase tracking-widest text-[#DD8560] font-bold mb-0.5">
                  {b.tag || 'CURATED COLLECTION'}
                </span>
                <h3 className="font-tenor text-base sm:text-lg md:text-xl uppercase tracking-wider font-normal line-clamp-1 mb-1">
                  {b.title}
                </h3>
                {b.subtitle && (
                  <p className="text-[11px] sm:text-xs text-neutral-300 font-sans line-clamp-1 opacity-90 mb-2">
                    {b.subtitle}
                  </p>
                )}
                <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-tenor uppercase tracking-luxury text-white font-bold group-hover:text-[#DD8560] transition-colors">
                  <span>{b.buttonText || 'EXPLORE NOW'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signature Diamond Decorative Divider */}
      <div className="flex items-center justify-center gap-3 my-8 text-neutral-300 dark:text-slate-700">
        <div className="w-12 h-px bg-neutral-200 dark:bg-slate-800" />
        <span className="text-[#DD8560] text-xs font-serif">◇</span>
        <div className="w-12 h-px bg-neutral-200 dark:bg-slate-800" />
      </div>

      {/* 6. Main Product Feed Grid */}
      <section className="w-full max-w-none px-3 md:px-8 lg:px-12">
        <div className="text-center mb-6">
          <h2 className="font-tenor text-lg sm:text-2xl uppercase tracking-luxury text-neutral-900 dark:text-white mb-1">
            {selectedCategory === 'All' ? 'New Arrival' : `${selectedCategory}`}
          </h2>
          <div className="w-8 h-0.5 bg-[#DD8560] mx-auto mt-1" />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-neutral-200/60 dark:border-slate-800 p-8">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-tenor uppercase tracking-wider text-neutral-800 dark:text-slate-200 mb-1">No products found</h3>
            <p className="text-xs text-neutral-500">Try selecting another category filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductGridItem 
                key={product.id || product.title} 
                product={product} 
                triggerToast={triggerToast}
                onQuickBuy={setQuickBuyProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. Reviews & Customer Feedback */}
      <section className="w-full max-w-none px-3 md:px-8 lg:px-12 mt-8 sm:mt-12">
        <TestimonialsSection products={products} orders={orders} />
      </section>

      {/* 8. FAQ Section */}
      <section className="w-full max-w-none px-3 md:px-8 lg:px-12 mt-6 sm:mt-8">
        <FAQSection />
      </section>

    </div>
  );
}
