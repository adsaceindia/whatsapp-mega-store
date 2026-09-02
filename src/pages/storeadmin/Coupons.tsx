import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Search, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon, Coupon } from '../../services/couponService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { getCurrencySymbol } from '../../utils/currency';
import { useUserRole } from '../../hooks/useUserRole';
import { ConfirmModal } from '../../components/ConfirmModal';

export function Coupons() {
  const { isAdmin } = useUserRole();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Custom delete confirmation states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState<Omit<Coupon, 'id'>>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    active: true,
    spotlight: false,
  });

  useEffect(() => {
    fetchCoupons();
    getGeneralSettings().then(setSettings).catch(console.error);
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Error fetching coupons", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue || 0,
        active: coupon.active !== false,
        spotlight: !!coupon.spotlight,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        active: true,
        spotlight: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discountValue <= 0) return;

    // Convert code to uppercase and remove spaces
    const cleanFormData = {
      ...formData,
      code: formData.code.toUpperCase().replace(/\s+/g, '')
    };

    try {
      if (cleanFormData.spotlight) {
        // Reset other spotlight coupons
        const otherSpotlights = coupons.filter(c => c.spotlight && c.id !== editingCoupon?.id);
        for (const c of otherSpotlights) {
          if (c.id) {
            await updateCoupon(c.id, { spotlight: false });
          }
        }
      }
      if (editingCoupon && editingCoupon.id) {
        await updateCoupon(editingCoupon.id, cleanFormData);
      } else {
        await addCoupon(cleanFormData);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error("Error saving coupon", error);
    }
  };

  const toggleSpotlight = async (coupon: Coupon) => {
    if (!coupon.id) return;
    try {
      const isNowSpotlight = !coupon.spotlight;
      if (isNowSpotlight) {
        const otherSpotlights = coupons.filter(c => c.spotlight && c.id !== coupon.id);
        for (const c of otherSpotlights) {
          if (c.id) {
            await updateCoupon(c.id, { spotlight: false });
          }
        }
      }
      await updateCoupon(coupon.id, { spotlight: isNowSpotlight });
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling spotlight coupon", error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon(deleteId);
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon", error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    if (!coupon.id) return;
    try {
      await updateCoupon(coupon.id, { active: !coupon.active });
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon", error);
    }
  };

  const symbol = getCurrencySymbol(settings?.currency);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="text-primary" />
            Discount Coupons
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage promotional codes for your customers.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-primary btn-sm"
          >
            <Plus size={20} />
            Create Coupon
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search coupons..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-sm font-semibold text-gray-900">Code</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900">Discount</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900">Min Order</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900">Spotlight</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading coupons...</td></tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Ticket size={48} className="mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">No coupons found</p>
                      <p className="text-sm">Create a new coupon to offer discounts.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {coupon.discountType === 'percentage' 
                        ? <span className="text-emerald-600 font-bold">{coupon.discountValue}% OFF</span>
                        : <span className="text-emerald-600 font-bold">{symbol}{coupon.discountValue.toFixed(2)} OFF</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {(coupon.minOrderValue && coupon.minOrderValue > 0) ? `${symbol}${coupon.minOrderValue}` : 'None'}
                    </td>
                    <td className="py-3 px-4">
                      <label className={`relative inline-flex items-center ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                        <input 
                          type="checkbox" 
                          disabled={!isAdmin}
                          className="sr-only peer" 
                          checked={coupon.active !== false} 
                          onChange={() => toggleActive(coupon)} 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <label className={`relative inline-flex items-center ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                        <input 
                          type="checkbox" 
                          disabled={!isAdmin}
                          className="sr-only peer" 
                          checked={!!coupon.spotlight} 
                          onChange={() => toggleSpotlight(coupon)} 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button 
                              onClick={() => handleOpenModal(coupon)}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => coupon.id && handleDeleteClick(coupon.id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Admin only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  placeholder="e.g. SUMMER20"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary uppercase" 
                />
                <p className="text-xs text-gray-500 mt-1">Codes will be saved in uppercase without spaces.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select 
                    value={formData.discountType}
                    onChange={e => setFormData({...formData, discountType: e.target.value as 'percentage'|'fixed'})}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ({symbol})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input 
                    type="number" 
                    min="1"
                    step={formData.discountType === 'percentage' ? "1" : "0.01"}
                    value={formData.discountValue || ''} 
                    onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})} 
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Value (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{symbol}</span>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.minOrderValue || ''} 
                    onChange={e => setFormData({...formData, minOrderValue: parseFloat(e.target.value)})} 
                    className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-2">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Active Status</p>
                    <p className="text-xs text-gray-500">Can customers use this right now?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.active} 
                      onChange={e => setFormData({...formData, active: e.target.checked})} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <div>
                    <p className="font-medium text-amber-950 text-sm">Spotlight Coupon</p>
                    <p className="text-xs text-amber-800/80">Display this in Vibe Consultation results.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!!formData.spotlight} 
                      onChange={e => setFormData({...formData, spotlight: e.target.checked})} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action is permanent and cannot be undone."
        confirmText="Delete Coupon"
        type="danger"
      />
    </div>
  );
}
