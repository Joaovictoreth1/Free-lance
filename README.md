# Tecsafe Segurança Eletrônica — Web Storefront

Production-hardened static web application and lead-generation storefront for **Tecsafe Segurança Eletrônica** (CFTV, Alarmes Inteligentes, Controle de Acesso Facial, Interfonia & Automação de Portões).

## Architecture Overview

```text
Free-lance/
├── index.html                  # Semantic HTML5 entrypoint (SEO, Open Graph, JSON-LD, WCAG landmarks)
├── public/
│   ├── assets/                 # Local SVG illustrations (hero, rack infrastructure, case studies)
│   ├── favicon.svg             # Brand vector favicon
│   ├── manifest.webmanifest    # Web App Manifest
│   ├── robots.txt              # Crawler policy
│   └── sitemap.xml             # Search engine sitemap
├── src/
│   ├── main.ts                 # Application bootstrap & dynamic link hydration
│   ├── config/site.ts          # Env-backed config loader, URL/phone sanitizers, LGPD/Terms copy
│   ├── modules/
│   │   ├── navigation.ts       # Sticky navbar & accessible mobile drawer (Escape, ARIA, scroll lock)
│   │   ├── effects.ts          # rAF custom cursor, 3D tilt cards, IntersectionObserver reveals
│   │   ├── quoteForm.ts        # Validated lead-capture form with BR phone mask & WhatsApp handoff
│   │   └── modals.ts           # Accessible <dialog> controller for LGPD Privacy & Terms
│   └── styles/main.css         # Compiled Tailwind CSS + reduced-motion & fine-pointer guards
├── tests/                      # Vitest + jsdom unit, DOM integration, and HTML security tests
├── docker/nginx.conf           # Hardened Nginx config (strict CSP, security headers, caching, /healthz)
├── Dockerfile                  # Multi-stage Node 22 builder -> non-root nginx-unprivileged runtime
├── docker-compose.yml          # Read-only, cap-dropped local production container
├── Makefile                    # Standardized developer & release commands
└── .github/workflows/ci.yml    # CI gates: typecheck, lint, tests+coverage, build, HTML validation, audit, Docker
```

## Tech Stack

- **Build & Bundling**: Vite 8, TypeScript 5 (strict mode), Tailwind CSS 3 (compiled & purged at build time — zero runtime CDN)
- **Icons & Media**: Inline accessible SVGs and local vector illustrations (zero FontAwesome CDN dependency, zero 404 assets)
- **Testing & Static Analysis**: Vitest + jsdom (`@vitest/coverage-v8`), ESLint 10 (`typescript-eslint` strict type-checked), `html-validate` (HTML5 + WCAG)
- **Production Runtime**: `nginxinc/nginx-unprivileged:1.27-alpine` (non-root UID 101, port `8080`, `/healthz` health check)

## Quick Start

### Prerequisites

- Node.js `>= 20` (recommended: Node 22 LTS) and npm
- Optional: Docker & Docker Compose for containerized production preview

### Local Development

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`.

### Full Quality & Production Check

```bash
make check
# equivalent to:
# npm run typecheck && npm run lint && npm run test:coverage && npm run build && npm run validate:html && npm audit --audit-level=high
```

### Production Container (Docker + Hardened Nginx)

```bash
make docker-up
# Site:   http://localhost:8080
# Health: http://localhost:8080/healthz
```

To stop and remove the container:

```bash
make docker-down
```

## Environment Variables

All public variables are prefixed with `VITE_` and validated/sanitized in `src/config/site.ts` (falling back safely if omitted or malformed). See `.env.example`:

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://tecsafe.com.br` | Canonical production URL (`http`/`https` only) |
| `VITE_COMPANY_NAME` | `Tecsafe Segurança Eletrônica` | Display name |
| `VITE_WHATSAPP_NUMBER` | `5511981846322` | E.164 digits for `wa.me` links (10–15 digits) |
| `VITE_WHATSAPP_DISPLAY` | `(11) 98184-6322` | Formatted phone number shown in UI |
| `VITE_INSTAGRAM_URL` | `https://instagram.com/tecsafeseguranca` | Social profile URL |
| `VITE_CONTACT_EMAIL` | `contato@tecsafe.com.br` | Institutional contact email |

## Security & Hardening Highlights

- **Strict Content-Security-Policy (CSP)** in `docker/nginx.conf` with `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, and zero `unsafe-inline` / `unsafe-eval` scripts.
- **Transport & Framing Headers**: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
- **Safe External Navigation**: Every `target="_blank"` link enforces `rel="noopener noreferrer"` (verified by automated tests).
- **Non-Root Container**: Multi-stage Docker build serving static files from `nginx-unprivileged` with `read_only: true` and `cap_drop: [ALL]` in Compose.
- **Accessibility**: Skip link, semantic landmarks (`header`, `nav`, `main`, `footer`), full keyboard support (`Escape` on mobile drawer and legal modals), `prefers-reduced-motion` support, and fine-pointer-gated custom cursor.

## Replacing Placeholder Artwork with Client Media

The original repository referenced local `.jpg`/`.mp4` files that were never committed. Clean vector artwork is shipped in `public/assets/` so production renders with zero 404s. To swap in real photos or videos:

1. Add optimized WebP/AVIF images or MP4/WebM videos into `public/assets/`.
2. Update the corresponding `src` paths in `index.html` (`hero-security.svg`, `infra-rack.svg`, `case-interfonia.svg`, `case-acesso-facial.svg`).
3. Run `make check` to verify asset existence, HTML validity, and build output.
