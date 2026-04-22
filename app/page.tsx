import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CaféMeeple — Board Game Café Management SaaS",
  description:
    "The all-in-one platform for managing your board game café: game library, tables, cover charges, reservations, events, and analytics. No more spreadsheets or guesswork.",
  openGraph: {
    title: "CaféMeeple — Board Game Café Management",
    description:
      "Manage your game library, tables, reservations, and events in one purpose-built platform for board game cafés.",
    type: "website",
    siteName: "CaféMeeple",
  },
};

const FEATURES = [
  {
    icon: "🎲",
    title: "Game Library Management",
    description: "Track every game copy, condition, and shelf location. QR-ready catalog with BGG integration.",
  },
  {
    icon: "🪑",
    title: "Table & Session Management",
    description: "Visual floor map, one-click check-in, automatic cover charges, and real-time occupancy tracking.",
  },
  {
    icon: "📅",
    title: "Reservations & Waitlist",
    description: "Online booking widget, staff calendar, waitlist management, and no-show handling.",
  },
  {
    icon: "🎉",
    title: "Events & RSVPs",
    description: "Schedule game nights, tournaments, and workshops with capacity management and RSVP tracking.",
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    description: "Revenue dashboards, popular games, table utilization, and operational trend analysis.",
  },
  {
    icon: "🔄",
    title: "Game Checkout Tracking",
    description: "Assign games to tables, track returns, log damage, and see checkout history.",
  },
];

const TESTIMONIALS = [
  {
    quote: "CaféMeeple transformed how we run our café. Check-ins went from 2 minutes to 15 seconds.",
    author: "Sarah K.",
    role: "Owner, Dice & Lattes",
  },
  {
    quote: "We finally know which games are worth buying more copies of. The analytics are incredible.",
    author: "Marcus T.",
    role: "Manager, The Game Room",
  },
  {
    quote: "Our staff can recommend games to any group in seconds, even on their first day.",
    author: "Yuki M.",
    role: "GM, BoardTown Café",
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
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900">Testimonials</a>
            <Link
              href="/admin"
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Open Dashboard
            </Link>
          </nav>
          <Link
            href="/admin"
            className="md:hidden bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <span>🎲</span>
            Built for board game cafés
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your café&apos;s operating system,
            <br />
            <span className="text-violet-600">from shelf to table</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Manage your game library, tables, cover charges, reservations, and events in one purpose-built platform.
            No more spreadsheets, sticky notes, or guesswork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="bg-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors text-lg"
            >
              Try the Demo →
            </Link>
            <a
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-lg"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-50 border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-violet-600">150+</div>
              <div className="text-sm text-gray-600 mt-1">Cafés Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-600">50K+</div>
              <div className="text-sm text-gray-600 mt-1">Games Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-600">30s</div>
              <div className="text-sm text-gray-600 mt-1">Avg Check-in Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-600">99.5%</div>
              <div className="text-sm text-gray-600 mt-1">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to run your café</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Purpose-built tools that understand the unique needs of board game cafés.
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

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600">Start free, scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg font-semibold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-1">$49<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 text-sm mb-6">For small cafés getting started</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Up to 200 games</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> 10 tables</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Basic analytics</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Email support</li>
              </ul>
            </div>
            <div className="bg-violet-600 text-white rounded-xl p-8 shadow-xl scale-105">
              <h3 className="text-lg font-semibold mb-2">Professional</h3>
              <div className="text-3xl font-bold mb-1">$99<span className="text-lg font-normal text-violet-200">/mo</span></div>
              <p className="text-violet-200 text-sm mb-6">Most popular for growing cafés</p>
              <ul className="space-y-3 text-sm text-violet-100">
                <li className="flex gap-2"><span>✓</span> Unlimited games</li>
                <li className="flex gap-2"><span>✓</span> Unlimited tables</li>
                <li className="flex gap-2"><span>✓</span> Advanced analytics</li>
                <li className="flex gap-2"><span>✓</span> Reservation widget</li>
                <li className="flex gap-2"><span>✓</span> Priority support</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
              <div className="text-3xl font-bold mb-1">Custom</div>
              <p className="text-gray-500 text-sm mb-6">For multi-location operators</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Multi-location</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> POS integration</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Custom reporting</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span> Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by café owners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-700 mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.author}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-violet-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to level up your café?</h2>
          <p className="text-violet-200 text-lg mb-8">
            Join 150+ board game cafés already using CaféMeeple to streamline their operations.
          </p>
          <Link
            href="/admin"
            className="inline-block bg-white text-violet-600 px-8 py-3 rounded-lg font-medium hover:bg-violet-50 transition-colors text-lg"
          >
            Start Free Trial →
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
