import React, { useState, useEffect } from 'react';
import { Save, Search, Settings, FileText, Folder, Globe, AlertCircle, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { getSeoSettings, saveSeoSettings, SeoSettings } from '../../services/settingsService';
import { getProducts, updateProduct, Product } from '../../services/productService';
import { getCategories, updateCategory, Category } from '../../services/categoryService';
import { slugify } from '../../utils/slugify';

type TabType = 'global' | 'products' | 'categories';

export function Seo() {
  const [activeTab, setActiveTab] = useState<TabType>('global');
  
  // Settings State
  const [settings, setSettings] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    productTitleTemplate: '',
    productDescriptionTemplate: '',
    categoryTitleTemplate: '',
    categoryDescriptionTemplate: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Products & Categories State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Active Edit Forms (Product SEO / OG)
  const [prodForm, setProdForm] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: ''
  });

  // Active Edit Forms (Category SEO)
  const [catForm, setCatForm] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
  });

  const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 4000);
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const seoData = await getSeoSettings();
        setSettings(seoData);

        const prods = await getProducts();
        setProducts(prods);

        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error loading SEO panel data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSeoSettings(settings);
      showNotif('Global SEO patterns and metadata saved successfully!');
    } catch (error) {
      console.error("Error saving global SEO:", error);
      showNotif('Failed to save global SEO configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectProductToEdit = (prod: Product) => {
    setSelectedProduct(prod);
    setProdForm({
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
      seoKeywords: prod.seoKeywords || '',
      ogTitle: prod.ogTitle || '',
      ogDescription: prod.ogDescription || '',
      ogImage: prod.ogImage || ''
    });
  };

  const selectCategoryToEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setCatForm({
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || '',
      seoKeywords: cat.seoKeywords || ''
    });
  };

  const handleSaveProductSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedProduct.id) return;
    setSaving(true);
    try {
      await updateProduct(selectedProduct.id, prodForm);
      // Update local products list
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, ...prodForm } : p));
      setSelectedProduct(prev => prev ? { ...prev, ...prodForm } : null);
      showNotif(`SEO config for "${selectedProduct.title}" updated successfully!`);
    } catch (error) {
      console.error("Error saving product SEO:", error);
      showNotif('Failed to update product SEO configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategorySeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedCategory.id) return;
    setSaving(true);
    try {
      await updateCategory(selectedCategory.id, catForm);
      // Update local categories list
      setCategories(prev => prev.map(c => c.id === selectedCategory.id ? { ...c, ...catForm } : c));
      setSelectedCategory(prev => prev ? { ...prev, ...catForm } : null);
      showNotif(`SEO config for "${selectedCategory.name}" updated successfully!`);
    } catch (error) {
      console.error("Error saving category SEO:", error);
      showNotif('Failed to update category SEO configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Notifications bar */}
      {notif && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-lg flex items-center gap-3 transition-all animate-bounce ${
          notif.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold">{notif.message}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">SEO & Social Sharing Management</h1>
          <p className="text-gray-500 text-sm">Optimize your store indexing, custom category/product schema, sitemaps, and Open Graph share previews.</p>
        </div>
        
        {/* Dynamic Sitemap quick link */}
        <a 
          href="/sitemap.xml" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-200 transition-colors"
        >
          <Globe size={14} className="text-primary" />
          <span>View Dynamic Sitemap.xml</span>
          <ExternalLink size={12} className="opacity-60" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6 gap-2">
        <button 
          onClick={() => { setActiveTab('global'); setSelectedProduct(null); setSelectedCategory(null); }}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
            activeTab === 'global' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings size={16} />
          <span>Global Settings & Templates</span>
        </button>
        <button 
          onClick={() => { setActiveTab('products'); setSelectedCategory(null); }}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
            activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText size={16} />
          <span>Product Page Overrides & OG Tags</span>
        </button>
        <button 
          onClick={() => { setActiveTab('categories'); setSelectedProduct(null); }}
          className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 -mb-[2px] ${
            activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Folder size={16} />
          <span>Category Page Overrides</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">Loading search configurations...</p>
        </div>
      ) : (
        <div className="w-full">
          {/* TAB 1: GLOBAL & DYNAMIC TEMPLATES */}
          {activeTab === 'global' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <form onSubmit={handleSaveGlobal} className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe size={18} className="text-primary" />
                      <span>Fallback Meta Details</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Global Meta Title</label>
                        <input 
                          type="text" 
                          value={settings.metaTitle} 
                          onChange={(e) => setSettings({...settings, metaTitle: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                          placeholder="My Beautiful Craft Store"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Global Meta Description</label>
                        <textarea 
                          rows={3} 
                          value={settings.metaDescription} 
                          onChange={(e) => setSettings({...settings, metaDescription: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                          placeholder="Buy fine handcrafted items direct with real-time tracking..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Global SEO Keywords</label>
                        <input 
                          type="text" 
                          value={settings.keywords} 
                          onChange={(e) => setSettings({...settings, keywords: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                          placeholder="handcrafts, bespoke bags, premium pottery"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Dynamic Templates configuration */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Settings size={18} className="text-primary" />
                      <span>Dynamic Meta Rule Templates</span>
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Set default rules for pages that do not have custom overrides defined.</p>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <h4 className="text-xs font-bold text-primary mb-3">Product Detail Pages</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Title Template</label>
                            <input 
                              type="text" 
                              value={settings.productTitleTemplate || ''} 
                              onChange={(e) => setSettings({...settings, productTitleTemplate: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Description Template</label>
                            <input 
                              type="text" 
                              value={settings.productDescriptionTemplate || ''} 
                              onChange={(e) => setSettings({...settings, productDescriptionTemplate: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                        <h4 className="text-xs font-bold text-gray-800 mb-3">Category Landing Pages</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Title Template</label>
                            <input 
                              type="text" 
                              value={settings.categoryTitleTemplate || ''} 
                              onChange={(e) => setSettings({...settings, categoryTitleTemplate: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Description Template</label>
                            <input 
                              type="text" 
                              value={settings.categoryDescriptionTemplate || ''} 
                              onChange={(e) => setSettings({...settings, categoryDescriptionTemplate: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary btn-md"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Global SEO Settings'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sidebar Guide */}
              <div className="space-y-6">
                <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-500" />
                    <span>Dynamic Template Tags</span>
                  </h4>
                  <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                    You can inject real-time variables dynamically into your SEO rules by surrounding variables in square brackets:
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex flex-col gap-0.5 border-b border-neutral-200/50 pb-2">
                      <span className="font-mono text-xs font-bold text-primary">[product_name]</span>
                      <span className="text-xs text-neutral-500">The primary title of the item</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-b border-neutral-200/50 pb-2">
                      <span className="font-mono text-xs font-bold text-primary">[category]</span>
                      <span className="text-xs text-neutral-500">The item's catalog category classification</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-b border-neutral-200/50 pb-2">
                      <span className="font-mono text-xs font-bold text-primary">[price]</span>
                      <span className="text-xs text-neutral-500">Formatted price tag (e.g. $49.00)</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-b border-neutral-200/50 pb-2">
                      <span className="font-mono text-xs font-bold text-primary">[store_name]</span>
                      <span className="text-xs text-neutral-500">The configured store branding name</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-bold text-primary">[category_name]</span>
                      <span className="text-xs text-neutral-500">Title of the category landing page (For Categories template)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Search Engine Crawlers</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                    Your dynamic sitemap is automatically refreshed whenever products or collections are edited or added, serving instant feeds directly to search bots.
                  </p>
                  <p className="text-xs font-semibold text-neutral-700">Recommended action:</p>
                  <p className="text-[11px] text-neutral-500 leading-normal">Submit your sitemap link to Google Search Console or Bing Webmaster Tools to accelerate item indexing.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT SPECIFIC CONFIG & OG SOCIAL SHARING */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Product list */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col h-[650px]">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-gray-50/50"
                  />
                </div>

                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id || p.title}
                      onClick={() => selectProductToEdit(p)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        selectedProduct?.id === p.id 
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' 
                          : 'border-gray-100 hover:bg-neutral-50'
                      }`}
                    >
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="w-10 h-10 object-contain bg-gray-50 border border-gray-200/50 rounded-lg" 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.title}</p>
                        <p className="text-[10px] text-primary font-medium tracking-wide">{p.category}</p>
                      </div>
                      {(p.seoTitle || p.ogTitle) && (
                        <div className="w-2 h-2 rounded-full bg-primary" title="SEO custom configuration exists" />
                      )}
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-12">No products found</p>
                  )}
                </div>
              </div>

              {/* Product SEO editing screen */}
              <div className="lg:col-span-8 space-y-6">
                {!selectedProduct ? (
                  <div className="bg-neutral-50 rounded-xl border border-neutral-200 border-dashed h-[650px] flex flex-col items-center justify-center text-center p-8">
                    <div className="material-symbols-outlined text-4xl text-neutral-400 mb-3">shopping_bag</div>
                    <h3 className="text-sm font-bold text-neutral-800">No Product Selected</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1">Select an item from the list to define specialized meta tags and customize its social sharing card layout.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[650px] overflow-y-auto pr-1">
                    {/* SEO Editing form */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
                      <div className="border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <img 
                            src={selectedProduct.image} 
                            alt="" 
                            className="w-8 h-8 object-contain bg-gray-100 border border-gray-200/50 rounded-md" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Configure Specific SEO</h3>
                            <p className="text-xs text-gray-500 font-serif line-clamp-1">{selectedProduct.title}</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSaveProductSeo} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Custom SEO Title Override</label>
                          <input 
                            type="text" 
                            value={prodForm.seoTitle} 
                            onChange={(e) => setProdForm({...prodForm, seoTitle: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                            placeholder="Defaults to rule template if empty"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Custom SEO Description Override</label>
                          <textarea 
                            rows={3} 
                            value={prodForm.seoDescription} 
                            onChange={(e) => setProdForm({...prodForm, seoDescription: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                            placeholder="Defaults to rule template if empty"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Custom Keywords</label>
                          <input 
                            type="text" 
                            value={prodForm.seoKeywords} 
                            onChange={(e) => setProdForm({...prodForm, seoKeywords: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                            placeholder="Comma separated"
                          />
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Share2 size={14} className="text-primary" />
                            <span>Social Open Graph Tags</span>
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">OG Share Title</label>
                              <input 
                                type="text" 
                                value={prodForm.ogTitle} 
                                onChange={(e) => setProdForm({...prodForm, ogTitle: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                                placeholder="Defaults to SEO Title"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">OG Share Description</label>
                              <textarea 
                                rows={2} 
                                value={prodForm.ogDescription} 
                                onChange={(e) => setProdForm({...prodForm, ogDescription: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                                placeholder="Defaults to SEO Description"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">OG Share Image URL</label>
                              <input 
                                type="text" 
                                value={prodForm.ogImage} 
                                onChange={(e) => setProdForm({...prodForm, ogImage: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                                placeholder="Defaults to main product image URL"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="btn btn-primary btn-sm w-full"
                          >
                            <Save size={14} />
                            {saving ? 'Updating...' : 'Save Product SEO Overrides'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Previews panel */}
                    <div className="space-y-6">
                      {/* Search results Google simulation */}
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Google SERP Preview</h4>
                        <div className="font-sans">
                          <p className="text-[11px] text-gray-600 truncate">https://{window.location.host}/product/{slugify(selectedProduct.title)}</p>
                          <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer leading-tight mt-0.5 line-clamp-1">
                            {prodForm.seoTitle || `${selectedProduct.title} | ${settings.metaTitle || 'WhatsApp Store'}`}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 leading-normal line-clamp-2">
                            {prodForm.seoDescription || selectedProduct.description || 'Custom description override is not set. Google defaults to page summary details.'}
                          </p>
                        </div>
                      </div>

                      {/* Open Graph share preview card simulator */}
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Social Media OG Share Card</h4>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-neutral-50">
                          <div className="aspect-[1.91/1] w-full bg-white flex items-center justify-center overflow-hidden border-b border-gray-200">
                            <img 
                              src={prodForm.ogImage || selectedProduct.image} 
                              alt="Social preview" 
                              className="max-h-full max-w-full object-contain p-2"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="p-3.5 font-sans bg-white">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold truncate">{window.location.host}</p>
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mt-0.5">
                              {prodForm.ogTitle || prodForm.seoTitle || selectedProduct.title}
                            </h4>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                              {prodForm.ogDescription || prodForm.seoDescription || selectedProduct.description || 'Browse fine items at our checkout webstore today.'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 mt-3 italic">Simulating active visual summary layout on iMessage, Slack, Facebook and Twitter feeds.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY SPECIFIC CONFIG */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Category list */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col h-[550px]">
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {categories.map(c => (
                    <button
                      key={c.id || c.name}
                      onClick={() => selectCategoryToEdit(c)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        selectedCategory?.id === c.id 
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' 
                          : 'border-gray-100 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-10 h-10 object-cover bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {c.image ? (
                          <img src={c.image} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="material-symbols-outlined text-neutral-400">folder</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                      </div>
                      {(c.seoTitle || c.seoDescription) && (
                        <div className="w-2 h-2 rounded-full bg-primary" title="SEO override exists" />
                      )}
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-12">No categories found</p>
                  )}
                </div>
              </div>

              {/* Category SEO editing screen */}
              <div className="lg:col-span-8 space-y-6">
                {!selectedCategory ? (
                  <div className="bg-neutral-50 rounded-xl border border-neutral-200 border-dashed h-[550px] flex flex-col items-center justify-center text-center p-8">
                    <div className="material-symbols-outlined text-4xl text-neutral-400 mb-3">folder</div>
                    <h3 className="text-sm font-bold text-neutral-800">No Category Selected</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1">Select a category from the list to define specific meta tags for that selection landing page.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[550px] overflow-y-auto pr-1">
                    {/* SEO Editing form */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
                      <div className="border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-base">folder</span>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Category Page SEO</h3>
                            <p className="text-xs text-gray-500 font-serif line-clamp-1">{selectedCategory.name}</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSaveCategorySeo} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Custom SEO Title Override</label>
                          <input 
                            type="text" 
                            value={catForm.seoTitle} 
                            onChange={(e) => setCatForm({...catForm, seoTitle: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                            placeholder="Defaults to category template if empty"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Custom SEO Description Override</label>
                          <textarea 
                            rows={4} 
                            value={catForm.seoDescription} 
                            onChange={(e) => setCatForm({...catForm, seoDescription: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                            placeholder="Defaults to category template if empty"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Custom Keywords Override</label>
                          <input 
                            type="text" 
                            value={catForm.seoKeywords} 
                            onChange={(e) => setCatForm({...catForm, seoKeywords: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl bg-gray-50 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                            placeholder="Comma separated"
                          />
                        </div>

                        <div className="pt-2">
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="btn btn-primary btn-sm w-full"
                          >
                            <Save size={14} />
                            {saving ? 'Updating...' : 'Save Category SEO Overrides'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Previews panel */}
                    <div className="space-y-6">
                      {/* Search results Google simulation */}
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Google SERP Preview</h4>
                        <div className="font-sans">
                          <p className="text-[11px] text-gray-600 truncate">https://{window.location.host}/category/{encodeURIComponent(selectedCategory.name)}</p>
                          <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer leading-tight mt-0.5 line-clamp-1">
                            {catForm.seoTitle || `Shop ${selectedCategory.name} Collection | ${settings.metaTitle || 'WhatsApp Store'}`}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 leading-normal line-clamp-2">
                            {catForm.seoDescription || `Explore our extensive range of ${selectedCategory.name} products at the best prices on our digital storefront.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
