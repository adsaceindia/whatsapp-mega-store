const fs = require('fs');
let cat = fs.readFileSync('src/pages/storefront/StorefrontCategories.tsx', 'utf8');

cat = cat.replace(
  /\s*\/\/ Add sale[\s\S]*?\}\);\n/g,
  '\n'
);

cat = cat.replace(
  /const allCategoryPillNames = \["All Categories", \.\.\.new Set\(products\.map\(\(p\) => p\.category\)\), "Special Offers"\];/g,
  'const allCategoryPillNames = ["All Categories", ...new Set(products.map((p) => p.category))];'
);

cat = cat.replace(
  /\(selectedCategory === "Special Offers" \? product\.sale === true : product\.category === selectedCategory\)/g,
  '(product.category === selectedCategory)'
);

fs.writeFileSync('src/pages/storefront/StorefrontCategories.tsx', cat);
