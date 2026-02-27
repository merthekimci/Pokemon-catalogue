# Bugs

| # | Bug | Status | Reported | Resolved | Root Cause | Correction | Related Bugs |
|---|-----|--------|----------|----------|------------|------------|--------------|
| 1 | Trainer detail page shows Pokemon sprite instead of trainer portrait | Fixed | 2026-02-22 | 2026-02-22 | `picture` field in trainers.js pointed to PokeAPI Pokemon sprites (e.g., Pikachu #25 for Ash) instead of trainer character artwork | Downloaded actual trainer artwork to `public/trainers/`, updated picture paths to local files with BASE_URL prefix | — |
| 2 | Trainer bio/lore text in English instead of Turkish | Fixed | 2026-02-22 | 2026-02-22 | `bio` and `lore` fields were originally written in English while the rest of the app UI is Turkish | Translated all 26 text blocks (13 bio + 13 lore) to Turkish | — |

## Bug #5 — Wrong Card Scan in Confirmation Dialogue + Kartlarım
**Status:** Fixed | **Date:** 2026-02-23

**Symptom:** After photo upload, the review/confirmation dialogue shows a card scan from the wrong set (e.g. SV08 Charmander instead of ME02 Charmander). Similarly, any photo-uploaded cards already saved to the catalogue show wrong-set images.

**Root Cause:** Task-25 fix removed `&set.id=me02` from the TCGdex name search to fix Bisharp (not in ME02). This caused `results[0]` to be from whatever set TCGdex returns first (often a newer SV/SWSH set), not the ME02 card the user is holding.

**Fix:** `api/analyze.js` — two-step TCGdex lookup: (1) try ME02 set first; (2) fall back to all sets only if ME02 returns nothing (for non-ME02 cards like Bisharp); (3) card-number ME02 URL as final fallback. Commit: `30aba2c`.

**Note:** Cards already saved to DB with wrong-set TCGdex URLs will still show the wrong image. Those cards need to be deleted and re-added via photo upload to pick up the corrected ME02 URL.

---

## Bug #4 — Photo Upload: Wrong Image + Card Data After Save
**Status:** Fixed | **Date:** 2026-02-23

**Symptom:** After adding a photo-uploaded card, the review modal showed correct name but wrong picture and wrong card data were saved.

**Root Cause 1 — ID collision:** `nextId = Math.max(0, ...cards.map(c => c.id)) + 1`. If `cards` was empty (server not yet loaded), `nextId = 1`. New card gets `id: 1` → `resolveCardImage` returns `tcgdexImageMap[1]` (Gloom's URL) instead of the card's own image.

**Root Cause 2 — Wrong image priority:** `resolveCardImage` did `tcgdexImageMap[card.id] || card.img` — static map always overrode dynamically fetched `card.img`.

**Root Cause 3 — TCGdex lookup too narrow:** API call hardcoded `&set.id=me02`, so non-ME02 cards (Bisharp etc.) returned empty and fell through to a wrong ME02 fallback URL.

**Fixes:**
- `src/data/tcgdex-map.js`: Swapped to `card.img || tcgdexImageMap[card.id]`
- `src/App.jsx`: Changed `id: nextId + i` → `id: Date.now() + i`; removed `nextId` prop
- `api/analyze.js`: Removed `&set.id=me02`; moved card-number fallback outside `catch`; added EN→TR type normalization for GPT-4o safety

---

## Bug #6 — Wrong Image Assigned to Photo-Imported Cards
**Status:** Fixed | **Date:** 2026-02-23 | **File:** api/analyze.js

**Symptom:** After photo upload, confirmation dialog and card detail page show the wrong Pokemon artwork — either a different variant of the same Pokemon or a card from a completely different set.

**Root Cause:** TCGdex name-based image lookup (steps 1 and 2 in analyze.js) was `results[0]` from a name search, which is unreliable — it returns whichever card TCGdex ranks first, not necessarily the ME02 card the user is holding. The card-number-based URL construction (`https://assets.tcgdex.net/en/me/me02/{cardNumber}/high.png`) was only used as a last resort despite being the most deterministic and reliable method.

**Fix:** Reordered priority in `api/analyze.js` so card-number-based ME02 URL is attempted first whenever a card number is detected from the photo. TCGdex name lookups (ME02-scoped, then global) are now fallbacks only for cases where GPT-4o fails to extract a card number.

**Related Bugs:** Bug #4 (photo upload save), Bug #5 (wrong-set card scan in confirmation)

---

## Bug #7 — 3D Card Flickers/Hesitates on First Drag After Intro Animation
**Status:** Fixed | **Date:** 2026-02-24 | **File:** src/components/CardDetail.jsx

**Symptom:** After the card detail view's intro spin animation (back → front over 1s), dragging the card causes it to flicker/jump backward before responding smoothly.

**Root Cause:** The intro animation uses a CSS transition to visually rotate from `rotY: 180` → `rotY: 0`, but the internal ref `currentRotY.current` was set to `180` during setup and never synced to `0` after the transition completed. The rAF interpolation loop doesn't run during the CSS-driven intro, so the ref stayed stale. When `handleStart` fires on first drag, it captures `startRotation.y = currentRotY.current = 180`, causing the rAF loop to lerp from 180 back toward 0 — producing a visible snap/flicker.

**Fix:** Added `currentRotY.current = 0` and `targetRotY.current = 0` in the existing `setTimeout` callback (1050ms) that fires after the CSS transition ends, syncing the refs to match the visual state before user interaction begins.

**Related Bugs:** —

---

## Bug #8 — Card Photo Upload Crashes on Large Images (3x3 Sheet)
**Status:** Fixed | **Date:** 2026-02-27 | **Files:** src/App.jsx, api/analyze.js

**Symptom:** Uploading a 3x3 card sheet photo from Android phone gallery → "Analiz Et" → loading spinner for ~1 second → error: `Unexpected token 'R', request end... not valid JSON`

**Root Cause:** Vercel serverless functions have a 4.5 MB request body limit. Phone camera photos of 3x3 card sheets are typically 5–15 MB. Base64 encoding inflates the payload ~33%, so the JSON body easily reaches 7–20 MB. Vercel rejects with HTTP 413 and a plain-text body `"Request Entity Too Large"`. The frontend then calls `res.json()` on that plain-text response (before checking `res.ok`), which throws `SyntaxError: Unexpected token 'R'` — the "R" from "Request Entity Too Large".

**Fix (3 parts):**
1. **Image compression:** Reused existing `resizeImage()` utility (was scoped inside SummaryView) — extracted to module scope and applied in `PhotoUploadModal.handleFile`. Images resized to max 1500px at JPEG 0.85 quality before upload, keeping payloads well under 4.5 MB.
2. **Safe error handling:** Changed `analyzeImage` to check `res.ok` before calling `res.json()`, catching non-JSON error responses gracefully with a Turkish error message instead of leaking SyntaxErrors.
3. **Server hardening:** Bumped `max_tokens` from 4000 to 8000 in `api/analyze.js` to accommodate 9-card responses. Added try/catch around `JSON.parse` of GPT-4o output with a friendly error if the output is malformed/truncated.

**Related Bugs:** Bug #4 (photo upload save), Bug #5 (wrong-set card scan)

---

## Bug #9 — Card Back Image Not Loading on Card Detail Page
**Status:** Fixed | **Date:** 2026-02-27 | **File:** src/components/CardDetail.jsx

**Symptom:** On the card detail page, the back face of the 3D flip card shows only a red background instead of the Pokemon card back artwork.

**Root Cause:** The hardcoded URL `https://images.pokemontcg.io/cardback.png` returns HTTP 404 — the image was removed from the pokemontcg.io S3 bucket (`x-amz-error-code: NoSuchKey`). Both desktop (line 397) and mobile (line 659) back face `<img>` tags used this dead URL with no `onError` fallback.

**Fix:** Replaced the broken URL with the official Pokemon TCG card back image: `https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg` (verified accessible, 63KB JPEG).

**Related Bugs:** Bug #1 (also an external image URL issue)

---

## Bug #10 — Card Back Image Still Not Loading (CORS Block)
**Status:** Fixed | **Date:** 2026-02-27 | **File:** src/components/CardDetail.jsx

**Symptom:** After replacing the dead pokemontcg.io URL (Bug #9), the card back image still doesn't render — only the red `#c62828` fallback background shows.

**Root Cause:** The replacement URL `https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg` returns HTTP 200, but `pokemon.com` does NOT serve `Access-Control-Allow-Origin` headers. The `<img crossOrigin="anonymous">` attribute forces the browser to make a CORS request, which gets blocked. Without `crossOrigin`, the image would load fine — but it was present on the original code.

**Fix:** Downloaded the card back image to `public/app-images/cardback.jpg` (63KB) and referenced it as a local asset via `import.meta.env.BASE_URL`. Removed `crossOrigin="anonymous"` since it's same-origin now. Applied to both desktop (line 391) and mobile (line 653) back face `<img>` tags.

**Related Bugs:** Bug #9 (same image, dead URL), Bug #1 (external image dependency)

---

## Bug #11 — Card Drag Wonky: Spins Wildly and Loses Control at Edges
**Status:** Fixed | **Date:** 2026-02-27 | **File:** src/components/CardDetail.jsx

**Symptom:** Dragging the card on the detail page from edges causes it to spin uncontrollably. On release, the card does multiple full rotations before settling back to its resting position.

**Root Cause:** The `useCardTilt` hook had no rotation clamping in `handleMove`. Sensitivity of 0.4 meant a 900px drag = 360° rotation. On release, `snapAngle` normalized modulo 360 to find the nearest face (0° or 180°), but the lerp interpolation had to traverse from the unnormalized large value (e.g., 350°) back to the snap target (e.g., 0°), causing visible multi-rotation spinning. Additionally, the slow release lerp (0.08) made the spin-back take over a second.

**Fix:** (1) Clamped `targetRotX/Y` to ±35° during drag — enough for a satisfying 3D tilt peek, impossible to flip. (2) On release, snap directly to (0, 0) instead of using `snapAngle`. (3) Removed dead `snapAngle` function. (4) Increased release lerp from 0.08 → 0.12 for snappier return.

**Related Bugs:** Bug #7 (card flicker on first drag after intro)
