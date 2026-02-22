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

### Feature: Trainer Detail Pages
- **[2026-02-22]** Installed `react-router-dom` for client-side routing
- **[2026-02-22]** Created `src/data/trainers.js` with 13 trainers (Ash, Misty, Brock, Dawn, Blaine, Prof. Oak, Cynthia, Red, Blue, Lance, N, Steven Stone, Team Rocket) — each with name, Japanese name, bio, lore, region, specialty, and signature Pokemon image
- **[2026-02-22]** Added `trainer` field to all 101 cards in `initialCards`, mapping each Pokemon to its canonical trainer
- **[2026-02-22]** Wrapped app with `BrowserRouter` in `main.jsx`, added `<Routes>` in `App.jsx` with `/` and `/trainer/:trainerSlug` routes
- **[2026-02-22]** Updated `CardTile` to show clickable trainer name (🎯 link) below Pokemon name
- **[2026-02-22]** Created `TrainerDetail.jsx` component with hero section, biography, lore, and associated cards grid — all matching holographic dark theme
- **[2026-02-22]** Added trainer page CSS to `styles.css` (hero with holoShimmer border, glass sections, responsive layout)
- **[2026-02-22]** State preservation: all filter/sort state stays in `App` (stays mounted across routes), scroll position saved to `useRef` and restored via `requestAnimationFrame`
- **[2026-02-22]** Added `vercel.json` with SPA rewrite rules for production routing
