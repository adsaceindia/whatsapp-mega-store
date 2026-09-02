const fs = require('fs');

let content = fs.readFileSync('src/pages/storefront/StorefrontHome.tsx', 'utf8');

// Replace the hardcoded banners array and instead use state + service
// find `const banners = [` to the end
content = content.replace(/const banners = \[\s*\{[\s\S]*?\];/g, '');

// import getBanners
if (!content.includes('getBanners')) {
  content = content.replace(
    "import { collection, getDocs, addDoc } from 'firebase/firestore';",
    "import { collection, getDocs, addDoc } from 'firebase/firestore';\nimport { getBanners, Banner } from '../../services/bannerService';"
  );
}

// add state for banners inside StorefrontHome
const stateToAdd = `
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners", error);
    } finally {
      setLoadingBanners(false);
    }
  };
`;

if (!content.includes('const [banners, setBanners]')) {
  content = content.replace(
    "export function StorefrontHome() {",
    "export function StorefrontHome() {\n" + stateToAdd
  );
}

// Fix Hero Banner rendering condition (if no banners, don't crash)
content = content.replace(
  "{/* Hero Banner Slider */}",
  "{/* Hero Banner Slider */}\n        {banners.length > 0 ? ("
);

// Close the condition block after the Hero Banner div
content = content.replace(
  "</div>\n\n        {/* Categories Section */}",
  "</div>\n        ) : null}\n\n        {/* Categories Section */}"
);


fs.writeFileSync('src/pages/storefront/StorefrontHome.tsx', content);
