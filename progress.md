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

### Design (Pencil): Phase 4 — Catalogue Card Refresh + Light Theme Fix
- **[2026-02-22]** Fixed Mobile Catalogue screen background: hardcoded `#07060b` → `$bg-deep` variable (matching other screens)
- **[2026-02-22]** Redesigned card tiles: white backgrounds with subtle shadows, replaced heavy type-colored fills
- **[2026-02-22]** Generated AI Pokemon art (Charmander, Pikachu, Empoleon, Gardevoir) replacing Unsplash stock photos
- **[2026-02-22]** Updated overlay badges to frosted glass style, refined section separators to neutral gray
- **[2026-02-22]** Fixed Turkish characters: Ateş, Psişik, zayıflık, çekilme, Piyasa Değeri

### Design (Pencil): Phase 5 — Özet Summary Screen + Logo Fix
- **[2026-02-22]** Fixed logo alignment: reduced logo frame width (150→110px) on Catalogue and Settings headers
- **[2026-02-22]** Created Mobile Özet screen (390×844px, `A7dtP`) at x=5240 with light theme
- **[2026-02-22]** Widget 1: Koleksiyon Değeri — total collection value ($34.75), links to cards sorted by value
- **[2026-02-22]** Widget 2: Kartlarım — card count (87) with rarity breakdown chips (C/U/R/RR/M), links to default card list
- **[2026-02-22]** Widget 3: Favoriler — favorites count (12) with pink heart, links to favorites-filtered card list
- **[2026-02-22]** Widget 4: En Değerli Kart — most valuable card (Empoleon ex, $24.50) with AI thumbnail, links to card detail
- **[2026-02-22]** Widget 5: Tür Dağılımı — type distribution with colored chips (Ateş, Su, Ot, Elektrik, Psişik, Diğer)
- **[2026-02-22]** Tab bar with Özet active (teal indicator), consistent 5-tab layout

### Bugfix: Trainer Detail Page — Portraits & Turkish Translation
- **[2026-02-22]** Fixed trainer portraits: replaced Pokemon sprite URLs with actual trainer character artwork from Bulbapedia (official Ken Sugimori / anime artwork)
- **[2026-02-22]** Downloaded 13 trainer images to `public/trainers/` for local serving (Ash, Misty, Brock, Dawn, Blaine, Prof. Oak, Cynthia, Red, Blue, Lance, N, Steven Stone, Team Rocket)
- **[2026-02-22]** Updated `trainers.js` picture paths to use local files with `import.meta.env.BASE_URL` prefix in TrainerDetail.jsx for GitHub Pages compatibility
- **[2026-02-22]** Translated all 13 trainer `bio` and `lore` fields from English to Turkish
- **[2026-02-22]** Updated `.trainer-portrait` CSS: `object-fit: cover` + `object-position: top` + `border-radius: 50%` for circular character portraits
- **[2026-02-22]** Removed `crossOrigin="anonymous"` from trainer portrait img (no longer needed for local images)

### Infra: Test vs Production Card Data Separation
- **[2026-02-22]** Extracted `initialCards` (90 cards) and `sp()` helper from `App.jsx` into `src/data/cards.prod.js`
- **[2026-02-22]** Created `src/data/cards.dev.js` with 8 representative test cards covering all types, rarities, and special categories
- **[2026-02-22]** Created `src/data/cards.js` router module — uses `import.meta.env.MODE` to serve dev cards in development, prod cards in production
- **[2026-02-22]** Updated `App.jsx` to import from `./data/cards.js` instead of inline array
- **[2026-02-22]** Vite tree-shakes dev data out of production bundle (verified: exactly 90 `kartNo` entries in built JS)
- **[2026-02-22]** No Vite config changes needed — `import.meta.env.MODE` is built-in

