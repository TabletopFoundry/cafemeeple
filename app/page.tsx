import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CaféMeeple — Board Game Café Ops Demo",
  description:
    "Explore a seeded board game café admin demo for game libraries, tables, cover charges, reservations, events, checkout, and analytics.",
  openGraph: {
    title: "CaféMeeple — Board Game Café Ops Demo",
    description:
      "Preview the current CaféMeeple admin demo for floor operations, reservations, events, checkout, and analytics.",
    type: "website",
    siteName: "CaféMeeple",
  },
};

const FEATURES = [
  {
    icon: "🎲",
    title: "Game Library Management",
    description: "Track every game copy, condition, replacement risk, and shelf location in one searchable catalog.",
  },
  {
    icon: "🪑",
    title: "Table & Session Management",
    description: "Use the floor map, seat walk-ins, estimate cover charges, and track live occupancy.",
  },
  {
    icon: "📅",
    title: "Reservations Management",
    description: "Work daily bookings through date filters, table assignment, and lifecycle actions.",
  },
  {
    icon: "🎉",
    title: "Events & RSVPs",
    description: "Schedule game nights, tournaments, and workshops with capacity-aware RSVP tracking.",
  },
  {
    icon: "📊",
    title: "Dashboard & Alerts",
    description: "Review revenue mix, popular games, upcoming events, and floor alerts from one dashboard.",
  },
  {
    icon: "🔄",
    title: "Game Checkout Tracking",
    description: "Assign games to tables, record returns, log condition changes, and review checkout history.",
  },
];

const DEMO_HIGHLIGHTS = [
  {
    value: "100+ seeded games",
    label: "Search, filter, and maintain a realistic library catalog.",
  },
  {
    value: "15 café tables",
    label: "Run floor-map seating, sessions, and billing handoff flows.",
  },
  {
    value: "6 admin workspaces",
    label: "Dashboard, games, tables, checkout, reservations, and events.",
  },
  {
    value: "SQLite-backed demo data",
    label: "Explore seeded sessions, reservations, RSVPs, and checkout history.",
  },
];

const DEMO_TRACKS = [
  {
    title: "Front-of-house flow",
    description: "Seat a party, estimate cover charges, assign games, and close the session from the same admin shell.",
    accent: "border-violet-200 bg-violet-50",
  },
  {
    title: "Library upkeep",
    description: "Search by title, category, condition, or player count while tracking replacement risk and copy health.",
    accent: "border-amber-200 bg-amber-50",
  },
  {
    title: "Bookings and programming",
    description: "Review reservations, event capacity, upcoming alerts, and RSVP pressure without leaving the demo dataset.",
    accent: "border-emerald-200 bg-emerald-50",
  },
];

const OPERATOR_WORKFLOWS = [
  {
    title: "Pressure-test the floor plan",
    description: "Inspect occupied, available, reserved, and maintenance tables from both the map and list views.",
  },
  {
    title: "Spot replacement risk early",
    description: "Use the game library and dashboard alerts to find worn copies before the next busy shift.",
  },
  {
    title: "Validate reservation and event handling",
    description: "Walk through list/calendar booking flows plus capacity-aware event RSVP management.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <span className="text-xl font-bold text-gray-900">CaféMeeple</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#highlights" className="text-sm text-gray-600 hover:text-gray-900">Demo Highlights</a>
            <a href="#workflows" className="text-sm text-gray-600 hover:text-gray-900">Workflows</a>
            <Link
              href="/admin"
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Open Admin Demo
            </Link>
          </nav>
          <Link
            href="/admin"
            className="md:hidden bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Admin Demo
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <span>🎲</span>
            Seeded admin demo for board game cafés
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Explore CaféMeeple,
            <br />
            <span className="text-violet-600">from shelf to table</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            This experience is a current ops demo: browse a seeded game library, run the floor map,
            manage reservations and events, assign games to tables, and review dashboard alerts in one admin flow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="bg-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors text-lg"
            >
              Launch Admin Demo →
            </Link>
            <a
              href="#highlights"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-lg"
            >
              See Demo Highlights
            </a>
          </div>
        </div>
      </section>

      {/* Demo highlights */}
      <section id="highlights" className="bg-gray-50 border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {DEMO_HIGHLIGHTS.map((highlight) => (
              <div key={highlight.value} className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
                <div className="text-2xl font-bold text-violet-600">{highlight.value}</div>
                <p className="mt-2 text-sm text-gray-600">{highlight.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What the current demo covers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These are the live surfaces available today in the seeded CaféMeeple admin experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Walkthroughs */}
      <section id="workflows" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Three demo walkthroughs to try first</h2>
            <p className="text-lg text-gray-600">Use the seeded dataset to validate the operational loops that matter most.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {DEMO_TRACKS.map((track) => (
              <div key={track.title} className={`rounded-xl border p-8 ${track.accent}`}>
                <h3 className="text-lg font-semibold text-gray-900">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">{track.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow outcomes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What this demo is built to validate</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Use the seeded admin data to explore how staff move between floor operations, library upkeep, and bookings.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {OPERATOR_WORKFLOWS.map((workflow) => (
              <div key={workflow.title} className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900">{workflow.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{workflow.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-violet-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to explore the admin experience?</h2>
          <p className="text-violet-200 text-lg mb-8">
            Walk through the seeded dashboard and see how CaféMeeple handles the day-to-day floor flow.
          </p>
          <Link
            href="/admin"
            className="inline-block bg-white text-violet-600 px-8 py-3 rounded-lg font-medium hover:bg-violet-50 transition-colors text-lg"
          >
            Explore Admin Demo →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <span className="text-white font-semibold">CaféMeeple</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} CaféMeeple. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
