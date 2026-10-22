import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="privacy-page pb-5">
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
                Privacy Policy
              </li>
            </ol>
          </nav>

          <h1 className="fw-bold fs-3 text-dark mb-1">Privacy Policy</h1>
          <p className="text-muted small mb-0">
            How Muganiyaa-Mobiles handles information when you use this website.
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div
          className="card p-4 p-md-5 border rounded-4 bg-white shadow-sm max-w-3xl mx-auto"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="p-3 rounded-circle bg-light text-danger">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-1">
                Your Privacy Matters
              </h4>
              <small className="text-muted">Last updated: October 2026</small>
            </div>
          </div>

          <div
            className="d-flex flex-column gap-4 text-muted"
            style={{ lineHeight: '1.7', fontSize: '0.92rem' }}
          >
            <section>
              <h5 className="fw-bold text-dark mb-2">
                1. Information You Submit
              </h5>
              <p>
                If you send a product enquiry, contact request, or repair
                request, the information you provide—such as your name, phone
                number, email address, message, and the product or service
                you’re asking about—is used to respond to you and manage your
                request.
              </p>
              <p className="mb-0">
                Please do not include passwords, payment card details, or other
                sensitive personal information in forms or chat messages.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                2. How Enquiries Are Processed
              </h5>
              <p>
                Enquiry and repair-request submissions are sent to the
                application’s configured database so they can appear in the
                store’s admin panel. The enquiry form may also use Web3Forms to
                send an email notification to the store. These services process
                the information needed to deliver and manage your request.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                3. AI Product Assistant
              </h5>
              <p>
                If you use the AI assistant, your message and relevant recent
                chat context are sent to Google Gemini through a server-side
                function to generate a response. The function may also provide
                relevant catalogue information so the assistant can answer
                product questions and suggest available products.
              </p>
              <p className="mb-0">
                AI responses can be incomplete or inaccurate. Confirm current
                prices, availability, specifications, and offers with the store
                before making a purchase decision.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                4. Catalogue and Website Data
              </h5>
              <p className="mb-0">
                Product, category, offer, banner, service, store-contact, and
                website-content information is managed through the application
                and its configured Supabase database. Some preferences, such as
                wishlist selections, may be stored in your browser.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                5. Cookies and Analytics
              </h5>
              <p className="mb-0">
                This policy does not describe analytics or advertising cookies.
                If analytics, advertising, or additional tracking services are
                added, this policy should be updated to explain what they
                collect and how they are used.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                6. Data Access and Retention
              </h5>
              <p className="mb-0">
                Submitted information may be accessible to authorised store
                administrators so they can respond to requests. It is retained
                for as long as needed to handle the request and for applicable
                business or legal record-keeping. Contact the store to ask about
                a submission or request correction or deletion, where
                applicable.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                7. Third-Party Services
              </h5>
              <p className="mb-0">
                The website uses Supabase for database and application
                services, Web3Forms for enquiry email notifications, and Google
                Gemini for AI assistant responses. Their processing of
                information is subject to their respective terms and privacy
                policies.
              </p>
            </section>

            <section>
              <h5 className="fw-bold text-dark mb-2">
                8. Contact the Store
              </h5>
              <p className="mb-0">
                For questions about this policy or information you submitted,
                contact Muganiyaa-Mobiles using the phone number or contact
                form on our{' '}
                <Link to="/contact" className="text-danger">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>

          <div className="mt-5 pt-4 border-top text-center">
            <Link to="/" className="btn btn-brand-primary btn-sm px-4 py-2">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}