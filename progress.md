# Progress Log

## Session 10 — 2026-02-27

### Fix card back image not loading (Task #59, Bug #9)
- **Problem:** Card detail page back face shows red background instead of card back artwork during 3D flip animation
- **Root cause:** External URL `https://images.pokemontcg.io/cardback.png` returns 404 (removed from S3)
- **Fix:** Replaced with official Pokemon TCG URL `https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg` in both desktop (line 397) and mobile (line 659) of `src/components/CardDetail.jsx`
- **Modified files:** `src/components/CardDetail.jsx`

## Session 9 — 2026-02-27

### Fast per-card processing with progressive status updates (Task #58)
- **Problem:** 3x3 card sheet takes ~30-40s blocking (single GPT-4o `detail:high` call on full image). No progress feedback — just a spinner.
- **Solution:** Detect→Split→Parallel architecture. Three new endpoints + progressive client UI.
- **Phase 1 — Detect (`api/analyze-detect.js`):** Quick GPT-4o `detail:low` call (~1-2s) returns card count and grid layout `{count, rows, cols}`. Handles any card arrangement (1, 5, 7, 9 cards).
- **Phase 2 — Split (client-side):** Canvas-based crop into rows×cols cells with 4% edge inset. 600px max per cell, JPEG 0.88.
- **Phase 3 — Analyze (`api/analyze-single.js`):** Per-card GPT-4o `detail:low` endpoint (~2-4s each). Same field structure as analyze-fast. Concurrency pool of 3 on client.
- **Progressive UI:** Real-time counter "X / N kart tanımlandi" + animated progress bar + grid overlay on preview image. Cards appear as they resolve.
- **New files:** `api/analyze-detect.js`, `api/analyze-single.js`
- **Modified files:** `src/App.jsx` (added `splitGridImage`, `runWithConcurrency` utilities; rewrote `analyzeImage` and analyzing phase UI in PhotoUploadModal)
- **Expected timing:** First card at ~3-4s, all 9 done in ~12s (vs ~30-40s before)
- Build verified clean

## Session 8 — 2026-02-27

### Async two-phase card import pipeline (Task #57)
- **Problem:** Multi-card photo import blocks user 5-15s; unreliable on Vercel Free tier (10s timeout)
- **Solution:** Split into fast extract (2-4s) + background enrichment (polling)
- **Phase 1 — Fast Extract (`api/analyze-fast.js`):** Stripped-down GPT-4o prompt (essential fields only: name, type, HP, rarity, stage, cardNumber). Fast image resolution (cache + TCGdex localId match, no vision). Cards added to collection immediately.
- **Phase 2 — Background Enrich (`api/enrich.js`):** Frontend fires batched requests (2 cards/batch for 10s timeout). GPT-4o text-only for bio/lore/attacks/abilities + market price + full image resolution. Results written to `card_metadata` with `enrichment_status`.
- **Polling (`api/enrich-status.js`):** Frontend polls every 3s, merges enriched data into card state.
- **New files:** `api/analyze-fast.js`, `api/enrich.js`, `api/enrich-status.js`, `api/shared/card-utils.js`
- **Modified files:** `api/collection.js` (schema migration + enrichment_status in JOIN), `src/App.jsx` (two-phase flow, enrichment polling, visual indicators), `src/styles.css` (enrichment pulse animation)
- **DB changes:** Added `enrichment_status` and `enrichment_error` columns to `card_metadata` table
- Build verified clean

## Session 7 — 2026-02-27

### Bug fix: Card photo upload crashes on large images (Task #56)
- **Root cause:** Vercel's 4.5 MB body limit rejects large phone photos; frontend `res.json()` on plain-text 413 response causes SyntaxError
- **Fix 1:** Extracted `resizeImage()` to module scope, applied to `PhotoUploadModal.handleFile` — compresses to 1500px max JPEG 0.85
- **Fix 2:** Safe error handling in `analyzeImage` — check `res.ok` before `res.json()`
- **Fix 3:** Bumped `max_tokens` 4000→8000 in `api/analyze.js` + added try/catch around GPT output `JSON.parse`
- Build verified clean

