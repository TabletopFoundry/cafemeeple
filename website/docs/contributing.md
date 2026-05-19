---
id: contributing
title: Contributing
sidebar_label: Contributing
sidebar_position: 12
---

# Contributing

Thanks for your interest. CaféMeeple stays sharp because contributors keep it small. Read this short guide before opening a PR.

## Prerequisites

- Node.js 20 LTS (see `.nvmrc`)
- npm 9+

## Setup

```bash
git clone https://github.com/TabletopFoundry/cafemeeple.git
cd cafemeeple
nvm use
npm install
npm run dev
```

## Before you commit

Run the three checks the CI runs:

```bash
npm run lint
npm run typecheck
npm run build
```

A PR with red CI will not be reviewed. A PR with green CI usually gets a response within a few days.

## Code style

- **TypeScript strict mode** — unused locals/params are errors.
- **Component files** — PascalCase (e.g. `GameModal.tsx`).
- **Utility files** — kebab-case (e.g. `date-utils.ts`).
- **Types** — defined in `lib/types.ts`; use `Pick<>` / `Omit<>` for view-specific subsets. Don't invent shadow types.
- **Constants** — centralised in `lib/constants.ts`. Never hard-code an enum value.
- **CSS** — Tailwind 4 utilities only. The palette is violet / emerald / amber / blue / red — don't reach for new hues without discussion.

## Architectural guard-rails

- Admin pages are `"use client"` orchestrators. They render shared primitives from `components/ui.tsx`; they do not embed business logic.
- API routes return `Response.json()`. Errors follow `{ "error": string }`.
- Database queries use **parameterised** statements — never string interpolation for user input.
- New features that need a new table or column require an entry in the [Changelog](./changelog).

## Adding a new admin page

1. Create `app/admin/<feature>/page.tsx` with `"use client"`.
2. Extract sub-components into `app/admin/<feature>/components/`.
3. Add API routes under `app/api/<feature>/`.
4. Add types to `lib/types.ts`; constants to `lib/constants.ts`.
5. Add the nav entry to `components/Sidebar.tsx`.
6. Update the docs site (this site) under `website/docs/`.

## Issue triage

We label issues:

- **good first issue** — small, well-scoped, no architectural decisions required.
- **help wanted** — bigger, but the design is clear.
- **discussion** — needs alignment before code is written. Comment first.

## Code of Conduct

We follow the [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be kind. Assume good faith. If you witness or experience unacceptable behaviour, contact the maintainers via a private GitHub Discussion or DM.

## License

By contributing you agree your contribution will be licensed under the project's open-source license.
