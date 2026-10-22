# Muganiyaa Mobiles

A responsive product catalogue and customer enquiry website for Muganiyaa Mobiles, an electronics and telecom retailer in Tenkasi. Customers can browse products and services, compare product variants, and contact the store. The owner can manage catalogue content and customer enquiries through a protected admin area.

**Live website:** https://karuppasamy-arumugam.github.io/muganiya-mobiles-demo/

## Features

### Public website

- Product catalogue with category, brand, price, and availability details
- Product pages with images, specifications, colours, and supported variants
- Search, filters, and wishlist
- Store services, offers, banners, and contact information
- Enquiry forms and direct call or WhatsApp links
- Store location and map link
- AI assistant for questions about the catalogue and store

### Admin area

The owner portal is available at:

`/#/store-owner-7f3c9a2e6b41d805/login`

The route name is not a security control. Access must be protected by Supabase authentication, authorization checks, and Row Level Security policies.

Admin features include product, category, brand, offer, banner, service, website-content, contact-detail, and enquiry management.

## Technology

- React
- Vite
- React Router with hash-based routing
- Supabase: PostgreSQL, Auth, Storage, Realtime, and Edge Functions
- Gemini API for the AI assistant
- Web3Forms for enquiry email notifications
- Bootstrap utilities and custom CSS
- Lucide React icons

## Project structure

```text
.
├── public/                       # Static assets and hosting files
├── src/
│   ├── components/
│   │   ├── admin/                # Admin layout and shared admin components
│   │   └── common/               # Header, footer, product cards, floating actions
│   ├── context/                  # Authentication, catalogue, and wishlist state
│   ├── pages/
│   │   ├── admin/                # Admin screens
│   │   └── public/               # Customer-facing pages
│   ├── services/                 # Supabase, catalogue, and browser storage services
│   ├── App.jsx                   # Application routes
│   └── main.jsx                  # Application entry point
├── supabase/
│   ├── functions/                # Edge Functions
│   └── migrations/               # Database schema changes
├── package.json
└── vite.config.js
```

## Run locally

### Prerequisites

- Node.js and npm
- Supabase CLI
- Docker, if running Supabase locally

### Install dependencies

```bash
git clone https://github.com/Karuppasamy-Arumugam/muganiyaa-mobiles.git
cd muganiyaa-mobiles
npm install
```

### Configure the frontend

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Use the project URL and publishable/anon key from Supabase project settings. These frontend values are visible in the built website; protect data with correct Row Level Security policies. Never put a Supabase service-role key or provider API key in a `VITE_` variable.

### Start the app

```bash
npm run dev
```

Vite will print the local address to open in your browser.

## Supabase setup

Apply the migrations to the intended Supabase project and confirm that required tables, policies, storage buckets, and Edge Functions are configured.

For local development, start Supabase with the CLI:

```bash
npx supabase start
```

To serve the AI assistant locally with its secrets, create `supabase/functions/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
WEB3FORMS_ACCESS_KEY=your_web3forms_access_key
```

Do not commit this file. Keep provider secrets in the Edge Function environment, not in frontend code.

Serve the functions locally:

```bash
npx supabase functions serve muganiyaa-assistant --env-file supabase/functions/.env
```

The enquiry email function is named `send-enquiry`. Configure its required secrets in the same protected function environment if it uses them.

For a hosted Supabase project, set the function secrets in that project’s Edge Function settings or with the Supabase CLI. Deploy the functions to the linked project using the CLI. Do not deploy local `.env` files or commit secret values.

## Build

Create the production build:

```bash
npm run build
```

Preview the generated build locally:

```bash
npm run preview
```

Deploy the `dist/` output using the hosting provider configured for this repository. For GitHub Pages, verify that the Vite base path and deployment workflow match the repository name, and that the production frontend environment points to the hosted Supabase project rather than a local URL.

## Security and operations

- Do not store real credentials in this README or in source control.
- Keep Gemini and Web3Forms keys in server-side Edge Function secrets.
- Use only the Supabase publishable/anon key in frontend configuration.
- Protect admin data with Supabase Auth, server-side authorization, and Row Level Security.
- Do not grant public users permission to read customer enquiries.
- Validate and rate-limit public enquiry and AI requests on the server.
- Restrict production Auth redirect URLs to the real website domains.
- Disable public account registration if the store only needs owner-managed accounts.
- Keep database migrations in source control and apply them to production before deploying code that depends on them.
- Rotate any key that was included in a shared archive, screenshot, or public repository.

## Customer enquiries

Enquiry submissions are stored in Supabase and may trigger an email notification through the configured email service. Email delivery depends on the Edge Function secrets and provider configuration. Verify both database storage and email delivery in the target environment before launch.

## Scope

This website supports product discovery and store enquiries. It does not provide an online checkout or payment flow unless those features are added separately.

## License

This project is proprietary and intended for Muganiyaa Mobiles. Do not reuse or redistribute its branding, store content, or customer data without permission.