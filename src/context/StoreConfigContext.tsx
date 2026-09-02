import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoreSettings, StoreSettings } from '../services/settingsService';

interface StoreConfigContextType {
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  isLoading: boolean;
}

const defaultSettings: StoreSettings = {
  storeName: 'My Store',
  storeIcon: '',
  primaryColor: '#006d2f',
  favicon: '',
  relatedSubtitle: 'Accompanying Pieces',
  relatedTitle: 'Complete Your Selection',
  relatedDescription: 'Recommended products that seamlessly blend with this item.',
  websiteFont: 'Plus Jakarta Sans',
  showStoreName: true,
  logoSize: 120,
  promotionalBannerImage: '',
  promotionalBannerLink: ''
};

const StoreConfigContext = createContext<StoreConfigContextType>({
  storeSettings: defaultSettings,
  updateStoreSettings: () => {},
  isLoading: true
});

export const useStoreConfig = () => useContext(StoreConfigContext);

export const StoreConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const cached = localStorage.getItem('storeConfig');
    if (cached) {
      try {
        return { ...defaultSettings, ...JSON.parse(cached) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoreSettings().then(settings => {
      setStoreSettings(settings);
      localStorage.setItem('storeConfig', JSON.stringify(settings));
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    // Apply DOM mutations
    if (storeSettings.storeName) {
      const isAdminPath = window.location.pathname.startsWith('/admin');
      document.title = isAdminPath ? `${storeSettings.storeName} Administration` : storeSettings.storeName;
    }
    if (storeSettings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', storeSettings.primaryColor);
      document.documentElement.style.setProperty('--color-primary-container', storeSettings.primaryColor + '30');
    }
    if (storeSettings.websiteFont) {
      const fontId = storeSettings.websiteFont.replace(/\s+/g, '+');
      let fontLink = document.getElementById('dynamic-google-font');
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = 'dynamic-google-font';
        fontLink.setAttribute('rel', 'stylesheet');
        document.head.appendChild(fontLink);
      }
      fontLink.setAttribute('href', `https://fonts.googleapis.com/css2?family=${fontId}:wght@300;400;500;600;700;800&display=swap`);
      document.documentElement.style.setProperty('--font-sans', `"${storeSettings.websiteFont}", "Plus Jakarta Sans", "Inter", sans-serif`);
    }
    if (storeSettings.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = storeSettings.favicon;
    }
  }, [storeSettings, window.location.pathname]);

  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    const updated = { ...storeSettings, ...newSettings };
    setStoreSettings(updated);
    localStorage.setItem('storeConfig', JSON.stringify(updated));
  };

  return (
    <StoreConfigContext.Provider value={{ storeSettings, updateStoreSettings, isLoading }}>
      {children}
    </StoreConfigContext.Provider>
  );
};
