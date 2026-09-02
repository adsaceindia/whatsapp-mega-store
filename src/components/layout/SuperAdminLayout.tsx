import { Outlet, Link } from 'react-router';
import { LayoutDashboard, Store, Users, Settings, LogOut } from 'lucide-react';

export function SuperAdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 md:p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">SaaS Admin</h1>
          <p className="text-slate-400 text-xs mt-1">Platform Control</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/superadmin" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/superadmin/stores" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Store size={20} />
            <span className="font-medium">Stores</span>
          </Link>
          <Link to="/superadmin/plans" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={20} />
            <span className="font-medium">Plans & Billing</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white w-full transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
