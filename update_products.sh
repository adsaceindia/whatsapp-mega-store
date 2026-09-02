sed -i 's/<div className="col-span-2">/<div>/g' src/pages/storeadmin/Products.tsx
sed -i '/<label className="block text-sm font-semibold text-gray-900 mb-1">Inventory Quantity<\/label>/i\
                <div>\
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Cost ($) - Admin Only</label>\
                  <input type="number" step="0.01" min="0" value={newProduct.cost || '"''"'} onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value) || 0})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. 50" />\
                </div>' src/pages/storeadmin/Products.tsx
