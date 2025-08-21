const unicodeFractions = {
  "⅛": 0.125, "⅙": 0.167, "⅕": 0.2, "¼": 0.25, "⅓": 0.333, "⅜": 0.375,
  "⅖": 0.4, "½": 0.5, "⅔": 0.667, "⅗": 0.6, "¾": 0.75, "⅘": 0.8,
  "⅚": 0.833, "⅞": 0.875,
};

/**
 * Parses a string that may contain numbers, fractions, or spelled-out words.
 * @param {string} valueString The string to parse.
 * @returns {number} The parsed numeric value, or NaN if parsing fails.
 */
function parseMeasurementValue(valueString) {
  const valStr = String(valueString).toLowerCase().trim();
  if (unicodeFractions[valStr]) return unicodeFractions[valStr];
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
  if (wordToNumber[valStr]) return wordToNumber[valStr];
  if (valStr.match(/one and a half/)) return 1.5;
  if (valStr.includes("/")) {
    const parts = valStr.split("/");
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (den !== 0 && !isNaN(num) && !isNaN(den)) return num / den;
    }
  }
  return parseFloat(valStr);
}

const conversions = [
  // This is the complete, upgraded conversions array
  {
    name: "feet_and_inches",
    pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*(?:'|ft|feet)\\s*(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*(?:"|”|in|inch|inches?)`,
    convert: (match) => {
      const feet = parseMeasurementValue(match[1]);
      const inches = parseMeasurementValue(match[2]);
      if (isNaN(feet) || isNaN(inches)) return null;
      const totalInches = feet * 12 + inches;
      const totalCm = totalInches * 2.54;
      return `${match[0]} = ${totalCm.toFixed(1)} cm`;
    }
  },
  {
    name: "multi_dimensions_symbol",
    pattern: `(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)(?:"|”)\\s*[xX]\\s*(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)(?:"|”)`,
    convert: (match) => {
        if (!match || !match[1] || !match[2]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        if (isNaN(val1) || isNaN(val2)) return null;
        const res1 = `${match[1]}" = ${(val1 * 2.54).toFixed(1)} cm`;
        const res2 = `${match[2]}" = ${(val2 * 2.54).toFixed(1)} cm`;
        return `${res1}\n${res2}`;
    }
  },
  {
    name: "multi_dimensions_no_space",
    pattern: `(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)[xX](-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)(inch|in|cm|centimeter)\\b`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[3]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase();
        if (isNaN(val1) || isNaN(val2)) return null;
        let res1, res2;
        if (unit.startsWith("in")) {
            res1 = `${match[1]} in = ${(val1 * 2.54).toFixed(1)} cm`;
            res2 = `${match[2]} in = ${(val2 * 2.54).toFixed(1)} cm`;
        } else if (unit.startsWith("c")) {
            res1 = `${match[1]} cm = ${(val1 * 0.393701).toFixed(1)} in`;
            res2 = `${match[2]} cm = ${(val2 * 0.393701).toFixed(1)} in`;
        } else { return null; }
        return `${res1}\n${res2}`;
    }
  },
  {
    name: "multi_dimensions",
    pattern: `(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*[xX]\\s*(-?[\\d\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(centimeters?|cm|inch|in|feet|ft|meters?|m)\\b`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[3]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase();
        if (isNaN(val1) || isNaN(val2)) return null;
        let res1, res2;
        if (unit.startsWith("in")) {
            res1 = `${match[1]} in = ${(val1 * 2.54).toFixed(1)} cm`;
            res2 = `${match[2]} in = ${(val2 * 2.54).toFixed(1)} cm`;
        } else if (unit.startsWith("centimeter") || unit.startsWith("cm")) {
            res1 = `${match[1]} cm = ${(val1 * 0.393701).toFixed(1)} in`;
            res2 = `${match[2]} cm = ${(val2 * 0.393701).toFixed(1)} in`;
        } else if (unit.startsWith("feet") || unit.startsWith("ft")) {
            res1 = `${match[1]} ft = ${(val1 * 0.3048).toFixed(1)} m`;
            res2 = `${match[2]} ft = ${(val2 * 0.3048).toFixed(1)} m`;
        } else if (unit.startsWith("meter") || unit.startsWith("m")) {
            res1 = `${match[1]} m = ${(val1 * 3.28084).toFixed(1)} ft`;
            res2 = `${match[2]} m = ${(val2 * 3.28084).toFixed(1)} ft`;
        } else { return null; }
        return `${res1}\n${res2}`;
    }
  },
  {
    name: "ranges",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(?:-|to|–)\\s*(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(cm|centimeters?|in|inch|inches?|"|”|ft|feet|'|m|meters?|lbs?|pounds?|kg|kilograms?)\\b`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[3]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase();
        if (isNaN(val1) || isNaN(val2)) return null;
        let res1, res2, resUnit;
        if (unit.startsWith("in") || unit === '"' || unit === '”') { res1 = (val1 * 2.54).toFixed(1); res2 = (val2 * 2.54).toFixed(1); resUnit = 'cm'; } 
        else if (unit.startsWith("cm")) { res1 = (val1 * 0.393701).toFixed(1); res2 = (val2 * 0.393701).toFixed(1); resUnit = 'in'; } 
        else if (unit.startsWith("ft") || unit === "'") { res1 = (val1 * 0.3048).toFixed(1); res2 = (val2 * 0.3048).toFixed(1); resUnit = 'm'; } 
        else if (unit.startsWith("m")) { res1 = (val1 * 3.28084).toFixed(1); res2 = (val2 * 3.28084).toFixed(1); resUnit = 'ft'; } 
        else if (unit.startsWith("lb") || unit.startsWith("pound")) { res1 = (val1 * 0.453592).toFixed(1); res2 = (val2 * 0.453592).toFixed(1); resUnit = 'kg'; } 
        else if (unit.startsWith("kg")) { res1 = (val1 * 2.20462).toFixed(1); res2 = (val2 * 2.20462).toFixed(1); resUnit = 'lb'; } 
        else { return null; }
        return `${match[0]} = ${res1}–${res2} ${resUnit}`;
    }
  },
  { name: "inches_symbol", pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})(?:"|”)`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 2.54).toFixed(2)} cm`; }, },
  { name: "feet_symbol", pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})'`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.3048).toFixed(2)} m`; }, },
  { name: "inches", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:inch|inches|in)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 2.54).toFixed(2)} cm`; }, },
  { name: "feet", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:ft|feet)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.3048).toFixed(2)} m`; }, },
  { name: "centimeters", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:cm|centimeters?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.393701).toFixed(2)} in`; }, },
  { name: "millimeters", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:mm|millimeters?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.0393701).toFixed(2)} in`; }, },
  { name: "meters", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:m(?!m)|meters?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 3.28084).toFixed(2)} ft`; }, },
  { name: "pounds", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:lbs?|pounds?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.453592).toFixed(2)} kg`; }, },
  { name: "kilograms", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:kg|kilograms?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 2.20462).toFixed(2)} lb`; }, },
  { name: "ounces", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:oz|ounces?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 28.3495).toFixed(2)} g`; }, },
  { name: "grams", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:g|grams?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.035274).toFixed(2)} oz`; }, },
  { name: "gallons", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:gal|gallons?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 3.78541).toFixed(2)} L`; }, },
  { name: "liters", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:l|liters?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 0.264172).toFixed(2)} gal`; }, },
  { name: "cups", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:cups?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 237).toFixed(0)} ml`; }, },
  { name: "tablespoons", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:tbsp|tablespoons?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 14.787).toFixed(1)} ml`; }, },
  { name: "teaspoons", pattern: `(?<![\\d\\."'])(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*-?\\s*(?:tsp|teaspoons?)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(num * 4.929).toFixed(1)} ml`; }, },
  { name: "fahrenheit", pattern: `(-?\\d+(?:\\.\\d+)?)\\s*(?:°\\s?f|degrees?\\s?f|fahrenheit)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${(((num - 32) * 5) / 9).toFixed(1)} °C`; }, },
  { name: "celsius", pattern: `(-?\\d+(?:\\.\\d+)?)\\s*(?:°\\s?c|degrees?\\s?c|celsius)\\b`, convert: (match) => { const num = parseMeasurementValue(match[1]); if (isNaN(num)) return null; return `${match[0]} = ${((num * 9) / 5 + 32).toFixed(1)} °F`; }, },
];

