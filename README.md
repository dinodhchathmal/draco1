# DRACO storefront

A Next.js App Router storefront for DRACO, designed for LKR bank-transfer orders and operated with Supabase. Product pages, cart and checkout, secure order lookup, private receipt uploads, administrator screens, inventory reservations, a launch-promotion cap, and newsletter consent/unsubscribe are included.

## Current project defaults

- Market: Sri Lanka; currency: LKR.
- Initial tee price: LKR 4,590; sizes M/L; colours White/Black.
- Initial inventory is **zero** because no stock count was provided.
- Standard delivery starts at LKR 450 and can be changed in Admin → Settings.
- Payment is bank transfer / advance payment. Bank details are intentionally blank until DRACO supplies them.
- The first-three-T-shirt promotion is present but inactive until its discount amount or percentage is set.
- Legal pages are drafts and must be reviewed against DRACO’s actual practices and Sri Lankan requirements.
- Editorial photos are illustrative fashion imagery; they do not represent actual DRACO product artwork. Upload genuine product photography in Admin → Products before selling.

## Local setup

1. Install Node.js 20 or newer and pnpm (or use npm).
2. Copy `.env.example` to `.env.local` and set the Supabase values described below.
3. Install dependencies: `pnpm install`.
4. Apply the migration to a new or reviewed Supabase project: `pnpm dlx supabase@latest link --project-ref <project-ref>` then `pnpm dlx supabase@latest db push`.
5. Start the site with `pnpm dev` and open `http://localhost:3000`.

Do not run the migration against an unrelated production database. It creates a new schema and storage buckets; inspect the SQL and target project before applying it.

## Environment variables

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key; RLS remains enabled |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; required for atomic order creation, private receipt operations, admin APIs, and rate limiting. Never expose as `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_SITE_URL` | Public origin for metadata and sitemap |
| `CRON_SECRET` | Protects the hourly expired-reservation cleanup route |
| `RATE_LIMIT_SALT` | Optional high-entropy salt for one-way IP hashes; if omitted, the server key is used |

Set secrets in Vercel Project → Settings → Environment Variables for Production, Preview, and Development as needed. Use the publishable key and URL from the selected Supabase project’s Connect/API settings. Keep the service-role key server-side and never commit `.env.local`.

## First administrator

There is no public admin registration. Create the first user in Supabase Authentication, then run this SQL in the selected project’s SQL editor with that user’s Auth UUID:

```sql
insert into public.profiles (user_id, role)
values ('<AUTH_USER_UUID>', 'admin')
on conflict (user_id) do update set role = 'admin';
```

Open `/admin/login`. Do not share the first admin credential. Create another named administrator only when required.

## Database and security notes

- `supabase/migrations/20261009120000_draco_store.sql` is the schema source of truth.
- RLS is enabled on every application table. Customer/order/subscriber/receipt records are private; only active catalog rows are public.
- Public order access requires both a high-entropy reference and a private UUID access token. The token is stored only as a SHA-256 hash and should not be shared.
- Checkout uses `create_store_order`, which reads current prices, reserves stock, applies a locked promotion allowance, records immutable item snapshots, and writes order history in one database transaction.
- Reservations expire after 60 minutes. A Vercel Cron route calls the cleanup RPC hourly; order creation also cleans up expired reservations. Configure `CRON_SECRET` before deployment.
- Bank-transfer receipts are private Supabase Storage objects, limited to JPEG/PNG/PDF and 5 MB. Admin receipt links are short-lived signed URLs.
- Product images are public storefront assets; only admins can upload/delete them. Never upload private customer documents to that bucket.
- Newsletter subscribers are private. Consent is required; an individual one-time unsubscribe link is shown after subscribing. Add a mail provider before promising email delivery (the current feature stores subscribers only).
- The rate-limit RPC stores salted hashes of request IPs, not raw IP addresses.

## Vercel deployment

Create a Vercel project from the GitHub repository with the repository root as the project root. Use Next.js defaults and the standard build command `pnpm build` (or the package manager selected for the repository). Add all environment variables above. The included `vercel.json` configures hourly reservation cleanup; use a Vercel plan that supports that schedule, or configure an external scheduler and call the protected route. Apply the Supabase migration and configure environment variables before enabling production checkout.

## Administration

- `/admin`: real order counts, verified revenue, recent orders, inventory snapshot.
- `/admin/products`: create/publish/archive products, upload product photos, edit names/prices, add size/color/SKU variants.
- `/admin/orders`: inspect customer/order details, review private receipts, transition verified orders through fulfilment.
- `/admin/inventory`: stock adjustments with an audit trail and reservation checks.
- `/admin/promotions`: set and explicitly activate the first-three-qualifying-T-shirts offer.
- `/admin/settings`: delivery cost, WhatsApp number, and bank transfer instructions.

Configure bank instructions, actual product details and photography, stock quantities, social links, delivery coverage, and reviewed policies before accepting orders. The order receipt upload remains unavailable until bank instructions are saved.

## Checks

- `pnpm test:unit` — integer pricing and stock-reservation boundary checks.
- `pnpm typecheck` — TypeScript check.
- `pnpm lint` — ESLint.
- `pnpm build` — production build (requires build-time font/network access; runtime database routes need configured credentials).

The browser cart is convenience state only. Checkout ignores client prices/totals and recalculates against database rows. Run production verification against a dedicated Supabase project with test products and no customer data.

## Source delivery

The ZIP includes application source, migration, lockfile when generated, and documentation. It excludes `.env*` secrets except `.env.example`, dependency directories, and build output. Create a public GitHub repository named `draco-storefront` and upload the extracted project files (or push the extracted folder with Git); then import that repository into Vercel.
