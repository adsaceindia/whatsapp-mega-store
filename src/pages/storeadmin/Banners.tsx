import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import { getBanners, addBanner, deleteBanner, updateBanner, Banner } from '../../services/bannerService';
import { useUserRole } from '../../hooks/useUserRole';
import { ImageUploader } from '../../components/ImageUploader';
import { ConfirmModal } from '../../components/ConfirmModal';

export function Banners() {
  const { isAdmin } = useUserRole();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom delete confirmation states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    title: '',
    image: '',
    subtitle: '',
    tag: '',
    buttonText: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newBanner.title || !newBanner.image) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      if (editingId) {
        await updateBanner(editingId, newBanner);
      } else {
        await addBanner(newBanner as Banner);
      }
      setIsAdding(false);
      setEditingId(null);
      setNewBanner({ title: '', image: '', subtitle: '', tag: '', buttonText: '' });
      fetchBanners();
    } catch (error) {
      console.error("Error saving banner", error);
    }
  };

  const handleEdit = (banner: Banner) => {
    if (banner.id) {
      setEditingId(banner.id);
      setNewBanner(banner);
      setIsAdding(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBanner(deleteId);
      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner", error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slider Banners</h1>
          <p className="text-gray-500">Manage the carousel banners on your homepage.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setNewBanner({ title: '', image: '', subtitle: '', tag: '', buttonText: '' });
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={20} />
            Add Banner
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8 max-w-4xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit Banner' : 'Add New Banner'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Title (Required)</label>
              <input 
                required
                type="text" 
                value={newBanner.title} 
                onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                className="w-full p-3 border-2 border-outline-variant rounded-xl bg-surface-container-low outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
             <div>
               <ImageUploader 
                 label="Banner Image" 
                 required 
                 value={newBanner.image || ''} 
                 onChange={val => setNewBanner({...newBanner, image: val})} 
               />
             </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Subtitle</label>
              <input 
                type="text" 
                value={newBanner.subtitle || ''} 
                onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})}
                className="w-full p-3 border-2 border-outline-variant rounded-xl bg-surface-container-low outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Tag (e.g. NEW ARRIVALS)</label>
              <input 
                type="text" 
                value={newBanner.tag || ''} 
                onChange={e => setNewBanner({...newBanner, tag: e.target.value})}
                className="w-full p-3 border-2 border-outline-variant rounded-xl bg-surface-container-low outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Button Text</label>
              <input 
                type="text" 
                value={newBanner.buttonText || ''} 
                onChange={e => setNewBanner({...newBanner, buttonText: e.target.value})}
                className="w-full p-3 border-2 border-outline-variant rounded-xl bg-surface-container-low outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="btn btn-primary btn-md"
            >
              Save Banner
            </button>
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNewBanner({ title: '', image: '', subtitle: '', tag: '', buttonText: '' });
              }}
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-medium shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading banners...</p>
      ) : (
        <div className="space-y-6">
          {banners.length === 0 ? (
            <p className="text-gray-500">No banners found. Add some to display on your homepage.</p>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-48 h-24 rounded-lg overflow-hidden flex-shrink-0 relative bg-gray-100">
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-gray-900">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>}
                  <p className="text-xs text-gray-500 font-mono mt-1 truncate max-w-sm">{banner.image}</p>
                </div>
                <div className="flex gap-2">
                  {isAdmin ? (
                    <>
                      <button 
                        onClick={() => handleEdit(banner)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => banner.id && handleDeleteClick(banner.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Admin only</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action is permanent and cannot be undone."
        confirmText="Delete Banner"
        type="danger"
      />
    </div>
  );
}
