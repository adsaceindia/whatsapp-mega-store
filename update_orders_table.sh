sed -i 's/<th className="pb-3 text-sm font-medium text-gray-500">Items Summary<\/th>/<th className="pb-3 text-sm font-medium text-gray-500">Total Items<\/th>\n                <th className="pb-3 text-sm font-medium text-gray-500">Items Summary<\/th>/g' src/pages/storeadmin/Orders.tsx
sed -i 's/colSpan={8}/colSpan={9}/g' src/pages/storeadmin/Orders.tsx
sed -i '/<td className="py-4 text-sm text-gray-600">/!b;n;/^{o.items/!b;i\
                    <td className="py-4 text-sm font-bold text-gray-900">\
                      {o.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}\
                    </td>
' src/pages/storeadmin/Orders.tsx
