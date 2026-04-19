
  /* === CONSTANTS AND DEFAULTS === */
  const APP_VERSION = "0.1.0";
  const SCHEMA_VERSION = 1.1;
  const COPYRIGHT_LABEL = "Copyright © 2026 Chris Holt. All rights reserved. Personal use is free; commercial use requires a paid license.";
  const STORAGE_KEY = "rcpc.packcalc.state";
  const LICENSE_MAILTO = "mailto:license@cipherfall.com?subject=Commercial%20License%20Request%20%E2%80%94%20CCG%20Builder&body=Hello%2C%0A%0AI%20would%20like%20to%20obtain%20a%20commercial%20license%20for%20CCG%20Builder.%0A%0AOrganization%20name%3A%20%5Byour%20organization%5D%0ANumber%20of%20users%3A%20%5Bnumber%5D%0AEstimated%20days%20of%20use%3A%20%5Bnumber%5D%0AUse%20case%20description%3A%20%5Bdescribe%20how%20you%20intend%20to%20use%20the%20tool%5D%0A%0APlease%20reply%20with%20licensing%20terms%20and%20payment%20instructions.%0A%0AThank%20you.";
  const STORAGE_ALERT_KEY = "rcpc.packcalc.alerted";
  const STORAGE_PINNED_DIR_KEY = "rcpc.packcalc.pinnedDirSupported";
  const STORAGE_PRIVACY_BANNER_KEY = "rcpc.packcalc.privacyNoticeDismissed";
  const STORAGE_GDPR_BANNER_KEY    = "rcpc.packcalc.gdprNoticeDismissed";
  const STORAGE_LICENSE_KEY        = "rcpc.packcalc.licenseAcknowledged";
  const TOLERANCE = 1e-9;
  const FRACTION_DENOM_CAP = 9999;
  const MAX_JSON_BYTES = 5 * 1024 * 1024;
  const MAX_RARITY_COUNT = 127;
  const HISTORY_LIMIT = 50;
  const WILDCARD_SLOT_ID = "__wildcard__";

  const LOCALES = ["en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "it-IT", "pt-BR", "ja-JP", "ko-KR", "zh-CN", "nl-NL"];

  const DEFAULT_RULES = [
    { id: "packComposition", label: "Respect cards-per-pack composition", group: "fp", advice: "This keeps the slot plan structurally valid so each pack still contains the intended mix of rarity slots. Breaking composition can make downstream percentages look correct while pack contents are operationally wrong. It is usually best treated as a hard guardrail before optimization goals." },
    { id: "productionRanges", label: "Prefer recommended production ranges", group: null, advice: "This favors run sizes that are practical for manufacturing and distribution instead of mathematically minimal extremes. It can increase total printed quantity if the nearest feasible production window is larger than the strict minimum. Use it as a soft constraint when operational efficiency matters more than absolute minimization." },
    { id: "packagingBarrier", label: "Snap run to packaging barriers", group: null, advice: "This aligns output to whole packaging units such as boxes or cartons to reduce partial handling and waste. It may push the run above the smallest mathematically sufficient pack count. The tradeoff is cleaner logistics and simpler inventory movement." },
    { id: "perCardOverride", label: "Enforce explicit per-card overrides", group: null, advice: "When enabled, explicit per-card minimums become the active floor for allocation behavior. This can override broader rarity-level balancing and force additional volume into specific cards. Keep this prioritized only when card-level guarantees are contractual or design-critical." },
    { id: "minRun", label: "Minimize print run size", group: null, advice: "This drives toward the lowest total run that still satisfies active constraints. It reduces material usage and carrying cost but can increase sensitivity to rounding and drift tradeoffs. Pair it carefully with strict bounds and barrier snapping to avoid unstable edge cases." },
    { id: "wildcardDistribution", label: "Match wildcard long-run distribution", group: null, advice: "This keeps wildcard assignment aligned with the configured probability model over many packs. Prioritizing it improves long-run statistical fidelity but may conflict with hard minimums in short runs. It is most important when wildcard outcomes are player-facing and audited for fairness." },
    { id: "exactTotal", label: "Preserve exact total card count", group: "fp tc", advice: "This enforces that aggregate allocated cards exactly match the requested target total. Maintaining exact totals can require shifts that increase rarity drift or tighten other constraints. Treat it as a cross-cutting integrity rule that interacts with both Choice 1 and Choice 2 priorities." },
    { id: "rarityDrift", label: "Keep rarity drift low", group: "tc", advice: "This minimizes deviation between target rarity proportions and achieved output. Lower drift improves distribution quality but can force compromises in strict-bound compliance or run-size goals. It is most useful when statistical balance is a key product promise." },
    { id: "rarityMins", label: "Enforce rarity-level per-card minimums", group: null, advice: "This ensures each rarity meets at least its defined minimum contribution before optional balancing goals are considered. Strong minimums can consume flexibility that would otherwise reduce drift. Keep this above cosmetic optimizations when floor guarantees are non-negotiable." },
    { id: "strictBounds", label: "Respect strict per-rarity min/max bounds", group: "tc", advice: "This enforces hard lower and upper bounds for each rarity so outputs never cross declared limits. Strict bounds can force higher drift or larger runs when constraints conflict. Prioritize this highly when compliance and guardrails are more important than smooth distribution." }
  ];

  const DEFAULT_RULE_GROUP_BY_ID = Object.fromEntries(DEFAULT_RULES.map((r) => [r.id, r.group || ""]));
  const DEFAULT_RULE_ADVICE_BY_ID = Object.fromEntries(DEFAULT_RULES.map((r) => [r.id, r.advice || ""]));

  // 16 pre-selected, theme-safe rarity colors.
  const RARITY_COLOR_PALETTE = [
    { id: "cyan",       label: "Cyan Arc",      hex: "#00e5ff", bg: "rgba(0, 229, 255, 0.16)",   border: "rgba(0, 229, 255, 0.62)" },
    { id: "magenta",    label: "Magenta Pulse", hex: "#cc00ff", bg: "rgba(204, 0, 255, 0.18)",   border: "rgba(204, 0, 255, 0.62)" },
    { id: "amber",      label: "Amber Flare",   hex: "#ffab00", bg: "rgba(255, 171, 0, 0.18)",   border: "rgba(255, 171, 0, 0.62)" },
    { id: "lime",       label: "Lime Signal",   hex: "#7cff00", bg: "rgba(124, 255, 0, 0.16)",   border: "rgba(124, 255, 0, 0.58)" },
    { id: "azure",      label: "Azure Beam",    hex: "#4da3ff", bg: "rgba(77, 163, 255, 0.18)",  border: "rgba(77, 163, 255, 0.60)" },
    { id: "violet",     label: "Violet Rift",   hex: "#9b7dff", bg: "rgba(155, 125, 255, 0.18)", border: "rgba(155, 125, 255, 0.58)" },
    { id: "teal",       label: "Teal Current",  hex: "#00c8b0", bg: "rgba(0, 200, 176, 0.16)",   border: "rgba(0, 200, 176, 0.56)" },
    { id: "rose",       label: "Rose Spark",    hex: "#ff5ca8", bg: "rgba(255, 92, 168, 0.18)",  border: "rgba(255, 92, 168, 0.60)" },
    { id: "gold",       label: "Gold Ember",    hex: "#ffd24a", bg: "rgba(255, 210, 74, 0.18)",  border: "rgba(255, 210, 74, 0.60)" },
    { id: "ice",        label: "Ice Glow",      hex: "#7de7ff", bg: "rgba(125, 231, 255, 0.17)", border: "rgba(125, 231, 255, 0.58)" },
    { id: "orchid",     label: "Orchid Neon",   hex: "#d786ff", bg: "rgba(215, 134, 255, 0.18)", border: "rgba(215, 134, 255, 0.58)" },
    { id: "coral",      label: "Coral Shock",   hex: "#ff7a66", bg: "rgba(255, 122, 102, 0.18)", border: "rgba(255, 122, 102, 0.60)" },
    { id: "mint",       label: "Mint Arc",      hex: "#5dffbe", bg: "rgba(93, 255, 190, 0.16)",  border: "rgba(93, 255, 190, 0.58)" },
    { id: "blue",       label: "Deep Blue",     hex: "#3f6dff", bg: "rgba(63, 109, 255, 0.18)",  border: "rgba(63, 109, 255, 0.58)" },
    { id: "pink",       label: "Hot Pink",      hex: "#ff3dd6", bg: "rgba(255, 61, 214, 0.18)",  border: "rgba(255, 61, 214, 0.60)" },
    { id: "tangerine",  label: "Tangerine",     hex: "#ff8a2f", bg: "rgba(255, 138, 47, 0.18)",  border: "rgba(255, 138, 47, 0.60)" }
  ];
  const RARITY_COLOR_TOP5 = ["cyan", "magenta", "amber", "lime", "azure"];
  const RARITY_COLOR_BY_ID = Object.fromEntries(RARITY_COLOR_PALETTE.map((c) => [c.id, c]));

  function hexToRgb(hex) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || "");
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function colorDistanceSq(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return (dr * dr) + (dg * dg) + (db * db);
  }

  function isRarityColorId(value) {
    return typeof value === "string" && !!RARITY_COLOR_BY_ID[value];
  }

  function getRarityColorDef(colorId) {
    return RARITY_COLOR_BY_ID[colorId] || RARITY_COLOR_BY_ID[RARITY_COLOR_TOP5[0]];
  }

  function getRarityToneStyle(colorId) {
    const c = getRarityColorDef(colorId);
    return `background:${c.bg};border-left:3px solid ${c.border};`;
  }

  function buildRarityColorOptions(selectedId) {
    return RARITY_COLOR_PALETTE.map((c) => {
      const selected = c.id === selectedId ? "selected" : "";
      return `<option value="${c.id}" ${selected}>${escapeHtml(c.label)} (${c.hex})</option>`;
    }).join("");
  }

  function getRarityColorSwatchStyle(colorId) {
    const c = getRarityColorDef(colorId);
    return `background:${c.hex};box-shadow:inset 0 0 0 1px rgba(255,255,255,0.32),0 0 0 1px ${c.border};`;
  }

  function pickMostDistinctRarityColor(existingColorIds) {
    const usedValid = Array.from(new Set((existingColorIds || []).filter(isRarityColorId)));
    const available = RARITY_COLOR_PALETTE.map((c) => c.id).filter((id) => !usedValid.includes(id));
    const candidates = available.length ? available : RARITY_COLOR_PALETTE.map((c) => c.id);

    if (!usedValid.length) {
      const first = RARITY_COLOR_TOP5.find((id) => candidates.includes(id));
      return first || candidates[0];
    }

    const usedRgb = usedValid.map((id) => hexToRgb(getRarityColorDef(id).hex)).filter(Boolean);
    let bestId = candidates[0];
    let bestScore = -1;
    candidates.forEach((id) => {
      const rgb = hexToRgb(getRarityColorDef(id).hex);
      if (!rgb) return;
      let minDist = Number.POSITIVE_INFINITY;
      usedRgb.forEach((u) => {
        const d = colorDistanceSq(rgb, u);
        if (d < minDist) minDist = d;
      });
      if (minDist > bestScore) {
        bestScore = minDist;
        bestId = id;
      }
    });
    return bestId;
  }

  function ensureRarityColorsForSet(setDef) {
    if (!setDef || !Array.isArray(setDef.rarities)) return;
    const used = setDef.rarities.map((r) => r.colorId).filter(isRarityColorId);
    setDef.rarities.forEach((r) => {
      if (isRarityColorId(r.colorId)) return;
      r.colorId = pickMostDistinctRarityColor(used);
      used.push(r.colorId);
    });
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function makeDefaultSet(id = generateId("set")) {
    return {
      id,
      name: "",
      totalCards: 0,
      rarities: []
    };
  }

  function makeDefaultPack(setId, id = generateId("pack")) {
    return {
      id,
      name: "",
      setId,
      cardsPerPack: 10,
      packsPerBox: 36,
      boxesPerCarton: 6,
      slotPlan: Array.from({ length: 10 }, () => ""),
      packCriteria: {},
      wildcardInputs: {}
    };
  }

  function makeDefaultState() {
    const initialSet = makeDefaultSet();
    const initialPack = makeDefaultPack(initialSet.id);
    return {
      schemaVersion: SCHEMA_VERSION,
      metadata: {
        appVersion: APP_VERSION,
        timestamp: new Date().toISOString(),
        copyright: COPYRIGHT_LABEL
      },
      sets: [initialSet],
      packs: [initialPack],
      ui: {
        activeTab: "welcome",
        editingSetId: initialSet.id,
        editingPackId: initialPack.id,
        locale: "en-US",
        probInputMode: "fraction",
        fileName: "pack-config.json",
        reportFormat: "html",
        notices: {
          privacyDismissed: false,
          gdprDismissed: false,
          licenseAcknowledged: false
        },
        nudgePins: {},
        migrationNoticeHtml: ""
      },
      pack: {
        setId: initialPack.setId,
        cardsPerPack: initialPack.cardsPerPack,
        packsPerBox: initialPack.packsPerBox,
        boxesPerCarton: initialPack.boxesPerCarton,
        slotPlan: clone(initialPack.slotPlan)
      },
      run: {
        packs: 216,
        roundingPolicy: "exact",
        perCardOverrideMode: false
      },
      rules: DEFAULT_RULES.map((r) => ({ ...r })),
      rarities: [],
      packCriteria: clone(initialPack.packCriteria),
      wildcardInputs: clone(initialPack.wildcardInputs),
      pinnedFolderReady: false,
      validationDraft: {
        wildcardDirty: {},
        wildcardPendingInvalid: {}
      }
    };
  }

  /* === STATE, HISTORY, AND UTILITIES === */
  let state = makeDefaultState();
  let historyStack = [];
  let historyCursor = -1;
  let calcToken = 0;
  let pinnedDirectoryHandle = null;
  let pinnedFolderDisplayPath = "";
  let lastExplicitFileSyncHash = null;
  let cachedExportStylesCssText = null;

  function normalizeUiSettings(targetState = state) {
    if (!targetState.ui || typeof targetState.ui !== "object") targetState.ui = {};
    if (typeof targetState.ui.fileName !== "string") targetState.ui.fileName = "pack-config.json";
    if (!["html", "txt", "json"].includes(String(targetState.ui.reportFormat || ""))) {
      targetState.ui.reportFormat = "html";
    }
    if (!targetState.ui.notices || typeof targetState.ui.notices !== "object") {
      targetState.ui.notices = {};
    }
    if (typeof targetState.ui.notices.privacyDismissed !== "boolean") {
      targetState.ui.notices.privacyDismissed = localStorage.getItem(STORAGE_PRIVACY_BANNER_KEY) === "1";
    }
    if (typeof targetState.ui.notices.gdprDismissed !== "boolean") {
      targetState.ui.notices.gdprDismissed = localStorage.getItem(STORAGE_GDPR_BANNER_KEY) === "1";
    }
    if (typeof targetState.ui.notices.licenseAcknowledged !== "boolean") {
      targetState.ui.notices.licenseAcknowledged = localStorage.getItem(STORAGE_LICENSE_KEY) === "1";
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatNumber(n) {
    const loc = state.ui.locale || "en-US";
    try {
      return new Intl.NumberFormat(loc, { maximumFractionDigits: 6 }).format(n);
    } catch (_e) {
      return String(n);
    }
  }

  function statusLine(type, text) {
    return `<div class="status ${type}" role="status">${escapeHtml(text)}</div>`;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getPinnedFolderDisplayPath(handle) {
    if (!handle) return "";
    if (typeof handle.path === "string" && handle.path.trim()) return handle.path.trim();
    if (typeof handle.name === "string" && handle.name.trim()) return handle.name.trim();
    return "Pinned folder selected";
  }

  function utf8ByteLength(text) {
    return new TextEncoder().encode(text).length;
  }

  function normalizedStateHash() {
    const cloned = clone(state);
    if (cloned.metadata) {
      cloned.metadata.timestamp = "";
    }
    return JSON.stringify(cloned);
  }

  function maybeConfirmUnsavedBeforeOpen() {
    if (!lastExplicitFileSyncHash) return true;
    if (lastExplicitFileSyncHash === normalizedStateHash()) return true;
    return window.confirm("You have unsaved local changes since your last explicit save/load. Open anyway and replace current state?");
  }

  function pushHistory(reason, payload = {}) {
    syncPackLibraryFromActive(state);
    const snapshot = clone(state);
    if (historyCursor >= 0) {
      const current = JSON.stringify(historyStack[historyCursor].snapshot);
      const next = JSON.stringify(snapshot);
      if (current === next) return;
    }
    historyStack = historyStack.slice(0, historyCursor + 1);
    historyStack.push({ snapshot, label: historyLabel(reason, payload) });
    if (historyStack.length > HISTORY_LIMIT) {
      historyStack.shift();
    }
    historyCursor = historyStack.length - 1;
    void reason;
    void payload;
    renderUndoRedo();
  }

  function undo() {
    if (historyCursor <= 0) return;
    historyCursor -= 1;
    state = clone(historyStack[historyCursor].snapshot);
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function redo() {
    if (historyCursor >= historyStack.length - 1) return;
    historyCursor += 1;
    state = clone(historyStack[historyCursor].snapshot);
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function getRarityDisplayLabel(rarityId) {
    const packSet = getPackSet(state);
    const rarity = (packSet?.rarities || []).find((r) => r.id === rarityId);
    if (!rarity) return rarityId || "rarity";
    const code = String(rarity.shortcode || "").trim();
    if (code) return code;
    const name = String(rarity.name || "").trim();
    return name || rarityId || "rarity";
  }

  function historyLabel(reason, payload = {}) {
    const labels = {
      init: { area: "System", action: "initialize workspace state" },
      "set-commit": { area: "Set Editor", action: "update set details" },
      "pack-set-change": { area: "Pack Editor", action: "change linked set" },
      "pack-select": { area: "Pack Editor", action: "load selected pack" },
      "pack-name-commit": { area: "Pack Editor", action: "rename active pack" },
      "add-pack": { area: "Pack Editor", action: "add new pack" },
      "remove-pack": { area: "Pack Editor", action: "remove active pack" },
      "copy-pack": { area: "Pack Editor", action: "copy rules to new pack" },
      "add-set": { area: "Set Editor", action: "add new set" },
      "remove-set": { area: "Set Editor", action: "remove active set" },
      "add-rarity": { area: "Set Editor", action: "add new rarity" },
      "reset-rarities": { area: "Set Editor", action: "reset all rarities" },
      "rarity-commit": { area: "Set Editor", action: "edit rarity fields" },
      "rarity-delete": { area: "Set Editor", action: "remove rarity" },
      "pack-commit": { area: "Pack Editor", action: "edit pack settings" },
      "pack-slot-change": { area: "Pack Editor", action: "change slot assignment" },
      "pack-criteria-commit": { area: "Pack Editor", action: "update rarity criteria" },
      "wildcard-eligibility": { area: "Wildcard Editor", action: "toggle rarity eligibility" },
      "wildcard-commit": { area: "Wildcard Editor", action: "update rarity ratio" },
      "wildcard-nudge": { area: "Wildcard Editor", action: "nudge rarity likelihood" },
      "wildcard-pin": { area: "Wildcard Editor", action: "toggle rarity pin" },
      "rounding-policy": { area: "Calculator", action: "change rounding policy" },
      "per-card-override-mode": { area: "Calculator", action: "toggle override mode" },
      locale: { area: "Calculator", action: "change number locale" },
      "rule-reorder": { area: "Rules", action: "reorder priority rule" },
      "snap-tolerance": { area: "Wildcard Editor", action: "snap total to tolerance" },
      "solve-smallest": { area: "Calculator", action: "set smallest run target" },
      "solve-box": { area: "Calculator", action: "set box barrier run" },
      "solve-carton": { area: "Calculator", action: "set carton barrier run" },
      "solve-snap": { area: "Calculator", action: "snap run to barrier" },
      "nudge-per-card": { area: "Wildcard Editor", action: "nudge rarity likelihood" },
      "reset-packaging": { area: "Pack Editor", action: "reset packaging defaults" },
      "reset-wildcards": { area: "Wildcard Editor", action: "reset all wildcard ratios" },
      "reset-all": { area: "System", action: "reset all configuration" },
      "load-json": { area: "Files", action: "load configuration file" }
    };

    const label = { ...(labels[reason] || { area: "System", action: "edit state" }) };
    const rarityLabel = payload.rarityLabel || (payload.rarityId ? getRarityDisplayLabel(payload.rarityId) : "rarity");

    if (reason === "rarity-delete") {
      label.action = `remove ${rarityLabel} rarity`;
    } else if (reason === "wildcard-eligibility") {
      label.action = `${payload.enabled ? "enable" : "disable"} ${rarityLabel} eligibility`;
    } else if (reason === "wildcard-commit") {
      label.action = `set ${rarityLabel} ratio`;
    } else if (reason === "wildcard-nudge") {
      const direction = payload.direction > 0 ? "raise" : "lower";
      label.action = `${direction} ${rarityLabel} likelihood`;
    } else if (reason === "wildcard-pin") {
      label.action = `${payload.pinned ? "pin" : "unpin"} ${rarityLabel} row`;
    } else if (reason === "nudge-per-card") {
      const direction = payload.direction > 0 ? "raise" : "lower";
      label.action = `${direction} ${rarityLabel} likelihood`;
    } else if (reason === "rule-reorder") {
      const direction = payload.direction === "up" ? "move up" : "move down";
      const ruleLabel = payload.ruleLabel || "priority rule";
      label.action = `${direction} ${ruleLabel}`;
    } else if (reason === "remove-set") {
      const setLabel = String(payload.setLabel || "active set");
      label.action = `remove ${setLabel}`;
    }

    return label;
  }

  function renderHistoryStack() {
    const box = byId("historyStackView");
    if (!box) return;
    if (!historyStack.length) {
      box.innerHTML = '<div class="history-empty">No actions yet.</div>';
      return;
    }

    const rows = historyStack.map((entry, idx) => {
      const classes = ["history-item"];
      if (idx === historyCursor) classes.push("active");
      if (idx > historyCursor) classes.push("redo");
      const label = (entry.label && typeof entry.label === "object")
        ? entry.label
        : { area: "System", action: String(entry.label || "edit state") };
      const title = `${label.area}: ${label.action}`;
      return `<div class="${classes.join(" ")}" title="${escapeHtml(title)}"><div class="history-area">${escapeHtml(label.area)}</div><div class="history-action">${escapeHtml(label.action)}</div></div>`;
    }).reverse().join("");

    box.innerHTML = rows;
  }

  function renderUndoRedo() {
    byId("undoBtn").disabled = historyCursor <= 0;
    byId("redoBtn").disabled = historyCursor >= historyStack.length - 1;
    renderHistoryStack();
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getSetById(sourceState, setId) {
    return (sourceState.sets || []).find((setDef) => setDef.id === setId) || null;
  }

  function ensureSetSelections(targetState = state) {
    if (!Array.isArray(targetState.sets) || targetState.sets.length === 0) {
      const fallback = makeDefaultSet();
      targetState.sets = [fallback];
    }

    const firstSetId = targetState.sets[0].id;
    if (!targetState.ui || typeof targetState.ui !== "object") {
      targetState.ui = { activeTab: "welcome", editingSetId: firstSetId, editingPackId: "", locale: "en-US", probInputMode: "fraction", nudgePins: {}, migrationNoticeHtml: "" };
    }
    if (!targetState.pack || typeof targetState.pack !== "object") {
      targetState.pack = { setId: firstSetId, cardsPerPack: 10, packsPerBox: 36, boxesPerCarton: 6, slotPlan: [] };
    }

    if (!getSetById(targetState, targetState.ui.editingSetId)) {
      targetState.ui.editingSetId = firstSetId;
    }
    if (!getSetById(targetState, targetState.pack.setId)) {
      targetState.pack.setId = firstSetId;
    }
    if (!targetState.ui.nudgePins || typeof targetState.ui.nudgePins !== "object") {
      targetState.ui.nudgePins = {};
    }
    targetState.ui.probInputMode = "fraction";
  }

  function normalizePackRecord(packRecord, fallbackSetId) {
    const normalized = {
      id: packRecord?.id || generateId("pack"),
      name: String(packRecord?.name || ""),
      setId: packRecord?.setId || fallbackSetId,
      cardsPerPack: Number(packRecord?.cardsPerPack || 10),
      packsPerBox: Number(packRecord?.packsPerBox || 36),
      boxesPerCarton: Number(packRecord?.boxesPerCarton || 6),
      slotPlan: Array.isArray(packRecord?.slotPlan) ? clone(packRecord.slotPlan) : [],
      packCriteria: packRecord?.packCriteria && typeof packRecord.packCriteria === "object" ? clone(packRecord.packCriteria) : {},
      wildcardInputs: packRecord?.wildcardInputs && typeof packRecord.wildcardInputs === "object" ? clone(packRecord.wildcardInputs) : {}
    };
    if (!Number.isFinite(normalized.cardsPerPack) || normalized.cardsPerPack < 1) normalized.cardsPerPack = 10;
    if (!Number.isFinite(normalized.packsPerBox) || normalized.packsPerBox < 1) normalized.packsPerBox = 36;
    if (!Number.isFinite(normalized.boxesPerCarton) || normalized.boxesPerCarton < 1) normalized.boxesPerCarton = 6;
    while (normalized.slotPlan.length < normalized.cardsPerPack) normalized.slotPlan.push("");
    normalized.slotPlan = normalized.slotPlan.slice(0, normalized.cardsPerPack);
    return normalized;
  }

  function getPackRecordById(sourceState, packId) {
    return (sourceState.packs || []).find((p) => p.id === packId) || null;
  }

  function loadActivePackFromLibrary(targetState = state, packId = targetState.ui?.editingPackId) {
    const record = getPackRecordById(targetState, packId);
    if (!record) return;
    targetState.ui.editingPackId = record.id;
    targetState.pack = {
      setId: record.setId,
      cardsPerPack: Number(record.cardsPerPack || 10),
      packsPerBox: Number(record.packsPerBox || 36),
      boxesPerCarton: Number(record.boxesPerCarton || 6),
      slotPlan: clone(record.slotPlan || [])
    };
    targetState.packCriteria = clone(record.packCriteria || {});
    targetState.wildcardInputs = clone(record.wildcardInputs || {});
    syncPackConfiguration(targetState);
  }

  function syncPackLibraryFromActive(targetState = state) {
    if (!targetState.ui || !Array.isArray(targetState.packs) || !targetState.packs.length) return;
    const idx = targetState.packs.findIndex((p) => p.id === targetState.ui.editingPackId);
    if (idx < 0) return;
    targetState.packs[idx] = {
      ...targetState.packs[idx],
      setId: targetState.pack.setId,
      cardsPerPack: Number(targetState.pack.cardsPerPack || 0),
      packsPerBox: Number(targetState.pack.packsPerBox || 0),
      boxesPerCarton: Number(targetState.pack.boxesPerCarton || 0),
      slotPlan: clone(targetState.pack.slotPlan || []),
      packCriteria: clone(targetState.packCriteria || {}),
      wildcardInputs: clone(targetState.wildcardInputs || {})
    };
  }

  function ensurePackSelections(targetState = state) {
    ensureSetSelections(targetState);
    const firstSetId = targetState.sets[0].id;
    if (!Array.isArray(targetState.packs) || targetState.packs.length === 0) {
      const legacyPack = makeDefaultPack(targetState.pack?.setId || firstSetId);
      legacyPack.cardsPerPack = Number(targetState.pack?.cardsPerPack || legacyPack.cardsPerPack);
      legacyPack.packsPerBox = Number(targetState.pack?.packsPerBox || legacyPack.packsPerBox);
      legacyPack.boxesPerCarton = Number(targetState.pack?.boxesPerCarton || legacyPack.boxesPerCarton);
      legacyPack.slotPlan = Array.isArray(targetState.pack?.slotPlan) ? clone(targetState.pack.slotPlan) : legacyPack.slotPlan;
      legacyPack.packCriteria = targetState.packCriteria && typeof targetState.packCriteria === "object" ? clone(targetState.packCriteria) : {};
      legacyPack.wildcardInputs = targetState.wildcardInputs && typeof targetState.wildcardInputs === "object" ? clone(targetState.wildcardInputs) : {};
      targetState.packs = [legacyPack];
      targetState.ui.editingPackId = legacyPack.id;
    }
    targetState.packs = targetState.packs.map((packRecord) => normalizePackRecord(packRecord, firstSetId));
    targetState.packs.forEach((packRecord) => {
      if (!getSetById(targetState, packRecord.setId)) {
        packRecord.setId = firstSetId;
      }
    });

    if (!getPackRecordById(targetState, targetState.ui.editingPackId)) {
      targetState.ui.editingPackId = targetState.packs[0].id;
    }

    loadActivePackFromLibrary(targetState, targetState.ui.editingPackId);
  }

  function getEditingSet(sourceState = state) {
    ensureSetSelections(sourceState);
    return getSetById(sourceState, sourceState.ui.editingSetId);
  }

  function getPackSet(sourceState = state) {
    ensureSetSelections(sourceState);
    return getSetById(sourceState, sourceState.pack.setId);
  }

  function remapPackRulesToSet(targetState, packRecord, sourceSetId, targetSetId) {
    if (!packRecord || sourceSetId === targetSetId) return;
    const sourceSet = getSetById(targetState, sourceSetId);
    const nextSet = getSetById(targetState, targetSetId);
    if (!sourceSet || !nextSet) return;

    const sourceByCode = new Map();
    (sourceSet.rarities || []).forEach((r) => {
      const code = String(r.shortcode || "").trim().toUpperCase();
      if (code) sourceByCode.set(code, r.id);
    });

    const idMap = new Map();
    (nextSet.rarities || []).forEach((r) => {
      const code = String(r.shortcode || "").trim().toUpperCase();
      if (!code) return;
      const sourceId = sourceByCode.get(code);
      if (sourceId) idMap.set(sourceId, r.id);
    });

    const mappedCriteria = {};
    const mappedInputs = {};
    (nextSet.rarities || []).forEach((rarity) => {
      const sourceId = [...idMap.entries()].find(([, toId]) => toId === rarity.id)?.[0];
      if (!sourceId) return;
      if (packRecord.packCriteria && packRecord.packCriteria[sourceId]) {
        mappedCriteria[rarity.id] = clone(packRecord.packCriteria[sourceId]);
      }
      if (packRecord.wildcardInputs && packRecord.wildcardInputs[sourceId] != null) {
        mappedInputs[rarity.id] = packRecord.wildcardInputs[sourceId];
      }
    });

    packRecord.slotPlan = (packRecord.slotPlan || []).map((slot) => {
      if (slot === WILDCARD_SLOT_ID || !slot) return slot;
      return idMap.get(slot) || "";
    });
    packRecord.packCriteria = mappedCriteria;
    packRecord.wildcardInputs = mappedInputs;
  }

  function makeDefaultPackCriteria() {
    return {
      wildcardEligible: false,
      minCopies: 0,
      overrideMin: 0
    };
  }

  function syncPackConfiguration(targetState = state) {
    ensureSetSelections(targetState);
    if (!targetState.pack || typeof targetState.pack !== "object") {
      targetState.pack = { setId: targetState.ui.editingSetId, cardsPerPack: 10, packsPerBox: 36, boxesPerCarton: 6, slotPlan: [] };
    }

    const cardCount = Math.max(0, Number(targetState.pack.cardsPerPack || 0));
    const packSet = getPackSet(targetState);
    ensureRarityColorsForSet(packSet);
    const rarities = packSet?.rarities || [];
    const rarityIds = new Set(rarities.map((r) => r.id));

    if (!Array.isArray(targetState.pack.slotPlan)) {
      targetState.pack.slotPlan = [];
    }
    targetState.pack.slotPlan = targetState.pack.slotPlan.slice(0, cardCount);
    while (targetState.pack.slotPlan.length < cardCount) {
      targetState.pack.slotPlan.push("");
    }
    targetState.pack.slotPlan = targetState.pack.slotPlan.map((value) => {
      if (value === WILDCARD_SLOT_ID || rarityIds.has(value)) return value;
      return "";
    });

    if (!targetState.packCriteria || typeof targetState.packCriteria !== "object") {
      targetState.packCriteria = {};
    }
    rarities.forEach((r) => {
      const existing = targetState.packCriteria[r.id] || {};
      targetState.packCriteria[r.id] = {
        wildcardEligible: !!existing.wildcardEligible,
        minCopies: Number(existing.minCopies || 0),
        overrideMin: Number(existing.overrideMin || 0)
      };
      if (targetState.wildcardInputs[r.id] == null) {
        targetState.wildcardInputs[r.id] = "0/1";
      }
    });

    Object.keys(targetState.packCriteria).forEach((id) => {
      if (!rarityIds.has(id)) delete targetState.packCriteria[id];
    });
    Object.keys(targetState.wildcardInputs).forEach((id) => {
      if (!rarityIds.has(id)) delete targetState.wildcardInputs[id];
    });

    return targetState;
  }

  function getSlotSortWeight(slot, rarityOrder) {
    if (!slot) return Number.MAX_SAFE_INTEGER;
    if (slot === WILDCARD_SLOT_ID) return rarityOrder.length;
    const index = rarityOrder.indexOf(slot);
    return index === -1 ? rarityOrder.length + 1 : index;
  }

  function sortPackSlotPlan(targetState = state) {
    syncPackConfiguration(targetState);
    const rarityOrder = (getPackSet(targetState)?.rarities || []).map((r) => r.id);
    targetState.pack.slotPlan.sort((left, right) => {
      const leftWeight = getSlotSortWeight(left, rarityOrder);
      const rightWeight = getSlotSortWeight(right, rarityOrder);
      if (leftWeight !== rightWeight) return leftWeight - rightWeight;
      if (left === right) return 0;
      return String(left).localeCompare(String(right));
    });
  }

  function getPackComposition(sourceState = state) {
    syncPackConfiguration(sourceState);
    const countsByRarity = {};
    let wildcardSlots = 0;
    let unassignedSlots = 0;

    sourceState.pack.slotPlan.forEach((slot) => {
      if (slot === WILDCARD_SLOT_ID) {
        wildcardSlots += 1;
        return;
      }
      if (!slot) {
        unassignedSlots += 1;
        return;
      }
      countsByRarity[slot] = (countsByRarity[slot] || 0) + 1;
    });

    return {
      countsByRarity,
      wildcardSlots,
      unassignedSlots,
      assignedSlots: sourceState.pack.slotPlan.length - unassignedSlots,
      totalSlots: sourceState.pack.slotPlan.length
    };
  }

  /* === MODULE WIRING === */
  const {
    gcd, reduceFraction, toFractionApprox, renderFractionText,
    splitWildcardInputParts, composeWildcardInput, normalizeProbabilityToFraction,
    parseFractionInput, parseProbabilityInput, trimLeadingZerosSafe
  } = window.CCGFractionMath;

  window.CCGValidation.init({
    ensurePackSelections, syncPackConfiguration,
    getPackSet, getPackComposition, makeDefaultPackCriteria,
    parseProbabilityInput, TOLERANCE, MAX_RARITY_COUNT
  });
  const { validateState } = window.CCGValidation;

  window.CCGCalculator.init({
    ensurePackSelections, syncPackConfiguration,
    validateState, getPackSet, getPackComposition,
    parseProbabilityInput, makeDefaultPackCriteria
  });
  const { runCalculation } = window.CCGCalculator;

  /* === RENDERING === */
  function renderTabs() {
    const active = state.ui.activeTab;
    ["welcome", "rarities", "packEditor", "rules", "calculator", "config", "files"].forEach((name) => {
      const btn = byId(`tab${name[0].toUpperCase()}${name.slice(1)}`);
      const panel = byId(`${name}Tab`);
      const on = active === name;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      panel.classList.toggle("active", on);
    });
  }

  function renderLocales() {
    const sel = byId("localeSelect");
    if (sel.options.length) return;
    LOCALES.forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      sel.appendChild(opt);
    });
  }

  function renderSetSelectors() {
    ensurePackSelections(state);
    ensureSetSelections(state);
    const setOptions = state.sets.map((setDef) => `<option value="${setDef.id}">${escapeHtml(setDef.name || "Untitled Set")}</option>`).join("");
    byId("setPickerSelect").innerHTML = setOptions;
    byId("setPickerSelect").value = state.ui.editingSetId;
    byId("packSetSelect").innerHTML = setOptions;
    byId("packSetSelect").value = state.pack.setId;
    byId("copyPackSetSelect").innerHTML = setOptions;
    byId("copyPackSetSelect").value = state.pack.setId;
    byId("removeSetBtn").disabled = state.sets.length <= 1;
    const activeSet = getEditingSet(state);
    byId("setActiveTitle").textContent = `Active Set: ${activeSet?.name?.trim() || "Untitled Set"}`;
  }

  function renderPackSelectors() {
    ensurePackSelections(state);
    const packOptions = state.packs
      .map((packDef, idx) => `<option value="${packDef.id}">${escapeHtml(packDef.name || `Untitled Pack ${idx + 1}`)}</option>`)
      .join("");
    byId("packPickerSelect").innerHTML = packOptions;
    byId("packPickerSelect").value = state.ui.editingPackId;
    const activePack = getPackRecordById(state, state.ui.editingPackId);
    byId("packName").value = activePack?.name || "";
    byId("removePackBtn").disabled = state.packs.length <= 1;
    const activeSet = getPackSet(state);
    const packLabel = activePack?.name?.trim() || "Untitled Pack";
    const setLabel = activeSet?.name?.trim() || "Untitled Set";
    byId("packActiveTitle").textContent = `Active Pack: ${packLabel} (${setLabel})`;
  }

  function renderRarityTable() {
    ensureSetSelections(state);
    const editingSet = getEditingSet(state);
    ensureRarityColorsForSet(editingSet);
    const rarities = editingSet?.rarities || [];
    const body = byId("rarityBody");
    body.innerHTML = "";

    renderSetSelectors();

    const raritySetTotal = rarities.reduce((sum, r) => sum + Number(r.setCount || 0), 0);
    const setStatus = byId("setDistributionStatus");
    const declaredTotal = Number(editingSet?.totalCards || 0);
    if (declaredTotal < 1) {
      setStatus.innerHTML = statusLine("warn", `Rarity total: ${raritySetTotal}. Enter the total cards in the set to validate the distribution.`);
    } else if (raritySetTotal === declaredTotal) {
      setStatus.innerHTML = statusLine("ok", `Rarity total matches set total: ${raritySetTotal} of ${declaredTotal}.`);
    } else {
      setStatus.innerHTML = statusLine("warn", `Rarity total is ${raritySetTotal}, but the declared set total is ${declaredTotal}.`);
    }

    rarities.forEach((r, idx) => {
      const tr = document.createElement("tr");
      const tone = getRarityToneStyle(r.colorId);
      tr.innerHTML = `
        <td style="${tone}"><input data-role="rarity-name" data-id="${r.id}" type="text" value="${escapeHtml(r.name || "")}"></td>
        <td><input data-role="rarity-shortcode" data-id="${r.id}" type="text" value="${escapeHtml(r.shortcode || "")}"></td>
        <td>
          <div class="rarity-color-picker">
            <span class="rarity-color-swatch" style="${getRarityColorSwatchStyle(r.colorId)}" aria-hidden="true"></span>
            <select data-role="rarity-color" data-id="${r.id}" aria-label="Rarity color for ${escapeHtml(r.name || r.shortcode || r.id)}">${buildRarityColorOptions(r.colorId)}</select>
          </div>
        </td>
        <td><input data-role="rarity-setCount" data-id="${r.id}" type="number" min="1" step="1" value="${Number(r.setCount || 1)}"></td>
        <td><button data-role="rarity-delete" data-id="${r.id}" ${idx === 0 ? "" : ""}>Remove</button></td>
      `;
      body.appendChild(tr);
    });

    const nudge = byId("rarityTabPrompt");
    if (nudge) {
      nudge.style.display = rarities.length > 0 ? "block" : "none";
      nudge.innerHTML = rarities.length > 0
        ? `<strong>${rarities.length} ${rarities.length === 1 ? "rarity" : "rarities"} defined for ${escapeHtml(editingSet?.name || "this set")}.</strong> Ready to configure packs? <button class="ghost" style="padding:0 4px;font-size:inherit;" id="goToPackEditorFromSetBtn">Go to Pack Editor &rarr;</button>`
        : "";
      const goBtn = byId("goToPackEditorFromSetBtn");
      if (goBtn) goBtn.addEventListener("click", () => setActiveTab("packEditor"));
    }
  }

  function renderPackBuilder() {
    syncPackConfiguration(state);
    const packSet = getPackSet(state);
    const rarities = packSet?.rarities || [];

    const card = byId("packBuilderCard");
    const grid = byId("packSlotGrid");
    const criteriaBody = byId("packCriteriaBody");
    const summary = byId("packSlotSummary");
    const hasRarities = rarities.length > 0;

    card.style.display = hasRarities ? "block" : "none";
    if (!hasRarities) {
      grid.innerHTML = "";
      criteriaBody.innerHTML = "";
      summary.innerHTML = "";
      return;
    }

    const composition = getPackComposition(state);
    const parts = rarities
      .map((r) => `${r.shortcode || r.name || "Unnamed"}: ${composition.countsByRarity[r.id] || 0}`)
      .filter(Boolean);
    parts.push(`Wildcard: ${composition.wildcardSlots}`);
    summary.innerHTML = statusLine(
      composition.unassignedSlots === 0 ? "ok" : "warn",
      `Pack layout summary: ${parts.join(" | ")}. ${composition.unassignedSlots > 0 ? `${composition.unassignedSlots} slot${composition.unassignedSlots === 1 ? " is" : "s are"} still unassigned.` : "All slots are assigned."}`
    );

    grid.innerHTML = "";
    state.pack.slotPlan.forEach((slot, index) => {
      const tile = document.createElement("div");
      tile.className = "slot-tile";
      const isWildcardSlot = slot === WILDCARD_SLOT_ID;
      const selectedRarity = rarities.find((r) => r.id === slot);
      if (selectedRarity) {
        tile.style.cssText = getRarityToneStyle(selectedRarity.colorId);
      } else if (isWildcardSlot) {
        tile.classList.add("wildcard-rainbow-tile");
      }
      const options = ['<option value="">Select...</option>']
        .concat(rarities.map((r) => `<option value="${r.id}" ${slot === r.id ? "selected" : ""}>${escapeHtml(r.name || r.shortcode || `Rarity ${index + 1}`)}</option>`))
        .concat([`<option value="${WILDCARD_SLOT_ID}" ${slot === WILDCARD_SLOT_ID ? "selected" : ""}>Wildcard</option>`])
        .join("");
      tile.innerHTML = `
        <strong class="${isWildcardSlot ? "wildcard-rainbow-label" : ""}" ${selectedRarity ? `style="${getRarityToneStyle(selectedRarity.colorId)}padding:2px 6px;border-radius:4px;"` : ""}>Card ${index + 1}</strong>
        <select class="${isWildcardSlot ? "wildcard-rainbow-control" : ""}" data-role="pack-slot" data-index="${index}" aria-label="Card ${index + 1} rarity selection">${options}</select>
      `;
      grid.appendChild(tile);
    });

    criteriaBody.innerHTML = "";
    rarities.forEach((r) => {
      const criteria = state.packCriteria[r.id] || makeDefaultPackCriteria();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="${getRarityToneStyle(r.colorId)}">${escapeHtml(r.name || r.shortcode)}</td>
        <td class="mono">${composition.countsByRarity[r.id] || 0}</td>
        <td><input data-role="criteria-minCopies" data-id="${r.id}" type="number" min="0" step="1" value="${Number(criteria.minCopies || 0)}"></td>
        <td><input data-role="criteria-overrideMin" data-id="${r.id}" type="number" min="0" step="1" value="${Number(criteria.overrideMin || 0)}"></td>
      `;
      criteriaBody.appendChild(tr);
    });
  }

  function renderWildcardEligibilityList() {
    const box = byId("wildcardEligibilityList");
    const composition = getPackComposition(state);
    const hasWildcards = composition.wildcardSlots > 0;
    const packSet = getPackSet(state);
    const rarities = packSet?.rarities || [];

    if (!hasWildcards) {
      box.innerHTML = "";
      return;
    }

    if (!rarities.length) {
      box.innerHTML = statusLine("warn", "Define rarities before setting wildcard eligibility.");
      return;
    }

    const items = rarities.map((r) => {
      const criteria = state.packCriteria[r.id] || makeDefaultPackCriteria();
      return `<label style="display:inline-flex;align-items:center;gap:6px;margin:0 12px 8px 0;padding:2px 8px;border-radius:4px;${getRarityToneStyle(r.colorId)}"><input data-role="wildcard-eligibility" data-id="${r.id}" type="checkbox" ${criteria.wildcardEligible ? "checked" : ""}> ${escapeHtml(r.name || r.shortcode)}</label>`;
    }).join("");

    box.innerHTML = `
      <div class="status ${rarities.some((r) => state.packCriteria[r.id]?.wildcardEligible) ? "ok" : "warn"}">
        <strong>Wildcard-eligible rarities</strong><br>
        ${items}
      </div>
    `;
  }

  function getWildcardRunningTotal() {
    const eligibles = (getPackSet(state)?.rarities || []).filter((r) => state.packCriteria[r.id]?.wildcardEligible);
    let sum = 0;
    let invalidCount = 0;
    let dirtyCount = 0;

    eligibles.forEach((r) => {
      const input = String(state.wildcardInputs[r.id] ?? "0/1");
      const parsed = parseProbabilityInput(input, "fraction");
      if (state.validationDraft.wildcardDirty[r.id]) {
        dirtyCount += 1;
      }
      if (parsed.ok) {
        sum += parsed.value;
      } else {
        invalidCount += 1;
      }
    });

    return {
      eligibleCount: eligibles.length,
      sum,
      remaining: 1 - sum,
      invalidCount,
      dirtyCount
    };
  }

  function renderWildcardFeedback() {
    const hasWildcards = getPackComposition(state).wildcardSlots > 0;
    const notice = byId("wildcardNotice");
    const total = byId("wildcardRunningTotal");

    if (!hasWildcards) {
      notice.innerHTML = "";
      total.innerHTML = "";
      return;
    }

    const progress = getWildcardRunningTotal();
    const sumText = progress.sum.toFixed(9);
    const remainingText = Math.abs(progress.remaining).toFixed(9);

    if (progress.eligibleCount === 0) {
      notice.innerHTML = statusLine("error", "Wildcard slots exist but no wildcard-eligible rarities are set.");
      total.innerHTML = statusLine("warn", "Running total: 0.000000000 of 1.000000000.");
      return;
    }

    total.innerHTML = statusLine(
      Math.abs(progress.remaining) <= TOLERANCE && progress.invalidCount === 0 ? "ok" : "warn",
      `Running total: ${sumText} of 1.000000000. ${progress.remaining >= 0 ? "Remaining" : "Over by"}: ${remainingText}.`
    );

    if (progress.invalidCount > 0 || progress.dirtyCount > 0) {
      const pendingBits = [];
      if (progress.invalidCount > 0) pendingBits.push(`${progress.invalidCount} invalid entr${progress.invalidCount === 1 ? "y" : "ies"}`);
      if (progress.dirtyCount > 0) pendingBits.push(`${progress.dirtyCount} field${progress.dirtyCount === 1 ? "" : "s"} still being edited`);
      notice.innerHTML = statusLine("pending", `Wildcard totals are live while you type. Final validation and recalculation run on blur. ${pendingBits.join(", ")}.`);
      return;
    }

    const validation = validateState(state, true);
    const sumErr = validation.errors.find((e) => e.key.startsWith("wildcard"));
    notice.innerHTML = sumErr
      ? statusLine("error", sumErr.msg)
      : statusLine("ok", "Wildcard probabilities are equal to 1.0 within tolerance.");
  }

  function computeWildcardLCD(eligibles) {
    let lcd = 1;
    for (const r of eligibles) {
      const input = state.wildcardInputs[r.id] ?? "0/1";
      const parsed = parseProbabilityInput(input, "fraction");
      if (!parsed.ok) continue;
      const frac = normalizeProbabilityToFraction(parsed.value);
      const g = gcd(lcd, frac.d);
      lcd = (lcd / g) * frac.d;
    }
    return lcd;
  }

  function renderWildcardTable() {
    const body = byId("wildcardBody");
    body.innerHTML = "";

    const eligibles = (getPackSet(state)?.rarities || []).filter((r) => state.packCriteria[r.id]?.wildcardEligible);
    const hasWildcards = getPackComposition(state).wildcardSlots > 0;
    byId("wildcardCard").style.display = hasWildcards ? "block" : "none";
    renderWildcardEligibilityList();

    if (!hasWildcards) {
      renderWildcardFeedback();
      return;
    }

    const lcd = computeWildcardLCD(eligibles);

    eligibles.forEach((r) => {
      if (state.wildcardInputs[r.id] == null) {
        state.wildcardInputs[r.id] = "0/1";
      }
      const input = String(state.wildcardInputs[r.id]);
      const parsed = parseProbabilityInput(input, "fraction");
      const parts = splitWildcardInputParts(input);
      const canonical = parsed.ok ? normalizeProbabilityToFraction(parsed.value) : null;
      const pending = !!state.validationDraft.wildcardDirty[r.id];
      const isPendingInvalid = !!state.validationDraft.wildcardPendingInvalid[r.id] || !parsed.ok;
      const pendingText = isPendingInvalid
        ? "Pending-invalid. Validate on blur or recalc."
        : "Pending. Validate on blur or recalc.";
      const isPinned = !!(state.ui.nudgePins?.[r.id]);

      const lcdNum = canonical ? Math.round(canonical.n * (lcd / canonical.d)) : 0;
      const reducedDisplay = canonical ? `${canonical.n}/${canonical.d}` : "-";
      const pct = canonical ? `${(canonical.n / canonical.d * 100).toFixed(1)}%` : "-";

      const tr = document.createElement("tr");
      if (isPinned) tr.classList.add("row-pinned");
      tr.innerHTML = `
        <td style="${getRarityToneStyle(r.colorId)}">${escapeHtml(r.name || r.shortcode)}</td>
        <td class="pin-col">
          <input type="checkbox" data-role="wildcard-pin" data-id="${r.id}" ${isPinned ? "checked" : ""} aria-label="Pin ${escapeHtml(r.name || r.shortcode)}">
        </td>
        <td>
          <div class="stacked-fraction">
            <div class="fraction-control">
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="num" data-dir="-1" data-id="${r.id}" data-lcd="${lcd}" title="Decrease numerator by 1">-</button>
              <input aria-label="${escapeHtml(r.name || r.shortcode)} numerator" data-role="wildcard-num" data-id="${r.id}" type="text" value="${escapeHtml(parts.numRaw)}" class="wildcard-num-input">
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="num" data-dir="1" data-id="${r.id}" data-lcd="${lcd}" title="Increase numerator by 1">+</button>
            </div>
            <div class="frac-bar"></div>
            <div class="fraction-control">
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="den" data-dir="-1" data-id="${r.id}" data-lcd="${lcd}" title="Decrease denominator by 1">-</button>
              <input aria-label="${escapeHtml(r.name || r.shortcode)} denominator" data-role="wildcard-den" data-id="${r.id}" type="text" value="${escapeHtml(parts.denRaw)}" class="wildcard-den-input">
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="den" data-dir="1" data-id="${r.id}" data-lcd="${lcd}" title="Increase denominator by 1">+</button>
            </div>
            <div class="frac-pct">${pct}</div>
          </div>
        </td>
        <td>
          <div class="stacked-fraction">
            <div class="fraction-control">
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="lcd-num" data-dir="-1" data-id="${r.id}" data-lcd="${lcd}" title="Decrease LCD numerator by 1 (step -1/${lcd})">-</button>
              <span class="mono lcd-part">${canonical ? lcdNum : "-"}</span>
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="lcd-num" data-dir="1" data-id="${r.id}" data-lcd="${lcd}" title="Increase LCD numerator by 1 (step +1/${lcd})">+</button>
            </div>
            <div class="frac-bar"></div>
            <div class="fraction-control">
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="lcd-den" data-dir="-1" data-id="${r.id}" data-lcd="${lcd}" title="Decrease LCD denominator by 1">-</button>
              <span class="mono lcd-part">${lcd}</span>
              <button class="tiny-btn" data-role="wildcard-nudge" data-field="lcd-den" data-dir="1" data-id="${r.id}" data-lcd="${lcd}" title="Increase LCD denominator by 1">+</button>
            </div>
            <div class="frac-pct">${canonical ? `${(lcdNum / lcd * 100).toFixed(1)}%` : "-"}</div>
          </div>
        </td>
        <td>
          <div class="stacked-fraction">
            <span class="mono lcd-part">${canonical ? canonical.n : "-"}</span>
            <div class="frac-bar"></div>
            <span class="mono lcd-part">${canonical ? canonical.d : "-"}</span>
            <div class="frac-pct">${pct}</div>
          </div>
        </td>
        <td>
          ${pending ? `<div class="status pending">${escapeHtml(pendingText)}</div>` : ""}
        </td>
      `;
      body.appendChild(tr);
    });

    renderWildcardFeedback();
  }

  function renderRules() {
    const box = byId("ruleList");
    box.innerHTML = "";
    state.rules.forEach((rule, idx) => {
      const div = document.createElement("div");
      div.className = "rule-row";
      div.dataset.ruleId = rule.id;
      const badges = [];
      const normalizedGroup = String(rule.group || DEFAULT_RULE_GROUP_BY_ID[rule.id] || "");
      if (normalizedGroup.includes("fp")) badges.push('<span class="pill fp">Choice 1</span>');
      if (normalizedGroup.includes("tc")) badges.push('<span class="pill tc">Choice 2</span>');
      const adviceText = DEFAULT_RULE_ADVICE_BY_ID[rule.id] || rule.advice || "";
      div.innerHTML = `
        <div class="txt">
          <div class="title">${idx + 1}. ${escapeHtml(rule.label)}</div>
          <div>${badges.join(" ")}</div>
          <div class="adv">${escapeHtml(adviceText)}</div>
        </div>
        <div class="rule-controls">
          <button data-role="rule-up" data-id="${rule.id}" aria-label="Move ${escapeHtml(rule.label)} up">Up</button>
          <button data-role="rule-down" data-id="${rule.id}" aria-label="Move ${escapeHtml(rule.label)} down">Down</button>
        </div>
      `;
      box.appendChild(div);
    });
  }

  function captureRuleRowTops() {
    const tops = new Map();
    byId("ruleList").querySelectorAll(".rule-row").forEach((row) => {
      const id = row.dataset.ruleId;
      if (!id) return;
      tops.set(id, row.getBoundingClientRect().top);
    });
    return tops;
  }

  function animateRuleReorder(previousTops) {
    const rows = Array.from(byId("ruleList").querySelectorAll(".rule-row"));
    rows.forEach((row) => {
      const id = row.dataset.ruleId;
      const oldTop = id ? previousTops.get(id) : undefined;
      if (oldTop == null) return;
      const newTop = row.getBoundingClientRect().top;
      const dy = oldTop - newTop;
      if (Math.abs(dy) < 0.5) return;
      row.style.willChange = "transform";

      if (typeof row.animate === "function") {
        const anim = row.animate(
          [
            { transform: `translateY(${dy}px)` },
            { transform: "translateY(0)" }
          ],
          {
            duration: 756,
            easing: "ease-in-out"
          }
        );
        anim.addEventListener("finish", () => {
          row.style.willChange = "";
        });
      } else {
        row.style.transition = "none";
        row.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          row.style.transition = "transform 756ms ease-in-out";
          row.style.transform = "translateY(0)";
          const cleanup = () => {
            row.style.transition = "";
            row.style.transform = "";
            row.style.willChange = "";
            row.removeEventListener("transitionend", cleanup);
          };
          row.addEventListener("transitionend", cleanup);
        });
      }
    });
  }

  function renderConfigTab() {
    byId("migrationNotice").innerHTML = state.ui.migrationNoticeHtml || "";
  }

  function renderFileTab() {
    byId("fileNameInput").value = String(state.ui.fileName || "pack-config.json");
    byId("reportFormat").value = String(state.ui.reportFormat || "html");
    const pathText = pinnedDirectoryHandle
      ? (pinnedFolderDisplayPath || getPinnedFolderDisplayPath(pinnedDirectoryHandle))
      : "No pinned folder";
    byId("pinnedFolderLabel").value = pathText;
    byId("pinnedFolderLabel").title = pathText;
    byId("pinnedFolderPathFull").textContent = pathText;
    const supported = !!window.showDirectoryPicker;
    byId("pickFolderBtn").disabled = !supported;
    byId("clearFolderBtn").disabled = !supported;

    if (!supported) {
      byId("filesLocalNotice").innerHTML = statusLine("error", "✗ Local file integration is limited in this browser. Using fallback mode only.");
      byId("fileModeNotice").innerHTML = statusLine("error", "✗ Full file mode unavailable. File System Access API is disabled; pin-folder actions are off.");
    } else {
      byId("filesLocalNotice").innerHTML = statusLine("ok", "✓ Local data mode active. File read/write stays on your device.");
      byId("fileModeNotice").innerHTML = statusLine("ok", "✓ Full file mode available. You can pin a folder.");
    }
  }

  function renderSummary(result) {
    const internals = byId("internals");
    const summary = byId("summary");

    if (!result.ok) {
      internals.innerHTML = statusLine("error", "Calculation blocked by validation errors.");
      summary.innerHTML = statusLine("warn", "Fix issues in the error panel to generate summary report.");
      byId("calcStatus").value = "Blocked";
      return;
    }

    byId("calcStatus").value = "Calculated";
    const rows = result.totals.rows;
    const rarityById = new Map((getPackSet(state)?.rarities || []).map((r) => [r.id, r]));
    const detailRows = rows.map((r) => `
      <tr>
        <td style="${getRarityToneStyle(rarityById.get(r.rarityId)?.colorId)}">${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.shortcode)}</td>
        <td>
          <div class="per-card-cell">
            <span class="mono per-card-value">${formatNumber(r.cards)}</span>
            <button class="tiny-btn" data-role="percard-nudge" data-dir="-1" data-rarity-id="${escapeHtml(r.rarityId)}" title="Lower card-count target by 1">-</button>
            <button class="tiny-btn" data-role="percard-nudge" data-dir="1" data-rarity-id="${escapeHtml(r.rarityId)}" title="Raise card-count target by 1">+</button>
            <label class="pin-wrap"><input type="checkbox" data-role="percard-pin" data-rarity-id="${escapeHtml(r.rarityId)}" ${state.ui.nudgePins?.[r.rarityId] ? "checked" : ""}> Pin</label>
          </div>
        </td>
        <td class="mono">${formatNumber(r.perCard)}</td>
        <td class="mono">${formatNumber(r.percent)}%</td>
      </tr>
    `).join("");

    internals.innerHTML = `
      <div class="status ok">Detailed internals reflect current rounding policy and priority order.</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th title="Rarity tier represented by this result row.">Rarity</th><th title="Short rarity code used in compact output.">Code</th><th title="Total cards allocated to this rarity for the current run.">Cards</th><th title="Average copies per individual card in this rarity.">Per Card</th><th title="Share of total printed cards produced by this rarity.">Yield %</th></tr></thead>
          <tbody>${detailRows}</tbody>
        </table>
      </div>
      <p class="hint">Total cards: <strong>${formatNumber(result.totals.totalCards)}</strong> across ${formatNumber(result.totals.totalPacks)} packs.</p>
    `;

    summary.innerHTML = `
      <div class="status ok">Summary report contract fields are available for export.</div>
      <ul>
        <li>Rarity table with totals and percentages</li>
        <li>Use +/- beside card counts to nudge by 1 card by redistributing wildcard ratios (run size stays fixed)</li>
        <li>Pack rules and wildcard rules (decimal + fraction, with approx marker when capped)</li>
        <li>Packaging parameters and total yield</li>
        <li>Per-card counts: ${state.run.perCardOverrideMode ? "included (override mode enabled)" : "omitted (override mode disabled)"}</li>
      </ul>
      <p><button class="ghost" id="goToFilesFromSummaryBtn" style="padding:4px 8px;">Go to Files Tab to Export Report &rarr;</button></p>
    `;

    const goToFilesBtn = byId("goToFilesFromSummaryBtn");
    if (goToFilesBtn) {
      goToFilesBtn.addEventListener("click", () => setActiveTab("files"));
    }
  }

  function renderErrors(validation) {
    const panel = byId("errorSummary");
    const all = validation.errors;
    const warns = validation.warnings;

    if (all.length === 0 && warns.length === 0) {
      panel.innerHTML = statusLine("ok", "No validation issues.");
      return;
    }

    const blocks = [];
    if (all.length) {
      blocks.push(`<div class="status error"><strong>Blocking issues</strong><ul>${all.map((e) => `<li>${escapeHtml(e.msg)} <button data-role="jump-error" data-key="${escapeHtml(e.key)}" class="ghost">Jump</button></li>`).join("")}</ul></div>`);
    }
    if (warns.length) {
      blocks.push(`<div class="status warn"><strong>Warnings</strong><ul>${warns.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul></div>`);
    }
    panel.innerHTML = blocks.join("");
  }

  function renderAll() {
    normalizeUiSettings(state);
    ensurePackSelections(state);
    syncPackConfiguration(state);
    renderTabs();
    renderLocales();
    renderSetSelectors();
    renderPackSelectors();
    const editingSet = getEditingSet(state);
    byId("setName").value = editingSet?.name || "";
    byId("setTotalCards").value = editingSet?.totalCards || "";
    byId("cardsPerPack").value = state.pack.cardsPerPack;
    byId("packsPerBox").value = state.pack.packsPerBox;
    byId("boxesPerCarton").value = state.pack.boxesPerCarton;
    byId("runPacks").value = state.run.packs;
    byId("roundingPolicy").value = state.run.roundingPolicy;
    byId("perCardOverrideMode").checked = !!state.run.perCardOverrideMode;
    state.ui.probInputMode = "fraction";
    byId("localeSelect").value = state.ui.locale;

    renderRarityTable();
    const packRarities = getPackSet(state)?.rarities || [];
    byId("emptyPrompt").style.display = packRarities.length > 0 ? "none" : "block";
    renderPackBuilder();
    renderWildcardTable();
    renderRules();
    renderConfigTab();
    renderFileTab();
    renderUndoRedo();

    const validation = validateState(state, true);
    renderErrors(validation);
  }

  function resolveFieldByErrorKey(key) {
    if (!key) return null;
    if (key === "packSet") return byId("packSetSelect");
    if (key === "cardsPerPack") return byId("cardsPerPack");
    if (key === "packaging") return byId("packsPerBox");
    if (key === "composition") return byId("cardsPerPack");
    if (key.startsWith("pack-slot:")) {
      const index = Number(key.split(":")[1]);
      return byId("packSlotGrid").querySelector(`select[data-role='pack-slot'][data-index='${index}']`);
    }
    if (key === "wildcard:sum") {
      const first = byId("wildcardBody").querySelector("input[data-role='wildcard-num']");
      return first || null;
    }
    if (key.startsWith("wildcard:")) {
      const id = key.split(":")[1];
      return byId("wildcardBody").querySelector(`input[data-role='wildcard-num'][data-id='${id}']`);
    }
    if (key.startsWith("rarity:")) {
      const [, idx, field] = key.split(":");
      const row = (getPackSet(state)?.rarities || [])[Number(idx)];
      if (!row) return null;
      const roleMap = {
        shortcode: "rarity-shortcode",
        name: "rarity-name",
        setCount: "rarity-setCount"
      };
      const role = roleMap[field] || "rarity-name";
      return byId("rarityBody").querySelector(`input[data-role='${role}'][data-id='${row.id}']`);
    }
    if (key.startsWith("criteria:")) {
      const [, id, field] = key.split(":");
      const roleMap = {
        minCopies: "criteria-minCopies",
        overrideMin: "criteria-overrideMin"
      };
      const role = roleMap[field];
      if (!role) return null;
      return byId("packCriteriaBody").querySelector(`input[data-role='${role}'][data-id='${id}']`);
    }
    return null;
  }

  function targetTabForErrorKey(key) {
    if (!key) return "calculator";
    if (key.startsWith("rarity:") || key === "rarities") return "rarities";
    if (key === "rules") return "rules";
    if (key === "packSet" || key === "cardsPerPack" || key === "packaging" || key === "composition") return "packEditor";
    if (key.startsWith("pack-slot:") || key.startsWith("criteria:") || key.startsWith("wildcard:")) return "packEditor";
    if (key === "wildcard") return "packEditor";
    return "calculator";
  }

  function focusAndPulseField(node) {
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    node.focus();
    node.classList.remove("error-pulse");
    void node.offsetWidth;
    node.classList.add("error-pulse");
    setTimeout(() => node.classList.remove("error-pulse"), 1300);
  }

  function jumpToErrorField(key) {
    if (!key) return;

    if (key.startsWith("rarity:") && state.ui.editingSetId !== state.pack.setId) {
      state.ui.editingSetId = state.pack.setId;
      renderAll();
    }

    const targetTab = targetTabForErrorKey(key);
    setActiveTab(targetTab);

    const node = resolveFieldByErrorKey(key);
    if (!node) return;
    focusAndPulseField(node);
  }

  /* === PERSISTENCE AND MIGRATION === */
  function persistState() {
    syncPackLibraryFromActive(state);
    state.metadata.timestamp = new Date().toISOString();
    state.metadata.appVersion = APP_VERSION;
    state.metadata.copyright = COPYRIGHT_LABEL;
    state.schemaVersion = SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadPersistedState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const migrated = migrateConfig(parsed);
      state = migrated.state;
      normalizeUiSettings(state);
      if (migrated.changes.length) {
        showGlobal(statusLine("warn", `Restored config with migration updates (${migrated.changes.length} fields).`));
      }
    } catch (_e) {
      showGlobal(statusLine("warn", "Stored state could not be restored; using defaults."));
    }
  }

  window.CCGMigration.init({
    makeDefaultState, makeDefaultSet, makeDefaultPack, clone,
    getPackSet, ensurePackSelections, syncPackLibraryFromActive, syncPackConfiguration,
    WILDCARD_SLOT_ID
  });
  const { migrateConfig } = window.CCGMigration;

  /* === REPORTING AND EXPORT === */
  function getReportPayloadBuilder() {
    return window.CCGReportPayload || null;
  }

  function buildReportPayload(result) {
    const builder = getReportPayloadBuilder();
    if (!builder || typeof builder.buildReportPayload !== "function") {
      return null;
    }

    return builder.buildReportPayload({
      state,
      result,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      constants: {
        FRACTION_DENOM_CAP,
        WILDCARD_SLOT_ID
      },
      helpers: {
        getPackRecordById,
        getPackSet,
        getPackComposition,
        parseProbabilityInput,
        toFractionApprox,
        makeDefaultPackCriteria
      }
    });
  }

  function getReportTemplates() {
    return window.CCGReportTemplates || null;
  }

  async function getStylesCssForExport() {
    if (cachedExportStylesCssText) {
      return cachedExportStylesCssText;
    }

    try {
      const response = await fetch("./styles.css", { cache: "no-store" });
      if (!response.ok) throw new Error(`styles.css fetch failed (${response.status})`);
      const css = await response.text();
      if (!css.trim()) throw new Error("styles.css is empty");
      cachedExportStylesCssText = css;
      return css;
    } catch (_fetchError) {
      const linkNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const stylesLink = linkNodes.find((node) => String(node.getAttribute("href") || "").includes("styles.css"));
      if (stylesLink && stylesLink.sheet) {
        try {
          const cssRules = Array.from(stylesLink.sheet.cssRules || []).map((rule) => rule.cssText).join("\n");
          if (cssRules.trim()) {
            cachedExportStylesCssText = cssRules;
            return cssRules;
          }
        } catch (_sheetError) {
          // Fall through to explicit error below if stylesheet rules are inaccessible.
        }
      }
    }

    throw new Error("Unable to load styles.css for inline export");
  }

  function downloadBlob(filename, type, data) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportReport() {
    const result = runCalculation(state);
    if (!result.ok) {
      renderErrors(result.validation);
      focusErrorSummary();
      return;
    }
    const payload = buildReportPayload(result);
    if (!payload) {
      showToast("error", "Report payload bundle failed to load. Refresh and try again.");
      return;
    }
    const templates = getReportTemplates();
    if (!templates || typeof templates.buildHtmlReport !== "function" || typeof templates.buildTextReport !== "function") {
      showToast("error", "Report template bundle failed to load. Refresh and try again.");
      return;
    }
    const format = String(state.ui.reportFormat || byId("reportFormat").value || "html");

    if (format === "json") {
      const out = JSON.stringify(payload, null, 2);
      downloadBlob("pack-report.json", "application/json", out);
      return;
    }

    if (format === "txt") {
      const out = templates.buildTextReport(payload);
      downloadBlob("pack-report.txt", "text/plain", out);
      return;
    }

    let inlineCssText = "";
    try {
      inlineCssText = await getStylesCssForExport();
    } catch (_cssError) {
      showToast("error", "Could not embed styles.css into report export. Refresh and try again.");
      return;
    }

    const html = templates.buildHtmlReport(payload, escapeHtml, { inlineCssText });
    downloadBlob("pack-report.html", "text/html", html);
  }

  /* === FILE I/O === */
  async function pickFolder() {
    if (!window.showDirectoryPicker) return;
    pinnedDirectoryHandle = await window.showDirectoryPicker();
    pinnedFolderDisplayPath = getPinnedFolderDisplayPath(pinnedDirectoryHandle);
    state.pinnedFolderReady = true;
    renderFileTab();
    persistState();
  }

  async function saveConfigFile() {
    const filename = String(state.ui.fileName || byId("fileNameInput").value || "pack-config.json").trim() || "pack-config.json";
    const data = JSON.stringify(state, null, 2);

    if (utf8ByteLength(data) > MAX_JSON_BYTES) {
      alert("Config exceeds max 5 MB UTF-8 byte size.");
      return;
    }

    if (window.showSaveFilePicker && !pinnedDirectoryHandle) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    }

    if (pinnedDirectoryHandle) {
      let exists = false;
      try {
        await pinnedDirectoryHandle.getFileHandle(filename, { create: false });
        exists = true;
      } catch (_e) {
        exists = false;
      }
      if (exists) {
        const proceed = window.confirm(`A file named ${filename} already exists in the pinned folder. Overwrite it?`);
        if (!proceed) return;
      }
      const fileHandle = await pinnedDirectoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      lastExplicitFileSyncHash = normalizedStateHash();
      return;
    }

    downloadBlob(filename, "application/json", data);
    lastExplicitFileSyncHash = normalizedStateHash();
  }

  async function openConfigFile() {
    if (!maybeConfirmUnsavedBeforeOpen()) return;
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
        multiple: false
      });
      if (!handle) return;
      const file = await handle.getFile();
      const text = await file.text();
      loadJsonString(text);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;
      const text = await input.files[0].text();
      loadJsonString(text);
    };
    input.click();
  }

  function loadJsonString(text) {
    if (utf8ByteLength(text) > MAX_JSON_BYTES) {
      alert("JSON payload exceeds 5 MB UTF-8 byte limit.");
      byId("configJson").value = "";
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_e) {
      alert("Malformed JSON. Input cleared.");
      byId("configJson").value = "";
      return;
    }

    if (Array.isArray(parsed.rarities) && parsed.rarities.length > MAX_RARITY_COUNT) {
      alert(`Rarity count exceeds limit (${MAX_RARITY_COUNT}).`);
      byId("configJson").value = "";
      return;
    }
    if (Array.isArray(parsed.sets) && parsed.sets.some((setDef) => Array.isArray(setDef.rarities) && setDef.rarities.length > MAX_RARITY_COUNT)) {
      alert(`A set contains more than ${MAX_RARITY_COUNT} rarities.`);
      byId("configJson").value = "";
      return;
    }

    let migrated;
    try {
      migrated = migrateConfig(parsed);
    } catch (_e) {
      alert("JSON could not be migrated safely. Input cleared.");
      byId("configJson").value = "";
      return;
    }

    state = migrated.state;
    const lines = migrated.changes.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
    state.ui.migrationNoticeHtml = migrated.changes.length
      ? `<div class="status warn"><strong>Migration changes (field-by-field)</strong><ul>${lines}</ul></div>`
      : statusLine("ok", "No migration changes required.");

    pushHistory("load-json");
    persistState();
    lastExplicitFileSyncHash = normalizedStateHash();
    renderAll();
    scheduleRecalc();
  }

  /* === EVENTS === */
  function bindEvents() {
    byId("tabWelcome").addEventListener("click", () => setActiveTab("welcome"));
    byId("tabRarities").addEventListener("click", () => setActiveTab("rarities"));
    byId("tabPackEditor").addEventListener("click", () => setActiveTab("packEditor"));
    byId("tabRules").addEventListener("click", () => setActiveTab("rules"));
    byId("tabCalculator").addEventListener("click", () => setActiveTab("calculator"));
    byId("tabConfig").addEventListener("click", () => setActiveTab("config"));
    byId("tabFiles").addEventListener("click", () => setActiveTab("files"));
    byId("goToRaritiesBtn").addEventListener("click", () => setActiveTab("rarities"));
    byId("goToPackEditorBtn").addEventListener("click", () => setActiveTab("packEditor"));
    byId("loadSetBtn").addEventListener("click", onLoadSet);
    byId("loadPackBtn").addEventListener("click", onLoadPack);
    byId("setPickerSelect").addEventListener("change", onSelectionDraftChange);
    byId("packPickerSelect").addEventListener("change", onSelectionDraftChange);
    byId("packSetSelect").addEventListener("change", onPackSetChange);
    byId("createSetBtn").addEventListener("click", onAddSet);
    byId("removeSetBtn").addEventListener("click", onRemoveSet);
    byId("createPackBtn").addEventListener("click", onAddPack);
    byId("removePackBtn").addEventListener("click", onRemovePack);
    byId("copyPackToNewBtn").addEventListener("click", onCopyPackToNew);
    byId("packName").addEventListener("input", onPackNameInput);
    byId("packName").addEventListener("blur", onPackNameCommit);
    ["setName", "setTotalCards"].forEach((id) => {
      byId(id).addEventListener("input", onSetInput);
      byId(id).addEventListener("blur", onSetInputCommit);
    });

    byId("addRarityBtn").addEventListener("click", () => {
      const editingSet = getEditingSet(state);
      ensureRarityColorsForSet(editingSet);
      const id = generateId("r");
      editingSet.rarities.push({
        id,
        name: "",
        shortcode: "",
        setCount: 1,
        colorId: pickMostDistinctRarityColor(editingSet.rarities.map((r) => r.colorId))
      });
      state.packCriteria[id] = makeDefaultPackCriteria();
      state.wildcardInputs[id] = "0/1";
      syncPackConfiguration(state);
      pushHistory("add-rarity");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("resetRaritiesBtn").addEventListener("click", () => {
      const editingSet = getEditingSet(state);
      editingSet.rarities.forEach((r) => {
        delete state.packCriteria[r.id];
        delete state.wildcardInputs[r.id];
      });
      editingSet.rarities = [];
      state.packCriteria = {};
      state.wildcardInputs = {};
      state.pack.slotPlan = state.pack.slotPlan.map(() => "");
      syncPackConfiguration(state);
      pushHistory("reset-rarities");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("rarityBody").addEventListener("input", onRarityInput);
    byId("rarityBody").addEventListener("change", onRarityInputCommit);
    byId("rarityBody").addEventListener("blur", onRarityInputCommit, true);
    byId("rarityBody").addEventListener("click", onRarityRowClick);
    byId("packSlotGrid").addEventListener("change", onPackSlotChange);
    byId("packCriteriaBody").addEventListener("input", onPackCriteriaInput);
    byId("packCriteriaBody").addEventListener("change", onPackCriteriaCommit);
    byId("packCriteriaBody").addEventListener("blur", onPackCriteriaCommit, true);
    byId("wildcardEligibilityList").addEventListener("change", onWildcardEligibilityChange);

    ["cardsPerPack", "packsPerBox", "boxesPerCarton", "runPacks"].forEach((id) => {
      byId(id).addEventListener("input", onPackInputLive);
      byId(id).addEventListener("blur", onPackInputCommit);
    });

    byId("roundingPolicy").addEventListener("change", (e) => {
      state.run.roundingPolicy = e.target.value;
      pushHistory("rounding-policy");
      persistState();
      scheduleRecalc();
    });

    byId("perCardOverrideMode").addEventListener("change", (e) => {
      state.run.perCardOverrideMode = e.target.checked;
      pushHistory("per-card-override-mode");
      persistState();
      scheduleRecalc();
    });

    byId("localeSelect").addEventListener("change", (e) => {
      state.ui.locale = e.target.value;
      pushHistory("locale");
      persistState();
      scheduleRecalc();
    });

    byId("fileNameInput").addEventListener("input", (e) => {
      state.ui.fileName = String(e.target.value || "");
      persistState();
    });

    byId("reportFormat").addEventListener("change", (e) => {
      state.ui.reportFormat = String(e.target.value || "html");
      persistState();
    });

    byId("wildcardBody").addEventListener("input", onWildcardTyping);
    byId("wildcardBody").addEventListener("blur", onWildcardCommit, true);
    byId("wildcardBody").addEventListener("click", onWildcardNudgeClick);
    byId("wildcardBody").addEventListener("change", onWildcardPinChange);
    byId("internals").addEventListener("click", onPerCardNudgeClick);
    byId("internals").addEventListener("change", onPerCardPinChange);
    byId("errorSummary").addEventListener("click", (e) => {
      const role = e.target.dataset.role;
      if (role !== "jump-error") return;
      const key = e.target.dataset.key;
      jumpToErrorField(key);
    });

    byId("snapToleranceBtn").addEventListener("click", snapToTolerance);

    byId("resetPackagingBtn").addEventListener("click", () => {
      state.pack.cardsPerPack = 10;
      state.pack.packsPerBox = 36;
      state.pack.boxesPerCarton = 6;
      state.pack.slotPlan = Array.from({ length: 10 }, () => "");
      syncPackConfiguration(state);
      pushHistory("reset-packaging");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("resetWildcardBtn").addEventListener("click", () => {
      (getPackSet(state)?.rarities || []).filter((r) => state.packCriteria[r.id]?.wildcardEligible).forEach((r) => {
        state.wildcardInputs[r.id] = "0/1";
        state.validationDraft.wildcardDirty[r.id] = false;
        state.validationDraft.wildcardPendingInvalid[r.id] = false;
      });
      pushHistory("reset-wildcards");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("ruleList").addEventListener("click", onRuleMove);

    byId("solveSmallest").addEventListener("click", () => {
      state.run.packs = state.pack.packsPerBox;
      pushHistory("solve-smallest");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("solveBox").addEventListener("click", () => {
      state.run.packs = state.pack.packsPerBox;
      pushHistory("solve-box");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("solveCarton").addEventListener("click", () => {
      state.run.packs = state.pack.packsPerBox * state.pack.boxesPerCarton;
      pushHistory("solve-carton");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("solveSnap").addEventListener("click", () => {
      const barrier = state.pack.packsPerBox * state.pack.boxesPerCarton;
      state.run.packs = Math.ceil(state.run.packs / barrier) * barrier;
      pushHistory("solve-snap");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("recalcBtn").addEventListener("click", () => scheduleRecalc(true));
    byId("undoBtn").addEventListener("click", undo);
    byId("redoBtn").addEventListener("click", redo);

    byId("resetAllBtn").addEventListener("click", () => {
      state = makeDefaultState();
      pushHistory("reset-all");
      persistState();
      renderAll();
      scheduleRecalc();
    });

    byId("generateJsonBtn").addEventListener("click", () => {
      byId("configJson").value = JSON.stringify(state, null, 2);
      setActiveTab("config");
    });

    byId("loadJsonBtn").addEventListener("click", () => {
      loadJsonString(byId("configJson").value);
    });

    byId("clearJsonBtn").addEventListener("click", () => {
      byId("configJson").value = "";
      state.ui.migrationNoticeHtml = "";
      byId("migrationNotice").innerHTML = "";
      persistState();
    });

    byId("copyJsonBtn").addEventListener("click", async () => {
      const text = byId("configJson").value;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const btn = byId("copyJsonBtn");
        btn.classList.add("icon-btn--ok");
        setTimeout(() => btn.classList.remove("icon-btn--ok"), 1500);
      } catch (_e) {
        alert("Clipboard write failed. Please copy the text manually.");
      }
    });

    byId("pasteJsonBtn").addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        byId("configJson").value = text;
        const btn = byId("pasteJsonBtn");
        btn.classList.add("icon-btn--ok");
        setTimeout(() => btn.classList.remove("icon-btn--ok"), 1500);
      } catch (_e) {
        alert("Clipboard read failed. Please paste the text manually.");
      }
    });

    byId("pickFolderBtn").addEventListener("click", async () => {
      try {
        await pickFolder();
      } catch (_e) {
        alert("Could not pick folder.");
      }
    });

    byId("clearFolderBtn").addEventListener("click", () => {
      pinnedDirectoryHandle = null;
      pinnedFolderDisplayPath = "";
      renderFileTab();
    });

    byId("saveConfigBtn").addEventListener("click", async () => {
      try {
        await saveConfigFile();
      } catch (_e) {
        alert("Save failed.");
      }
    });

    byId("openConfigBtn").addEventListener("click", async () => {
      try {
        await openConfigFile();
      } catch (_e) {
        alert("Open failed.");
      }
    });

    byId("exportReportBtn").addEventListener("click", exportReport);

    window.addEventListener("keydown", (e) => {
      const zKey = e.key.toLowerCase() === "z";
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && zKey && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (cmdOrCtrl && zKey && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    });
  }

  function onSelectionDraftChange() {
    persistState();
  }

  function onLoadSet() {
    state.ui.editingSetId = byId("setPickerSelect").value;
    ensureSetSelections(state);
    pushHistory("set-commit");
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onLoadPack() {
    syncPackLibraryFromActive(state);
    loadActivePackFromLibrary(state, byId("packPickerSelect").value);
    pushHistory("pack-select");
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onPackNameInput() {
    const activePack = getPackRecordById(state, state.ui.editingPackId);
    if (!activePack) return;
    activePack.name = byId("packName").value;
    persistState();
    renderPackSelectors();
    renderSetSelectors();
  }

  function onPackNameCommit() {
    pushHistory("pack-name-commit");
  }

  function onAddPack() {
    syncPackLibraryFromActive(state);
    const newPack = makeDefaultPack(state.pack.setId || state.sets[0].id);
    state.packs.push(newPack);
    loadActivePackFromLibrary(state, newPack.id);
    pushHistory("add-pack");
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onRemovePack() {
    syncPackLibraryFromActive(state);
    if (!Array.isArray(state.packs) || state.packs.length <= 1) return;
    const removeId = state.ui.editingPackId;
    state.packs = state.packs.filter((packDef) => packDef.id !== removeId);
    const nextId = state.packs[0].id;
    loadActivePackFromLibrary(state, nextId);
    pushHistory("remove-pack");
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onCopyPackToNew() {
    syncPackLibraryFromActive(state);
    const activePack = getPackRecordById(state, state.ui.editingPackId);
    if (!activePack) return;
    const targetSetId = byId("copyPackSetSelect").value || activePack.setId;
    const copy = normalizePackRecord({
      ...clone(activePack),
      id: generateId("pack"),
      name: activePack.name ? `${activePack.name} Copy` : "Copied Pack",
      setId: targetSetId
    }, targetSetId);
    remapPackRulesToSet(state, copy, activePack.setId, targetSetId);
    state.packs.push(copy);
    loadActivePackFromLibrary(state, copy.id);
    pushHistory("copy-pack");
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onPackSetChange(e) {
    state.pack.setId = e.target.value;
    syncPackConfiguration(state);
    sortPackSlotPlan(state);
    pushHistory("pack-set-change");
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onAddSet() {
    const setDef = makeDefaultSet();
    state.sets.push(setDef);
    state.ui.editingSetId = setDef.id;
    ensureSetSelections(state);
    pushHistory("add-set", { setLabel: setDef.name || "new set" });
    persistState();
    renderAll();
  }

  function onRemoveSet() {
    syncPackLibraryFromActive(state);
    if (state.sets.length <= 1) return;
    const editingSet = getEditingSet(state);
    const removedSetLabel = String(editingSet?.name || "active set").trim() || "active set";
    const removedSetId = editingSet.id;
    editingSet.rarities.forEach((r) => {
      delete state.packCriteria[r.id];
      delete state.wildcardInputs[r.id];
    });
    state.sets = state.sets.filter((setDef) => setDef.id !== editingSet.id);
    ensureSetSelections(state);
    const fallbackSetId = state.sets[0].id;
    state.packs.forEach((packDef) => {
      if (packDef.setId === removedSetId) {
        packDef.setId = fallbackSetId;
      }
    });
    state.pack.slotPlan = state.pack.slotPlan.map((slot) => (getPackSet(state)?.rarities || []).some((r) => r.id === slot) || slot === WILDCARD_SLOT_ID ? slot : "");
    syncPackConfiguration(state);
    syncPackLibraryFromActive(state);
    pushHistory("remove-set", { setLabel: removedSetLabel });
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onRarityInput(e) {
    const role = e.target.dataset.role;
    const id = e.target.dataset.id;
    if (!role || !id) return;
    const editingSet = getEditingSet(state);
    const rarity = editingSet.rarities.find((r) => r.id === id);
    if (!rarity) return;

    if (role === "rarity-name") rarity.name = e.target.value;
    if (role === "rarity-shortcode") rarity.shortcode = e.target.value;
    if (role === "rarity-setCount") rarity.setCount = Number(e.target.value || 0);
    if (role === "rarity-color" && isRarityColorId(e.target.value)) rarity.colorId = e.target.value;

    syncPackConfiguration(state);
  sortPackSlotPlan(state);
    persistState();
    renderRarityTable();
    renderPackBuilder();
    renderWildcardTable();
    scheduleRecalc();
  }

  function onSetInput() {
    const editingSet = getEditingSet(state);
    editingSet.name = byId("setName").value;
    editingSet.totalCards = Number(byId("setTotalCards").value || 0);
    persistState();
    renderSetSelectors();
    renderPackSelectors();
    renderRarityTable();
    scheduleRecalc();
  }

  function onSetInputCommit() {
    pushHistory("set-commit");
  }

  function onRarityInputCommit() {
    pushHistory("rarity-commit");
  }

  function onRarityRowClick(e) {
    const role = e.target.dataset.role;
    if (role !== "rarity-delete") return;
    const id = e.target.dataset.id;
    const editingSet = getEditingSet(state);
    const rarityToRemove = editingSet.rarities.find((r) => r.id === id);
    const rarityLabel = String(rarityToRemove?.shortcode || rarityToRemove?.name || id || "rarity").trim() || "rarity";
    editingSet.rarities = editingSet.rarities.filter((r) => r.id !== id);
    delete state.packCriteria[id];
    delete state.wildcardInputs[id];
    state.pack.slotPlan = state.pack.slotPlan.map((slot) => (slot === id ? "" : slot));
    syncPackConfiguration(state);
    sortPackSlotPlan(state);
    pushHistory("rarity-delete", { rarityLabel });
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onPackInputLive() {
    state.pack.cardsPerPack = Number(byId("cardsPerPack").value || 0);
    state.pack.packsPerBox = Number(byId("packsPerBox").value || 0);
    state.pack.boxesPerCarton = Number(byId("boxesPerCarton").value || 0);
    state.run.packs = Number(byId("runPacks").value || 0);
    syncPackConfiguration(state);
    sortPackSlotPlan(state);
    persistState();
    renderPackBuilder();
    renderWildcardTable();
    scheduleRecalc();
  }

  function onPackInputCommit() {
    pushHistory("pack-commit");
  }

  function onPackSlotChange(e) {
    const role = e.target.dataset.role;
    if (role !== "pack-slot") return;
    const index = Number(e.target.dataset.index);
    state.pack.slotPlan[index] = e.target.value;
    syncPackConfiguration(state);
    sortPackSlotPlan(state);
    pushHistory("pack-slot-change");
    persistState();
    renderPackBuilder();
    renderWildcardTable();
    scheduleRecalc();
  }

  function onPackCriteriaInput(e) {
    const role = e.target.dataset.role;
    const id = e.target.dataset.id;
    if (!role || !id || !state.packCriteria[id]) return;

    if (role === "criteria-minCopies") state.packCriteria[id].minCopies = Number(e.target.value || 0);
    if (role === "criteria-overrideMin") state.packCriteria[id].overrideMin = Number(e.target.value || 0);

    persistState();
    renderWildcardTable();
    scheduleRecalc();
  }

  function onPackCriteriaCommit() {
    pushHistory("pack-criteria-commit");
  }

  function onWildcardEligibilityChange(e) {
    const role = e.target.dataset.role;
    const id = e.target.dataset.id;
    if (role !== "wildcard-eligibility" || !id || !state.packCriteria[id]) return;

    state.packCriteria[id].wildcardEligible = e.target.checked;
    if (!e.target.checked) {
      state.wildcardInputs[id] = "0/1";
      state.validationDraft.wildcardDirty[id] = false;
      state.validationDraft.wildcardPendingInvalid[id] = false;
    }

    pushHistory("wildcard-eligibility", { rarityId: id, enabled: !!e.target.checked });
    persistState();
    renderWildcardTable();
    scheduleRecalc();
  }

  function setWildcardInputFromRow(id) {
    const numNode = byId("wildcardBody").querySelector(`input[data-role='wildcard-num'][data-id='${id}']`);
    const denNode = byId("wildcardBody").querySelector(`input[data-role='wildcard-den'][data-id='${id}']`);
    if (!numNode) return;
    state.wildcardInputs[id] = composeWildcardInput(numNode.value, denNode ? denNode.value : "");
  }

  function applyWildcardRedistribution(targetId, previousTargetProb) {
    const eligibles = (getPackSet(state)?.rarities || []).filter((r) => state.packCriteria[r.id]?.wildcardEligible);
    const targetRaw = state.wildcardInputs[targetId] ?? "0/1";
    const targetParsed = parseProbabilityInput(targetRaw, "fraction");
    if (!targetParsed.ok) {
      return { ok: false, message: "Nudge applied, but this row is now pending-invalid. Fix numerator/denominator before calculating." };
    }

    const delta = targetParsed.value - previousTargetProb;
    const pinned = state.ui.nudgePins || {};
    const donorRows = eligibles
      .filter((r) => r.id !== targetId && !pinned[r.id])
      .map((r) => {
        const parsed = parseProbabilityInput(state.wildcardInputs[r.id] ?? "0/1", "fraction");
        return { id: r.id, prob: parsed.ok ? parsed.value : 0 };
      });

    if (Math.abs(delta) <= TOLERANCE) {
      state.wildcardInputs[targetId] = normalizeProbabilityToFraction(targetParsed.value).text;
      state.validationDraft.wildcardDirty[targetId] = false;
      state.validationDraft.wildcardPendingInvalid[targetId] = false;
      return { ok: true };
    }

    if (!donorRows.length) {
      return { ok: false, message: "Nudge applied, but redistribution is impossible with current pins. Row is now pending-invalid." };
    }

    const next = new Map();
    next.set(targetId, targetParsed.value);

    if (delta > 0) {
      const donorTotal = donorRows.reduce((sum, row) => sum + row.prob, 0);
      if (donorTotal + TOLERANCE < delta) {
        return { ok: false, message: "Nudge applied, but unpinned donor mass is insufficient. Row is now pending-invalid." };
      }
      donorRows.forEach((row) => {
        const share = donorTotal > TOLERANCE ? row.prob / donorTotal : 0;
        next.set(row.id, row.prob - (delta * share));
      });
    } else {
      const amount = -delta;
      const donorRoom = donorRows.reduce((sum, row) => sum + (1 - row.prob), 0);
      if (donorRoom + TOLERANCE < amount) {
        return { ok: false, message: "Nudge applied, but no room remains to absorb the shift. Row is now pending-invalid." };
      }
      donorRows.forEach((row) => {
        const room = 1 - row.prob;
        const share = donorRoom > TOLERANCE ? room / donorRoom : 0;
        next.set(row.id, row.prob + (amount * share));
      });
    }

    const adjustedIds = [targetId].concat(donorRows.map((row) => row.id));
    let adjustedSum = 0;
    adjustedIds.forEach((id) => {
      const value = next.get(id);
      if (!Number.isFinite(value) || value < -TOLERANCE || value > 1 + TOLERANCE) {
        adjustedSum = Number.NaN;
        return;
      }
      adjustedSum += value;
    });
    if (!Number.isFinite(adjustedSum)) {
      return { ok: false, message: "Nudge applied, but redistribution created invalid values. Row is pending-invalid." };
    }

    // Total checks must include pinned rows too; only adjusted rows are mutable.
    const eligibleProbById = new Map();
    eligibles.forEach((r) => {
      const parsed = parseProbabilityInput(state.wildcardInputs[r.id] ?? "0/1", "fraction");
      eligibleProbById.set(r.id, parsed.ok ? parsed.value : 0);
    });

    let totalAfter = 0;
    eligibles.forEach((r) => {
      const value = next.has(r.id) ? next.get(r.id) : eligibleProbById.get(r.id);
      if (!Number.isFinite(value) || value < -TOLERANCE || value > 1 + TOLERANCE) {
        totalAfter = Number.NaN;
        return;
      }
      totalAfter += value;
    });
    if (!Number.isFinite(totalAfter)) {
      return { ok: false, message: "Nudge applied, but redistribution created invalid values. Row is pending-invalid." };
    }

    const remainder = 1 - totalAfter;
    if (Math.abs(remainder) > TOLERANCE) {
      const rebalanceId = donorRows.length ? donorRows[0].id : targetId;
      const baseValue = next.has(rebalanceId) ? next.get(rebalanceId) : (eligibleProbById.get(rebalanceId) || 0);
      const rebalanceValue = baseValue + remainder;
      if (rebalanceValue < -TOLERANCE || rebalanceValue > 1 + TOLERANCE) {
        return { ok: false, message: "Nudge applied, but final rebalance failed. Row is now pending-invalid." };
      }
      next.set(rebalanceId, rebalanceValue);
    }

    adjustedIds.forEach((id) => {
      const clamped = Math.min(1, Math.max(0, next.get(id) || 0));
      state.wildcardInputs[id] = normalizeProbabilityToFraction(clamped).text;
      state.validationDraft.wildcardDirty[id] = false;
      state.validationDraft.wildcardPendingInvalid[id] = false;
    });
    return { ok: true };
  }

  function onWildcardTyping(e) {
    const role = e.target.dataset.role;
    if (!["wildcard-input", "wildcard-num", "wildcard-den"].includes(role)) return;
    const id = e.target.dataset.id;
    if (!id) return;
    if (role === "wildcard-input") {
      state.wildcardInputs[id] = e.target.value;
    } else {
      setWildcardInputFromRow(id);
    }
    state.validationDraft.wildcardDirty[id] = true;
    state.validationDraft.wildcardPendingInvalid[id] = false;
    persistState();
    renderWildcardFeedback();
  }

  function onWildcardCommit(e) {
    const role = e.target.dataset.role;
    if (!["wildcard-input", "wildcard-num", "wildcard-den"].includes(role)) return;
    const id = e.target.dataset.id;
    if (!id) return;

    if (role !== "wildcard-input") {
      setWildcardInputFromRow(id);
    }

    state.wildcardInputs[id] = trimLeadingZerosSafe(state.wildcardInputs[id], "fraction");
    const parsed = parseProbabilityInput(state.wildcardInputs[id], "fraction");
    if (!parsed.ok) {
      state.validationDraft.wildcardDirty[id] = true;
      state.validationDraft.wildcardPendingInvalid[id] = true;
      persistState();
      renderWildcardTable();
      scheduleRecalc();
      return;
    }

    // Leave the user's entered fraction as-is; just clear pending flags.
    state.validationDraft.wildcardDirty[id] = false;
    state.validationDraft.wildcardPendingInvalid[id] = false;
    pushHistory("wildcard-commit", { rarityId: id });
    persistState();
    renderWildcardTable();
    scheduleRecalc();
  }

  function onWildcardNudgeClick(e) {
    const role = e.target.dataset.role;
    if (role !== "wildcard-nudge") return;
    const id = e.target.dataset.id;
    const field = e.target.dataset.field;
    const dir = Number(e.target.dataset.dir);
    if (!id || !["num", "den", "lcd-num", "lcd-den"].includes(field) || !Number.isFinite(dir) || ![-1, 1].includes(dir)) return;

    const lcd = Number(e.target.dataset.lcd);
    if (!lcd || lcd < 1) return;

    if (!state.ui.nudgePins || typeof state.ui.nudgePins !== "object") {
      state.ui.nudgePins = {};
    }
    if (state.ui.nudgePins[id]) {
      showToast("error", "This rarity is pinned. Unpin before nudging.");
      return;
    }

    const parsedBefore = parseProbabilityInput(state.wildcardInputs[id] ?? "0/1", "fraction");
    const before = parsedBefore.ok ? parsedBefore.value : 0;
    const fracBefore = parsedBefore.ok ? normalizeProbabilityToFraction(before) : { n: 0, d: 1 };

    let newProb;
    if (field === "num") {
      const nextN = fracBefore.n + dir;
      if (nextN < 0) {
        showToast("error", "Numerator cannot go below 0.");
        return;
      }
      state.wildcardInputs[id] = `${nextN}/${fracBefore.d}`;
      newProb = nextN / fracBefore.d;
    } else if (field === "den") {
      const nextD = fracBefore.d + dir;
      if (nextD < 1) {
        showToast("error", "Denominator cannot go below 1.");
        return;
      }
      state.wildcardInputs[id] = `${fracBefore.n}/${nextD}`;
      newProb = fracBefore.n / nextD;
    } else if (field === "lcd-num") {
      const lcdNum = Math.round(before * lcd);
      const newLcdNum = lcdNum + dir;
      newProb = newLcdNum / lcd;
      state.wildcardInputs[id] = normalizeProbabilityToFraction(Math.min(1, Math.max(0, newProb))).text;
    } else {
      // lcd-den: change the shared denominator for this row's probability
      const lcdNum = Math.round(before * lcd);
      const newDen = lcd + dir;
      if (newDen < 1) {
        showToast("error", "LCD denominator cannot go below 1.");
        return;
      }
      newProb = lcdNum / newDen;
      state.wildcardInputs[id] = normalizeProbabilityToFraction(Math.min(1, Math.max(0, newProb))).text;
    }

    if (newProb < -TOLERANCE || newProb > 1 + TOLERANCE) {
      showToast("error", `Nudge would push the value outside [0, 1].`);
      return;
    }

    state.validationDraft.wildcardDirty[id] = true;
    state.validationDraft.wildcardPendingInvalid[id] = false;

    const redistribute = applyWildcardRedistribution(id, before);
    if (!redistribute.ok) {
      state.validationDraft.wildcardPendingInvalid[id] = true;
      showToast("error", redistribute.message);
    }

    pushHistory("wildcard-nudge", { rarityId: id, direction: dir, field });
    persistState();
    renderWildcardTable();
    scheduleRecalc();
  }

  function onWildcardPinChange(e) {
    const role = e.target.dataset.role;
    if (role !== "wildcard-pin") return;
    const id = e.target.dataset.id;
    if (!id) return;

    if (!state.ui.nudgePins || typeof state.ui.nudgePins !== "object") {
      state.ui.nudgePins = {};
    }
    state.ui.nudgePins[id] = !!e.target.checked;
    pushHistory("wildcard-pin", { rarityId: id, pinned: !!e.target.checked });
    persistState();
    renderWildcardTable();
  }

  function onRuleMove(e) {
    const role = e.target.dataset.role;
    const id = e.target.dataset.id;
    if (!role || !id) return;

    const idx = state.rules.findIndex((r) => r.id === id);
    if (idx < 0) return;

    const previousTops = captureRuleRowTops();
    const movedRuleLabel = String(state.rules[idx]?.label || "priority rule");
    let moved = false;

    if (role === "rule-up" && idx > 0) {
      const tmp = state.rules[idx - 1];
      state.rules[idx - 1] = state.rules[idx];
      state.rules[idx] = tmp;
      moved = true;
    }
    if (role === "rule-down" && idx < state.rules.length - 1) {
      const tmp = state.rules[idx + 1];
      state.rules[idx + 1] = state.rules[idx];
      state.rules[idx] = tmp;
      moved = true;
    }

    if (!moved) return;

    pushHistory("rule-reorder", { direction: role === "rule-up" ? "up" : "down", ruleLabel: movedRuleLabel });
    persistState();
    renderRules();
    animateRuleReorder(previousTops);
    scheduleRecalc();
  }

  function snapToTolerance() {
    const eligibles = (getPackSet(state)?.rarities || []).filter((r) => state.packCriteria[r.id]?.wildcardEligible);
    if (!eligibles.length) return;

    const parsedRows = eligibles.map((r, idx) => {
      const p = parseProbabilityInput(state.wildcardInputs[r.id] || "0/1", "fraction");
      return { rarity: r, idx, value: p.ok ? p.value : 0, valid: p.ok };
    });

    const sum = parsedRows.reduce((s, row) => s + row.value, 0);
    const remainder = 1 - sum;

    parsedRows.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.idx - b.idx;
    });

    const target = parsedRows[0];
    const nextValue = target.value + remainder;
    if (nextValue < -TOLERANCE || nextValue > 1 + TOLERANCE) {
      alert("Snap to Tolerance could not apply safely to the highest-probability row.");
      return;
    }

    state.wildcardInputs[target.rarity.id] = normalizeProbabilityToFraction(nextValue).text;

    pushHistory("snap-tolerance");
    persistState();
    renderWildcardTable();
    scheduleRecalc();
  }

  function focusErrorSummary() {
    byId("errorSummary").focus();
  }

  function getPerCardForRunPacks(rarityId, packs) {
    if (!Number.isFinite(packs) || packs < 1) return null;
    const trial = clone(state);
    trial.run.packs = Math.max(1, Math.round(packs));
    const result = runCalculation(trial);
    if (!result.ok) return null;
    const row = result.totals.rows.find((r) => r.rarityId === rarityId);
    return row ? row.perCard : null;
  }

  function findRunPacksForPerCardNudge(rarityId, targetPerCard, direction) {
    const basePacks = Math.max(1, Math.round(Number(state.run.packs || 1)));
    const currentPerCard = getPerCardForRunPacks(rarityId, basePacks);
    if (!Number.isFinite(currentPerCard)) return null;

    if (direction > 0) {
      let low = basePacks + 1;
      let high = Math.max(low, Math.ceil(basePacks * (targetPerCard / Math.max(currentPerCard, TOLERANCE))));
      let highVal = getPerCardForRunPacks(rarityId, high);
      let guard = 0;
      while (Number.isFinite(highVal) && highVal + TOLERANCE < targetPerCard && high < 1000000 && guard < 24) {
        high *= 2;
        highVal = getPerCardForRunPacks(rarityId, high);
        guard += 1;
      }
      if (!Number.isFinite(highVal) || highVal + TOLERANCE < targetPerCard) return null;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const midVal = getPerCardForRunPacks(rarityId, mid);
        if (!Number.isFinite(midVal)) return null;
        if (midVal + TOLERANCE >= targetPerCard) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }
      return low;
    }

    let low = 1;
    let high = Math.max(1, basePacks - 1);
    if (high < 1) return null;

    const lowVal = getPerCardForRunPacks(rarityId, low);
    if (!Number.isFinite(lowVal)) return null;
    if (lowVal - TOLERANCE > targetPerCard) return null;

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const midVal = getPerCardForRunPacks(rarityId, mid);
      if (!Number.isFinite(midVal)) return null;
      if (midVal - TOLERANCE <= targetPerCard) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return low;
  }

  function onPerCardNudgeClick(e) {
    const role = e.target.dataset.role;
    if (role !== "percard-nudge") return;

    const rarityId = e.target.dataset.rarityId;
    const direction = Number(e.target.dataset.dir);
    if (!rarityId || !Number.isFinite(direction) || ![-1, 1].includes(direction)) return;

    const current = runCalculation(state);
    if (!current.ok) {
      renderErrors(current.validation);
      focusErrorSummary();
      return;
    }

    const row = current.totals.rows.find((r) => r.rarityId === rarityId);
    if (!row) return;

    const composition = getPackComposition(state);
    const wildcardSlots = Number(composition.wildcardSlots || 0);
    if (wildcardSlots < 1) {
      alert("Per-card nudging requires at least one wildcard slot so ratios can be redistributed.");
      return;
    }

    const packSet = getPackSet(state);
    const rarities = packSet?.rarities || [];
    const rarityById = Object.fromEntries(rarities.map((r) => [r.id, r]));
    const targetRarity = rarityById[rarityId];
    if (!targetRarity) return;

    const targetCriteria = state.packCriteria[rarityId] || makeDefaultPackCriteria();
    if (!targetCriteria.wildcardEligible) {
      alert("Per-card nudging can only adjust wildcard-eligible rarities.");
      return;
    }

    const pins = state.ui.nudgePins || {};
    if (pins[rarityId]) {
      alert("This rarity is pinned. Unpin it before nudging.");
      return;
    }

    const donorIds = rarities
      .filter((r) => {
        if (r.id === rarityId) return false;
        if (pins[r.id]) return false;
        const criteria = state.packCriteria[r.id] || makeDefaultPackCriteria();
        return !!criteria.wildcardEligible;
      })
      .map((r) => r.id);

    if (!donorIds.length) {
      alert("No unpinned wildcard-eligible rarities are available to absorb that nudge.");
      return;
    }

    const runPacks = Math.max(1, Number(state.run.packs || 1));
    const slotMass = wildcardSlots * runPacks;
    const cardStep = 1 * direction;
    const probDelta = cardStep / Math.max(slotMass, TOLERANCE);

    const targetInput = state.wildcardInputs[rarityId] ?? "0/1";
    const targetParsed = parseProbabilityInput(targetInput, "fraction");
    const targetProb = targetParsed.ok ? targetParsed.value : 0;
    const nextTargetProb = targetProb + probDelta;

    if (nextTargetProb < -TOLERANCE || nextTargetProb > 1 + TOLERANCE) {
      showToast("error", "That nudge would move wildcard probability outside 0-1.");
      return;
    }

    const donorParsed = donorIds.map((id) => {
      const parsed = parseProbabilityInput(state.wildcardInputs[id] ?? "0/1", "fraction");
      return { id, prob: parsed.ok ? parsed.value : 0 };
    });
    const donorTotal = donorParsed.reduce((sum, d) => sum + d.prob, 0);
    if (donorTotal <= TOLERANCE) {
      alert("No donor probability is available among unpinned rarities to apply this nudge.");
      return;
    }

    const nextProbs = new Map();
    nextProbs.set(rarityId, nextTargetProb);
    let invalid = false;
    donorParsed.forEach((d) => {
      const share = d.prob / donorTotal;
      const nextProb = d.prob - (probDelta * share);
      if (nextProb < -TOLERANCE || nextProb > 1 + TOLERANCE) invalid = true;
      nextProbs.set(d.id, nextProb);
    });

    if (invalid) {
      showToast("error", "Nudge would push a wildcard donor probability outside 0-1.");
      return;
    }

    nextProbs.forEach((prob, id) => {
      const clamped = Math.min(1, Math.max(0, prob));
      state.wildcardInputs[id] = normalizeProbabilityToFraction(clamped).text;
      state.validationDraft.wildcardDirty[id] = false;
    });

    pushHistory("nudge-per-card", { rarityId, direction });
    persistState();
    renderAll();
    scheduleRecalc();
  }

  function onPerCardPinChange(e) {
    const role = e.target.dataset.role;
    if (role !== "percard-pin") return;
    const rarityId = e.target.dataset.rarityId;
    if (!rarityId) return;
    if (!state.ui.nudgePins || typeof state.ui.nudgePins !== "object") {
      state.ui.nudgePins = {};
    }
    state.ui.nudgePins[rarityId] = !!e.target.checked;
    persistState();
  }

  /* === CALC SCHEDULER === */
  function scheduleRecalc(forceFocusErrors = false) {
    const token = ++calcToken;
    byId("calcStatus").value = "Calculating...";

    queueMicrotask(() => {
      if (token !== calcToken) return;
      const result = runCalculation(state);
      renderErrors(result.validation || validateState(state, true));
      renderSummary(result);
      if (forceFocusErrors && !result.ok) {
        focusErrorSummary();
      }
      persistState();
    });
  }

  /* === TABS AND ALERTS === */
  function setActiveTab(tab) {
    state.ui.activeTab = tab;
    renderTabs();
    persistState();
  }

  function showGlobal(html) {
    byId("globalAlert").innerHTML = html;
  }

  function showToast(type, text, durationMs = 2800) {
    let host = byId("toastHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "toastHost";
      host.className = "toast-host";
      host.setAttribute("aria-live", "polite");
      host.setAttribute("aria-atomic", "false");
      document.body.appendChild(host);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = String(text || "");
    host.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 180);
    }, Math.max(600, Number(durationMs) || 2800));
  }

  function checkFeaturesOnce() {
    const alreadyAlerted = localStorage.getItem(STORAGE_ALERT_KEY) === "1";
    if (alreadyAlerted) return;
    const missing = [];
    if (!window.localStorage) missing.push("localStorage");
    if (!window.showDirectoryPicker) missing.push("File System Access API");
    if (missing.length) {
      showGlobal(statusLine("warn", `Limited feature mode: ${missing.join(", ")} unavailable.`));
    } else {
      showGlobal(statusLine("ok", "All optional browser features are available."));
    }
    localStorage.setItem(STORAGE_ALERT_KEY, "1");
    localStorage.setItem(STORAGE_PINNED_DIR_KEY, String(!!window.showDirectoryPicker));
  }

  function applyLicenseGate() {
    const overlay  = byId("licenseOverlay");
    const header   = byId("appHeader");
    const main     = byId("appMain");
    const accepted = !!state.ui.notices?.licenseAcknowledged || localStorage.getItem(STORAGE_LICENSE_KEY) === "1";
    if (accepted) {
      overlay.hidden = true;
      header.removeAttribute("inert");
      main.removeAttribute("inert");
    } else {
      overlay.hidden = false;
      header.setAttribute("inert", "");
      main.setAttribute("inert", "");
      overlay.querySelector("#licensePersonalBtn").focus();
    }
  }

  function bindLicenseGate() {
    const overlay     = byId("licenseOverlay");
    const personalBtn = byId("licensePersonalBtn");
    const buyLink     = byId("licenseBuyLink");
    const footerLink  = byId("footerLicenseLink");
    if (!overlay || !personalBtn || !buyLink) return;

    // Wire mailto href on both the modal link and the footer link
    buyLink.href  = LICENSE_MAILTO;
    if (footerLink) footerLink.href = LICENSE_MAILTO;

    personalBtn.addEventListener("click", () => {
      if (!state.ui.notices || typeof state.ui.notices !== "object") state.ui.notices = {};
      state.ui.notices.licenseAcknowledged = true;
      localStorage.setItem(STORAGE_LICENSE_KEY, "1");
      persistState();
      applyLicenseGate();
    });

    // "Buy a License" opens the mailto but does NOT dismiss the overlay —
    // the user must still click "Personal Use" or reload after purchase.
  }

  function applyGdprNoticeVisibility() {
    const banner = byId("gdprNoticeBanner");
    if (!banner) return;
    const dismissed = !!state.ui.notices?.gdprDismissed || localStorage.getItem(STORAGE_GDPR_BANNER_KEY) === "1";
    banner.hidden = dismissed;
  }

  function bindGdprNoticeDismiss() {
    const banner = byId("gdprNoticeBanner");
    const btn = byId("acceptGdprNoticeBtn");
    if (!banner || !btn) return;
    btn.addEventListener("click", () => {
      banner.hidden = true;
      if (!state.ui.notices || typeof state.ui.notices !== "object") state.ui.notices = {};
      state.ui.notices.gdprDismissed = true;
      localStorage.setItem(STORAGE_GDPR_BANNER_KEY, "1");
      persistState();
    });
  }

  function applyPrivacyNoticeVisibility() {
    const banner = byId("privacyNoticeBanner");
    if (!banner) return;
    const dismissed = !!state.ui.notices?.privacyDismissed || localStorage.getItem(STORAGE_PRIVACY_BANNER_KEY) === "1";
    banner.hidden = dismissed;
  }

  function bindPrivacyNoticeDismiss() {
    const banner = byId("privacyNoticeBanner");
    const btn = byId("dismissPrivacyNoticeBtn");
    if (!banner || !btn) return;
    btn.addEventListener("click", () => {
      banner.hidden = true;
      if (!state.ui.notices || typeof state.ui.notices !== "object") state.ui.notices = {};
      state.ui.notices.privacyDismissed = true;
      localStorage.setItem(STORAGE_PRIVACY_BANNER_KEY, "1");
      persistState();
    });
  }

  /* === INITIALIZATION === */
  function initialize() {
    loadPersistedState();
    renderAll();
    bindEvents();
    bindLicenseGate();
    applyLicenseGate();
    bindPrivacyNoticeDismiss();
    applyPrivacyNoticeVisibility();
    bindGdprNoticeDismiss();
    applyGdprNoticeVisibility();

    byId("showBannersBtn").addEventListener("click", () => {
      if (!state.ui.notices || typeof state.ui.notices !== "object") state.ui.notices = {};
      state.ui.notices.privacyDismissed = false;
      state.ui.notices.gdprDismissed = false;
      state.ui.notices.licenseAcknowledged = false;
      const banners = [
        { el: byId("privacyNoticeBanner"), key: STORAGE_PRIVACY_BANNER_KEY },
        { el: byId("gdprNoticeBanner"),    key: STORAGE_GDPR_BANNER_KEY },
          { el: byId("licenseOverlay"),      key: STORAGE_LICENSE_KEY },
      ];
      banners.forEach(({ el, key }) => {
        if (!el) return;
        el.hidden = false;
        localStorage.removeItem(key);
      });
      persistState();
        // Re-apply the license gate so inert is restored on header/main
        applyLicenseGate();
    });
    checkFeaturesOnce();
    pushHistory("init");
    scheduleRecalc();
  }

  initialize();
  