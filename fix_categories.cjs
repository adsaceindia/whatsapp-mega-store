const fs = require('fs');
let code = fs.readFileSync('src/pages/storefront/StorefrontCategories.tsx', 'utf8');

code = code.replace(/text-lg font-bold/g, 'text-base md:text-lg lg:text-xl font-bold');
code = code.replace(/text-sm font-medium/g, 'text-xs md:text-sm font-medium');
code = code.replace(/text-sm py-1\.5/g, 'text-xs md:text-sm py-1 md:py-1.5');
code = code.replace(/font-bold text-neutral-800 mb-4 text-lg/g, 'font-bold text-neutral-800 mb-2 md:mb-4 text-base md:text-lg');
code = code.replace(/px-4 py-2 rounded-full text-sm/g, 'px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm');
code = code.replace(/bg-white rounded-lg border border-neutral-200 p-4/g, 'bg-white rounded-lg border border-neutral-200 p-3 md:p-4');
code = code.replace(/flex items-center gap-2 w-full sm:w-auto/g, 'flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto');
code = code.replace(/px-3 py-2 w-full sm:w-auto/g, 'px-2 py-1.5 md:px-3 md:py-2 w-full sm:w-auto');
code = code.replace(/px-8 py-2\.5 rounded-md font-medium text-sm/g, 'px-6 py-2 md:px-8 md:py-2.5 rounded-md font-medium text-xs md:text-sm');

fs.writeFileSync('src/pages/storefront/StorefrontCategories.tsx', code);
