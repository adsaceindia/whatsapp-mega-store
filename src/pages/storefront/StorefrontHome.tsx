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

  const activeBanners = banners.length > 0 ? banners : DEFAULT_BANNERS;

  useEffect(() => {
    if (activeBanners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners]);

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
    <div className="w-full bg-neutral-50 dark:bg-slate-950 min-h-screen pb-12">
      
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

      {/* 1. App-Style Category Story Circles (Instagram/Swiggy Style) */}
      <section className="bg-white dark:bg-slate-900 border-b border-neutral-200/60 dark:border-slate-800 py-2.5 px-2 md:px-4 overflow-x-auto no-scrollbar shadow-xs">
        <div className="flex items-center gap-3 md:gap-4 min-w-max mx-auto max-w-7xl">
          {categoryNames.map((cat, idx) => {
            const dbCat = dbCategories.find(c => c.name === cat);
            const catProduct = products.find(p => p.category === cat);
            const imageToShow = dbCat?.image || catProduct?.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60";
            const isSelected = selectedCategory === cat;

            return (
              <div 
                key={cat}
                className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform"
                onClick={() => {
                  setSelectedCategory(cat);
                  navigate('/categories', { state: { category: cat } });
                }}
              >
                {/* Glowing Avatar Ring */}
                <div className={`w-13 h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full p-0.5 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30 scale-105' 
                    : 'bg-gradient-to-tr from-emerald-600/30 via-neutral-200 to-teal-500/30 dark:from-slate-700 dark:to-slate-600 group-hover:scale-105'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 p-0.5">
                    <img 
                      src={imageToShow} 
                      alt={cat} 
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                <span className={`text-[10px] md:text-xs font-semibold max-w-[65px] sm:max-w-[70px] truncate text-center transition-colors ${
                  isSelected ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-neutral-700 dark:text-slate-300 group-hover:text-emerald-600'
                }`}>
                  {cat}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Hero Carousel Slider */}
      <section className="w-full max-w-7xl mx-auto px-0 sm:px-3 md:px-6 mt-0 sm:mt-3 md:mt-6">
        {loadingBanners ? (
          <SkeletonBanner />
        ) : activeBanners.length > 0 ? (
          <div className="relative w-full h-[180px] sm:h-[280px] md:h-[380px] lg:h-[440px] rounded-none sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-lg group">
            {activeBanners.map((banner, index) => (
              <div 
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img 
                  src={banner.image} 
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-end md:items-center">
                  <div className="text-white p-4 sm:p-6 md:p-12 max-w-lg">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-[10px] md:text-xs font-bold text-emerald-300 mb-2">
                      <Sparkles className="w-3 h-3" /> Featured Collection
                    </span>
                    <h2 className="text-base sm:text-2xl md:text-4xl font-extrabold tracking-tight leading-tight mb-2">
                      {banner.title}
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-200 opacity-90 mb-4 hidden sm:block">
                      Explore curations and exclusive WhatsApp store deals.
                    </p>
                    <button 
                      onClick={() => navigate(banner.link || "/categories")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold text-xs md:text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span>Shop Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Controls */}
            {activeBanners.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 hover:bg-white text-neutral-800 dark:text-white p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 hover:bg-white text-neutral-800 dark:text-white p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Pagination */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {activeBanners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'bg-emerald-500 w-6' : 'bg-white/50 w-1.5'}`}
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
        <section className="max-w-7xl mx-auto px-2 md:px-6 mt-3 sm:mt-4">
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
        <section className="max-w-7xl mx-auto px-2 md:px-6 mt-4 sm:mt-6">
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

      {/* 5. Sticky Category Filter Pill Bar */}
      <section className="sticky top-14 md:top-20 z-30 bg-neutral-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2 border-y border-neutral-200/50 dark:border-slate-800 mt-4 sm:mt-6 shadow-xs">
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] md:text-xs font-bold text-neutral-400 dark:text-slate-500 flex items-center gap-1 mr-0.5 flex-shrink-0">
            <Layers className="w-3.5 h-3.5" /> Filter:
          </span>
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 md:px-3.5 md:py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border border-neutral-200/80 dark:border-slate-800 hover:border-emerald-500'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Main Product Feed Grid */}
      <section className="max-w-7xl mx-auto px-2 md:px-6 mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm md:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {selectedCategory === 'All' ? 'Curated Catalog' : `${selectedCategory} Products`}
          </h2>
          <span className="text-[11px] md:text-xs font-semibold text-neutral-400">
            {filteredProducts.length} items
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/60 dark:border-slate-800 p-8">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-slate-200 mb-1">No products found</h3>
            <p className="text-xs text-neutral-500">Try selecting another category filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
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
      <section className="max-w-7xl mx-auto px-2 md:px-6 mt-8 sm:mt-12">
        <TestimonialsSection products={products} orders={orders} />
      </section>

      {/* 8. FAQ Section */}
      <section className="max-w-7xl mx-auto px-2 md:px-6 mt-6 sm:mt-8">
        <FAQSection />
      </section>

    </div>
  );
}
