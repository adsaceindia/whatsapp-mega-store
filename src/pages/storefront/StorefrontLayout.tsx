import React, { useEffect } from 'react';
import { getGeneralSettings, getAnalyticsSettings } from '../../services/settingsService';
import { Outlet, useLocation } from 'react-router';
import { TopNavBar } from '../../components/storefront/TopNavBar';
import { BottomNavBar } from '../../components/storefront/BottomNavBar';
import { MobileDrawer } from '../../components/storefront/MobileDrawer';
import { CustomerLoginModal } from '../../components/storefront/CustomerLoginModal';
import { Footer } from '../../components/storefront/Footer';
import { AnimatePresence, motion } from 'motion/react';

export function StorefrontLayout() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change to ensure a pristine viewing state
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    // Restore persistent dark mode theme on mount
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    getGeneralSettings().then(settings => {
      if (settings?.currency) {
        window.storeCurrency = settings.currency;
      }
    }).catch(console.error);

    // Dynamically inject Google Tag Manager (GTM)
    getAnalyticsSettings().then(analytics => {
      if (analytics && analytics.gtmId) {
        const gtmContainerId = analytics.gtmId.trim();
        if (gtmContainerId && !window.document.getElementById('gtm-script-injector')) {
          const script = window.document.createElement('script');
          script.id = 'gtm-script-injector';
          script.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmContainerId}');
          `;
          window.document.head.appendChild(script);

          const noscript = window.document.createElement('noscript');
          noscript.id = 'gtm-noscript-injector';
          noscript.innerHTML = `
            <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId}"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>
          `;
          window.document.body.appendChild(noscript);
        }
      }
    }).catch(err => console.error("Failed to load analytics GTM settings", err));
  }, []);

  return (
    <div className="bg-neutral-50 dark:bg-slate-950 text-neutral-900 dark:text-slate-100 min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-20 md:pb-0">
      {/* Top Header */}
      <TopNavBar />
      
      {/* Drawer */}
      <MobileDrawer />

      {/* Main Content Area */}
      <main className="flex-1 pt-14 md:pt-20 w-full max-w-7xl mx-auto px-0 md:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Desktop Footer (Hidden on Mobile App View) */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Floating Bottom App Bar */}
      <BottomNavBar />
      
      {/* Login Modal / Bottom Sheet */}
      <CustomerLoginModal />
    </div>
  );
}
