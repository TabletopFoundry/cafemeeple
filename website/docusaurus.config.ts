import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const GITHUB_URL = 'https://github.com/TabletopFoundry/cafemeeple';

const config: Config = {
  title: 'CaféMeeple',
  tagline: "Your café's operating system, from shelf to table.",
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://cafemeeple.dev',
  baseUrl: '/',

  organizationName: 'TabletopFoundry',
  projectName: 'cafemeeple',

  onBrokenLinks: 'throw',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: `${GITHUB_URL}/edit/main/website/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/og-image.svg',
    metadata: [
      {name: 'keywords', content: 'board game café, café management, SaaS, board games, reservations, game library'},
      {name: 'description', content: "CaféMeeple is the open-source operating system for board game cafés — game library, tables, sessions, reservations, events & analytics in one place."},
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
      disableSwitch: false,
    },
    navbar: {
      title: 'CaféMeeple',
      logo: {
        alt: 'CaféMeeple logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/reference/api',
          label: 'API',
          position: 'left',
        },
        {
          to: '/docs/why',
          label: 'Why CaféMeeple',
          position: 'left',
        },
        {
          href: GITHUB_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Getting Started', to: '/docs/getting-started/installation'},
            {label: 'Core Concepts', to: '/docs/concepts/overview'},
            {label: 'API Reference', to: '/docs/reference/api'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub Discussions', href: `${GITHUB_URL}/discussions`},
            {label: 'Issues', href: `${GITHUB_URL}/issues`},
            {label: 'Contributing', to: '/docs/contributing'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Changelog', to: '/docs/changelog'},
            {label: 'Troubleshooting', to: '/docs/troubleshooting'},
            {label: 'GitHub', href: GITHUB_URL},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CaféMeeple contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'tsx', 'sql'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
