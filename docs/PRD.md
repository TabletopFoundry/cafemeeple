# Enhanced PRD: CaféMeeple — Board Game Café Management SaaS

> This version converts the existing concept into an implementation-ready PRD. Details added beyond the source PRD are marked **[INFERRED]**. Decisions that require stakeholder confirmation are marked **[NEEDS INPUT]**.

## Gap Analysis

| Gap Area | What is Missing or Unclear in the Original PRD | Why It Matters | Resolution in This PRD |
|---|---|---|---|
| V1 scope boundary | The original mixes long-term vision, MVP, and future platform ideas without a clear release boundary. | Engineering cannot estimate, sequence, or de-risk delivery. | Defines explicit **In Scope v1**, **Out of Scope v1**, and **Future v2+** sections. |
| Primary user definition | Owners are described, but front-of-house staff, guests, and multi-location operators are under-specified. | Product decisions differ by operator vs staff vs guest workflow. | Adds concrete personas with goals, pain points, and tech comfort. |
| Functional requirements | Features are listed as marketing bullets rather than implementable requirements. | Engineers need user stories, acceptance criteria, dependencies, and edge cases. | Converts features into FR-01 through FR-10 with Given/When/Then criteria. |
| Acceptance criteria | No measurable definition of done exists. | Teams cannot test or sign off work consistently. | Adds explicit acceptance criteria and edge cases for each requirement. |
| Edge cases | No-show reservations, double bookings, POS outage, missing pieces, timer corrections, duplicate imports, and over-capacity cases are not defined. | Operational software fails in edge cases first. | Adds edge cases per flow and requirement. |
| Prioritization | The original implies everything is important. | Delivery will sprawl and slip without sequencing. | Applies MoSCoW priority to every functional requirement. |
| Contradictions | Phase 1 says “library + cover charge only,” while the feature list reads like full platform launch. | Creates roadmap confusion and stakeholder misalignment. | Treats the original as product vision; defines a realistic v1 release plan **[INFERRED]**. |
| Non-functional requirements | No targets for performance, availability, security, accessibility, localization, retention, or browser support. | SaaS operations require explicit quality bars. | Adds NFRs with p95 targets, SLA, scale, WCAG, i18n, security, and data retention. |
| Data model | No explicit entities, relationships, or PII boundaries are described. | Engineering cannot model tenancy, reservations, sessions, or privacy correctly. | Adds conceptual data model and PII flags. |
| Integration boundaries | POS, BGG, notifications, and widget embedding are mentioned but not scoped by release or failure behavior. | Integration risk is a major delivery risk. | Defines integration points, v1 defaults, and failure handling. |
| Metrics | Year 1 revenue metrics exist, but operational KPIs and product adoption metrics are missing. | Teams need leading indicators, not only business outcomes. | Adds launch KPIs and rollout success gates. |
| Release strategy | There is a GTM plan but not an implementation rollout plan. | Product teams need pilot gates, migration approach, and feature flags. | Adds phased rollout, enablement, rollback, and go-live criteria. |
| Assumptions | Several assumptions are implicit: single vs multi-location, guest account model, tax handling, deposit rules, supported POS vendors. | Hidden assumptions create rework late in development. | Surfaces open questions and proposed defaults. |

---

## 1. Overview

### Name
**CaféMeeple**

### One-liner
A multi-tenant SaaS platform for board game cafés to manage their game library, tables, cover charges, reservations, events, and POS-connected operations.

### Problem
Board game cafés currently stitch together generic POS tools, spreadsheets, reservation apps, and staff memory to run a business with unique operational needs:
- physical game libraries with multiple copies and condition issues
- table-based dwell time and cover-charge billing
- guest recommendations based on group size, time, and skill level
- events that combine seating, RSVPs, and game inventory
- staff knowledge loss when experienced employees leave

This causes manual work, inconsistent guest experience, revenue leakage, and poor visibility into what games, tables, and events actually drive profit.

### Solution
CaféMeeple provides a purpose-built operating system for board game cafés that unifies:
1. game library catalog + physical copy tracking
2. table/session management + cover-charge billing
3. reservations + waitlist + events
4. POS integration for consolidated billing
5. analytics for revenue, library usage, and guest behavior

