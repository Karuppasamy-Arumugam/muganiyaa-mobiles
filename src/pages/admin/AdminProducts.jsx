import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function AdminProducts() {
  const { db, updateProduct, deleteProduct, isLoading = false, loadError = null } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionError, setActionError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);

  const safeDb = db && typeof db === 'object' ? db : {};
  const categories = Array.isArray(safeDb.categories) ? safeDb.categories : [];
  const products = Array.isArray(safeDb.products) ? safeDb.products : [];

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      if (!product || typeof product !== 'object') return false;
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && product.status !== selectedStatus) {
        return false;
      }
      if (query) {
        const fields = [product.name, product.brand, product.model]
          .map((value) => String(value || '').toLowerCase());
        if (!fields.some((value) => value.includes(query))) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedStatus, searchTerm]);

  const togglePublishStatus = async (product) => {
    if (updatingProductId || !product?.id) return;
    setUpdatingProductId(product.id);
    const nextStatus = product.status === 'published' ? 'draft' : 'published';
    setActionError('');

    try {
      await updateProduct(product.id, { status: nextStatus });
    } catch (error) {
      console.error('Could not update product visibility:', error);
      setActionError(error.message || 'Could not update product visibility.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete || isDeleting) return;

    setDeleteError('');
    setIsDeleting(true);

    try {
      const result = await deleteProduct(productToDelete.id);
      setProductToDelete(null);

      if (result?.storageCleanupWarning) {
        setActionError(result.storageCleanupWarning);
      }
    } catch (error) {
      console.error('Could not delete product:', error);
      setDeleteError(error.message || 'Could not delete the product.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-5 d-flex align-items-center justify-content-center gap-2 text-muted" role="status" aria-live="polite">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        <span>Loading products…</span>
      </div>
    );
  }

  return (
    <div className="admin-products">
      {/* Title & Add Button Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-3">Product Catalogue</h2>
          <p className="text-muted small mb-0">
            Manage mobile phones, electronic models, prices, variants, specifications, and visibility.
          </p>
        </div>

        <Link to="/store-owner-7f3c9a2e6b41d805/products/new" className="btn btn-brand-primary d-inline-flex align-items-center gap-1">
          <Plus size={18} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 border rounded-3 bg-white mb-4 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
        <div className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search products by model, name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search products by name, brand, or model"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Visibility</option>
              <option value="published">Published</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>

          {/* Count Badge */}
          <div className="col-12 col-md-2 text-md-end">
            <span className="badge-blush">
              {filteredProducts.length} Items Found
            </span>
          </div>
        </div>
      </div>

      {(actionError || loadError) && (
        <div className="alert alert-danger" role="alert" aria-live="assertive">
          {actionError || (loadError ? 'Product data could not be loaded. Refresh the page and try again.' : '')}
        </div>
      )}

      {/* Products Table */}
      <div className="card border rounded-4 bg-white shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        {filteredProducts.length === 0 ? (
                    <div className="p-5 text-center">
            {products.length === 0 ? (
              <>
                <Package size={36} className="text-muted mb-2" aria-hidden="true" />
                <h6 className="fw-bold mb-1">No products added yet</h6>
                <p className="text-muted small mb-3">Add a product to start building your store catalogue.</p>
                <Link to="/store-owner-7f3c9a2e6b41d805/products/new" className="btn btn-brand-primary btn-sm">
                  <Plus size={15} className="me-1" />
                  Add New Product
                </Link>
              </>
            ) : (
              <>
                <Search size={36} className="text-muted mb-2" aria-hidden="true" />
                <h6 className="fw-bold mb-1">No products match these filters</h6>
                <p className="text-muted small mb-3">Change your search or filters to see more products.</p>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>Image</th>
                  <th>Product Details</th>
                  <th>Category & Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Visibility</th>
                  <th className="text-end" style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isPublished = p.status === 'published';
                  const colors = Array.isArray(p.colors) ? p.colors : [];
                  return (
                    <tr key={p.id}>
                      {/* Image Thumbnail */}
                      <td>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            backgroundColor: 'var(--secondary-bg)',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}
                          className="d-flex align-items-center justify-content-center border"
                        >
                          <img
                            src={p.coverImage}
                            alt={p.name}
                            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                          />
                        </div>
                      </td>

                      {/* Product Details */}
                      <td>
                        <div className="fw-bold text-dark">{p.name}</div>
                        <div className="text-muted small">
                          Model: {p.model || 'Standard'} {p.tagline ? `• ${p.tagline}` : ''}
                        </div>
                        {colors.length > 0 && (
                          <div className="d-flex align-items-center gap-1 mt-1">
                            {colors.map((col, idx) => (
                              <span
                                key={idx}
                                className="rounded-circle border d-inline-block"
                                style={{ width: '12px', height: '12px', backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                            <small className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                              ({colors.length} {colors.length === 1 ? 'colour' : 'colours'})
                            </small>
                          </div>
                        )}
                      </td>

                      {/* Category & Brand */}
                      <td>
                        <div className="badge bg-light text-dark border mb-1">{p.brand}</div>
                        <div className="text-muted small">{p.category}</div>
                      </td>

                      {/* Price */}
                      <td>
                        <div className="fw-bold text-dark">
                          ₹{p.sellingPrice?.toLocaleString('en-IN')}
                        </div>
                        {p.originalPrice > p.sellingPrice && (
                          <div className="text-muted small text-decoration-line-through">
                            ₹{p.originalPrice?.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td>
                        <span
                          className={`badge ${
                            p.stockStatus === 'In Stock'
                              ? 'bg-success-subtle text-success'
                              : 'bg-secondary-subtle text-secondary'
                          }`}
                        >
                          {p.stockStatus || 'In Stock'}
                        </span>
                      </td>

                      {/* Visibility Toggle Switch */}
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm py-1 px-2 d-inline-flex align-items-center gap-1 ${
                            isPublished ? 'btn-success-subtle text-success border-success' : 'btn-light text-muted border'
                          }`}
                          onClick={() => togglePublishStatus(p)}
                          disabled={Boolean(updatingProductId)}
                          aria-label={isPublished ? "Unpublish product" : "Publish product"}
                          title={`Click to ${isPublished ? 'Unpublish' : 'Publish'}`}
                        >
                          {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span className="small fw-semibold">{updatingProductId === p.id ? 'Saving…' : isPublished ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-1">
                          {isPublished && (
                            <Link
                              to={`/products/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-secondary btn-sm p-1"
                              title="Preview on Public Website"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}

                          <Link
                            to={`/store-owner-7f3c9a2e6b41d805/products/edit/${p.id}`}
                            className="btn btn-outline-primary btn-sm p-1"
                            title="Edit Product Details"
                          >
                            <Edit size={14} />
                          </Link>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm p-1"
                            onClick={() => { setDeleteError(''); setProductToDelete(p); }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} role="dialog" aria-modal="true" aria-labelledby="deleteProductTitle">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="deleteProductTitle" className="modal-title fw-bold text-danger">Confirm Removal</h5>
                <button type="button" className="btn-close" aria-label="Close delete confirmation" disabled={isDeleting} onClick={() => setProductToDelete(null)} />
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to permanently delete <strong>{productToDelete.name}</strong> from Supabase?
                </p>
                <small className="text-muted">
                  This also removes its database variants, specifications, image records, and offer links. This cannot be undone.
                </small>
              </div>
              {deleteError && (
                <div className="alert alert-danger mx-3 mb-0" role="alert" aria-live="assertive">
                  {deleteError}
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" disabled={isDeleting} onClick={() => setProductToDelete(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger btn-sm" disabled={isDeleting} onClick={confirmDelete}>
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






