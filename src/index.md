---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "pgvecto.rs"
  text: "Scalable Vector Search in Postgres"
  tagline: Revolutionize Vector Search, not Database
  image:
    src: /logo.svg
    alt: pgvecto.rs
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/overview
    # - theme: alt
    #   text: API Reference
    #   link: /api-examples
    - theme: alt
      text: Launch Blog ↗️
      link: https://blog.vectorchord.ai/
features:
  - title: Scalable
    details: Designed to be scalable, supports half-precision and quantization for more vectors
  - title: 100% Rust
    details: pgvecto.rs is implemented in Rust rather than C like many existing Postgres extensions. Rust provides many advantages for an extension like pgvecto.rs.
  - title: Relational + Semantic Search
    details: pgvecto.rs allows you to use the same SQL interface for both relational and semantic search (and even combine them).
---