### Product KPIs
**Launch KPIs**
- Median walk-in check-in time: **<= 30 seconds** **[INFERRED]**
- Reservation-to-seated conversion rate: **>= 85%** **[INFERRED]**
- Library catalog completeness within 14 days of onboarding: **>= 95% of active game copies** **[INFERRED]**
- Lost/missing game incident rate: **reduce by 30% within 90 days** **[INFERRED]**
- Staff weekly active usage for front-of-house locations: **>= 70% of enabled staff** **[INFERRED]**

**Business KPIs**
- Paying café locations by end of Year 1: **150**
- Monthly recurring revenue by end of Year 1: **$16,500**
- Monthly churn: **< 3%**
- NPS: **> 60**

---

## 2. Users & Personas

### Persona A: Owner / General Manager
- **Primary user?** Yes
- **Goals**
  - Reduce operational chaos across tables, games, and reservations
  - Measure revenue by table, event, and game category
  - Standardize staff workflows and training
- **Pain points**
  - Uses multiple disconnected systems
  - Cannot easily track damaged or missing games
  - Cover-charge billing is manual or inconsistent
  - Staff recommendations are person-dependent
- **Tech comfort**: Medium to high; comfortable with SaaS dashboards and CSV imports

### Persona B: Front-of-House Lead / Game Guru
- **Primary user?** Yes
- **Goals**
  - Seat guests quickly
  - Start/adjust timers with minimal friction
  - Recommend appropriate games fast
  - Track where each game copy is and whether it was returned damaged
- **Pain points**
  - Rush-hour check-in bottlenecks
  - Hard to know which tables have which games
  - Memory-based recommendations do not scale to new staff
- **Tech comfort**: Medium; prefers tablet-first, low-click workflows

### Persona C: Guest Booking a Visit
- **Primary user?** Indirect, but critical for reservation flow
- **Goals**
  - Book a table easily
  - Understand group limits, timing, and event availability
  - Receive reminders and waitlist updates
- **Pain points**
  - Generic reservation tools do not reflect café-specific rules
  - Unclear whether a table is suitable for their group/event
- **Tech comfort**: Varies; experience must be simple on mobile web

### Persona D: Multi-Location Operations Director **[INFERRED]**
- **Primary user?** Future / v2+
- **Goals**
  - Compare location performance
  - Standardize pricing, events, and operational playbooks
  - Roll up analytics and enforce brand consistency
- **Pain points**
  - Fragmented reporting across stores
  - No benchmark for game usage or event ROI by location
- **Tech comfort**: High

### Persona E: FLGS Operator with Play Space **[INFERRED]**
- **Primary user?** Secondary target segment
- **Goals**
  - Manage in-store library, events, and play area reservations
- **Pain points**
  - Existing retail/POS tools do not manage table play well
- **Tech comfort**: Medium

---

## 3. Scope

### In Scope v1
v1 is defined as the **first paid release after pilot validation** **[INFERRED]**.

1. **Single-brand operations with one location at launch** **[INFERRED]**
2. Organization setup, role-based access, and location/table configuration
3. Game library import via BGG lookup and CSV upload
4. Physical game copy management, QR labels, condition tracking, and missing-piece logs
5. Walk-in check-in, table assignment, timer management, and flexible cover-charge rules
6. Online reservations via embeddable widget, manual staff bookings, waitlist, and no-show handling
7. Basic event management with capacity, RSVP, and recurring-event templates
8. Square integration for syncing cover charges and order totals **[INFERRED]**
9. Analytics dashboard for revenue mix, table utilization, reservations, and game usage
10. Email notifications for reservation confirmation/reminders; SMS optional behind feature flag **[INFERRED]**
11. Responsive web app optimized for desktop back office and tablet front-of-house use

### Out of Scope v1
1. Native iOS/Android apps
2. Full offline transaction queueing across all workflows
3. Toast and Clover direct integrations **[INFERRED]**
4. Self-service entrance kiosk mode
5. Cross-café collaborative recommendation engine
6. Franchise benchmarking and centralized multi-location controls
7. Loyalty points, CRM campaigns, and marketing automation
8. Retail e-commerce storefront
9. Payroll, accounting, or full restaurant inventory management
10. Guest-facing mobile account system with saved preferences **[INFERRED]**

### Future v2+
1. Multi-location and franchise management
2. AI-assisted / cross-café recommendation engine
3. Self-service kiosk and guest self-check-in
4. Full offline mode with queued writes and automatic reconciliation
5. Toast/Clover/native POS connectors beyond Square
6. Guest loyalty and personalized recommendation history
7. Game-to-purchase funnel attribution across retail sales
8. Advanced benchmarking and publisher insights marketplace **[INFERRED]**

