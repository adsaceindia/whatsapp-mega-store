const fs = require('fs');
let code = fs.readFileSync('src/pages/storefront/StorefrontCart.tsx', 'utf8');

code = code.replace(/text-3xl font-bold text-on-surface/g, 'text-2xl md:text-3xl font-bold text-on-surface');
code = code.replace(/text-xl font-bold/g, 'text-lg md:text-xl font-bold');
code = code.replace(/text-3xl font-bold text-primary/g, 'text-2xl md:text-3xl font-bold text-primary');
code = code.replace(/text-4xl/g, 'text-3xl md:text-4xl');

fs.writeFileSync('src/pages/storefront/StorefrontCart.tsx', code);
