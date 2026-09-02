const fs = require('fs');
let code = fs.readFileSync('src/pages/storefront/StorefrontHome.tsx', 'utf8');

code = code.replace(/text-xl md:text-2xl font-bold/g, 'text-lg md:text-xl lg:text-2xl font-bold');
code = code.replace(/text-sm font-medium hover:underline/g, 'text-xs md:text-sm font-medium hover:underline');
code = code.replace(/px-6 py-2\.5 rounded-md font-semibold text-sm/g, 'px-4 py-2 md:px-6 md:py-2.5 rounded-md font-semibold text-xs md:text-sm');
code = code.replace(/text-\[11px\] md:text-xs font-medium text-neutral-700/g, 'text-[10px] sm:text-[11px] md:text-xs font-medium text-neutral-700');
code = code.replace(/max-w-\[70px\]/g, 'max-w-[60px] md:max-w-[80px]');
code = code.replace(/w-16 h-16/g, 'w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20');
code = code.replace(/p-6 md:p-12 max-w-lg/g, 'p-4 sm:p-6 md:p-10 lg:p-12 max-w-md lg:max-w-lg');
code = code.replace(/text-2xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-4/g, 'text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 md:mb-4');
code = code.replace(/text-sm md:text-lg opacity-90 mb-6 hidden sm:block/g, 'text-xs md:text-base lg:text-lg opacity-90 mb-4 md:mb-6 hidden sm:block');

fs.writeFileSync('src/pages/storefront/StorefrontHome.tsx', code);
