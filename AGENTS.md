# Moon UI - AI Coding Agent Instructions

## Project Overview
This is a **specification and planning repository** for Moon Admin WebApp—a secure, mobile-first admin UI for managing Moon API backends. **No code exists yet**. All implementation must follow [SPEC.md](SPEC.md) and backend API docs in [MOON_API.md](MOON_API.md).

**Tech Stack**: React (TypeScript strict) · DaisyUI (Tailwind) · Bun.js
**Framework Docs**: [DaisyUI](.github/llms/daisyui-llms.txt) · [Bun.js](.github/llms/bunjs-llms-full.txt)
**Live Docs**: Use Context7 MCP and GitHub MCP servers for latest docs when local files are outdated/unavailable.

## Critical Constraints
- **Test Driven Development:** All features and implementations must follow TDD—first write a failing test, then implement to pass. Aim for 90%+ test coverage and 100% test pass rate. Fix any failing test, even if unrelated to your implementation.
- Never cache data—always fetch fresh from backend
- Encrypt all sensitive localStorage data (AES-GCM 256-bit)
- No modals for records—use inline edit mode ([SPEC.md](SPEC.md#record-view))
- Moon API: no joins, no transactions, POST/GET only, snake_case names
- Mobile-first—test on mobile viewports first
- Client-side rendering only; no SEO/performance concerns for initial load

See [SPEC.md](SPEC.md#constraints) and [MOON_API.md](MOON_API.md#intro) for full details.

## PRD-Driven Development
- Generate PRD: [.github/agents/PRD.agent.md](.github/agents/PRD.agent.md)
- Implement one PRD per commit: [.github/prompts/Implment_PRD.prompt.md](.github/prompts/Implment_PRD.prompt.md)
- PRDs: `prd/NNN-feature-name.md` using [.github/instructions/prd.instructions.md](.github/instructions/prd.instructions.md)

## Quick Start
- Project setup (Bun.js):
  ```bash
  bun create vite moon-ui --template react-ts
  bun add -D daisyui@latest
  ```
- Testing server: `https://moon.asensar.in/`
  - Credentials: `{ "username": "admin", "password": "moonadmin12#" }`

## Essential Patterns
- Moon API: Collection = Table, Field = Column, Record = Row
- API pattern: `resource:action` (e.g., `/collections:list`, `/products:create`)
- Authentication: JWT (15-min expiration, refresh—see [MOON_API.md](MOON_API.md#authentication))
- UI: Login → Admin (header/sidebar/content) → Table View → Record View (view/edit)

See [SPEC.md](SPEC.md#ui-layouts-and-components) for UI layouts and component specs.

## Key Files
- [SPEC.md](SPEC.md) — Product spec (UI, flows, security, constraints)
- [MOON_API.md](MOON_API.md) — Backend API reference & JSON appendix
- [.github/agents/PRD.agent.md](.github/agents/PRD.agent.md) — PRD generator
- [.github/instructions/prd.instructions.md](.github/instructions/prd.instructions.md) — PRD template
- [.github/prompts/Implment_PRD.prompt.md](.github/prompts/Implment_PRD.prompt.md) — Implementation workflow
- [DaisyUI](.github/llms/daisyui-llms.txt) — DaisyUI llms.txt 
- [Bun.js](.github/llms/bunjs-llms-full.txt) — Bunjs llms.txt