## Session 6 — 2026-02-24

### Project file reorganization & housekeeping (Task #55)
- **Time:** 2026-02-24
- Removed `images/` directory (30 generated test PNGs, ~47MB) from git — unused by app
- Deleted `tmp/` directory (2 temp screenshots, untracked)
- Moved `pokemon-pencil-new.pen` to `design/` folder for cleaner root
- Updated `.gitignore` — added `tmp/`, `images/`, `.DS_Store`
- Updated `.dockerignore` — added `tmp`, `images`, `design`, `.DS_Store`, `.claude`, `.github`
- Verified `npm run build` succeeds with no issues

## Session 5 — 2026-02-24

### Add widget background panels to Biyografi & Hikaye (Task #54)
- **Time:** 2026-02-24
- Wrapped Biyografi and Hikaye text content in panel divs with `background: var(--bg-card)`, `border: 1px solid var(--border-dim)`, responsive borderRadius/padding
- Section titles remain outside the panels, matching the pattern used by Trainer Info and StatCard widgets
- File modified: `src/components/CardDetail.jsx`

### Fix login flash on failed phone verification (Task #53)
- **Time:** 2026-02-24
- Added `verifying` gate state to prevent app screen from rendering during phone+device verification
- Login screen now shows spinner with "Doğrulanıyor..." while API call is in flight
- On 403 (device mismatch): user stays on login screen, sees error — never sees the app
- On success: verifying clears and app renders normally

### Blue & Red theme selector (Task #52)
- **Time:** 2026-02-24
- Replaced dark/light theme options with Blue (Mavi) and Red (Kırmızı) in settings
- Blue theme: uses existing blue gradient backgrounds (bg1 for app, bg2 for login)
- Red theme: uses `pokemon-tcg-gradient-red-bg1.png` for both app and login backgrounds
- Added CSS `[data-theme="red"]` overrides for `.bg-image` and `body` background-color
- Default theme changed to "blue" across all fallback locations
- Files modified: `SettingsPage.jsx`, `styles.css`, `App.jsx`

