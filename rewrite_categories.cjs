const fs = require('fs');
const code = `import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { useNavigate, useLocation } from 'react-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCart } from '../../context/CartContext';
import { slugify } from '../../utils/slugify';
import { getDeterministicRating } from '../../services/productService';
import { QuickBuyModal } from '../../components/storefront/QuickBuyModal';
import { SkeletonProductCard } from '../../components/storefront/Skeleton';

export function StorefrontCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, formatPrice, toggleWishlist, isInWishlist } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('best_selling');
  
  const [visibleCount, setVisibleCount] = useState(12);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state) {
      if (location.state.category !== undefined) {
        setSelectedCategory(location.state.category);
      }
      if (location.state.searchQuery !== undefined) {
        setSearchTerm(location.state.searchQuery);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const activeProducts = productsSnapshot.docs
          .map(doc => {
            const data = doc.data() as any;
            if (typeof data.category === 'object' && data.category !== null) {
              data.category = data.category.name || 'Uncategorized';
            }
            return { ...data, id: doc.id };
          })
          .filter((p: any) => p.active !== false);
        setProducts(activeProducts);

        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        setOrders(ordersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getBestSellerScore = (product: any) => {
    let salesCount = 0;
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.productId === product.id) {
            salesCount += (item.quantity || 1);
          }
        });
      }
    });
    const { rating, count } = getDeterministicRating(product.id || '', product.title || '');
    return salesCount * 1000 + (product.ratingCount || count) * (product.ratingValue || rating);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low_high': return a.price - b.price;
      case 'price_high_low': return b.price - a.price;
      case 'newest': return b.createdAt - a.createdAt;
      case 'best_selling':
      default: return getBestSellerScore(b) - getBestSellerScore(a);
    }
  });

  const allCategoryPillNames = ["All Categories", ...new Set(products.map((p) => p.category))].filter(Boolean);

  const ProductGridItem = ({ product }: { product: any }) => (
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
            <span className="text-lg font-bold text-neutral-900">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-neutral-500 line-through text-xs">{formatPrice(product.originalPrice)}</span>
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

  return (
    <div className="min-h-screen bg-neutral-50 pt-4 pb-16">
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-md shadow-2xl flex items-center gap-2 z-50 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          {toastMessage}
        </div>
      )}

      {quickBuyProduct && (
        <QuickBuyModal 
          product={quickBuyProduct} 
          isOpen={!!quickBuyProduct} 
          onClose={() => setQuickBuyProduct(null)} 
        />
      )}

      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar for Desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-neutral-200 p-4 sticky top-20">
            <h3 className="font-bold text-neutral-800 mb-4 text-lg">Categories</h3>
            <ul className="space-y-2">
              {allCategoryPillNames.map(cat => (
                <li key={cat}>
                  <button 
                    onClick={() => setSelectedCategory(cat)}
                    className={\`w-full text-left text-sm py-1.5 \${selectedCategory === cat ? 'font-bold text-primary' : 'text-neutral-600 hover:text-primary'}\`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Mobile Category Horizontal Scroll */}
          <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
            {allCategoryPillNames.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={\`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border \${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-700 border-neutral-200'}\`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Top Bar: Search & Sort */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-neutral-500 font-medium">
                Showing <span className="font-bold text-neutral-900">{filteredProducts.length}</span> results
              </p>
              {searchTerm && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-neutral-100 px-3 py-1.5 rounded-full text-neutral-700 flex items-center gap-1">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-red-500">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-neutral-700 whitespace-nowrap">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-sm rounded-md px-3 py-2 w-full sm:w-auto outline-none focus:border-primary"
              >
                <option value="best_selling">Best Selling</option>
                <option value="price_low_high">Price: Low to High</option>
                <option value="price_high_low">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonProductCard key={i} />)
            ) : sortedProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-lg border border-neutral-200">
                <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">search_off</span>
                <h3 className="text-lg font-bold text-neutral-800">No products found</h3>
                <p className="text-neutral-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                <button 
                  onClick={() => { setSelectedCategory("All Categories"); setSearchTerm(""); }}
                  className="mt-4 bg-primary text-white px-6 py-2 rounded-md font-medium text-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              sortedProducts.slice(0, visibleCount).map((product) => (
                <ProductGridItem key={product.id || product.title} product={product} />
              ))
            )}
          </div>
          
          {visibleCount < sortedProducts.length && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="bg-white border border-neutral-300 text-neutral-700 px-8 py-2.5 rounded-md font-medium text-sm hover:bg-neutral-50 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/storefront/StorefrontCategories.tsx', code);
