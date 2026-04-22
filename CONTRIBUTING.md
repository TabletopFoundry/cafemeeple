# Contributing to CaféMeeple

Thank you for your interest in contributing! This guide will help you get up and running.

## Prerequisites

- **Node.js** 20 LTS (see `.nvmrc`)
- **npm** 9+

## Setup

```bash
# Switch to the correct Node version
nvm use

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

### Before Committing

```bash
npm run lint        # ESLint check
npm run typecheck   # TypeScript type checking
npm run build       # Production build
```

### Code Style

- **TypeScript** — strict mode enabled, unused locals/params are errors
- **Components** — PascalCase filenames (e.g., `GameModal.tsx`)
- **Utilities** — kebab-case filenames (e.g., `date-utils.ts`)
- **Types** — defined in `lib/types.ts`; use `Pick<>` / `Omit<>` for view-specific subsets
- **Constants** — centralised in `lib/constants.ts`; never hard-code enum values
- **CSS** — Tailwind CSS 4 utility classes; colour palette: violet/emerald/amber/blue/red

### Architecture

- **Admin pages** use `"use client"` — they are client component orchestrators
- **API routes** return `Response.json()` with `{ error: string }` on failure
- **Database** — SQLite via `better-sqlite3`; always use parameterised queries
- **Shared UI** — reusable primitives live in `components/ui.tsx`

### Adding a New Admin Page

1. Create `app/admin/<feature>/page.tsx` with `"use client"`
2. Add sub-components under `app/admin/<feature>/components/`
3. Add API routes under `app/api/<feature>/`
4. Add types to `lib/types.ts`
5. Add navigation entry to `components/Sidebar.tsx`

## Project Structure

See the [README](./README.md#-project-structure) for a full directory overview.
