// content.js — HyperConverter (two-pass, anti-overlap), with full conversions + Allrecipes & Home Depot table fixes
// Debug logs removed per request. Tooltip behavior preserved.

// ------------------------------
// Helpers
// ------------------------------
const unicodeFractions = {
  "⅛": 0.125, "⅙": 0.167, "⅕": 0.2, "¼": 0.25, "⅓": 0.333, "⅜": 0.375,
  "⅖": 0.4, "½": 0.5, "⅔": 0.667, "⅗": 0.6, "¾": 0.75, "⅘": 0.8,
  "⅚": 0.833, "⅞": 0.875,
};

// Convert strings like "1 1/2", "½", "one and a half", "two", "-3.5", etc.
function parseMeasurementValue(valStr) {
  if (!valStr) return NaN;
  let s = String(valStr).trim().toLowerCase();

  // Handle unicode fraction alone (e.g., "½")
  if (unicodeFractions[s] != null) return unicodeFractions[s];

  // Split combined like "1½" -> "1" + "½"
  const combinedMatch = s.match(/^(-?\d+)\s*([⅛⅙⅕¼⅓⅜⅖½⅔⅗¾⅘⅚⅞])$/);
  if (combinedMatch) {
    return parseFloat(combinedMatch[1]) + unicodeFractions[combinedMatch[2]];
  }

  // Handle "number fraction" like "1 1/2"
  const spaceFrac = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (spaceFrac) {
    const whole = parseFloat(spaceFrac[1]);
    const num = parseFloat(spaceFrac[2]);
    const den = parseFloat(spaceFrac[3]);
    return whole + (den ? num / den : 0);
  }

  // Common word-to-number (for recipe text)
  const wordToNumber = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100, 'thousand': 1000, 'million': 1000000, 'billion': 1000000000,
    'a': 1, 'an': 1, 'half': 0.5, 'quarter': 0.25,
  };
  if (wordToNumber[s] != null) return wordToNumber[s];

  // "one and a half"
  if (s.match(/\bone and a half\b/)) return 1.5;

  // Text fractions like "1/3"
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (den !== 0 && !isNaN(num) && !isNaN(den)) return num / den;
    }
  }

  // Standard number (handles negatives/decimals)
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

// ------------------------------
// Tooltip (keep existing look/feel)
// ------------------------------
const tooltip = document.createElement("div");
tooltip.id = "hyper-converter-tooltip";
Object.assign(tooltip.style, {
  position: "absolute",
  background: "#FFEFE6",
  color: "#2D2D2D",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "12px",
  zIndex: "2147483647",
  pointerEvents: "none",
  display: "none",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  maxWidth: "300px",
  whiteSpace: "pre-wrap",
  fontFamily: "Arial, sans-serif",
  border: "none",
  fontWeight: "500",
  lineHeight: "1.4",
});
document.body.appendChild(tooltip);

const style = document.createElement("style");
style.textContent = `
  .hyper-hover {
    position: relative !important;
    cursor: help !important;
    background-color: transparent !important;
    border: none !important;
    display: inline-block !important;
  }
  .hyper-hover::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0px !important;
    left: 0px !important;
    width: 6px !important;
    height: 6px !important;
    background-color: #9B7EBF !important;
    pointer-events: none !important;
    z-index: 1 !important;
    clip-path: polygon(0% 0%, 0% 100%, 100% 100%) !important;
  }
  .hyper-hover:hover {
    background-color: #FFEFE6 !important;
    border-radius: 3px !important;
    transition: background-color 0.2s ease !important;
  }
`;
document.head.appendChild(style);

function showTooltip(e, text) {
  tooltip.innerHTML = text.replace(/\n/g, '<br>');
  tooltip.style.display = "block";
  const x = e.clientX + window.scrollX;
  const y = e.clientY + window.scrollY;
  tooltip.style.left = `${x + 15}px`;
  tooltip.style.top = `${y - 35}px`;
}
function hideTooltip() { tooltip.style.display = "none"; }

