export interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  active: boolean;
  productCount: number;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return await res.json();
};

export const addCategory = async (category: Omit<Category, 'id'> | Partial<Category>): Promise<string> => {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  if (!res.ok) throw new Error('Failed to add category');
  const data = await res.json();
  return data.id;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  if (!res.ok) throw new Error('Failed to update category');
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
};
