import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { useNavigate, useLocation } from 'react-router';
import { useCart } from '../../context/CartContext';
import { getProducts, getDeterministicRating } from '../../services/productService';
import { getOrders } from '../../services/orderService';
import { getCategories, Category } from '../../services/categoryService';
import { QuickBuyModal } from '../../components/storefront/QuickBuyModal';
import { SkeletonProductCard } from '../../components/storefront/Skeleton';
import { InterestingLoader } from '../../components/storefront/InterestingLoader';
import { ProductGridItem } from '../../components/storefront/ProductGridItem';


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
    <div className="min-h-screen bg-neutral-50 pt-4 pb-16">
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-md shadow-2xl flex items-center gap-2 z-50 animate-fade-in text-xs md:text-sm font-medium">
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
          <div className="bg-white rounded-lg border border-neutral-200 p-3 md:p-4 sticky top-20">
            <h3 className="font-bold text-neutral-800 mb-2 md:mb-4 text-base md:text-lg">Categories</h3>
            <ul className="space-y-2">
              {allCategoryPillNames.map(cat => (
                <li key={cat}>
                  <button 
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-xs md:text-sm py-1 md:py-1.5 ${selectedCategory === cat ? 'font-bold text-primary' : 'text-neutral-600 hover:text-primary'}`}
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
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors border ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-700 border-neutral-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Top Bar: Search & Sort */}
          <div className="bg-white rounded-lg border border-neutral-200 p-3 md:p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-xs md:text-sm font-medium text-neutral-700 whitespace-nowrap">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-sm rounded-md px-2 py-1.5 md:px-3 md:py-2 w-full sm:w-auto outline-none focus:border-primary"
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
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-neutral-800">No products found</h3>
                <p className="text-neutral-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                <button 
                  onClick={() => { setSelectedCategory("All Categories"); setSearchTerm(""); }}
                  className="btn btn-primary btn-md mt-4"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              sortedProducts.slice(0, visibleCount).map((product) => (
                <ProductGridItem key={product.id || product.title} product={product} triggerToast={triggerToast} />
              ))
            )}
          </div>
          
          {visibleCount < sortedProducts.length && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="btn btn-secondary btn-lg"
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
