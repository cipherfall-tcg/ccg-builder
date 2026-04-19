# Requirements

## 1. Architecture

1. The tool must be a static client-side application (HTML, CSS, vanilla JS). No build step, no server, no backend.
2. State must be persisted to `localStorage` automatically after every mutation (`rcpc.packcalc.state`).
3. Report payload construction must live in `report_payload.js`, exposed as `window.CCGReportPayload`.
4. Report rendering (HTML/TXT output) must live in `report_templates.js`, exposed as `window.CCGReportTemplates`.
5. `app.js` must act as orchestrator only — it delegates payload and template work to the above modules with a defined context contract.
6. All user-visible text injected into the DOM must be HTML-escaped before insertion.

---

## 2. Privacy and UI Notices

1. The app must display a persistent privacy notice banner in the header on first load.
2. The banner must inform the user that no data ever leaves the browser.
3. Users must be able to dismiss the banner via a button.
4. Banner dismissal must be persisted to `localStorage` (`rcpc.packcalc.privacyNoticeDismissed`) so it does not reappear after reload.
5. The Welcome tab must also contain a written privacy notice, independent of the dismissible banner.

---

## 3. Visual Design

1. The UI must use the neon arcana aesthetic defined in `docs/aesthetics.md` — void-black background, cyan/magenta/amber accent palette, scan-line overlay, Orbitron display font, Share Tech Mono for monospace.
2. Status indicator classes (`ok`, `warn`, `error`, `pending`) must use the defined color tokens for consistent visual language.
3. Error fields must animate a glow pulse (`error-pulse`) when jumped to from the error summary.
4. The exported HTML report must embed all CSS inline at save time so it is fully self-contained — no external stylesheet reference.

---

## 4. Hard Limits and Constants

| Constant | Value | Meaning |
|---|---|---|
| `MAX_RARITY_COUNT` | 127 | Maximum rarities per set |
| `HISTORY_LIMIT` | 50 | Maximum undo/redo steps retained |
| `MAX_JSON_BYTES` | 5 MB | Max config file or paste size (UTF-8 bytes) |
| `FRACTION_DENOM_CAP` | 9999 | Max denominator tried during fraction approximation |
| `TOLERANCE` | 1e-9 | Floating-point equality threshold |
| `cards per pack` | 1–15 | Hard validation bounds |
| `packsPerBox` | ≥ 1 | Hard minimum; 6–36 is soft recommended range (warning only) |
| `boxesPerCarton` | ≥ 1 | Hard minimum; 2–6 is soft recommended range (warning only) |

---

## 5. Default Values

| Field | Default |
|---|---|
| `cardsPerPack` | 10 |
| `packsPerBox` | 36 |
| `boxesPerCarton` | 6 |
| `run.packs` | 216 |
| `run.roundingPolicy` | `exact` |
| `wildcardInputs[id]` | `"0/1"` |
| `probInputMode` | `"fraction"` (locked; cannot be changed by user) |

---

## 6. Multi-Set and Multi-Pack Model

1. The app must support multiple named sets, each with its own rarity table.
2. The app must support multiple named pack definitions, each associated with a set.
3. Only one set and one pack can be actively edited at a time.
4. The minimum number of sets is 1; removing the last set must be blocked.
5. The minimum number of packs is 1; removing the last pack must be blocked.
6. When a set is removed, any pack associated with that set must be reassigned to the first remaining set.
7. When a rarity is deleted, its slot assignments in the pack plan must be cleared and its `packCriteria` and `wildcardInputs` entries must be deleted.
8. Packs can be copied to a new pack targeting a different set. During copy, slot plan entries and pack criteria must be remapped by matching rarity shortcodes between source and target set (shortcodes are normalized to uppercase for matching). Unmatched slots become unassigned.

---

## 7. Set Editor Validation

1. Set name is required (blocking error).
2. Total card count must be ≥ 1 (blocking error).
3. Every rarity must have a name and a shortcode (blocking errors).
4. Shortcodes must be unique within a set (case-insensitive comparison, normalized to uppercase; blocking error).
5. Every rarity must have a set card count ≥ 1 (blocking error).
6. Sum of all rarity set card counts must equal the declared total card count (blocking error, only checked when total ≥ 1).
7. Rarity count must not exceed 127 (blocking error).