// ------------------------------
// Conversion rules (comprehensive)
// Order matters: most specific first
// ------------------------------
const conversions = [
  // --- HIGHEST PRIORITY: multi-part patterns ---
  {
    // 5' 6", 5 ft 6 in, 5ft 6"
    name: "feet_and_inches",
    pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*(?:'|ft|feet)\\s*(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*(?:"|”|in|inch|inches?)`,
    convert: (m) => {
      const feet = parseMeasurementValue(m[1]);
      const inches = parseMeasurementValue(m[2]);
      if (isNaN(feet) || isNaN(inches)) return null;
      const totalCm = (feet * 12 + inches) * 2.54;
      return `${m[0]} = ${totalCm.toFixed(1)} cm`;
    }
  },
  {
    // 12" x 24" (quotes on both dimensions)
    name: "multi_dimensions_symbol",
    pattern: `(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)(?:"|”)\\s*[xX]\\s*(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)(?:"|”)`,
    convert: (m) => {
      const a = parseMeasurementValue(m[1]);
      const b = parseMeasurementValue(m[2]);
      if (isNaN(a) || isNaN(b)) return null;
      return `${m[1]}" = ${(a*2.54).toFixed(1)} cm\n${m[2]}" = ${(b*2.54).toFixed(1)} cm`;
    }
  },
  {
    // 12x24in, 12x24cm (no spaces)
    name: "multi_dimensions_no_space",
    pattern: `(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)[xX](-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)(inch|in|cm|centimeter|centimeters|ft|feet|m|meter|meters)\\b`,
    convert: (m) => {
      const a = parseMeasurementValue(m[1]);
      const b = parseMeasurementValue(m[2]);
      const unit = m[3].toLowerCase();
      if (isNaN(a) || isNaN(b)) return null;
      if (unit.startsWith("in")) {
        return `${m[1]} in = ${(a*2.54).toFixed(1)} cm\n${m[2]} in = ${(b*2.54).toFixed(1)} cm`;
      } else if (unit.startsWith("cm")) {
        return `${m[1]} cm = ${(a*0.393701).toFixed(1)} in\n${m[2]} cm = ${(b*0.393701).toFixed(1)} in`;
      } else if (unit.startsWith("ft")) {
        return `${m[1]} ft = ${(a*0.3048).toFixed(1)} m\n${m[2]} ft = ${(b*0.3048).toFixed(1)} m`;
      } else if (unit.startsWith("m")) {
        return `${m[1]} m = ${(a*3.28084).toFixed(1)} ft\n${m[2]} m = ${(b*3.28084).toFixed(1)} ft`;
      }
      return null;
    }
  },
  {
    // 48 x 24 in, 120 x 80 cm, 2 x 3 ft, 1 x 2 m
    name: "multi_dimensions",
    pattern: `(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*[xX]\\s*(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(centimeters?|cm|inch|in|feet|ft|meters?|m)\\b`,
    convert: (m) => {
      const a = parseMeasurementValue(m[1]);
      const b = parseMeasurementValue(m[2]);
      const unit = m[3].toLowerCase();
      if (isNaN(a) || isNaN(b)) return null;
      if (unit.startsWith("in")) {
        return `${m[1]} in = ${(a*2.54).toFixed(1)} cm\n${m[2]} in = ${(b*2.54).toFixed(1)} cm`;
      } else if (unit.startsWith("cm")) {
        return `${m[1]} cm = ${(a*0.393701).toFixed(1)} in\n${m[2]} cm = ${(b*0.393701).toFixed(1)} in`;
      } else if (unit.startsWith("ft")) {
        return `${m[1]} ft = ${(a*0.3048).toFixed(1)} m\n${m[2]} ft = ${(b*0.3048).toFixed(1)} m`;
      } else if (unit.startsWith("m")) {
        return `${m[1]} m = ${(a*3.28084).toFixed(1)} ft\n${m[2]} m = ${(b*3.28084).toFixed(1)} ft`;
      }
      return null;
    }
  },
  {
    // Ranges: 12-18 in, 30–40 cm, 1–2 lb, 2–5 kg, 3–5 ft, 1–2 m
    name: "ranges",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(?:-|to|–)\\s*(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(cm|centimeters?|in|inch|inches?|"|”|ft|feet|'|m|meters?|lbs?|pounds?|kg|kilograms?)\\b`,
    convert: (m) => {
      const v1 = parseMeasurementValue(m[1]);
      const v2 = parseMeasurementValue(m[2]);
      const unit = m[3].toLowerCase();
      if (isNaN(v1) || isNaN(v2)) return null;
      let a, b, outUnit;
      if (unit.startsWith("in") || unit === '"' || unit === '”') {
        a = (v1*2.54).toFixed(1); b = (v2*2.54).toFixed(1); outUnit = "cm";
      } else if (unit.startsWith("cm")) {
        a = (v1*0.393701).toFixed(1); b = (v2*0.393701).toFixed(1); outUnit = "in";
      } else if (unit.startsWith("ft") || unit === "'") {
        a = (v1*0.3048).toFixed(1); b = (v2*0.3048).toFixed(1); outUnit = "m";
      } else if (unit.startsWith("m")) {
        a = (v1*3.28084).toFixed(1); b = (v2*3.28084).toFixed(1); outUnit = "ft";
      } else if (unit.startsWith("lb") || unit.startsWith("pound")) {
        a = (v1*0.453592).toFixed(1); b = (v2*0.453592).toFixed(1); outUnit = "kg";
      } else if (unit.startsWith("kg")) {
        a = (v1*2.20462).toFixed(1); b = (v2*2.20462).toFixed(1); outUnit = "lb";
      } else { return null; }
      return `${m[0]} = ${a}–${b} ${outUnit}`;
    }
  },

  // --- SYMBOL-BASED UNITS (medium priority) ---
  {
    name: "inches_symbol",
    pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})(?:"|”)`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*2.54).toFixed(2)} cm`;
    }
  },
  {
    name: "feet_symbol",
    pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})'`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.3048).toFixed(2)} m`;
    }
  },

  // --- STANDARD UNITS (lower priority) ---
  {
    name: "inches",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:inch|inches|in)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*2.54).toFixed(2)} cm`;
    }
  },
  {
    name: "feet",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:ft|feet)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.3048).toFixed(2)} m`;
    }
  },
  {
    name: "centimeters",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:cm|centimeters?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.393701).toFixed(2)} in`;
    }
  },
  {
    name: "millimeters",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:mm|millimeters?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.0393701).toFixed(2)} in`;
    }
  },
  {
    name: "meters",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:m|meters?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*3.28084).toFixed(2)} ft`;
    }
  },
  {
    name: "pounds",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:lbs?|pounds?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.453592).toFixed(2)} kg`;
    }
  },
  {
    name: "kilograms",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:kg|kilograms?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*2.20462).toFixed(2)} lb`;
    }
  },
  {
    name: "ounces",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:oz|ounces?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*28.3495).toFixed(2)} g`;
    }
  },
  {
    name: "grams",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:g|grams?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.035274).toFixed(2)} oz`;
    }
  },
  {
    name: "gallons",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:gal|gallons?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*3.78541).toFixed(2)} L`;
    }
  },
  {
    name: "liters",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:l|liters?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*0.264172).toFixed(2)} gal`;
    }
  },
  {
    name: "cups",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:cups?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*237).toFixed(0)} ml`;
    }
  },
  {
    name: "tablespoons",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:tbsp|tablespoons?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*14.787).toFixed(1)} ml`;
    }
  },
  {
    name: "teaspoons",
    pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?:\\s+and\\s+a\\s+half)?)\\s*-?\\s*(?:tsp|teaspoons?)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(n*4.929).toFixed(1)} ml`;
    }
  },
  {
    name: "fahrenheit",
    pattern: `(-?\\d+(?:\\.\\d+)?)\\s*(?:°\\s?f|degrees?\\s?f|fahrenheit)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${(((n-32)*5)/9).toFixed(1)} °C`;
    }
  },
  {
    name: "celsius",
    pattern: `(-?\\d+(?:\\.\\d+)?)\\s*(?:°\\s?c|degrees?\\s?c|celsius)\\b`,
    convert: (m) => {
      const n = parseMeasurementValue(m[1]);
      if (isNaN(n)) return null;
      return `${m[0]} = ${((n*9)/5 + 32).toFixed(1)} °F`;
    }
  },
];

