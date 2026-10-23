import React, { useMemo, useState } from 'react';
import { Edit, Trash2, AlertTriangle, Plus, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

const makeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminCategories() {
  const {
    db,
    catalogLoading,
    catalogError,
    addCategory,
    updateCategory,
    deleteCategory,
    addBrand,
    updateBrand,
    deleteBrand
  } = useData();

  const categories = db.categories || [];
  const brands = db.brands || [];
  const products = db.products || [];
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      `${category.name || ''} ${category.slug || ''}`.toLowerCase().includes(query)
    );
  }, [categories, categorySearch]);

  const filteredBrands = useMemo(() => {
    const query = brandSearch.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter((brand) =>
      `${brand.name || ''} ${brand.slug || ''}`.toLowerCase().includes(query)
    );
  }, [brands, brandSearch]);

  const [editingCat, setEditingCat] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [catToDelete, setCatToDelete] = useState(null);

  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [brandIsActive, setBrandIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingBrandId, setDeletingBrandId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoryProductCount = (slug) =>
    products.filter((product) => product.categorySlug === slug).length;

  const brandProductCount = (name) =>
    products.filter(
      (product) =>
        String(product.brand || '').trim().toLowerCase() ===
        String(name || '').trim().toLowerCase()
    ).length;

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    const name = newCatName.trim();
    if (!name) return;

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const categoryData = { name, slug: makeSlug(name) };

      if (editingCat) {
        await updateCategory(editingCat.id, categoryData);
        setSuccess(`Category "${name}" was updated.`);
      } else {
        await addCategory(categoryData);
        setSuccess(`Category "${name}" was added.`);
      }

      setEditingCat(null);
      setNewCatName('');
    } catch (saveError) {
      setError(saveError.message || 'Could not save the category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryEdit = (category) => {
    setError('');
    setSuccess('');
    setEditingCat(category);
    setNewCatName(category.name);
  };

  const cancelCategoryEdit = () => {
    setEditingCat(null);
    setNewCatName('');
    setError('');
    setSuccess('');
  };

  const confirmCategoryDelete = async () => {
    if (!catToDelete) return;

    setError('');
    setSuccess('');
    setDeletingId(catToDelete.id);

    try {
      await deleteCategory(catToDelete.id);
      setSuccess(`Category "${catToDelete.name}" was deleted.`);
      setCatToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete the category.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBrandSubmit = async (event) => {
    event.preventDefault();

    const name = brandName.trim();
    if (!name) return;

    setError('');
    setSuccess('');
    setIsSavingBrand(true);

    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, {
          name,
          slug: makeSlug(name),
          isActive: brandIsActive
        });
        setSuccess(`Brand "${name}" was updated.`);
      } else {
        await addBrand({
          name,
          slug: makeSlug(name),
          isActive: brandIsActive
        });
        setSuccess(`Brand "${name}" was added.`);
      }

      setEditingBrand(null);
      setBrandName('');
      setBrandIsActive(true);
    } catch (saveError) {
      setError(saveError.message || 'Could not save the brand.');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleBrandEdit = (brand) => {
    setError('');
    setSuccess('');
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandIsActive(brand.isActive);
  };

  const cancelBrandEdit = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandIsActive(true);
    setError('');
    setSuccess('');
  };

  const handleBrandDelete = async (brand) => {
    const linkedCount = brandProductCount(brand.name);

    if (linkedCount > 0) {
      setError(
        `Brand "${brand.name}" is assigned to ${linkedCount} product(s). Reassign those products before deleting it.`
      );
      setSuccess('');
      return;
    }

    const confirmed = window.confirm(
      `Delete the brand "${brand.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setDeletingBrandId(brand.id);

    try {
      await deleteBrand(brand.id);
      setSuccess(`Brand "${brand.name}" was deleted.`);
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete the brand.');
    } finally {
      setDeletingBrandId(null);
    }
  };

  const deletingCategoryProductCount = catToDelete
    ? categoryProductCount(catToDelete.slug)
    : 0;

  return (
    <div className="admin-categories pb-5">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1 fs-3">
          Categories &amp; Brands
        </h2>
        <p className="text-muted small mb-0">
          Manage the categories and brands available in your product catalogue.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success py-2 small" role="status">
          {success}
        </div>
      )}

      {catalogError && (
        <div className="alert alert-danger py-2 small" role="alert">
          {catalogError} Refresh the page to try loading categories and brands again.
        </div>
      )}

      <section className="mb-5">
        <h4 className="fw-bold text-dark mb-3">Categories</h4>

        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div
              className="card p-4 border rounded-4 bg-white shadow-sm"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <h5 className="fw-bold text-dark mb-3">
                {editingCat
                  ? `Edit Category: ${editingCat.name}`
                  : 'Add New Category'}
              </h5>

              <form onSubmit={handleCategorySubmit}>
                <div className="mb-3">
                  <label
                    htmlFor="categoryName"
                    className="form-label small fw-bold text-dark"
                  >
                    Category Name *
                  </label>
                  <input
                    id="categoryName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Smart Watches"
                    value={newCatName}
                    onChange={(event) => setNewCatName(event.target.value)}
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-brand-primary btn-sm flex-grow-1"
                    disabled={isSaving || !newCatName.trim()}
                  >
                    {isSaving
                      ? 'Saving…'
                      : editingCat
                        ? 'Save Changes'
                        : 'Create Category'}
                  </button>

                  {editingCat && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={cancelCategoryEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div
              className="card border rounded-4 bg-white shadow-sm overflow-hidden"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="p-3 border-bottom bg-light fw-bold text-dark">
                Configured Categories ({categories.length})
              </div>

              <div className="p-3 border-bottom">
                <label className="visually-hidden" htmlFor="categorySearch">Search categories</label>
                <input
                  id="categorySearch"
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search categories by name or slug"
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                  disabled={catalogLoading || Boolean(catalogError)}
                />
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Category Name</th>
                      <th>Slug</th>
                      <th>Linked Products</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogLoading && (
                      <tr><td colSpan="4" className="p-4 text-center text-muted small">
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Loading categories…
                      </td></tr>
                    )}
                    {!catalogLoading && !catalogError && filteredCategories.map((category) => {
                      const linkedCount = categoryProductCount(category.slug);

                      return (
                        <tr key={category.id}>
                          <td className="fw-bold text-dark">{category.name}</td>
                          <td className="text-muted small">
                            <code>{category.slug}</code>
                          </td>
                          <td>{linkedCount}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm p-1 me-1"
                              onClick={() => handleCategoryEdit(category)}
                              title="Edit category"
                              aria-label={`Edit ${category.name}`}
                              disabled={isSaving || deletingId !== null}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm p-1"
                              onClick={() => {
                                setError('');
                                setSuccess('');
                                setCatToDelete(category);
                              }}
                              title="Delete category"
                              aria-label={`Delete ${category.name}`}
                              disabled={isSaving || deletingId !== null}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!catalogLoading && !catalogError && filteredCategories.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-4 text-center text-muted small"
                        >
                          {categories.length === 0 ? 'No categories have been added yet.' : 'No categories match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h4 className="fw-bold text-dark mb-3">Brands</h4>

        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div
              className="card p-4 border rounded-4 bg-white shadow-sm"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <h5 className="fw-bold text-dark mb-3">
                {editingBrand
                  ? `Edit Brand: ${editingBrand.name}`
                  : 'Add New Brand'}
              </h5>

              <form onSubmit={handleBrandSubmit}>
                <div className="mb-3">
                  <label
                    htmlFor="brandName"
                    className="form-label small fw-bold text-dark"
                  >
                    Brand Name *
                  </label>
                  <input
                    id="brandName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Samsung"
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                    required
                    disabled={isSavingBrand}
                  />
                </div>

                <div className="form-check mb-3">
                  <input
                    id="brandIsActive"
                    type="checkbox"
                    className="form-check-input"
                    checked={brandIsActive}
                    onChange={(event) => setBrandIsActive(event.target.checked)}
                    disabled={isSavingBrand}
                  />
                  <label
                    htmlFor="brandIsActive"
                    className="form-check-label small"
                  >
                    Active and available in product forms
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-brand-primary btn-sm flex-grow-1"
                    disabled={isSavingBrand || !brandName.trim()}
                  >
                    {isSavingBrand ? (
                      'Saving…'
                    ) : editingBrand ? (
                      'Save Changes'
                    ) : (
                      <>
                        <Plus size={15} className="me-1" />
                        Add Brand
                      </>
                    )}
                  </button>

                  {editingBrand && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={cancelBrandEdit}
                      disabled={isSavingBrand}
                    >
                      <X size={14} className="me-1" />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div
              className="card border rounded-4 bg-white shadow-sm overflow-hidden"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="p-3 border-bottom bg-light fw-bold text-dark">
                Configured Brands ({brands.length})
              </div>

              <div className="p-3 border-bottom">
                <label className="visually-hidden" htmlFor="brandSearch">Search brands</label>
                <input
                  id="brandSearch"
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search brands by name or slug"
                  value={brandSearch}
                  onChange={(event) => setBrandSearch(event.target.value)}
                  disabled={catalogLoading || Boolean(catalogError)}
                />
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Brand Name</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Linked Products</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogLoading && (
                      <tr><td colSpan="5" className="p-4 text-center text-muted small">
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Loading brands…
                      </td></tr>
                    )}
                    {!catalogLoading && !catalogError && filteredBrands.map((brand) => {
                      const linkedCount = brandProductCount(brand.name);

                      return (
                        <tr key={brand.id}>
                          <td className="fw-bold text-dark">{brand.name}</td>
                          <td className="text-muted small">
                            <code>{brand.slug}</code>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                brand.isActive
                                  ? 'bg-success-subtle text-success'
                                  : 'bg-light text-muted border'
                              }`}
                            >
                              {brand.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{linkedCount}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm p-1 me-1"
                              onClick={() => handleBrandEdit(brand)}
                              title="Edit brand"
                              aria-label={`Edit ${brand.name}`}
                              disabled={
                                isSavingBrand || deletingBrandId !== null
                              }
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm p-1"
                              onClick={() => handleBrandDelete(brand)}
                              title={
                                linkedCount > 0
                                  ? 'Reassign linked products before deleting'
                                  : 'Delete brand'
                              }
                              aria-label={`Delete ${brand.name}`}
                              disabled={
                                linkedCount > 0 ||
                                isSavingBrand ||
                                deletingBrandId !== null
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!catalogLoading && !catalogError && filteredBrands.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-4 text-center text-muted small"
                        >
                          {brands.length === 0 ? 'No brands have been added yet. Add one using the form.' : 'No brands match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {catToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteCategoryTitle"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5
                  id="deleteCategoryTitle"
                  className="modal-title fw-bold text-danger d-flex align-items-center gap-2"
                >
                  <AlertTriangle size={20} />
                  <span>Delete Category</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setCatToDelete(null);
                    setError('');
                  }}
                  disabled={deletingId === catToDelete.id}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                <p>
                  Are you sure you want to delete category{' '}
                  <strong>{catToDelete.name}</strong>?
                </p>

                {deletingCategoryProductCount > 0 && (
                  <div className="alert alert-warning small">
                    This category has{' '}
                    <strong>{deletingCategoryProductCount}</strong> linked
                    product(s). Reassign those products before deleting it.
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger small mb-0" role="alert">
                    {error}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCatToDelete(null);
                    setError('');
                  }}
                  disabled={deletingId === catToDelete.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={confirmCategoryDelete}
                  disabled={
                    deletingId === catToDelete.id ||
                    deletingCategoryProductCount > 0
                  }
                >
                  {deletingId === catToDelete.id
                    ? 'Deleting…'
                    : 'Proceed with Deletion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}