const tooltip = document.createElement("div");
tooltip.id = "hyper-converter-tooltip";
Object.assign(tooltip.style, {
  position: "absolute", background: "#FFEFE6", color: "#2D2D2D", padding: "8px 12px", borderRadius: "8px",
  fontSize: "12px", zIndex: "2147483647", pointerEvents: "none", display: "none",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", maxWidth: "300px", whiteSpace: "pre-wrap",
  fontFamily: "Arial, sans-serif", border: "none", fontWeight: "500", lineHeight: "1.4",
});

const style = document.createElement("style");
style.textContent = `
  .hyper-hover { position: relative !important; cursor: help !important; background-color: transparent !important; border: none !important; display: inline-block !important; }
  .hyper-hover::after { content: '' !important; position: absolute !important; bottom: 0px !important; left: 0px !important; width: 6px !important; height: 6px !important; background-color: #9B7EBF !important; pointer-events: none !important; z-index: 1 !important; clip-path: polygon(0% 0%, 0% 100%, 100% 100%) !important; }
  .hyper-hover:hover { background-color: #FFEFE6 !important; border-radius: 3px !important; transition: background-color 0.2s ease !important; }
`;
document.head.appendChild(style);
document.body.appendChild(tooltip);

function showTooltip(e, text) {
  tooltip.innerHTML = text.replace(/\n/g, '<br>');
  tooltip.style.display = "block";
  const x = e.clientX + window.scrollX;
  const y = e.clientY + window.scrollY;
  tooltip.style.left = `${x + 15}px`;
  tooltip.style.top = `${y - 35}px`;
}