---

## 8. Pack Editor Validation

1. The pack must be associated to a set before calculating (blocking error).
2. All pack slots must be assigned (no empty/unassigned slots; blocking error — reports first unassigned index).
3. Total slot count must equal `cardsPerPack` (blocking error).
4. `cardsPerPack` must be 1–15 (blocking error).
5. `packsPerBox` and `boxesPerCarton` must be ≥ 1 (blocking error).
6. `packsPerBox` outside 6–36 generates a non-blocking warning.
7. `boxesPerCarton` outside 2–6 generates a non-blocking warning.
8. `minCopies` and `overrideMin` in pack criteria must not be negative (blocking errors).
9. Pack slot plan is kept sorted by rarity order (matching set rarity array order), wildcards after fixed slots, unassigned last.

---

## 9. Wildcard System

### Eligibility
1. Rarities must be explicitly marked wildcard-eligible before they appear in the probability table.
2. If wildcard slots exist in the pack but no eligible rarities are set, it is a blocking error.

### Input Format
1. The wildcard input mode is fixed to fraction-first. The `probInputMode` selector is disabled in the UI.
2. Inputs accept: integer fraction `a/b`, decimal (e.g. `0.25`), or percent (e.g. `25%`).
3. Values entered as decimal > 1 are interpreted as percent (e.g. `25` → `0.25`).
4. On blur, if the input is valid the dirty flag is cleared but the entered fraction is **not** reduced or rewritten — the user's exact text is preserved in the numerator/denominator fields.
5. Decimals and percents entered by the user are accepted as input but the stored value is their exact typed text; the reduced form is shown separately in the Reduced Fraction display column.
6. During typing, values are stored as-is and marked dirty (pending state). The running total updates live.
7. Fractions must have non-negative integer numerator and denominator; denominator cannot be zero; value must be ≤ 1.
8. The decimal display column has been removed. Probability is shown exclusively in fraction form.

### Sum Constraint
1. Probabilities across all eligible rarities must sum to 1.0 within TOLERANCE (1e-9; blocking error if violated).
2. A live running total is displayed while editing, showing the current sum and remainder.

### Pending States
1. A row with a dirty (in-progress) value shows a "Pending" status cell.
2. A row with an invalid value after commit, or one that failed redistribution, shows "Pending-invalid".
3. Validation only blocks calculation on blur or explicit recalculate — not while typing.

### Table Column Layout
The wildcard table columns are, in order: **Rarity | Pin | Numerator | Denominator | LCD | Reduced Fraction | Status**.

### Numerator/Denominator Controls
1. Each eligible rarity row has separate numerator and denominator plain-text inputs.
2. These fields have no nudge buttons. The user types values directly; the displayed LCD and Reduced Fraction columns update on commit.

### LCD Column
1. The Least Common Denominator (LCD) is computed across all currently valid eligible rows: the LCM of all reduced denominators.
2. Each row shows its probability expressed as `numerator/LCD`, giving a uniform denominator so all rows can be visually compared at a glance.
3. The ±1 nudge buttons in the LCD column adjust the row's LCD-numerator by 1 step (i.e. the probability changes by exactly `1/LCD`).
4. After a nudge the app redistributes the probability delta proportionally among all unpinned eligible rows to preserve sum=1.
5. If the nudge would push the row outside [0, 1] before redistribution, it is blocked with a toast.

### Pin Controls
1. Each eligible rarity row has a dedicated **Pin** column containing a checkbox.
2. When a row is pinned, the entire table row receives an amber background tint and a left-border accent to make the pinned state visually prominent at a glance.
3. Pinned rows are excluded from redistribution when other rows are nudged.
4. Nudging a pinned row is blocked; a toast is shown.

