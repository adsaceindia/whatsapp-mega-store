const fs = require('fs');

// Fix ProductGridItem interface
let pgi = fs.readFileSync('src/components/storefront/ProductGridItem.tsx', 'utf8');
if (!pgi.includes('key?: React.Key')) {
  pgi = pgi.replace(/product: any;/, 'product: any;\n  key?: React.Key;');
  fs.writeFileSync('src/components/storefront/ProductGridItem.tsx', pgi);
}

// Fix missing import in StorefrontCategoryProducts.tsx
let scp = fs.readFileSync('src/pages/storefront/StorefrontCategoryProducts.tsx', 'utf8');
if (!scp.includes("import { ProductGridItem }")) {
  scp = scp.replace(
    /import \{ SkeletonProductCard \} from '\.\.\/\.\.\/components\/storefront\/Skeleton';/,
    "import { SkeletonProductCard } from '../../components/storefront/Skeleton';\nimport { ProductGridItem } from '../../components/storefront/ProductGridItem';"
  );
  fs.writeFileSync('src/pages/storefront/StorefrontCategoryProducts.tsx', scp);
}
