# FoundIt – Smart Campus Lost & Found Platform

FoundIt is a centralized, privacy-protected lost-and-found web application designed for university students, faculty, and campus administrators. The platform enables students to report lost belongings, log found items, search and filter the campus inventory using conventional database queries, submit ownership claims, and securely recover their possessions through an administrator-managed verification process.

---

## 1. Technology Stack

- **Framework**: Next.js 16 (App Router with Partial Prerendering)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 (Custom University Palette, WCAG AAA compliant)
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Authentication & Storage)
- **Icons**: Lucide React
- **Deployment**: Vercel

---

## 2. Architecture & Design Principles

### Core Safety & Privacy Invariants
1. **Conventional Search & Filtering**: Built using PostgreSQL indexes on categories, campus locations, and dates. Zero opaque ML models, hallucination risks, or third-party AI dependencies.
2. **Separation of Public vs. Private Identifiers**: Public item cards and catalog pages reveal only general characteristics (category, colour, brand, general location, and date). Private ownership identifiers (e.g. engravings, internal contents, phone wallpaper) are stored in a restricted `private_identifiers` table inaccessible to ordinary students and only visible to administrators for claim verification.
3. **One Approved Claim Rule**: Enforced both via PostgreSQL partial unique index (`idx_one_approved_claim_per_item`) and server-side atomic transactions to prevent conflicting handovers.
4. **Duplicate Claim Prevention**: PostgreSQL unique index (`idx_one_claim_per_student_per_item`) stops multiple concurrent claim submissions from the same student for the same item.
5. **Physical Handover Protocol**: An item transitions to `recovered` only after physical handover at the campus help desk is explicitly recorded by a campus administrator.

---

## 3. Project Directory Structure

```text
Lost & Found Real asf/
├── .env.example                     # Environment variables template
├── README.md                        # Project documentation & setup instructions
├── next.config.ts                   # Next.js configuration
├── package.json                     # Project manifest and scripts
├── tsconfig.json                    # TypeScript compiler options
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Unified items, profiles, & base indexes
│   │   └── 002_claims_and_audit.sql # Claims lifecycle, audit logs & atomic RPCs
│   ├── policies.sql                 # Row Level Security (RLS) policies
│   ├── storage.sql                  # Supabase Storage bucket & policies
│   └── seed.sql                     # Initial campus locations & reference data
├── tests/
│   ├── validation.test.mjs          # Date, categories, & upload security tests
│   └── claims-handover.test.mjs     # Lifecycle, duplicate claims & race condition tests
└── src/
    ├── proxy.ts                     # Next.js 16 Edge Proxy (auth & admin route protection)
    ├── app/
    │   ├── globals.css              # Tailwind CSS theme & campus tokens
    │   ├── layout.tsx               # Root layout with Navbar and Footer
    │   ├── page.tsx                 # Modern institutional home / landing page
    │   ├── items/                   # Catalog, report-lost, report-found, [id]
    │   ├── claims/                  # Student claims dashboard & /submit form
    │   ├── admin/                   # Administrator verification desk & audit trail
    │   └── auth/                    # Login, registration & student profiles
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx           # Institutional header with responsive mobile drawer
    │   │   ├── Footer.tsx           # Campus desk location, helpline & operating hours
    │   │   ├── Container.tsx        # Standard max-width container wrapper
    │   │   └── PageHeader.tsx       # Standardized page title & actions banner
    │   ├── ui/
    │   │   ├── Button.tsx           # Standardized campus buttons with loading state
    │   │   ├── Badge.tsx            # Lifecycle status badges
    │   │   ├── Card.tsx             # Professional minimal cards
    │   │   ├── Input.tsx            # Accessible form input with error states
    │   │   ├── Select.tsx           # Accessible select dropdown
    │   │   ├── ImageUpload.tsx      # Pre-upload preview & 5MB type validation
    │   │   ├── EmptyState.tsx       # Zero-state empty search/claims display
    │   │   └── LoadingSpinner.tsx   # Loading spinner & skeleton placeholders
    │   ├── forms/
    │   │   ├── ReportLostForm.tsx   # Lost item reporting form
    │   │   ├── ReportFoundForm.tsx  # Found item form + private challenge
    │   │   └── ClaimSubmitForm.tsx  # Ownership claim submission form
    │   └── admin/
    │       └── AdminClaimsTable.tsx # Admin verification & comparison terminal
    ├── lib/
    │   ├── constants.ts             # Campus locations, categories, configurable desk
    │   ├── utils.ts                 # Class merger (cn) and date formatters
    │   └── supabase/
    │       ├── client.ts            # Client-side Supabase browser client
    │       ├── server.ts            # Server-side Supabase client for Server Components
    │       ├── storage.ts           # Storage upload helper
    │       └── middleware.ts        # Edge session updater and route guard
    └── types/
        ├── database.ts              # Supabase table models, claim enums & audit logs
        └── index.ts                 # Type exports & filter interfaces
```

---

## 4. Setup & Local Development Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous API key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret (kept secure on server)
- `NEXT_PUBLIC_COLLECTION_LOCATION`: Optional custom desk address (defaults to *Student Activity Center, Ground Floor, Room G-04*)

### Step 3: Run Database Migrations
In your **Supabase Dashboard** -> **SQL Editor**, execute the SQL scripts in this exact order:
1. `supabase/migrations/001_initial_schema.sql` (Tables, profiles auto-sync trigger, base indexes)
2. `supabase/migrations/002_claims_and_audit.sql` (Lifecycle constraints, audit logs, atomic RPCs)
3. `supabase/policies.sql` (Row Level Security data privacy policies)
4. `supabase/storage.sql` (Configures the `item-photos` storage bucket & upload policies)
5. `supabase/seed.sql` (Populates standard campus buildings & locations)

### Step 4: Promote an Account to Administrator
Admin privileges cannot be self-assigned during registration. Promote an account in the Supabase SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@college.edu';
```

### Step 5: Run Automated Tests & Development Server
```bash
# Run unit, lifecycle, and security tests
npm test

# Run ESLint verification
npm run lint

# Test production build
npm run build

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
