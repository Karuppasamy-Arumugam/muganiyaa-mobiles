import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, RotateCcw, Search, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import ProductCard from '../../components/common/ProductCard';

const formatPrice = (value) => Number(value || 0).toLocaleString('en-IN');

export default function CategoriesPage() {
  const { db = {}, publishedProducts = [] } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCatSlug = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [sortBy, setSortBy] = useState('featured');
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(null);

  const categories = db.categories || [];

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const maxBudget = useMemo(() => {
    const highestPrice = Math.max(
      100000,
      ...publishedProducts.map((product) => Number(product.sellingPrice || 0))
    );

    return Math.ceil(highestPrice / 1000) * 1000;
  }, [publishedProducts]);

  const categoryCounts = useMemo(() => {
    return publishedProducts.reduce((counts, product) => {
      const slug = product.categorySlug;
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
      return counts;
    }, {});
  }, [publishedProducts]);

  const activeCategory = categories.find(
    (category) => category.slug === selectedCatSlug
  );

  const updateSearchParams = (changes) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });

    setSearchParams(nextParams);
  };

  const handleCategorySelect = (slug) => {
    updateSearchParams({ category: slug === 'all' ? '' : slug });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateSearchParams({ q: searchQuery.trim() });
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setSelectedMaxPrice(null);
    setSortBy('featured');
  };

  const isFiltered =
    selectedCatSlug !== 'all' ||
    Boolean(queryParam) ||
    selectedMaxPrice !== null;

  const filteredProducts = useMemo(() => {
    const query = queryParam.trim().toLowerCase();

    return publishedProducts
      .filter((product) => {
        if (
          selectedCatSlug !== 'all' &&
          product.categorySlug !== selectedCatSlug
        ) {
          return false;
        }

        if (query) {
          const searchableValues = [
            product.name,
            product.brand,
            product.category,
            product.model,
            product.tagline,
            product.description
          ];

          const matchesQuery = searchableValues.some((value) =>
            String(value || '').toLowerCase().includes(query)
          );

          if (!matchesQuery) return false;
        }

        if (
          selectedMaxPrice !== null &&
          Number(product.sellingPrice || 0) > selectedMaxPrice
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0);
        }

        if (sortBy === 'price-desc') {
          return Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0);
        }

        if (sortBy === 'newest') {
          return Number(Boolean(b.isLatestLaunch)) - Number(Boolean(a.isLatestLaunch));
        }

        return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      });
  }, [
    publishedProducts,
    selectedCatSlug,
    queryParam,
    selectedMaxPrice,
    sortBy
  ]);

  const rangeValue = selectedMaxPrice ?? maxBudget;

  return (
    <main className="categories-page pb-5">
      <section className="bg-white border-bottom py-4">
        <div className="container">
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb small mb-3">
              <li className="breadcrumb-item">
                <Link to="/" className="text-muted text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="breadcrumb-item active text-dark" aria-current="page">
                {activeCategory?.name || 'All Categories'}
              </li>
            </ol>
          </nav>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
            <div>
              <span className="text-danger small fw-semibold text-uppercase">
                Store catalogue
              </span>
              <h1 className="fw-bold mb-1 fs-2 text-dark">
                {queryParam
                  ? `Results for “${queryParam}”`
                  : activeCategory?.name || 'Browse all products'}
              </h1>
              <p className="text-muted mb-0">
                Find phones, accessories, TVs, appliances, and more.
              </p>
            </div>

            <span className="badge-blush align-self-start align-self-md-auto">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white border-bottom py-3">
        <div className="container">
          <div className="d-flex align-items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className={`filter-pill flex-shrink-0 ${
                selectedCatSlug === 'all' ? 'active' : ''
              }`}
              onClick={() => handleCategorySelect('all')}
              aria-pressed={selectedCatSlug === 'all'}
            >
              All products ({publishedProducts.length})
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`filter-pill flex-shrink-0 ${
                  selectedCatSlug === category.slug ? 'active' : ''
                }`}
                onClick={() => handleCategorySelect(category.slug)}
                aria-pressed={selectedCatSlug === category.slug}
              >
                {category.name}
                {categoryCounts[category.slug]
                  ? ` (${categoryCounts[category.slug]})`
                  : ''}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-4">
        <div
          className="card border-0 shadow-sm p-3 p-md-4 mb-4"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-5">
              <label htmlFor="catalogue-search" className="form-label small fw-semibold">
                Search products
              </label>
              <form onSubmit={handleSearchSubmit} className="input-group">
                <input
                  id="catalogue-search"
                  type="search"
                  className="form-control"
                  placeholder="Search by name, brand, or model"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <button
                  className="btn btn-brand-primary px-3"
                  type="submit"
                  aria-label="Search catalogue"
                >
                  <Search size={17} />
                </button>
              </form>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <label className="form-label small fw-semibold d-flex justify-content-between">
                <span>Maximum price</span>
                <span className="text-danger">
                  {selectedMaxPrice === null
                    ? `Any price up to ₹${formatPrice(maxBudget)}`
                    : `₹${formatPrice(selectedMaxPrice)}`}
                </span>
              </label>
              <input
                type="range"
                className="form-range mb-0"
                min="200"
                max={maxBudget}
                step="1000"
                value={rangeValue}
                onChange={(event) =>
                  setSelectedMaxPrice(Number(event.target.value))
                }
                aria-label="Maximum product price"
              />
              <div className="d-flex justify-content-between text-muted small">
                <span>₹200</span>
                <span>₹{formatPrice(maxBudget)}</span>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-end gap-2">
                <div className="flex-grow-1">
                  <label htmlFor="catalogue-sort" className="form-label small fw-semibold">
                    Sort by
                  </label>
                  <select
                    id="catalogue-sort"
                    className="form-select"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                  </select>
                </div>

                {isFiltered && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearFilters}
                    title="Clear filters"
                    aria-label="Clear filters"
                  >
                    <RotateCcw size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {isFiltered && (
            <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
              <span className="small text-muted">Filters are active</span>
              <button
                type="button"
                className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                onClick={clearFilters}
              >
                <X size={14} className="me-1" />
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="small text-muted mb-0">
            Showing {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 p-md-5 text-center">
            <div className="mx-auto mb-3 p-3 rounded-circle bg-light text-danger">
              <RefreshCw size={28} />
            </div>
            <h2 className="h5 fw-bold mb-2">No products found</h2>
            <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '420px' }}>
              Try changing your search, choosing another category, or clearing the price filter.
            </p>
            {isFiltered && (
              <button
                type="button"
                className="btn btn-brand-primary btn-sm align-self-center px-4"
                onClick={clearFilters}
              >
                View all products
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="col-12 col-sm-6 col-md-4 col-xl-3"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}