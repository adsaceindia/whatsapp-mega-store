import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export function CustomerLoginModal() {
  const { showCustomerLogin, setShowCustomerLogin, loginCustomer } = useCart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showCustomerLogin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please provide Email and password.');
      return;
    }

    setLoading(true);
    const success = await loginCustomer(email.trim(), password.trim());
    setLoading(false);
    if (!success) {
      setError('Invalid login credentials. Please check your Email and Password.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" 
          aria-hidden="true"
          onClick={() => setShowCustomerLogin(false)}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block w-full max-w-sm p-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:my-8 sm:align-middle border border-outline-variant/20">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowCustomerLogin(false)}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-neutral-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface font-space" id="modal-title">
              Sign In to Your Account
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Please sign in with your ID and Password to save items to your Wishlist.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl mb-4 text-center font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email / Phone</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:bg-primary-hover flex justify-center items-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
