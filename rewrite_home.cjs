const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { useNavigate, useLocation } from 'react-router';
import { useCart } from '../../context/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { getBanners, Banner } from '../../services/bannerService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { db } from '../../firebase';
import { slugify } from '../../utils/slugify';
import { getDeterministicRating } from '../../services/productService';
import { QuickBuyModal } from '../../components/storefront/QuickBuyModal';
import { SkeletonProductCard, SkeletonBanner, SkeletonCategoryCircles } from '../../components/storefront/Skeleton';

export function StorefrontHome() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, formatPrice, toggleWishlist, isInWishlist } = useCart();
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
    
    getBanners().then(data => {
      setBanners(data);
      setLoadingBanners(false);
    }).catch(console.error);

    getDocs(collection(db, 'orders')).then(snapshot => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const fetched = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          if (typeof data.category === 'object' && data.category !== null) {
            data.category = data.category.name || 'Uncategorized';
          }
          return { ...data, id: doc.id };
        });
        setProducts(fetched.filter((p: any) => p.active !== false));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  // Derive categories and top products
  const allCategories = Array.from(new Set(products.map(p => p.category)));
  
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

  const ProductGridItem = ({ product }: { product: any }) => {
    return (
      <div 
        className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer relative"
        onClick={() => navigate(\`/product/\${slugify(product.title)}\`)}
      >
        <div className="relative aspect-square bg-neutral-50 flex items-center justify-center overflow-hidden p-2">
          <ResponsiveImage 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" 
          />
          {/* Wishlist Button */}
          <button 
            className={\`absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-sm transition-all \${isInWishlist(product.id) ? 'text-primary' : 'text-neutral-400 hover:text-primary'}\`}
            onClick={(e) => {
              e.stopPropagation();
              const success = toggleWishlist(product);
              if (success) {
                triggerToast(isInWishlist(product.id) ? \`Removed "\${product.title}" from wishlist.\` : \`Saved "\${product.title}" to wishlist!\`);
              }
            }}
          >
            <span className="material-symbols-outlined text-[18px] block" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
          
          {product.sale && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              SALE
            </div>
          )}
        </div>
        
        <div className="p-3 flex flex-col flex-grow">
          <h3 className="text-sm font-medium text-neutral-800 line-clamp-2 mb-1 group-hover:text-primary transition-colors" title={product.title}>
            {product.title}
          </h3>
          
          {(() => {
            const { rating, count } = getDeterministicRating(product.id || '', product.title || '');
            const displayRating = product.ratingValue || rating;
            const displayCount = product.ratingCount || count;
            return (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex text-amber-500">
                  <span className="material-symbols-outlined text-[14px] font-bold select-none" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                </div>
                <span className="text-[12px] font-medium text-neutral-700">{displayRating.toFixed(1)}</span>
                <span className="text-[12px] text-neutral-500">({displayCount})</span>
              </div>
            );
          })()}
          
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-bold text-neutral-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-neutral-500 line-through text-xs">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            
            <div className="flex gap-2 mt-3">
              <button 
                className="flex-1 bg-primary text-white py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({ productId: product.id, title: product.title, price: product.price, image: product.image, quantity: 1, size: product.sizes?.[0], color: product.colors?.[0] });
                  triggerToast(\`Added "\${product.title}" to cart!\`);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              const catProduct = products.find(p => p.category === cat);
              return (
                <div 
                  key={idx}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  onClick={() => navigate("/categories", { state: { category: cat } })}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 group-hover:border-primary transition-colors p-1">
                    <img 
                      src={catProduct?.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60"} 
                      alt={cat} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="text-[11px] md:text-xs font-medium text-neutral-700 group-hover:text-primary text-center max-w-[70px] truncate">
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
        ) : banners.length > 0 ? (
          <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-sm group">
            {banners.map((banner, index) => (
              <div 
                key={banner.id}
                className={\`absolute inset-0 transition-opacity duration-700 \${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}\`}
              >
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                  <div className="text-white p-6 md:p-12 max-w-lg">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-4">{banner.title}</h2>
                    <p className="text-sm md:text-lg opacity-90 mb-6 hidden sm:block">{banner.subtitle}</p>
                    <button 
                      onClick={() => navigate("/categories")}
                      className="bg-white text-neutral-900 px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-neutral-100 transition-colors"
                    >
                      {banner.buttonText || 'Shop Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Carousel Controls */}
            {banners.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-800 p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-800 p-2 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {banners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={\`w-2 h-2 rounded-full transition-all \${idx === currentBannerIndex ? 'bg-white w-4' : 'bg-white/50'}\`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Featured / Best Sellers Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-800">Best Sellers</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary text-sm font-medium hover:underline flex items-center"
            >
              See all <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonProductCard key={i} />)
            ) : (
              featuredProducts.map(product => (
                <ProductGridItem key={product.id || product.title} product={product} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-800">New Arrivals</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary text-sm font-medium hover:underline flex items-center"
            >
              See all <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonProductCard key={i} />)
            ) : (
              newArrivals.map(product => (
                <ProductGridItem key={product.id || product.title} product={product} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/storefront/StorefrontHome.tsx', code);