### Feature: Implement Mobile Screens from .pen Design
- **[2026-02-22]** Analyzed 5 mobile screens (390px) in `pokemon-pencil-new.pen`: Catalogue, Settings, Card Detail, Trainer Detail, Özet
- **[2026-02-22]** Phase 1 — State Foundation: Added `favorites`, `theme`, `ownerName` to App.jsx with localStorage persistence
- **[2026-02-22]** Phase 2 — Light Theme CSS: Added `[data-theme="light"]` block in `styles.css` overriding all CSS custom properties (bg, text, border colors)
- **[2026-02-22]** Phase 2 — Light theme overrides for `.poke-card`, `.modal-overlay`, `.trainer-card-mini`, scrollbar
- **[2026-02-22]** Phase 3 — 5-Tab Bottom Nav: Rewrote `BottomTabBar` from 3 tabs to 5 tabs (Özet, Kartlarım, Kart Ekle, Eğitmenler, Ayarlar) with teal active state
- **[2026-02-22]** Phase 4 — Routes: Added `/card/:cardId`, `/egitmenler`, `/ayarlar` routes with proper prop passing
- **[2026-02-22]** Phase 5 — Özet Dashboard: Rewrote `SummaryView` from stub to full dashboard with 5 widgets (Collection Value, Cards + rarity chips, Favorites, Top Card, Type Distribution)
- **[2026-02-22]** Phase 6 — Card Detail: Created `src/components/CardDetail.jsx` with large card art, stats grid, favorite toggle, trainer info, related cards
- **[2026-02-22]** Phase 7 — Trainers List: Created `src/components/TrainersList.jsx` with trainer grid (portrait, name, region, card count)
- **[2026-02-22]** Phase 8 — Settings: Created `src/components/SettingsPage.jsx` with theme toggle (dark/light preview cards) and owner name input
- **[2026-02-22]** Phase 9 — Favorites Filter: Added heart filter button in catalogue controls, `showFavoritesOnly` state, pink active styling
- **[2026-02-22]** Wrapped `CardTile` body in `<Link to={/card/${card.id}}>` for card detail navigation
- **[2026-02-22]** Extended `stats` useMemo with `rarityCounts`, `topCard`, `favoritesCount`
- **[2026-02-22]** Build verified: `npm run build` passes cleanly

