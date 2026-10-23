import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    login,
    mfaStep,
    verifyMfaCode,
    cancelMfa,
    authError
  } = useAuth();

  const navigate = useNavigate();
  const adminPath = '/store-owner-7f3c9a2e6b41d805';

  async function handleFormSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        navigate(adminPath);
      } else if (!result.requiresMfa && !result.requiresMfaEnrollment) {
        setError(result.error || authError || 'Sign-in failed. Please try again.');
      }
    } catch (loginError) {
      console.error('Admin sign-in failed:', loginError);
      setError('Sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await verifyMfaCode(code);

      if (result.success) {
        navigate(adminPath);
      } else {
        setError(result.error || 'Code verification failed. Please try again.');
      }
    } catch (verificationError) {
      console.error('MFA verification failed:', verificationError);
      setError('Code verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelMfa() {
    setError('');
    setCode('');
    setIsSubmitting(true);
    try {
      await cancelMfa();
    } catch (cancelError) {
      console.error('Could not cancel authenticator verification:', cancelError);
      setError('Could not cancel verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isMfaStepActive = Boolean(mfaStep);

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      style={{ backgroundColor: 'var(--secondary-bg)' }}
    >
      <div className="mb-4">
        <BrandLogo size="lg" />
      </div>

      <div
        className="card p-4 p-md-5 border rounded-4 bg-white shadow-sm w-100"
        style={{ maxWidth: '440px', borderColor: 'var(--border-color)' }}
      >
        <div className="text-center mb-4">
          <div
            className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{ backgroundColor: 'var(--soft-blush)', color: 'var(--primary-red)' }}
          >
            {isMfaStepActive ? <ShieldCheck size={28} /> : <Lock size={28} />}
          </div>

          <h4 className="fw-bold text-dark mb-1">
            {mfaStep?.kind === 'enroll'
              ? 'Set Up Admin Verification'
              : mfaStep?.kind === 'challenge'
                ? 'Verify Your Sign-In'
                : 'Owner Administration'}
          </h4>

          <p className="text-muted small mb-0">
            {mfaStep?.kind === 'enroll'
              ? 'Scan the QR code with an authenticator app, then enter its 6-digit code.'
              : mfaStep?.kind === 'challenge'
                ? 'Enter the current 6-digit code from your authenticator app.'
                : 'Sign in with your Supabase admin account.'}
          </p>
        </div>

        {(error || authError) && (
          <div className="alert alert-danger py-2 small" role="alert" aria-live="assertive">
            {error || authError}
          </div>
        )}

        {!isMfaStepActive ? (
          <form onSubmit={handleFormSubmit} className="d-flex flex-column gap-3">
            <div>
              <label htmlFor="adminEmail" className="form-label small fw-bold text-dark">
                Email
              </label>
              <input
                id="adminEmail"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username" disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="adminPassword" className="form-label small fw-bold text-dark">
                Password
              </label>
              <input
                id="adminPassword"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password" disabled={isSubmitting}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-brand-primary w-100 py-2 fw-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Continue to Verification'}
              {!isSubmitting && <ArrowRight size={16} className="ms-1" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="d-flex flex-column gap-3">
            {mfaStep.kind === 'enroll' && (
              <div className="text-center">
                <div className="border rounded-3 p-3 mb-3 d-inline-block bg-white">
                  <img
                    src={mfaStep.qrCode}
                    alt="Authenticator setup QR code"
                    width="190"
                    height="190"
                    className="img-fluid"
                  />
                </div>

                <div className="small text-muted mb-2">
                  If you can’t scan the QR code, enter this setup key in your authenticator app:
                </div>

                <code className="d-block bg-light rounded p-2 text-break">
                  {mfaStep.secret}
                </code>

                <div className="small text-muted mt-2">
                  Keep this setup key private. Anyone with it can generate your verification codes.
                </div>
              </div>
            )}

            <div>
              <label htmlFor="adminMfaCode" className="form-label small fw-bold text-dark">
                6-digit authenticator code
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Smartphone size={16} />
                </span>
                <input
                  id="adminMfaCode"
                  type="text"
                  className="form-control"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456" disabled={isSubmitting}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-brand-primary w-100 py-2 fw-bold"
              disabled={isSubmitting || code.length !== 6}
            >
              {isSubmitting
                ? 'Verifying…'
                : mfaStep.kind === 'enroll'
                  ? 'Verify and Enable MFA'
                  : 'Verify and Sign In'}
              {!isSubmitting && <ShieldCheck size={16} className="ms-1" />}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={handleCancelMfa}
              disabled={isSubmitting}
            >
              <X size={16} className="me-1" />
              Cancel and sign out
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-top text-center">
          <Link to="/" className="text-decoration-none small text-muted hover-red">
            ← Return to Public Website
          </Link>
        </div>
      </div>

      <div
        className="text-center mt-3 text-muted small"
        style={{ maxWidth: '420px', fontSize: '0.75rem' }}
      >
        <ShieldAlert size={14} className="text-secondary me-1" />
        Admin access requires an active profile and authenticator verification.
      </div>
    </div>
  );
}

