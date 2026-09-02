const fs = require('fs');

let code = fs.readFileSync('src/services/productService.ts', 'utf8');

code = code.replace(
  /export const getProducts = async \(storeId\?: string\): Promise<Product\[\]> => \{([\s\S]*?)const querySnapshot = await getDocs\(q\);/,
  `export const getProducts = async (storeId?: string): Promise<Product[]> => {
  let q = query(collection(db, 'products'));
  const querySnapshot = await getDocs(q);`
);

fs.writeFileSync('src/services/productService.ts', code);