---

## 4. Functional Requirements

### FR-01 — Organization, Location, and Role Setup

| Field | Value |
|---|---|
| User Story | As an owner, I want to configure my café location, floor tables, pricing defaults, and staff roles so the system matches my real-world operation before opening. |
| Priority | Must |
| Dependencies | None |

**Description**
The system must support tenant creation, location configuration, table setup, business hours, cover-charge defaults, and role-based access for Owner, Manager, Staff, and Read-Only roles **[INFERRED]**.

**Acceptance Criteria**
- Given a new owner account, when onboarding is completed, then the owner can create one organization and one location with timezone, currency, business hours, and default cover-charge model.
- Given a manager configures tables, when they save the floor setup, then each table has a unique identifier, seating capacity, status, and optional section name.
- Given an owner invites staff, when staff accept the invite, then the correct permissions are applied based on role.
- Given a staff user without owner rights, when they attempt to change pricing or billing settings, then the action is blocked and logged.

**Edge Cases**
- Two staff members create the same table name
- Location hours cross midnight
- Role changes while a staff member is actively signed in
- Staff account invite expires or is sent to an already-used email

---

### FR-02 — Game Library Import and Catalog Management

| Field | Value |
|---|---|
| User Story | As a manager, I want to import my game library from BGG or CSV so setup is fast and consistent. |
| Priority | Must |
| Dependencies | FR-01 |

**Description**
The system must let staff search/import game metadata from BoardGameGeek, upload CSVs, create manual entries, and maintain a canonical catalog record per title with metadata override support.

**Acceptance Criteria**
- Given an admin provides a BGG collection reference or uploads a CSV, when import runs, then the system creates or matches catalog records and presents unmatched rows for review.
- Given a game exists in the catalog, when the admin edits play time, tags, or internal notes, then the café-specific override is stored without destroying source metadata **[INFERRED]**.
- Given duplicate candidate matches exist, when the user reviews import results, then they can merge, skip, or create a new record.
- Given BGG metadata retrieval fails, when import completes, then failed rows are marked with retry guidance instead of silently dropping data.

**Edge Cases**
- Base games vs expansions
- Multiple editions with similar names
- Games not in BGG
- Imports containing duplicate titles with different copy counts
- Image/license restrictions from BGG **[NEEDS INPUT]**

---

### FR-03 — Physical Game Copy Tracking, QR Labels, and Condition Logs

| Field | Value |
|---|---|
| User Story | As front-of-house staff, I want to track each physical game copy and its condition so I can find games quickly and reduce loss. |
| Priority | Must |
| Dependencies | FR-02 |

**Description**
Each owned copy of a game must be trackable as a unique asset with copy ID, location/shelf, QR code, condition status, inspection history, and missing-component notes.

**Acceptance Criteria**
- Given a catalog game with quantity > 1, when copies are generated, then each copy receives a unique copy ID and printable QR code.
- Given a staff member scans or selects a copy, when they update shelf location or condition, then the new state is persisted and timestamped with user attribution.
- Given a returned game has missing pieces, when staff log the issue, then the copy status changes to `Needs Review` or `Unavailable` until cleared.
- Given a copy is unavailable, when staff search available games, then unavailable copies are excluded from checkout suggestions.

**Edge Cases**
- Same title has multiple physical copies in different condition states
- Returned game is missing components but still playable
- Copy label is damaged and unscannable
- Staff accidentally logs issue against wrong copy

---

### FR-04 — Walk-in Check-In, Table Assignment, Timer, and Cover-Charge Billing

| Field | Value |
|---|---|
| User Story | As front-of-house staff, I want to seat walk-ins quickly and start the right billing model automatically so I can reduce queue time and revenue leakage. |
| Priority | Must |
| Dependencies | FR-01 |

**Description**
The system must create a visit session for each seated party, assign them to a table, start/adjust a timer, and calculate charges based on configured pricing rules (per person, per table, flat fee, hourly, hybrid, and time-window overrides).

**Acceptance Criteria**
- Given an available table and party size, when staff check in a walk-in group, then a visit session is created with table assignment, party size, start time, and active pricing rule.
- Given the pricing model changes by time of day, when the session starts, then the correct applicable rate is selected and stored with the session.
- Given staff move a party to another table, when the reassignment is saved, then the session retains billing continuity and updates occupancy for both tables.
- Given staff pause or adjust a timer with permission, when the action occurs, then the system records the override reason in an audit trail **[INFERRED]**.
- Given a session is closed, when staff finalize billing, then the billable total is calculated and prepared for POS sync or manual export.

