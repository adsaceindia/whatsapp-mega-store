const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/Footer.tsx', 'utf8');

content = content.replace(
  /<li>\s*<Link to="\/login" onClick=\{handleAdminClick\}[^>]*>.*?<\/Link>\s*<\/li>/gs,
  ''
);

content = content.replace(
  /<p className="font-medium">/,
  `<p className="font-medium">
          <span onClick={handleAdminClick} className="cursor-pointer select-none">© {new Date().getFullYear()} {storeSettings.storeName}. All rights reserved globally.</span>`
);
content = content.replace(
  /© \{new Date\(\)\.getFullYear\(\)\} \{storeSettings\.storeName\}\. All rights reserved globally\./,
  ""
);

fs.writeFileSync('src/components/storefront/Footer.tsx', content);
