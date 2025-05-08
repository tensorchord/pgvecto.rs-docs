import footnote from 'markdown-it-footnote'
import { defineConfig } from 'vitepress'

import mathjax3 from 'markdown-it-mathjax3';

const customElements = ['mjx-container'];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "VectorChord",
  description: "Scalable Vector Search in Postgres",
  srcDir: 'src',
  markdown: {
    config: (md) => {
      md.use(mathjax3);
      md.use(footnote);
    },
  },
  sitemap: {
    hostname: 'https://docs.vectorchord.ai/'
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // Google Analytics
    [
      'script',
      {
        async: "true",
        src: 'https://www.googletagmanager.com/gtag/js?id=G-YGY455DH2T'
      }
    ],
    [
      'script',
      {
        "type": "text/javascript"
      },
      '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "qypum3ti3k");'
    ],
    [
      'script',
      {},
      "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-YGY455DH2T');"
    ],
  ],
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
      { text: 'Docs', link: '/vectorchord/' },
      { text: 'Cloud', link: '/cloud/' },
      { text: 'Blog', link: 'https://blog.vectorchord.ai/' },
      {
        text: 'Others',
        items: [
          { text: 'pgvecto.rs Docs', link: '/getting-started/overview' },
          { text: 'Reference', link: '/reference/' },
        ]
      }
    ],

    editLink: {
      pattern: 'https://github.com/tensorchord/pgvecto.rs-docs/tree/main/src/:path',
      text: 'Edit this page',
    },

    sidebar: {
      '/reference/': [
        {
          text: 'Reference',
          collapsed: false,
          items: [
            { text: 'Schema', link: '/reference/schema' },
            { text: 'Indexing Options', link: '/reference/indexing_options' },
            { text: 'Search Options', link: '/reference/search_options' },
            {
              text: 'Vector Types', link: '/reference/vector-types', items: [
                { text: 'Half-Precision Vector', link: '/reference/vector-types/vecf16' },
                { text: '8-Bit Integer Vector', link: '/reference/vector-types/veci8' },
                { text: 'Sparse Vector', link: '/reference/vector-types/svector' },
                { text: 'Binary Vector', link: '/reference/vector-types/bvector' },
              ]
            },
          ],
        },
      ],
      '/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/getting-started/overview' },
            { text: 'Installation', link: '/getting-started/installation' },
          ],
        },
        {
          text: 'Usage',
          collapsed: false,
          items: [
            { text: 'Indexing', link: '/usage/indexing' },
            { text: 'Search', link: '/usage/search' },
            { text: 'Monitoring', link: '/usage/monitoring' },
            { text: 'Quantization', link: '/usage/quantization' },
            { text: 'Compatibility', link: '/usage/compatibility' },
          ]
        },
        {
          text: 'Use Cases',
          collapsed: false,
          items: [
            { text: 'Hybrid search', link: '/use-case/hybrid-search' },
            { text: 'Adaptive retrieval', link: '/use-case/adaptive-retrieval' },
            { text: 'Image search', link: '/use-case/image-search' },
            { text: 'Multi tenancy', link: '/use-case/multi-tenancy' },
            { text: 'Sparse vector', link: '/use-case/sparse-vector' },
            { text: 'Generative Question-Answering', link: '/use-case/question-answering' },
          ],
        },
        {
          text: 'Integration',
          collapsed: false,
          items: [
            { text: 'LangChain', link: '/integration/langchain' },
            { text: 'LlamaIndex', link: '/integration/llama-index' },
            { text: 'Citus', link: '/integration/citus' },
          ],
        },
        {
          text: 'Administration',
          collapsed: false,
          items: [
            { text: 'Configuration', link: '/admin/configuration' },
            { text: 'Upgrading', link: '/admin/upgrading' },
            { text: 'Logical replication', link: '/admin/logical_replication' },
            { text: 'Foreign data wrapper (FDW)', link: '/admin/fdw' },
            { text: 'Kubernetes', link: '/admin/kubernetes' },
            { text: 'Migration', link: '/admin/migration' },
          ],
        },
        {
          text: 'FAQs',
          collapsed: false,
          items: [
            { text: 'General FAQ', link: '/faqs/general' },
            { text: 'pgvecto.rs vs. pgvector', link: '/faqs/comparison-pgvector' },
            { text: 'pgvecto.rs vs. specialized vectordb', link: '/faqs/comparison-with-specialized-vectordb' },
            { text: `Benchmarks`, link: '/faqs/benchmark' },
          ]
        },
        {
          text: 'Community',
          collapsed: true,
          items: [
            { text: 'Contributing to pgvecto.rs', link: '/community/contributing' },
            { text: 'Roadmap', link: '/community/roadmap' },
            { text: 'Adopters', link: '/community/adopters' },
          ],
        },
        {
          text: 'Developers',
          collapsed: true,
          items: [
            { text: 'Development tutorial', link: '/developers/development' },
          ],
        },
      ],
      '/vectorchord/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/vectorchord/getting-started/overview' },
            { text: 'Installation', link: '/vectorchord/getting-started/installation' },
          ],
        },
        {
          text: 'Usage',
          collapsed: false,
          items: [
            { text: 'Indexing', link: '/vectorchord/usage/indexing' },
            { text: 'Indexing with MaxSim Operators', link: '/vectorchord/usage/indexing-with-maxsim-operators' },
            { text: 'Search', link: '/vectorchord/usage/search' },
            { text: 'Performance Tuning', link: '/vectorchord/usage/performance-tuning' },
            { text: 'Advanced Features', link: '/vectorchord/usage/advanced-features' },
          ]
        },
        {
          text: 'Use Cases',
          collapsed: false,
          items: [
            { text: 'Hybrid search', link: '/vectorchord/use-case/hybrid-search' },
            { text: 'ColBERT Rerank', link: '/vectorchord/use-case/colbert-rerank' },
            { text: 'ColQwen2 & Modal', link: '/vectorchord/use-case/colqwen2-modal' },
          ],
        },
        {
          text: 'Benchmark',
          collapsed: false,
          items: [
            { text: 'Pricing', link: '/vectorchord/benchmark/pricing' },
            { text: 'Performance', link: '/vectorchord/benchmark/performance' },
          ],
        },
        {
          text: 'Administration',
          collapsed: false,
          items: [
            { text: 'Migration', link: '/vectorchord/admin/migration' },
          ]
        },
      ],
      '/cloud/':
        [
          {
            text: 'Getting Started',
            collapsed: false,
            items: [
              { text: 'Sign Up', link: '/cloud/getting-started/sign-up' },
              { text: 'Quick Start', link: '/cloud/getting-started/quick-start' },
            ],
          },
          {
            text: 'Connecting to the cluster',
            collapsed: false,
            items: [
              { text: 'Connecting with psql', link: '/cloud/connect/connect-with-psql' },
            ],
          },
          {
            text: 'Monitoring',
            collapsed: true,
            items: [
              { text: 'Monitoring', link: '/cloud/monitoring/monitoring' },
              { text: 'Collect Metrics', link: '/cloud/monitoring/collect-metrics' },
            ],
          },
          {
            text: 'Management',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/cloud/manage/overview' },
              { text: 'Projects', link: '/cloud/manage/project' },
              { text: 'Clusters', link: '/cloud/manage/cluster' },
              { text: 'Authorization', link: '/cloud/manage/authorization' },
              { text: 'Backup & Restore', link: '/cloud/manage/backup-restore' },
              { text: 'Upgrade', link: '/cloud/manage/upgrade' },
              { text: 'API Keys', link: '/cloud/manage/apikey' },
              { text: 'Terraform', link: '/cloud/manage/terraform' },
              { text: 'Regions', link: '/cloud/manage/regions' },
              { text: 'Workflow', link: '/cloud/manage/workflow' },
            ],
          },
          {
            text: 'Pricing & Billing',
            collapsed: true,
            items: [
              { text: 'Cloud Pricing', link: '/cloud/pricing/price-plan' },
              { text: 'Credit Card', link: '/cloud/payment/credit-card' },
              { text: 'Invoice', link: '/cloud/payment/invoice' },
            ],
          },
          {
            text: 'Limits & Restrictions',
            collapsed: true,
            items: [
              { text: 'Cloud Limits', link: '/cloud/limit/cloud-limit' },
            ],
          },
          {
            text: 'Troubleshooting',
            collapsed: true,
            items: [
              { text: 'Troubleshooting', link: '/cloud/troubleshooting/troubleshooting' },
            ],
          },
        ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tensorchord/VectorChord' },
      { icon: 'discord', link: 'https://discord.gg/KqswhpVgdU' }
    ],
    search: {
      provider: 'local'
    }
  }
})