**Edge Cases**
- Party size exceeds any available table capacity
- Timer started on wrong table
- Pricing changes mid-session due to happy hour ending **[NEEDS INPUT]**
- Internet interruption during active service
- Split billing across multiple payment methods **[NEEDS INPUT]**

---

### FR-05 — Reservations, Waitlist, and No-Show Handling

| Field | Value |
|---|---|
| User Story | As a guest or host, I want to reserve a table that fits my group and timing so arrival is predictable and overbooking is avoided. |
| Priority | Must |
| Dependencies | FR-01, FR-04 |

**Description**
The system must provide a guest-facing reservation widget and staff-facing reservation console with availability rules, seating windows, waitlist, confirmation, reminder, cancellation, and no-show workflow.

**Acceptance Criteria**
- Given a guest selects date, time, and party size, when availability exists, then the widget offers only valid slots based on open hours, table capacity, and existing bookings.
- Given no slot is available, when the guest opts into the waitlist, then the request is stored and staff can promote it if capacity opens.
- Given a reservation is created, when the booking is confirmed, then the guest receives confirmation by email and the reservation appears on the staff calendar.
- Given the party arrives, when staff seat them, then the reservation converts into an active visit session without double entry.
- Given a reservation passes its grace period unseated, when staff mark it no-show or late, then the table is released and the status is tracked.

**Edge Cases**
- Double booking due to simultaneous guest and staff actions
- Walk-in consumes a table held for an upcoming reservation
- Guest edits party size after booking
- Accessibility/seating constraints for specific tables **[INFERRED]**
- Deposit/prepayment rules by event or time slot **[NEEDS INPUT]**

---

### FR-06 — Game Checkout and Return to Table

| Field | Value |
|---|---|
| User Story | As staff, I want to assign game copies to active tables and record returns so I know where games are during service. |
| Priority | Must |
| Dependencies | FR-03, FR-04 |

**Description**
The system must associate one or more game copies with an active visit session, show where they are checked out, and support return, transfer, and issue logging.

**Acceptance Criteria**
- Given an active visit session, when staff assign a game copy, then the system records the table, session, checkout time, and staff user.
- Given the same title has multiple copies, when staff choose a copy, then the system surfaces available copies and their condition.
- Given a table returns a game, when staff scan the copy back in, then the copy status becomes `Available` unless an issue is logged.
- Given a game is transferred between tables, when staff complete the transfer, then the active session association is updated without duplicate checkout records.

**Edge Cases**
- Game returned after session close
- Copy returned to wrong shelf/location
- Same game copy attempted to be checked out to two tables
- Staff forgets to check a game back in before end-of-day close

---

### FR-07 — POS Sync and Bill Finalization

| Field | Value |
|---|---|
| User Story | As staff, I want cover charges and table sessions to sync to POS so guests receive one accurate check. |
| Priority | Should |
| Dependencies | FR-04 |

**Description**
The system should integrate with Square in v1 to send cover-charge line items and session totals into POS order flow, with idempotent sync and manual retry support **[INFERRED]**.

**Acceptance Criteria**
- Given a session is ready for billing, when staff push charges to Square, then line items include session reference, pricing rule, and billable amount.
- Given the first sync attempt fails, when staff retry, then the system prevents duplicate charge creation using idempotency keys **[INFERRED]**.
- Given Square is unavailable, when sync cannot complete, then the system presents a manual fallback export or pending-sync state instead of blocking checkout **[INFERRED]**.
- Given a synced order is voided or refunded, when the status returns from POS, then the visit session reflects the updated billing status.

**Edge Cases**
- Partial refunds after close
- Tax-inclusive vs tax-exclusive cover charges **[NEEDS INPUT]**
- Guest moves from one table session into another order
- POS item catalog mismatch

---

### FR-08 — Event Scheduling, Capacity, and RSVPs

| Field | Value |
|---|---|
| User Story | As a manager, I want to schedule events with capacity and RSVPs so I can run tournaments and theme nights without manual tracking. |
| Priority | Must |
| Dependencies | FR-01, FR-05 |

**Description**
The system must support event creation, capacity limits, assigned areas/tables, RSVP management, recurring templates, and event attendance states.

