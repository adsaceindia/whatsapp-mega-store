import React, { useState, useEffect } from 'react';
import { PanelTop, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { getMenuItems, saveMenuItems, MenuItem } from '../../services/menuService';

export function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const items = await getMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleAdd = () => {
    setMenuItems([
      ...menuItems,
      { id: Date.now().toString(), label: 'New Item', link: '/' }
    ]);
  };

  const handleDelete = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const handleChange = (id: string, field: 'label' | 'link', value: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= menuItems.length) return;
    const newItems = [...menuItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    setMenuItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMenuItems(menuItems);
      alert('Menu saved successfully!');
    } catch (error) {
      console.error("Error saving menu:", error);
      alert('Failed to save menu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Editor</h1>
          <p className="text-gray-500">Organize your top navigation menu.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn btn-primary btn-sm"
        >
          <Plus size={20} />
          Add Menu Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 max-w-4xl">
        {loading ? (
          <p className="text-gray-500">Loading menu...</p>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {menuItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col text-gray-400">
                    <button 
                      onClick={() => moveItem(i, -1)}
                      disabled={i === 0}
                      className="hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">expand_less</span>
                    </button>
                    <button 
                      onClick={() => moveItem(i, 1)}
                      disabled={i === menuItems.length - 1}
                      className="hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Label</label>
                      <input 
                        type="text" 
                        value={item.label} 
                        onChange={(e) => handleChange(item.id, 'label', e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Link URL</label>
                      <input 
                        type="text" 
                        value={item.link} 
                        onChange={(e) => handleChange(item.id, 'link', e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600 font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded self-end mb-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {menuItems.length === 0 && (
                <p className="text-gray-500 text-center py-4">No menu items yet. Add one above.</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary btn-md"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Menu'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
