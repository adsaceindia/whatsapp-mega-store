import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { getPageSettings, PageSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';

type TabType = 'about' | 'shipping' | 'terms';

export function InfoPages() {
  const { storeSettings } = useStoreConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = (searchParams.get('tab') || 'about') as TabType;

  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('WhatsApp Boutique');
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    aboutUs: '',
    shippingPolicy: '',
    termsOfService: ''
  });

  useEffect(() => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load store name
    

    // Load pages data
    getPageSettings().then(data => {
      setPageSettings(data);
    }).catch(console.error).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const tabsConfig = [
    { key: 'about', label: 'About Us', icon: 'storefront', title: `About ${storeName}` },
    { key: 'shipping', label: 'Shipping Policy', icon: 'local_shipping', title: 'Shipping & Dispatches' },
    { key: 'terms', label: 'Terms of Service', icon: 'gavel', title: 'Terms of Service' },
  ];

  const getActiveContent = () => {
    switch (activeTabParam) {
      case 'about':
        return pageSettings.aboutUs;
      case 'shipping':
        return pageSettings.shippingPolicy;
      case 'terms':
        return pageSettings.termsOfService;
      default:
        return pageSettings.aboutUs;
    }
  };

  return (
    <div className="w-full min-h-screen bg-background py-8 md:py-16 pb-24 px-4 text-left">
      <div className="max-w-4xl mx-auto">
        
        {/* Back navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-wider transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Boutique
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sub-navigation Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <div className="hidden md:block pb-4 mb-2 border-b border-outline-variant/10">
              <h2 className="text-sm font-bold font-mono text-on-surface-variant uppercase tracking-widest">Boutique Info</h2>
            </div>
            <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1.5 pb-2 md:pb-0 scrollbar-none border-b border-outline-variant/10 md:border-b-0">
              {tabsConfig.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as TabType)}
                  className={`px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-shrink-0 cursor-pointer border
                    ${activeTabParam === tab.key 
                      ? 'bg-primary border-primary text-on-primary shadow-xs' 
                      : 'bg-surface hover:bg-neutral-50 dark:hover:bg-neutral-900 text-on-surface-variant border-transparent'}`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Display */}
          <div className="md:col-span-3">
            <div className="bg-surface border border-outline-variant/15 rounded-3xl p-6 md:p-10 shadow-sm min-h-[350px] relative overflow-hidden">
              
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="shimmer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="w-1/3 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                    <div className="space-y-3 pt-4">
                      <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                      <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                      <div className="w-5/6 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                      <div className="w-4/5 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTabParam}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="pb-4 border-b border-outline-variant/10">
                      <h1 className="text-2xl font-serif font-semibold text-on-surface">
                        {tabsConfig.find(t => t.key === activeTabParam)?.title}
                      </h1>
                    </div>
                    
                    <div className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line font-medium space-y-4">
                      {getActiveContent() || (
                        <p className="text-xs italic text-on-surface-variant/65">
                          Information is currently being curated by the boutique curator. Please check back shortly.
                        </p>
                      )}
                    </div>

                    {/* Support note */}
                    <div className="pt-8 border-t border-dashed border-outline-variant/20 mt-12 flex items-center gap-3 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 rounded-2xl">
                      <span className="material-symbols-outlined text-primary text-xl">contact_support</span>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                        Have queries or need further clarifications regarding our policies? Please reach out to boutique support directly via our WhatsApp channels.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
