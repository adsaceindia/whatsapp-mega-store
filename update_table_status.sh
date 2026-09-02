sed -i 's/<th className="pb-3 text-sm font-medium text-gray-500">Variants<\/th>/<th className="pb-3 text-sm font-medium text-gray-500">Variants<\/th>\n                <th className="pb-3 text-sm font-medium text-gray-500">Status<\/th>/g' src/pages/storeadmin/Products.tsx
sed -i 's/colSpan={9}/colSpan={10}/g' src/pages/storeadmin/Products.tsx

sed -i '/<td className="py-4 text-xs text-gray-600">/!b;n;n;n;/<\/td>/{a\
                    <td className="py-4">\
                      <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>\
                        <input type="checkbox" className="sr-only peer" checked={p.active !== false} onChange={async (e) => {\
                          const isActive = e.target.checked;\
                          if (p.id) {\
                            await updateProduct(p.id, { active: isActive });\
                            fetchProducts();\
                          }\
                        }} />\
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['\'''\''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>\
                      </label>\
                    </td>
}' src/pages/storeadmin/Products.tsx
