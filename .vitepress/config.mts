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
  // pgvecto_rs doc should have a route of / to keep back compatible
  rewrites: {
    'pgvecto_rs/admin/:page*': 'admin/:page*',
    'pgvecto_rs/community/:page*': 'community/:page*',
    'pgvecto_rs/developers/:page*': 'developers/:page*',
    'pgvecto_rs/faqs/:page*': 'faqs/:page*',
    'pgvecto_rs/getting-started/:page*': 'getting-started/:page*',
    'pgvecto_rs/integration/:page*': 'integration/:page*',
    'pgvecto_rs/reference/:page*': 'reference/:page*',
    'pgvecto_rs/usage/:page*': 'usage/:page*',
    'pgvecto_rs/use-case/:page*': 'use-case/:page*',
    'vectorchord/usage/multi-vector-retrieval.md': 'vectorchord/usage/indexing-with-maxsim-operators.md',
    'vectorchord/usage/similarity-filter.md': 'vectorchord/usage/range-query.md',
    'vectorchord/usage/postgresql-tuning.md': 'vectorchord/usage/performance-tuning.md',
    'vectorchord/usage/external-build.md': 'vectorchord/usage/external-index-precomputation.md',
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
        ]
      }
    ],

    editLink: {
      pattern: 'https://github.com/tensorchord/pgvecto.rs-docs/tree/main/src/:path',
      text: 'Edit this page',
    },

    sidebar: {
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
            { text: 'VectorChord Suite', link: '/vectorchord/getting-started/vectorchord-suite' },
          ],
        },
        {
          text: 'Usage',
          collapsed: false,
          items: [
            { text: 'Indexing', link: '/vectorchord/usage/indexing' },
            { text: 'Multi-Vector Retrieval', link: '/vectorchord/usage/indexing-with-maxsim-operators' },
            { text: 'Graph Index', link: '/vectorchord/usage/graph-index' },
            { text: 'Quantization Types', link: '/vectorchord/usage/quantization-types' },
            { text: 'Similarity Filter', link: '/vectorchord/usage/range-query' },
            { text: 'PostgreSQL Tuning', link: '/vectorchord/usage/performance-tuning' },
            { text: 'Monitoring', link: '/vectorchord/usage/monitoring' },
            { text: 'Fallback Parameters', link: '/vectorchord/usage/fallback-parameters' },
            { text: 'Measure Recall', link: '/vectorchord/usage/measure-recall' },
            { text: 'Prewarm', link: '/vectorchord/usage/prewarm' },
            { text: 'Prefilter', link: '/vectorchord/usage/prefilter' },
            { text: 'Prefetch', link: '/vectorchord/usage/prefetch' },
            { text: 'Rerank in Table', link: '/vectorchord/usage/rerank-in-table' },
            { text: 'Partitioning Tuning', link: '/vectorchord/usage/partitioning-tuning' },
            { text: 'External Build', link: '/vectorchord/usage/external-index-precomputation' },
          ]
        },
        {
          text: 'Use Cases',
          collapsed: true,
          items: [
            { text: 'Hybrid Search', link: '/vectorchord/use-case/hybrid-search' },
            { text: 'ColBERT Rerank', link: '/vectorchord/use-case/colbert-rerank' },
            { text: 'ColQwen2 & Modal', link: '/vectorchord/use-case/colqwen2-modal' },
          ],
        },
        {
          text: 'Benchmarks',
          collapsed: true,
          items: [
            { text: 'Price', link: '/vectorchord/benchmark/price' },
            { text: 'Performance', link: '/vectorchord/benchmark/performance' },
            { text: 'Benchmarks with pgvector', link: '/vectorchord/benchmark/pgvector' },
            { text: 'Benchmarks with Elasticsearch', link: '/vectorchord/benchmark/elasticsearch' },
            { text: 'Benchmarks with pgvectorscale', link: '/vectorchord/benchmark/pgvectorscale' },
          ]
        },
        {
          text: 'Administration',
          collapsed: true,
          items: [
            { text: 'Migration', link: '/vectorchord/admin/migration' },
            { text: 'Scalability', link: '/vectorchord/admin/scalability' },
            { text: 'Kubernetes', link: '/vectorchord/admin/kubernetes' },
          ]
        },
        {
          text: 'Customer Stories',
          collapsed: true,
          items: [
            { text: 'Earth Genome', link: '/vectorchord/customer-stories/earthgenome' },
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
