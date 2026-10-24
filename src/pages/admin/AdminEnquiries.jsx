import React, { useState, useMemo } from 'react';
import { Inbox, Phone, Mail, Wrench, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

function formatEnquiryDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminEnquiries() {
  const {
    db,
    enquiriesLoading = false,
    enquiriesError = '',
    reloadEnquiries = () => {},
    updateEnquiry,
    deleteEnquiry
  } = useData();
  const enquiries = Array.isArray(db.enquiries) ? db.enquiries : [];

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [localNote, setLocalNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const filteredEnquiries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return enquiries
      .filter((enquiry) => {
        if (filterStatus !== 'all' && enquiry.status !== filterStatus) return false;
        if (filterType !== 'all' && enquiry.enquiryType !== filterType) return false;

        if (!query) return true;
        return [
          enquiry.customerName,
          enquiry.phone,
          enquiry.email,
          enquiry.enquiryType,
          enquiry.selectedProductOrService,
          enquiry.message
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const aTime = Date.parse(a.createdAt || '') || 0;
        const bTime = Date.parse(b.createdAt || '') || 0;
        return bTime - aTime;
      });
  }, [enquiries, filterStatus, filterType, searchQuery]);

  const handleSelectEnquiry = (enq) => {
    setActionError('');
    setActionSuccess('');
    setSelectedEnquiry(enq);
    setLocalNote(enq.notes || '');
  };

  const handleStatusChange = async (enqId, nextStatus) => {
    setActionError('');
    setActionSuccess('');
    setSavingId(enqId);

    try {
      await updateEnquiry(enqId, { status: nextStatus });
      setSelectedEnquiry((previous) =>
        previous?.id === enqId ? { ...previous, status: nextStatus } : previous
      );
      setActionSuccess('Enquiry status updated.');
    } catch (error) {
      setActionError(error.message || 'Could not update the enquiry status.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRepairProgressChange = async (enqId, repairState) => {
    setActionError('');
    setActionSuccess('');
    setSavingId(enqId);

    try {
      await updateEnquiry(enqId, { repairProgress: repairState });
      setSelectedEnquiry((previous) =>
        previous?.id === enqId
          ? { ...previous, repairProgress: repairState }
          : previous
      );
      setActionSuccess('Repair stage updated.');
    } catch (error) {
      setActionError(error.message || 'Could not update the repair stage.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedEnquiry) return;

    setActionError('');
    setActionSuccess('');
    setIsSavingNote(true);

    try {
      await updateEnquiry(selectedEnquiry.id, { notes: localNote });
      setSelectedEnquiry((previous) =>
        previous?.id === selectedEnquiry.id
          ? { ...previous, notes: localNote }
          : previous
      );
      setActionSuccess('Internal note saved.');
    } catch (error) {
      setActionError(error.message || 'Could not save the internal note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry record?')) return;

    setActionError('');
    setActionSuccess('');
    setDeletingId(id);

    try {
      await deleteEnquiry(id);
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      setActionSuccess('Enquiry deleted.');
    } catch (error) {
      setActionError(error.message || 'Could not delete the enquiry.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-enquiries pb-5">
      {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
      {actionSuccess && <div className="alert alert-success" role="status">{actionSuccess}</div>}
      {enquiriesError && (
        <div className="alert alert-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>Enquiries could not be loaded. Please try again.</span>
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => void reloadEnquiries()} disabled={enquiriesLoading}>
            {enquiriesLoading ? 'Loading…' : 'Try again'}
          </button>
        </div>
      )}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-3">Customer Inquiries & Service Tickets</h2>
          <p className="text-muted small mb-0">
            Track repair estimates, MNP requests, and stock availability questions submitted via Contact form and product pages.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-3 border rounded-3 bg-white mb-4 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
        <div className="mb-3">
          <label className="visually-hidden" htmlFor="enquirySearch">Search enquiries</label>
          <input
            id="enquirySearch"
            type="search"
            className="form-control form-control-sm"
            placeholder="Search by customer, phone, email, service, or message"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={enquiriesLoading || Boolean(enquiriesError)}
          />
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted fw-bold">Status:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={enquiriesLoading || Boolean(enquiriesError)}
            >
              <option value="all">All ({enquiries.length})</option>
              <option value="New">New Unhandled</option>
              <option value="In Progress">In Progress</option>
              <option value="Handled">Handled / Resolved</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted fw-bold">Type:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: '180px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={enquiriesLoading || Boolean(enquiriesError)}
            >
              <option value="all">All Types</option>
              <option value="Smartphone Repair">Smartphone Repair</option>
              <option value="SIM & MNP Porting">SIM & MNP Porting</option>
              <option value="Product Availability">Product Availability</option>
              <option value="Store Service">Store Service</option>
              <option value="General Enquiry">General Enquiry</option>
            </select>
          </div>

          <div className="ms-auto small text-muted">
            Showing <strong>{filteredEnquiries.length}</strong> inquiries
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Enquiries List Column */}
        <div className="col-12 col-lg-5">
          <div className="card border rounded-4 bg-white shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-3 border-bottom bg-light">
              <span className="fw-bold text-dark small">Inbox Messages</span>
            </div>

            {enquiriesLoading ? (
              <div className="p-5 text-center text-muted" role="status" aria-live="polite">
                <span className="spinner-border spinner-border-sm text-danger me-2" aria-hidden="true" />
                Loading enquiries…
              </div>
            ) : enquiriesError ? (
              <div className="p-4 text-center text-muted small">Use “Try again” above to reload the inbox.</div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                {enquiries.length === 0
                  ? 'There are no enquiries yet.'
                  : 'No enquiries match these filters or search terms.'}
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                {filteredEnquiries.map((enq) => {
                  const isSelected = selectedEnquiry?.id === enq.id;
                  return (
                    <div
                      key={enq.id}
                      className={`p-3 border-bottom cursor-pointer transition-all ${
                        isSelected ? 'bg-danger-subtle' : 'hover-bg-light'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectEnquiry(enq)}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark">{enq.customerName}</span>
                        <span
                          className={`badge ${
                            enq.status === 'New'
                              ? 'bg-danger text-white'
                              : enq.status === 'In Progress'
                              ? 'bg-warning text-dark'
                              : 'bg-success text-white'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {enq.status}
                        </span>
                      </div>

                      <div className="text-muted small d-flex justify-content-between mb-1">
                        <span>{enq.enquiryType}</span>
                        <span>
                          {formatEnquiryDate(enq.createdAt)}
                        </span>
                      </div>

                      <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '320px' }}>
                        {enq.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Enquiry Details & Notes Column */}
        <div className="col-12 col-lg-7">
          {selectedEnquiry ? (
            <div className="card p-4 border rounded-4 bg-white shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <h4 className="fw-bold text-dark mb-1">{selectedEnquiry.customerName}</h4>
                  <small className="text-muted">Ticket Ref: <code>{selectedEnquiry.id}</code></small>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={selectedEnquiry.status}
                    onChange={(e) => void handleStatusChange(selectedEnquiry.id, e.target.value)}
                    disabled={savingId === selectedEnquiry.id || deletingId === selectedEnquiry.id}
                    style={{
                      color:
                        selectedEnquiry.status === 'New'
                          ? '#B72E35'
                          : selectedEnquiry.status === 'In Progress'
                          ? '#B8860B'
                          : '#28a745'
                    }}
                  >
                    <option value="New">Mark as New</option>
                    <option value="In Progress">Mark as In Progress</option>
                    <option value="Handled">Mark as Handled</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm p-1 px-2"
                    onClick={() => void handleDelete(selectedEnquiry.id)}
                    disabled={deletingId === selectedEnquiry.id || savingId === selectedEnquiry.id}
                    title="Delete Ticket"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Customer Contact Badges */}
              <div className="d-flex flex-wrap gap-3 mb-4">
                <a
                  href={`tel:${String(selectedEnquiry.phone || '').replace(/[^0-9+]/g, '')}`}
                  className="btn btn-brand-soft btn-sm d-inline-flex align-items-center gap-2"
                >
                  <Phone size={15} />
                  <span>Call: {selectedEnquiry.phone}</span>
                </a>

                {selectedEnquiry.email && (
                  <a
                    href={`mailto:${selectedEnquiry.email}`}
                    className="btn btn-light btn-sm d-inline-flex align-items-center gap-2 border"
                  >
                    <Mail size={15} />
                    <span>{selectedEnquiry.email}</span>
                  </a>
                )}
              </div>

              {/* Message Payload */}
              <div className="mb-4">
                <h6 className="fw-bold small text-muted text-uppercase mb-2">Message Body</h6>
                <div className="p-3 bg-light rounded border text-dark" style={{ lineHeight: '1.6' }}>
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Hardware Repair Progress Tracker (If repair-related) */}
              {selectedEnquiry.enquiryType?.includes('Repair') && (
                <div className="card p-3 border mb-4 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Wrench size={18} className="text-danger" />
                    <h6 className="fw-bold mb-0 text-dark">Smartphone Repair Service Stage</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={selectedEnquiry.repairProgress || 'Received'}
                      onChange={(e) => void handleRepairProgressChange(selectedEnquiry.id, e.target.value)}
                      disabled={savingId === selectedEnquiry.id}
                    >
                      <option value="Received">1. Device Received & Inspected</option>
                      <option value="In Diagnosis">2. In Diagnosis / Bench Testing</option>
                      <option value="Part Allocated">3. Genuine Spare Screen / Battery Allocated</option>
                      <option value="Repair Complete">4. Repair Completed & Quality Tested</option>
                      <option value="Delivered">5. Handed Over to Customer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Internal Staff Notes */}
              <div>
                <h6 className="fw-bold small text-dark mb-2">Internal Staff Notes</h6>
                <textarea
                  rows={3}
                  className="form-control form-control-sm mb-2"
                  placeholder="Record customer conversation notes, quotes offered, or pickup promises..."
                  value={localNote}
                  onChange={(e) => setLocalNote(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-brand-primary btn-sm px-3"
                  onClick={() => void handleSaveNote()}
                  disabled={isSavingNote}
                >
                  Save Internal Note
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-5 text-center border rounded-4 bg-white" style={{ borderColor: 'var(--border-color)' }}>
              <Inbox size={40} className="text-muted mx-auto mb-2" />
              <h6 className="fw-bold text-dark">Select an enquiry to view details</h6>
              <p className="text-muted small mb-0">
                Click any message on the left panel to review message content, update status, and manage repair stages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