**Acceptance Criteria**
- Given a manager creates an event, when they define title, date/time, capacity, and reservation rules, then the event is published and bookable if marked public.
- Given an event reaches capacity, when another guest attempts to RSVP, then they are added to a waitlist or shown sold out based on configuration.
- Given an event is recurring, when staff duplicate or template it, then the system copies the configuration without copying prior attendees.
- Given an attendee checks in, when staff mark arrival, then attendance status is recorded for reporting.

**Edge Cases**
- Event overlaps with normal reservation inventory
- Capacity reduction after RSVPs already exist
- Event cancellation due to staff illness
- Private event consumes entire venue vs partial floor **[INFERRED]**

---

### FR-09 — Analytics Dashboard and Operational Reporting

| Field | Value |
|---|---|
| User Story | As an owner, I want dashboards and exports that show revenue, game usage, and operational trends so I can improve staffing, library purchases, and events. |
| Priority | Must |
| Dependencies | FR-04, FR-05, FR-06, FR-07, FR-08 |

**Description**
The system must provide dashboards and CSV export for key operational metrics: revenue mix, table occupancy, average session duration, reservations, no-shows, top games, damaged/missing games, and event performance.

**Acceptance Criteria**
- Given an owner opens the dashboard, when data loads, then they can filter by date range and see summary cards for revenue, visits, reservations, and top games.
- Given data exists for table sessions and checkouts, when the owner views the library report, then the system shows top checked-out titles, inactive titles, and titles with open condition issues.
- Given a date range is selected, when the owner exports data, then the export includes only rows and fields allowed by their role.
- Given no data exists for a filter combination, when the report loads, then the user sees an empty state with guidance rather than a broken chart.

**Edge Cases**
- Late-arriving POS sync updates change prior totals
- Cross-midnight sessions affect date-bucket logic
- Timezone differences between location and admin browser
- Low-volume venues create misleading trend percentages **[INFERRED]**

---

### FR-10 — Staff Recommendation Assistant

| Field | Value |
|---|---|
| User Story | As staff, I want to filter games by player count, play time, complexity, and availability so I can recommend games quickly even if I do not know the library well. |
| Priority | Could |
| Dependencies | FR-02, FR-03, FR-06 |

**Description**
v1 may include a rules-based recommendation assistant using game metadata and current copy availability; cross-café collaborative recommendations are deferred to v2+ **[INFERRED]**.

**Acceptance Criteria**
- Given staff provide player count, desired duration, and experience level, when they search, then the system returns matching available games ranked by rules-based fit.
- Given a recommended copy is unavailable or in review, when results display, then the system excludes or clearly marks it.
- Given staff override a recommendation, when they choose another game, then the system may log that action for future tuning **[INFERRED]**.

**Edge Cases**
- Missing metadata for a title
- Group requests cooperative-only, kid-friendly, or language-specific games **[INFERRED]**
- No available games match the filters

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Authenticated dashboard initial load must be **<= 2.5s p95** on standard broadband and **<= 4.0s p95** on typical café Wi‑Fi **[INFERRED]**. |
| Performance | Game search and reservation slot search APIs must respond in **<= 500ms p95** and **<= 1.2s p95** respectively. |
| Performance | Walk-in check-in + timer start must complete in **<= 800ms p95** after user submission, excluding external POS latency **[INFERRED]**. |
| Performance | CSV import of **2,000 rows** must complete in **<= 10 minutes p95**, with progress visible to the user **[INFERRED]**. |
| Availability | Service SLA for paid plans: **99.5% monthly uptime**, excluding scheduled maintenance announced at least **48 hours** in advance **[INFERRED]**. |
| Scalability | Platform must support **1,500 active café locations**, **3 million game copies**, **50,000 reservation transactions/day**, and **10,000 concurrent active sessions** **[INFERRED]**. |
| Security | Multi-tenant logical data isolation is mandatory. Every row tied to a tenant/location must be access-controlled server-side. |
| Security | Roles: Owner, Manager, Staff, Read-Only. Privileged actions (pricing changes, refunds, exports, user management) require server-enforced authorization. |
| Security | TLS 1.2+ in transit and AES-256 or cloud-provider equivalent encryption at rest are required **[INFERRED]**. |
| Security | MFA must be available for all users and required for Owner accounts **[INFERRED]**. |
| Security | Audit logs must record pricing changes, timer overrides, reservation status changes, condition-state edits, exports, and billing sync actions. |
| Compliance | Product must avoid storing cardholder data directly; payment/POS provider remains PCI scope owner. |
| Accessibility | Staff and guest-facing web experiences must meet **WCAG 2.1 AA** for keyboard access, focus state, contrast, and form error messaging. |
| i18n | v1 ships in **en-US** only, but the system must use translation keys and locale-aware date, time, number, and currency formatting from day 1 **[INFERRED]**. |
| i18n | Per-location timezone and currency configuration are required; multi-language guest content is future scope **[INFERRED]**. |
| Data Retention | Operational billing records and audit logs retained **7 years** by default **[INFERRED]**. Reservation/contact records retained **24 months after last activity** then anonymized unless legally required otherwise **[INFERRED]**. |
| Privacy | Guests must be exportable and deletable by authorized admins within **30 days** of request, subject to billing/audit retention obligations **[INFERRED]**. |
| Browser Support | Support latest 2 stable versions of Chrome, Edge, Safari, and Firefox on desktop; Safari on iPadOS 16+; Chrome on Android tablets 10+ **[INFERRED]**. |
| Resilience | If external integrations fail, the product must preserve core operational workflows using retries, pending states, and manual fallbacks rather than hard-blocking checkout. |

