import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function AdminContent() {
  const { db, updateWebsiteContent, websiteContentLoading, websiteContentError, reloadWebsiteContent } = useData();
  const websiteContent = db?.websiteContent || {};

  const [content, setContent] = useState(websiteContent);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setContent(websiteContent);
  }, [websiteContent]);

  const handleAboutChange = (field, value) => {
    setContent((previous) => ({
      ...previous,
      aboutUs: {
        ...(previous.aboutUs || {}),
        [field]: value
      }
    }));
  };

  const handlePartnerChange = (index, field, value) => {
    setContent((previous) => {
      const partners = [...(previous.partners || [])];
      partners[index] = { ...partners[index], [field]: value };

      return { ...previous, partners };
    });
  };

  const handleWhyChooseChange = (index, field, value) => {
    setContent((previous) => {
      const whyChooseUs = [...(previous.whyChooseUs || [])];
      whyChooseUs[index] = { ...whyChooseUs[index], [field]: value };

      return { ...previous, whyChooseUs };
    });
  };

  const handleFooterChange = (field, value) => {
    setContent((previous) => ({
      ...previous,
      footer: {
        ...(previous.footer || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSavedSuccess(false);
    setSaveError('');
    setIsSaving(true);

    try {
      await updateWebsiteContent(content);
      setSavedSuccess(true);
      window.setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Could not save website content:', error);
      setSaveError(error?.message || 'Could not save website content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-content pb-5">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-3">
            Website Editorial Content
          </h2>
          <p className="text-muted small mb-0">
            Edit the About Us story, retail partner statements, Why Choose Us
            cards, and footer copy.
          </p>
        </div>

        <button
          type="submit"
          form="website-content-form"
          className="btn btn-brand-primary btn-sm d-inline-flex align-items-center gap-2"
          disabled={isSaving || websiteContentLoading || Boolean(websiteContentError)}
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving...' : 'Save Website Content'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div
          className="alert alert-success d-flex align-items-center gap-2 mb-4 shadow-sm"
          role="status"
        >
          <CheckCircle2 size={18} />
          <span>Website content saved successfully.</span>
        </div>
      )}

      {saveError && (
        <div className="alert alert-danger mb-4" role="alert">
          {saveError}
        </div>
      )}

      {websiteContentLoading ? (
        <div className="card p-5 text-center border rounded-4 bg-white shadow-sm" role="status">
          <div className="spinner-border text-danger mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted mb-0">Loading website content…</p>
        </div>
      ) : websiteContentError ? (
        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>{websiteContentError}</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void reloadWebsiteContent()}>
            Try again
          </button>
        </div>
      ) : (
      <form id="website-content-form" onSubmit={handleSave}>
        {/* About Us */}
        <div
          className="card p-4 border rounded-4 bg-white shadow-sm mb-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h5 className="fw-bold text-dark mb-3">About Us Page Content</h5>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">
                Main Heading
              </label>
              <input
                type="text"
                className="form-control"
                value={content.aboutUs?.title || ''}
                onChange={(event) =>
                  handleAboutChange('title', event.target.value)
                }
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">
                Subtitle
              </label>
              <input
                type="text"
                className="form-control"
                value={content.aboutUs?.subtitle || ''}
                onChange={(event) =>
                  handleAboutChange('subtitle', event.target.value)
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label small fw-bold text-dark">
                About Description
              </label>
              <textarea
                rows={5}
                className="form-control"
                value={content.aboutUs?.description || ''}
                onChange={(event) =>
                  handleAboutChange('description', event.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Retail Partners */}
        <div
          className="card p-4 border rounded-4 bg-white shadow-sm mb-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h5 className="fw-bold text-dark mb-3">Authorized Retail Partnerships</h5>
          {Array.isArray(content.partners) && content.partners.length > 0 ? (
            <div className="row g-3">
              {content.partners.map((partner, index) => (
                <div key={partner.id || index} className="col-12 col-md-4">
                  <div className="card p-3 border bg-light h-100">
                    <h6 className="fw-bold text-dark mb-2">Partner #{index + 1}: {partner.name || 'Unnamed partner'}</h6>
                    <div className="mb-2">
                      <label htmlFor={`partner-badge-${index}`} className="form-label small fw-bold text-dark">Badge Statement</label>
                      <input id={`partner-badge-${index}`} type="text" className="form-control form-control-sm" value={partner.badge || ''} onChange={(event) => handlePartnerChange(index, 'badge', event.target.value)} />
                    </div>
                    <div>
                      <label htmlFor={`partner-description-${index}`} className="form-label small fw-bold text-dark">Description</label>
                      <textarea id={`partner-description-${index}`} rows={2} className="form-control form-control-sm" value={partner.description || ''} onChange={(event) => handlePartnerChange(index, 'description', event.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-light border d-flex align-items-start gap-2 mb-0" role="status">
              <Info size={18} className="text-muted mt-1 flex-shrink-0" />
              <span className="small text-muted">No partner content is configured yet. Add partner entries to the website content, then edit them here.</span>
            </div>
          )}
        </div>
        {/* Why Choose Us */}
        <div
          className="card p-4 border rounded-4 bg-white shadow-sm mb-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h5 className="fw-bold text-dark mb-3">Why Choose Us Pillars</h5>
          {Array.isArray(content.whyChooseUs) && content.whyChooseUs.length > 0 ? (
            <div className="row g-3">
              {content.whyChooseUs.map((item, index) => (
                <div key={item.id || index} className="col-12 col-md-6">
                  <div className="card p-3 border bg-light h-100">
                    <div className="mb-2">
                      <label htmlFor={`why-title-${index}`} className="form-label small fw-bold text-dark">Pillar #{index + 1} Title</label>
                      <input id={`why-title-${index}`} type="text" className="form-control form-control-sm" value={item.title || ''} onChange={(event) => handleWhyChooseChange(index, 'title', event.target.value)} />
                    </div>
                    <div>
                      <label htmlFor={`why-description-${index}`} className="form-label small fw-bold text-dark">Statement</label>
                      <textarea id={`why-description-${index}`} rows={2} className="form-control form-control-sm" value={item.description || ''} onChange={(event) => handleWhyChooseChange(index, 'description', event.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-light border d-flex align-items-start gap-2 mb-0" role="status">
              <Info size={18} className="text-muted mt-1 flex-shrink-0" />
              <span className="small text-muted">No Why Choose Us cards are configured yet. Add entries to the website content, then edit them here.</span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div
          className="card p-4 border rounded-4 bg-white shadow-sm"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h5 className="fw-bold text-dark mb-3">
            Footer Tagline &amp; Disclaimers
          </h5>

          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-bold text-dark">
                Footer Tagline
              </label>
              <input
                type="text"
                className="form-control"
                value={content.footer?.tagline || ''}
                onChange={(event) =>
                  handleFooterChange('tagline', event.target.value)
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label small fw-bold text-dark">
                Footer Disclaimer
              </label>
              <textarea
                rows={2}
                className="form-control"
                value={content.footer?.disclaimer || ''}
                onChange={(event) =>
                  handleFooterChange('disclaimer', event.target.value)
                }
              />
            </div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}



