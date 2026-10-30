import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Wrench,
  Radio,
  Zap,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Tag,
  CreditCard,
  CalendarDays
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import ProductCard from '../../components/common/ProductCard';

const HERO_HEIGHT_STYLE = {
  height: 'clamp(380px, 48vw, 520px)'
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function HomePage() {
  const {
    db: dbFromStore = {},
    publishedProducts: productsFromStore = [],
    activeOffers: offersFromStore = [],
    offersLoading = false,
    offersError = '',
    reloadOffers = () => {},
    bannersLoading = false,
    bannersError = '',
    reloadBanners = () => {},
    catalogLoading = false,
    catalogError = '',
    servicesLoading = false,
    servicesError = '',
    reloadServices = () => {},
    websiteContentLoading = false,
    websiteContentError = '',
    reloadWebsiteContent = () => {},
    contactSettingsLoading = false,
    contactSettingsError = '',
    reloadContactSettings = () => {}
  } = useData();

  const db = dbFromStore && typeof dbFromStore === 'object' ? dbFromStore : {};
  const publishedProducts = asArray(productsFromStore).filter(
    (product) => product && typeof product === 'object'
  );
  const activeOffers = asArray(offersFromStore);
  const banners = asArray(db.banners).filter((banner) => banner?.active);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (currentSlide >= banners.length) {
      setCurrentSlide(0);
    }
  }, [banners.length, currentSlide]);

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, prefersReducedMotion, banners.length]);

  const prevSlide = () => {
    setCurrentSlide((previous) =>
      previous === 0 ? banners.length - 1 : previous - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((previous) => (previous + 1) % banners.length);
  };

  const latestLaunches = publishedProducts
    .filter((product) => product.isLatestLaunch)
    .slice(0, 4);

  const bestSellers = publishedProducts
    .filter((product) => product.isBestSeller)
    .slice(0, 4);

  const featuredOffers = activeOffers
    .filter((offer) => {
      if (!offer.endDate) return true;

      const endDate = new Date(`${offer.endDate}T23:59:59`);
      return !Number.isNaN(endDate.getTime()) && endDate >= new Date();
    })
    .slice(0, 3);

  const formatOfferDate = (value) => {
    if (!value) return '';

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const services = asArray(db.services).filter(
    (service) => service && service.active !== false
  );
  const content =
    db.websiteContent && typeof db.websiteContent === 'object'
      ? db.websiteContent
      : {};
  const contact =
    db.contactSettings && typeof db.contactSettings === 'object'
      ? db.contactSettings
      : {};

  const storePhone = contact.phone || '';
  const storeHours = contact.hours || '';
  const storeAddress = contact.address || '';
  const phoneHref = storePhone.replace(/[^\d+]/g, '');

  return (
    <div className="homepage-wrapper pb-5">
      {/* Keep the hero's height reserved while banner data is loading. */}
      {bannersLoading && banners.length === 0 && (
        <section
          className="hero-carousel-section position-relative bg-dark overflow-hidden"
          aria-label="Featured promotions loading"
          aria-busy="true"
        >
          <div
            className="w-100 d-flex align-items-center"
            style={HERO_HEIGHT_STYLE}
          >
            <div className="container">
              <div
                className="text-white"
                role="status"
                aria-live="polite"
                style={{ maxWidth: '620px' }}
              >
                <span className="badge-brand d-inline-block mb-3">
                  Muganiyaa-Mobiles
                </span>
                <div
                  className="placeholder-glow"
                  aria-hidden="true"
                  style={{ maxWidth: '520px' }}
                >
                  <span className="placeholder col-9 fs-2 mb-2" />
                  <span className="placeholder col-7" />
                </div>
                <span className="visually-hidden">
                  Loading homepage promotions…
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Carousel */}
      {!bannersLoading && banners.length > 0 && (
        <section
          className="hero-carousel-section position-relative bg-dark overflow-hidden"
          aria-label="Featured promotions"
        >
          <div className="position-relative" style={HERO_HEIGHT_STYLE}>
            {banners.map((banner, index) => {
              const isActive = index === currentSlide;

              return (
                <div
                  key={banner.id}
                  className={`position-absolute top-0 start-0 w-100 h-100 transition-opacity ${
                    isActive
                      ? 'opacity-100 z-index-2'
                      : 'opacity-0 pointer-events-none'
                  }`}
                  style={{
                    transition: prefersReducedMotion
                      ? 'none'
                      : 'opacity 0.6s ease-in-out',
                    zIndex: isActive ? 2 : 1
                  }}
                  aria-hidden={!isActive}
                >
                  {banner.imageUrl && (
                    <img
                      src={banner.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ objectFit: 'cover' }}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                    />
                  )}

                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    aria-hidden="true"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(20, 15, 17, 0.88) 0%, rgba(20, 15, 17, 0.55) 60%, rgba(20, 15, 17, 0.25) 100%)'
                    }}
                  />

                  <div
                    className="container h-100 position-relative d-flex align-items-center"
                    style={{ zIndex: 3 }}
                  >
                    <div className="text-white" style={{ maxWidth: '620px' }}>
                      {banner.badge && (
                        <span className="badge-brand d-inline-block mb-2 text-uppercase">
                          {banner.badge}
                        </span>
                      )}

                      <h1
                        className="display-6 display-md-5 fw-extrabold text-white mb-2"
                        style={{ fontWeight: 800 }}
                      >
                        {banner.title}
                      </h1>

                      <p
                        className="lead text-white-50 mb-4 d-none d-sm-block"
                        style={{ fontSize: '1.05rem', lineHeight: '1.5' }}
                      >
                        {banner.subtitle}
                      </p>

                      <div className="d-flex align-items-center gap-3">
                        <Link
                          to={banner.link || '/mobiles'}
                          className="btn btn-brand-primary px-4 py-2"
                        >
                          <span>{banner.ctaText || 'Explore Now'}</span>
                          <ArrowRight size={18} />
                        </Link>

                        <Link
                          to="/contact"
                          className="btn btn-outline-light px-3 py-2 d-none d-md-inline-flex"
                        >
                          Enquire at Store
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  className="btn btn-dark btn-sm rounded-circle position-absolute top-50 start-0 translate-middle-y ms-3 d-flex align-items-center justify-content-center p-2"
                  style={{
                    zIndex: 4,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  onClick={prevSlide}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>

                <button
                  type="button"
                  className="btn btn-dark btn-sm rounded-circle position-absolute top-50 end-0 translate-middle-y me-3 d-flex align-items-center justify-content-center p-2"
                  style={{
                    zIndex: 4,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  onClick={nextSlide}
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>

                <div
                  className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex align-items-center gap-2"
                  style={{ zIndex: 4 }}
                >
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className="border-0 rounded-pill p-0"
                      style={{
                        width: index === currentSlide ? '24px' : '8px',
                        height: '8px',
                        backgroundColor:
                          index === currentSlide
                            ? 'var(--primary-red)'
                            : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === currentSlide ? 'true' : undefined}
                    />
                  ))}

                  <button
                    type="button"
                    className="btn btn-link text-white p-0 ms-2"
                    onClick={() => setIsPlaying((playing) => !playing)}
                    aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Keep the hero space consistent if loading fails or no banners exist. */}
      {!bannersLoading && banners.length === 0 && (
        <section
          className="bg-dark text-white d-flex align-items-center"
          style={HERO_HEIGHT_STYLE}
          aria-label="Muganiyaa-Mobiles"
        >
          <div className="container">
            {bannersError && (
              <div
                className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4"
                role="alert"
              >
                <span>We couldn’t load the latest homepage promotions.</span>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm align-self-start align-self-sm-auto"
                  onClick={() => void reloadBanners()}
                >
                  Try again
                </button>
              </div>
            )}

            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <span className="text-uppercase small fw-bold text-warning">
                  Muganiyaa-Mobiles
                </span>
                <h1 className="display-6 fw-bold text-white mb-2">
                  Find your next device
                </h1>
                <p className="text-white-50 mb-0">
                  Browse phones, accessories, TVs, and store services.
                </p>
              </div>
              <Link
                to="/mobiles"
                className="btn btn-brand-primary px-4 py-2 align-self-start align-self-md-center"
              >
                Browse mobiles <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Quick Category Icons Strip */}
      <section className="py-4 border-bottom bg-white">
        <div className="container">
          <div className="row g-2 g-md-3 text-center">
            {[
              { name: '5G Mobiles', path: '/mobiles', icon: '📱' },
              { name: 'Smart TVs', path: '/categories?category=tvs', icon: '📺' },
              { name: 'Earbuds & Audio', path: '/categories?category=audio', icon: '🎧' },
              {
                name: 'Cooling & AC',
                path: '/categories?category=cooling-appliances',
                icon: '❄️'
              },
              {
                name: 'Kitchen & Induction',
                path: '/categories?category=kitchen-appliances',
                icon: '🍳'
              },
              { name: 'SIM & Repairs', path: '/contact?service=repair', icon: '🔧' }
            ].map((category, index) => (
              <div key={index} className="col-4 col-md-2">
                <Link
                  to={category.path}
                  className="card h-100 p-2 text-decoration-none text-dark border-0 hover-bg-light transition-all rounded"
                  style={{ backgroundColor: 'var(--secondary-bg)' }}
                >
                  <div className="fs-3 mb-1">{category.icon}</div>
                  <div className="fw-bold small">{category.name}</div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalogue loading and error feedback */}
      {(catalogLoading || catalogError) && (
        <section className="container pt-4" aria-live="polite">
          {catalogLoading && (
            <div
              className="alert alert-light border d-flex align-items-center gap-3 mb-0"
              role="status"
            >
              <span
                className="spinner-border spinner-border-sm text-danger"
                aria-hidden="true"
              />
              <span>Loading products from the store catalogue…</span>
            </div>
          )}
          {catalogError && !catalogLoading && (
            <div
              className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-0"
              role="alert"
            >
              <span>We couldn’t load the product catalogue. Please try again.</span>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm align-self-start align-self-sm-auto"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}
        </section>
      )}

      {!catalogLoading && !catalogError && publishedProducts.length === 0 && (
        <section className="container pt-4">
          <div
            className="alert alert-light border d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-0"
            role="status"
          >
            <span>
              The store catalogue is being updated. Contact the store to check
              product availability.
            </span>
            <Link
              to="/contact"
              className="btn btn-brand-outline btn-sm align-self-start align-self-sm-auto"
            >
              Contact the store
            </Link>
          </div>
        </section>
      )}

      {/* Latest Launches */}
      {!catalogLoading && !catalogError && latestLaunches.length > 0 && (
        <section className="py-5">
          <div className="container">
            <div className="d-flex align-items-end justify-content-between mb-4">
              <div>
                <span className="text-uppercase fw-bold text-danger small">
                  Just Arrived
                </span>
                <h2 className="fw-bold mb-0">Latest Launches</h2>
              </div>

              <Link
                to="/mobiles?filter=latest"
                className="text-decoration-none fw-bold text-danger d-flex align-items-center gap-1"
              >
                <span>View All Launches</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="row g-3 g-md-4">
              {latestLaunches.map((product) => (
                <div key={product.id} className="col-12 col-sm-6 col-lg-3">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {!catalogLoading && !catalogError && bestSellers.length > 0 && (
        <section
          className="py-5"
          style={{ backgroundColor: 'var(--secondary-bg)' }}
        >
          <div className="container">
            <div className="d-flex align-items-end justify-content-between mb-4">
              <div>
                <span className="text-uppercase fw-bold text-danger small">
                  Customer Favorites
                </span>
                <h2 className="fw-bold mb-0">Best Sellers</h2>
              </div>

              <Link
                to="/mobiles?filter=bestseller"
                className="text-decoration-none fw-bold text-danger d-flex align-items-center gap-1"
              >
                <span>Explore All</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="row g-3 g-md-4">
              {bestSellers.map((product) => (
                <div key={product.id} className="col-12 col-sm-6 col-lg-3">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Current Offers Preview */}
      <section
        className="py-5"
        style={{ backgroundColor: 'var(--secondary-bg)' }}
        aria-labelledby="home-offers-title"
      >
        <div className="container">
          <div className="d-flex flex-column flex-sm-row align-items-sm-end justify-content-between gap-3 mb-4">
            <div>
              <span className="text-uppercase fw-bold text-danger small">
                Current Promotions
              </span>
              <h2 id="home-offers-title" className="fw-bold mb-0">
                Offers &amp; EMI
              </h2>
              <p className="text-muted mb-0 mt-2">
                Explore current offers and finance options available at our
                store.
              </p>
            </div>

            <Link
              to="/offers"
              className="text-decoration-none fw-bold text-danger d-inline-flex align-items-center gap-1"
            >
              View All Offers <ArrowRight size={16} />
            </Link>
          </div>

          {offersLoading && (
            <div
              className="alert alert-light border d-flex align-items-center gap-3 mb-0"
              role="status"
            >
              <span
                className="spinner-border spinner-border-sm text-danger"
                aria-hidden="true"
              />
              <span>Loading current offers from the store…</span>
            </div>
          )}

          {offersError && !offersLoading && (
            <div
              className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-0"
              role="alert"
            >
              <span>We couldn’t load the latest offers. Please try again.</span>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm align-self-start align-self-sm-auto"
                onClick={() => void reloadOffers()}
              >
                Try again
              </button>
            </div>
          )}

          {!offersLoading && !offersError && featuredOffers.length === 0 && (
            <div className="alert alert-light border mb-0" role="status">
              There are no active offers to show right now. Please check again
              later.
            </div>
          )}

          {!offersLoading && !offersError && featuredOffers.length > 0 && (
            <div className="row g-3">
              {featuredOffers.map((offer) => (
                <div className="col-12 col-md-6 col-lg-4" key={offer.id}>
                  <article className="card h-100 border rounded-4 p-4 shadow-sm">
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <span className="badge-blush">
                        {offer.type || 'Store Offer'}
                      </span>

                      {offer.badgeText && (
                        <span className="badge bg-danger">{offer.badgeText}</span>
                      )}
                    </div>

                    <h3 className="h5 fw-bold text-dark mb-3">{offer.title}</h3>

                    <div className="d-flex flex-column gap-2 text-muted small mb-3">
                      {offer.provider && (
                        <div className="d-flex align-items-center gap-2">
                          <CreditCard
                            size={16}
                            className="text-danger flex-shrink-0"
                          />
                          <span>{offer.provider}</span>
                        </div>
                      )}

                      {Number(offer.discountAmount) > 0 && (
                        <div className="d-flex align-items-center gap-2">
                          <Tag size={16} className="text-danger flex-shrink-0" />
                          <span>
                            Benefit: ₹
                            {Number(offer.discountAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {Number(offer.minPurchase) > 0 && (
                        <div>
                          Minimum purchase: ₹
                          {Number(offer.minPurchase).toLocaleString('en-IN')}
                        </div>
                      )}

                      {offer.tenureOptions && (
                        <div>EMI tenure: {offer.tenureOptions}</div>
                      )}

                      {offer.downPayment && (
                        <div>Down payment: {offer.downPayment}</div>
                      )}

                      {offer.processingFee && (
                        <div>Processing fee: {offer.processingFee}</div>
                      )}

                      {offer.endDate && (
                        <div className="d-flex align-items-center gap-2">
                          <CalendarDays
                            size={16}
                            className="text-danger flex-shrink-0"
                          />
                          <span>Valid until {formatOfferDate(offer.endDate)}</span>
                        </div>
                      )}
                    </div>

                    {offer.terms && (
                      <p className="small text-muted border-top pt-3 mb-3">
                        {offer.terms}
                      </p>
                    )}

                    <Link
                      to="/contact"
                      className="btn btn-brand-outline btn-sm mt-auto align-self-start"
                    >
                      Ask about this offer
                    </Link>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Our Services */}
      <section className="py-5" id="services">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge-blush text-uppercase fw-bold mb-2 d-inline-block">
              Express Care &amp; Assistance
            </span>
            <h2 className="fw-bold">Our Store Services</h2>
            <p className="text-muted">
              Fast, dependable solutions by experienced technicians right in our
              shop showroom.
            </p>
          </div>

          {servicesLoading && (
            <div
              className="alert alert-light border d-flex align-items-center gap-3"
              role="status"
              aria-live="polite"
            >
              <span
                className="spinner-border spinner-border-sm text-danger"
                aria-hidden="true"
              />
              <span>Loading store services…</span>
            </div>
          )}

          {servicesError && !servicesLoading && (
            <div
              className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
              role="alert"
            >
              <span>We couldn’t load the store services. Please try again.</span>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm align-self-start align-self-sm-auto"
                onClick={() => void reloadServices()}
              >
                Try again
              </button>
            </div>
          )}

          {!servicesLoading && !servicesError && services.length === 0 && (
            <div className="alert alert-light border text-center" role="status">
              Contact the store to learn about currently available services.
            </div>
          )}

          {!servicesLoading && !servicesError && services.length > 0 && (
            <div className="row g-4">
              {services.map((service, index) => {
                const IconComponent =
                  service.icon === 'Wrench'
                    ? Wrench
                    : service.icon === 'Radio'
                      ? Radio
                      : Zap;

                return (
                  <div
                    key={service.id || index}
                    className="col-12 col-md-4"
                  >
                    <div className="custom-card h-100 p-4 d-flex flex-column">
                      <div
                        className="p-3 rounded-circle mb-3 d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: 'var(--soft-blush)',
                          color: 'var(--primary-red)'
                        }}
                      >
                        <IconComponent size={28} />
                      </div>

                      <h4 className="fw-bold mb-2">{service.title}</h4>
                      <p className="text-muted small mb-4">{service.subtitle}</p>

                      <ul className="list-unstyled d-flex flex-column gap-2 mb-4 small text-muted">
                        {asArray(service.features).map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="d-flex align-items-center gap-2"
                          >
                            <span className="text-danger fw-bold">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto">
                        <Link
                          to={`/contact?service=${encodeURIComponent(
                            service.enquiryService || service.title
                          )}`}
                          className="btn btn-brand-primary w-100"
                        >
                          Enquire for {service.title.split('&')[0].trim()}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Authorized Store Retail Partnerships */}
      <section
        className="py-4 border-top border-bottom"
        style={{ backgroundColor: '#FFFFFF' }}
        aria-labelledby="partner-section-title"
      >
        <div className="container">
          <div className="text-center mb-3">
            <span
              id="partner-section-title"
              className="text-muted small text-uppercase fw-bold"
              style={{ letterSpacing: '0.08em' }}
            >
              Authorized Store Retail Partnerships
            </span>
          </div>

          <div className="row g-3 justify-content-center text-center">
            <div className="col-12 col-md-4">
              <div className="h-100 p-3 border rounded bg-light">
                <div className="fw-bold text-dark fs-6">
                  Official Partner of JioMart Digital
                </div>
                <p className="small text-muted mb-3">
                  Wide range of consumer electronics and digital solutions.
                </p>
                <a
                  href="https://www.jiomart.com/page/about-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-danger"
                >
                  Explore JioMart
                  <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="h-100 p-3 border rounded bg-light">
                <div className="fw-bold text-dark fs-6">Partner of vivo</div>
                <p className="small text-muted mb-3">
                  Smartphones and accessories available at our store.
                </p>
                <a
                  href="https://www.vivo.com/in/content/about-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-danger"
                >
                  Explore vivo
                  <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="h-100 p-3 border rounded bg-light">
                <div className="fw-bold text-dark fs-6">Partner of OPPO</div>
                <p className="small text-muted mb-3">
                  OPPO smartphones available at our store.
                </p>
                <a
                  href="https://www.oppo.com/in/about/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-danger"
                >
                  Explore OPPO
                  <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Partnership descriptions are provided by the store. These links
              lead to the companies’ official websites and do not confirm stock
              integration or authorized repair-centre status.
            </small>
          </div>
        </div>
      </section>

      {/* About Us Preview */}
      <section
        className="py-5"
        style={{ backgroundColor: 'var(--secondary-bg)' }}
      >
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-6">
              <div
                className="rounded-4 overflow-hidden shadow-sm p-4 text-white position-relative"
                style={{
                  minHeight: '320px',
                  backgroundColor: '#B72E35',
                  backgroundImage:
                    'radial-gradient(circle at 100% 0%, #96232A 0%, #B72E35 100%)'
                }}
              >
                <div className="position-relative" style={{ zIndex: 2 }}>
                  <span className="badge bg-white text-danger fw-bold mb-3">
                    Shop Showroom
                  </span>
                  <h3 className="fw-bold text-white mb-3">Muganiyaa-Mobiles</h3>
                  <p className="text-white-50" style={{ lineHeight: '1.6' }}>
                    A dedicated retail storefront where you can physically test
                    devices, compare display quality, receive genuine invoice
                    warranties, and walk in for honest technical repairs.
                  </p>

                  <div className="row g-3 mt-2">
                    <div className="col-6">
                      <div className="bg-white bg-opacity-10 p-2 rounded">
                        <div className="fw-bold fs-5">100%</div>
                        <small className="text-white-50">
                          Genuine Devices
                        </small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-white bg-opacity-10 p-2 rounded">
                        <div className="fw-bold fs-5">15 Min</div>
                        <small className="text-white-50">
                          SIM &amp; MNP Porting
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <span className="text-uppercase fw-bold text-danger small">
                About Our Shop
              </span>

              {websiteContentLoading && (
                <div
                  className="alert alert-light border d-flex align-items-center gap-3"
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="spinner-border spinner-border-sm text-danger"
                    aria-hidden="true"
                  />
                  <span>Loading store information…</span>
                </div>
              )}

              {websiteContentError && !websiteContentLoading && (
                <div
                  className="alert alert-warning d-flex flex-column align-items-start gap-2"
                  role="alert"
                >
                  <span>We couldn’t load the store information.</span>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => void reloadWebsiteContent()}
                  >
                    Try again
                  </button>
                </div>
              )}

              <h2 className="fw-bold mb-3">
                {content.aboutUs?.title || 'Welcome to Muganiyaa-Mobiles'}
              </h2>
              <p className="text-muted" style={{ lineHeight: '1.7' }}>
                {content.aboutUs?.description?.substring(0, 320) ||
                  'Muganiyaa-Mobiles is your trusted local destination for smartphones, audio, TVs, and appliances. We provide honest product guidance and fast in-store services.'}
                ...
              </p>
              <div className="d-flex align-items-center gap-3 mt-4">
                <Link to="/about" className="btn btn-brand-primary">
                  Read Our Full Story
                </Link>
                <Link to="/contact" className="btn btn-brand-outline">
                  Store Directions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Preview */}
      <section className="py-5 bg-white">
        <div className="container">
          <div
            className="card border p-4 p-md-5 rounded-4"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div className="row align-items-center g-4">
              <div className="col-12 col-lg-7">
                <span className="badge-blush text-uppercase fw-bold mb-2 d-inline-block">
                  Need Instant Assistance?
                </span>
                <h3 className="fw-bold text-dark mb-2">
                  Speak Directly with Our Store Staff
                </h3>
                <p className="text-muted mb-4">
                  Check immediate variant stock, ask for screen repair estimates,
                  or enquire about finance documents.
                </p>

                {contactSettingsLoading && (
                  <div
                    className="d-flex align-items-center gap-2 text-muted small"
                    role="status"
                    aria-live="polite"
                  >
                    <span
                      className="spinner-border spinner-border-sm text-danger"
                      aria-hidden="true"
                    />
                    <span>Loading store contact details…</span>
                  </div>
                )}

                {contactSettingsError && !contactSettingsLoading && (
                  <div
                    className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"
                    role="alert"
                  >
                    <span>We couldn’t load the store contact details.</span>
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm align-self-start align-self-sm-auto"
                      onClick={() => void reloadContactSettings()}
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="d-flex flex-column gap-3 text-muted small">
                  {storeHours && (
                    <div className="d-flex align-items-center gap-2">
                      <Clock size={16} className="text-danger flex-shrink-0" />
                      <span>{storeHours}</span>
                    </div>
                  )}

                  {storeAddress && (
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={16} className="text-danger flex-shrink-0" />
                      <span>{storeAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 col-lg-5 text-lg-end">
                <div className="d-flex flex-column flex-sm-row justify-content-lg-end gap-3">
                  {!contactSettingsLoading &&
                    !contactSettingsError &&
                    phoneHref && (
                      <a
                        href={`tel:${phoneHref}`}
                        className="btn btn-brand-primary py-3 px-4 d-inline-flex align-items-center justify-content-center gap-2 fw-bold"
                      >
                        <Phone size={18} />
                        <span>Call Store</span>
                      </a>
                    )}

                  <Link
                    to="/contact"
                    className="btn btn-brand-outline py-3 px-4 d-inline-flex align-items-center justify-content-center gap-2 fw-bold"
                  >
                    <MessageCircle size={18} />
                    <span>Send Enquiry</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}