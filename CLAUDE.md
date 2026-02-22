# CLAUDE.md — Pokemon Catalogue

## Project Overview
A Turkish-language Pokemon TCG (Trading Card Game) collection manager. Single-page React app that tracks a personal physical card collection from a Korean-print Pokemon TCG set. UI is in Turkish; card data uses a mix of Turkish, Korean, and English text.

## Tech Stack
- **Framework:** React 18.3 (no Next.js, no SSR)
- **Bundler:** Vite 6
- **Routing:** react-router-dom 7
- **Language:** JavaScript + JSX — no TypeScript
- **Styling:** Plain CSS (`src/styles.css`) + inline `style={{}}` props
- **State:** React `useState` + `useMemo` — no external state library
- **Persistence:** `localStorage` (key: `pokemon_katalog_cards`)
- **AI:** OpenAI GPT-4o via Vercel serverless function (`api/analyze.js`)
- **Images:** PokeAPI official artwork sprites
- **Fonts:** Google Fonts — Rajdhani (headings) + DM Sans (body)

## Project Structure
```
src/
  App.jsx              # Main app — contains all card data, sub-components, and logic (~615 lines)
  main.jsx             # React entry point
  styles.css           # Global CSS with custom properties
  components/
    TrainerDetail.jsx   # Trainer profile detail page
  data/
    trainers.js         # Static trainer lore/profile data
api/
  analyze.js            # Vercel serverless function: image → card OCR via GPT-4o
```
Note: The app is largely monolithic — `App.jsx` holds inline sub-components (`TypeBadge`, `RarityBadge`, `CardTile`, `CompareView`, `AddModal`, etc.) and the full `initialCards` dataset (~100 cards).

## Development Commands
```bash
npm run dev       # Vite dev server at localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview built output
npm run serve     # Build + preview on 0.0.0.0:8080 (for Docker/Cloud Run)
```

## Code Conventions
- **No TypeScript.** Pure JS/JSX everywhere. Do not introduce `.ts`/`.tsx` files.
- **Functional components only** with React hooks.
- **Sub-components** are defined in the same file as their parent (currently all in `App.jsx`).
- **No test framework** — no Jest, Vitest, or Cypress configured.
- **No linter config** — no ESLint or Prettier setup.
- **No prop-types** or type annotations.

## Styling Rules
- **Theme:** "Holographic Collector" — dark background (`#07060b`), neon/holographic accent palette
- **CSS custom properties** defined in `styles.css` (e.g., `--bg-deep`, `--accent`, `--holo-1` through `--holo-4`)
- **Reusable CSS classes:** `.poke-card`, `.btn-glow`, `.btn-accent`, `.holo-input`, `.holo-select`, `.modal-overlay`, `.type-chip`, `.glass`
- **Component-specific styles** use inline `style={{}}` objects
- **No Tailwind, no CSS Modules, no styled-components**

## Data Layer
- Card data is hardcoded in `initialCards` array inside `App.jsx`
- On first load, cards are saved to `localStorage`; subsequent loads read from there
- Trainer lore lives in `src/data/trainers.js`
- No backend database — everything is client-side

## API / Serverless
- `api/analyze.js` — Vercel serverless function that accepts a card image and uses GPT-4o to extract card details
- Requires `OPENAI_API_KEY` environment variable set in Vercel
- Only works when deployed to Vercel (not on GitHub Pages or Cloud Run)
- Dev proxy configured in `vite.config.js`: `/api` → `http://localhost:3000`

## Deployment
- **Vercel (primary):** Deploy after every push. Serverless functions work here.
- **GitHub Pages (CI/CD):** `.github/workflows/deploy.yml` auto-deploys on push to `main`. Vite `base` adjusts to `/Pokemon-catalogue/` for GH Pages.
- **Cloud Run (Dockerfile ready):** Multi-stage build (Node → nginx). Config in `Dockerfile` + `nginx.conf`.

## Workflow Rules
After every task (feature, bugfix, or other):
1. Record task in `tasks.md` before starting (status, begin/end datetime, human owner)
2. Execute the task
3. Log any bugs in `bugs.md` with status, datetime, root cause analysis, correction approach
4. Update `progress.md` with timestamped activity
5. Update `README.md` if the task is feature-related
6. Commit and push to `main`
7. Deploy to Vercel production

## Documentation Files
| File | Purpose |
|------|---------|
| `progress.md` | Timestamped session log of all activities |
| `tasks.md` | Task tracker with status, dates, and owner |
| `bugs.md` | Bug log with root cause analysis |
| `README.md` | Project overview, setup, deploy instructions (Turkish) |

## Git Notes
- `.gitignore` only contains `.vercel` and `.env.local`
- `node_modules/` is NOT in `.gitignore` — add it if committing fresh
- Never commit `.env.local` or API keys
