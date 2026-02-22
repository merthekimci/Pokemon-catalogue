# Bugs

| # | Bug | Status | Reported | Resolved | Root Cause | Correction | Related Bugs |
|---|-----|--------|----------|----------|------------|------------|--------------|
| 1 | Trainer detail page shows Pokemon sprite instead of trainer portrait | Fixed | 2026-02-22 | 2026-02-22 | `picture` field in trainers.js pointed to PokeAPI Pokemon sprites (e.g., Pikachu #25 for Ash) instead of trainer character artwork | Downloaded actual trainer artwork to `public/trainers/`, updated picture paths to local files with BASE_URL prefix | — |
| 2 | Trainer bio/lore text in English instead of Turkish | Fixed | 2026-02-22 | 2026-02-22 | `bio` and `lore` fields were originally written in English while the rest of the app UI is Turkish | Translated all 26 text blocks (13 bio + 13 lore) to Turkish | — |
