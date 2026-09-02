sed -i 's/setProducts(fetched);/setProducts(fetched.filter((p: any) => p.active !== false));/g' src/pages/storefront/StorefrontHome.tsx
