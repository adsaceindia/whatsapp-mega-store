export interface Product {
  id?: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  sale?: boolean;
  image: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  description?: string;
  keySpecs?: string;
  features?: string;
  inventoryQuantity?: number;
  active?: boolean;
  cost?: number;
  spotlight?: boolean;
  ratingValue?: number;
  ratingCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  variantPrices?: Record<string, number>;
}

export const getDeterministicRating = (idOrTitle: string, title?: string) => {
  const text = title || idOrTitle || '';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rating = 4.2 + (Math.abs(hash) % 8) * 0.1;
  const count = 12 + (Math.abs(hash) % 180);
  return { rating: Number(rating.toFixed(1)), count };
};

export const getProducts = async (storeId?: string): Promise<Product[]> => {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to fetch products');
  return await res.json();
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Failed to add product');
  const data = await res.json();
  return data.id;
};

export const updateProduct = async (id: string, product: Partial<Product>, storeId?: string): Promise<void> => {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Failed to update product');
};

export const deleteProduct = async (id: string, storeId?: string): Promise<void> => {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
};
