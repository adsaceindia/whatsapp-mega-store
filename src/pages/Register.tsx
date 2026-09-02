import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Store, Mail, Key, UserPlus, Eye, EyeOff, Smartphone } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim() || !storeName.trim()) {
      setError('Please provide Store Name, Email, and Password.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          mobile: mobile.trim() || undefined,
          password: password.trim(),
          storeName: storeName.trim(),
          role: 'Admin'
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('user_role', 'Admin');
        localStorage.setItem('user_id', data.id);
        localStorage.setItem('user_email', data.email);
        navigate('/admin');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Registration failed. Verify server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl" />

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 p-8 md:p-10 w-full max-w-md relative z-10 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
            <UserPlus size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2 text-center">
            Create Your Store
          </h1>
          <p className="text-gray-500 text-sm text-center max-w-[280px]">
            Set up your WhatsApp e-commerce store with simple ID and password login.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-xl mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-[18px] mt-0.5 text-rose-500">error</span>
            <p className="flex-1 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Store Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="My Bespoke Boutique"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input 
                type="email"
                placeholder="owner@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Mobile Number (Optional)</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="+1234567890"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full mt-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <UserPlus size={18} />
            )}
            Register Store Account
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-500">
          Already have a store account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
