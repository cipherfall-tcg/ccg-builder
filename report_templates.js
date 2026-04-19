(() => {
  "use strict";

  function buildHtmlReport(payload, escapeHtml, options = {}) {
    const setChecks = payload.report.policy.setChecks;
    const ref = payload.report.policy.reference;
    const inlineCssText = typeof options.inlineCssText === "string" ? options.inlineCssText : "";
    const safeInlineCss = inlineCssText.replace(/<\/style/gi, "<\\/style");

    const rarityRows = payload.report.rarityTable.map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.shortcode)}</td>
        <td>${escapeHtml(String(row.cards))}</td>
        <td>${escapeHtml(Number(row.perCard).toFixed(4))}</td>
        <td>${escapeHtml(Number(row.percent).toFixed(4))}%</td>
      </tr>
    `).join("");

    const wildcardRows = payload.report.wildcardRules.map((row) => `
      <tr>
        <td>${escapeHtml(row.rarity)}</td>
        <td>${escapeHtml(row.shortcode)}</td>
        <td>${escapeHtml(row.input)}</td>
        <td>${escapeHtml(Number(row.decimal).toFixed(9))}</td>
        <td>${escapeHtml(row.fraction)}${row.approx ? " (approx)" : ""}</td>
      </tr>
    `).join("");

    const packRecipeRows = (payload.report.packRules.fixedCountsByRarity || []).map((row) => {
      const label = row.shortcode ? `${row.rarity} (${row.shortcode})` : row.rarity;
      return `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td>${escapeHtml(String(row.count))}</td>
      </tr>
    `;
    }).join("");

    const setCheckRows = (setChecks.checks || []).map((check) => `
      <tr>
        <td>${escapeHtml(check.label)}</td>
        <td class="status-${check.ok ? "pass" : "review"}">${check.ok ? "PASS" : "REVIEW"}</td>
        <td>${escapeHtml(check.detail)}</td>
      </tr>
    `).join("");

    const priorityRows = payload.report.priorities.map((row) => `<li>${row.rank}. ${escapeHtml(row.label)}</li>`).join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#06070f">
  <title>CCG Builder Report</title>
  <style>${safeInlineCss}</style>
</head>
<body class="report-page">
  <h1>CCG Builder Report</h1>
  <section>
    <div class="meta">
      <div><div class="k">Pack</div><div class="v">${escapeHtml(payload.report.pack.name || "Untitled Pack")}</div></div>
      <div><div class="k">Set</div><div class="v">${escapeHtml(payload.report.set.name)}</div></div>
      <div><div class="k">Set Card Count</div><div class="v">${escapeHtml(String(payload.report.set.totalCards))}</div></div>
      <div><div class="k">Run Size</div><div class="v">${escapeHtml(String(payload.report.totals.totalPacks))} packs</div></div>
      <div><div class="k">Total Printed Cards</div><div class="v">${escapeHtml(String(payload.report.totals.totalCards))}</div></div>
      <div><div class="k">Cards per Pack</div><div class="v">${escapeHtml(String(payload.report.packRules.cardsPerPack))}</div></div>
      <div><div class="k">Packs per Box</div><div class="v">${escapeHtml(String(payload.report.packaging.packsPerBox))}</div></div>
      <div><div class="k">Boxes per Carton</div><div class="v">${escapeHtml(String(payload.report.packaging.boxesPerCarton))}</div></div>
      <div><div class="k">Generated</div><div class="v">${escapeHtml(payload.metadata.timestamp)}</div></div>
      <div><div class="k">App Version</div><div class="v">${escapeHtml(payload.metadata.appVersion)}</div></div>
    </div>
  </section>

  <section>
    <h2>Booster Pack and Packaging Structure</h2>
    <div class="subgrid">
      <div>
        <h3>Pack Recipe Snapshot</h3>
        <table>
          <thead><tr><th>Rarity</th><th>Fixed Slots per Pack</th></tr></thead>
          <tbody>${packRecipeRows || '<tr><td colspan="2">No fixed rarity slots configured.</td></tr>'}</tbody>
        </table>
        <p class="note">Wildcard slots per pack: ${escapeHtml(String(payload.report.packRules.wildcardSlots))}</p>
      </div>
      <div>
        <h3>Packaging Hierarchy</h3>
        <table>
          <tbody>
            <tr><th>Cards per Pack</th><td>${escapeHtml(String(payload.report.packRules.cardsPerPack))}</td></tr>
            <tr><th>Packs per Box</th><td>${escapeHtml(String(payload.report.packaging.packsPerBox))}</td></tr>
            <tr><th>Boxes per Carton</th><td>${escapeHtml(String(payload.report.packaging.boxesPerCarton))}</td></tr>
            <tr><th>Packs per Carton</th><td>${escapeHtml(String(payload.report.packaging.packsPerCarton))}</td></tr>
            <tr><th>Cards per Box</th><td>${escapeHtml(String(payload.report.packaging.cardsPerBox))}</td></tr>
            <tr><th>Cards per Carton</th><td>${escapeHtml(String(payload.report.packaging.cardsPerCarton))}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section>
    <h2>Rarity Totals</h2>
    <table>
      <thead><tr><th>Rarity</th><th>Code</th><th>Cards</th><th>Per Card</th><th>Yield %</th></tr></thead>
      <tbody>${rarityRows}</tbody>
    </table>
  </section>
  <section>
    <h2>Wildcard Rules</h2>
    <table>
      <thead><tr><th>Rarity</th><th>Code</th><th>Input</th><th>Decimal</th><th>Fraction</th></tr></thead>
      <tbody>${wildcardRows || '<tr><td colspan="5">No wildcard rules configured.</td></tr>'}</tbody>
    </table>
  </section>
  <section>
    <h2>Pack Definition and Wildcard Distribution</h2>
    <p><strong>Cards per pack:</strong> ${escapeHtml(String(payload.report.packRules.cardsPerPack))}</p>
    <p><strong>Slot plan:</strong> ${escapeHtml(payload.report.packRules.slotPlanLabels.join(", "))}</p>
    <p><strong>Wildcard slots:</strong> ${escapeHtml(String(payload.report.packRules.wildcardSlots))}</p>
    <p><strong>Packs per box:</strong> ${escapeHtml(String(payload.report.packaging.packsPerBox))}</p>
    <p><strong>Boxes per carton:</strong> ${escapeHtml(String(payload.report.packaging.boxesPerCarton))}</p>
    <p><strong>Packs per carton:</strong> ${escapeHtml(String(payload.report.packaging.packsPerCarton))}</p>
  </section>

  <section>
    <h2>Set Policy Checks</h2>
    <table>
      <thead><tr><th>Rule</th><th>Status</th><th>Detail</th></tr></thead>
      <tbody>${setCheckRows}</tbody>
    </table>
    <p class="note">Checks are evaluated against current set rarity data and policy baseline targets for Elite and Legendary minimums.</p>
  </section>

  <section>
    <h2>Policy Reference Snapshot</h2>
    <div class="subgrid">
      <div>
        <h3>Physical Specs (Reference)</h3>
        <table>
          <thead><tr><th>Unit</th><th>Approx. Size</th><th>Approx. Weight</th></tr></thead>
          <tbody>
            <tr><td>Booster Pack</td><td>${escapeHtml(ref.dimensions.pack.size)}</td><td>${escapeHtml(ref.dimensions.pack.weight)}</td></tr>
            <tr><td>Booster Box</td><td>${escapeHtml(ref.dimensions.box.size)}</td><td>${escapeHtml(ref.dimensions.box.weight)}</td></tr>
            <tr><td>Master Carton</td><td>${escapeHtml(ref.dimensions.carton.size)}</td><td>${escapeHtml(ref.dimensions.carton.weight)}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>Cost and MSRP References</h3>
        <table>
          <tbody>
            <tr><th>Estimated Cost per Pack</th><td>${escapeHtml(ref.costEstimate.perPack)}</td></tr>
            <tr><th>Estimated Cost per Box</th><td>${escapeHtml(ref.costEstimate.perBox)}</td></tr>
            <tr><th>Estimated Cost per Carton</th><td>${escapeHtml(ref.costEstimate.perCarton)}</td></tr>
            <tr><th>Estimated Cost per Card</th><td>${escapeHtml(ref.costEstimate.perCard)}</td></tr>
            <tr><th>MSRP per Pack</th><td>${escapeHtml(ref.msrpReference.pack)}</td></tr>
            <tr><th>MSRP per Box</th><td>${escapeHtml(ref.msrpReference.box)}</td></tr>
            <tr><th>MSRP per Carton</th><td>${escapeHtml(ref.msrpReference.carton)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="note">Reference values above mirror policy guidance and should be reviewed against current vendor quotes and release strategy.</p>
  </section>

  <section>
    <h2>Priority Rules</h2>
    <ol>${priorityRows}</ol>
  </section>
</body>
</html>`;
  }

  function buildTextReport(payload) {
    const lines = [];
    lines.push("CCG Builder Report");
    lines.push(`Set: ${payload.report.set.name}`);
    lines.push(`Set total cards: ${payload.report.set.totalCards}`);
    lines.push(`Generated: ${payload.metadata.timestamp}`);
    lines.push(`App: ${payload.metadata.appVersion}`);
    lines.push("");
    payload.report.rarityTable.forEach((r) => {
      lines.push(`${r.name} (${r.shortcode}) cards=${r.cards} perCard=${r.perCard.toFixed(4)} yield=${r.percent.toFixed(4)}%`);
    });
    return lines.join("\n");
  }

  window.CCGReportTemplates = {
    buildHtmlReport,
    buildTextReport
  };
})();
