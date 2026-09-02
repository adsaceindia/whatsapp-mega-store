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


export function StorefrontHome() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  
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

  // Derive categories and top products
  const allCategories = Array.from(new Set([
    ...dbCategories.map(c => c.name),
    ...products.map(p => p.category)
  ])).filter(Boolean);
  
  // Sort by Best Selling logic
  const sortedProducts = [...products].sort((a, b) => {
    const getScore = (p: any) => {
      let salesCount = 0;
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.productId === p.id) {
              salesCount += (item.quantity || 1);
            }
          });
        }
      });
      const { rating, count } = getDeterministicRating(p.id || '', p.title || '');
      return salesCount * 1000 + (p.ratingCount || count) * (p.ratingValue || rating);
    };
    return getScore(b) - getScore(a);
  });

  const featuredProducts = sortedProducts.slice(0, 8);
  const newArrivals = [...products].reverse().slice(0, 8);
  const spotlightProducts = products.filter(p => p.spotlight);
  const suggestedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 8);
  const spotlightCoupon = coupons.find(c => c.spotlight && c.active);
  if (loading) {
    return <InterestingLoader message="Curating Store Experience..." fullScreen />;
  }

  return (
    <div className="w-full bg-neutral-100 min-h-screen pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-md shadow-2xl flex items-center gap-2 z-50 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Quick Buy Modal */}
      {quickBuyProduct && (
        <QuickBuyModal 
          product={quickBuyProduct} 
          isOpen={!!quickBuyProduct} 
          onClose={() => setQuickBuyProduct(null)} 
        />
      )}

      {/* Categories Horizontal Scroll */}
      <div className="bg-white border-b border-neutral-200 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 px-4 py-3 min-w-max mx-auto max-w-7xl">
          {loading ? (
            <SkeletonCategoryCircles />
          ) : (
            allCategories.map((cat, idx) => {
              const dbCat = dbCategories.find(c => c.name === cat);
              const catProduct = products.find(p => p.category === cat);
              const imageToShow = dbCat?.image || catProduct?.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60";
              return (
                <div 
                  key={idx}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  onClick={() => navigate("/categories", { state: { category: cat } })}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 group-hover:border-primary transition-colors p-1">
                    <img src={imageToShow} alt={cat} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-neutral-700 group-hover:text-primary text-center max-w-[60px] md:max-w-[80px] truncate">
                    {cat}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        {loadingBanners ? (
          <SkeletonBanner />
        ) : activeBanners.length > 0 ? (
          <div className="relative w-full h-[150px] sm:h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-sm group">
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
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                  <div className="text-white p-4 sm:p-6 md:p-10 lg:p-12 max-w-md lg:max-w-lg">
                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 md:mb-4">{banner.title}</h2>
                    <p className="text-xs md:text-base lg:text-lg opacity-90 mb-4 md:mb-6 hidden sm:block">Explore curations and best offers</p>
                    <button 
                      onClick={() => navigate("/categories")}
                      className="bg-white text-neutral-900 px-4 py-2 md:px-6 md:py-2.5 rounded-md font-semibold text-xs md:text-sm hover:bg-neutral-100 transition-colors"
                    >
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Carousel Controls */}
            {activeBanners.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-800 p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-800 p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {activeBanners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Spotlight Product Section */}
      {spotlightProducts.length > 0 && !loading && (
        <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white p-4 sm:p-6 md:p-12 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-purple-500 opacity-30 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left z-10 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 bg-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md border border-white/30 shadow-sm">
                <span className="material-symbols-outlined text-[14px] md:text-[16px] text-amber-300">stars</span>
                Highlighted Product
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-xl tracking-tight">
                {spotlightProducts[0].title}
              </h2>
              <p className="text-white/95 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl drop-shadow-md">
                {spotlightProducts[0].description}
              </p>
              <div className="pt-2 md:pt-4 flex flex-row items-center gap-4 justify-center md:justify-start">
                <button 
                  onClick={() => navigate(`/product/${spotlightProducts[0].id || slugify(spotlightProducts[0].title)}`)}
                  className="bg-white text-indigo-950 px-6 py-2.5 md:px-8 md:py-4 rounded-full font-bold hover:bg-neutral-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-sm md:text-base flex items-center justify-center gap-2"
                >
                  Shop Now <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_forward</span>
                </button>
                <span className="text-xl md:text-3xl font-extrabold text-amber-300 drop-shadow-md bg-black/20 px-3 py-1 md:px-4 md:py-2 rounded-lg">
                  {formatPrice(spotlightProducts[0].price)}
                </span>
              </div>
            </div>
            <div className="w-40 h-40 sm:w-56 sm:h-56 md:w-1/2 lg:w-5/12 md:h-[350px] lg:h-[400px] bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center p-3 md:p-8 z-10 group relative mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
              <ResponsiveImage 
                src={spotlightProducts[0].image} 
                alt={spotlightProducts[0].title} 
                className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-xl" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Featured / Best Sellers Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-neutral-800">Best Sellers</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary text-xs md:text-sm font-medium hover:underline flex items-center"
            >
              See all <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonProductCard key={i} />)
            ) : (
              featuredProducts.map(product => (
                <ProductGridItem key={product.id || product.title} product={product} triggerToast={triggerToast} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spotlight Coupon Banner */}
      {spotlightCoupon && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-fuchsia-600 text-white p-4 sm:p-6 md:p-10 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-yellow-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner transform -rotate-6">
                <span className="material-symbols-outlined text-4xl md:text-5xl text-white">sell</span>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-2 text-white drop-shadow-md">Special Offer!</h3>
                <p className="text-white/95 text-base md:text-lg font-medium max-w-xl">
                  Use code <span className="font-mono font-black bg-white/20 px-3 py-1 rounded-md border border-white/30 tracking-wider shadow-sm">{spotlightCoupon.code}</span> to get {spotlightCoupon.discountType === 'percentage' ? `${spotlightCoupon.discountValue}% off` : formatPrice(spotlightCoupon.discountValue)} 
                  {spotlightCoupon.minOrderValue ? ` on orders over ${formatPrice(spotlightCoupon.minOrderValue)}` : ''}!
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(spotlightCoupon.code);
                triggerToast("Coupon code copied to clipboard!");
              }}
              className="relative z-10 bg-white text-pink-700 px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-neutral-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 whitespace-nowrap active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">content_copy</span>
              Copy Code
            </button>
          </div>
        </div>
      )}

      {/* Promotional Mid-Page Banner */}
      {storeSettings.promotionalBannerImage && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div 
            className={`w-full rounded-2xl overflow-hidden shadow-sm relative group ${storeSettings.promotionalBannerLink ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (storeSettings.promotionalBannerLink) {
                if (storeSettings.promotionalBannerLink.startsWith('http')) {
                  window.open(storeSettings.promotionalBannerLink, '_blank');
                } else {
                  navigate(storeSettings.promotionalBannerLink);
                }
              }
            }}
          >
            <ResponsiveImage 
              src={storeSettings.promotionalBannerImage} 
              alt="Promotional Banner" 
              className="w-full h-auto object-cover max-h-[300px] md:max-h-[400px] transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </div>
      )}

      {/* New Arrivals Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-neutral-800">New Arrivals</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary text-xs md:text-sm font-medium hover:underline flex items-center"
            >
              See all <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonProductCard key={i} />)
            ) : (
              newArrivals.map(product => (
                <ProductGridItem key={product.id || product.title} product={product} triggerToast={triggerToast} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Suggested Products Section */}
      {suggestedProducts.length > 0 && !loading && (
        <div className="max-w-7xl mx-auto px-4 mt-6 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-neutral-800">Suggestions For You</h2>
              <button 
                onClick={() => navigate('/categories')}
                className="text-primary text-xs md:text-sm font-medium hover:underline flex items-center"
              >
                See all <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {suggestedProducts.map(product => (
                <ProductGridItem key={product.id || product.title} product={product} triggerToast={triggerToast} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials / Reviews */}
      <TestimonialsSection products={products} orders={orders} />

      {/* FAQs */}
      <FAQSection />

    </div>
  );
}
