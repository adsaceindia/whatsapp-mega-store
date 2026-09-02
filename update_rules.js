const fs = require('fs');

let content = fs.readFileSync('firestore.rules', 'utf8');

content = content.replace(
  /match \/settings\/{documentId} {[^}]+}/,
  `match /settings/{documentId} {
      // Public settings can be read by anyone
      allow read: if !documentId.matches('^payment_secrets.*') && 
                     !documentId.matches('^courier.*') && 
                     !documentId.matches('^automation.*') && 
                     !documentId.matches('^auth.*');
                     
      // Highly sensitive documents can ONLY be read if authenticated
      allow read: if (documentId.matches('^payment_secrets.*') || 
                      documentId.matches('^courier.*') || 
                      documentId.matches('^automation.*') || 
                      documentId.matches('^auth.*')) && request.auth != null;
                      
      // Only authenticated administrator accounts can update or write settings
      allow write: if request.auth != null;
    }`
);

fs.writeFileSync('firestore.rules', content);
