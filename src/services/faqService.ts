export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  active?: boolean;
  sortOrder?: number;
  order?: number;
}

export const getFAQs = async (): Promise<FAQ[]> => {
  const res = await fetch('/api/faqs');
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  const data = await res.json();
  return data.map((item: any) => ({
    ...item,
    order: item.sortOrder ?? item.order ?? 0
  }));
};

export const addFAQ = async (faq: Omit<FAQ, 'id'>): Promise<string> => {
  const payload = {
    ...faq,
    sortOrder: faq.sortOrder ?? faq.order ?? 0
  };
  const res = await fetch('/api/faqs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add FAQ');
  const data = await res.json();
  return data.id;
};

export const updateFAQ = async (id: string, faq: Partial<FAQ>): Promise<void> => {
  const payload = {
    ...faq,
    sortOrder: faq.sortOrder ?? faq.order
  };
  const res = await fetch(`/api/faqs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update FAQ');
};

export const deleteFAQ = async (id: string): Promise<void> => {
  const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete FAQ');
};
