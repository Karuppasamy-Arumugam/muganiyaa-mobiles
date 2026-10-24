import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/common/Header';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WishlistDrawer from './components/common/WishlistDrawer';
import FloatingActions from './components/common/FloatingActions';

import HomePage from './pages/public/HomePage';
import MobilesPage from './pages/public/MobilesPage';
import CategoriesPage from './pages/public/CategoriesPage';
import ProductDetailsPage from './pages/public/ProductDetailsPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPage from './pages/public/PrivacyPage';
import NotFoundPage from './pages/public/NotFoundPage';
import OffersPage from './pages/public/OffersPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductEditor from './pages/admin/AdminProductEditor';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOffers from './pages/admin/AdminOffers';
import AdminBanners from './pages/admin/AdminBanners';
import AdminServices from './pages/admin/AdminServices';
import AdminEnquiries from './pages/admin/AdminEnquiries';
import AdminContent from './pages/admin/AdminContent';
import AdminContact from './pages/admin/AdminContact';
import AdminChatbot from './pages/admin/AdminChatbot';
import AdminMaintenance from './pages/admin/AdminMaintenance';

import { useAuth } from './context/AuthContext';

const ADMIN_PATH = '/store-owner-7f3c9a2e6b41d805';
const ADMIN_LOGIN_PATH = `${ADMIN_PATH}/login`;

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <p className="text-muted mb-0">Checking admin access…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();

  const isAdminRoute =
    location.pathname === ADMIN_PATH ||
    location.pathname.startsWith(`${ADMIN_PATH}/`);

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      {!isAdminRoute && (
        <>
          <Header />
          <Navbar />
        </>
      )}

      <div className="flex-grow-1">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/mobiles" element={<MobilesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/offers" element={<OffersPage />} />

          {/* Admin sign-in */}
          <Route path={ADMIN_LOGIN_PATH} element={<AdminLoginPage />} />

          {/* Protected admin pages */}
          <Route
            path={ADMIN_PATH}
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductEditor />} />
            <Route path="products/edit/:id" element={<AdminProductEditor />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="contact" element={<AdminContact />} />
            <Route path="chatbot" element={<AdminChatbot />} />
            <Route path="maintenance" element={<AdminMaintenance />} />
          </Route>

          {/* Unknown URLs */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {!isAdminRoute && (
        <>
          <Footer />
          <WishlistDrawer />
          <FloatingActions />
        </>
      )}
    </div>
  );
}