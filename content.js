const unicodeFractions = {
  "⅛": 0.125, "⅙": 0.167, "⅕": 0.2, "¼": 0.25, "⅓": 0.333, "⅜": 0.375,
  "⅖": 0.4, "½": 0.5, "⅔": 0.667, "⅗": 0.6, "¾": 0.75, "⅘": 0.8,
  "⅚": 0.833, "⅞": 0.875,
};
// --- Conversion Definitions ---
const conversions = [
  // --- HIGHEST PRIORITY: Combined & Special Formats ---
  {
    name: "feet_and_inches",
    pattern: `(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*(?:'|ft|feet)\\s*(-?[\\d\\.\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*(?:"|in|inch|inches?)\\b`,
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
    name: "multi_dimensions",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*[xX]\\s*(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(cm|centimeters?|in|inch|inches?|"|ft|feet|'|m|meters?)\\b`,
    convert: (match) => {
        // SAFETY CHECK: Ensure all parts of the match exist before using them
        if (!match || !match[1] || !match[2] || !match[3]) return null;

        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase(); // This line will no longer fail

        if (isNaN(val1) || isNaN(val2)) return null;

        let res1, res2;
        if (unit.startsWith("in") || unit === '"') {
            res1 = `${match[1]} in = ${(val1 * 2.54).toFixed(1)} cm`;
            res2 = `${match[2]} in = ${(val2 * 2.54).toFixed(1)} cm`;
        } else if (unit.startsWith("cm")) {
            res1 = `${match[1]} cm = ${(val1 * 0.393701).toFixed(1)} in`;
            res2 = `${match[2]} cm = ${(val2 * 0.393701).toFixed(1)} in`;
        } else if (unit.startsWith("ft") || unit === "'") {
            res1 = `${match[1]} ft = ${(val1 * 0.3048).toFixed(1)} m`;
            res2 = `${match[2]} ft = ${(val2 * 0.3048).toFixed(1)} m`;
        } else if (unit.startsWith("m")) {
            res1 = `${match[1]} m = ${(val1 * 3.28084).toFixed(1)} ft`;
            res2 = `${match[2]} m = ${(val2 * 3.28084).toFixed(1)} ft`;
        } else {
            return null;
        }
        return `${res1}\n${res2}`; // Use \n for a line break
    }
  },
  {
    name: "ranges",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(?:-|to|–)\\s*(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+)\\s*(cm|centimeters?|in|inch|inches?|"|ft|feet|'|m|meters?|lbs?|pounds?|kg|kilograms?)\\b`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[3]) return null;
        
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase();

        if (isNaN(val1) || isNaN(val2)) return null;
        
        let res1, res2, resUnit;
        if (unit.startsWith("in") || unit === '"') {
            res1 = (val1 * 2.54).toFixed(1);
            res2 = (val2 * 2.54).toFixed(1);
            resUnit = 'cm';
        } else if (unit.startsWith("cm")) {
            res1 = (val1 * 0.393701).toFixed(1);
            res2 = (val2 * 0.393701).toFixed(1);
            resUnit = 'in';
        } else if (unit.startsWith("ft") || unit === "'") {
            res1 = (val1 * 0.3048).toFixed(1);
            res2 = (val2 * 0.3048).toFixed(1);
            resUnit = 'm';
        } else if (unit.startsWith("m")) {
            res1 = (val1 * 3.28084).toFixed(1);
            res2 = (val2 * 3.28084).toFixed(1);
            resUnit = 'ft';
        } else if (unit.startsWith("lb") || unit.startsWith("pound")) {
            res1 = (val1 * 0.453592).toFixed(1);
            res2 = (val2 * 0.453592).toFixed(1);
            resUnit = 'kg';
        } else if (unit.startsWith("kg")) {
            res1 = (val1 * 2.20462).toFixed(1);
            res2 = (val2 * 2.20462).toFixed(1);
            resUnit = 'lb';
        } else {
            return null;
        }
        return `${match[0]} = ${res1}–${res2} ${resUnit}`;
    }
  },

  // --- STANDARD UNITS ---
  {
    name: "inches",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:inch|inches?|"|in)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 2.54).toFixed(2)} cm`;
    },
  },
  {
    name: "feet",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:ft|feet|')\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.3048).toFixed(2)} m`;
    },
  },
  {
    name: "centimeters",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:cm|centimeters?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.393701).toFixed(2)} in`;
    },
  },
  {
    name: "meters",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:m|meters?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 3.28084).toFixed(2)} ft`;
    },
  },
    {
    name: "millimeters",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:mm|millimeters?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.0393701).toFixed(2)} in`;
    },
  },
  {
    name: "pounds",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:lbs?|pounds?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.453592).toFixed(2)} kg`;
    },
  },
  {
    name: "kilograms",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:kg|kilograms?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 2.20462).toFixed(2)} lb`;
    },
  },
    {
    name: "ounces",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:oz|ounces?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 28.3495).toFixed(2)} g`;
    },
  },
  {
    name: "grams",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:g|grams?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.035274).toFixed(2)} oz`;
    },
  },
  {
    name: "gallons",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:gal|gallons?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 3.78541).toFixed(2)} L`;
    },
  },
  {
    name: "liters",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:l|liters?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.264172).toFixed(2)} gal`;
    },
  },
  {
    name: "cups",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:cups?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 237).toFixed(0)} ml`;
    },
  },
  {
    name: "tablespoons",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:tbsp|tablespoons?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 14.787).toFixed(1)} ml`;
    },
  },
  {
    name: "teaspoons",
    pattern: `(-?[\\d\\w\\.\\/½¼¾⅛⅙⅕⅓⅜⅖⅔⅗⅘⅚⅞]+(?: and a half)?)\\s*(?:tsp|teaspoons?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 4.929).toFixed(1)} ml`;
    },
  },
  {
    name: "fahrenheit",
    pattern: `(-?\\d+(?:\\.\\d+)?)\\s*(?:°\\s?f|degrees?\\s?f|fahrenheit)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(((num - 32) * 5) / 9).toFixed(1)} °C`;
    },
  },
  {
    name: "celsius",
    pattern: `(-?\\d+(?:\\.\\d+)?)\\s*(?:°\\s?c|degrees?\\s?c|celsius)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${((num * 9) / 5 + 32).toFixed(1)} °F`;
    },
  },
];

/**
 * Parses a string that may contain numbers, fractions, or spelled-out words.
 * @param {string} valueString The string to parse.
 * @returns {number} The parsed numeric value, or NaN if parsing fails.
 */
function parseMeasurementValue(valueString) {
  const valStr = String(valueString).toLowerCase().trim();

  // The unicodeFractions object is global, so we can directly use it here.
  if (unicodeFractions[valStr]) return unicodeFractions[valStr];

  // Spelled-Out Dictionary
  const wordToNumber = {
    // Numbers 0-19
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    // Tens
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    // Large scale numbers
    'hundred': 100, 'thousand': 1000, 'million': 1000000, 'billion': 1000000000,
    // Articles and fractions
    'a': 1, 'an': 1, 'half': 0.5, 'quarter': 0.25,
  };
  if (wordToNumber[valStr]) return wordToNumber[valStr];
  
  // Handle "one and a half" patterns
  if (valStr.match(/one and a half/)) return 1.5;
  
  // Handle text fractions like "1/3"
  if (valStr.includes("/")) {
    const parts = valStr.split("/");
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (den !== 0 && !isNaN(num) && !isNaN(den)) return num / den;
    }
  }

  // Handle standard numbers, including negatives
  return parseFloat(valStr);
}

// 🧰 Tooltip setup
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
  maxWidth: "300px", // Increased max-width for multi-line
  whiteSpace: "pre-wrap", // Allows wrapping and respects newlines
  fontFamily: "Arial, sans-serif",
  border: "none",
  fontWeight: "500",
  lineHeight: "1.4", // Added for better multi-line readability
});

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
document.body.appendChild(tooltip);

function showTooltip(e, text) {
  // NEW: Render line breaks for multi-line tooltips
  tooltip.innerHTML = text.replace(/\n/g, '<br>');
  tooltip.style.display = "block";
  
  const x = e.clientX + window.scrollX;
  const y = e.clientY + window.scrollY;
  
  tooltip.style.left = `${x + 15}px`;
  tooltip.style.top = `${y - 35}px`;
  
  console.log("📦 Tooltip shown:", text);
}

function hideTooltip() {
  tooltip.style.display = "none";
}

// This uses named capture groups based on the 'name' property in your objects.
const combinedPattern = conversions.map(c => `(?<${c.name}>${c.pattern})`).join("|");

// Gemini Text Node Processing
function processTextNode(textNode) {
  if (!textNode || textNode.nodeType !== 3) return;

  const parent = textNode.parentNode;
  if (!parent ||
      parent.closest(".hyper-hover") ||
      parent.closest("script, style, noscript") ||
      parent.closest("#hyper-converter-tooltip")) return;

  const text = textNode.textContent;
  if (!text.trim()) return;

  const regex = new RegExp(combinedPattern, "gi");
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach(match => {
    const fullMatch = match[0];
    const matchStart = match.index;
    const groups = match.groups;

    if (matchStart > lastIndex) {
      const beforeText = text.slice(lastIndex, matchStart);
      fragment.appendChild(document.createTextNode(beforeText));
    }

    // Find which named group captured a value.
    let conversionName = null;
    for (const key in groups) {
      if (groups[key] !== undefined) {
        conversionName = key;
        break;
      }
    }

    if (conversionName) {
      const conversion = conversions.find(c => c.name === conversionName);
      if (conversion) {
        // Now that we know the correct conversion, we need to extract the value.
        // The first capture group *within* the pattern almost always holds the value.
        const valueRegex = new RegExp(conversion.pattern, "i");
        const valueMatch = fullMatch.match(valueRegex);

        if (valueMatch) { // Check if we have a match at all
          // Pass the ENTIRE array of captured parts to the convert function
          const conversionResult = conversion.convert(valueMatch);

          if (conversionResult) { // Check if the conversion was successful
            const span = document.createElement("span");
            span.className = "hyper-hover";
            span.textContent = fullMatch;
            span.dataset.convert = conversionResult; // The result is now the full tooltip text
            fragment.appendChild(span);
          } else {
            // Conversion failed, just append the original text
            fragment.appendChild(document.createTextNode(fullMatch));
          }
        } else {
          // Could not extract a value, so just append the original text
          fragment.appendChild(document.createTextNode(fullMatch));
        }
      }
    } else {
      // Should not happen, but as a fallback, append the original text
      fragment.appendChild(document.createTextNode(fullMatch));
    }
    
    lastIndex = matchStart + fullMatch.length;
  });

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  // Check if fragment has children before replacing
  if (fragment.hasChildNodes()) {
    try {
      parent.replaceChild(fragment, textNode);
    } catch (e) {
      console.warn("Could not replace text node:", e);
    }
  }
}
function processAllRecipesIngredients(container) {
  console.log("🚀 FUNCTION CALLED!");
  console.log("🥄 Looking for AllRecipes ingredients");

  // Try multiple selectors in order of specificity
  const selectors = [
    ".mm-recipes-structured-ingredients__list", // AllRecipes specific
    'ul[class*="ingredient"]', // General ingredient lists
    'ul[class*="recipe"]', // Recipe-related lists
    ".ingredients ul", // Ingredients section
    ".recipe-ingredients ul", // Recipe ingredients section
    "ul", // Fallback to any ul
  ];

  let foundIngredients = false;

  for (const selector of selectors) {
    const lists = container.querySelectorAll(selector);

    for (const list of lists) {
      const listItems = list.querySelectorAll("li");
      let hasIngredients = false;

      // Check if this list actually contains cooking measurements
      listItems.forEach((item) => {
        const text = item.textContent.trim();
        if (
          text.match(
            /(\d+|½|¼|¾|[⅛⅙⅕¼⅓⅜⅖⅔⅗¾⅘⅚⅞])\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs|kilogram|kilograms|kg|kgs|gram|grams|g|liter|liters|litre|litres|l|milliliter|milliliters|millilitre|millilitres|ml|gallon|gallons|gal|pint|pints|pt|quart|quarts|qt|fluid ounce|fluid ounces|fl oz|floz)/i
          )
        ) {
          hasIngredients = true;
        }
      });

      if (hasIngredients) {
        console.log(`Found ingredients using selector: ${selector}`);
        listItems.forEach((item) => {
          const text = item.textContent.trim();
          if (
            text.match(
              /(\d+|½|¼|¾|[ⅸ⅙⅕¼⅓⅜⅖⅔⅗¾⅘⅚⅞])\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs|kilogram|kilograms|kg|kgs|gram|grams|g|liter|liters|litre|litres|l|milliliter|milliliters|millilitre|millilitres|ml|gallon|gallons|gal|pint|pints|pt|quart|quarts|qt|fluid ounce|fluid ounces|fl oz|floz)/i
            )
          ) {
            console.log("Processing ingredient:", text);
            
            // AllRecipes splits ingredients into separate spans, so reconstruct the full text
            const fullText = item.textContent.trim();
            console.log("Full reconstructed text:", fullText);

            // Check if this matches our patterns when put together
            if (
              fullText.match(
                /(\d+|½|¼|¾|[⅛⅙⅕¼⅓⅜⅖⅔⅗¾⅘⅚⅞])\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs|kilogram|kilograms|kg|kgs|gram|grams|g|liter|liters|litre|litres|l|milliliter|milliliters|millilitre|millilitres|ml|gallon|gallons|gal|pint|pints|pt|quart|quarts|qt|fluid ounce|fluid ounces|fl oz|floz)/i
              )
            ) {
              console.log("Full text matches pattern, processing whole ingredient");

              // Updated regex pattern to include ounces
              const match = fullText.match(
                /(½|¼|¾|⅛|⅙⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞|\d+(?:\/\d+)?)\s+(teaspoon|teaspoons|cup|cups|tablespoon|tablespoons|tsp|tbsp|ounce|ounces|oz)/i
              );
              
              if (match) {
                const value = match[1];
                const unit = match[2];

                // Unicode fractions lookup table
                const unicodeFractions = {
                  "½": 0.5, "¼": 0.25, "¾": 0.75, "⅛": 0.125, "⅙": 0.167,
                  "⅕": 0.2, "⅓": 0.333, "⅜": 0.375, "⅖": 0.4, "⅔": 0.667,
                  "⅗": 0.6, "⅘": 0.8, "⅚": 0.833, "⅞": 0.875,
                };

                // Find the right conversion
                let conversion = "";
                let numericValue = unicodeFractions[value] || parseFloat(value);
                
                if (unit.includes("teaspoon") || unit === "tsp") {
                  conversion = `${value} ${unit} = ${(numericValue * 5).toFixed(1)} ml`;
                } else if (unit.includes("cup")) {
                  conversion = `${value} ${unit} = ${(numericValue * 237).toFixed(0)} ml`;
                } else if (unit.includes("tablespoon") || unit === "tbsp") {
                  conversion = `${value} ${unit} = ${(numericValue * 15).toFixed(1)} ml`;
                } else if (unit.includes("ounce") || unit === "oz") {
                  // FIXED: Added ounces conversion!
                  conversion = `${value} ${unit} = ${(numericValue / 0.035274).toFixed(1)} g`;
                }

                if (conversion) {
                  const measurementText = `${value} ${unit}`;
                  item.innerHTML = fullText.replace(
                    measurementText,
                    `<span class="hyper-hover" data-convert="${conversion}">${measurementText}</span>`
                  );
                  console.log("Successfully highlighted ingredient:", fullText);
                }
              }
            }
          }
        });
        foundIngredients = true;
        break; // Found ingredients, stop looking
      }
    }

    if (foundIngredients) break; // Found ingredients, stop trying selectors
  }

  if (!foundIngredients) {
    console.log("No ingredient lists found with cooking measurements");
  }
}

// Working version for Home Depot table-based measurements
function processTableMeasurements(container) {
  console.log("🏠 Looking for table-based measurements (Home Depot style)");
  
  // Target DD elements in Home Depot's definition lists
  const ddElements = container.querySelectorAll('dl[class*="acl-dl"] dd');
  console.log(`Found ${ddElements.length} DD elements in definition lists`);
  
  ddElements.forEach(dd => {
    const text = dd.textContent.trim();
    
    // Check if this DD contains only a number (like "22.24", "47.24", etc.)
    const numberMatch = text.match(/^\d+(\.\d+)?$/);
    
    if (numberMatch) {
      const numericValue = parseFloat(text);
      console.log(`📊 Found potential measurement number: ${text}`);
      
      // Look for unit context in nearby elements
      const unitContext = findUnitContext(dd);
      
      if (unitContext) {
        const conversionResult = convertTableMeasurement(numericValue, unitContext.unit);
        
        if (conversionResult) {
          console.log(`✅ Converting: ${text} ${unitContext.unit} = ${conversionResult}`);
          
          // Create tooltip for this measurement
          dd.classList.add('hyper-hover');
          dd.dataset.convert = `${text} ${unitContext.unit} = ${conversionResult}`;
          
          // Add our CSS styling if not already added
          if (!document.querySelector('#hyper-converter-table-styles')) {
            const style = document.createElement('style');
            style.id = 'hyper-converter-table-styles';
            style.textContent = `
            dd.hyper-hover {
              cursor: help !important;
            }
          `;
            document.head.appendChild(style);
          }
        }
      }
    }
  });
}

// Helper function to find unit context near a number element
function findUnitContext(numberElement) {
  // Check previous sibling (DT element might contain the label/unit)
  const prevSibling = numberElement.previousElementSibling;
  if (prevSibling && prevSibling.tagName === 'DT') {
    const unit = extractUnit(prevSibling.textContent);
    if (unit) return { unit, source: 'previous-dt' };
  }
  
  // Check parent DL for headers or patterns
  const dl = numberElement.closest('dl');
  if (dl) {
    // Look for any DT element that might indicate units
    const allDTs = dl.querySelectorAll('dt');
    for (const dt of allDTs) {
      const unit = extractUnit(dt.textContent);
      if (unit) return { unit, source: 'dl-header' };
    }
  }
  
  // Check nearby text for unit indicators
  const siblings = Array.from(numberElement.parentElement.children);
  for (const sibling of siblings) {
    const unit = extractUnit(sibling.textContent);
    if (unit) return { unit, source: 'sibling' };
  }
  
  return null;
}

// Helper function to extract unit from text
function extractUnit(text) {
  const lowerText = text.toLowerCase();
  
  // Common measurement units in product specs
  if (lowerText.includes('inch') || lowerText.includes('in.') || lowerText.includes('"')) {
    return 'inches';
  }
  if (lowerText.includes('feet') || lowerText.includes('ft.') || lowerText.includes("'")) {
    return 'feet';
  }
  if (lowerText.includes('cm') || lowerText.includes('centimeter')) {
    return 'cm';
  }
  if (lowerText.includes('meter') || lowerText.includes('metre')) {
    return 'meters';
  }
  if (lowerText.includes('lb') || lowerText.includes('pound')) {
    return 'pounds';
  }
  if (lowerText.includes('kg') || lowerText.includes('kilogram')) {
    return 'kg';
  }
  
  return null;
}

// Helper function to convert table measurements
function convertTableMeasurement(value, unit) {
  switch (unit) {
    case 'inches':
      return `${(value * 2.54).toFixed(2)} cm`;
    case 'feet':
      return `${(value * 0.3048).toFixed(2)} m`;
    case 'cm':
      return `${(value / 2.54).toFixed(2)} inches`;
    case 'meters':
      return `${(value * 3.28084).toFixed(2)} feet`;
    case 'pounds':
      return `${(value * 0.453592).toFixed(2)} kg`;
    case 'kg':
      return `${(value / 0.453592).toFixed(2)} lbs`;
    default:
      return null;
  }
}

// Listen for clicks on accordion/dropdown triggers (add this after the processTableMeasurements function)
document.addEventListener('click', function(e) {
  const target = e.target;
  
  // Check if clicked element might expand content (Home Depot specific + general)
  if (target.matches('[class*="accordion"], [class*="dropdown"], [class*="expand"], [class*="toggle"], [class*="acl-accordion"], .acl-accordion-trigger, [aria-expanded]') ||
      target.closest('[class*="accordion"], [class*="dropdown"], [class*="expand"], [class*="toggle"]')) {
    
    console.log("🏠 Accordion/dropdown clicked, will re-scan in 1000ms");
    
    // Re-scan after content loads (try multiple delays)
    setTimeout(() => {
      console.log("🏠 Re-scanning after accordion click...");
      processTableMeasurements(document.body);
    }, 500);
    
    setTimeout(() => {
      console.log("🏠 Second re-scan after accordion click...");
      processTableMeasurements(document.body);
    }, 1000);
    
    setTimeout(() => {
      console.log("🏠 Final re-scan after accordion click...");
      processTableMeasurements(document.body);
    }, 2000);
  }
}, true);

// Simple fix for split measurements (like "1/64 <em>inch</em>")
function processSplitMeasurements(container) {
  if (!container) return;
  
  // Build unit pattern from existing conversions to cover all units
  const unitWords = [];
  conversions.forEach(conv => {
    const pattern = conv.pattern;
    // Extract unit words from patterns
    if (pattern.includes('inch')) unitWords.push('inch', 'inches');
    if (pattern.includes('feet')) unitWords.push('ft', 'feet');
    if (pattern.includes('cm')) unitWords.push('cm', 'centimeters', 'centimetres');
    if (pattern.includes('mm')) unitWords.push('mm', 'millimeters', 'millimetres');
    if (pattern.includes('meters')) unitWords.push('m', 'meters', 'metres');
    if (pattern.includes('kg')) unitWords.push('kg', 'kilograms', 'kgs');
    if (pattern.includes('grams')) unitWords.push('g', 'grams');
    if (pattern.includes('liters')) unitWords.push('l', 'liters', 'litres');
    if (pattern.includes('pounds')) unitWords.push('lb', 'lbs', 'pounds');
    if (pattern.includes('ounce')) unitWords.push('oz', 'ounce', 'ounces');
    if (pattern.includes('gallons')) unitWords.push('gal', 'gallons');
    if (pattern.includes('cup')) unitWords.push('cup', 'cups');
    if (pattern.includes('tbsp')) unitWords.push('tbsp', 'tablespoons');
    if (pattern.includes('tsp')) unitWords.push('tsp', 'teaspoons', 'teaspoon');
    if (pattern.includes('fahrenheit')) unitWords.push('fahrenheit');
    if (pattern.includes('celsius')) unitWords.push('celsius');
  });
  
  const unitPattern = new RegExp(`^(${[...new Set(unitWords)].join('|')})$`, 'i');
  
  // Look for fraction patterns followed by formatted units
  const elements = container.querySelectorAll('em, strong, b, i');
  
  elements.forEach(element => {
    const unitText = element.textContent.trim();
    
    // Check if this element contains a unit word
    if (unitPattern.test(unitText)) {
      
      // Look at the text immediately before this element
      const prevNode = element.previousSibling;
      if (prevNode && prevNode.nodeType === 3) { // text node
        const prevText = prevNode.textContent;
        
        // Check if previous text ends with a fraction or number
        const match = prevText.match(/([\d\/⅛⅙⅕¼⅓⅜⅖½⅔⅗¾⅘⅚⅞]+)\s*$/);
        if (match) {
          const fullMeasurement = match[1] + ' ' + unitText;
          
          // Find the right conversion first
          let conversionResult = null;
          for (const conversion of conversions) {
            const testRegex = new RegExp(conversion.pattern, "gi");
            const testMatch = testRegex.exec(fullMeasurement);
            if (testMatch) {
              const numericValue = parseFloat(testMatch[1]);
              if (!isNaN(numericValue)) {
                conversionResult = conversion.convert(numericValue);
                break;
              }
            }
          }
          
          if (conversionResult) {
            // Just add highlighting to the unit element (simpler approach)
            if (!element.classList.contains('hyper-hover')) {
              element.classList.add('hyper-hover');
              element.dataset.convert = `${fullMeasurement} = ${conversionResult}`;
            }
          }
        }
      }
    }
  });
}

function processContainer(container) {
  if (!container) return;
  
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentNode?.closest(".hyper-hover") ||
            node.parentNode?.closest("script, style, noscript") ||
            node.parentNode?.closest("#hyper-converter-tooltip")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach(processTextNode);
}

document.addEventListener("mouseover", function(e) {
  let target = e.target;
  
  // Check if target itself has hyper-hover
  if (target && target.classList && target.classList.contains("hyper-hover")) {
    const convertText = target.dataset.convert;
    if (convertText) {
      showTooltip(e, convertText);
      return;
    }
  }
  
  // For buttons: check if we're hovering inside a button that contains a hyper-hover span
  let buttonParent = target.closest('button, .a-button, [role="button"]');
  if (buttonParent) {
    const hyperHoverChild = buttonParent.querySelector('.hyper-hover');
    if (hyperHoverChild) {
      const convertText = hyperHoverChild.dataset.convert;
      if (convertText) {
        showTooltip(e, convertText);
        return;
      }
    }
  }
}, true);

document.addEventListener("mouseout", function(e) {
  let target = e.target;
  
  // Check if leaving a hyper-hover element
  if (target && target.classList && target.classList.contains("hyper-hover")) {
    hideTooltip();
    return;
  }
  
  // Check if leaving a button that contains hyper-hover
  let buttonParent = target.closest('button, .a-button, [role="button"]');
  if (buttonParent && buttonParent.querySelector('.hyper-hover')) {
    hideTooltip();
  }
}, true);

chrome.storage.sync.get(['enabled', 'globallyDisabled'], (result) => {
  const isEnabled = result.enabled !== false && !result.globallyDisabled;
  
  if (isEnabled) {
    processContainer(document.body);
    processSplitMeasurements(document.body);
    processAllRecipesIngredients(document.body);
    processTableMeasurements(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            processContainer(node);
            processSplitMeasurements(node);
            processTableMeasurements(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log("🚀 HyperConverter initialized");
  }
});