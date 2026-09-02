const fs = require('fs');
let content = fs.readFileSync('src/pages/storefront/StorefrontHome.tsx', 'utf8');

// Add import
if (!content.includes('trackSelectItem')) {
  content = content.replace(
    "import { trackViewItem } from '../../utils/analytics';",
    "import { trackViewItem, trackSelectItem } from '../../utils/analytics';"
  );
  if (!content.includes('trackSelectItem')) {
      content = content.replace(
        "import { trackViewItemList } from '../../utils/analytics';",
        "import { trackViewItemList, trackSelectItem } from '../../utils/analytics';"
      );
  }
}

// Wrap navigate in a function
content = content.replace(
  /onClick=\{\(\) => navigate\(\`\/product\/\$\{slugify\(p\.title\)\}\`\)\}/g,
  "onClick={() => { trackSelectItem(p, 'Home Feed'); navigate(`/product/${slugify(p.title)}`); }}"
);

content = content.replace(
  /navigate\(\`\/product\/\$\{slugify\(p\.title\)\}\`\);/g,
  "trackSelectItem(p, 'Home Feed'); navigate(`/product/${slugify(p.title)}`);"
);

content = content.replace(
  /onClick=\{\(\) => navigate\(\`\/product\/\$\{slugify\(spotlightProduct\.title\)\}\`\)\}/g,
  "onClick={() => { trackSelectItem(spotlightProduct, 'Spotlight'); navigate(`/product/${slugify(spotlightProduct.title)}`); }}"
);

content = content.replace(
  /onClick=\{\(\) => navigate\(\`\/product\/\$\{slugify\(product\.title\)\}\`\)\}/g,
  "onClick={() => { trackSelectItem(product, 'Collection'); navigate(`/product/${slugify(product.title)}`); }}"
);

fs.writeFileSync('src/pages/storefront/StorefrontHome.tsx', content);
