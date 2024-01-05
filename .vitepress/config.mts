import { defineConfig } from 'vitepress'

import mathjax3 from 'markdown-it-mathjax3';

const customElements = ['mjx-container'];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "pgvecto.rs",
  description: "Scalable Vector Search in Postgres",  
  srcDir: 'src',
  markdown: {
    config: (md) => {
      md.use(mathjax3);
    },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag),
      },
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/getting-started/overview' },
      { text: 'Blog', link: 'https://blog.pgvecto.rs' },
    ],

    editLink: {
      pattern: 'https://github.com/tensorchord/pgvecto.rs-docs/tree/main/src/:path',
      text: 'Edit this page',
    },

    sidebar: {
      '/':[
        {
          text: 'Getting Started',
          collapsed: false,
          items:[
            { text: 'Overview', link: '/getting-started/overview' },
            { text: 'Installation', link: '/getting-started/installation' },
          ],
        },
        {
          text: 'Usage',
          collapsed: false,
          items:[
            { text: 'Indexing', link: '/usage/indexing' },
            { text: 'Search', link: '/usage/search' }
          ]
        },
        {
          text: 'Administration',
          collapsed: false,
          items: [
            {text: 'Configuration', link: '/admin/configuration'},
            {text: 'Upgrading from older versions', link: '/admin/upgrading'},
          ],
        },
        {
          text: 'FAQs',
          collapsed: false,
          items:[
            { text: 'pgvecto.rs vs. pgvector', link: '/faqs/comparison-pgvector' },
            { text: 'pgvecto.rs vs. specialized vectordb', link: '/faqs/comparison-with-specialized-vectordb' },
          ]
        },
        {
          text: 'Community',
          collapsed: false,
          items: [
            {text: 'Contributing to pgvecto.rs', link: '/community/contributing'},
            {text: 'Roadmap', link: '/community/roadmap'},
            {text: 'Adopters', link: '/community/adopters'},
          ],
        },
        {
          text: 'Developers',
          collapsed: false,
          items: [
            {text: 'Development tutorial', link: '/developers/development'},
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tensorchord/pgvecto.rs' },
      { icon: 'discord', link: 'https://discord.gg/KqswhpVgdU'}
    ]
  }
})
