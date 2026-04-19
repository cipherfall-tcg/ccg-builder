(() => {
  "use strict";

  let _ctx = null;

  function truncateForUi(value) {
    const s = typeof value === "string" ? value : JSON.stringify(value);
    if (s.length <= 120) return s;
    return `${s.slice(0, 117)}...`;
  }

  function readFromState(obj, path) {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function migrateConfig(input) {
    const {
      makeDefaultState, makeDefaultSet, makeDefaultPack, clone,
      getPackSet, ensurePackSelections, syncPackLibraryFromActive, syncPackConfiguration,
      WILDCARD_SLOT_ID
    } = _ctx;

    const changes = [];
    const next = makeDefaultState();

    function assign(path, value) {
      const parts = path.split(".");
      let target = next;
      for (let i = 0; i < parts.length - 1; i += 1) target = target[parts[i]];
      target[parts[parts.length - 1]] = value;
    }

    function read(path) {
      const parts = path.split(".");
      let cur = input;
      for (const p of parts) {
        if (cur == null || !(p in cur)) return undefined;
        cur = cur[p];
      }
      return cur;
    }

    const paths = [
      "sets", "packs", "ui.editingSetId", "ui.editingPackId",
      "ui.activeTab", "ui.locale", "ui.probInputMode", "ui.nudgePins",
      "pack.setId", "pack.cardsPerPack", "pack.packsPerBox", "pack.boxesPerCarton", "pack.slotPlan",
      "run.packs", "run.roundingPolicy", "rules", "rarities", "packCriteria", "wildcardInputs", "validationDraft"
    ];

    paths.forEach((path) => {
      const oldVal = read(path);
      if (oldVal !== undefined) {
        assign(path, oldVal);
      }
    });

    if (!Array.isArray(next.sets) || next.sets.length === 0) {
      const legacySet = makeDefaultSet();
      legacySet.name = read("set.name") || "";
      legacySet.totalCards = Number(read("set.totalCards") || 0);
      legacySet.rarities = Array.isArray(read("rarities")) ? clone(read("rarities")) : [];
      next.sets = [legacySet];
      next.ui.editingSetId = legacySet.id;
      next.pack.setId = legacySet.id;
    }
    if (!next.validationDraft || typeof next.validationDraft !== "object") next.validationDraft = { wildcardDirty: {}, wildcardPendingInvalid: {} };
    if (!next.validationDraft.wildcardDirty || typeof next.validationDraft.wildcardDirty !== "object") next.validationDraft.wildcardDirty = {};
    if (!next.validationDraft.wildcardPendingInvalid || typeof next.validationDraft.wildcardPendingInvalid !== "object") next.validationDraft.wildcardPendingInvalid = {};
    if (!Array.isArray(next.packs) || next.packs.length === 0) {
      const legacyPack = makeDefaultPack(next.pack?.setId || next.sets[0].id);
      legacyPack.cardsPerPack = Number(next.pack.cardsPerPack || legacyPack.cardsPerPack);
      legacyPack.packsPerBox = Number(next.pack.packsPerBox || legacyPack.packsPerBox);
      legacyPack.boxesPerCarton = Number(next.pack.boxesPerCarton || legacyPack.boxesPerCarton);
      legacyPack.slotPlan = Array.isArray(next.pack.slotPlan) ? clone(next.pack.slotPlan) : legacyPack.slotPlan;
      legacyPack.packCriteria = clone(next.packCriteria || {});
      legacyPack.wildcardInputs = clone(next.wildcardInputs || {});
      next.packs = [legacyPack];
      next.ui.editingPackId = legacyPack.id;
    }
    if (!read("pack.slotPlan")) {
      const legacyWildcardSlots = Number(read("pack.wildcardSlots") || 0);
      const legacySlots = [];
      const legacyPackSet = getPackSet(next);
      (legacyPackSet?.rarities || []).forEach((r) => {
        const fixed = Number(r.fixedSlots || 0);
        for (let i = 0; i < fixed; i += 1) legacySlots.push(r.id);
        next.packCriteria[r.id] = {
          wildcardEligible: !!r.wildcardEligible,
          minCopies: Number(r.minCopies || 0),
          overrideMin: Number(r.overrideMin || 0)
        };
      });
      for (let i = 0; i < legacyWildcardSlots; i += 1) legacySlots.push(WILDCARD_SLOT_ID);
      next.pack.slotPlan = legacySlots.slice(0, Number(next.pack.cardsPerPack || 0));
    }
    ensurePackSelections(next);
    syncPackLibraryFromActive(next);
    syncPackConfiguration(next);
    if (!next.ui.nudgePins || typeof next.ui.nudgePins !== "object") next.ui.nudgePins = {};

    paths.forEach((path) => {
      const before = read(path);
      const after = readFromState(next, path);
      const beforeStr = before === undefined ? "<missing>" : truncateForUi(before);
      const afterStr = after === undefined ? "<missing>" : truncateForUi(after);
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push(`${path}: ${beforeStr} -> ${afterStr}`);
      }
    });

    return { state: next, changes };
  }

  window.CCGMigration = {
    init(ctx) { _ctx = ctx; },
    migrateConfig
  };
})();
