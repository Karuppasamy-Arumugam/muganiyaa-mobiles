import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useData } from '../../context/DataContext';

export default function Footer() {
  const { db } = useData();
  const contact = db.contactSettings || {};
  const content = db.websiteContent || {};
  const footerContent = content.footer || {};

  const address = String(contact.address || '').trim();
  const phone = String(contact.phone || '').trim();
  const email = String(contact.email || '').trim();
  const hours = String(contact.hours || '').trim();

  const phoneLink = phone.replace(/[^0-9+]/g, '');
  const hasContactDetails = Boolean(address || phone || email || hours);

  return (
    <footer
      className="bg-white border-top mt-auto"
      style={{ borderTopColor: 'var(--border-color)' }}
    >
      {/* Top Value Strip */}
      <div
        className="py-4"
        style={{
          backgroundColor: 'var(--secondary-bg)',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div className="container">
          <div className="row g-3 text-center text-md-start">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                <div
                  className="rounded-circle p-2"
                  style={{
                    backgroundColor: 'var(--soft-blush)',
                    color: 'var(--primary-red)'
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">100% Genuine Products</h6>
                  <small className="text-muted">
                    Brand warranties &amp; verified manufacturer distribution
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                <div
                  className="rounded-circle p-2"
                  style={{
                    backgroundColor: 'var(--soft-blush)',
                    color: 'var(--primary-red)'
                  }}
                >
                  <Clock size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">Express In-Store Services</h6>
                  <small className="text-muted">
                    15-minute SIM activation &amp; fast repair turnaround
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                <div
                  className="rounded-circle p-2"
                  style={{
                    backgroundColor: 'var(--soft-blush)',
                    color: 'var(--primary-red)'
                  }}
                >
                  <Phone size={24} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">Local Personalized Guidance</h6>
                  <small className="text-muted">
                    Direct phone &amp; WhatsApp support with our local staff
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Shop Intro */}
          <div className={`col-12 col-lg-${hasContactDetails ? '4' : '5'}`}>
            <BrandLogo />
            <p
              className="mt-3 text-muted"
              style={{ fontSize: '0.9rem', lineHeight: '1.6' }}
            >
              {footerContent.tagline ||
                'Your trusted neighborhood destination for mobile phones, electronics, genuine accessories, express smartphone repairs, and recharge services.'}
            </p>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <span className="badge-blush">JioMart Digital Partner</span>
              <span className="badge-blush">vivo Partner</span>
              <span className="badge-blush">OPPO Partner</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div
            className={`col-6 col-md-3 col-lg-${hasContactDetails ? '2' : '3'}`}
          >
            <h6 className="fw-bold mb-3 text-dark">Top Categories</h6>
            <ul
              className="list-unstyled d-flex flex-column gap-2"
              style={{ fontSize: '0.88rem' }}
            >
              <li>
                <Link
                  to="/mobiles"
                  className="text-decoration-none text-muted hover-red"
                >
                  5G Smartphones
                </Link>
              </li>
              <li>
                <Link
                  to="/categories?category=tablets"
                  className="text-decoration-none text-muted hover-red"
                >
                  Tablets
                </Link>
              </li>
              <li>
                <Link
                  to="/categories?category=audio"
                  className="text-decoration-none text-muted hover-red"
                >
                  Audio &amp; Earbuds
                </Link>
              </li>
              <li>
                <Link
                  to="/categories?category=tvs"
                  className="text-decoration-none text-muted hover-red"
                >
                  Smart TVs
                </Link>
              </li>
              <li>
                <Link
                  to="/categories?category=cooling-appliances"
                  className="text-decoration-none text-muted hover-red"
                >
                  Cooling &amp; ACs
                </Link>
              </li>
              <li>
                <Link
                  to="/categories?category=kitchen-appliances"
                  className="text-decoration-none text-muted hover-red"
                >
                  Kitchen Appliances
                </Link>
              </li>
              <li>
                <Link
                  to="/categories?category=sim-cards"
                  className="text-decoration-none text-muted hover-red"
                >
                  SIM Cards &amp; MNP
                </Link>
              </li>
            </ul>
          </div>

          {/* Services & Shop Info */}
          <div
            className={`col-6 col-md-3 col-lg-${hasContactDetails ? '2' : '4'}`}
          >
            <h6 className="fw-bold mb-3 text-dark">Store Services</h6>
            <ul
              className="list-unstyled d-flex flex-column gap-2"
              style={{ fontSize: '0.88rem' }}
            >
              <li>
                <Link
                  to="/contact?service=repair"
                  className="text-decoration-none text-muted hover-red"
                >
                  Screen &amp; Display Repair
                </Link>
              </li>
              <li>
                <Link
                  to="/contact?service=sim"
                  className="text-decoration-none text-muted hover-red"
                >
                  SIM Card Activation
                </Link>
              </li>
              <li>
                <Link
                  to="/contact?service=sim"
                  className="text-decoration-none text-muted hover-red"
                >
                  Mobile Number Porting (MNP)
                </Link>
              </li>
              <li>
                <Link
                  to="/contact?service=recharge"
                  className="text-decoration-none text-muted hover-red"
                >
                  Instant Mobile Recharge
                </Link>
              </li>
              <li>
                <Link
                  to="/contact?service=recharge"
                  className="text-decoration-none text-muted hover-red"
                >
                  DTH Dish Top-up
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-decoration-none text-muted hover-red"
                >
                  About Muganiyaa
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          {hasContactDetails && (
            <div className="col-12 col-md-6 col-lg-4">
              <h6 className="fw-bold mb-3 text-dark">Store Contact</h6>
              <ul
                className="list-unstyled d-flex flex-column gap-3 text-muted"
                style={{ fontSize: '0.88rem' }}
              >
                {address && (
                  <li className="d-flex align-items-start gap-2">
                    <MapPin
                      size={18}
                      className="text-danger flex-shrink-0 mt-1"
                    />
                    <span>{address}</span>
                  </li>
                )}

                {phone && (
                  <li className="d-flex align-items-center gap-2">
                    <Phone size={18} className="text-danger flex-shrink-0" />
                    <a
                      href={`tel:${phoneLink}`}
                      className="text-decoration-none text-dark fw-semibold"
                    >
                      {phone}
                    </a>
                  </li>
                )}

                {email && (
                  <li className="d-flex align-items-center gap-2">
                    <Mail size={18} className="text-danger flex-shrink-0" />
                    <a
                      href={`mailto:${email}`}
                      className="text-decoration-none text-dark"
                    >
                      {email}
                    </a>
                  </li>
                )}

                {hours && (
                  <li className="d-flex align-items-start gap-2">
                    <Clock
                      size={18}
                      className="text-danger flex-shrink-0 mt-1"
                    />
                    <span>{hours}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div
        className="py-3"
        style={{
          backgroundColor: 'var(--secondary-bg)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}
      >
        <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 text-muted">
          <div>
            © {new Date().getFullYear()}{' '}
            <strong className="text-dark">Muganiyaa-Mobiles</strong>. All rights
            reserved.
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link
              to="/privacy"
              className="text-muted text-decoration-none hover-red"
            >
              Privacy Information
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}