### Redistribution Algorithm
1. When a target row increases probability by delta, the delta is deducted from unpinned donor rows proportionally to their current probability values.
2. When a target row decreases probability by delta, the delta is distributed to unpinned donor rows proportionally to their available room (1 − current probability).
3. A final rebalance pass corrects any floating-point remainder, applied to the first donor.
4. If redistribution is mathematically impossible (no donors, insufficient donor mass, no room), the nudge remains applied to the target row, the row is marked pending-invalid, and a toast notification informs the user of the specific reason.
5. After successful redistribution, all adjusted rows are normalized to reduced fractions internally (stored as canonical `n/d`), their dirty/pending-invalid flags are cleared, and the LCD and Reduced Fraction display columns update.

### Snap to Tolerance
1. "Snap to Tolerance" adjusts the highest-probability eligible row by the current sum remainder to force the total exactly to 1.0.
2. If the adjustment would push the target row outside [0, 1], the snap is blocked with an alert.

### Reset Wildcards
1. "Reset Wildcards" sets all eligible rarity inputs to `0/1` and clears all dirty and pending-invalid flags.

---

## 10. Calculation Engine

### Rounding Policies
1. **Exact** (default): Each eligible rarity gets `floor(prob × wildcardCardsTotal)` cards. Remaining cards (to reach the exact total) are distributed one-by-one to the rows with the largest fractional remainders.
2. **Drift**: Each row gets `round(prob × wildcardCardsTotal)`. Any integer deviation from the exact total is then corrected via the same fractional-remainder sort.
3. **Strict**: Starts from Exact result, then enforces per-rarity minimum bounds by transferring cards from high-rounded donors to under-minimum recipients (sorted by rounded count descending as donors).

### Per-Card Override Mode
1. When enabled, strict policy uses `overrideMin` per-card values instead of `minCopies` rarity-level minimums.

### Per-Card Nudge (Calculator tab)
1. Nudge buttons on the Detailed Internals table adjust a rarity's wildcard contribution by 1 card (±1).
2. This requires at least one wildcard slot. The run size (number of packs) is held fixed.
3. Pinned rarities cannot be nudged. The nudge redistributes the probability delta proportionally among unpinned eligible donors using the same redistribution algorithm as the wildcard pane.
4. The result is written back to `wildcardInputs` as normalized fractions.

### Quick Solve
1. **Smallest Run**: Sets run size to `packsPerBox`.
2. **One Box Barrier**: Sets run size to `packsPerBox`.
3. **One Carton Barrier**: Sets run size to `packsPerBox × boxesPerCarton`.
4. **Snap Current to Barrier**: Rounds the current run size up to the next multiple of `packsPerBox × boxesPerCarton`.

---

## 11. History and Undo/Redo

1. Up to 50 history entries are retained (FIFO; oldest entry is discarded when the limit is reached).
2. A new history entry is only added if the new state differs from the current entry (no-op deduplication).
3. Redo entries (states ahead of the cursor) are discarded when a new history entry is pushed.
4. Undo is `Cmd/Ctrl+Z`; redo is `Cmd/Ctrl+Shift+Z`.
5. The Action Stack sidebar shows the history stack in reverse-chronological order with the current entry highlighted and future (redo) entries dimmed.

---

## 12. State Migration and Normalization

1. On load, the persisted state is passed through `migrateConfig`, which builds a new default state and copies known fields by path.
2. Legacy single-set format (flat `set.name`, `set.totalCards`, `rarities`) is detected and promoted to the multi-set model.
3. Legacy `pack.wildcardSlots` and per-rarity `fixedSlots` are promoted to the slot plan array model.
4. If the active pack's set ID no longer exists after migration, it falls back to the first set.
5. If `nudgePins` is missing or not an object, it is initialized to `{}`.
6. `probInputMode` is always forced to `"fraction"` during normalization, regardless of what was stored.
7. All detected migration changes are shown in a diff list in the Config Manager tab after load.
8. If migration throws, the persisted state is discarded and defaults are used; a warning is shown.
9. Loading a JSON config larger than 5 MB (UTF-8 bytes) is blocked with an alert.
10. Loading a config with rarity count exceeding 127 is blocked with an alert.

---

## 13. File I/O