function hideTooltip() {
  tooltip.style.display = "none";
}

const combinedPattern = conversions.map(c => `(?<${c.name}>${c.pattern})`).join("|");

<<<<<<< HEAD
// --- SPECIALIZED PARSERS (RE-INTEGRATED and CORRECTED) ---

function processAllRecipesIngredients(container) {
  const ingredientLists = container.querySelectorAll('.mm-recipes-structured-ingredients__list ul, .ingredients-section ul, ul.ingredients-section__list');
  ingredientLists.forEach(list => {
    if (list.classList.contains('hyper-converter-processed')) return;
    
    const listItems = list.querySelectorAll('li');
    listItems.forEach(item => {
      findAndReplaceInElement(item);
    });
    list.classList.add('hyper-converter-processed');
=======
// --- SPECIALIZED PARSERS (RE-INTEGRATED) ---

function processAllRecipesIngredients(container) {
  const ingredientLists = container.querySelectorAll('.mm-recipes-structured-ingredients__list ul');
  ingredientLists.forEach(list => {
    // Mark this list so the general parser ignores it
    list.classList.add('hyper-converter-processed');

    const listItems = list.querySelectorAll('li');
    listItems.forEach(item => {
      const fullText = item.textContent.trim();
      const match = fullText.match(new RegExp(combinedPattern, 'i'));
      
      if (match) {
        const conversion = conversions.find(c => match.groups[c.name] !== undefined);
        if (conversion) {
          const valueRegex = new RegExp(conversion.pattern, "i");
          const valueMatch = match[0].match(valueRegex);
          if (valueMatch) {
            const conversionResult = conversion.convert(valueMatch);
            if (conversionResult) {
              item.innerHTML = item.innerHTML.replace(match[0], 
                `<span class="hyper-hover" data-convert="${conversionResult}">${match[0]}</span>`
              );
            }
          }
        }
      }
    });
>>>>>>> parent of e7a87e5 (update for same things)
  });
}

function processTableMeasurements(container) {
  const ddElements = container.querySelectorAll('dl[class*="acl-dl"] dd');
  ddElements.forEach(dd => {
<<<<<<< HEAD
    if (dd.closest('.hyper-converter-processed')) return;

    const text = dd.textContent.trim();
    if (text.match(/^-?\d+(\.\d+)?$/)) {
=======
    const text = dd.textContent.trim();
    if (text.match(/^\d+(\.\d+)?$/)) {
>>>>>>> parent of e7a87e5 (update for same things)
      const numericValue = parseFloat(text);
      const dt = dd.previousElementSibling;
      if (dt && dt.tagName === 'DT') {
        const label = dt.textContent.toLowerCase();
        let unit = null;
        if (label.includes('in.')) unit = 'in';
        else if (label.includes('cm')) unit = 'cm';
        // Add more units as needed

        if (unit) {
<<<<<<< HEAD
          const fullMeasurementText = `${numericValue} ${unit}`;
          const tempDiv = document.createElement('div');
          tempDiv.textContent = fullMeasurementText;
          findAndReplaceInElement(tempDiv);
          if (tempDiv.querySelector('.hyper-hover')) {
            dd.innerHTML = tempDiv.innerHTML;
=======
          let conversionResult = '';
          if (unit === 'in') conversionResult = `${numericValue} in = ${(numericValue * 2.54).toFixed(1)} cm`;
          if (unit === 'cm') conversionResult = `${numericValue} cm = ${(numericValue * 0.393701).toFixed(1)} in`;
          
          if (conversionResult) {
            dd.classList.add('hyper-hover');
            dd.dataset.convert = conversionResult;
            // Mark as processed
>>>>>>> parent of e7a87e5 (update for same things)
            dd.closest('dl').classList.add('hyper-converter-processed');
          }
        }
      }
    }
  });
}

// --- MAIN ENGINE (TWO-PASS SYSTEM) ---

function findAndReplaceInElement(element) {
  const replacements = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node;
  while (node = walker.nextNode()) {
<<<<<<< HEAD
    if (!node.textContent.trim() || node.parentNode.closest('.hyper-hover, script, style, noscript, input, textarea, [contenteditable="true"]')) {
=======
    // NEW: Now ignores elements marked by specialized parsers
    if (!node.textContent.trim() || node.parentNode.closest('.hyper-hover, .hyper-converter-processed, script, style, noscript, input, textarea, [contenteditable="true"]')) {
>>>>>>> parent of e7a87e5 (update for same things)
      continue;
    }

    const text = node.textContent;
    const regex = new RegExp(combinedPattern, 'gi');
    const allMatches = [...text.matchAll(regex)];
    allMatches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    for (const match of allMatches) {
      if (match.index < lastIndex) continue;

      const conversion = conversions.find(c => match.groups[c.name] !== undefined);
      if (conversion) {
        const valueRegex = new RegExp(conversion.pattern, "i");
        const valueMatch = match[0].match(valueRegex);
        if (valueMatch) {
          const conversionResult = conversion.convert(valueMatch);
          if (conversionResult) {
            replacements.push({ textNode: node, match: match, conversionResult: conversionResult });
            lastIndex = match.index + match[0].length;
          }
        }
      }
    }
  }

  for (const rep of replacements.reverse()) {
    const { textNode, match, conversionResult } = rep;
    if (!document.body.contains(textNode)) continue;
    const span = document.createElement('span');
    span.className = 'hyper-hover';
    span.textContent = match[0];
    span.dataset.convert = conversionResult;
    const range = document.createRange();
    range.setStart(textNode, match.index);
    range.setEnd(textNode, match.index + match[0].length);
    try {
      range.surroundContents(span);
    } catch (e) { console.warn("Could not replace text content:", e); }
  }
}

// --- INITIALIZATION & EVENT LISTENERS ---

function runAllProcessors(container) {
  processAllRecipesIngredients(container);
  processTableMeasurements(container);
<<<<<<< HEAD
  // The main parser is now only called within the specialized ones for their specific contexts,
  // or on new nodes that are not part of those special contexts.
  
  // A slimmed-down general pass for nodes that AREN'T in special containers.
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let element;
  while (element = walker.nextNode()) {
      if (!element.closest('.hyper-converter-processed')) {
          findAndReplaceInElement(element);
      }
  }
=======
  findAndReplaceAllMeasurements(container); // General parser runs last
>>>>>>> parent of e7a87e5 (update for same things)
}

document.addEventListener("mouseover", function(e) {
  const target = e.target.closest(".hyper-hover");
  if (target && target.dataset.convert) { showTooltip(e, target.dataset.convert); }
}, true);

document.addEventListener("mouseout", function(e) {
  const target = e.target.closest(".hyper-hover");
  if (target) { hideTooltip(); }
}, true);

chrome.storage.sync.get(['enabled', 'globallyDisabled'], (result) => {
  const isEnabled = result.enabled !== false && !result.globallyDisabled;
  if (isEnabled) {
    runAllProcessors(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            runAllProcessors(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("🚀 HyperConverter initialized with Final Hybrid System");
  }
});