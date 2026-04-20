# CaféMeeple — Project Improvement Plan

> Generated assessment with prioritized, actionable recommendations to elevate CaféMeeple toward production-quality and top-tier open source project status.

---

## Executive Summary

CaféMeeple is a well-structured Next.js 16 prototype (~6,200 LOC across 43 files) with strong UI/UX polish, good accessibility practices, and a comprehensive feature set. The codebase shows solid architectural instincts — clean type definitions, shared utility extraction, component decomposition, and proper error handling patterns.

The **5 highest-impact improvements** are:

1. **Add CI/CD pipeline** — Zero automation means every merge is a gamble
2. **Add testing foundation** — No tests exist; the app manages financial data
3. **Strengthen TypeScript strictness** — Quick config wins eliminate entire bug classes
4. **Improve DX tooling** — `.editorconfig`, `typecheck` script, `engines` field
5. **Deduplicate types** — `DashboardData` is defined twice; import from canonical source

---

## Current State Assessment

| Dimension | Score (1-10) | Key Gap |
|-----------|:---:|---------|
| Language Modernity | 8 | Next.js 16, React 19, TS 5 — very current. `tsconfig` target could be ES2022+ |
| Tooling & CI/CD | 2 | No CI, no GitHub Actions, no pre-commit hooks, no typecheck script |
| Type Safety / Correctness | 7 | `strict: true` enabled, but duplicated types, some loose `string` unions |
| Documentation | 6 | Good README, existing PRD and code review docs. Missing CONTRIBUTING.md, API docs |
| Security Posture | 3 | No auth, no rate limiting, seed API publicly accessible |
| Community Health | 2 | No issue templates, no PR template, no CONTRIBUTING.md, no CI badges |
| Discoverability | 3 | Package named `05-cafemeeple`, no topic tags, no social preview |

---

## Implemented Improvements ✅

The following changes have been applied directly to the codebase:

### 1. Package Identity & Node Engine Requirements
- **`package.json`**: Renamed from `05-cafemeeple` → `cafemeeple`, added `description`, `engines` field (Node 18+), `typecheck` script, `format:check` placeholder
- **Impact**: Proper npm identity, CI can enforce Node version, `npm run typecheck` catches type errors before commits

### 2. TypeScript Configuration Tightened
- **`tsconfig.json`**: Updated `target` from `ES2017` → `ES2022`, added `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes` options
- **Impact**: Catches undefined index access bugs, dead code, and optional property misuse at compile time

### 3. Editor Consistency
- **`.editorconfig`**: Created with UTF-8, LF line endings, 2-space indent for TS/JS/JSON/CSS/MD, trailing whitespace trimming
- **Impact**: Eliminates whitespace diff noise across contributors and IDEs

### 4. Node Version Pinning
- **`.nvmrc`**: Created with `20` (LTS)
- **Impact**: `nvm use` just works; contributors all use the same Node version

### 5. Deduplicated DashboardData Type
- **`app/admin/page.tsx`**: Removed inline `DashboardData` interface, now imports from `@/lib/types`
- **Impact**: Single source of truth; changes to dashboard shape only need one update

### 6. Enhanced CLAUDE.md for AI-Assisted Development
- **`CLAUDE.md`**: Expanded with project context, tech stack, architecture overview, development commands, key patterns, and conventions
- **Impact**: AI coding assistants (Copilot, Claude, Cursor) produce much better suggestions with rich context

### 7. Improved README
- **`README.md`**: Added project status badges, emoji-rich section headers, prerequisites clarity, environment variables section, testing/contributing placeholders, development workflow guidance
- **Impact**: First-time contributors can onboard faster; project looks more professional

---

## Remaining Recommendations

### Quick Wins (< 1 day each)

