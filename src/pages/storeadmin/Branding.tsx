import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Save } from 'lucide-react';
import { saveStoreSettings, StoreSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { ImageUploader } from '../../components/ImageUploader';

export function Branding() {
  const { storeSettings, updateStoreSettings } = useStoreConfig();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'My Store',
    storeIcon: '',
    primaryColor: '#006d2f',
    favicon: '',
    relatedSubtitle: 'Accompanying Pieces',
    relatedTitle: 'Complete Your Selection',
    relatedDescription: 'Recommended products that seamlessly blend with this item.',
    websiteFont: 'Plus Jakarta Sans',
    showStoreName: true,
    storeDescription: '',
    logoSize: 120
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      document.documentElement.style.setProperty('--color-primary-container', settings.primaryColor + '30');
    }
  }, [settings.primaryColor]);

  useEffect(() => {
    if (settings.websiteFont) {
      
    }
  }, [settings.websiteFont]);

  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      document.documentElement.style.setProperty('--color-primary-container', settings.primaryColor + '30');
    }
  }, [settings.primaryColor]);

  useEffect(() => {
    if (settings.websiteFont) {
      document.documentElement.style.setProperty('--font-sans', `"${settings.websiteFont}", "Plus Jakarta Sans", "Inter", sans-serif`);
    }
  }, [settings.websiteFont]);

  useEffect(() => {
    setSettings(storeSettings);
    setLoading(false);
  }, [storeSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveStoreSettings(settings);
      updateStoreSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Site Branding</h1>
        <p className="text-gray-500">Edit your storefront's name, logo, favicon, and colors.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 max-w-4xl">
        {loading ? (
          <p className="text-gray-500">Loading settings...</p>
        ) : (
          <form className="space-y-6 w-full" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Store Name</label>
              <input 
                type="text" 
                value={settings.storeName} 
                onChange={e => setSettings(prev => ({...prev, storeName: e.target.value}))}
                className="w-full border-2 border-outline-variant rounded-xl bg-surface-container-low px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Store Footer Description</label>
              <p className="text-xs text-on-surface-variant mb-2">Short paragraph displayed in the footer of your storefront.</p>
              <textarea 
                value={settings.storeDescription || ''}
                onChange={e => setSettings(prev => ({...prev, storeDescription: e.target.value}))}
                className="w-full border-2 border-outline-variant rounded-xl bg-surface-container-low px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Curating exceptional creations of uncompromising premium quality..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ImageUploader 
                  label="Site Logo" 
                  value={settings.storeIcon || ''} 
                  onChange={val => setSettings(prev => ({...prev, storeIcon: val}))} 
                />
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Logo Width (pixels)</label>
                  <p className="text-[10px] text-gray-500 mb-2">Drag slider to resize your store logo on the website.</p>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="30" 
                      max="300" 
                      step="5"
                      value={settings.logoSize || 120} 
                      onChange={e => setSettings(prev => ({...prev, logoSize: Number(e.target.value)}))}
                      className="flex-1 accent-primary cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none" 
                    />
                    <span className="text-xs font-mono font-bold text-gray-700 w-12 text-right">{settings.logoSize || 120}px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploader 
                  label="Site Icon Favicon" 
                  value={settings.favicon || ''} 
                  onChange={val => setSettings(prev => ({...prev, favicon: val}))} 
                />
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.showStoreName !== false} 
                      onChange={e => setSettings(prev => ({...prev, showStoreName: e.target.checked}))}
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 accent-primary" 
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-900">Show Store Name in Header</span>
                      <span className="block text-[10px] text-gray-500">Show the text store name alongside or next to your logo. Uncheck to only show logo.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Primary Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={settings.primaryColor} 
                  onChange={e => setSettings(prev => ({...prev, primaryColor: e.target.value}))}
                  className="w-12 h-12 p-1 rounded cursor-pointer border border-gray-200" 
                />
                <span className="text-sm font-mono text-gray-600">{settings.primaryColor}</span>
              </div>
            </div>

            {/* Website Typography (Font option) */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-700 text-lg">format_size</span>
                  Website Typography (Font Family)
                </h3>
                <p className="text-xs text-gray-500">Choose the typography style to apply across the store layout.</p>
              </div>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Select Font</label>
                <select
                  value={settings.websiteFont || 'Plus Jakarta Sans'}
                  onChange={e => setSettings(prev => ({...prev, websiteFont: e.target.value}))}
                  className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium cursor-pointer"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern & Minimalist)</option>
                  <option value="Inter">Inter (Swiss & Highly Professional)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech & Brutalist Accents)</option>
                  <option value="Playfair Display">Playfair Display (Premium Serif Editorial)</option>
                  <option value="Montserrat">Montserrat (Geometric & Balanced)</option>
                  <option value="Lora">Lora (Contemporary Literary Serif)</option>
                  <option value="Fira Code">Fira Code (Developer/Technical Mono)</option>
                </select>
              </div>
            </div>

            {/* Promotional Banner Image */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-700 text-lg">ad_units</span>
                  Mid-Page Promotional Banner
                </h3>
                <p className="text-xs text-gray-500">Configure a promotional banner to display in the middle of your home page.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Banner Image (Optional)</label>
                <ImageUploader 
                  value={settings.promotionalBannerImage || ''} 
                  onChange={val => setSettings(prev => ({...prev, promotionalBannerImage: val}))} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Banner Click Link (Optional)</label>
                <input 
                  type="text" 
                  value={settings.promotionalBannerLink || ''} 
                  onChange={e => setSettings(prev => ({...prev, promotionalBannerLink: e.target.value}))}
                  placeholder="e.g. /category/electronics"
                  className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium" 
                />
              </div>
            </div>

            {/* Related/Accompanying Products Text Configurations */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-700 text-lg">edit_note</span>
                  Related Products Customization
                </h3>
                <p className="text-xs text-gray-500">Configure custom labels and call-to-actions displayed below the product description for accompanying items.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Section Subtitle</label>
                  <input 
                    type="text" 
                    value={settings.relatedSubtitle || ''} 
                    onChange={e => setSettings(prev => ({...prev, relatedSubtitle: e.target.value}))}
                    placeholder="e.g. Accompanying Pieces"
                    className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Section Main Title</label>
                  <input 
                    type="text" 
                    value={settings.relatedTitle || ''} 
                    onChange={e => setSettings(prev => ({...prev, relatedTitle: e.target.value}))}
                    placeholder="e.g. Complete Your Selection"
                    className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Section Description / Sub-headline</label>
                  <input 
                    type="text" 
                    value={settings.relatedDescription || ''} 
                    onChange={e => setSettings(prev => ({...prev, relatedDescription: e.target.value}))}
                    placeholder="e.g. Recommended products that seamlessly blend with this item."
                    className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-medium" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-primary btn-md"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Publish Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
