const fs = require('fs');

let content = fs.readFileSync('firestore.rules', 'utf8');

// Insert the users rule before the fallback or just after the databases line
content = content.replace(
  "match /{document=**} {",
  "match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n    match /{document=**} {"
);

fs.writeFileSync('firestore.rules', content);
