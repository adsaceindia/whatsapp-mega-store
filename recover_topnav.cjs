const fs = require('fs');
const code = fs.readFileSync('src/components/storefront/TopNavBar.tsx', 'utf8');

const marker = "import { useState, useEffect, useRef } from 'react';";
const markerIndex = code.lastIndexOf(marker);

if (markerIndex !== -1) {
  const newCode = "import React from 'react';\nimport { Link, useLocation, useNavigate } from 'react-router';\n" + code.substring(markerIndex);
  fs.writeFileSync('src/components/storefront/TopNavBar.tsx', newCode);
  console.log("Recovered successfully");
} else {
  console.log("Marker not found");
}