---

## 6. User Flows

### Flow 1 — Initial Library Onboarding
**Happy Path**
1. Owner creates organization and location.
2. Owner chooses import method: BGG collection, CSV, or manual entry.
3. System matches titles, flags ambiguities, and creates catalog records.
4. Owner generates physical copies and prints QR labels.
5. Staff places copies on shelves and marks initial condition.

**Error / Alternate Paths**
- If BGG metadata lookup fails, admin retries or uploads CSV.
- If duplicate matches exist, admin must resolve before import is finalized.
- If a game is not in BGG, admin creates a manual record.

### Flow 2 — Walk-in Seating and Billing
**Happy Path**
1. Host selects party size and available table.
2. System creates visit session and starts timer.
3. Pricing rule auto-applies based on location/time.
4. Party plays; staff can add game checkouts to session.
5. At end of visit, staff finalize charges and optionally sync to POS.

**Error / Alternate Paths**
- If no table fits, staff can queue or split the party **[NEEDS INPUT]**.
- If timer started on wrong table, manager overrides and audit log records reason.
- If POS sync fails, session enters pending-sync/manual-close state.

### Flow 3 — Guest Reservation and Arrival
**Happy Path**
1. Guest opens reservation widget from café website.
2. Guest selects date, time, party size, and contact details.
3. System offers valid slots and confirms booking.
4. Reminder is sent before reservation time.
5. On arrival, staff mark party seated and convert reservation to visit session.

**Error / Alternate Paths**
- If requested slot fills during checkout, guest sees next-best alternatives.
- If guest is late beyond grace period, staff can mark late/no-show and release table.
- If capacity opens later, waitlisted guest receives offer notification **[INFERRED]**.

### Flow 4 — Game Checkout, Return, and Damage Logging
**Happy Path**
1. Staff selects active table session.
2. Staff scans a game copy QR or searches catalog.
3. System records checkout to table.
4. At return, staff scans game back in.
5. If needed, staff logs missing pieces or damage and marks copy unavailable.

**Error / Alternate Paths**
- If scanned copy is already assigned elsewhere, system blocks duplicate checkout.
- If QR label is unreadable, staff can search by copy ID manually.
- If issue is logged by mistake, manager can reverse status with audit trail.

### Flow 5 — Event Creation and Attendance
**Happy Path**
1. Manager creates event with title, date, duration, capacity, and reservation rules.
2. Event is published to widget/calendar.
3. Guests RSVP until capacity is reached.
4. Staff check attendees in on event day.
5. Owner reviews attendance and revenue outcome in analytics.

**Error / Alternate Paths**
- If event is canceled, attendees receive cancellation communication.
- If event capacity is reduced after RSVPs, overflow attendees move to waitlist in priority order **[INFERRED]**.
- If event overlaps with regular reservations, reserved inventory is protected.

---

## 7. Data Model

