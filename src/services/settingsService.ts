export interface StoreSettings {
  storeName: string;
  storeIcon: string;
  storeDescription?: string;
  primaryColor: string;
  favicon?: string;
  relatedSubtitle?: string;
  relatedTitle?: string;
  relatedDescription?: string;
  websiteFont?: string;
  showStoreName?: boolean;
  logoSize?: number;
  promotionalBannerImage?: string;
  promotionalBannerLink?: string;
}

export const getStoreSettings = async (storeId?: string): Promise<StoreSettings> => {
  try {
    const res = await fetch('/api/settings/branding');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return {
          storeName: data.storeName || 'My Store',
          storeIcon: data.storeIcon || '',
          primaryColor: data.primaryColor || '#006d2f',
          favicon: data.favicon || '',
          relatedSubtitle: data.relatedSubtitle || 'Accompanying Pieces',
          relatedTitle: data.relatedTitle || 'Complete Your Selection',
          relatedDescription: data.relatedDescription || 'Recommended products that seamlessly blend with this item.',
          websiteFont: data.websiteFont || 'Plus Jakarta Sans',
          showStoreName: data.showStoreName !== undefined ? data.showStoreName : true,
          logoSize: data.logoSize !== undefined ? Number(data.logoSize) : 120,
          promotionalBannerImage: data.promotionalBannerImage || '',
          promotionalBannerLink: data.promotionalBannerLink || ''
        };
      }
    }
  } catch (e) {
    console.error('Failed to get store settings:', e);
  }
  return {
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
};

export const saveStoreSettings = async (settings: StoreSettings, storeId?: string) => {
  await fetch('/api/settings/branding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface GeneralSettings {
  whatsappNumber: string;
  currency: string;
  customCurrencies?: {value: string, label: string}[];
}

export const getGeneralSettings = async (storeId?: string): Promise<GeneralSettings> => {
  try {
    const res = await fetch('/api/settings/general');
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.error('Failed to get general settings:', e);
  }
  return {
    whatsappNumber: '+1234567890',
    currency: 'USD'
  };
};

export const saveGeneralSettings = async (settings: GeneralSettings, storeId?: string) => {
  await fetch('/api/settings/general', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  productTitleTemplate?: string;
  productDescriptionTemplate?: string;
  categoryTitleTemplate?: string;
  categoryDescriptionTemplate?: string;
}

export const getSeoSettings = async (storeId?: string): Promise<SeoSettings> => {
  try {
    const res = await fetch('/api/settings/seo');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return {
          metaTitle: data.metaTitle || 'My Store - The easiest way to shop',
          metaDescription: data.metaDescription || 'Shop the latest products directly via WhatsApp. Fast, secure, and easy.',
          keywords: data.keywords || 'ecommerce, whatsapp shop, online store',
          productTitleTemplate: data.productTitleTemplate || '[product_name] | [store_name]',
          productDescriptionTemplate: data.productDescriptionTemplate || 'Buy [product_name] for only [price] at [store_name]. [description]',
          categoryTitleTemplate: data.categoryTitleTemplate || 'Shop [category_name] Collection | [store_name]',
          categoryDescriptionTemplate: data.categoryDescriptionTemplate || 'Explore our exclusive range of [category_name] products at the best prices on [store_name].'
        };
      }
    }
  } catch (e) {
    console.error('Failed to get SEO settings:', e);
  }
  return {
    metaTitle: 'My Store - The easiest way to shop',
    metaDescription: 'Shop the latest products directly via WhatsApp. Fast, secure, and easy.',
    keywords: 'ecommerce, whatsapp shop, online store',
    productTitleTemplate: '[product_name] | [store_name]',
    productDescriptionTemplate: 'Buy [product_name] for only [price] at [store_name]. [description]',
    categoryTitleTemplate: 'Shop [category_name] Collection | [store_name]',
    categoryDescriptionTemplate: 'Explore our exclusive range of [category_name] products at the best prices on [store_name].'
  };
};

