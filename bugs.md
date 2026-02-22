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