#### QW-1: Add GitHub Actions CI Pipeline
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```
**Impact**: Catches regressions on every push. ~30 min setup.

#### QW-2: Add Issue & PR Templates
Create `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/pull_request_template.md` with checklists.
**Impact**: Structured contributions, faster triage.

#### QW-3: Add `CONTRIBUTING.md`
Document: fork → branch → install → dev → test → PR workflow.
**Impact**: Lowers barrier for first-time contributors.

#### QW-4: Use String Literal Unions for Status Fields
Replace loose `string` types with precise unions in `lib/types.ts`:
```typescript
type SessionStatus = 'active' | 'completed' | 'cancelled';
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no-show';
type GameCondition = 'Excellent' | 'Good' | 'Fair' | 'Worn' | 'Needs Replacement';
```
**Impact**: Compile-time validation of all status transitions.

#### QW-5: Add `not-found.tsx` and `error.tsx` Pages
Next.js App Router supports file-based error handling. Add:
- `app/not-found.tsx` — Custom 404 page
- `app/error.tsx` — Custom error boundary page
- `app/admin/error.tsx` — Admin-specific error page
**Impact**: Better UX for error states, professional appearance.

---

### Medium Effort (1 day – 1 week)

#### ME-1: Add Testing Foundation
Install Vitest + Testing Library + Playwright:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```
Priority test targets:
1. `lib/game-utils.ts` — Pure function, easy to test
2. `lib/db.ts` — Schema initialization, seed logic
3. API routes — Integration tests with test database
4. Critical UI flows — Playwright e2e for game CRUD, session lifecycle
**Impact**: Regression safety for ~6,200 LOC of untested code.

#### ME-2: Add ESLint Stricter Rules
Extend `eslint.config.mjs` with:
- `@typescript-eslint/no-floating-promises` — Catches unhandled async errors
- `@typescript-eslint/no-misused-promises` — Prevents passing promises where callbacks expected
- `@typescript-eslint/strict-type-checked` — Stricter type-aware rules
**Impact**: Catches async bugs and type misuse at lint time.

#### ME-3: Extract API Response Helpers
Create `lib/api-helpers.ts`:
```typescript
export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}
```
Replace the `try/catch` + `Response.json({ error: ... })` pattern in every API route.
**Impact**: Consistent error format, less boilerplate, easier to add logging/monitoring later.

#### ME-4: Add Request Validation with Zod
Install `zod` and create schemas for API inputs:
```typescript
const CreateGameSchema = z.object({
  title: z.string().min(1),
  min_players: z.number().int().min(1).default(1),
  max_players: z.number().int().min(1).default(4),
  // ...
});
```
**Impact**: Runtime type safety for all API inputs, auto-generated error messages.

