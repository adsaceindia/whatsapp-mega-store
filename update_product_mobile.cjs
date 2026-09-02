const fs = require('fs');

let code = fs.readFileSync('src/pages/storefront/StorefrontProduct.tsx', 'utf8');

code = code.replace(
  /className=\{`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 bg-neutral-50 \$\{/g,
  'className={`relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 flex-shrink-0 bg-neutral-50 ${'
);

code = code.replace(
  /className="p-6 md:p-10"/g,
  'className="p-4 md:p-10"'
);

code = code.replace(
  /className=\{`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2/g,
  'className={`px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2'
);

code = code.replace(
  /className="w-24 h-24 bg-neutral-50 rounded-md border border-neutral-200 p-2 mb-2"/g,
  'className="w-20 h-20 md:w-24 md:h-24 bg-neutral-50 rounded-md border border-neutral-200 p-2 mb-2"'
);

code = code.replace(
  /className=\{`w-24 h-24 bg-neutral-50 rounded-md border p-2 mb-2 \$\{selectedBundleIds\.includes\(item\.id\) \? 'border-primary' : 'border-neutral-200'\}`\}/g,
  'className={`w-20 h-20 md:w-24 md:h-24 bg-neutral-50 rounded-md border p-2 mb-2 ${selectedBundleIds.includes(item.id) ? \'border-primary\' : \'border-neutral-200\'}`}'
);

code = code.replace(
  /className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200"/g,
  'className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-neutral-200"'
);

code = code.replace(
  /className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 min-w-\[250px\] flex flex-col items-center md:items-start text-center md:text-left"/g,
  'className="bg-neutral-50 p-4 md:p-6 rounded-lg border border-neutral-200 w-full lg:w-auto lg:min-w-[250px] flex flex-col items-center lg:items-start text-center lg:text-left mt-6 lg:mt-0"'
);

code = code.replace(
  /className="flex flex-col md:flex-row items-center gap-6 md:gap-10"/g,
  'className="flex flex-col lg:flex-row items-center gap-4 md:gap-10"'
);

fs.writeFileSync('src/pages/storefront/StorefrontProduct.tsx', code);
