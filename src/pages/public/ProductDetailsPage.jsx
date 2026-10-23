import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronRight,
  ZoomIn,
  Tag
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/common/ProductCard';

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    db = {},
    publishedProducts: productsFromStore = [],
    activeOffers: offersFromStore = [],
    catalogLoading = false,
    catalogError = ''
  } = useData();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const safeDb = db && typeof db === 'object' ? db : {};
  const publishedProducts = Array.isArray(productsFromStore)
    ? productsFromStore.filter((item) => item && typeof item === 'object')
    : [];
  const activeOffers = Array.isArray(offersFromStore) ? offersFromStore : [];

  const product = useMemo(
    () => publishedProducts.find((item) => item.slug === slug),
    [publishedProducts, slug]
  );

  // The confirmed Mobile Phones category slug in Supabase.
  const isMobilePhone = product?.categorySlug === 'mobile-phones';

  // Use saved options, or derive them from the product variants.
  const ramOptions = useMemo(() => {
    if (product?.ramOptions?.length) return product.ramOptions;

    return [
      ...new Set(
        (product?.variants || [])
          .map((variant) => variant.ram)
          .filter(Boolean)
      )
    ];
  }, [product]);

  const storageOptions = useMemo(() => {
    if (product?.storageOptions?.length) return product.storageOptions;

    return [
      ...new Set(
        (product?.variants || [])
          .map((variant) => variant.storage)
          .filter(Boolean)
      )
    ];
  }, [product]);

  const inWishlist = product ? isInWishlist(product.id) : false;

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!product) return;

    setSelectedColor(
      product.colors?.length ? product.colors[0] : null
    );
    setSelectedRam(ramOptions[0] || null);
    setSelectedStorage(storageOptions[0] || null);

    const firstVariant = product.variants?.[0];
    setSelectedVariantAttributes(firstVariant?.variantAttributes || {});
    setActiveImageIndex(0);
    setIsZoomed(false);
    window.scrollTo(0, 0);
  }, [product, ramOptions, storageOptions]);

  const variantAttributeOptions = useMemo(() => {
    const optionsByName = new Map();

    for (const variant of product?.variants || []) {
      for (const [name, value] of Object.entries(
        variant.variantAttributes || {}
      )) {
        if (!optionsByName.has(name)) {
          optionsByName.set(name, new Set());
        }
        if (value) optionsByName.get(name).add(value);
      }
    }

    return [...optionsByName.entries()].map(([name, values]) => [
      name,
      [...values]
    ]);
  }, [product]);

  const currentVariant = useMemo(() => {
    if (!product?.variants?.length) return null;

    return (
      product.variants.find((variant) => {
        const colorMatch =
          !selectedColor || variant.color === selectedColor.name;
        const ramMatch = !selectedRam || variant.ram === selectedRam;
        const storageMatch =
          !selectedStorage || variant.storage === selectedStorage;
        const attributesMatch = Object.entries(
          selectedVariantAttributes
        ).every(
          ([name, value]) =>
            !value || variant.variantAttributes?.[name] === value
        );

        return colorMatch && ramMatch && storageMatch && attributesMatch;
      }) || product.variants[0]
    );
  }, [
    product,
    selectedColor,
    selectedRam,
    selectedStorage,
    selectedVariantAttributes
  ]);

  const currentSellingPrice = currentVariant
    ? currentVariant.sellingPrice
    : product?.sellingPrice || 0;

  const currentOriginalPrice = currentVariant
    ? currentVariant.originalPrice
    : product?.originalPrice || 0;

  const currentStockStatus = currentVariant
    ? currentVariant.stockStatus
    : product?.stockStatus || 'In Stock';

  const isOutOfStock = currentStockStatus === 'Out of Stock';

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images?.length) return product.images;
    if (product.coverImage) return [product.coverImage];
    return [];
  }, [product]);

  const eligibleOffers = useMemo(() => {
    if (!product) return [];

    const productOfferIds = product.offers || [];

    return activeOffers.filter(
      (offer) =>
        productOfferIds.includes(offer.id) ||
        (offer.type === 'EMI Option' &&
          currentSellingPrice >= (offer.minPurchase || 0)) ||
        (offer.type === 'Card Offer' &&
          currentSellingPrice >= (offer.minPurchase || 0))
    );
  }, [product, activeOffers, currentSellingPrice]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return publishedProducts
      .filter(
        (item) =>
          item.categorySlug === product.categorySlug &&
          item.id !== product.id
      )
      .slice(0, 4);
  }, [publishedProducts, product]);

  const contact = safeDb.contactSettings || {};
  const whatsappNumber = contact.whatsapp?.replace(/[^0-9]/g, '');

  if (catalogLoading) {
    return (
      <main className="container py-5 text-center" role="status" aria-live="polite">
        <div className="card p-5 max-w-md mx-auto border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="spinner-border text-danger mx-auto mb-3" aria-hidden="true" />
          <h1 className="h4 fw-bold mb-2">Loading product</h1>
          <p className="text-muted small mb-0">Please wait while we load the product details.</p>
        </div>
      </main>
    );
  }

  if (catalogError) {
    return (
      <main className="container py-5 text-center" role="alert">
        <div className="card p-5 max-w-md mx-auto border" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="h4 fw-bold mb-2">Product details unavailable</h1>
          <p className="text-muted small mb-4">We couldn’t load the store catalogue. Please try again.</p>
          <div className="d-flex justify-content-center flex-wrap gap-2">
            <button type="button" className="btn btn-brand-primary btn-sm px-4 py-2" onClick={() => window.location.reload()}>
              Try again
            </button>
            <Link to="/mobiles" className="btn btn-brand-outline btn-sm px-4 py-2">
              Browse mobiles
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product || product.status === 'draft') {
    return (
      <div className="container py-5 text-center">
        <div
          className="card p-5 max-w-md mx-auto border"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h3 className="fw-bold mb-2">Product not available</h3>
          <p className="text-muted small mb-4">
            This product may have been removed or is no longer available
            in the store catalogue.
          </p>
          <Link
            to="/mobiles"
            className="btn btn-brand-primary btn-sm px-4 py-2"
          >
            Back to Mobiles Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const handleWhatsAppEnquiry = () => {
    const variantDesc = currentVariant
      ? `(${[
          currentVariant.color,
          currentVariant.ram,
          currentVariant.storage,
          ...Object.values(currentVariant.variantAttributes || {})
        ]
          .filter(Boolean)
          .join(' ')})`
      : '';

    const message = encodeURIComponent(
      `Hello Muganiyaa-Mobiles! I am interested in ${product.name} ${variantDesc} priced at ₹${currentSellingPrice.toLocaleString(
        'en-IN'
      )}. Please confirm current in-store stock availability.`
    );

    if (whatsappNumber) {
      window.open(
        `https://wa.me/${whatsappNumber}?text=${message}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      navigate('/contact');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="product-details-page pb-5">
      {/* Breadcrumbs */}
      <div className="bg-white border-bottom py-3">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-0">
              <li className="breadcrumb-item">
                <Link to="/" className="text-muted text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link
                  to={
                    product.categorySlug === 'mobile-phones'
                      ? '/mobiles'
                      : `/categories?category=${product.categorySlug}`
                  }
                  className="text-muted text-decoration-none"
                >
                  {product.category}
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link
                  to={`/mobiles?brand=${encodeURIComponent(product.brand)}`}
                  className="text-muted text-decoration-none"
                >
                  {product.brand}
                </Link>
              </li>
              <li
                className="breadcrumb-item active text-dark"
                aria-current="page"
              >
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Product Area */}
      <div className="container py-4 py-lg-5">
        <div className="row g-4 g-lg-5">
          {/* Image Gallery */}
          <div className="col-12 col-lg-6">
            <div className="sticky-top" style={{ top: '100px' }}>
              <div
                className="position-relative border rounded-3 p-4 bg-white d-flex align-items-center justify-content-center overflow-hidden"
                style={{
                  borderColor: 'var(--border-color)',
                  aspectRatio: '1 / 1',
                  backgroundColor: 'var(--secondary-bg)',
                  cursor: 'zoom-in'
                }}
                onClick={() => setIsZoomed(!isZoomed)}
                title="Click to toggle zoomed preview"
              >
                <img
                  src={galleryImages[activeImageIndex] || product.coverImage}
                  alt={product.name}
                  className="img-fluid"
                  style={{
                    maxHeight: '90%',
                    maxWidth: '90%',
                    objectFit: 'contain',
                    transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />

                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-circle position-absolute bottom-0 end-0 m-3 shadow-sm"
                  aria-label="Zoom image"
                >
                  <ZoomIn size={16} />
                </button>

                <div className="position-absolute top-0 start-0 m-3 d-flex flex-column gap-1">
                  {product.isLatestLaunch && (
                    <span className="badge-brand">Latest Launch</span>
                  )}
                  {product.isBestSeller && (
                    <span className="badge-blush">Best Seller</span>
                  )}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="d-flex align-items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {galleryImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`border rounded p-1 bg-white cursor-pointer ${
                        activeImageIndex === index
                          ? 'border-danger border-2'
                          : ''
                      }`}
                      style={{
                        width: '70px',
                        height: '70px',
                        flexShrink: 0,
                        borderColor:
                          activeImageIndex === index
                            ? 'var(--primary-red)'
                            : 'var(--border-color)'
                      }}
                      onClick={() => {
                        setActiveImageIndex(index);
                        setIsZoomed(false);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="col-12 col-lg-6">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span
                className="text-uppercase fw-bold text-danger small"
                style={{ letterSpacing: '0.06em' }}
              >
                {product.brand}
              </span>
              <span className="text-muted small">
                Model: {product.model || 'Standard'}
              </span>
            </div>

            <h1 className="fw-bold fs-3 text-dark mb-2">{product.name}</h1>

            {product.tagline && (
              <p className="lead text-muted fs-6 mb-3">{product.tagline}</p>
            )}

            {/* Price and Availability */}
            <div
              className="p-3 rounded-3 mb-4 d-flex flex-wrap align-items-baseline gap-3"
              style={{ backgroundColor: 'var(--secondary-bg)' }}
            >
              <div>
                <span
                  className="fs-2 fw-extrabold text-dark"
                  style={{ fontWeight: 800 }}
                >
                  ₹{currentSellingPrice.toLocaleString('en-IN')}
                </span>
                {currentOriginalPrice > currentSellingPrice && (
                  <span className="text-muted text-decoration-line-through ms-2 fs-5">
                    ₹{currentOriginalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div className="ms-auto d-flex align-items-center gap-2">
                {isOutOfStock ? (
                  <span className="badge bg-secondary-subtle text-secondary px-3 py-2 fs-6 d-flex align-items-center gap-1">
                    <XCircle size={15} /> Out of Stock
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success px-3 py-2 fs-6 d-flex align-items-center gap-1">
                    <CheckCircle2 size={15} /> In Stock for Store Pickup
                  </span>
                )}
              </div>
            </div>

            {/* Colour Selector */}
            {product.colors?.length > 0 && (
              <div className="mb-4">
                <label className="fw-bold small text-dark d-block mb-2">
                  Colour:{' '}
                  <span className="text-danger fw-bold">
                    {selectedColor?.name || 'Select Colour'}
                  </span>
                </label>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`btn btn-sm d-inline-flex align-items-center gap-2 p-2 px-3 rounded-pill border ${
                        selectedColor?.name === color.name
                          ? 'border-danger bg-white shadow-sm'
                          : 'border-light-subtle bg-light'
                      }`}
                      style={{
                        outline:
                          selectedColor?.name === color.name
                            ? '2px solid var(--primary-red)'
                            : 'none',
                        outlineOffset: '2px'
                      }}
                      onClick={() => setSelectedColor(color)}
                    >
                      <span
                        className="rounded-circle d-inline-block border"
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: color.hex
                        }}
                      />
                      <span className="small fw-semibold">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RAM: mobile phones only */}
            {isMobilePhone && ramOptions.length > 0 && (
              <div className="mb-4">
                <label className="fw-bold small text-dark d-block mb-2">
                  RAM Size:{' '}
                  <span className="text-danger fw-bold">{selectedRam}</span>
                </label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {ramOptions.map((ram) => (
                    <button
                      key={ram}
                      type="button"
                      className={`btn btn-sm px-3 py-2 fw-semibold ${
                        selectedRam === ram
                          ? 'btn-danger'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setSelectedRam(ram)}
                    >
                      {ram} RAM
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage: mobile phones only */}
            {isMobilePhone && storageOptions.length > 0 && (
              <div className="mb-4">
                <label className="fw-bold small text-dark d-block mb-2">
                  Storage Capacity:{' '}
                  <span className="text-danger fw-bold">
                    {selectedStorage}
                  </span>
                </label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {storageOptions.map((storage) => (
                    <button
                      key={storage}
                      type="button"
                      className={`btn btn-sm px-3 py-2 fw-semibold ${
                        selectedStorage === storage
                          ? 'btn-danger'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setSelectedStorage(storage)}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other category-specific variant attributes */}
            {variantAttributeOptions.map(([name, options]) => (
              <div className="mb-4" key={name}>
                <label className="fw-bold small text-dark d-block mb-2">
                  {name}:{' '}
                  <span className="text-danger fw-bold">
                    {selectedVariantAttributes[name] || options[0]}
                  </span>
                </label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`btn btn-sm px-3 py-2 fw-semibold ${
                        selectedVariantAttributes[name] === option
                          ? 'btn-danger'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() =>
                        setSelectedVariantAttributes((previous) => ({
                          ...previous,
                          [name]: option
                        }))
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="d-flex flex-column flex-sm-row align-items-stretch gap-3 my-4">
              <button
                type="button"
                className="btn btn-brand-primary flex-grow-1 py-3 d-flex align-items-center justify-content-center gap-2 fw-bold"
                onClick={handleWhatsAppEnquiry}
              >
                <MessageCircle size={20} />
                <span>WhatsApp Enquiry</span>
              </button>

              <a
                href={`tel:${contact.phone?.replace(/[^0-9+]/g, '')}`}
                className="btn btn-brand-outline py-3 px-4 d-flex align-items-center justify-content-center gap-2 fw-bold"
              >
                <Phone size={18} />
                <span>Call Store</span>
              </a>

              <button
                type="button"
                className={`btn py-3 px-3 border ${
                  inWishlist ? 'btn-danger' : 'btn-light'
                }`}
                onClick={() => toggleWishlist(product.id)}
                aria-label={
                  inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
                }
                title="Wishlist"
              >
                <Heart
                  size={20}
                  fill={inWishlist ? '#FFFFFF' : 'none'}
                />
              </button>

              <button
                type="button"
                className="btn btn-light py-3 px-3 border"
                onClick={handleShare}
                title="Share link"
                aria-label="Share product"
              >
                <Share2 size={18} />
              </button>
            </div>

            {copiedShare && (
              <div className="alert alert-success py-1 px-3 small text-center mb-3">
                Product link copied to clipboard!
              </div>
            )}

            {/* In-Store Guarantees */}
            <div className="border rounded-3 p-3 bg-light">
              <div className="row g-2 small text-muted">
                <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                  <ShieldCheck size={18} className="text-danger flex-shrink-0" />
                  <span>100% Genuine with Official Bill & Warranty</span>
                </div>
                <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                  <Truck size={18} className="text-danger flex-shrink-0" />
                  <span>Same-Day Showroom Pickup & Setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Highlights */}
        {product.highlights?.length > 0 && (
          <div
            className="my-5 p-4 rounded-4 border bg-white"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <Sparkles size={22} className="text-danger" />
              <h4 className="fw-bold mb-0">What Makes It Special</h4>
            </div>
            <div className="row g-3">
              {product.highlights.map((highlight, index) => (
                <div key={index} className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2">
                    <span className="text-danger fw-bold">★</span>
                    <span className="text-dark small fw-medium">
                      {highlight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Specifications */}
        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <div className="my-5">
              <h4 className="fw-bold mb-3 pb-2 border-bottom">
                Technical Specifications
              </h4>
              <div className="table-responsive">
                <table
                  className="table table-bordered table-striped align-middle mb-0"
                  style={{ fontSize: '0.88rem' }}
                >
                  <tbody>
                    {Object.entries(product.specifications).map(
                      ([key, value], index) => {
                        const label = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (character) =>
                            character.toUpperCase()
                          );

                        return (
                          <tr key={index}>
                            <th
                              className="bg-light text-dark fw-bold"
                              style={{ width: '28%' }}
                            >
                              {label}
                            </th>
                            <td className="text-muted">{value}</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Offers and EMI */}
        {eligibleOffers.length > 0 && (
          <div
            className="my-5 p-4 rounded-4 border"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--secondary-bg)'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Tag size={20} className="text-danger" />
                <h4 className="fw-bold mb-0">
                  Available Offers & EMI Options
                </h4>
              </div>
              <span className="badge-offer">Verified Store Promos</span>
            </div>

            <div className="row g-3">
              {eligibleOffers.map((offer) => (
                <div key={offer.id} className="col-12 col-md-6">
                  <div
                    className="card h-100 p-3 bg-white border rounded-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge-brand small">{offer.type}</span>
                      <small className="text-muted fw-semibold">
                        {offer.provider}
                      </small>
                    </div>
                    <h6 className="fw-bold text-dark mb-2">{offer.title}</h6>

                    {offer.tenureOptions && (
                      <p className="text-muted small mb-1">
                        <strong>Tenure:</strong> {offer.tenureOptions} (
                        {offer.downPayment}, {offer.processingFee})
                      </p>
                    )}

                    {offer.terms && (
                      <p
                        className="text-muted small mb-0"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {offer.terms}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <small
              className="text-muted d-block mt-3"
              style={{ fontSize: '0.75rem' }}
            >
              Financing and offer terms are subject to confirmation by the
              store and the relevant provider.
            </small>
          </div>
        )}

        {/* Contact Strip */}
        <div
          className="my-5 card p-4 border rounded-4 bg-white"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
            <div>
              <h5 className="fw-bold mb-1">
                Have questions about {product.name}?
              </h5>
              <p className="text-muted small mb-0">
                Ask about genuine accessories, back cover options, tempered
                glass installation, or trade-in exchange bonuses.
              </p>
            </div>
            <Link
              to={`/contact?product=${encodeURIComponent(product.name)}`}
              className="btn btn-brand-primary btn-sm px-4 py-2"
            >
              Send Direct Enquiry
            </Link>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="my-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h4 className="fw-bold mb-0">Similar Products You Might Like</h4>
              <Link
                to={
                  product.categorySlug === 'mobile-phones'
                    ? '/mobiles'
                    : `/categories?category=${product.categorySlug}`
                }
                className="text-danger fw-bold text-decoration-none small d-flex align-items-center gap-1"
              >
                <span>View More</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="row g-3 g-md-4">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="col-12 col-sm-6 col-md-3"
                >
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


