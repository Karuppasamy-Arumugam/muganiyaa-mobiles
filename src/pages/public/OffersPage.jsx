import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CreditCard, Tag } from 'lucide-react';
import { useData } from '../../context/DataContext';

function formatDate(value) {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function isOfferCurrent(offer) {
  if (!offer.endDate) return true;

  const endOfValidity = new Date(`${offer.endDate}T23:59:59`);
  return !Number.isNaN(endOfValidity.getTime()) &&
    endOfValidity.getTime() >= Date.now();
}

export default function OffersPage() {
  const {
    activeOffers = [],
    offersLoading = false,
    offersError = '',
    reloadOffers = () => {}
  } = useData();

  const safeOffers = Array.isArray(activeOffers) ? activeOffers : [];
  const visibleOffers = safeOffers.filter(isOfferCurrent);

  return (
    <main className="offers-page">
      <section
        className="py-5"
        style={{ backgroundColor: 'var(--secondary-bg)' }}
      >
        <div className="container">
          <span className="badge-blush text-uppercase fw-bold mb-2 d-inline-block">
            Offers &amp; Finance
          </span>
          <h1 className="fw-bold text-dark mb-2">Offers, Cashback &amp; EMI</h1>
          <p className="text-muted mb-0">
            Browse the current offers available at our store. Please check the
            terms and validity before making a purchase.
          </p>
        </div>
      </section>

      <section className="container py-5" aria-busy={offersLoading}>
        {offersLoading ? (
          <div className="card border rounded-4 p-4 p-md-5 text-center shadow-sm" role="status" aria-live="polite">
            <span className="spinner-border text-danger mx-auto mb-3" aria-hidden="true" />
            <h2 className="h4 fw-bold">Loading current offers</h2>
            <p className="text-muted mb-0">Please wait while we get the latest offers from the store.</p>
          </div>
        ) : offersError ? (
          <div className="card border rounded-4 p-4 p-md-5 text-center shadow-sm" role="alert">
            <div
              className="rounded-circle p-3 d-inline-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ backgroundColor: 'var(--soft-blush)', color: 'var(--primary-red)' }}
            >
              <Tag size={28} />
            </div>
            <h2 className="h4 fw-bold">Offers couldn’t be loaded</h2>
            <p className="text-muted mb-4">
              Please try again. If the problem continues, contact the store for current promotions and finance options.
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-2">
              <button type="button" className="btn btn-brand-primary" onClick={() => void reloadOffers()}>
                Try again
              </button>
              <Link to="/contact" className="btn btn-brand-outline">
                Contact the store
              </Link>
            </div>
          </div>
        ) : visibleOffers.length === 0 ? (
          <div className="card border rounded-4 p-4 p-md-5 text-center shadow-sm">
            <div
              className="rounded-circle p-3 d-inline-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                backgroundColor: 'var(--soft-blush)',
                color: 'var(--primary-red)'
              }}
            >
              <Tag size={28} />
            </div>
            <h2 className="h4 fw-bold">No current offers</h2>
            <p className="text-muted mb-4">
              There are no active offers to show right now. Contact the store
              to ask about current promotions or finance options.
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-2">
              <Link to="/contact" className="btn btn-brand-primary">
                Contact the store
              </Link>
              <Link to="/mobiles" className="btn btn-brand-outline">
                Browse mobiles
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {visibleOffers.map((offer) => (
              <div className="col-12 col-md-6 col-xl-4" key={offer.id}>
                <article className="card h-100 border rounded-4 p-4 shadow-sm">
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <span className="badge-blush">{offer.type || 'Offer'}</span>
                    {offer.badgeText && (
                      <span className="badge bg-danger text-white">
                        {offer.badgeText}
                      </span>
                    )}
                  </div>

                  <h2 className="h5 fw-bold text-dark mb-3">{offer.title}</h2>

                  {Number(offer.discountAmount) > 0 && (
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <Tag size={18} className="text-danger flex-shrink-0" />
                      <span className="fw-semibold">
                        Offer value: ₹
                        {Number(offer.discountAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="d-flex flex-column gap-2 text-muted small mb-3">
                    {offer.provider && (
                      <div className="d-flex gap-2">
                        <CreditCard
                          size={16}
                          className="text-danger flex-shrink-0"
                        />
                        <span>{offer.provider}</span>
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

                    {(offer.startDate || offer.endDate) && (
                      <div className="d-flex gap-2">
                        <CalendarDays
                          size={16}
                          className="text-danger flex-shrink-0"
                        />
                        <span>
                          Valid
                          {offer.startDate
                            ? ` from ${formatDate(offer.startDate)}`
                            : ''}
                          {offer.endDate
                            ? ` until ${formatDate(offer.endDate)}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {offer.terms && (
                    <p className="small text-muted border-top pt-3 mb-4">
                      {offer.terms}
                    </p>
                  )}

                  <div className="d-flex flex-wrap gap-2 mt-auto">
                    <Link
                      to="/mobiles"
                      className="btn btn-brand-primary btn-sm d-inline-flex align-items-center gap-2"
                    >
                      Browse mobiles <ArrowRight size={16} />
                    </Link>
                    <Link to="/contact" className="btn btn-brand-outline btn-sm">
                      Ask the store
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


