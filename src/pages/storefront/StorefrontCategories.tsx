import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useCart } from '../../context/CartContext';
import { getProducts, getDeterministicRating } from '../../services/productService';
import { getOrders } from '../../services/orderService';
import { getCategories, Category } from '../../services/categoryService';
import { QuickBuyModal } from '../../components/storefront/QuickBuyModal';
import { SkeletonProductCard } from '../../components/storefront/Skeleton';
import { InterestingLoader } from '../../components/storefront/InterestingLoader';
import { ProductGridItem } from '../../components/storefront/ProductGridItem';
import { Layers, Search, SlidersHorizontal, CheckCircle, X } from 'lucide-react';

export function StorefrontCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, formatPrice, toggleWishlist, isInWishlist } = useCart();
  
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('best_selling');
  
  const [visibleCount, setVisibleCount] = useState(16);
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
        const allProds = await getProducts();
        const activeProducts = allProds.filter((p: any) => p.active !== false);
        setProducts(activeProducts);

        const allOrders = await getOrders();
        setOrders(allOrders);

        const cats = await getCategories();
        setDbCategories(cats);
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

  const allCategoryPillNames = ["All Categories", ...new Set([
    ...dbCategories.map(c => c.name),
    ...products.map(p => p.category)
  ])].filter(Boolean);

  if (loading) {
    return <InterestingLoader message="Loading Categories & Products..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 pt-4 pb-20 text-left">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce text-xs font-semibold border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Buy Drawer */}
      {quickBuyProduct && (
        <QuickBuyModal 
          product={quickBuyProduct} 
          isOpen={!!quickBuyProduct} 
          onClose={() => setQuickBuyProduct(null)} 
        />
      )}

      <div className="max-w-7xl mx-auto px-3 md:px-6 flex flex-col md:flex-row gap-6">
        
        {/* Desktop Sidebar Filter Card */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-5 sticky top-24 shadow-xs">
            <h3 className="font-extrabold text-neutral-900 dark:text-white mb-4 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Categories</span>
            </h3>
            <ul className="space-y-1.5">
              {allCategoryPillNames.map(cat => (
                <li key={cat}>
                  <button 
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-xs py-2 px-3 rounded-xl font-bold transition-all ${
                      selectedCategory === cat 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold' 
                        : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Products Content Area */}
        <div className="flex-1">
          
          {/* Mobile Category Pill Scroll */}
          <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
            {allCategoryPillNames.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                    : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-3.5 md:p-5 mb-6 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xs">
            <div>
              <p className="text-xs text-neutral-500 dark:text-slate-400 font-semibold">
                Showing <span className="font-extrabold text-neutral-900 dark:text-white">{filteredProducts.length}</span> catalog items
              </p>
              {searchTerm && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-neutral-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
              </span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-100 dark:bg-slate-800 border-none text-xs font-bold rounded-xl px-3 py-2 w-full sm:w-auto outline-none text-neutral-900 dark:text-white"
              >
                <option value="best_selling">Best Selling</option>
                <option value="price_low_high">Price: Low to High</option>
                <option value="price_high_low">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product Feed Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonProductCard key={i} />)
            ) : sortedProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-8">
                <Search className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-neutral-800 dark:text-slate-200">No items match your criteria</h3>
                <p className="text-neutral-400 text-xs mt-1 mb-4">Try clearing your category filter or search query.</p>
                <button 
                  onClick={() => { setSelectedCategory("All Categories"); setSearchTerm(""); }}
                  className="bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-emerald-500"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              sortedProducts.slice(0, visibleCount).map((product) => (
                <ProductGridItem 
                  key={product.id || product.title} 
                  product={product} 
                  triggerToast={triggerToast} 
                  onQuickBuy={setQuickBuyProduct}
                />
              ))
            )}
          </div>
          
          {visibleCount < sortedProducts.length && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 16)}
                className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 px-6 py-2.5 rounded-full text-xs font-extrabold shadow-xs active:scale-95 transition-all"
              >
                Load More Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