1. If the browser supports File System Access API (`showDirectoryPicker`, `showOpenFilePicker`, `showSaveFilePicker`), full file mode is available.
2. In full file mode, the user can pin a folder. Files are read from and written to that folder.
3. Writing to an existing file in the pinned folder requires confirmation.
4. If File System Access API is unavailable, the app falls back to `<input type="file">` for open and Blob URL download for save.
5. On open, if the user has unsaved local changes since the last explicit save/load, the app prompts before replacing current state.
6. Config is saved as JSON. The filename defaults to `pack-config.json` but is user-editable.
7. "Last explicit file sync hash" is tracked to determine whether unsaved changes exist; it is computed from a normalized state clone (timestamp excluded).

---

## 14. Report Export

1. Exports are triggered only if the current state passes all validation — the report button blocks and shows errors if not.
2. Available formats: **HTML**, **TXT**, **JSON**.
3. HTML export is self-contained: `styles.css` is fetched (no-store cache) and embedded as an inline `<style>` block. If fetch fails, the app attempts to extract rules from the live `CSSStyleSheet` object. If both fail, export is blocked with a toast.
4. The CSS is cached in memory after the first successful fetch to avoid repeated requests within the same session.
5. The `</style` tag is escaped in the inlined CSS to prevent injection.
6. TXT export is a plain-text summary (set name, rarity totals, wildcard rules).
7. JSON export is the raw report payload object.
8. Reports include: pack and set metadata, rarity totals (cards, per-card, percent), wildcard rules (input, decimal, fraction), pack slot plan, packaging hierarchy, priority rules, set policy checks, and policy reference data.
9. Per-card counts are included in the report only when per-card override mode is enabled.

---

## 15. Set Policy Checks (Report)

1. The report evaluates whether the set contains at least 2 Elite-tier cards (inferred from rarity name/shortcode containing "elite").
2. The report evaluates whether the set contains at least 1 Legendary-tier card (inferred from name/shortcode containing "legend").
3. These checks show PASS or REVIEW in the report.
4. Policy reference data (approximate physical dimensions, cost estimates, MSRP references) is included as static reference values.

---

## 16. Config Manager (JSON Paste)

1. The Config Manager tab can generate a JSON snapshot of the current state.
2. Pasted JSON is processed through the same `migrateConfig` pipeline as file loads, including size and rarity limits.
3. The migration diff is shown in a notice block after successful load.
4. The JSON textarea can be cleared; clearing also removes the migration notice.

---

## 17. Locale and Number Formatting

1. Numbers in the Detailed Internals and Summary are formatted using `Intl.NumberFormat` with up to 6 decimal places.
2. Supported locales: `en-US`, `en-GB`, `fr-FR`, `de-DE`, `es-ES`, `it-IT`, `pt-BR`, `ja-JP`, `ko-KR`, `zh-CN`, `nl-NL`.
3. Locale selection persists in state and is applied globally to all formatted output.

---

## 18. Priority Rules

1. Ten default priority rules are defined covering pack composition, production ranges, packaging barriers, per-card overrides, run minimization, wildcard distribution, exact total, rarity drift, rarity minimums, and strict bounds.
2. Rules can be reordered using Up/Down controls. Order affects tradeoff resolution in strict rounding mode and is included in reports.
3. Two rule groupings are displayed as badges: Foundational Pair (`fp`) and Tradeoff Cluster (`tc`).

---

## 19. Error Navigation

1. Validation errors appear in the error summary panel with "Jump" links per error.
2. Clicking Jump navigates to the relevant tab, scrolls to the relevant field, focuses it, and applies a glow pulse animation (1.3 s duration).
3. If a rarity error is jumped and the editing set differs from the pack set, the editing set is first switched to the pack set.

---

## 20. Non-Functional

1. The tool must remain client-side only (static HTML/CSS/JS, no build step required).
2. Core editing operations must update live UI feedback immediately while typing (feedback runs on `input` event; history commit runs on `blur`).
3. Calculation is scheduled via `queueMicrotask` with a token guard to debounce rapid re-renders; only the last enqueued calculation runs.
4. Blocking validation errors must prevent calculation and report export.
5. All persisted state and JSON imports must pass through migration/normalization before use.
6. The action rail sidebar collapses at viewport widths ≤ 900 px.
