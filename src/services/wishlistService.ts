export interface WishlistProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

export const fetchUserWishlist = async (userId: string): Promise<WishlistProduct[]> => {
  const res = await fetch(`/api/wishlist/${userId}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r: any) => ({
    id: r.productId,
    title: r.title,
    price: r.price,
    image: r.image
  }));
};

export const addToFirestoreWishlist = async (userId: string, product: WishlistProduct): Promise<void> => {
  await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, product })
  });
};

export const removeFromFirestoreWishlist = async (userId: string, productId: string): Promise<void> => {
  await fetch(`/api/wishlist/${userId}/${productId}`, { method: 'DELETE' });
};

export const syncLocalWishlistToFirestore = async (userId: string, localItems: WishlistProduct[]): Promise<WishlistProduct[]> => {
  for (const item of localItems) {
    await addToFirestoreWishlist(userId, item);
  }
  return await fetchUserWishlist(userId);
};

export const getWishlistStats = async () => {
  return { totalCount: 0, topProducts: [] };
};
