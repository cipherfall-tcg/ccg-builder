(() => {
  "use strict";

  function inferRarityTier(rarity) {
    const raw = `${rarity?.name || ""} ${rarity?.shortcode || ""}`.toLowerCase();
    if (raw.includes("legend")) return "legendary";
    if (raw.includes("elite")) return "elite";
    if (raw.includes("rare")) return "rare";
    if (raw.includes("uncommon") || raw.includes("unc")) return "uncommon";
    if (raw.includes("common") || raw.includes("com")) return "common";
    return "other";
  }

  function getSetPolicyChecks(packSet) {
    const rarities = packSet?.rarities || [];
    const tierCounts = { common: 0, uncommon: 0, rare: 0, elite: 0, legendary: 0, other: 0 };

    rarities.forEach((r) => {
      const tier = inferRarityTier(r);
      tierCounts[tier] += Number(r.setCount || 0);
    });

    const eliteOk = tierCounts.elite >= 2;
    const legendaryOk = tierCounts.legendary >= 1;
    const checks = [
      { label: "Set contains at least 2 Elite cards", ok: eliteOk, detail: `Detected Elite cards: ${tierCounts.elite}` },
      { label: "Set contains at least 1 Legendary card", ok: legendaryOk, detail: `Detected Legendary cards: ${tierCounts.legendary}` }
    ];

    return { tierCounts, checks };
  }

  function getPolicyReferenceData() {
    return {
      dimensions: {
        pack: { size: "2.6 x 3.6 x 0.12 in", weight: "12-14 g" },
        box: { size: "7.5 x 5.0 x 2.75 in", weight: "1.0-1.2 lb" },
        carton: { size: "18 x 14 x 12 in", weight: "6-7 lb" }
      },
      costEstimate: {
        perPack: "$0.35-$0.55",
        perBox: "$13-$20",
        perCarton: "$80-$120",
        perCard: "$0.04-$0.06"
      },
      msrpReference: {
        pack: "$3.00",
        box: "$105.00",
        carton: "$620.00"
      }
    };
  }

  function buildReportPayload(ctx) {
    const {
      state,
      result,
      appVersion,
      schemaVersion,
      constants,
      helpers
    } = ctx;

    const {
      FRACTION_DENOM_CAP,
      WILDCARD_SLOT_ID
    } = constants;

    const {
      getPackRecordById,
      getPackSet,
      getPackComposition,
      parseProbabilityInput,
      toFractionApprox,
      makeDefaultPackCriteria
    } = helpers;

    const activePack = getPackRecordById(state, state.ui.editingPackId);
    const packSet = getPackSet(state);
    const packRarities = packSet?.rarities || [];
    const rarityById = Object.fromEntries(packRarities.map((r) => [r.id, r]));
    const rarityMap = Object.fromEntries(packRarities.map((r) => [r.id, r]));
    const composition = getPackComposition(state);

    const wildcardRows = packRarities
      .filter((r) => state.packCriteria[r.id]?.wildcardEligible)
      .map((r) => {
        const raw = state.wildcardInputs[r.id] || "0";
        const parsed = parseProbabilityInput(raw, state.ui.probInputMode);
        const value = parsed.ok ? parsed.value : 0;
        const frac = toFractionApprox(value, FRACTION_DENOM_CAP);
        return {
          rarity: r.name,
          shortcode: r.shortcode,
          input: raw,
          decimal: value,
          fraction: `${frac.n}/${frac.d}`,
          approx: frac.approx
        };
      });

    const fixedCountsByRarity = Object.entries(composition.countsByRarity || {}).map(([rarityId, count]) => {
      const rarity = rarityById[rarityId] || {};
      return {
        rarity: String(rarity.name || "").trim() || "Unnamed Rarity",
        shortcode: String(rarity.shortcode || "").trim() || "",
        count: Number(count || 0)
      };
    });

    const criteriaByRarity = packRarities.map((r) => {
      const criteria = state.packCriteria[r.id] || makeDefaultPackCriteria();
      return {
        rarity: String(r.name || "").trim() || "Unnamed Rarity",
        shortcode: String(r.shortcode || "").trim() || "",
        wildcardEligible: !!criteria.wildcardEligible,
        minCopies: Number(criteria.minCopies || 0),
        overrideMin: Number(criteria.overrideMin || 0)
      };
    });

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        appVersion,
        schemaVersion
      },
      report: {
        pack: {
          id: activePack?.id || "",
          name: activePack?.name || ""
        },
        set: {
          id: packSet?.id || "",
          name: packSet?.name || "",
          totalCards: packSet?.totalCards || 0,
          rarityTotal: packRarities.reduce((sum, r) => sum + Number(r.setCount || 0), 0)
        },
        rarityTable: result.ok ? result.totals.rows : [],
        perCardCounts: result.ok && state.run.perCardOverrideMode
          ? result.totals.rows.map((r) => ({ shortcode: r.shortcode, perCard: r.perCard }))
          : [],
        wildcardRules: wildcardRows,
        packRules: {
          cardsPerPack: state.pack.cardsPerPack,
          slotPlan: state.pack.slotPlan.map((slot) => {
            if (slot === WILDCARD_SLOT_ID) return "Wildcard";
            if (!slot) return "Unassigned";
            const rarity = rarityMap[slot];
            if (!rarity) return "Unassigned";
            const name = String(rarity.name || "").trim();
            const code = String(rarity.shortcode || "").trim();
            return name && code ? `${name} (${code})` : (name || code || "Unassigned");
          }),
          slotPlanLabels: state.pack.slotPlan.map((slot) => {
            if (slot === WILDCARD_SLOT_ID) return "Wildcard";
            if (!slot) return "Unassigned";
            const rarity = rarityMap[slot];
            return rarity ? (rarity.shortcode || rarity.name) : "Unassigned";
          }),
          wildcardSlots: composition.wildcardSlots,
          fixedCountsByRarity,
          criteriaByRarity
        },
        packaging: {
          packsPerBox: state.pack.packsPerBox,
          boxesPerCarton: state.pack.boxesPerCarton,
          packsPerCarton: state.pack.packsPerBox * state.pack.boxesPerCarton,
          cardsPerBox: state.pack.cardsPerPack * state.pack.packsPerBox,
          cardsPerCarton: state.pack.cardsPerPack * state.pack.packsPerBox * state.pack.boxesPerCarton
        },
        policy: {
          setChecks: getSetPolicyChecks(packSet),
          reference: getPolicyReferenceData()
        },
        totals: result.ok ? {
          totalCards: result.totals.totalCards,
          totalPacks: result.totals.totalPacks
        } : null,
        priorities: state.rules.map((r, i) => ({ rank: i + 1, id: r.id, label: r.label }))
      }
    };
  }

  window.CCGReportPayload = {
    buildReportPayload
  };
})();
