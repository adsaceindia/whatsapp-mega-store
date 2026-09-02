import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { OnboardingModal } from '../storeadmin/OnboardingModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package,
  Ticket, 
  Users, 
  Settings, 
  LogOut,
  Image as ImageIcon,
  PanelTop,
  Search,
  LineChart,
  LayoutTemplate,
  HelpCircle
} from 'lucide-react';

export function StoreAdminLayout() {
  const { storeSettings } = useStoreConfig();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const storeName = storeSettings.storeName || 'Store';

  useEffect(() => {
    if (localStorage.getItem('needs_onboarding') === 'true') {
      setShowOnboarding(true);
    }
    

    if (localStorage.getItem('needs_onboarding') === 'true') {
      setShowOnboarding(true);
    }
  
    if (localStorage.getItem('needs_onboarding') === 'true') {
      setShowOnboarding(true);
    }
  }, []);

  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  useEffect(() => {
    // If neither the auth state nor the custom logged in flag is present, redirect to login
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const isActive = (p: string) => path === p || (p !== '/admin' && path.startsWith(p));

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive(to) 
          ? 'bg-primary text-white font-semibold shadow-sm' 
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col overflow-y-auto no-scrollbar">
        <div className="p-4 md:p-6 border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            {storeSettings.storeIcon && <img src={storeSettings.storeIcon} alt="Logo" className="w-6 h-6 object-contain rounded" />}
            <span className="truncate">{storeSettings.storeName}</span>
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">Store Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-6">
          
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Core Operations</p>
            <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/admin/orders" icon={ShoppingCart} label="Orders" />
            <NavItem to="/admin/products" icon={Package} label="Products" />
            <NavItem to="/admin/coupons" icon={Ticket} label="Coupons" />
            <NavItem to="/admin/team" icon={Users} label="Team" />
            <NavItem to="/admin/settings" icon={Settings} label="Settings" />
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Storefront Editing</p>
            <NavItem to="/admin/storefront/branding" icon={LayoutTemplate} label="Site Details (Icon, Name)" />
            <NavItem to="/admin/storefront/menu" icon={PanelTop} label="Menu Editor" />
            <NavItem to="/admin/storefront/banners" icon={ImageIcon} label="Slider Banners" />
            <NavItem to="/admin/storefront/faq" icon={HelpCircle} label="FAQ Manager" />
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Growth & Tracking</p>
            <NavItem to="/admin/growth/seo" icon={Search} label="SEO Options" />
            <NavItem to="/admin/growth/analytics" icon={LineChart} label="Analytics (Google, Meta)" />
          </div>

        </nav>

        <div className="p-4 border-t border-outline-variant sticky bottom-0 bg-surface-container-lowest">
          <Link to="/login" onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-error-container hover:text-error w-full transition-colors font-medium">
            <LogOut size={20} />
            <span>Log out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-surface-container-low flex flex-col">
        <div className="w-full max-w-7xl mx-auto flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full flex-1 flex flex-col"
            >
              <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
          <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