### Restyle login error messages — brand-red bg, white bold text (Task #51 follow-up round 2)
- **[2026-02-24]** Reverted font size from 26px back to 13px (was unreadable)
- **[2026-02-24]** Changed background from pink (rgba(247,37,133,0.85)) to solid brand-red (#CC0000)
- **[2026-02-24]** Changed text color from #ff4d6d to solid white (#ffffff) with fontWeight 700

### Adjust login error message styles — bolder background & larger font (Task #51 follow-up)
- **[2026-02-24]** Increased error box background opacity from 0.1 to 0.85 (almost solid) and font size from 13px to 26px (2x)
- **[2026-02-24]** Applied to both PhoneModal validation error and device error on login screen

### Fix login screen error message styling (Task #51)
- **[2026-02-24]** Login device error and PhoneModal validation error were displayed as plain colored text (`#f72585`) with no background or border
- **[2026-02-24]** Matched both to the existing PhotoUploadModal error pattern: semi-transparent pink background (`rgba(247,37,133,0.1)`), pink border, rounded corners
- **[2026-02-24]** File: `src/App.jsx` — two inline style changes (device error ~line 1737, PhoneModal error ~line 151)

### Enable photo gallery selection on mobile (Task #50)
- **[2026-02-24]** Root cause: `capture="environment"` on the file input forced mobile browsers (especially iOS Safari) to open the camera directly, bypassing the native picker
- **[2026-02-24]** Fix: removed `capture="environment"` attribute from `<input>` in PhotoUploadModal. `accept="image/*"` alone shows the native picker with both Camera and Photo Library options
- **[2026-02-24]** File: `src/App.jsx` line 609 — single attribute removal

### Global Card Metadata Separation (Task #48)
- **[2026-02-24]** Created `card_metadata` table (card_number PK, hp, rarity, retreat, damage, img, market_value, original JSONB, translations JSONB) — global card data shared across all collectors
- **[2026-02-24]** Created `collection_cards` table (phone + card_number unique, collector_id, copies, trainer, added_at) — per-collector ownership references
- **[2026-02-24]** Added cache layer to `api/analyze.js`: queries `card_metadata` before calling GPT-4o image resolution + price lookup. Cache hit → instant return. Cache miss → full pipeline then upserts metadata for future use
- **[2026-02-24]** Refactored `GET /api/collection`: JOINs `collection_cards` with `card_metadata` to assemble cards array, falls back to JSONB for pre-migration data
- **[2026-02-24]** Refactored `POST /api/collection`: accepts `catalogue` array (ownership-only data), upserts to `collection_cards`, preserves backward compat with `cards` JSONB
- **[2026-02-24]** Updated frontend debounced save (`App.jsx`) to send `catalogue` array instead of full card objects
- **[2026-02-24]** Created `api/migrate-cards.js` — one-time migration endpoint to backfill both tables from existing JSONB data (protected by MIGRATE_SECRET header)
- **[2026-02-24]** Files modified: `api/collection.js`, `api/analyze.js`, `src/App.jsx`. New file: `api/migrate-cards.js`

### Redirect to KOLEKSİYONUM after login (Task #47)
- **[2026-02-24]** Added `useNavigate()` to `App` component and `navigate("/ozet")` in login PhoneModal callback
- **[2026-02-24]** After entering phone number, users now land on the collection summary page instead of the card catalogue
- **[2026-02-24]** File: `src/App.jsx` — 2 lines changed

### Fix: 3D Card Drag Flicker After Intro Animation (Task #46, Bug #7)
- **[2026-02-24]** Root cause: `currentRotY.current` ref stayed at `180` after CSS transition animated card to `0°`, causing drag to lerp from wrong position
- **[2026-02-24]** Fix: sync `currentRotY.current = 0` in the post-intro `setTimeout` callback (1050ms) in `useCardTilt` hook
- **[2026-02-24]** File: `src/components/CardDetail.jsx` line 140

### Apply dark navy style to all widgets app-wide (Task #45)
- **[2026-02-24]** Updated CSS custom properties: `--bg-card`, `--bg-surface`, `--bg-elevated`, `--bg-glass` from transparent white to dark navy (`rgba(20,30,60,0.88-0.94)`)
- **[2026-02-24]** Bumped `--border-dim` and `--border-subtle` for better contrast on dark panels
- **[2026-02-24]** Brightened `--text-muted` from 55% to 75% white for readability
- **[2026-02-24]** Updated `.modal-content`, `.poke-card`, `.glass`, `.review-card-row` CSS classes to match
- **[2026-02-24]** Removed PhoneModal inline overrides (now uses shared `.modal-content` style)
- **[2026-02-24]** All widgets (settings panels, card detail stats, trainer pages, modals, grid cards) now consistent

### Theme Redesign: Dark Holo → Pokemon TCG Blue Gradient (Task #38)
- **[2026-02-24]** Replaced Google Fonts: Rajdhani + DM Sans → Fredoka (headings) + Nunito (body) for a fun, comic-style Pokemon TCG feel
- **[2026-02-24]** New color palette: Pokemon Yellow (#FFCB05) as primary CTA/accent, Pokemon Blue (#2A75BB) for links, Pokemon Red (#CC0000) for danger, Navy (#1A3F6F) for deep backgrounds
- **[2026-02-24]** Background: full-page `pokemon-tcg-gradient-blue-bg1.png` with `background-attachment: fixed` and #1A3F6F fallback
- **[2026-02-24]** All surface colors converted to semi-transparent white (frosted glass) for cards, modals, inputs, buttons
- **[2026-02-24]** Updated `:root` CSS custom properties, removed `[data-theme="light"]` override block (single theme now)
- **[2026-02-24]** Updated all inline styles across App.jsx, CardDetail.jsx, TrainerDetail.jsx, TrainersList.jsx, SettingsPage.jsx — fonts, accent colors, hardcoded backgrounds
- **[2026-02-24]** Added CSS font migration shim to catch any remaining inline font-family references
- **[2026-02-24]** Build verified: `npm run build` passes cleanly

### Login page background: Switch to bg2 image (Task #44)
- **[2026-02-24]** Changed login/phone entry screen background from `pokemon-tcg-gradient-blue-bg1.png` to `pokemon-tcg-gradient-blue-bg2.png`

### Fix: Background image not rendering — use fixed div instead of body bg (Task #41)
- **[2026-02-24]** Root cause: `background-attachment: fixed` on `body` is broken on mobile Safari/iOS WebKit
- **[2026-02-24]** Moved background image from `body` CSS to a `<div className="bg-image" />` with `position: fixed; inset: 0; z-index: -1`
- **[2026-02-24]** Added div as first child in App root, works on all browsers
- **[2026-02-24]** Build verified

### Fix: Remove all background filters/overlays (Task #40)
- **[2026-02-24]** Removed grain texture overlay div and CSS rule entirely
- **[2026-02-24]** Removed radial-gradient color overlay div from App root
- **[2026-02-24]** Removed all `backdrop-filter: blur()` from glass, poke-card, header, control bar, modal-content, tab bar
- **[2026-02-24]** Kept modal-overlay blur (intentional dimming for focus)
- **[2026-02-24]** Build verified

### Fix: Background Visibility + Font Change (Task #39)
- **[2026-02-24]** Header/control bar/tab bar backgrounds changed from opaque navy `rgba(26,63,111,...)` to light frosted glass `rgba(255,255,255,0.12)` so blue gradient shows through
- **[2026-02-24]** Fonts changed from Fredoka + Nunito to **Bangers** (headings) + **Comic Neue** (body) per user preference
- **[2026-02-24]** Updated font migration CSS shim to cover all 4 old font names (DM Sans, Rajdhani, Fredoka, Nunito)
- **[2026-02-24]** Build verified

### Feature: Collector's Portrait Widget (Task #37)
- **[2026-02-24]** Created `api/portrait.js` — Vercel serverless function calling OpenAI `gpt-image-1` Images API for anime-style portrait conversion (60s maxDuration)
- **[2026-02-24]** Updated `api/collection.js` — added `portrait TEXT` column migration, included in GET SELECT and POST UPSERT (conditional update to avoid overwriting on non-portrait syncs)
- **[2026-02-24]** Added portrait state to `App.jsx` with `portraitDirtyRef` optimization to avoid sending large base64 on every card sync
- **[2026-02-24]** Built portrait widget in `SummaryView` with 3 states: empty (tap to upload), loading (anime conversion in progress), portrait (full-width square image with remove button)
- **[2026-02-24]** Client-side image resize to 512x512 JPEG before upload to control payload size
- **[2026-02-24]** Added `@keyframes pulse` animation to `styles.css` for loading state
- **[2026-02-24]** Build verified: `npm run build` passes cleanly

## Session 4 — 2026-02-23

### UI: Settings Page Polish — Pokeball Icon + Phone Number Styling (Task #35)
- **[2026-02-23]** Replaced 👤 emoji with inline SVG Pokeball icon in the owner name input, uses theme CSS vars
- **[2026-02-23]** Added "Telefon Numarası" label above phone number display, matching "Cihaz ID" label style
- **[2026-02-23]** Restyled phone number to match Device ID textbox (monospace, elevated bg, rounded, selectable), with green checkmark inline

### UI: Display Device ID on Settings Page (Task #34)
- **[2026-02-23]** Passed `deviceId={getDeviceId()}` prop from `App.jsx` to `SettingsPage`
- **[2026-02-23]** Added read-only device ID display in Cloud Sync section, above phone number — monospace font, selectable text, "Cihaz ID" label

### Security: Device ID Binding for Phone Numbers (Task #33)
- **[2026-02-23]** Added `getDeviceId()` helper in `App.jsx` — generates a UUID via `crypto.randomUUID()` on first visit, persists in localStorage key `pokemon_katalog_device_id`
- **[2026-02-23]** Client sends `device_id` with both GET (`?device_id=...` query param) and POST (JSON body field) collection API calls
- **[2026-02-23]** Server (`api/collection.js`): idempotent schema migration adds `device_id TEXT` column to `collections` table
- **[2026-02-23]** GET endpoint: after fetching row, if `row.device_id` exists and differs from request's `device_id`, returns `403 { error: "device_mismatch" }`
- **[2026-02-23]** POST endpoint: pre-check SELECT before upsert, returns `403` on device mismatch; uses `COALESCE(collections.device_id, EXCLUDED.device_id)` to never overwrite an existing binding
- **[2026-02-23]** Client handles 403: clears phone, shows Turkish error "Bu numara başka bir cihaza bağlı" on onboarding screen
- **[2026-02-23]** `SyncIndicator` extended with `device_error` status for POST mismatch feedback
- **[2026-02-23]** Legacy rows without `device_id` get backfilled on their next POST save
- **[2026-02-23]** Build verified: `npm run build` passes cleanly

### UI: Light Theme Onboarding Screen (Task #32)
- **[2026-02-23]** Redesigned onboarding screen: light background (`#f0f0f5`), `data-theme="light"` on wrapper
- **[2026-02-23]** Added Pokemon TCG logo (160px) and app name "Pokemon Kart Katalogu" above the modal
- **[2026-02-23]** Updated PhoneModal to skip `modal-overlay` wrapper when `allowClose={false}` (renders card directly on light bg)
- **[2026-02-23]** Updated copy: title "Haydi Baslayalim!", description about creating/loading collections, CTA "Basla"

### Feature: Mandatory Phone Number Onboarding (Task #31)
- **[2026-02-23]** Added `allowClose` prop to `PhoneModal` component (default `true`). When `false`: hides Cancel button, changes title to "Hoş Geldiniz!", changes subtitle to onboarding-friendly text, changes button label to "Giriş Yap"
- **[2026-02-23]** Added early return gate in `App()` — if `phone` is empty, renders full-screen onboarding view with `PhoneModal allowClose={false}` instead of app routes. No navigation, no content visible until phone is entered
- **[2026-02-23]** Removed dead empty-state "Koleksiyonunuz henüz bağlı değil" block from `catalogueContent` (unreachable now that the phone gate prevents reaching the catalogue without a phone)
- **[2026-02-23]** Returning users who re-enter their phone number get their existing collection restored (phone is DB primary key)
- **[2026-02-23]** No SMS/OTP verification — phone number is entered directly, same validation as before (`5XX XXX XX XX` format)
- **[2026-02-23]** Build verified: `npm run build` passes cleanly

## Session 3 — 2026-02-23

### Feature: Pokeball Favicon + OG Social Sharing Tags (Task #30)
- **[2026-02-23]** Created `public/favicon.svg` — clean Pokeball SVG (red/white halves, black divider, center button) replacing inline emoji favicon
- **[2026-02-23]** Added `<link rel="apple-touch-icon">` pointing to existing Pokemon TCG logo for iOS home screen
- **[2026-02-23]** Added `<meta name="description">` and `<meta name="theme-color">` for SEO and mobile browser theming
- **[2026-02-23]** Added full Open Graph tags (`og:type`, `og:title`, `og:description`, `og:image`) using TCG logo as share thumbnail
- **[2026-02-23]** Added Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) for Twitter/X link previews
- **[2026-02-23]** All meta tags use Turkish descriptions matching the app's language

### Feature: Card Add Date Tracking + Sort by Date Added (Task #27)
- **[2026-02-23]** Added `addedAt` ISO timestamp field to all 90 cards in `cards.prod.js` and 8 cards in `cards.dev.js` (backfilled with `"2025-01-01T00:00:00.000Z"`)
- **[2026-02-23]** `confirmAdd()` in PhotoUploadModal now stamps each new card with `addedAt: new Date().toISOString()` at confirmation time
- **[2026-02-23]** Added "Eklenme Tarihi" option to sort dropdown; sort logic handles missing `addedAt` gracefully (epoch 0 fallback)

## Session 2 — 2026-02-22

### Feature: Bilingual Card Schema + TCGdex Name-Based Image Lookup (Task #24)
- **[2026-02-22]** Redesigned card data schema: renamed `kartNo→cardNumber`, `dmg1→damage1`, `dmg2→damage2`, removed `nameEN`
- **[2026-02-22]** Added `original{}` object on each card to store raw card text as printed (Korean/English)
- **[2026-02-22]** Added `translations.en{}` and `translations.tr{}` to each card for bilingual display
- **[2026-02-22]** Added `tCard()`, `cardNum()`, `cardDmg()` helper functions in App.jsx and CardDetail.jsx for backward-compatible field access (old server cards with flat fields continue to work)
- **[2026-02-22]** Rewrote GPT-4o prompt in api/analyze.js to return structured `original` + `translations.en` + `translations.tr` objects; type/stage mapping now only in `translations.tr`, keeping `original.type` as English energy label
- **[2026-02-22]** Added TCGdex API name-based image lookup in api/analyze.js: after GPT-4o extracts card name, queries `tcgdex.net/v2/en/cards?name={enName}&set.id=me02` to get accurate image URL
- **[2026-02-22]** Updated PhotoUploadModal review form: shows original name (read-only), separate TR/EN name fields, TR type/stage selectors
- **[2026-02-22]** Wrapped `bio`/`lore` in `translations.tr` for all 13 trainers; added empty `translations.en` ready for future content
- **[2026-02-22]** Build: zero errors. Committed bca65f2 and pushed to main.

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

### Feature: Add Server-Side PostgreSQL Collection Storage
- **[2026-02-22]** Added `@vercel/postgres` dependency to `package.json` for server-side collection persistence
- **[2026-02-22]** Created `api/collection.js` — Vercel serverless function exposing GET (load collection by phone) and POST (upsert collection by phone) endpoints; phone number used as row key in Postgres table
- **[2026-02-22]** Removed localStorage as collection data source; Vercel Postgres is now the single source of truth for all collection data
- **[2026-02-22]** Added `PhoneModal` sub-component to `App.jsx` — modal prompts user for Turkish mobile phone number on first launch; validates format (5XX XXX XX XX, no leading 0) before allowing access
- **[2026-02-22]** Added `SyncIndicator` sub-component to `App.jsx` — displays real-time sync state (loading / syncing / synced / error) in the app header so users know when data is being saved to the server
- **[2026-02-22]** App now starts blank with no cards shown until a valid phone number is entered and collection is fetched from server
- **[2026-02-22]** Implemented Turkish mobile phone validation: accepts `5XX XXX XX XX` format, strips spaces, prepends `+90`, rejects numbers starting with 0 or invalid prefix
- **[2026-02-22]** Debounced auto-sync (3 s delay) triggers a POST to `api/collection.js` on any collection change, preventing excessive API calls during rapid edits
- **[2026-02-22]** All views (Kartlarım, Özet, Egitmenler, Kart Detay) updated to gracefully handle empty/loading/no-phone states with appropriate placeholder UI
- **[2026-02-22]** Disconnect phone option added — clears phone number and all in-memory collection state immediately, returning app to blank/unauthenticated state
- **[2026-02-22]** Updated `src/components/SettingsPage.jsx` with a cloud sync section: displays connected phone number, sync status badge, manual sync button, and disconnect option

## 2026-02-23

### Fix photo upload save bug
- Diagnosed 3 root causes for why photo-uploaded cards showed correct data in review but wrong image/data after saving
- Fixed `resolveCardImage` priority (`card.img` now wins over static map)
- Replaced `nextId`-based ID assignment with `Date.now()+i` to prevent ID collisions when cards haven't loaded from server
- Removed `&set.id=me02` restriction from TCGdex API lookup — now searches all sets
- Moved card-number fallback from inside `catch` to normal flow (now triggers on empty results too)
- Added EN→TR type normalization safety net in `analyze.js`
- Build: ✅ clean | Committed & pushed

### 2026-02-23 — Deduplicate Cards on Import
- Added `mergeNewCards()` helper function to `src/App.jsx`
- Modified `onAdd` callback in PhotoUploadModal to detect existing cards by card number
- When importing a card that already exists, the existing card's `copies` count is incremented instead of creating a duplicate record
- Handles intra-batch duplicates and cards with missing card numbers

### 2026-02-23 — Auto-Fetch Market Value on Card Import (Task #36)
- Added `fetchMarketPrice()` helper to `api/analyze.js` — queries pokemontcg.io API by English card name, matches by card number, extracts TCGplayer `market` price (USD)
- Extracted inline image resolution logic into `resolveImage()` helper function (refactor, no logic change)
- Integrated parallel execution: `resolveImage()` and `fetchMarketPrice()` now run concurrently via `Promise.all` — no added latency
- Price lookup checks variants in priority order: holofoil > reverseHolofoil > normal > 1stEditionHolofoil > 1stEditionNormal
- Falls back to `mid` price if `market` is null; returns 0 on any failure (network error, no match, rate limit)
- Frontend unchanged — `marketValue` was already supported in review form, card tiles, collection stats, and sorting
- No new dependencies — uses native `fetch` to call `https://api.pokemontcg.io/v2/cards`
- Free tier: 100 requests/day without API key (sufficient for personal collection use)
- Build verified: `npm run build` passes cleanly

### Restore TCG Logo on Login/Onboarding Page (Task #43)
- **[2026-02-24]** Restored original Pokemon TCG logo image on the login/splash screen (phone-entry page)
- **[2026-02-24]** All other screens retain the Pokeball SVG icon

### Replace TCG Logo with Pokeball SVG (Task #42)
- **[2026-02-24]** Created `src/components/PokeballIcon.jsx` — inline SVG Pokeball component (classic red/white design)
- **[2026-02-24]** Replaced all `TCG_LOGO` image references across 4 files: `App.jsx`, `CardDetail.jsx`, `TrainersList.jsx`, `SettingsPage.jsx`
- **[2026-02-24]** Renamed catalogue header title from "Pokemon Kart Kataloğu" → "Kartlarım"
- **[2026-02-24]** Screens updated: catalogue header, summary, add-modal, empty state, login/splash, card detail, trainers list, settings
- **[2026-02-24]** Build verified: `npm run build` passes cleanly

### 2026-02-23 — Fix Wrong Image on Photo-Imported Cards (Bug #6)
- Fixed bug where photo-imported cards displayed wrong image in confirmation dialog and card detail page
- Root cause: `analyze.js` TCGdex name lookup priority overrode reliable card-number-based URL — `results[0]` from a name search is non-deterministic and often returned a different set variant
- Fix: card-number-based ME02 URL (`https://assets.tcgdex.net/en/me/me02/{cardNumber}/high.png`) now tried first; TCGdex name lookups are now fallbacks only for when GPT-4o does not detect a card number
- Committed and pushed to main

### 2026-02-24 — Make KART EKLE button 1.2x larger
- Added `transform: "scale(1.2)"` to the "Kart Ekle" button inline style in `src/App.jsx`
- Single-line change to the bottom tab bar navigation button
