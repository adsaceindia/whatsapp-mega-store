const fs = require('fs');
let content = fs.readFileSync('src/pages/Register.tsx', 'utf8');

// For google login replace
content = content.replace(
  /await setDoc\(doc\(db, 'settings', 'general_' \+ user\.uid\), \{[\s\S]*?\}\);/g,
  `await setDoc(doc(db, 'settings', 'general_' + user.uid), {
        ownerId: user.uid,
        whatsappNumber: '+1234567890',
        currency: 'USD'
      });
      await setDoc(doc(db, 'settings', 'branding_' + user.uid), {
        storeName: user.displayName ? (user.displayName + "'s Store") : storeName,
        primaryColor: '#006d2f'
      });`
);

fs.writeFileSync('src/pages/Register.tsx', content);
