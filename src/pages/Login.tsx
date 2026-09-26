import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { LogIn, Store, Mail, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('Please provide Email or Mobile Number and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('user_role', data.user?.role || 'Admin');
        localStorage.setItem('user_id', data.user?.id || 'admin_default');
        localStorage.setItem('user_email', data.user?.email || identifier.trim());
        navigate('/admin');
      } else {
        setError(data.error || 'Invalid login credentials. Please verify your Email/Mobile or Password.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Authentication failed. Verify database connectivity.');
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
            <Store size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2 text-center">
            Store Administrator
          </h1>
          <p className="text-gray-500 text-sm text-center max-w-[280px]">
            Log in to manage your e-commerce operations, orders, and configuration parameters.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-xl mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-[18px] mt-0.5 text-rose-500">error</span>
            <p className="flex-1 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Registered Email or Mobile</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Email Address or Mobile Number"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full border border-gray-300 rounded-xl bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Secret Password</label>
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
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            Log In securely
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-500">
          Want to start your own store?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
