# CCG Builder

A browser-only balancing tool for defining set rarities, configuring pack composition, calculating expected outcomes, and exporting styled reports.

## Privacy

- No data leaves the browser.
- State is stored in localStorage only.
- Exports are generated locally in the browser.

## Files

- `index.html`: UI shell and tab layout.
- `styles.css`: neon visual system and report-page styling.
- `app.js`: state model, validation, calculator, rendering, events, persistence, export orchestration.
- `report_payload.js`: report payload contract and policy reference data.
- `report_templates.js`: HTML/TXT report rendering.

## Wildcard Model

- Canonical storage is integer fractions (`n/d`) per eligible rarity.
- UI accepts fraction, decimal, or percent; values normalize to reduced fractions on commit.
- Wildcard probabilities must sum to 1.0 (within tolerance).
- Wildcard pane includes per-row numerator/denominator nudges and pin controls.
- If a nudge cannot be redistributed safely, the nudge is kept and the row is marked pending-invalid until corrected.

## Export

- TXT export is plain text.
- HTML export is self-contained and embeds `styles.css` inline at save time.

## Development Notes

- No build step required.
- Open `index.html` in a browser.
- Keep report structure changes in `report_templates.js` and payload changes in `report_payload.js`.
