import { Routes, Route, Navigate, useLocation } from 'react-router';
import React, { useEffect, Suspense } from 'react';
import { trackPageView } from './utils/analytics';
import { InterestingLoader } from './components/storefront/InterestingLoader';

const StoreAdminLayout = React.lazy(() => import('./components/layout/StoreAdminLayout').then(m => ({ default: m.StoreAdminLayout })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const StoreAdminDashboard = React.lazy(() => import('./pages/storeadmin/Dashboard').then(m => ({ default: m.StoreAdminDashboard })));
const Products = React.lazy(() => import('./pages/storeadmin/Products').then(m => ({ default: m.Products })));
const Coupons = React.lazy(() => import('./pages/storeadmin/Coupons').then(m => ({ default: m.Coupons })));
const Orders = React.lazy(() => import('./pages/storeadmin/Orders').then(m => ({ default: m.Orders })));
const Team = React.lazy(() => import('./pages/storeadmin/Team').then(m => ({ default: m.Team })));
const Settings = React.lazy(() => import('./pages/storeadmin/Settings').then(m => ({ default: m.Settings })));
const Branding = React.lazy(() => import('./pages/storeadmin/Branding').then(m => ({ default: m.Branding })));
const Menu = React.lazy(() => import('./pages/storeadmin/Menu').then(m => ({ default: m.Menu })));
const Banners = React.lazy(() => import('./pages/storeadmin/Banners').then(m => ({ default: m.Banners })));
const Seo = React.lazy(() => import('./pages/storeadmin/Seo').then(m => ({ default: m.Seo })));
const Analytics = React.lazy(() => import('./pages/storeadmin/Analytics').then(m => ({ default: m.Analytics })));
const FAQs = React.lazy(() => import('./pages/storeadmin/FAQs').then(m => ({ default: m.FAQs })));

const StorefrontLayout = React.lazy(() => import('./pages/storefront/StorefrontLayout').then(m => ({ default: m.StorefrontLayout })));
const StorefrontHome = React.lazy(() => import('./pages/storefront/StorefrontHome').then(m => ({ default: m.StorefrontHome })));
const StorefrontCategories = React.lazy(() => import('./pages/storefront/StorefrontCategories').then(m => ({ default: m.StorefrontCategories })));
const StorefrontCategoryProducts = React.lazy(() => import('./pages/storefront/StorefrontCategoryProducts').then(m => ({ default: m.StorefrontCategoryProducts })));
const StorefrontProduct = React.lazy(() => import('./pages/storefront/StorefrontProduct').then(m => ({ default: m.StorefrontProduct })));
const StorefrontCart = React.lazy(() => import('./pages/storefront/StorefrontCart').then(m => ({ default: m.StorefrontCart })));
const OrderConfirmation = React.lazy(() => import('./pages/storefront/OrderConfirmation').then(m => ({ default: m.OrderConfirmation })));
const OrderTracking = React.lazy(() => import('./pages/storefront/OrderTracking').then(m => ({ default: m.OrderTracking })));
const InfoPages = React.lazy(() => import('./pages/storefront/InfoPages').then(m => ({ default: m.InfoPages })));
const ThankYou = React.lazy(() => import('./pages/storefront/ThankYou').then(m => ({ default: m.ThankYou })));

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

const FallbackLoader = () => (
  <InterestingLoader message="Loading Page..." fullScreen />
);

export default function App() {
  return (
    <>
      <PageTracker />
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Store Admin Routes */}
          <Route path="/admin" element={<StoreAdminLayout />}>
            <Route index element={<StoreAdminDashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
            <Route path="storefront/branding" element={<Branding />} />
            <Route path="storefront/menu" element={<Menu />} />
            <Route path="storefront/banners" element={<Banners />} />
            <Route path="storefront/faq" element={<FAQs />} />
            <Route path="growth/seo" element={<Seo />} />
            <Route path="growth/analytics" element={<Analytics />} />
          </Route>

          {/* Storefront Routes */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="categories" element={<StorefrontCategories />} />
            <Route path="category/:categoryId" element={<StorefrontCategoryProducts />} />
            <Route path="product/:id" element={<StorefrontProduct />} />
            <Route path="cart" element={<StorefrontCart />} />
            <Route path="checkout" element={<OrderConfirmation />} />
            <Route path="thank-you" element={<ThankYou />} />
            <Route path="track" element={<OrderTracking />} />
            <Route path="info" element={<InfoPages />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