| Entity | Description | Key Relationships | PII? |
|---|---|---|---|
| Organization | Tenant/business account | Has many Locations, Users, Plans | No |
| Location | Physical café site | Belongs to Organization; has many Tables, PricingRules, Reservations, Events, Sessions | No |
| User | Staff account | Belongs to Organization; assigned Role; acts on records via audit log | Yes (name, email) |
| Role | Permission bundle | Assigned to Users | No |
| Table | Bookable seating unit | Belongs to Location; linked to Reservations and Sessions | No |
| PricingRule | Cover-charge/billing rule | Belongs to Location; applied to Sessions | No |
| CatalogGame | Canonical game title record | Has many GameCopies | No |
| GameCopy | Physical owned copy | Belongs to Location and CatalogGame; has many ConditionLogs and CheckoutEvents | No |
| ConditionLog | Inspection / missing-piece / damage record | Belongs to GameCopy; created by User | No |
| GuestProfile | Guest/contact record | Has many Reservations, RSVPs, Sessions | Yes (name, email, phone) |
| Reservation | Booking for table/date/time | Belongs to Location; may convert to Session; optionally linked to Event | Yes (contact fields) |
| WaitlistEntry | Pending booking request | Belongs to Location; linked to GuestProfile and desired slot | Yes |
| VisitSession | Active seated party/session | Belongs to Location and Table; may originate from Reservation; has many CheckoutEvents and BillingEvents | Limited (party name optional) |
| CheckoutEvent | Assignment of game copy to session | Belongs to GameCopy and VisitSession | No |
| BillingEvent | Charge calculation/sync record | Belongs to VisitSession; may link to external POS order | No |
| Event | Scheduled café event | Belongs to Location; has many RSVPs | No |
| RSVP | Event attendance registration | Belongs to Event and GuestProfile | Yes |
| Notification | Outbound email/SMS message | References Reservation, WaitlistEntry, or Event | Yes (destination contact data) |
| AuditLog | Immutable action trail | References User and target entity | May contain limited PII in metadata |

**Notes**
- All operational entities must be tenant-scoped.
- PII should be minimized to what is required for reservations and communication.
- Cross-café recommendation data sharing is not part of v1 data model due to privacy and consent complexity **[INFERRED]**.

---

## 8. Integration Points

| Integration | Purpose | Direction | V1 Scope | Failure Handling |
|---|---|---|---|---|
| BoardGameGeek (BGG) API / collection import | Import game metadata, images, player count, duration, complexity | Inbound | Yes | Retry failures; allow CSV/manual fallback; cache last successful metadata **[INFERRED]** |
| CSV import/export | Onboarding, reporting, migration | Inbound + Outbound | Yes | Row-level validation errors; partial success with review queue |
| Square API | Sync cover charges/session totals to POS | Bi-directional or outbound-first **[INFERRED]** | Yes | Idempotent retries; pending-sync state; manual close/export fallback |
| Email provider | Reservation confirmations, reminders, cancellations | Outbound | Yes | Retry queue; delivery status logging |
| SMS provider | Optional reminders/waitlist alerts | Outbound | Feature-flagged **[INFERRED]** | Fallback to email; expose undelivered state |
| Reservation widget embed | Guest booking on café website | Outbound/embed | Yes | Graceful error state; link fallback to hosted booking page **[INFERRED]** |
| Google Maps / location profile links | Discovery/context for guests | Outbound link only **[INFERRED]** | Optional | Non-blocking; no core workflow dependency |

---

## 9. UX/UI Requirements

| Screen / Area | Core Requirements | Loading / Empty / Error States |
|---|---|---|
| Onboarding & Setup | Fast first-run setup, import wizard, role invite flow, table configuration | Show progress for import; empty state with “Add your first game/table”; recoverable validation errors |
| Front-of-House Floor View | Tablet-optimized table map/list, clear occupancy state, one-tap check-in, timer visibility | Skeleton/placeholder on load; empty state if no tables configured; error banner with retry if session save fails |
| Reservation Calendar | Day/week views, table capacity indicators, waitlist promotion, manual booking | Empty state for no bookings; conflict warnings; slot recalculation message if concurrent changes occur |
| Library & Game Copy Detail | Searchable catalog, copy availability, QR actions, condition logs, shelf location | Empty state for no games/import prompt; not-found state for bad QR; inline error if update fails |
| Event Manager | Event list/calendar, RSVP counts, attendance states, recurring template actions | Empty state for no events; capacity full state; cancellation confirmation and error recovery |
| Dashboard & Reports | Executive summary, filterable charts/tables, export actions | Loading placeholders; “No data in selected period” empty state; partial-data warning when POS sync backlog exists **[INFERRED]** |
| Settings & Billing Rules | Pricing model editor, hours, tax config, notification templates, integration setup | Inline form validation; permissions error if unauthorized |

