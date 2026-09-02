const fs = require('fs');

let content = fs.readFileSync('src/services/settingsService.ts', 'utf8');

// Replace doc(db, 'settings', 'XYZ') in get functions
content = content.replace(/doc\(db,\s*'settings',\s*'([^']+)'\)/g, "doc(db, 'settings', '$1_' + (auth?.currentUser?.uid || 'default'))");

fs.writeFileSync('src/services/settingsService.ts', content);
