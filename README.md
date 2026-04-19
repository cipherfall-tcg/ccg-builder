# CCG Builder

A browser-only balancing tool for defining set rarities, configuring pack composition, calculating expected outcomes, and exporting styled reports.

## Privacy

- No data leaves the browser.
- State is stored in localStorage only.
- Exports are generated locally in the browser.

## Files

- `index.html`: UI shell and tab layout.
- `styles.css`: neon visual system and report-page styling.
- `fraction_math.js`: pure fraction/probability math helpers (`window.CCGFractionMath`).
- `validation.js`: state validation logic (`window.CCGValidation`).
- `calculator.js`: rounding and calculation engine (`window.CCGCalculator`).
- `migration.js`: state migration and normalization (`window.CCGMigration`).
- `report_payload.js`: report payload contract and policy reference data (`window.CCGReportPayload`).
- `report_templates.js`: HTML/TXT report rendering (`window.CCGReportTemplates`).
- `app.js`: state model, rendering, events, persistence, export orchestration — wires all modules together.

## Wildcard Model

- Canonical storage is integer fractions (`n/d`) per eligible rarity.
- UI accepts fraction, decimal, or percent. On commit the user's entered text is preserved as-is; the decimal column has been removed.
- Wildcard probabilities must sum to 1.0 (within tolerance).
- Table columns: **Rarity | Pin | Numerator | Denominator | LCD | Reduced Fraction | Status**.
- **Pin column**: standalone checkbox; pinned rows are highlighted with an amber tint and left-border accent across the full row.
- **LCD column**: shows all fractions over a common denominator (LCM of all reduced denominators) for easy visual comparison. ±1 nudge buttons step by `1/LCD` and redistribute the delta proportionally among unpinned rows.
- **Reduced Fraction column**: shows the canonical reduced form of the entered value (read-only display).
- If a nudge cannot be redistributed safely, the nudge is kept and the row is marked pending-invalid until corrected.

## Export

- TXT export is plain text.
- HTML export is self-contained and embeds `styles.css` inline at save time.

## Development Notes

- No build step required.
- Open `index.html` in a browser.
- Keep report structure changes in `report_templates.js` and payload changes in `report_payload.js`.