**General UX Rules**
- Primary front-of-house tasks must be completable in **<= 3 taps/clicks** from the floor view for common actions **[INFERRED]**.
- Tables must use clear visual states: `Available`, `Reserved Soon`, `Occupied`, `Needs Cleaning` **[INFERRED]**.
- All destructive actions require confirmation or undo path where operationally safe.
- Guest booking UI must be mobile-first and not require account creation in v1 **[INFERRED]**.

---

## 10. Release & Rollout

### Phase 0 — Internal Alpha **[INFERRED]**
- Scope: FR-01, FR-02, FR-03, FR-04 basic flows
- Audience: 1-2 design partner cafés
- Goal: Validate onboarding, table/session model, and copy tracking
- Exit Criteria:
  - >= 90% successful check-ins without staff workaround
  - Import success for >= 95% of catalog rows after review
  - No Sev-1 data integrity issues for 2 consecutive weeks

### Phase 1 — Pilot Beta
- Scope: Add FR-05, FR-06, FR-08, and basic analytics from FR-09
- Audience: up to 10 pilot cafés
- Rollout Controls:
  - Feature flags by tenant for reservations and events
  - Weekly operational review with pilots
  - Manual onboarding support available
- Exit Criteria:
  - Median check-in <= 30 seconds
  - Reservation booking completion >= 70% **[INFERRED]**
  - Missing/damaged game logging used by >= 60% of pilot cafés **[INFERRED]**

### Phase 2 — Paid v1 Launch
- Scope: Add Square sync (FR-07), full dashboard set (FR-09), hardened notifications
- Audience: General availability for single-location cafés and compatible FLGS operators
- Launch Requirements:
  - 99.5% uptime readiness
  - Support runbook and onboarding materials published
  - Data export available for all critical operational records
  - Billing and support escalation paths defined **[INFERRED]**

### Rollout Strategy
- Use tenant-level feature flags for reservations, POS sync, SMS, and events.
- Start with Square-only positioning to reduce integration risk **[INFERRED]**.
- Provide migration paths from spreadsheet-based catalog and reservation data.
- Schedule onboarding in off-hours for live cafés to reduce operational disruption.
- Keep rollback path to manual closeout/export for POS-dependent workflows.

---

## 11. Open Questions with Proposed Defaults

| Question | Why It Matters | Proposed Default |
|---|---|---|
| Which POS integrations are mandatory for launch? **[NEEDS INPUT]** | Integration scope can dominate delivery time. | Launch with **Square only**; Toast/Clover move to v2 unless a pilot customer contract requires them. |
| Are cover charges taxable by default? **[NEEDS INPUT]** | Billing, receipts, and reporting depend on this. | Make taxability a **per-location configurable flag** with sensible defaults by geography **[INFERRED]**. |
| Do reservations require deposits or prepayment? **[NEEDS INPUT]** | Affects checkout, cancellation, and no-show logic. | **No deposit in v1** except manual policy notes; add prepaid reservations later. |
| Should guests create accounts? **[NEEDS INPUT]** | Impacts UX friction and privacy scope. | **No guest accounts in v1**; collect only name + email/phone for reservation communication. |
| What is the late-arrival grace period? **[NEEDS INPUT]** | Needed to release reserved capacity consistently. | Default to **15 minutes**, editable per location **[INFERRED]**. |
| How should pricing behave when a session crosses pricing windows? **[NEEDS INPUT]** | Affects fairness and billing complexity. | Default to **lock pricing rule at session start** in v1; add prorating later **[INFERRED]**. |
| Is SMS required in all launch markets? **[NEEDS INPUT]** | SMS compliance differs by country and cost. | Email is required; SMS is optional and initially limited to supported regions/provider setup **[INFERRED]**. |
| Can CaféMeeple store BGG images and metadata long term? **[NEEDS INPUT]** | Licensing/terms may affect caching and display strategy. | Cache metadata and attribution conservatively pending legal review. |
| What level of offline support is required for launch? **[NEEDS INPUT]** | Full offline writes increase complexity materially. | v1 supports **draft preservation + retry states**, not full offline write queue. |
| How should play-to-retail attribution work? **[NEEDS INPUT]** | Needed for future “played then bought” analytics. | Defer to v2; if piloted, use same-day same-guest heuristic **[INFERRED]**. |

---
