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

### Feature: Bottom Tab Bar Navigation
- **[2026-02-22]** Added sticky bottom tab bar with three items: Kartlarım (home), Ekle (add card CTA), Özet (summary placeholder)
- **[2026-02-22]** "Ekle" center button is a circular teal gradient icon button that opens PhotoUploadModal from any route
- **[2026-02-22]** Moved PhotoUploadModal render to App return block (outside Routes) so it works from all pages
- **[2026-02-22]** Added `/ozet` route with SummaryView placeholder component showing total card count
- **[2026-02-22]** Tab bar uses glassmorphism styling (blur + semi-transparent bg), active tab indicator with --holo-1 color
- **[2026-02-22]** Added bottom spacer to catalogue content and increased trainer-detail-page padding to prevent content being hidden behind tab bar
- **[2026-02-22]** Tab bar visible on all routes (catalogue, trainer detail, summary) for consistent mobile navigation

### Feature: Remove Card from Collection
- **[2026-02-22]** Added delete button (✕) on each CardTile — hidden by default, revealed on hover via CSS transition
- **[2026-02-22]** Delete button hidden during compare mode to avoid conflict with selection checkbox
- **[2026-02-22]** Created `DeleteConfirmModal` inline component following existing modal pattern (`.modal-overlay` + `.modal-content`)
- **[2026-02-22]** Confirmation modal shows card image, name, type badge, and rarity badge for clear identification
- **[2026-02-22]** Turkish confirmation text: "Bu kartı koleksiyonunuzdan silmek istediğinize emin misiniz?" with warning "Bu işlem geri alınamaz."
- **[2026-02-22]** Added `@media (hover: none)` CSS rule so delete button is visible on touch devices (opacity: 0.7)
- **[2026-02-22]** Card removal persists automatically via existing localStorage useEffect

### Design: Pokemon TCG Logo Integration
- **[2026-02-22]** Added `TCG_LOGO` constant using `import.meta.env.BASE_URL` for cross-deployment compatibility (Vercel + GitHub Pages)
- **[2026-02-22]** Header: Replaced 40x40 Pokéball sprite with official TCG logo (48px height) with dual holographic drop-shadow (purple + cyan glow)
- **[2026-02-22]** Header: Shortened title from "Pokémon Kart Kataloğu" → "Kart Kataloğu" (logo carries the branding), reduced font-size 26→20
- **[2026-02-22]** Summary View: Replaced 📊 emoji with TCG logo watermark (200px, opacity 0.3, grayscale 0.3, purple glow)
- **[2026-02-22]** Photo Upload Modal: Added small logo (28px) inline next to "Fotoğraftan Kart Ekle" title, removed camera emoji
- **[2026-02-22]** Empty State: When no cards match search/filter, shows ghost TCG logo watermark (opacity 0.15, grayscale 0.5) with Turkish message

### Design (Pencil): Phase 1 — Light Theme, Settings, TCG Card Style
- **[2026-02-22]** Created light theme variables in .pen file with `mode: ["dark", "light"]` axis
- **[2026-02-22]** Integrated Pokemon TCG logo into Pencil design headers
- **[2026-02-22]** Added Settings screen with theme selection (light/dark) and collection owner input
- **[2026-02-22]** Redesigned card tiles to TCG trading card style with art frame, HP, type, rarity badges
- **[2026-02-22]** Added favorite hearts to card tiles (filled pink for favorited, outline for others)
- **[2026-02-22]** Applied rarity visual effects: gold gradient for Double Rare (RR), rainbow holographic for Hyper Rare (M)

### Design (Pencil): Phase 2 — Mobile-First Pivot
- **[2026-02-22]** User directed: "this is a mobile app, stop worrying about desktop version"
- **[2026-02-22]** Created Mobile Settings screen (390px) — theme toggle, owner input, light theme
- **[2026-02-22]** Created Mobile Card Detail screen (390px) — Charmander with bio, lore, trainer info, stats, friends/foes
- **[2026-02-22]** Created Mobile Trainer Detail screen (390px) — Red with 16:9 portrait, bio, hikaye, card grid
- **[2026-02-22]** Applied light theme to all mobile screens (updated hardcoded dark colors)
- **[2026-02-22]** Refined trainer portrait from circle to wide 16:9 format (fill_container x 200px)
- **[2026-02-22]** Changed trainer detail header from generic "Eğitmen Detayı" to trainer's actual name

### Design (Pencil): Phase 3 — Tab Bar Reconfiguration + Favorites Filter
- **[2026-02-22]** Rebuilt bottom tab bar on all 4 mobile screens from 4 tabs to 5 tabs
- **[2026-02-22]** New tab order: Özet, Kartlarım, Kart Ekle, Eğitmenler, Ayarlar
- **[2026-02-22]** Each tab: lucide icon (18px) + label (10px DM Sans 600) + optional indicator bar
- **[2026-02-22]** Active tab: #0d9488 teal + 28x2px indicator bar; Inactive: #8b87a0
- **[2026-02-22]** Kart Ekle tab uses #00f5d4 teal accent background (replacing old camera circle button)
- **[2026-02-22]** Correct active states per screen: Catalogue→Kartlarım, Settings→Ayarlar, Card Detail→Kartlarım, Trainer Detail→Eğitmenler
- **[2026-02-22]** Added favorites filter button (pink heart icon, 36x36px) to Mobile Catalogue controls bar
- **[2026-02-22]** Fixed `plus-circle` → `circle-plus` (correct lucide icon name)
- **[2026-02-22]** All 4 screens verified via screenshots

### Bugfix: Trainer Detail Page — Portraits & Turkish Translation
- **[2026-02-22]** Fixed trainer portraits: replaced Pokemon sprite URLs with actual trainer character artwork from Bulbapedia (official Ken Sugimori / anime artwork)
- **[2026-02-22]** Downloaded 13 trainer images to `public/trainers/` for local serving (Ash, Misty, Brock, Dawn, Blaine, Prof. Oak, Cynthia, Red, Blue, Lance, N, Steven Stone, Team Rocket)
- **[2026-02-22]** Updated `trainers.js` picture paths to use local files with `import.meta.env.BASE_URL` prefix in TrainerDetail.jsx for GitHub Pages compatibility
- **[2026-02-22]** Translated all 13 trainer `bio` and `lore` fields from English to Turkish
- **[2026-02-22]** Updated `.trainer-portrait` CSS: `object-fit: cover` + `object-position: top` + `border-radius: 50%` for circular character portraits
- **[2026-02-22]** Removed `crossOrigin="anonymous"` from trainer portrait img (no longer needed for local images)
