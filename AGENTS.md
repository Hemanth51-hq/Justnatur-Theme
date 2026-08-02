# AGENTS.md

Guidance for AI agents working in this repository.

## Repository status

As of initial environment setup, **Justnatur-Theme** is a greenfield repository. It contains only `README.md` (title: "Justnatur-Theme") and has no application source, dependency manifests, build scripts, or service definitions.

There is nothing to lint, test, build, or run until theme source code and tooling are added.

## Cursor Cloud specific instructions

### Services

| Service | Status | Notes |
|---------|--------|-------|
| Application / dev server | Not present | No `package.json`, `Gemfile`, `docker-compose.yml`, or similar |
| Database or external APIs | Not present | None configured |

### VM tooling available

The Cloud Agent VM includes Node.js (v22 via nvm), npm, pnpm, yarn, and Python 3.12. Ruby is not installed by default.

### When code is added

After the repository includes real theme sources, update this section with:

1. **Stack** — e.g. Shopify, WordPress, Jekyll, static HTML/CSS, React, etc.
2. **Install** — command to install dependencies (this should also be reflected in the Cursor environment update script).
3. **Dev server** — how to start the local preview (port, URL).
4. **Lint / test** — exact commands from `package.json` scripts, Makefile, or CI config.
5. **Hello-world check** — one concrete action that proves the theme works (e.g. load preview page, compile assets).

### Current update script

No dependency installation is required. The environment update script is a no-op until manifests exist in the repo.
