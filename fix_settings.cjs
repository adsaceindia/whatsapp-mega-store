const fs = require('fs');
let content = fs.readFileSync('src/pages/storeadmin/Settings.tsx', 'utf8');

content = content.replace(
  /const auth = await getAuthSettings\(\);\n\s*setAuthSettings\(auth\);/,
  "const auth = await getAuthSettings();\n        if (auth) setAuthSettings(auth);"
);

fs.writeFileSync('src/pages/storeadmin/Settings.tsx', content);
