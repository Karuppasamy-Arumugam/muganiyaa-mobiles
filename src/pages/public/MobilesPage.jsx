import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Phone,
  RefreshCw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import ProductCard from '../../components/common/ProductCard';

const INITIAL_VISIBLE_COUNT = 8;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function FilterChoices({
  brands,
  selectedBrand,
  onBrandChange,
  ramOptions,
  selectedRams,
  onRamToggle,
  storageOptions,
  selectedStorages,
  onStorageToggle,
  maxBudget,
  selectedMaxPrice,
  onMaxPriceChange
}) {
  const rangeValue = selectedMaxPrice ?? maxBudget;

  return (
    <>
      <div className="mb-4">
        <label className="form-label fw-semibold small mb-2" htmlFor="mobile-brand-filter">
          Brand
        </label>
        <select
          id="mobile-brand-filter"
          className="form-select"
          value={selectedBrand}
          onChange={(event) => onBrandChange(event.target.value)}
        >
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold small d-flex justify-content-between mb-2">
          <span>Maximum price</span>
          <span className="text-danger">
            {selectedMaxPrice == null
              ? `Up to ₹${formatPrice(maxBudget)}`
              : `₹${formatPrice(selectedMaxPrice)}`}
          </span>
        </label>
        <input
          type="range"
          className="form-range"
          min="2000"
          max={maxBudget}
          step="1000"
          value={rangeValue}
          onChange={(event) => onMaxPriceChange(Number(event.target.value))}
          aria-label="Maximum mobile phone price"
        />
        <div className="d-flex justify-content-between small text-muted">
          <span>₹2,000</span>
          <span>₹{formatPrice(maxBudget)}</span>
        </div>
      </div>

      {ramOptions.length > 0 && (
        <div className="mb-4">
          <div className="fw-semibold small mb-2">RAM</div>
          <div className="d-flex flex-wrap gap-2">
            {ramOptions.map((ram) => (
              <button
                key={ram}
                type="button"
                className={`btn btn-sm rounded-pill ${
                  selectedRams.includes(ram)
                    ? 'btn-danger'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => onRamToggle(ram)}
                aria-pressed={selectedRams.includes(ram)}
              >
                {ram}
              </button>
            ))}
          </div>
        </div>
      )}

      {storageOptions.length > 0 && (
        <div>
          <div className="fw-semibold small mb-2">Storage</div>
          <div className="d-flex flex-wrap gap-2">
            {storageOptions.map((storage) => (
              <button
                key={storage}
                type="button"
                className={`btn btn-sm rounded-pill ${
                  selectedStorages.includes(storage)
                    ? 'btn-danger'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => onStorageToggle(storage)}
                aria-pressed={selectedStorages.includes(storage)}
              >
                {storage}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function MobilesPage() {
  const {
    publishedProducts: productsFromStore = [],
    db = {},
    catalogLoading = false,
    catalogError = ''
  } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedBrand = searchParams.get('brand') || 'All Brands';
  const filterParam = searchParams.get('filter') || '';

  const [selectedRams, setSelectedRams] = useState([]);
  const [selectedStorages, setSelectedStorages] = useState([]);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const publishedProducts = Array.isArray(productsFromStore)
    ? productsFromStore.filter((product) => product && typeof product === 'object')
    : [];
  const safeDb = db && typeof db === 'object' ? db : {};
  const contact = safeDb.contactSettings || {};
  const whyChooseUs = asArray(safeDb.websiteContent?.whyChooseUs);

  const allMobiles = useMemo(() => {
    return publishedProducts.filter((product) => {
      const slug = normalize(product.categorySlug);
      const categoryName = normalize(product.category);

      return (
        slug === 'mobile-phones' ||
        slug === 'mobiles' ||
        categoryName === 'mobile phones' ||
        categoryName === 'mobiles'
      );
    });
  }, [publishedProducts]);

  const brands = useMemo(() => {
    const productBrands = allMobiles
      .map((product) => String(product.brand || '').trim())
      .filter(Boolean);

    return [
      'All Brands',
      ...Array.from(new Set(productBrands)).sort((a, b) =>
        a.localeCompare(b)
      )
    ];
  }, [allMobiles]);

  const ramOptions = useMemo(() => {
    const values = allMobiles.flatMap((product) => [
      ...asArray(product.ramOptions),
      ...asArray(product.variants).map((variant) => variant.ram)
    ]);

    return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [allMobiles]);

  const storageOptions = useMemo(() => {
    const values = allMobiles.flatMap((product) => [
      ...asArray(product.storageOptions),
      ...asArray(product.variants).map((variant) => variant.storage)
    ]);

    return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [allMobiles]);

  const maxBudget = useMemo(() => {
    const highestPrice = Math.max(
      100000,
      ...allMobiles.map((product) => Number(product.sellingPrice || 0))
    );

    return Math.ceil(highestPrice / 1000) * 1000;
  }, [allMobiles]);

  const updateBrand = (brand) => {
    const nextParams = new URLSearchParams(searchParams);

    if (brand === 'All Brands') {
      nextParams.delete('brand');
    } else {
      nextParams.set('brand', brand);
    }

    setSearchParams(nextParams);
  };

  const toggleValue = (value, setter) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const clearAllFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('brand');
    nextParams.delete('filter');

    setSearchParams(nextParams);
    setSelectedRams([]);
    setSelectedStorages([]);
    setSelectedMaxPrice(null);
    setSortBy('featured');
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedBrand, filterParam, selectedRams, selectedStorages, selectedMaxPrice, sortBy]);

  const isFiltered =
    selectedBrand !== 'All Brands' ||
    selectedRams.length > 0 ||
    selectedStorages.length > 0 ||
    selectedMaxPrice != null ||
    filterParam !== '';

  const filteredProducts = useMemo(() => {
    return allMobiles
      .filter((product) => {
        if (
          selectedBrand !== 'All Brands' &&
          normalize(product.brand) !== normalize(selectedBrand)
        ) {
          return false;
        }

        if (filterParam === 'latest' && !product.isLatestLaunch) return false;
        if (filterParam === 'bestseller' && !product.isBestSeller) return false;

        if (
          selectedMaxPrice != null &&
          Number(product.sellingPrice || 0) > selectedMaxPrice
        ) {
          return false;
        }

        if (selectedRams.length > 0) {
          const productRams = [
            ...asArray(product.ramOptions),
            ...asArray(product.variants).map((variant) => variant.ram)
          ].map(normalize);

          if (!selectedRams.some((ram) => productRams.includes(normalize(ram)))) {
            return false;
          }
        }

        if (selectedStorages.length > 0) {
          const productStorages = [
            ...asArray(product.storageOptions),
            ...asArray(product.variants).map((variant) => variant.storage)
          ].map(normalize);

          if (
            !selectedStorages.some((storage) =>
              productStorages.includes(normalize(storage))
            )
          ) {
            return false;
          }
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
    allMobiles,
    selectedBrand,
    filterParam,
    selectedMaxPrice,
    selectedRams,
    selectedStorages,
    sortBy
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const filterProps = {
    brands,
    selectedBrand,
    onBrandChange: updateBrand,
    ramOptions,
    selectedRams,
    onRamToggle: (ram) => toggleValue(ram, setSelectedRams),
    storageOptions,
    selectedStorages,
    onStorageToggle: (storage) => toggleValue(storage, setSelectedStorages),
    maxBudget,
    selectedMaxPrice,
    onMaxPriceChange: setSelectedMaxPrice
  };

  return (
    <main className="mobiles-page pb-5">
      <section className="bg-white border-bottom py-4">
        <div className="container">
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb small mb-2">
              <li className="breadcrumb-item">
                <Link to="/" className="text-muted text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="breadcrumb-item active text-dark" aria-current="page">
                Mobiles
              </li>
            </ol>
          </nav>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
            <div>
              <span className="text-danger small fw-semibold text-uppercase">
                Mobile catalogue
              </span>
              <h1 className="fw-bold mb-1 fs-2 text-dark">
                Mobile Phones &amp; 5G Smartphones
              </h1>
              <p className="text-muted mb-0">
                Browse available phones by brand, budget, RAM, or storage.
              </p>
            </div>
            <div className="badge-blush align-self-start align-self-md-auto">
              {catalogLoading
                ? 'Loading phones…'
                : catalogError
                  ? 'Catalogue unavailable'
                  : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'phone' : 'phones'} available`}
            </div>
          </div>
        </div>
      </section>

      {brands.length > 1 && (
        <section className="bg-white border-bottom py-3">
          <div className="container">
            <div className="d-flex align-items-center gap-2 overflow-x-auto pb-1">
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className={`filter-pill flex-shrink-0 ${
                    selectedBrand === brand ? 'active' : ''
                  }`}
                  onClick={() => updateBrand(brand)}
                  aria-pressed={selectedBrand === brand}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container py-4" aria-busy={catalogLoading}>
        <div
          className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-3 rounded-3 border mb-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-lg-none d-inline-flex align-items-center gap-2"
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {isFiltered && <span className="text-danger">•</span>}
            </button>

            {isFiltered && (
              <button
                type="button"
                className="btn btn-link btn-sm text-danger text-decoration-none"
                onClick={clearAllFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            <label htmlFor="sortBy" className="small text-muted fw-semibold">
              Sort
            </label>
            <select
              id="sortBy"
              className="form-select form-select-sm"
              style={{ width: '170px' }}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="row g-4">
          <aside className="col-lg-3 d-none d-lg-block">
            <div
              className="card p-3 border sticky-top"
              style={{
                top: '150px',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="h6 fw-bold mb-0">Filters</h2>
                {isFiltered && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger p-0"
                    onClick={clearAllFilters}
                  >
                    Reset
                  </button>
                )}
              </div>
              <FilterChoices {...filterProps} />
            </div>
          </aside>

          <div className="col-12 col-lg-9">
            {catalogLoading ? (
              <div className="card border p-4 p-md-5 text-center" role="status" aria-live="polite">
                <div className="spinner-border text-danger mx-auto mb-3" aria-hidden="true" />
                <h2 className="h5 fw-bold mb-2">Loading mobile phones</h2>
                <p className="text-muted small mb-0">Please wait while we load the latest store catalogue.</p>
              </div>
            ) : catalogError ? (
              <div className="card border p-4 p-md-5 text-center" role="alert">
                <div className="mx-auto mb-3 p-3 rounded-circle bg-light text-danger">
                  <RefreshCw size={28} />
                </div>
                <h2 className="h5 fw-bold mb-2">We couldn’t load the mobile catalogue</h2>
                <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '420px' }}>
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  className="btn btn-brand-primary btn-sm align-self-center px-4"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="card border p-4 p-md-5 text-center">
                <div className="mx-auto mb-3 p-3 rounded-circle bg-light text-danger">
                  <RefreshCw size={28} />
                </div>

                <h2 className="h5 fw-bold mb-2">
                  {allMobiles.length === 0
                    ? 'No published mobile phones are available yet'
                    : 'No phones match these filters'}
                </h2>

                <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '420px' }}>
                  {allMobiles.length === 0
                    ? 'Published products in the Mobile Phones category will appear here.'
                    : 'Try another brand or clear your RAM, storage, and price filters.'}
                </p>

                {isFiltered && (
                  <button
                    type="button"
                    className="btn btn-brand-primary btn-sm align-self-center px-4"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="small text-muted mb-0">
                    Showing {visibleProducts.length} of {filteredProducts.length} phones
                  </p>
                </div>

                <div className="row g-3 g-md-4">
                  {visibleProducts.map((product) => (
                    <div key={product.id} className="col-12 col-sm-6 col-xl-4">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {visibleCount < filteredProducts.length && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="btn btn-brand-outline px-4 py-2"
                      onClick={() => setVisibleCount((count) => count + 6)}
                    >
                      Load more phones
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {isFilterDrawerOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
        >
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h2 id="mobile-filter-title" className="modal-title h5 fw-bold">
                  Filter phones
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close filters"
                  onClick={() => setIsFilterDrawerOpen(false)}
                />
              </div>

              <div className="modal-body">
                <FilterChoices {...filterProps} />
              </div>

              <div className="modal-footer justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
                <button
                  type="button"
                  className="btn btn-brand-primary btn-sm px-4"
                  onClick={() => setIsFilterDrawerOpen(false)}
                >
                  Show {filteredProducts.length} results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {whyChooseUs.length > 0 && (
        <section
          className="mt-4 py-5 border-top"
          style={{ backgroundColor: 'var(--secondary-bg)' }}
        >
          <div className="container">
            <div className="text-center mx-auto mb-4" style={{ maxWidth: '620px' }}>
              <span className="badge-blush text-uppercase fw-bold mb-2 d-inline-block">
                The local advantage
              </span>
              <h2 className="h3 fw-bold">Why buy from Muganiyaa-Mobiles?</h2>
              <p className="text-muted small mb-0">
                Get personal guidance and support from your local showroom.
              </p>
            </div>

            <div className="row g-3 g-md-4">
              {whyChooseUs.map((item, index) => (
                <div key={`${item.title || 'reason'}-${index}`} className="col-12 col-sm-6 col-lg-3">
                  <article
                    className="card h-100 p-4 border rounded-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div
                      className="p-2 rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3 text-danger"
                      style={{ width: '42px', height: '42px' }}
                    >
                      <CheckCircle2 size={21} />
                    </div>
                    <h3 className="h6 fw-bold text-dark">{item.title}</h3>
                    <p className="text-muted small mb-0" style={{ lineHeight: 1.55 }}>
                      {item.description}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-4 bg-white border-top">
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
          <div>
            <h2 className="h5 fw-bold mb-1">
              Looking for a specific model or colour?
            </h2>
            <p className="text-muted small mb-0">
              Contact the showroom to check availability and pickup options.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {contact.phone && (
              <a
                href={`tel:${String(contact.phone).replace(/[^0-9+]/g, '')}`}
                className="btn btn-brand-primary btn-sm px-3 py-2 d-inline-flex align-items-center gap-2"
              >
                <Phone size={16} />
                <span>{contact.phone}</span>
              </a>
            )}
            <Link to="/contact" className="btn btn-brand-outline btn-sm px-3 py-2">
              Contact store
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


