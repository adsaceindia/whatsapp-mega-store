const fs = require('fs');
let content = fs.readFileSync('src/pages/storeadmin/Branding.tsx', 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\n\s*setSettings\(storeSettings\);/,
  `useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      document.documentElement.style.setProperty('--color-primary-container', settings.primaryColor + '30');
    }
  }, [settings.primaryColor]);

  useEffect(() => {
    if (settings.websiteFont) {
      document.documentElement.style.setProperty('--font-sans', \`"\${settings.websiteFont}", "Plus Jakarta Sans", "Inter", sans-serif\`);
    }
  }, [settings.websiteFont]);

  useEffect(() => {
    setSettings(storeSettings);`
);

fs.writeFileSync('src/pages/storeadmin/Branding.tsx', content);
