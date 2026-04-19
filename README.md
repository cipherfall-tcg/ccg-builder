# CCG Builder

CCG Builder is a browser-only balancing tool for defining sets, composing packs, tuning wildcard distribution, calculating run outcomes, and exporting reports.

## Runtime Model

- Static HTML/CSS/JS only. No server, no build step.
- Canonical app state persists in localStorage (`rcpc.packcalc.state`).
- Undo/redo history is retained in-memory with persisted state snapshots.
- Calculation, validation, and rendering are coordinated by `app.js`.

## Privacy, Notices, and License Gate

- No app data is transmitted by the tool.
- Privacy and local-storage notices are dismissible and restorable from Action Stack.
- A blocking license overlay is shown until the user confirms personal use.
- Commercial-license mailto is centralized and reused by both the overlay and footer link.

## Code Modules

- `index.html`: app shell, tab layout, notices, and panel structure.
- `styles.css`: neon visual system, component styling, report preview styles.
- `fraction_math.js` (`window.CCGFractionMath`): fraction parsing/normalization/math utilities.
- `validation.js` (`window.CCGValidation`): state validation engine.
- `calculator.js` (`window.CCGCalculator`): run calculations and rounding policies.
- `migration.js` (`window.CCGMigration`): schema migration and normalization.
- `report_payload.js` (`window.CCGReportPayload`): report contract assembly.
- `report_templates.js` (`window.CCGReportTemplates`): HTML/TXT report rendering.
- `app.js`: orchestration, event wiring, persistence, and cross-module integration.

## Rarity Colors

- Each rarity has a `colorId` from a pre-selected 16-color, theme-safe palette.
- New rarities auto-select the most distinct available palette color in the active set.
- Color is editable in Set Editor via dropdown.
- Rarity color tint is applied anywhere that rarity appears (set rows, pack tiles, wildcard rows, calculator internals, etc.).

## Wildcard System

- Fraction-first model with canonical `n/d` storage and strict sum-to-1 behavior.
- Wildcard table columns: **Rarity | Pin | Fraction | LCD | Reduced Fraction | Status**.
- Fraction displays are stacked (numerator over denominator) and include percent labels.
- Pinning protects rows from redistribution and visually highlights the full row.
- LCD nudges and numerator/denominator nudges redistribute across eligible unpinned rows.
- Redistribution validation accounts for both pinned and unpinned rows in total checks.

## Rules Tab

- Priority rules support up/down reorder controls.
- Reorder motion is animated.
- Group tags are shown as `Choice 1` and `Choice 2` with distinct visual highlighting.
- Rule descriptions are expanded (up to 3 sentences) to describe impact/tradeoffs.

## Files and Export Flow

- Files tab is split into guided steps: filename, optional folder pinning, config IO, format select, export.
- Files panel shows explicit pass/fail notices for local mode and full file mode.
- Summary preview includes a direct action to jump to Files tab for export.
- Export supports HTML, TXT, JSON.
- HTML export is self-contained: CSS is inlined from `styles.css`.

## Development Notes

- Open `index.html` directly in a browser.
- Keep payload schema changes in `report_payload.js` and presentation changes in `report_templates.js`.
- If UI behavior changes, update `requirements.md` and `DATAFLOW.md` in the same change.