// ------------------------------
// Two-pass engine (collect → dedupe → replace)
// ------------------------------
const combinedPattern = new RegExp(
  conversions.map(c => `(?<${c.name}>${c.pattern})`).join("|"),
  "giu"
);

function collectMatches(text) {
  const results = [];
  combinedPattern.lastIndex = 0;
  let m;
  while ((m = combinedPattern.exec(text)) !== null) {
    // Find which named group matched
    const name = Object.keys(m.groups || {}).find(k => m.groups[k]);
    if (!name) continue;

    const conv = conversions.find(c => c.name === name);
    if (!conv) continue;

    // Re-run conversion-specific regex on the matched substring to get its inner groups
    const seg = m[0];
    const local = new RegExp(conv.pattern, "iu").exec(seg);
    if (!local) continue;

    const tip = conv.convert(local);
    if (!tip) continue;

    results.push({
      start: m.index,
      end: m.index + seg.length,
      text: seg,
      tip,
      name
    });
  }
  return results;
}

// Keep longer matches and discard overlaps
function dedupeMatches(matches) {
  // Sort by length desc, then start asc
  matches.sort((a, b) => {
    const la = a.end - a.start, lb = b.end - b.start;
    if (lb !== la) return lb - la;
    return a.start - b.start;
  });
  const kept = [];
  for (const m of matches) {
    if (!kept.some(k => !(m.end <= k.start || m.start >= k.end))) {
      kept.push(m);
    }
  }
  // Return sorted by start for replacement
  kept.sort((a, b) => a.start - b.start);
  return kept;
}

