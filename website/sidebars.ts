import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      link: {type: 'generated-index', slug: '/getting-started'},
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/first-tour',
        'getting-started/seed-data',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      link: {type: 'generated-index', slug: '/concepts'},
      items: [
        'concepts/overview',
        'concepts/games',
        'concepts/tables-and-sessions',
        'concepts/cover-charges',
        'concepts/reservations',
        'concepts/events',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      link: {type: 'generated-index', slug: '/guides'},
      items: [
        'guides/check-in-a-party',
        'guides/checkout-a-game',
        'guides/run-a-tournament',
        'guides/flag-replacements',
        'guides/customize-seed-data',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      link: {type: 'generated-index', slug: '/reference'},
      items: [
        'reference/api',
        'reference/database',
        'reference/configuration',
        'reference/types',
      ],
    },
    'why',
    'troubleshooting',
    'contributing',
    'changelog',
  ],
};

export default sidebars;
