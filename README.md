This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Administration locale (`/admin`)

The `/admin` back office needs a local PostgreSQL database. First-time setup:

```bash
cp .env.example .env
# fill in SESSION_SECRET (openssl rand -base64 32) and a dev ADMIN_EMAIL / ADMIN_PASSWORD

pnpm db:up       # start PostgreSQL (Docker)
pnpm db:migrate  # apply Prisma migrations
pnpm db:seed     # create the dev admin account from ADMIN_EMAIL / ADMIN_PASSWORD
pnpm dev         # start the site, then sign in at /connexion
```

Day-to-day commands:

| Command | What it does |
| --- | --- |
| `pnpm db:up` | Start the local PostgreSQL container (`docker-compose.dev.yml`) |
| `pnpm db:down` | Stop it |
| `pnpm db:migrate` | Apply Prisma migrations (`prisma migrate dev`) |
| `pnpm db:seed` | (Re)create the dev admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| `pnpm db:seed:demo` | Load (or refresh) the fictional `DEMO_NA` demo dataset — idempotent |
| `pnpm db:clear:demo` | Remove only the `DEMO_NA` dataset (asks for explicit confirmation) |
| `pnpm dev` | Start the Next.js site |

### Local demo dataset (`DEMO_NA`)

`pnpm db:seed:demo` loads a 100 % fictional dataset (20 biens, owners, promoters, programs, intermediaries, prospects, visits, actions, opportunities, mandates, commissions) for client demos. Every row has a `demona-…` id and a `DEMO_NA` marker, e-mails are on `example.test` and phone numbers follow the unallocated `+212 6 00 00 xx xx` pattern. Existing users, properties and imports are never touched; relative dates (relances today/overdue/upcoming) are refreshed on every run. The admin shows a small "Données de démonstration locales" banner while it is loaded — the public site never does.

The four demo accounts (`*.demo@example.test`) cannot sign in unless `DEMO_USER_PASSWORD` (12+ characters) is set when seeding. Both scripts refuse to run against a non-local `DATABASE_URL`. Pages prerendered by `pnpm build` (home, off-market, villes) only pick up demo data loaded before the build — `pnpm dev` always reflects it.

PostgreSQL is only exposed on `127.0.0.1:5433` (not the default `5432`) to avoid clashing with other local projects.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
