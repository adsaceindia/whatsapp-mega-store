import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Phone, DollarSign, Loader2, Rocket } from 'lucide-react';
import { saveStoreSettings, getStoreSettings, saveGeneralSettings, getGeneralSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      getStoreSettings().then(settings => {
        if (settings.storeName) setStoreName(settings.storeName);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentStoreSettings = await getStoreSettings();
      await saveStoreSettings({
        ...currentStoreSettings,
        storeName: storeName || currentStoreSettings.storeName
      });

      const currentGeneralSettings = await getGeneralSettings();
      await saveGeneralSettings({
        ...currentGeneralSettings,
        whatsappNumber: whatsappNumber || currentGeneralSettings.whatsappNumber,
        currency: currency || currentGeneralSettings.currency
      });

      localStorage.removeItem('needs_onboarding');
      onClose();
    } catch (err) {
      console.error('Failed to save onboarding settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm border border-primary/20">
                  <Store size={32} strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Welcome to your Store!</h2>
              <p className="text-gray-500 text-center text-sm mb-6">Let's set up a few basic details to get your storefront ready.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Store Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="My Awesome Store"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Primary Contact (WhatsApp)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Store Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white appearance-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg w-full mt-6"
                >
                  {loading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Rocket className="w-4.5 h-4.5" />
                  )}
                  Launch Store
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
