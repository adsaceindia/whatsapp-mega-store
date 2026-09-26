import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { Link, useNavigate, useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { getGeneralSettings, getSeoSettings, GeneralSettings, SeoSettings } from '../../services/settingsService';
import { useCart } from '../../context/CartContext';
import { getProducts, getDeterministicRating } from '../../services/productService';
import { QuickBuyModal } from "../../components/storefront/QuickBuyModal";
import { SkeletonProductDetail, SkeletonProductCard } from "../../components/storefront/Skeleton";
import { ProductGridItem } from "../../components/storefront/ProductGridItem";
import { Heart, Star, ShoppingBag, MessageSquare, Plus, Minus, ShieldCheck, Truck, RotateCcw, ChevronRight, CheckCircle } from 'lucide-react';

const formatDate = (dateValue: any) => {
  if (!dateValue) return '';
  let d: Date;
  if (dateValue instanceof Date) {
    d = dateValue;
  } else if (dateValue.seconds) {
    d = new Date(dateValue.seconds * 1000);
  } else {
    d = new Date(dateValue);
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export function StorefrontProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const { addToCart, formatPrice, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState("");
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
    getSeoSettings().then(setSeoSettings).catch(console.error);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    if (selectedSize && product.variantPrices?.[selectedSize] !== undefined) {
      return product.variantPrices[selectedSize];
    }
    if (selectedColor && product.variantPrices?.[selectedColor] !== undefined) {
      return product.variantPrices[selectedColor];
    }
    return product.price;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        if (!id) return;
        
        let foundProduct: any = null;
        let pId = "";
        
        const allProducts = await getProducts();
        for (const data of allProducts) {
          const cleanTitle = (data.title || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (cleanTitle === id || String(data.id) === id) {
            foundProduct = data;
            pId = String(data.id);
            break;
          }
        }
        
        if (!foundProduct) {
          setLoading(false);
          return;
        }
        
        if (typeof foundProduct.category === 'object' && foundProduct.category !== null) {
          foundProduct.category = foundProduct.category.name || 'Uncategorized';
        }
        
        setProduct(foundProduct);
        if (foundProduct.colors && foundProduct.colors.length > 0) setSelectedColor(foundProduct.colors[0]);
        if (foundProduct.sizes && foundProduct.sizes.length > 0) setSelectedSize(foundProduct.sizes[0]);
        
        const bundles = [];
        for (const d of allProducts) {
          if (String(d.id) !== pId) {
            bundles.push(d);
          }
        }
        setSuggestedProducts([...bundles].sort(() => 0.5 - Math.random()).slice(0, 4));
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <SkeletonProductDetail />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-md border border-neutral-200 dark:border-slate-800 text-center max-w-md w-full">
          <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Item Unavailable</h2>
          <p className="text-neutral-500 dark:text-slate-400 text-xs mb-6">The product you are looking for has been moved or updated.</p>
          <button 
            onClick={() => navigate('/categories')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
          >
            Explore Catalog
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = product.seoTitle || product.title;
  const pageDescription = product.seoDescription || product.description;
  const currentPrice = getCurrentPrice();
  const isWishlisted = isInWishlist(product.id);

  const { rating, count } = getDeterministicRating(product.id || '', product.title || '');
  const displayRating = product.ratingValue || rating;
  const displayCount = product.ratingCount || count;

  const galleryImages = [product.image, ...(product.gallery || [])].filter(Boolean);

  return (
    <main className="w-full bg-white dark:bg-slate-950 min-h-screen pb-24 md:pb-12 text-left">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce text-xs font-semibold border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Buy Modal Drawer */}
      {quickBuyProduct && (
        <QuickBuyModal 
          isOpen={!!quickBuyProduct} 
          onClose={() => setQuickBuyProduct(null)} 
          product={quickBuyProduct} 
        />
      )}

      <div className="w-full max-w-none px-3 md:px-8 lg:px-12 pt-2 md:pt-6">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-4 text-xs font-semibold text-neutral-400 flex items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <Link to="/categories" state={{ category: product.category }} className="hover:text-emerald-600 transition-colors">
            {product.category || 'Shop'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-800 dark:text-slate-200 truncate">{product.title}</span>
        </div>

        {/* Product Details Section Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-sm border border-neutral-200/70 dark:border-slate-800 overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Gallery Section */}
            <div className="lg:col-span-6 p-4 md:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200/60 dark:border-slate-800 flex flex-col gap-4">
              <div className="relative aspect-square bg-neutral-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-slate-700/50 flex items-center justify-center p-4">
                <ResponsiveImage 
                  src={activeImg || product.image} 
                  alt={product.title} 
                  className="w-full h-full object-contain"
                />
                
                {product.sale && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] md:text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                    SALE
                  </div>
                )}

                <button 
                  onClick={() => {
                    const success = toggleWishlist(product);
                    if (success) {
                      triggerToast(isWishlisted ? `Removed "${product.title}" from saved` : `Saved "${product.title}" to wishlist!`);
                    }
                  }}
                  className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-sm ${
                    isWishlisted 
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' 
                      : 'bg-white/80 text-neutral-400 hover:text-rose-500 dark:bg-slate-900/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
              
              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {galleryImages.map((img: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImg(img)}
                      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-neutral-50 dark:bg-slate-800 transition-all ${
                        (activeImg || product.image) === img ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-neutral-200 dark:border-slate-700'
                      }`}
                    >
                      <ResponsiveImage src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Variant Selection Area */}
            <div className="lg:col-span-6 p-5 md:p-10 flex flex-col justify-between">
              <div>
                <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full mb-2">
                  {product.category || 'General'}
                </span>

                <h1 className="text-lg md:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight mb-2">
                  {product.title}
                </h1>
                
                {/* Rating Breakdown */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{displayRating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">({displayCount} reviews)</span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6 bg-neutral-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-slate-800">
                  <span className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {formatPrice(currentPrice)}
                  </span>
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <span className="text-neutral-400 line-through text-xs md:text-sm font-medium">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      SAVE {Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Color Options */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Color Option
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color: string) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                            selectedColor === color 
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20' 
                              : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300'
                          }`}
                        >
                          {color.startsWith('#') && (
                            <span className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: color }} />
                          )}
                          <span>{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Options */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Size Selection
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`h-9 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center active:scale-95 ${
                            selectedSize === size 
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20' 
                              : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Incrementor */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3 bg-neutral-100 dark:bg-slate-800 w-max p-1 rounded-xl border border-neutral-200/60 dark:border-slate-700">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-200 font-bold active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm text-neutral-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(99, prev + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-200 font-bold active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden md:flex gap-3 mb-6">
                  <button 
                    onClick={() => {
                      addToCart({
                        productId: product.id,
                        title: product.title,
                        price: currentPrice,
                        image: product.image,
                        quantity,
                        size: selectedSize,
                        color: selectedColor
                      });
                      triggerToast(`Added ${quantity}x "${product.title}" to cart!`);
                    }}
                    className="flex-1 bg-neutral-900 dark:bg-slate-800 hover:bg-neutral-800 dark:hover:bg-slate-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>

                  <button 
                    onClick={() => setQuickBuyProduct(product)}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Quick WhatsApp Buy</span>
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-100 dark:border-slate-800 text-center">
                <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-50 dark:bg-slate-800/40">
                  <Truck className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-neutral-700 dark:text-slate-300">Fast Shipping</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-50 dark:bg-slate-800/40">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-neutral-700 dark:text-slate-300">Verified Seller</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-50 dark:bg-slate-800/40">
                  <RotateCcw className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-neutral-700 dark:text-slate-300">Instant Support</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Product Description Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-neutral-200/70 dark:border-slate-800 p-5 md:p-8 mb-8">
          <div className="flex border-b border-neutral-200 dark:border-slate-800 gap-6 mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all ${
                activeTab === 'description' 
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Product Description
            </button>
          </div>

          <div className="text-xs md:text-sm text-neutral-700 dark:text-slate-300 leading-relaxed space-y-4">
            <p className="whitespace-pre-line">{product.description || "High quality product crafted with attention to detail and premium materials."}</p>
          </div>
        </div>

        {/* Suggested Items Carousel */}
        {suggestedProducts.length > 0 && (
          <div className="mt-8 mb-12">
            <h2 className="text-base md:text-xl font-extrabold text-neutral-900 dark:text-white mb-4">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {suggestedProducts.map(item => (
                <ProductGridItem key={item.id} product={item} triggerToast={triggerToast} onQuickBuy={setQuickBuyProduct} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Mobile Sticky Bottom Purchase Action Bar (Native App Style) */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-slate-800 p-3 z-40 flex items-center gap-2.5 md:hidden shadow-2xl">
        <button
          onClick={() => {
            addToCart({
              productId: product.id,
              title: product.title,
              price: currentPrice,
              image: product.image,
              quantity,
              size: selectedSize,
              color: selectedColor
            });
            triggerToast(`Added to cart!`);
          }}
          className="flex-1 bg-neutral-900 dark:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add Bag</span>
        </button>

        <button
          onClick={() => setQuickBuyProduct(product)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Buy</span>
        </button>
      </div>
    </main>
  );
}
