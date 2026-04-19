(() => {
  "use strict";

  let _ctx = null;

  function runCalculation(activeState) {
    const {
      ensurePackSelections, syncPackConfiguration,
      validateState, getPackSet, getPackComposition,
      parseProbabilityInput, makeDefaultPackCriteria
    } = _ctx;

    ensurePackSelections(activeState);
    syncPackConfiguration(activeState);
    const validation = validateState(activeState, true);
    if (validation.errors.length) {
      return { ok: false, validation };
    }
    const packSet = getPackSet(activeState);
    const rarities = packSet?.rarities || [];

    const packs = Number(activeState.run.packs);
    const composition = getPackComposition(activeState);
    const wildcardSlots = composition.wildcardSlots;
    const fixedTotals = {};
    const expectedByRarity = {};
    const perCard = {};

    rarities.forEach((r) => {
      const fixed = Number(composition.countsByRarity[r.id] || 0) * packs;
      fixedTotals[r.id] = fixed;
      expectedByRarity[r.id] = fixed;
    });

    if (wildcardSlots > 0) {
      const wildcardCardsTotal = wildcardSlots * packs;
      const eligibles = rarities.filter((r) => activeState.packCriteria[r.id]?.wildcardEligible);

      const weighted = eligibles.map((r, idx) => {
        const p = parseProbabilityInput(activeState.wildcardInputs[r.id] || "0/1", "fraction");
        const prob = p.ok ? p.value : 0;
        const expected = prob * wildcardCardsTotal;
        return { id: r.id, idx, prob, expected, rounded: Math.floor(expected), frac: expected - Math.floor(expected) };
      });

      const floorTotal = weighted.reduce((s, w) => s + w.rounded, 0);
      let remaining = wildcardCardsTotal - floorTotal;

      if (activeState.run.roundingPolicy === "drift") {
        weighted.forEach((w) => {
          w.rounded = Math.round(w.expected);
        });
        const sumRounded = weighted.reduce((s, w) => s + w.rounded, 0);
        remaining = wildcardCardsTotal - sumRounded;
      }

      if (remaining !== 0) {
        const sorted = weighted.slice().sort((a, b) => {
          if (remaining > 0 && b.frac !== a.frac) return b.frac - a.frac;
          if (remaining < 0 && a.frac !== b.frac) return a.frac - b.frac;
          return a.idx - b.idx;
        });

        let i = 0;
        while (remaining !== 0 && i < sorted.length * 10) {
          const target = sorted[i % sorted.length];
          if (remaining > 0) {
            target.rounded += 1;
            remaining -= 1;
          } else if (target.rounded > 0) {
            target.rounded -= 1;
            remaining += 1;
          }
          i += 1;
        }
      }

      if (activeState.run.roundingPolicy === "strict") {
        const byId = Object.fromEntries(rarities.map((r) => [r.id, r]));
        weighted.forEach((w) => {
          const rarity = byId[w.id];
          const criteria = activeState.packCriteria[w.id] || makeDefaultPackCriteria();
          const minCopies = activeState.run.perCardOverrideMode ? Number(criteria.overrideMin || 0) : Number(criteria.minCopies || 0);
          const minTotal = minCopies * Number(rarity.setCount || 1);
          const requiredWildcard = Math.max(0, minTotal - fixedTotals[w.id]);
          if (w.rounded >= requiredWildcard) {
            return;
          }
          let needed = requiredWildcard - w.rounded;
          const donors = weighted
            .filter((d) => d.id !== w.id && d.rounded > 0)
            .sort((a, b) => {
              if (b.rounded !== a.rounded) return b.rounded - a.rounded;
              return a.idx - b.idx;
            });
          for (const donor of donors) {
            if (needed <= 0) break;
            const transfer = Math.min(needed, donor.rounded);
            donor.rounded -= transfer;
            w.rounded += transfer;
            needed -= transfer;
          }
        });
      }

      weighted.forEach((w) => {
        expectedByRarity[w.id] += w.rounded;
      });
    }

    rarities.forEach((r) => {
      perCard[r.id] = expectedByRarity[r.id] / Number(r.setCount || 1);
    });

    const totalCards = Object.values(expectedByRarity).reduce((s, v) => s + v, 0);

    const rows = rarities.map((r) => {
      const total = expectedByRarity[r.id];
      const percent = totalCards > 0 ? (total / totalCards) * 100 : 0;
      return {
        rarityId: r.id,
        name: r.name,
        shortcode: r.shortcode,
        cards: total,
        perCard: perCard[r.id],
        percent
      };
    });

    return {
      ok: true,
      validation,
      totals: {
        totalCards,
        totalPacks: packs,
        perRarity: expectedByRarity,
        rows
      }
    };
  }

  window.CCGCalculator = {
    init(ctx) { _ctx = ctx; },
    runCalculation
  };
})();
