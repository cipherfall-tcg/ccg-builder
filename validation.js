(() => {
  "use strict";

  let _ctx = null;

  function validateState(sourceState, strictMode = true) {
    const {
      ensurePackSelections, syncPackConfiguration,
      getPackSet, getPackComposition, makeDefaultPackCriteria,
      parseProbabilityInput, TOLERANCE, MAX_RARITY_COUNT
    } = _ctx;

    ensurePackSelections(sourceState);
    syncPackConfiguration(sourceState);
    const packSet = getPackSet(sourceState);
    const rarities = packSet?.rarities || [];

    const errors = [];
    const warnings = [];

    if (!packSet) {
      errors.push({ key: "packSet", msg: "Associate the pack to a set before calculating." });
      return { errors, warnings };
    }

    if (!String(packSet.name || "").trim()) {
      errors.push({ key: "packSet", msg: "The selected pack set must have a name." });
    }
    if (Number(packSet.totalCards || 0) < 1) {
      errors.push({ key: "packSet", msg: "The selected pack set must define a total card count." });
    }

    if (rarities.length === 0) {
      errors.push({ key: "rarities", msg: "Add at least one rarity." });
    }
    if (rarities.length > MAX_RARITY_COUNT) {
      errors.push({ key: "rarities", msg: `Rarity count exceeds max ${MAX_RARITY_COUNT}.` });
    }

    const seen = new Map();
    rarities.forEach((r, i) => {
      const s = String(r.shortcode || "").trim().toUpperCase();
      if (!s) errors.push({ key: `rarity:${i}:shortcode`, msg: `Rarity ${i + 1} shortcode is required.` });
      if (seen.has(s)) {
        errors.push({ key: `rarity:${i}:shortcode`, msg: `Duplicate shortcode "${s}".` });
      } else {
        seen.set(s, true);
      }
      if (!r.name || !String(r.name).trim()) errors.push({ key: `rarity:${i}:name`, msg: `Rarity ${i + 1} name is required.` });
      if (Number(r.setCount) < 1) errors.push({ key: `rarity:${i}:setCount`, msg: `Rarity ${i + 1} set cards must be >= 1.` });
    });

    const raritySetTotal = rarities.reduce((sum, r) => sum + Number(r.setCount || 0), 0);
    if (Number(packSet.totalCards || 0) >= 1 && raritySetTotal !== Number(packSet.totalCards)) {
      errors.push({ key: "packSet", msg: `Rarity set-card totals (${raritySetTotal}) must equal total cards in the selected set (${packSet.totalCards}).` });
    }

    if (sourceState.pack.cardsPerPack < 1 || sourceState.pack.cardsPerPack > 15) {
      errors.push({ key: "cardsPerPack", msg: "Cards per pack must be 1-15." });
    }
    if (sourceState.pack.packsPerBox < 1 || sourceState.pack.boxesPerCarton < 1) {
      errors.push({ key: "packaging", msg: "Packaging values must be >= 1." });
    }
    if (sourceState.pack.packsPerBox < 6 || sourceState.pack.packsPerBox > 36) {
      warnings.push("Packs per box is outside recommended 6-36 range.");
    }
    if (sourceState.pack.boxesPerCarton < 2 || sourceState.pack.boxesPerCarton > 6) {
      warnings.push("Boxes per carton is outside recommended 2-6 range.");
    }

    const composition = getPackComposition(sourceState);
    if (composition.totalSlots !== Number(sourceState.pack.cardsPerPack)) {
      errors.push({ key: "composition", msg: `Pack slot count (${composition.totalSlots}) must equal cards per pack (${sourceState.pack.cardsPerPack}).` });
    }
    if (composition.unassignedSlots > 0) {
      const firstUnassigned = sourceState.pack.slotPlan.findIndex((slot) => !slot);
      errors.push({ key: `pack-slot:${firstUnassigned}`, msg: `Assign all pack slots before calculating. ${composition.unassignedSlots} slot${composition.unassignedSlots === 1 ? " is" : "s are"} still unassigned.` });
    }

    rarities.forEach((r) => {
      const criteria = sourceState.packCriteria[r.id] || makeDefaultPackCriteria();
      if (Number(criteria.minCopies) < 0) {
        errors.push({ key: `criteria:${r.id}:minCopies`, msg: `${r.name || r.shortcode}: rarity min copies cannot be negative.` });
      }
      if (Number(criteria.overrideMin) < 0) {
        errors.push({ key: `criteria:${r.id}:overrideMin`, msg: `${r.name || r.shortcode}: per-card override minimum cannot be negative.` });
      }
    });

    if (composition.wildcardSlots > 0) {
      const eligibles = rarities.filter((r) => sourceState.packCriteria[r.id]?.wildcardEligible);
      if (eligibles.length === 0) {
        errors.push({ key: "wildcard", msg: "Wildcard slots exist but no wildcard-eligible rarities are set." });
      }

      let sum = 0;
      let parseBlocked = false;
      for (const r of eligibles) {
        const input = sourceState.wildcardInputs[r.id] ?? "0/1";
        const parsed = parseProbabilityInput(input, "fraction");
        if (!parsed.ok) {
          if (strictMode) {
            errors.push({ key: `wildcard:${r.id}`, msg: `${r.name || r.shortcode}: ${parsed.error}` });
            parseBlocked = true;
          }
          continue;
        }
        sum += parsed.value;
      }

      if (!parseBlocked && Math.abs(sum - 1) > TOLERANCE) {
        errors.push({ key: "wildcard:sum", msg: `Wildcard probabilities must be equal to 1.0 within tolerance. Current sum: ${sum.toFixed(9)}` });
      }
    }

    return { errors, warnings };
  }

  window.CCGValidation = {
    init(ctx) { _ctx = ctx; },
    validateState
  };
})();