function applyMatchesToTextNode(node, matches) {
  if (!matches.length) return;

  const text = node.nodeValue;
  const frag = document.createDocumentFragment();
  let last = 0;

  for (const m of matches) {
    if (last < m.start) {
      frag.appendChild(document.createTextNode(text.slice(last, m.start)));
    }
    const span = document.createElement("span");
    span.className = "hyper-hover";
    span.textContent = text.slice(m.start, m.end);
    span.addEventListener("mouseenter", (e) => showTooltip(e, m.tip));
    span.addEventListener("mouseleave", hideTooltip);
    frag.appendChild(span);
    last = m.end;
  }
  if (last < text.length) {
    frag.appendChild(document.createTextNode(text.slice(last)));
  }

  node.parentNode.replaceChild(frag, node);
}

const SKIP_TAGS = new Set(["SCRIPT","STYLE","NOSCRIPT","IFRAME","CANVAS","CODE","PRE","TEXTAREA","INPUT"]);

function processNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue;
    if (!text || !text.trim()) return;

    const found = collectMatches(text);
    if (!found.length) return;

    const final = dedupeMatches(found);
    applyMatchesToTextNode(node, final);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (SKIP_TAGS.has(node.tagName)) return;
    if (node.classList && node.classList.contains('hyper-converter-processed')) return;
    for (const child of Array.from(node.childNodes)) {
      processNode(child);
    }
  }
}

function findAndReplaceAllMeasurements(root=document.body) {
  processNode(root);
}

// ------------------------------
// Specialized handlers
// ------------------------------

// Allrecipes ingredients (stable selectors)
function processAllRecipesIngredients(container=document) {
  const lists = container.querySelectorAll('.mm-recipes-structured-ingredients__list ul, .ingredients-section ul');
  lists.forEach(list => {
    if (list.classList.contains('hyper-converter-processed')) return;
    list.querySelectorAll('li').forEach(li => findAndReplaceAllMeasurements(li));
    list.classList.add('hyper-converter-processed');
  });
}

