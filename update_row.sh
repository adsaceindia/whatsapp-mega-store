sed -i '/<td className="py-4 text-sm font-medium text-gray-900">/i\
                    <td className="py-4 text-sm text-gray-600">\
                      ${(p.cost || 0).toFixed(2)}\
                    </td>' src/pages/storeadmin/Products.tsx

sed -i '/<\/td>/!b;n;/^[[:space:]]*<td className="py-4 text-sm text-gray-600">/{i\
                    <td className="py-4 text-sm font-medium text-green-600">\
                      ${((p.price - (p.cost || 0)) * (p.inventoryQuantity || 0)).toFixed(2)}\
                      <span className="block text-xs text-gray-400 font-normal">(${(p.price - (p.cost || 0)).toFixed(2)}/unit profit)</span>\
                    </td>
}' src/pages/storeadmin/Products.tsx