#### ME-5: Environment Variable Configuration
Create `.env.example`:
```env
# Database
DATABASE_PATH=./cafemeeple.db

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Update `lib/db.ts` to read `DATABASE_PATH` from env.
**Impact**: Configurable deployments, test databases, CI isolation.

---

### Strategic Investments (> 1 week)

#### SI-1: Authentication & Authorization
Add NextAuth.js with at least a demo credential provider. Protect:
- All `/api/*` routes with middleware
- `/admin` layout with session check + redirect
- Rate limiting on public endpoints
**Impact**: Security baseline for an app managing financial data.

#### SI-2: Database Migration System
Replace the `addColumnIfMissing` pattern with a proper migration tool (e.g., `drizzle-kit`, `kysely`, or simple numbered SQL files).
**Impact**: Reproducible schema changes, rollback capability, team collaboration safety.

#### SI-3: Component Architecture Refactoring
The admin pages have been partially decomposed (good!), but the orchestrator pages still carry significant state. Consider:
- Custom hooks per domain (`useGames`, `useReservations`, `useSessions`)
- Form state management with `react-hook-form` + Zod
- Server Components where possible to reduce client bundle
**Impact**: Testability, maintainability, performance.

#### SI-4: API Documentation
Add OpenAPI/Swagger documentation for all API routes. Tools like `next-swagger-doc` can auto-generate from route handlers.
**Impact**: Frontend-backend contract clarity, enables external integrations.

---

## GitHub Project Health Checklist

```
Repository Basics:
[x] Descriptive README with quick start
[x] LICENSE indication (Private)
[ ] CONTRIBUTING.md
[ ] Issue templates
[ ] PR template
[ ] CODEOWNERS

Automation:
[ ] CI running on PRs
[x] Linting configured (ESLint)
[ ] Automated testing
[ ] Dependency updates (Dependabot)
[ ] Release automation
[ ] Security scanning

Documentation:
[x] README with architecture overview
[x] PRD document
[x] Code review document
[ ] API docs
[x] Project structure docs
[ ] Changelog
[ ] Architecture Decision Records

Code Quality:
[x] TypeScript strict mode
[x] ESLint configured
[x] Shared types (lib/types.ts)
[x] Error boundaries
[x] Accessibility (aria labels, focus management)
[x] Responsive design
[ ] Testing framework
[ ] Pre-commit hooks

Developer Experience:
[x] .editorconfig ✅ (added)
[x] .nvmrc ✅ (added)
[x] typecheck script ✅ (added)
[x] CLAUDE.md for AI assistants ✅ (enhanced)
[ ] Dev containers / Codespaces
[ ] Makefile/justfile for common operations
```

---

## 90-Day Roadmap

### Days 1-7: Foundation
- [x] Fix package.json identity and engines
- [x] Add .editorconfig and .nvmrc
- [x] Add typecheck npm script
- [x] Deduplicate DashboardData type
- [x] Enhance CLAUDE.md
- [x] Improve README
- [ ] Add GitHub Actions CI (lint + typecheck + build)
- [ ] Add string literal unions for status fields
- [ ] Create `.env.example`

### Days 8-30: Quality & Safety
- [ ] Install Vitest, write tests for `lib/` modules
- [ ] Add Playwright e2e tests for critical flows
- [ ] Add Zod validation for API inputs
- [ ] Extract API response helpers
- [ ] Add ESLint strict rules for async safety
- [ ] Add `not-found.tsx` and `error.tsx` pages
- [ ] Add Dependabot configuration

### Days 31-60: Architecture & Security
- [ ] Implement authentication (NextAuth.js)
- [ ] Add database migration system
- [ ] Extract custom hooks from admin pages
- [ ] Add rate limiting middleware
- [ ] Add OpenAPI documentation
- [ ] Set up pre-commit hooks (Husky + lint-staged)

### Days 61-90: Polish & Community
- [ ] Add CONTRIBUTING.md
- [ ] Add issue and PR templates
- [ ] Add Docker/docker-compose for local dev
- [ ] Add performance monitoring
- [ ] Create demo deployment (Vercel/Railway)
- [ ] Write Architecture Decision Records

---

## Competitive Analysis

| Feature | CaféMeeple | [Ludo](https://github.com/topics/board-game) | Generic SaaS Templates |
|---------|-----------|------|----------------------|
| Domain specificity | ✅ Purpose-built | ❌ Generic | ❌ Generic |
| Game library mgmt | ✅ Full CRUD + condition | ❌ | ❌ |
| Session billing | ✅ Cover charges | ❌ | Partial |
| TypeScript strict | ✅ | Varies | Usually yes |
| Testing | ❌ None | Usually yes | Usually yes |
| Auth | ❌ None | Usually yes | Usually yes |
| CI/CD | ❌ None | Usually yes | Usually yes |
| Accessibility | ✅ Good | Varies | Varies |

**Key advantage**: CaféMeeple is uniquely positioned as a domain-specific SaaS for board game cafés — a niche with no strong open source competitors. The operational features (checkout tracking, condition monitoring, cover charge billing) show deep domain understanding.

**Key gaps vs. top projects**: Testing, CI/CD, and authentication are table stakes for any production SaaS and represent the biggest gaps relative to well-maintained open source projects.
