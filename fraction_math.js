(() => {
  "use strict";

  const TOLERANCE = 1e-9;
  const FRACTION_DENOM_CAP = 9999;

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  }

  function reduceFraction(num, den) {
    const d = gcd(num, den);
    return [num / d, den / d];
  }

  function toFractionApprox(value, cap = FRACTION_DENOM_CAP) {
    let bestNum = 0;
    let bestDen = 1;
    let bestErr = Number.POSITIVE_INFINITY;
    for (let den = 1; den <= cap; den += 1) {
      const num = Math.round(value * den);
      const err = Math.abs(value - num / den);
      if (err < bestErr) {
        bestErr = err;
        bestNum = num;
        bestDen = den;
      }
      if (err <= TOLERANCE) break;
    }
    const [n, d] = reduceFraction(bestNum, bestDen);
    return { n, d, approx: Math.abs(value - n / d) > TOLERANCE };
  }

  function renderFractionText(value) {
    const frac = toFractionApprox(value, FRACTION_DENOM_CAP);
    return `${frac.n}/${frac.d}${frac.approx ? " (approx)" : ""}`;
  }

  function splitWildcardInputParts(raw) {
    const text = String(raw ?? "").trim();
    const slash = text.indexOf("/");
    if (slash < 0) {
      return { numRaw: text, denRaw: "" };
    }
    return {
      numRaw: text.slice(0, slash).trim(),
      denRaw: text.slice(slash + 1).trim()
    };
  }

  function composeWildcardInput(numRaw, denRaw) {
    const n = String(numRaw ?? "").trim();
    const d = String(denRaw ?? "").trim();
    if (!d) return n;
    return `${n}/${d}`;
  }

  function normalizeProbabilityToFraction(value) {
    const frac = toFractionApprox(value, FRACTION_DENOM_CAP);
    return { n: frac.n, d: frac.d, text: `${frac.n}/${frac.d}`, approx: frac.approx };
  }

  function parseFractionInput(text) {
    const raw = String(text || "").trim();
    const m = raw.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if (!m) {
      return { ok: false, error: "Use integer a/b format." };
    }
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      return { ok: false, error: "Use integer a/b values only." };
    }
    if (b === 0) return { ok: false, error: "Denominator cannot be zero." };
    if (a < 0 || b < 0) return { ok: false, error: "Negative values are not allowed." };
    const v = a / b;
    if (v > 1 + TOLERANCE) return { ok: false, error: "Fraction value must be <= 1." };
    return { ok: true, value: v };
  }

  function parseProbabilityInput(raw, _mode) {
    const text = String(raw ?? "").trim();
    if (!text) {
      return { ok: false, error: "Enter a fraction, decimal, or percent." };
    }

    if (text.includes("/")) {
      return parseFractionInput(text);
    }

    const hasPercent = text.endsWith("%");
    const numericText = hasPercent ? text.slice(0, -1).trim() : text;
    const parsedNum = Number(numericText);
    if (!Number.isFinite(parsedNum)) {
      return { ok: false, error: "Enter fraction a/b, decimal, or percent value." };
    }

    const asProbability = hasPercent
      ? parsedNum / 100
      : (parsedNum > 1 ? parsedNum / 100 : parsedNum);

    if (asProbability < -TOLERANCE) return { ok: false, error: "Probability cannot be negative." };
    if (asProbability > 1 + TOLERANCE) return { ok: false, error: "Probability must be <= 1." };
    return { ok: true, value: asProbability };
  }

  function trimLeadingZerosSafe(raw, mode) {
    const text = String(raw ?? "").trim();
    if (!text) return text;

    if (mode === "fraction") {
      const match = text.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (!match) return text;
      const left = match[1].replace(/^0+(?=\d)/, "");
      const right = match[2].replace(/^0+(?=\d)/, "");
      return `${left}/${right}`;
    }

    const decimalMatch = text.match(/^(\d+)(\.\d+)?$/);
    if (!decimalMatch) return text;
    const intPart = decimalMatch[1].replace(/^0+(?=\d)/, "");
    return `${intPart}${decimalMatch[2] || ""}`;
  }

  window.CCGFractionMath = {
    gcd,
    reduceFraction,
    toFractionApprox,
    renderFractionText,
    splitWildcardInputParts,
    composeWildcardInput,
    normalizeProbabilityToFraction,
    parseFractionInput,
    parseProbabilityInput,
    trimLeadingZerosSafe
  };
})();
