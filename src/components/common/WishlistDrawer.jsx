import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, ArrowRight, ShoppingBag, Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useData } from '../../context/DataContext';

export default function WishlistDrawer() {
  const { isWishlistOpen, closeWishlist, wishlistIds, removeFromWishlist, clearWishlist } = useWishlist();
  const { publishedProducts: productsFromStore = [], catalogLoading = false, catalogError = '' } = useData();
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Resolve saved IDs against the public catalogue so unpublished products do not appear.
  const publicProducts = Array.isArray(productsFromStore)
    ? productsFromStore.filter((product) => product && typeof product === 'object')
    : [];
  const wishlistProducts = wishlistIds
    .map((id) => publicProducts.find((product) => product.id === id))
    .filter(Boolean);

  // Keyboard accessibility: ESC key to close & Focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isWishlistOpen) {
        closeWishlist();
      }
    };

    if (isWishlistOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus close button on open
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isWishlistOpen, closeWishlist]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isWishlistOpen ? 'show' : ''}`}
        onClick={closeWishlist}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className={`drawer-panel-right ${isWishlistOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist Drawer"
      >
        {/* Drawer Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-circle" style={{ backgroundColor: 'var(--soft-blush)', color: 'var(--primary-red)' }}>
              <Heart size={18} fill="#B72E35" />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">My Wishlist</h6>
              <small className="text-muted">
                {catalogLoading
                  ? 'Loading saved items…'
                  : catalogError
                    ? 'Saved items are temporarily unavailable'
                    : <>{wishlistProducts.length}{' '}{wishlistProducts.length === 1 ? 'item' : 'items'} saved on this device</>}
              </small>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-light btn-sm rounded-circle p-2"
            onClick={closeWishlist}
            aria-label="Close wishlist drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-grow-1 overflow-y-auto p-3">
          {catalogLoading ? (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4" role="status" aria-live="polite">
              <span className="spinner-border text-danger mb-3" aria-hidden="true" />
              <h6 className="fw-bold mb-1">Loading your wishlist</h6>
              <p className="text-muted small mb-0">We’re checking which saved products are still available.</p>
            </div>
          ) : catalogError ? (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4" role="alert">
              <div className="p-3 rounded-circle mb-3" style={{ backgroundColor: 'var(--secondary-bg)' }}>
                <ShoppingBag size={40} className="text-muted" />
              </div>
              <h6 className="fw-bold mb-1">Saved products couldn’t be loaded</h6>
              <p className="text-muted small mb-4" style={{ maxWidth: '250px' }}>
                Your saved list is on this device. Please try again later or browse the catalogue.
              </p>
              <Link to="/categories" onClick={closeWishlist} className="btn btn-brand-primary btn-sm px-4 py-2">
                Browse catalogue <ArrowRight size={15} className="ms-1" />
              </Link>
            </div>
          ) : wishlistProducts.length === 0 ? (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
              <div className="p-4 rounded-circle mb-3" style={{ backgroundColor: 'var(--secondary-bg)' }}>
                <ShoppingBag size={48} className="text-muted" />
              </div>
              <h6 className="fw-bold mb-1">Your wishlist is empty</h6>
              <p className="text-muted small mb-4" style={{ maxWidth: '240px' }}>
                Tap the heart icon on any mobile phone or appliance to save it for quick reference!
              </p>
              <Link
                to="/categories"
                className="btn btn-brand-primary btn-sm px-4 py-2 d-inline-flex align-items-center gap-2"
                onClick={closeWishlist}
              >
                Explore catalogue <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {wishlistProducts.map((product) => (
                <div
                  key={product.id}
                  className="card p-2 border"
                  style={{ borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                >
                  <div className="d-flex gap-3 align-items-center">
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        backgroundColor: 'var(--secondary-bg)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <img
                        src={product.coverImage}
                        alt={product.name}
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="text-uppercase text-danger fw-bold" style={{ fontSize: '0.7rem' }}>
                        {product.brand}
                      </div>
                      <h6 className="fw-bold mb-1 text-truncate" style={{ fontSize: '0.9rem' }} title={product.name}>
                        <Link
                          to={`/products/${product.slug}`}
                          onClick={closeWishlist}
                          className="text-dark text-decoration-none hover-red"
                        >
                          {product.name}
                        </Link>
                      </h6>
                      <div className="d-flex align-items-baseline gap-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                          ₹{product.sellingPrice?.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice > product.sellingPrice && (
                          <span className="text-muted text-decoration-line-through small" style={{ fontSize: '0.8rem' }}>
                            ₹{product.originalPrice?.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`badge ${
                            product.stockStatus === 'In Stock' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {product.stockStatus}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm p-1 border-0"
                        onClick={() => removeFromWishlist(product.id)}
                        title="Remove item"
                        aria-label="Remove item from wishlist"
                      >
                        <Trash2 size={16} />
                      </button>
                      <Link
                        to={`/products/${product.slug}`}
                        onClick={closeWishlist}
                        className="btn btn-brand-soft btn-sm p-1 px-2 d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <span>View</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {!catalogLoading && !catalogError && wishlistProducts.length > 0 && (
          <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between">
            <button
              type="button"
              className="btn btn-link text-muted text-decoration-none btn-sm"
              onClick={clearWishlist}
            >
              Clear All
            </button>
            <Link
              to="/mobiles"
              onClick={closeWishlist}
              className="btn btn-brand-primary btn-sm px-3"
            >
              Continue Browsing
            </Link>
          </div>
        )}
      </div>
    </>
  );
}


