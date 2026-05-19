import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import {
  Library,
  Coffee,
  CalendarCheck,
  PartyPopper,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

const INSTALL_CMD = 'git clone https://github.com/TabletopFoundry/cafemeeple && cd cafemeeple && npm install && npm run dev';

function CopyButton({text}: {text: string}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      className="hero-cm__copy"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy install command"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Hero() {
  return (
    <header className="hero-cm">
      <span className="hero-cm__eyebrow">Open-source · Next.js 16 · SQLite</span>
      <h1 className="hero-cm__title">
        The operating system for <span>board game cafés</span>
      </h1>
      <p className="hero-cm__subtitle">
        Manage your library, tables, cover charges, reservations and events from a single dashboard. Ship to your café in an afternoon — no SaaS lock-in, no per-seat pricing, no spreadsheets.
      </p>
      <div className="hero-cm__ctas">
        <Link className="button button--primary button--lg" to="/docs/getting-started/installation">
          Get started <ArrowRight size={16} style={{marginLeft: 6}} />
        </Link>
        <Link className="button button--secondary button--lg" to="https://github.com/TabletopFoundry/cafemeeple">
          ★ Star on GitHub
        </Link>
      </div>
      <div className="hero-cm__install">
        <code>npm install &amp;&amp; npm run dev</code>
        <CopyButton text={INSTALL_CMD} />
      </div>
    </header>
  );
}

const FEATURES = [
  {
    icon: <Library size={22} />,
    title: 'Smart game library',
    desc: 'Track 170+ titles out of the box with condition scoring, shelf locations, last-inspection dates and automatic replacement flagging.',
  },
  {
    icon: <Coffee size={22} />,
    title: 'Tables & live sessions',
    desc: 'A visual floor plan with check-in / check-out, running cover-charge totals, and per-person or per-table billing — updated in real time.',
  },
  {
    icon: <CalendarCheck size={22} />,
    title: 'Reservations that hold up',
    desc: 'Calendar and list views, status workflows (confirm, no-show, cancel), party-size validation, and same-day holds — no double bookings.',
  },
  {
    icon: <PartyPopper size={22} />,
    title: 'Events & RSVPs',
    desc: 'Game nights, tournaments, workshops and socials with capacity caps, waitlists, and per-event attendance reports.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Dashboard that earns its keep',
    desc: "Today's revenue, most-checked-out games, alerts for replacements, sold-out events and tables needing attention — surfaced automatically.",
  },
];

function Features() {
  return (
    <section className="features-cm">
      <h2 className="features-cm__title">Everything your café needs. Nothing it doesn't.</h2>
      <p className="features-cm__lede">
        Five focused modules. One coherent data model. Zero monthly fees.
      </p>
      <div className="features-cm__grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-cm">
            <div className="feature-cm__icon">{f.icon}</div>
            <h3 className="feature-cm__title">{f.title}</h3>
            <p className="feature-cm__desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats-cm">
      <div className="stats-cm__grid">
        <div>
          <div className="stats-cm__value">170+</div>
          <div className="stats-cm__label">Seeded games</div>
        </div>
        <div>
          <div className="stats-cm__value">26</div>
          <div className="stats-cm__label">Floor-plan tables</div>
        </div>
        <div>
          <div className="stats-cm__value">7</div>
          <div className="stats-cm__label">REST resources</div>
        </div>
        <div>
          <div className="stats-cm__value">&lt; 5 min</div>
          <div className="stats-cm__label">To running locally</div>
        </div>
      </div>
    </section>
  );
}

const SNIPPET = `// app/api/sessions/route.ts — start a session at table 4 for two players
const res = await fetch('/api/sessions', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    table_id: 4,
    party_size: 2,
    rate_type: 'per_person',
    rate_amount: 5.00,
    guest_name: 'Avery & Sam',
  }),
});

const session = await res.json();
// → { id: 142, status: 'active', started_at: '2025-05-18T18:22:11Z', ... }`;

function Preview() {
  return (
    <section className="preview-cm">
      <div className="preview-cm__grid">
        <div>
          <h2 className="preview-cm__title">A REST API your barista could read</h2>
          <p className="preview-cm__copy">
            Every screen in the admin dashboard talks to the same JSON API you can. Build a kiosk,
            a Slack bot, or a kitchen printer integration without reverse-engineering anything.
          </p>
          <p style={{marginTop: '1.5rem'}}>
            <Link className="button button--primary" to="/docs/reference/api">
              Explore the API <ArrowRight size={14} style={{marginLeft: 6}} />
            </Link>
          </p>
        </div>
        <div>
          <CodeBlock language="ts" title="Start a session">{SNIPPET}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — ${siteConfig.tagline}`}
      description="Open-source board game café management — game library, tables, sessions, reservations, events and analytics."
    >
      <Hero />
      <Stats />
      <Features />
      <Preview />
    </Layout>
  );
}
