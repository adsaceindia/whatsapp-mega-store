sed -i '/<div className="md:col-span-2 mt-4 pt-4 border-t flex justify-end gap-3">/i\
            <div className="md:col-span-2 flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">\
              <div>\
                <h4 className="font-semibold text-gray-900">Active Status</h4>\
                <p className="text-sm text-gray-500">If inactive, the product will be hidden from the storefront.</p>\
              </div>\
              <label className="relative inline-flex items-center cursor-pointer">\
                <input type="checkbox" className="sr-only peer" checked={newProduct.active !== false} onChange={e => setNewProduct({...newProduct, active: e.target.checked})} />\
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['\'''\''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>\
              </label>\
            </div>\
' src/pages/storeadmin/Products.tsx
