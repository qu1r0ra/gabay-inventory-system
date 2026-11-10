# GABAY Inventory System

A web application tailored for the inventory needs of the GABAY organization. Created for CSSWENG (Software Engineering).

## Features

- Sign up and log in with a username and password
- Inventory table with add, edit, and delete item pages
- Check out items, and record deposits, distributions, and disposals
- Notifications for low stock, near expiry, and expired items
- Dashboard and activity log
- Admin accounts also see Edit Item, Delete Item, Notifications, and Generate Report in the sidebar, and the report card on the dashboard
- PDF report generation

## Stack

React 19, Vite 6, TypeScript, Tailwind CSS 4, React Router 7, and Supabase (Auth and PostgreSQL).

## Getting started

You need Node.js with npm and a Supabase project.

1. Clone the repository and install the dependencies:

   ```bash
   git clone https://github.com/qu1r0ra/gabay-inventory-system.git
   cd gabay-inventory-system
   npm install
   ```

2. Set up the Supabase database. The repository does not include a schema file yet. The tables, functions, and enums are described in [`src/lib/db/db.rawtypes.ts`](src/lib/db/db.rawtypes.ts), and the app uses the `items`, `item_stocks`, `transactions`, `corrections`, `notifications`, and `users` tables. `src/lib/db/seed.sql` adds sample items and stock, but it first clears existing rows, so run it only on a development project.

3. Enable email and password sign-in in Supabase Auth. The app turns each username into an address on the `@gabay.org` domain, so accounts use that format.

4. Create a `.env` file in the project root:

   ```
   VITE_SUPABASE_URL=<your Supabase project URL>
   VITE_SUPABASE_ANON_KEY=<your Supabase anon key>
   ```

   Git ignores `.env`. Do not commit it.

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the app for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run vercel-dev` | Run the app with Vercel's local runtime (needs the Vercel CLI) |
| `npm run gen-types` | Generate Supabase TypeScript types into `db.rawtypes.ts` in the project root (needs the Supabase CLI and a login) |

The generated file lands in the project root, not in `src/lib/db/`. Move it there to replace the committed copy.

## Deployment

`vercel.json` sends every path to the app root, so client-side routes load on Vercel.

## Project layout

- `src/pages`: one file per screen
- `src/components`: shared and feature components
- `src/lib/db`: Supabase client, auth context, API layer, query builder, generated types, and seed SQL
- `src/lib/pdf.ts`: PDF report helper
- `tests`: a transaction check script
