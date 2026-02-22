# Progress Log

## Session 1 — 2026-02-22

### Workflow Setup
- **[2026-02-22]** Established rule: always commit and push after every code/requirement change
- **[2026-02-22]** Established rule: always deploy to Vercel production after each push
- **[2026-02-22]** Defined full workflow preferences:
  - Documentation requirements (progress.md, tasks.md, bugs.md, README.md)
  - Execution model: Opus for planning, Sonnet subagents for execution
  - Task flow: plan → log → execute → track bugs → update progress → update README → commit/push → deploy
- **[2026-02-22]** Created persistent memory file for cross-session continuity
- **[2026-02-22]** Created project tracking files: tasks.md, progress.md, bugs.md

### UI Fix: Sort Controls Grouping
- **[2026-02-22]** Wrapped sort attribute selector and sort direction button (↑/↓) in a flex container with `flexShrink: 0` so they always stay together on mobile and desktop
- **[2026-02-22]** Added "Sırala:" label to the left of the sort dropdown

### Feature: Photo Upload + OpenAI Vision Card Analysis
- **[2026-02-22]** Removed manual AddModal (keyboard entry form for adding cards)
- **[2026-02-22]** Added PhotoUploadModal with 3 phases: upload (drag-and-drop + file input), analyzing (spinner), review (editable card data with collapsible details)
- **[2026-02-22]** Created Vercel serverless function (`api/analyze.js`) to proxy OpenAI Vision API calls — keeps API key server-side
- **[2026-02-22]** Added localStorage persistence for card collection (survives page refresh)
- **[2026-02-22]** Supports single card photos and full binder page photos (multi-card extraction)
- **[2026-02-22]** Added dev proxy in vite.config.js for local development with `vercel dev`
- **[2026-02-22]** OpenAI prompt maps card symbols to Turkish type/stage/rarity values matching existing schema

### Project Config: CLAUDE.md
- **[2026-02-22]** Created `CLAUDE.md` at project root with comprehensive project documentation for Claude Code
- **[2026-02-22]** Covers: tech stack, project structure, code conventions, styling rules, data layer, API/serverless, deployment, workflow rules, and documentation file purposes
