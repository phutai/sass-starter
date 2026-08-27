# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js SaaS starter using the App Router. Route groups live in `app/`: `(login)` contains sign-in/sign-up flows, `(dashboard)` contains authenticated pages, and `app/api` contains API routes. UI primitives are in `components/ui`, following shadcn/ui conventions. Shared utilities and server logic live in `lib`, with database code under `lib/db`, auth helpers under `lib/auth`, and Stripe integration under `lib/payments`. Drizzle migrations are stored in `lib/db/migrations`. Global styles are in `app/globals.css`.

## Build, Test, and Development Commands

- `pnpm dev`: start the Next.js dev server with Turbopack.
- `pnpm build`: create a production build.
- `pnpm start`: run the production server after building.
- `pnpm db:setup`: create a local `.env` file interactively.
- `pnpm db:generate`: generate Drizzle migration files from schema changes.
- `pnpm db:migrate`: apply migrations to Postgres.
- `pnpm db:seed`: seed the default test user and team.
- `pnpm db:studio`: open Drizzle Studio for database inspection.

## Coding Style & Naming Conventions

Write TypeScript with strict types enabled. Prefer named exports for shared helpers and components. Use the `@/` path alias, for example `@/lib/db/queries`. Keep React components in PascalCase, functions and variables in camelCase, and route filenames lowercase as required by Next.js (`page.tsx`, `route.ts`, `layout.tsx`). Match the surrounding style: most app and database files use two-space indentation and single quotes, while generated shadcn/ui components may use double quotes.

## Testing Guidelines

No automated test script is currently defined in `package.json`. Before submitting changes, run `pnpm build` and manually verify affected flows. For auth, dashboard, database, or Stripe changes, test the relevant route locally with `pnpm dev`; Stripe webhook work should also be checked with `stripe listen --forward-to localhost:3000/api/stripe/webhook`. If adding tests, place them near the feature or in a clear test directory and add a matching `pnpm test` script.

## Commit & Pull Request Guidelines

Recent history uses short imperative commits, often Conventional Commit style such as `fix: upgrade Next.js...`; follow that pattern when practical. Pull requests should include a clear description, linked issue when available, migration notes for schema changes, and screenshots for UI changes. Mention required environment variables, database migrations, or Stripe setup steps so reviewers can reproduce the change.

## Security & Configuration Tips

Do not commit `.env` files, Stripe secrets, database URLs, or auth secrets. Keep schema changes in `lib/db/schema.ts` paired with generated migrations. Use `openssl rand -base64 32` for a strong `AUTH_SECRET`.
