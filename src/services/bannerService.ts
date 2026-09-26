export interface Banner {
  id?: string;
  title: string;
  image: string;
  subtitle?: string;
  tag?: string;
  buttonText?: string;
  link?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  position?: number;
  type?: 'hero' | 'rectangle';
}

export const getBanners = async (): Promise<Banner[]> => {
  const res = await fetch('/api/banners');
  if (!res.ok) throw new Error('Failed to fetch banners');
  return await res.json();
};

export const addBanner = async (banner: Omit<Banner, 'id'>): Promise<string> => {
  const res = await fetch('/api/banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(banner)
  });
  if (!res.ok) throw new Error('Failed to add banner');
  const data = await res.json();
  return data.id;
};

export const updateBanner = async (id: string, banner: Partial<Banner>): Promise<void> => {
  const res = await fetch(`/api/banners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(banner)
  });
  if (!res.ok) throw new Error('Failed to update banner');
};

export const deleteBanner = async (id: string): Promise<void> => {
  const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete banner');
};
