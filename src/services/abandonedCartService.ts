export interface CartSessionData {
  id: string;
  items: any[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  customer?: {
    name?: string;
    phone?: string;
    whatsapp?: string;
  };
  updatedAt: string;
  status?: string;
}

export type AbandonedCartSession = CartSessionData;

export const saveCartSession = async (sessionId: string, items: any[], total: number, customerName?: string, customerPhone?: string): Promise<void> => {
  try {
    await fetch('/api/abandoned-carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        items,
        total,
        customerName,
        customerPhone
      })
    });
  } catch (err) {
    console.error('Failed to save cart session:', err);
  }
};

export const fetchAbandonedCarts = async (): Promise<CartSessionData[]> => {
  try {
    const res = await fetch('/api/abandoned-carts');
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r: any) => ({
      ...r,
      customer: {
        name: r.customerName,
        phone: r.customerPhone,
        whatsapp: r.customerPhone
      }
    }));
  } catch (err) {
    console.error('Failed to fetch abandoned carts:', err);
    return [];
  }
};

export const getCartSessions = fetchAbandonedCarts;

export const deleteCartSession = async (id: string) => {};

export const convertCartSession = async (id: string) => {};

export const updateCartSessionCustomer = async (id: string, nameOrCustomer?: any, phone?: string) => {};