### Fix: Default Light Theme + Kartlarım Screen Redesign
- **[2026-02-22]** Changed default theme from "dark" to "light" in `loadTheme()` fallback
- **[2026-02-22]** Header redesign: replaced dark gradient header with clean white header, TCG logo only (28px), no title text
- **[2026-02-22]** Type chips: removed emoji icons, pill-shaped (borderRadius 20), teal active state (#0d9488), counts shown
- **[2026-02-22]** Controls bar: replaced complex bar (dropdowns, compare, add photo) with minimal search + 3 icon buttons (favorites heart, sort, filter)
- **[2026-02-22]** Card grid: changed to `repeat(2, 1fr)` 2-column layout with `gap: 12px 10px`, padding `14px 16px`
- **[2026-02-22]** CardTile complete rewrite: compact TCG-style with name+HP row, 120px art frame, trainer row, attack section, weakness/retreat footer, type/rarity badges, market value row
- **[2026-02-22]** CardTile: added heart overlay on art frame for favorites toggle, copies badge (top-left), removed holo overlays and dark hardcoded colors
- **[2026-02-22]** CSS: updated `.poke-card` borderRadius to 14px, softened hover effect, disabled holographic border in light theme, added `--card-section-border` variable
- **[2026-02-22]** All colors now use CSS variables (`var(--text-primary)`, `var(--bg-elevated)`, etc.) for proper light/dark theme support

### Feature: 3D Interactive Card Rotation with Flip
- **[2026-02-22]** Added `useCardTilt` custom hook to `CardDetail.jsx` — tracks pointer/touch drag to rotate card in 3D on all axes
- **[2026-02-22]** Uses `useRef` for animation state (pointer position, rotation targets, rAF ID) to avoid excessive re-renders at 60Hz
- **[2026-02-22]** Implemented two-face card structure: front face (existing card content) + back face (Pokemon TCG card back image from pokemontcg.io)
- **[2026-02-22]** CSS 3D: `perspective: 900px`, `transformStyle: preserve-3d`, `backfaceVisibility: hidden` on both faces
- **[2026-02-22]** Holographic shine overlay on front face: radial gradient (white highlight) + linear gradient (rainbow using `--holo-1` through `--holo-4` palette), `mix-blend-mode: screen`, opacity proportional to tilt magnitude
- **[2026-02-22]** Spring-back animation: on release, card snaps to nearest face (0° or 180°) using lerp factor 0.08 + cubic-bezier CSS transition
- **[2026-02-22]** Dynamic box-shadow grows with tilt magnitude and includes type-colored glow during interaction
- **[2026-02-22]** Native `touchmove` listener with `{ passive: false }` to prevent page scroll while dragging card on mobile
- **[2026-02-22]** Desktop: click+drag; Mobile: touch+swipe — both supported via unified pointer tracking
- **[2026-02-22]** Sensitivity: 0.4 deg/px — full card-width swipe ≈ 140° rotation, enough to flip to back face

### Feature: 16:9 Detail Images for All Trainers
- **[2026-02-22]** Downloaded 13 landscape/wide trainer images for detail page hero banners to `public/trainers/*-detail.png`
- **[2026-02-22]** Images sourced from wallhaven.cc, 4kwallpapers.com, peakpx.com — all high-res (1920px+ wide), colorful anime/game artwork with scenic backgrounds
- **[2026-02-22]** Added `detailPicture` field to all 13 trainer entries in `src/data/trainers.js` (alongside existing `picture` for circular avatars)
- **[2026-02-22]** Updated `TrainerDetail.jsx` hero image to use `trainer.detailPicture || trainer.picture` with fallback
- **[2026-02-22]** TrainersList.jsx unchanged — continues using `trainer.picture` for circular portrait avatars
- **[2026-02-22]** Build verified: `npm run build` passes cleanly

### Feature: Replace PokeAPI Sprites with TCGdex Physical Card Scans
- **[2026-02-22]** Researched TCGdex API — identified main set as ME02 (Phantasmal Flames), confirmed `https://assets.tcgdex.net/en/me/me02/{localId}/high.png` URL pattern returns hi-res card scans with CORS support
- **[2026-02-22]** Created `src/data/tcgdex-map.js` — maps 79 card IDs to TCGdex image URLs across ME02 and 10 other sets (SV01–SV06.5, SWSH1–SWSH11, SM5, XY0)
- **[2026-02-22]** Mapping done by card name (not number) since Korean 80-card set numbering differs from ME02's 130-card English set
- **[2026-02-22]** Exported `resolveCardImage(card)` helper: returns TCGdex URL if mapped, falls back to existing PokeAPI sprite, then empty string
- **[2026-02-22]** Updated `App.jsx` (5 locations), `CardDetail.jsx` (2 locations), `TrainerDetail.jsx` (1 location) to use `resolveCardImage()` instead of `card.img`
- **[2026-02-22]** Trainer/item/stadium cards (Dawn, Jumbo Ice, Heat Burner, Sacred Charm, Ball Player, Blaine's Strategy, Dizzying Valley, Heat Burner SR) now show actual card scan images for the first time
- **[2026-02-22]** All TCGdex URLs verified: HTTP 200 with `access-control-allow-origin: *`
- **[2026-02-22]** No changes to card data files — existing `img` field in cards.prod.js serves as automatic fallback
- **[2026-02-22]** Build verified: `npm run build` passes cleanly

### Data Cleanup: Remove Korean & Japanese Text from Card Attributes
- **[2026-02-22]** Removed Korean (한글) and Japanese (ひらがな/カタカナ) text from `attack1`, `attack2`, and `ability` fields in `cards.prod.js` (69 lines) and `cards.dev.js` (6 lines)
- **[2026-02-22]** Pattern: `"ForeignText (Translation)"` → `"Translation"` — kept only the Turkish/English translation
- **[2026-02-22]** Korean: 64 cards affected across all type sections (Ot, Ateş, Su, Elektrik, Psişik, Dövüş, Karanlık, Çelik, Normal)
- **[2026-02-22]** Japanese: 5 cards affected (Arcanine, Magmar, Clefable, Sandshrew, Farfetch'd)
- **[2026-02-22]** Cards with pure English attacks (Darkrai, Iron Jugulis, Fezandipiti, Scream Tail, Pumpkaboo, Poochyena, Lampent) were already clean — no changes needed
