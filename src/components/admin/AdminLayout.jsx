import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Image,
  Wrench,
  Inbox,
  FileText,
  PhoneCall,
  Bot,
  RotateCcw,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Plus
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const { db } = useData();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const newEnquiriesCount = (Array.isArray(db?.enquiries) ? db.enquiries : []).filter((e) => e.status === 'New').length;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
      navigate('/store-owner-7f3c9a2e6b41d805/login', { replace: true });
    } catch (error) {
      console.error('Admin sign-out failed:', error);
      setLogoutError('Could not sign out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { to: '/store-owner-7f3c9a2e6b41d805', end: true, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/store-owner-7f3c9a2e6b41d805/products', label: 'Products', icon: Package },
    { to: '/store-owner-7f3c9a2e6b41d805/categories', label: 'Categories & Brands', icon: FolderTree },
    { to: '/store-owner-7f3c9a2e6b41d805/offers', label: 'Offers & EMI', icon: Tag },
    { to: '/store-owner-7f3c9a2e6b41d805/banners', label: 'Hero Banners', icon: Image },
    { to: '/store-owner-7f3c9a2e6b41d805/services', label: 'Store Services', icon: Wrench },
    { to: '/store-owner-7f3c9a2e6b41d805/enquiries', label: 'Customer Enquiries', icon: Inbox, badge: newEnquiriesCount },
    { to: '/store-owner-7f3c9a2e6b41d805/content', label: 'Website Content', icon: FileText },
    { to: '/store-owner-7f3c9a2e6b41d805/contact', label: 'Contact & Hours', icon: PhoneCall },
    { to: '/store-owner-7f3c9a2e6b41d805/chatbot', label: 'Chatbot Settings', icon: Bot },
    { to: '/store-owner-7f3c9a2e6b41d805/demo', label: 'Store Data & Maintenance', icon: RotateCcw }
  ];

  return (
    <div className="admin-container d-flex flex-column min-vh-100 bg-light">
      {/* Top Admin Header Bar */}
      <header className="bg-white border-bottom py-2 px-3 sticky-top" style={{ zIndex: 1040, borderColor: 'var(--border-color)' }}>
        <div className="d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-lg-none p-1"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle Sidebar"
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <BrandLogo size="sm" />
            <span className="badge bg-danger-subtle text-danger fw-bold ms-1" style={{ fontSize: '0.72rem' }}>
              Owner Portal
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
              title="Open Public Website in New Tab"
            >
              <span>Live Website</span>
              <ExternalLink size={14} />
            </Link>

            <Link to="/store-owner-7f3c9a2e6b41d805/products/new" className="btn btn-brand-primary btn-sm d-none d-sm-inline-flex align-items-center gap-1">
              <Plus size={16} />
              <span>Add Product</span>
            </Link>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
              disabled={isLoggingOut}
              onClick={handleLogout}
              title="End Admin Session"
            >
              <LogOut size={14} />
              <span className="d-none d-md-inline">{isLoggingOut ? 'Signing out…' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {logoutError && (
        <div className="alert alert-danger rounded-0 mb-0" role="alert" aria-live="assertive">
          {logoutError}
        </div>
      )}

      {/* Main Admin Wrapper (Sidebar + Body) */}
      <div className="d-flex flex-grow-1 position-relative">
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
            style={{ zIndex: 1045 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`admin-sidebar bg-white ${
            mobileSidebarOpen ? 'position-fixed top-0 start-0 h-100 shadow-lg' : 'd-none d-lg-flex'
          }`}
          style={{ zIndex: 1050, width: '260px' }}
        >
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between d-lg-none">
            <span className="fw-bold text-dark">Admin Navigation</span>
            <button type="button" className="btn-close" onClick={() => setMobileSidebarOpen(false)} />
          </div>

          <div className="p-3">
            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
              Management Sections
            </small>
          </div>

          <nav className="d-flex flex-column flex-grow-1 overflow-y-auto pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.7rem' }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-top bg-light mt-auto">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle bg-success" style={{ width: '8px', height: '8px' }} />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Admin Workspace
              </small>
            </div>
          </div>
        </aside>

        {/* Dynamic Outlet Page Content */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}



