import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
  Wrench
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  supabase,
  isSupabaseConfigured
} from '../../services/supabaseClient';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const { db, addEnquiry } = useData();

  const preselectedService = searchParams.get('service') || '';
  const preselectedProduct = searchParams.get('product') || '';

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    enquiryType: preselectedService
      ? 'Store Service'
      : preselectedProduct
        ? 'Product Availability'
        : 'General Enquiry',
    selectedProductOrService: preselectedService || preselectedProduct || '',
    message: ''
  });

  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (preselectedService) {
      setFormData((previous) => ({
        ...previous,
        enquiryType: 'Store Service',
        selectedProductOrService: preselectedService
      }));
    } else if (preselectedProduct) {
      setFormData((previous) => ({
        ...previous,
        enquiryType: 'Product Availability',
        selectedProductOrService: preselectedProduct
      }));
    }
  }, [preselectedService, preselectedProduct]);

  const contact = db.contactSettings || {};
  const mapSearchQuery =
    contact.mapQuery || contact.address || 'Muganiyaa Mobiles';
  const encodedMapQuery = encodeURIComponent(mapSearchQuery);
  const mapEmbedUrl =
    `https://www.google.com/maps?q=${encodedMapQuery}&output=embed`;
  const savedMapUrl = String(contact.mapUrl || '').trim();
  const hasVerifiedMapUrl = /^https?:\/\//i.test(savedMapUrl);
  const mapLink = hasVerifiedMapUrl
    ? savedMapUrl
    : `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;

  const validate = () => {
    const validationErrors = {};
    const name = formData.customerName.trim();
    const digits = formData.phone.replace(/\D/g, '');
    const mobileDigits =
      digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : digits;
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (Array.from(name).length < 6) {
      validationErrors.customerName = 'Name must be at least 6 characters';
    } else if (Array.from(name).length > 120) {
      validationErrors.customerName = 'Name must be 120 characters or fewer';
    }

    if (!/^[6-9]\d{9}$/.test(mobileDigits)) {
      validationErrors.phone = 'Enter a valid 10-digit mobile number';
    }

    if (
      email &&
      (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (Array.from(message).length < 10) {
      validationErrors.message = 'Message must be at least 10 characters';
    } else if (Array.from(message).length > 2000) {
      validationErrors.message = 'Please keep your message under 2000 characters';
    }

    return validationErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.functions.invoke(
          'send-enquiry',
          {
            body: {
              customerName: formData.customerName.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim(),
              enquiryType: formData.enquiryType,
              selectedProductOrService:
                formData.selectedProductOrService.trim(),
              message: formData.message.trim(),
              website: honeypot
            }
          }
        );

        if (error) throw error;

        if (data?.success !== true) {
          throw new Error('Enquiry submission failed');
        }
      } else {
        // Local-only fallback when Supabase is not configured.
        await addEnquiry(formData);
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Could not submit enquiry:', error);
      setSubmitError(
        'We could not submit your enquiry. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError('');
    setErrors({});
    setHoneypot('');
    setFormData({
      customerName: '',
      phone: '',
      email: '',
      enquiryType: 'General Enquiry',
      selectedProductOrService: '',
      message: ''
    });
  };

  return (
    <div className="contact-page pb-5">
      <div className="bg-white border-bottom py-4">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-2">
              <li className="breadcrumb-item">
                <Link to="/" className="text-muted text-decoration-none">
                  Home
                </Link>
              </li>
              <li
                className="breadcrumb-item active text-dark"
                aria-current="page"
              >
                Contact Us & Repairs
              </li>
            </ol>
          </nav>

          <h1 className="fw-bold fs-3 text-dark mb-1">
            Contact Muganiyaa-Mobiles
          </h1>
          <p className="text-muted small mb-0">
            Submit a repair request, ask about phone stock, or check in-store
            offers with our retail team.
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-5">
          <div className="col-12 col-lg-5">
            <div
              className="card p-4 border bg-white rounded-4 mb-4 shadow-sm"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <h4 className="fw-bold mb-3 text-dark">Showroom Information</h4>

              <div className="d-flex flex-column gap-3 text-muted">
                <div className="d-flex align-items-start gap-3">
                  <div className="p-2 rounded-circle bg-light text-danger flex-shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Store Address</h6>
                    <p className="small mb-0">
                      {contact.address || 'Address not available'}
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="p-2 rounded-circle bg-light text-danger flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">
                      Telephone & Helpline
                    </h6>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                        className="small text-danger fw-semibold text-decoration-none"
                      >
                        {contact.phone}
                      </a>
                    ) : (
                      <p className="small mb-0">Phone number not available</p>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="p-2 rounded-circle bg-light text-danger flex-shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Email Support</h6>
                    <p className="small mb-0">
                      {contact.email || 'Email address not available'}
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="p-2 rounded-circle bg-light text-danger flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Opening Hours</h6>
                    <p className="small mb-0">
                      {contact.hours || 'Opening hours not available'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <a
                  href={`https://wa.me/${contact.whatsapp?.replace(/[^0-9]/g, '') || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                  aria-disabled={!contact.whatsapp}
                  onClick={(event) => {
                    if (!contact.whatsapp) event.preventDefault();
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            <div
              className="card border rounded-4 overflow-hidden"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="p-3 d-flex align-items-center justify-content-between gap-2">
                <div>
                  <h6 className="fw-bold text-dark mb-1">Store Location Map</h6>
                  <p className="text-muted small mb-0">
                    Map preview for {mapSearchQuery}
                  </p>
                </div>
                <MapPin size={22} className="text-danger flex-shrink-0" />
              </div>

              <iframe
                title="Muganiyaa-Mobiles showroom map"
                src={mapEmbedUrl}
                width="100%"
                height="260"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              <div className="p-3">
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-danger btn-sm w-100"
                >
                  <MapPin size={15} className="me-1" />
                  {hasVerifiedMapUrl
                    ? 'Open Verified Location in Google Maps'
                    : 'Search This Address in Google Maps'}
                </a>

                {!hasVerifiedMapUrl && (
                  <small className="text-muted d-block mt-2">
                    Add a verified Google Maps share link in Admin → Contact
                    & Hours to link directly to the showroom pin.
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div
              className="card p-4 p-md-5 border rounded-4 bg-white shadow-sm"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {isSubmitted ? (
                <div className="py-4 text-center">
                  <div className="p-3 rounded-circle bg-success-subtle text-success d-inline-block mb-3">
                    <CheckCircle2 size={48} />
                  </div>

                  <h3 className="fw-bold text-dark mb-2">
                    Enquiry Submitted
                  </h3>

                  <p
                    className="text-muted small mb-4"
                    style={{ maxWidth: '440px', margin: '0 auto' }}
                  >
                    Thank you, <strong>{formData.customerName}</strong>. Your
                    enquiry has been submitted successfully. Our team will
                    contact you soon.
                  </p>

                  <button
                    type="button"
                    className="btn btn-brand-primary btn-sm px-4 py-2"
                    onClick={resetForm}
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '-10000px',
                      width: '1px',
                      height: '1px',
                      overflow: 'hidden'
                    }}
                  >
                    <label htmlFor="website">Leave this field empty</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                    />
                  </div>

                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <span className="badge-blush text-uppercase fw-bold mb-1 d-inline-block">
                        Customer Care
                      </span>
                      <h3 className="fw-bold text-dark mb-0">Send an Enquiry</h3>
                    </div>
                    <Wrench size={24} className="text-danger" />
                  </div>

                  <p className="text-muted small mb-4">
                    Fill in your details below. For screen or hardware repairs,
                    include your phone model in the message.
                  </p>

                  {submitError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {submitError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="customerName"
                        className="form-label small fw-bold text-dark"
                      >
                        Your Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        maxLength={120}
                        required
                        className={`form-control ${errors.customerName ? 'is-invalid' : ''}`}
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.customerName}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            customerName: event.target.value
                          })
                        }
                      />
                      {errors.customerName && (
                        <div className="invalid-feedback small">
                          {errors.customerName}
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="phone"
                        className="form-label small fw-bold text-dark"
                      >
                        Mobile Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        maxLength={40}
                        required
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder="e.g. +91 98410 12345"
                        value={formData.phone}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            phone: event.target.value
                          })
                        }
                      />
                      {errors.phone && (
                        <div className="invalid-feedback small">
                          {errors.phone}
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="email"
                        className="form-label small fw-bold text-dark"
                      >
                        Email Address{' '}
                        <span className="text-muted fw-normal">(Optional)</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        maxLength={254}
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="e.g. name@example.com"
                        value={formData.email}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            email: event.target.value
                          })
                        }
                      />
                      {errors.email && (
                        <div className="invalid-feedback small">
                          {errors.email}
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="enquiryType"
                        className="form-label small fw-bold text-dark"
                      >
                        Enquiry Type
                      </label>
                      <select
                        id="enquiryType"
                        className="form-select"
                        value={formData.enquiryType}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            enquiryType: event.target.value
                          })
                        }
                      >
                        <option value="Smartphone Repair">
                          Smartphone Repair & Display
                        </option>
                        <option value="SIM & MNP Porting">
                          SIM Activation & MNP Porting
                        </option>
                        <option value="Product Availability">
                          Product Price & Stock Availability
                        </option>
                        <option value="EMI & Financing">
                          EMI / Card Offers / Trade-in
                        </option>
                        <option value="Recharge & Bills">
                          Instant Recharge & DTH Bills
                        </option>
                        <option value="General Enquiry">
                          General Store Enquiry
                        </option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label
                        htmlFor="selectedProductOrService"
                        className="form-label small fw-bold text-dark"
                      >
                        Specific Model / Item / Service
                      </label>
                      <input
                        id="selectedProductOrService"
                        type="text"
                        maxLength={160}
                        className="form-control"
                        placeholder="e.g. Samsung Galaxy model or cracked screen"
                        value={formData.selectedProductOrService}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            selectedProductOrService: event.target.value
                          })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label
                        htmlFor="message"
                        className="form-label small fw-bold text-dark"
                      >
                        Your Message / Issue Description{' '}
                        <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        maxLength={2000}
                        required
                        className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                        placeholder="Describe what you are looking for or the fault symptoms."
                        value={formData.message}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            message: event.target.value
                          })
                        }
                      />
                      {errors.message && (
                        <div className="invalid-feedback small">
                          {errors.message}
                        </div>
                      )}
                    </div>

                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-brand-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                      >
                        <Send size={18} />
                        <span>
                          {isSubmitting
                            ? 'Submitting…'
                            : 'Submit Store Enquiry'}
                        </span>
                      </button>

                      <small
                        className="text-muted d-block text-center mt-2"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Our team will review your enquiry and contact you.
                      </small>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}