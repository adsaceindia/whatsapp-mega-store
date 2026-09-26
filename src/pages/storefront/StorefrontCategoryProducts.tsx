import { useCart } from "../../context/CartContext";
import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getProducts, getDeterministicRating } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { getGeneralSettings, getSeoSettings, GeneralSettings, SeoSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { slugify } from '../../utils/slugify';
import { QuickBuyModal } from "../../components/storefront/QuickBuyModal";
import { SkeletonProductCard } from "../../components/storefront/Skeleton";
import { ProductGridItem } from "../../components/storefront/ProductGridItem";
import { Breadcrumbs } from "../../components/storefront/Breadcrumbs";
import { BlurImage } from "../../components/storefront/BlurImage";
import { trackViewItemList, trackSelectItem } from '../../utils/analytics';
import { InterestingLoader } from "../../components/storefront/InterestingLoader";

export function StorefrontCategoryProducts() {
  const { storeSettings } = useStoreConfig();

  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
    
    getSeoSettings().then(setSeoSettings).catch(console.error);
  }, []);

  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { addToCart, formatPrice, isInWishlist, toggleWishlist } = useCart();

  const formattedCategory = categoryId ? decodeURIComponent(categoryId) : 'Products';

  // Mock data for products in this category
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProds = await getProducts();
        const fetched = allProds.filter(p => (p.category || '').toLowerCase() === (formattedCategory || '').toLowerCase());
        setProducts(fetched.filter((p: any) => p.active !== false));
      } catch (error) {
        console.error("Error fetching category products:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchCategoryData = async () => {
      try {
        const cats = await getCategories();
        const cat = cats.find(c => c.name.toLowerCase() === (formattedCategory || '').toLowerCase());
        if (cat) {
          setCategoryData(cat);
        }
      } catch (e) {
        console.error("Error fetching category meta:", e);
      }
    };
    fetchProducts();
    fetchCategoryData();
  }, [formattedCategory]);

  useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(products, `Category: ${formattedCategory}`);
    }
  }, [products.length, formattedCategory]);

  if (loading) {
    return (
      <div className="w-full max-w-container-max mx-auto flex">
        <main className="flex-1 p-4 md:p-8 pb-24 overflow-hidden">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-neutral-200 animate-pulse rounded-full" />
            <div>
              <div className="w-48 h-8 bg-neutral-200 animate-pulse rounded-md mb-2" />
              <div className="w-32 h-4 bg-neutral-200 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }
  const breadcrumbSegments = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Categories', path: '/categories' },
    { label: formattedCategory }
  ];

  // Dynamic template formatter for categories
  const formatCategoryTemplate = (template: string, catName: string) => {
    if (!template) return '';
    const currentStoreName = storeSettings?.storeName || 'My Store';
    return template
      .replace(/\[category_name\]/gi, catName)
      .replace(/\[store_name\]/gi, currentStoreName);
  };

  const pageTitle = categoryData?.seoTitle 
    ? categoryData.seoTitle 
    : (seoSettings?.categoryTitleTemplate 
        ? formatCategoryTemplate(seoSettings.categoryTitleTemplate, formattedCategory) 
        : `Shop ${formattedCategory} | ${storeSettings?.storeName || 'My Store'}`);

  const pageDescription = categoryData?.seoDescription 
    ? categoryData.seoDescription 
    : (seoSettings?.categoryDescriptionTemplate 
        ? formatCategoryTemplate(seoSettings.categoryDescriptionTemplate, formattedCategory) 
        : `Explore our collection of ${formattedCategory} products at ${storeSettings?.storeName || 'My Store'}`);

  const pageKeywords = categoryData?.seoKeywords 
    ? categoryData.seoKeywords 
    : (seoSettings?.keywords || 'ecommerce, whatsapp shop, online store');

  if (loading) {
    return <InterestingLoader message={`Loading ${formattedCategory}...`} fullScreen />;
  }

  return (
    <div className="w-full max-w-container-max mx-auto flex">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      <main className="flex-1 p-2 md:p-8 pb-24 overflow-hidden">
        <Breadcrumbs segments={breadcrumbSegments} idPrefix="category-products-breadcrumbs" />

        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors flex items-center justify-center" title="Back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-on-surface mb-0.5">{formattedCategory}</h1>
            <p className="text-xs md:text-base text-on-surface-variant max-w-[400px]">{products.length} Products Found</p>
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-10">
          {products.map((product) => (
            <ProductGridItem key={product.id || product.title} product={product} triggerToast={triggerToast} />
          ))}
        </section>
      </main>

      {/* Slide-in toast confirmation banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Quick Buy Modal rendering */}
      <QuickBuyModal 
        isOpen={!!quickBuyProduct} 
        onClose={() => setQuickBuyProduct(null)} 
        product={quickBuyProduct} 
      />
    </div>
  );
}
