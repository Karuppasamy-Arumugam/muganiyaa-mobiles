import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, House, LayoutGrid, MessageCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="container py-5" aria-labelledby="not-found-title">
      <section className="card border-0 shadow-sm rounded-4 text-center mx-auto p-4 p-md-5 my-3" style={{ maxWidth: '680px' }}>
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: '72px', height: '72px', backgroundColor: 'var(--soft-blush)', color: 'var(--primary-red)' }}
          aria-hidden="true"
        >
          <Compass size={34} />
        </div>

        <p className="fw-bold text-danger mb-2">404</p>
        <h1 id="not-found-title" className="fw-bold mb-3">Page not found</h1>
        <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '480px' }}>
          We couldn’t find that page. The address may be incorrect, or the page may have moved. Choose a link below to continue browsing.
        </p>

        <div className="d-flex justify-content-center flex-wrap gap-2">
          <Link to="/" className="btn btn-brand-primary d-inline-flex align-items-center gap-2">
            <House size={17} /> Home
          </Link>
          <Link to="/mobiles" className="btn btn-brand-outline d-inline-flex align-items-center gap-2">
            Browse mobiles <ArrowRight size={17} />
          </Link>
          <Link to="/categories" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
            <LayoutGrid size={17} /> All categories
          </Link>
          <Link to="/contact" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
            <MessageCircle size={17} /> Contact the store
          </Link>
        </div>
      </section>
    </main>
  );
}
