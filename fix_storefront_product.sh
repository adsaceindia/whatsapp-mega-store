sed -i 's/if (docSnap.exists()) {/if (docSnap.exists() \&\& docSnap.data().active !== false) {/g' src/pages/storefront/StorefrontProduct.tsx
