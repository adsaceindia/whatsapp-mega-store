import { Product } from '../services/productService';
import { CartItem } from '../context/CartContext';

declare global {
  interface Window {
    dataLayer: any[];
    storeCurrency?: string;
  }
}

export const initDataLayer = () => {
  window.dataLayer = window.dataLayer || [];
};

export const trackViewItemList = (products: Product[], listName: string = 'Category List') => {
  initDataLayer();
  window.dataLayer.push({
    event: 'view_item_list',
    ecommerce: {
      item_list_name: listName,
      items: products.map((p, index) => ({
        item_id: p.id,
        item_name: p.title,
        affiliation: 'WhatsApp Store',
        discount: p.originalPrice ? p.originalPrice - p.price : 0,
        index: index + 1,
        item_category: p.category || '',
        price: p.price,
        quantity: 1
      }))
    }
  });
};

export const trackViewItem = (product: Product) => {
  initDataLayer();
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      items: [{
        item_id: product.id,
        item_name: product.title,
        affiliation: 'WhatsApp Store',
        discount: product.originalPrice ? product.originalPrice - product.price : 0,
        item_category: product.category || '',
        price: product.price,
        quantity: 1
      }]
    }
  });
};

export const trackAddToCart = (item: CartItem) => {
  initDataLayer();
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: window.storeCurrency || 'USD',
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.title,
        affiliation: 'WhatsApp Store',
        discount: 0,
        item_category: '',
        item_variant: item.size || item.color || '',
        price: item.price,
        quantity: item.quantity
      }]
    }
  });
};

export const trackRemoveFromCart = (item: CartItem) => {
  initDataLayer();
  window.dataLayer.push({
    event: 'remove_from_cart',
    ecommerce: {
      currency: window.storeCurrency || 'USD',
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.title,
        affiliation: 'WhatsApp Store',
        discount: 0,
        item_category: '',
        item_variant: item.size || item.color || '',
        price: item.price,
        quantity: item.quantity
      }]
    }
  });
};

export const trackBeginCheckout = (items: CartItem[], total: number) => {
  initDataLayer();
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: window.storeCurrency || 'USD',
      value: total,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.title,
        affiliation: 'WhatsApp Store',
        discount: 0,
        item_category: '',
        item_variant: item.size || item.color || '',
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackPurchase = (transactionId: string, items: CartItem[], total: number, tax: number = 0, shipping: number = 0, coupon: string = '') => {
  initDataLayer();
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: total,
      tax: tax,
      shipping: shipping,
      currency: window.storeCurrency || 'USD',
      coupon: coupon,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.title,
        affiliation: 'WhatsApp Store',
        coupon: coupon,
        discount: 0,
        item_category: '',
        item_variant: item.size || item.color || '',
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackSelectItem = (product: Product, listName: string = 'Category List') => {
  initDataLayer();
  window.dataLayer.push({
    event: 'select_item',
    ecommerce: {
      item_list_name: listName,
      items: [{
        item_id: product.id,
        item_name: product.title,
        affiliation: 'WhatsApp Store',
        discount: product.originalPrice ? product.originalPrice - product.price : 0,
        item_category: product.category || '',
        price: product.price,
        quantity: 1
      }]
    }
  });
};

export const trackAddShippingInfo = (items: CartItem[], value: number, shippingTier: string = 'Standard') => {
  initDataLayer();
  window.dataLayer.push({
    event: 'add_shipping_info',
    ecommerce: {
      currency: window.storeCurrency || 'USD',
      value: value,
      shipping_tier: shippingTier,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackAddPaymentInfo = (items: CartItem[], value: number, paymentType: string) => {
  initDataLayer();
  window.dataLayer.push({
    event: 'add_payment_info',
    ecommerce: {
      currency: window.storeCurrency || 'USD',
      value: value,
      payment_type: paymentType,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackPageView = (url: string, title: string = '') => {
  initDataLayer();
  window.dataLayer.push({
    event: 'page_view',
    page_location: url,
    page_title: title
  });
};

export const trackCustomConversion = (eventName: string, params: Record<string, any> = {}) => {
  initDataLayer();
  window.dataLayer.push({
    event: eventName,
    ...params
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('conversion_milestone', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.eventName) {
      trackCustomConversion(customEvent.detail.eventName, customEvent.detail.params);
    }
  });
}