export const saveSeoSettings = async (settings: SeoSettings, storeId?: string) => {
  await fetch('/api/settings/seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface AnalyticsSettings {
  googleAnalyticsId: string;
  metaPixelId: string;
  gtmId?: string;
}

export const getAnalyticsSettings = async (storeId?: string): Promise<AnalyticsSettings> => {
  try {
    const res = await fetch('/api/settings/analytics');
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.error('Failed to get analytics settings:', e);
  }
  return { googleAnalyticsId: '', metaPixelId: '', gtmId: '' };
};

export const saveAnalyticsSettings = async (settings: AnalyticsSettings, storeId?: string) => {
  await fetch('/api/settings/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface PaymentSettings {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  paytmEnabled: boolean;
  paytmMerchantId: string;
  paytmMerchantKey: string;
  upiEnabled: boolean;
  upiId: string;
  upiName: string;
  cardsEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  paypalEnabled: boolean;
  paypalEmail: string;
  internationalEnabled: boolean;
  internationalProvider: string;
  codEnabled: boolean;
}

export const getPaymentSettings = async (storeId?: string): Promise<PaymentSettings> => {
  const defaultSettings: PaymentSettings = {
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    paytmEnabled: false,
    paytmMerchantId: '',
    paytmMerchantKey: '',
    upiEnabled: false,
    upiId: '',
    upiName: '',
    cardsEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalEnabled: false,
    paypalEmail: '',
    internationalEnabled: false,
    internationalProvider: 'PayPal',
    codEnabled: true
  };

  try {
    const res = await fetch('/api/settings/payment');
    if (res.ok) {
      const data = await res.json();
      if (data) return { ...defaultSettings, ...data };
    }
  } catch (e) {
    console.error('Failed to get payment settings:', e);
  }
  return defaultSettings;
};

export const savePaymentSettings = async (settings: PaymentSettings, storeId?: string) => {
  await fetch('/api/settings/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface CourierSettings {
  shiprocketEnabled: boolean;
  shiprocketEmail: string;
  shiprocketPassword: string;
  delhiveryEnabled: boolean;
  delhiveryApiKey: string;
  customCourierEnabled: boolean;
  customCourierName: string;
  customCourierRate: number;
}

export const getCourierSettings = async (storeId?: string): Promise<CourierSettings> => {
  try {
    const res = await fetch('/api/settings/courier');
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.error('Failed to get courier settings:', e);
  }
  return {
    shiprocketEnabled: false,
    shiprocketEmail: '',
    shiprocketPassword: '',
    delhiveryEnabled: false,
    delhiveryApiKey: '',
    customCourierEnabled: false,
    customCourierName: '',
    customCourierRate: 0
  };
};

export const saveCourierSettings = async (settings: CourierSettings, storeId?: string) => {
  await fetch('/api/settings/courier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface AuthSettings {
  email?: string;
  mobile?: string;
  password?: string;
}

export const getAuthSettings = async (storeId?: string): Promise<AuthSettings> => {
  try {
    const res = await fetch('/api/settings/auth');
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.error('Failed to get auth settings:', e);
  }
  return { email: 'admin@store.com', mobile: '1234567890', password: 'admin123' };
};

export const saveAuthSettings = async (settings: AuthSettings, storeId?: string) => {
  await fetch('/api/settings/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface PageSettings {
  aboutUs: string;
  shippingPolicy: string;
  termsOfService: string;
}

export const getPageSettings = async (storeId?: string): Promise<PageSettings> => {
  try {
    const res = await fetch('/api/settings/pages');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return {
          aboutUs: data.aboutUs || 'We are a boutique fashion and craft store delivering curated bespoke items directly to your doorstep.',
          shippingPolicy: data.shippingPolicy || 'We offer nationwide premium shipping. Orders are packed with care and dispatched within 2-3 business days.',
          termsOfService: data.termsOfService || 'By using our service, you agree to buy high quality items and pay via standard online gateways or COD.'
        };
      }
    }
  } catch (e) {
    console.error('Failed to get page settings:', e);
  }
  return {
    aboutUs: 'We are a boutique fashion and craft store delivering curated bespoke items directly to your doorstep.',
    shippingPolicy: 'We offer nationwide premium shipping. Orders are packed with care and dispatched within 2-3 business days.',
    termsOfService: 'By using our service, you agree to buy high quality items and pay via standard online gateways or COD.'
  };
};

export const savePageSettings = async (settings: PageSettings, storeId?: string) => {
  await fetch('/api/settings/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export interface AutomationSettings {
  webhookUrl: string;
  enabled: boolean;
  triggerOnCreated: boolean;
  triggerOnUpdated: boolean;
  triggerOnDeleted: boolean;
}

export const getAutomationSettings = async (storeId?: string): Promise<AutomationSettings> => {
  try {
    const res = await fetch('/api/settings/automation');
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.error('Failed to get automation settings:', e);
  }
  return { webhookUrl: '', enabled: false, triggerOnCreated: true, triggerOnUpdated: false, triggerOnDeleted: false };
};

export const saveAutomationSettings = async (settings: AutomationSettings, storeId?: string) => {
  await fetch('/api/settings/automation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

export const triggerWebhook = async (event: 'order.created' | 'order.updated' | 'order.deleted', payload: any) => {
  try {
    const settings = await getAutomationSettings();
    if (!settings.enabled || !settings.webhookUrl) return;

    if (event === 'order.created' && !settings.triggerOnCreated) return;
    if (event === 'order.updated' && !settings.triggerOnUpdated) return;
    if (event === 'order.deleted' && !settings.triggerOnDeleted) return;

    await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Store-Event': event
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });
  } catch (error) {
    console.error('Error triggering webhook:', error);
  }
};
