export interface Coupon {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount?: number;
  active?: boolean;
  spotlight?: boolean;
}

export const getCoupons = async (): Promise<Coupon[]> => {
  const res = await fetch('/api/coupons');
  if (!res.ok) throw new Error('Failed to fetch coupons');
  return await res.json();
};

export const addCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<string> => {
  const res = await fetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  });
  if (!res.ok) throw new Error('Failed to add coupon');
  const data = await res.json();
  return data.id;
};

export const updateCoupon = async (id: string, coupon: Partial<Coupon>): Promise<void> => {
  const res = await fetch(`/api/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  });
  if (!res.ok) throw new Error('Failed to update coupon');
};

export const deleteCoupon = async (id: string): Promise<void> => {
  const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete coupon');
};
