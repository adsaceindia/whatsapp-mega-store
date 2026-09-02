const fs = require('fs');
let content = fs.readFileSync('src/pages/storefront/StorefrontHome.tsx', 'utf8');

content = content.replace(/const seedProducts = \[\s*\{[\s\S]*?\}\s*\];\n/g, '');

fs.writeFileSync('src/pages/storefront/StorefrontHome.tsx', content);
