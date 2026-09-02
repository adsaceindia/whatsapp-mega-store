import { triggerWebhook } from './settingsService';

export interface OrderCustomer {
  name: string;
  whatsapp: string;
  address: string;
  city: string;
  pincode: string;
}

export interface Order {
  id?: string;
  items: any[];
  customer: OrderCustomer;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
}

export const getOrderById = async (id: string): Promise<Order | null> => {
  const orders = await getOrders();
  return orders.find(o => o.id === id) || null;
};

export const getOrders = async (storeId?: string): Promise<Order[]> => {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new Error('Failed to fetch orders');
  const rows = await res.json();
  return rows.map((r: any) => ({
    id: r.id,
    items: r.items,
    customer: {
      name: r.customerName,
      whatsapp: r.customerMobile,
      address: r.address,
      city: r.city,
      pincode: r.pincode
    },
    total: r.total,
    subtotal: r.total,
    tax: 0,
    discount: 0,
    status: r.status,
    createdAt: r.date,
    paymentMethod: r.paymentMethod
  }));
};

export const sanitizeData = (data: any): any => {
  if (data === undefined || data === null) return null;
  if (Array.isArray(data)) return data.map(item => sanitizeData(item));
  if (typeof data === 'object') {
    const clean: any = {};
    for (const key of Object.keys(data)) {
      if (data[key] !== undefined) {
        clean[key] = sanitizeData(data[key]);
      }
    }
    return clean;
  }
  return data;
};

export const addOrder = async (order: Omit<Order, 'id'>) => {
  const sanitizedOrder = sanitizeData(order);
  const secureRandomPart = Math.random().toString(36).substring(2, 12).toUpperCase();
  const timestampPart = Date.now().toString(36).toUpperCase();
  const customOrderId = `ORD-${timestampPart}-${secureRandomPart}`;

  const payload = {
    id: customOrderId,
    customerName: order.customer?.name || 'Customer',
    customerMobile: order.customer?.whatsapp || '',
    address: order.customer?.address || '',
    city: order.customer?.city || '',
    pincode: order.customer?.pincode || '',
    items: order.items || [],
    total: order.total || 0,
    status: order.status || 'Pending',
    date: order.createdAt || new Date().toISOString(),
    paymentMethod: order.paymentMethod || 'COD'
  };

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create order');

  try {
    await triggerWebhook('order.created', { id: customOrderId, ...sanitizedOrder });
  } catch (err) {
    console.error('Failed to trigger webhook on order creation:', err);
  }

  return customOrderId;
};

export const updateOrder = async (id: string, order: Partial<Order>) => {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: order.status })
  });
  if (!res.ok) throw new Error('Failed to update order');

  try {
    await triggerWebhook('order.updated', { id, ...order });
  } catch (err) {
    console.error('Failed to trigger webhook on order update:', err);
  }
};

export const deleteOrder = async (id: string) => {
  const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete order');

  try {
    await triggerWebhook('order.deleted', { id });
  } catch (err) {
    console.error('Failed to trigger webhook on order deletion:', err);
  }
};
