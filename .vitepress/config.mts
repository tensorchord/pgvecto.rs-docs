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

    sidebar: {
      '/':[
        {
          text: 'Getting Started',
          collapsed: false,
          items:[
            { text: 'Overview', link: '/getting-started/overview' },
          ],
        },
        {
          text: 'FAQs',
          collapsed: false,
          items:[
            { text: 'pgvecto.rs vs. pgvector', link: '/faqs/comparison-pgvector' },
            { text: 'pgvecto.rs vs. specialized vectordb', link: '/faqs/comparison-with-specialized-vectordb' }
          ]
        },
        {
          text: 'Misc',
          collapsed: true,
          items: [
            {text: 'Telemetry', link: '/misc/telemetry'},
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
