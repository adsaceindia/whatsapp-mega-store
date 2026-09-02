const fs = require('fs');
let code = fs.readFileSync('src/pages/storefront/StorefrontCategoryProducts.tsx', 'utf8');

const startIdx = code.indexOf('<div \n              key={product.id || product.title}');
const endIdx = code.indexOf('                    </button>\n                  </div>\n                </div>\n              </div>\n            </div>');

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = '<ProductGridItem key={product.id || product.title} product={product} triggerToast={triggerToast} />';
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx + '                    </button>\n                  </div>\n                </div>\n              </div>\n            </div>'.length);
  
  if (!code.includes("ProductGridItem")) {
    code = code.replace("import { SkeletonProductCard } from '../../components/storefront/Skeleton';", "import { SkeletonProductCard } from '../../components/storefront/Skeleton';\nimport { ProductGridItem } from '../../components/storefront/ProductGridItem';");
  }
  
  fs.writeFileSync('src/pages/storefront/StorefrontCategoryProducts.tsx', code);
  console.log("Updated StorefrontCategoryProducts.tsx");
} else {
  console.log("Could not find boundaries");
}

