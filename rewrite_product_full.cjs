const fs = require('fs');
const code = `import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { Link, useNavigate, useParams } from 'react-router';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { getGeneralSettings, getSeoSettings, GeneralSettings, SeoSettings } from '../../services/settingsService';
import { db } from '../../firebase';
import { useCart } from '../../context/CartContext';
import { getDeterministicRating } from '../../services/productService';
import { QuickBuyModal } from "../../components/storefront/QuickBuyModal";
import { SkeletonProductDetail } from "../../components/storefront/Skeleton";

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
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [frequentlyBoughtTogether, setFrequentlyBoughtTogether] = useState<any[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

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
        
        const qSnap = await getDocs(collection(db, 'products'));
        for (const doc of qSnap.docs) {
          const data = doc.data();
          const cleanTitle = (data.title || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (cleanTitle === id || doc.id === id) {
            foundProduct = { ...data, id: doc.id };
            pId = doc.id;
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
        if (foundProduct.reviews) {
          setReviewsList(foundProduct.reviews.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
        }
        if (foundProduct.colors && foundProduct.colors.length > 0) setSelectedColor(foundProduct.colors[0]);
        if (foundProduct.sizes && foundProduct.sizes.length > 0) setSelectedSize(foundProduct.sizes[0]);
        
        const bundles = [];
        for (const d of qSnap.docs) {
          if (d.id !== pId) {
            bundles.push({ ...d.data(), id: d.id });
          }
        }
        setFrequentlyBoughtTogether(bundles.slice(0, 3));
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center max-w-md w-full">
          <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">shopping_bag</span>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Product Not Found</h2>
          <p className="text-neutral-500 text-sm mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/categories')}
            className="w-full bg-primary text-white font-medium py-2.5 rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = product.seoTitle || product.title;
  const pageDescription = product.seoDescription || product.description;
  const ogTitleVal = product?.ogTitle ? product.ogTitle : pageTitle;
  const ogDescVal = product?.ogDescription ? product.ogDescription : pageDescription;
  const ogImgVal = product?.ogImage ? product.ogImage : (product?.image || '');

  return (
    <main className="w-full bg-neutral-50 min-h-screen py-4 md:py-8 text-left">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={ogTitleVal} />
        <meta property="og:description" content={ogDescVal} />
        <meta property="og:image" content={ogImgVal} />
        <meta property="og:type" content="product" />
      </Helmet>

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-md shadow-2xl flex items-center gap-2 z-50 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          {toastMessage}
        </div>
      )}

      {quickBuyProduct && (
        <QuickBuyModal 
          isOpen={!!quickBuyProduct} 
          onClose={() => setQuickBuyProduct(null)} 
          product={quickBuyProduct} 
        />
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-4 text-sm text-neutral-500 font-medium flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/categories" state={{ category: product.category }} className="hover:text-primary">
            {product.category || 'Shop'}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-neutral-900">{product.title}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-4 md:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col gap-4">
              <div className="relative aspect-square bg-neutral-50 rounded-lg overflow-hidden border border-neutral-100 flex items-center justify-center">
                <ResponsiveImage 
                  src={activeImg || product.image} 
                  alt={product.title} 
                  className="w-full h-full object-contain"
                />
                {product.sale && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[12px] font-bold px-3 py-1 rounded uppercase tracking-wide">
                    SALE
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const success = toggleWishlist(product);
                    if (success) {
                      triggerToast(isInWishlist(product.id) ? \`Removed "\${product.title}" from wishlist.\` : \`Saved "\${product.title}" to wishlist!\`);
                    }
                  }}
                  className={\`absolute top-4 right-4 p-2.5 rounded-full bg-white shadow-md transition-all active:scale-95 \${isInWishlist(product.id) ? 'text-primary' : 'text-neutral-400 hover:text-primary'}\`}
                >
                  <span className="material-symbols-outlined text-[20px] block" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                </button>
              </div>
              
              {(product.gallery && product.gallery.length > 0) && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  <button 
                    onClick={() => setActiveImg(product.image)}
                    className={\`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 bg-neutral-50 \${(activeImg || product.image) === product.image ? 'border-primary' : 'border-neutral-200'}\`}
                  >
                    <ResponsiveImage src={product.image} alt="Main" className="w-full h-full object-contain p-1" />
                  </button>
                  {product.gallery.map((img: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImg(img)}
                      className={\`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 bg-neutral-50 \${activeImg === img ? 'border-primary' : 'border-neutral-200'}\`}
                    >
                      <ResponsiveImage src={img} alt={\`Gallery \${idx}\`} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 md:p-10 flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight mb-2">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                {(() => {
                  const { rating, count } = getDeterministicRating(product.id || '', product.title || '');
                  const displayRating = product.ratingValue || rating;
                  const displayCount = product.ratingCount || count;
                  return (
                    <div className="flex items-center gap-1">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="material-symbols-outlined text-[16px] font-bold select-none" style={{ fontVariationSettings: '"FILL" 1' }}>
                            {displayRating >= star ? 'star' : (displayRating >= star - 0.5 ? 'star_half' : 'star')}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-neutral-700 ml-1">{displayRating.toFixed(1)}</span>
                      <a href="#reviews" onClick={() => setActiveTab('reviews')} className="text-sm text-primary hover:underline ml-1">
                        ({displayCount} reviews)
                      </a>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-bold text-neutral-900">
                  {formatPrice(getCurrentPrice())}
                </span>
                {product.originalPrice && product.originalPrice > getCurrentPrice() && (
                  <>
                    <span className="text-lg text-neutral-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      -{Math.round(((product.originalPrice - getCurrentPrice()) / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-neutral-600 text-sm md:text-base leading-relaxed mb-8 border-b border-neutral-100 pb-8">
                {product.description}
              </p>

              <div className="flex flex-col gap-6 mb-8">
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-neutral-900">Color</span>
                      <span className="text-sm font-medium text-neutral-500">{selectedColor || 'Select a color'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color: string) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={\`px-4 py-2 text-sm font-medium rounded-md border transition-all \${selectedColor === color ? 'border-primary bg-primary/5 text-primary' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}\`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-neutral-900">Size</span>
                      <span className="text-sm font-medium text-neutral-500">{selectedSize || 'Select a size'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={\`min-w-[48px] h-10 px-3 text-sm font-medium rounded-md border transition-all \${selectedSize === size ? 'border-primary bg-primary text-white' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}\`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm font-bold text-neutral-900 mb-2 block">Quantity</span>
                  <div className="flex items-center w-32 border border-neutral-200 rounded-md bg-white overflow-hidden">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <div className="flex-1 h-10 flex items-center justify-center text-sm font-bold text-neutral-900 border-x border-neutral-200">
                      {quantity}
                    </div>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  onClick={() => {
                    addToCart({ 
                      productId: product.id, 
                      title: product.title, 
                      price: getCurrentPrice(), 
                      image: activeImg || product.image, 
                      quantity: quantity, 
                      size: selectedSize, 
                      color: selectedColor 
                    });
                    triggerToast(\`Added \${quantity}x "\${product.title}" to cart!\`);
                  }}
                  className="w-full bg-primary text-white font-bold py-4 rounded-md text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  Add to Cart
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (!shareCopied) {
                        navigator.clipboard.writeText(window.location.href);
                        setShareCopied(true);
                        triggerToast("Link copied to clipboard!");
                        setTimeout(() => setShareCopied(false), 2000);
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium py-3 rounded-md text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">{shareCopied ? 'check' : 'share'}</span>
                    Share
                  </button>
                  {settings?.supportWhatsapp && (
                    <a 
                      href={\`https://wa.me/\${settings.supportWhatsapp}?text=\${encodeURIComponent(\`Hi, I'm interested in "\${product.title}". Link: \${window.location.href}\`)}\`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-medium py-3 rounded-md text-sm transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="reviews" className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-8">
          <div className="flex border-b border-neutral-200 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('description')}
              className={\`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 \${activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}\`}
            >
              Description
            </button>
            <button 
              onClick={() => setActiveTab('features')}
              className={\`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 \${activeTab === 'features' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}\`}
            >
              Features & Specs
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={\`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 \${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}\`}
            >
              Reviews ({reviewsList.length + (product.ratingCount || getDeterministicRating(product.id || '', product.title || '').count)})
            </button>
          </div>
          
          <div className="p-6 md:p-10">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-neutral-600 text-sm md:text-base leading-relaxed">
                <p className="whitespace-pre-wrap">{product.description}</p>
                {product.category && (
                  <p className="mt-6 text-sm font-medium text-neutral-900">
                    Category: <span className="text-neutral-600 font-normal">{product.category}</span>
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'features' && (
              <div className="text-neutral-600 text-sm md:text-base leading-relaxed">
                {product.features && product.features.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {product.features.map((feature: string, idx: number) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Detailed specifications are not available for this item.</p>
                )}
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-7">
                  <h3 className="text-xl font-bold text-neutral-900 mb-6">Customer Reviews</h3>
                  {reviewsList.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
                      <span className="material-symbols-outlined text-3xl text-neutral-300 mb-2">reviews</span>
                      <p className="text-neutral-500 text-sm">No reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviewsList.map((review, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-neutral-900">{review.name}</span>
                                {review.verified && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    Verified Buyer
                                  </span>
                                )}
                              </div>
                              <div className="flex text-amber-500">
                                {[1,2,3,4,5].map(star => (
                                  <span key={star} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: review.rating >= star ? '"FILL" 1' : '"FILL" 0' }}>star</span>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-neutral-400 font-medium">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {frequentlyBoughtTogether.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Frequently Bought Together</h2>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="flex flex-wrap items-center justify-center gap-4 flex-1">
                  <div className="flex flex-col items-center max-w-[120px]">
                    <div className="w-24 h-24 bg-neutral-50 rounded-md border border-neutral-200 p-2 mb-2">
                      <ResponsiveImage src={product.image} alt={product.title} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-medium text-neutral-800 text-center line-clamp-2">This item</span>
                    <span className="text-sm font-bold text-neutral-900 mt-1">{formatPrice(product.price)}</span>
                  </div>
                  
                  {frequentlyBoughtTogether.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <span className="material-symbols-outlined text-neutral-300 text-2xl">add</span>
                      <div 
                        className={\`flex flex-col items-center max-w-[120px] cursor-pointer transition-all \${selectedBundleIds.includes(item.id) ? 'opacity-100' : 'opacity-50 grayscale'}\`}
                        onClick={() => {
                          if (selectedBundleIds.includes(item.id)) {
                            setSelectedBundleIds(prev => prev.filter(id => id !== item.id));
                          } else {
                            setSelectedBundleIds(prev => [...prev, item.id]);
                          }
                        }}
                      >
                        <div className={\`w-24 h-24 bg-neutral-50 rounded-md border p-2 mb-2 \${selectedBundleIds.includes(item.id) ? 'border-primary' : 'border-neutral-200'}\`}>
                          <ResponsiveImage src={item.image} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-medium text-neutral-800 text-center line-clamp-2 hover:text-primary">{item.title}</span>
                        <span className="text-sm font-bold text-neutral-900 mt-1">{formatPrice(item.price)}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 min-w-[250px] flex flex-col items-center md:items-start text-center md:text-left">
                  <span className="text-sm font-medium text-neutral-600 mb-1">Total Price</span>
                  <span className="text-3xl font-bold text-neutral-900 mb-4">
                    {formatPrice(
                      product.price + 
                      frequentlyBoughtTogether
                        .filter(item => selectedBundleIds.includes(item.id))
                        .reduce((sum, item) => sum + item.price, 0)
                    )}
                  </span>
                  <button 
                    onClick={() => {
                      addToCart({ productId: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 });
                      frequentlyBoughtTogether
                        .filter(item => selectedBundleIds.includes(item.id))
                        .forEach(item => {
                          addToCart({ productId: item.id, title: item.title, price: item.price, image: item.image, quantity: 1 });
                        });
                      triggerToast("Bundle added to cart!");
                    }}
                    className="w-full bg-primary text-white font-bold py-3 rounded-md text-sm hover:bg-primary/90 transition-colors"
                  >
                    Add Selected to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
`;

fs.writeFileSync('src/pages/storefront/StorefrontProduct.tsx', code);
