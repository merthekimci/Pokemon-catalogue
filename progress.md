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