// Home Depot-style spec tables: <dl class="...acl-dl..."><dt>Width (in.)</dt><dd>24</dd>...</dl>
function processTableMeasurements(container=document) {
  const dds = container.querySelectorAll('dl[class*="acl-dl"] dd');
  dds.forEach(dd => {
    const parent = dd.closest('dl[class*="acl-dl"]');
    if (parent && parent.classList.contains('hyper-converter-processed')) return;

    const raw = dd.textContent.trim();
    if (!raw || !/^-?\d+(\.\d+)?$/.test(raw)) return;

    const dt = dd.previousElementSibling;
    if (!dt || dt.tagName !== 'DT') return;
    const label = dt.textContent.toLowerCase();

    // Infer unit from header label
    let unit = null;
    if (label.includes('in.') || label.includes('inch')) unit = 'in';
    else if (label.includes('cm')) unit = 'cm';
    else if (label.includes('ft') || label.includes('feet')) unit = 'ft';
    else if (label.includes('m)') || /\bmeters?\b/.test(label)) unit = 'm';
    else if (label.includes('lb') || label.includes('pound')) unit = 'lb';
    else if (label.includes('kg')) unit = 'kg';

    if (!unit) return;

    // Compute tooltip text (don’t alter visible value)
    const value = parseFloat(raw);
    let tip = null;
    if (unit === 'in') tip = `${value} in = ${(value*2.54).toFixed(2)} cm`;
    else if (unit === 'cm') tip = `${value} cm = ${(value*0.393701).toFixed(2)} in`;
    else if (unit === 'ft') tip = `${value} ft = ${(value*0.3048).toFixed(2)} m`;
    else if (unit === 'm') tip = `${value} m = ${(value*3.28084).toFixed(2)} ft`;
    else if (unit === 'lb') tip = `${value} lb = ${(value*0.453592).toFixed(2)} kg`;
    else if (unit === 'kg') tip = `${value} kg = ${(value*2.20462).toFixed(2)} lb`;

    if (!tip) return;

    // Wrap just the numeric text in dd
    // If dd already contains nodes, replace the first text node occurrence
    const textNodes = [];
    dd.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) textNodes.push(n); });
    if (textNodes.length) {
      // Replace first occurrence of the number in that text node with a hyper-hover span
      const tn = textNodes[0];
      const idx = tn.nodeValue.indexOf(raw);
      if (idx !== -1) {
        const frag = document.createDocumentFragment();
        if (idx > 0) frag.appendChild(document.createTextNode(tn.nodeValue.slice(0, idx)));
        const span = document.createElement('span');
        span.className = 'hyper-hover';
        span.textContent = raw;
        span.addEventListener('mouseenter', (e) => showTooltip(e, tip));
        span.addEventListener('mouseleave', hideTooltip);
        frag.appendChild(span);
        const rest = tn.nodeValue.slice(idx + raw.length);
        if (rest) frag.appendChild(document.createTextNode(rest));
        tn.parentNode.replaceChild(frag, tn);
      }
    } else {
      // dd has elements only; prepend a wrapped number
      const span = document.createElement('span');
      span.className = 'hyper-hover';
      span.textContent = raw;
      span.addEventListener('mouseenter', (e) => showTooltip(e, tip));
      span.addEventListener('mouseleave', hideTooltip);
      dd.insertBefore(span, dd.firstChild);
    }

    if (parent) parent.classList.add('hyper-converter-processed');
  });
}

// ------------------------------
// Kickoff + Reactivity
// ------------------------------
function runAll() {
  // General pass
  findAndReplaceAllMeasurements(document.body);
  // Site-specific passes
  processAllRecipesIngredients(document);
  processTableMeasurements(document);
}

runAll();

// Observe dynamic content changes
const observer = new MutationObserver(muts => {
  for (const m of muts) {
    for (const node of m.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      // Run specialized first to avoid duplication inside their containers, then general
      processAllRecipesIngredients(node);
      processTableMeasurements(node);
      findAndReplaceAllMeasurements(node);
    }
  }
});
observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

// Global safety: hide tooltip on scroll/resizing to prevent stale placement
window.addEventListener('scroll', hideTooltip, { passive: true });
window.addEventListener('resize', hideTooltip, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) hideTooltip(); });