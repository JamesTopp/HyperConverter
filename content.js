// --- Conversion Definitions ---
const conversions = [
  {
    name: "centimeters",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(cm|centimeters?|centimetres?)\\b",
    convert: (val) => `${(val * 0.393701).toFixed(2)} in`
  },
  {
    name: "millimeters",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(mm|millimeters?|millimetres?)\\b",
    convert: (val) => `${(val * 0.0393701).toFixed(2)} in`
  },
  {
    name: "meters", 
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(m|meters?)\\b",
    convert: (val) => `${(val * 3.28084).toFixed(2)} ft`
  },
  {
    name: "kilograms",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(kg|kilograms?|kgs?)\\b",
    convert: (val) => `${(val * 2.20462).toFixed(2)} lb`
  },
  {
    name: "grams",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(g|grams?)\\b",
    convert: (val) => `${(val * 0.035274).toFixed(2)} oz`
  },
  {
    name: "liters",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(l|liters?|litres?)\\b",
    convert: (val) => `${(val * 0.264172).toFixed(2)} gal`
  },
  {
  name: "celsius",
  pattern: "(\\d+(?:\\.\\d+)?)\\s?(°\\s?c|degrees?\\s?c|celsius)\\b",
  convert: (val) => `${((val * 9) / 5 + 32).toFixed(1)} °F`
  },
  {
  name: "inches",
  pattern: "(\\d+(?:/\\d+)?|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞|\\d+(?:\\.\\d+)?)\\s?(in|inch|inches?)\\b",
  convert: (val) => {
    console.log("📏 Converting inches:", val);
    
    // Convert to string for processing
    const valStr = String(val);
    
    // Handle Unicode fractions
    const unicodeFractions = {
      '⅛': 0.125, '⅙': 0.167, '⅕': 0.2, '¼': 0.25, '⅓': 0.333,
      '⅜': 0.375, '⅖': 0.4, '½': 0.5, '⅔': 0.667, '⅗': 0.6, 
      '¾': 0.75, '⅘': 0.8, '⅚': 0.833, '⅞': 0.875
    };
    
    let numericValue;
    if (unicodeFractions[valStr]) {
      numericValue = unicodeFractions[valStr];
    } else if (valStr.includes('/')) {
      // Handle text fractions like "3/4"
      const [numerator, denominator] = valStr.split('/');
      numericValue = parseFloat(numerator) / parseFloat(denominator);
    } else {
      numericValue = parseFloat(val);
    }
    
    return `${(numericValue / 0.393701).toFixed(2)} cm`;
  }
  },
  {
  name: "inches_symbol",
  pattern: "(\\d+(?:\\.\\d+)?|\\d+(?:/\\d+)?|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞)\"",
  convert: (val) => {
    console.log("📏 Converting inches symbol:", val);
    
    const valStr = String(val);
    
    const unicodeFractions = {
      '⅛': 0.125, '⅙': 0.167, '⅕': 0.2, '¼': 0.25, '⅓': 0.333,
      '⅜': 0.375, '⅖': 0.4, '½': 0.5, '⅔': 0.667, '⅗': 0.6, 
      '¾': 0.75, '⅘': 0.8, '⅚': 0.833, '⅞': 0.875
    };
    
    let numericValue;
    if (unicodeFractions[valStr]) {
      numericValue = unicodeFractions[valStr];
    } else if (valStr.includes('/')) {
      const [numerator, denominator] = valStr.split('/');
      numericValue = parseFloat(numerator) / parseFloat(denominator);
    } else {
      numericValue = parseFloat(val);
    }
    
    return `${(numericValue / 0.393701).toFixed(2)} cm`;
  }
  },
  {
  name: "feet_symbol", 
  pattern: "(\\d+(?:\\.\\d+)?)'",
  convert: (val) => `${(val / 3.28084).toFixed(2)} m`
  },
  {
    name: "feet",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(ft|feet)\\b",
    convert: (val) => `${(val / 3.28084).toFixed(2)} m`
  },
  {
    name: "pounds",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(lb|lbs|pounds?)\\b",
    convert: (val) => `${(val / 2.20462).toFixed(2)} kg`
  },
  {
  name: "ounces",
  pattern: "(\\d+(?:\\.\\d+)?)\\s?(oz|ounce|ounces)\\b",
  convert: (val) => `${(val / 0.035274).toFixed(2)} g`
  },
  {
    name: "gallons",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(gal|gallons?)\\b",
    convert: (val) => `${(val / 0.264172).toFixed(2)} L`
  },
  {
  name: "fahrenheit", 
  pattern: "(\\d+(?:\\.\\d+)?)\\s?(°\\s?f|degrees?\\s?f|fahrenheit)\\b",
  convert: (val) => `${(((val - 32) * 5) / 9).toFixed(1)} °C`
  },
  {
  name: "cups",
  pattern: "(\\d+(?:/\\d+)?|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞)\\s?(cup|cups?)\\b",  
  convert: (val) => {
  console.log("🥄 Converting cups:", val);
  
  // Convert to string for processing
  const valStr = String(val);
  
  // Handle Unicode fractions
  const unicodeFractions = {
    '⅛': 0.125, '⅙': 0.167, '⅕': 0.2, '¼': 0.25, '⅓': 0.333,
    '⅜': 0.375, '⅖': 0.4, '⅔': 0.667, '⅗': 0.6, '¾': 0.75,
    '⅘': 0.8, '⅚': 0.833, '⅞': 0.875
  };
  
  let numericValue;
  if (unicodeFractions[valStr]) {
    numericValue = unicodeFractions[valStr];
  } else if (valStr.includes('/')) {
    // Handle text fractions like "1/3"
    const [numerator, denominator] = valStr.split('/');
    numericValue = parseFloat(numerator) / parseFloat(denominator);
  } else {
    numericValue = parseFloat(val);
  }
  
  return `${(numericValue * 237).toFixed(0)} ml`;
  }
  },
  {
  name: "tablespoons",
  pattern: "(\\d+(?:/\\d+)?|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞)\\s?(tbsp|tablespoons?)\\b",  
  convert: (val) => {
  console.log("🥄 Converting tablespoons:", val);
  
  // Convert to string for processing
  const valStr = String(val);
  
  // Handle Unicode fractions
  const unicodeFractions = {
    '⅛': 0.125, '⅙': 0.167, '⅕': 0.2, '¼': 0.25, '⅓': 0.333,
    '⅜': 0.375, '⅖': 0.4, '⅔': 0.667, '⅗': 0.6, '¾': 0.75,
    '⅘': 0.8, '⅚': 0.833, '⅞': 0.875, '½': 0.5
  };
  
  let numericValue;
  if (unicodeFractions[valStr]) {
    numericValue = unicodeFractions[valStr];
  } else if (valStr.includes('/')) {
    const [numerator, denominator] = valStr.split('/');
    numericValue = parseFloat(numerator) / parseFloat(denominator);
  } else if (valStr === '½') {
    numericValue = 0.5;
  } else if (valStr === '¼') {
    numericValue = 0.25;
  } else if (valStr === '¾') {
    numericValue = 0.75;
  } else {
    numericValue = parseFloat(val);
  }
  
  return `${(numericValue * 15).toFixed(1)} ml`;
  }
  },
  {
  name: "teaspoons",
  pattern: "(\\d+(?:/\\d+)?|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞)\\s?(tsp|teaspoons?|teaspoon)\\b",  
  convert: (val) => {
  console.log("🥄 Converting teaspoons:", val);
  // Convert to string for processing
  const valStr = String(val);
  
  // Handle Unicode fractions
  const unicodeFractions = {
    '⅛': 0.125, '⅙': 0.167, '⅕': 0.2, '¼': 0.25, '⅓': 0.333,
    '⅜': 0.375, '⅖': 0.4, '⅔': 0.667, '⅗': 0.6, '¾': 0.75,
    '⅘': 0.8, '⅚': 0.833, '⅞': 0.875, '½': 0.5
  };
  
  let numericValue;
  if (unicodeFractions[valStr]) {
    numericValue = unicodeFractions[valStr];
  } else if (valStr.includes('/')) {
    const [numerator, denominator] = valStr.split('/');
    numericValue = parseFloat(numerator) / parseFloat(denominator);
  } else if (valStr === '½') {
    numericValue = 0.5;
  } else if (valStr === '¼') {
    numericValue = 0.25;
  } else if (valStr === '¾') {
    numericValue = 0.75;
  } else {
    numericValue = parseFloat(val);
  }
  
  return `${(numericValue * 5).toFixed(1)} ml`;
}
  }
];

// Create combined regex pattern
const combinedPattern = conversions.map(c => `(${c.pattern})`).join("|");

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
  maxWidth: "200px",
  whiteSpace: "nowrap",
  fontFamily: "Arial, sans-serif",
  border: "1px solid #FFC8A2",
  fontWeight: "500"
});

const style = document.createElement("style");
style.textContent = `
  .hyper-hover {
    position: relative !important;
    cursor: help !important;
    background-color: transparent !important;
    border: none !important;
  }
  
.hyper-hover::after {
    content: '' !important;
    position: absolute !important;
    bottom: 1px !important;
    left: 1px !important;
    width: 4px !important;
    height: 4px !important;
    background-color: #FFC8A2 !important;
    transform: rotate(45deg) !important;
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
  tooltip.textContent = text;
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

// 🔍 Improved Text Node Processor
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
    
    if (matchStart > lastIndex) {
      const beforeText = text.slice(lastIndex, matchStart);
      fragment.appendChild(document.createTextNode(beforeText));
    }

    const span = document.createElement("span");
    span.className = "hyper-hover";
    span.textContent = fullMatch;
    
    // Find which conversion matched and calculate result
    let conversionResult = null;
    for (const conversion of conversions) {
      const testRegex = new RegExp(conversion.pattern, "gi");
      testRegex.lastIndex = 0; // Reset regex state
      const testMatch = testRegex.exec(fullMatch);
      if (testMatch) {
        let numericValue = parseFloat(testMatch[1]);
        
        if (!isNaN(numericValue)) {
          conversionResult = conversion.convert(numericValue);
          break;
        }
      }
    }

    if (conversionResult) {
  span.dataset.convert = `${fullMatch} = ${conversionResult}`;
} else {
    }
    fragment.appendChild(span);
    lastIndex = matchStart + fullMatch.length;
  });

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  try {
    parent.replaceChild(fragment, textNode);
  } catch (e) {
    console.warn("Could not replace text node:", e);
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
  if (e.target && e.target.classList && e.target.classList.contains("hyper-hover")) {
    const convertText = e.target.dataset.convert;
    if (convertText) {
      showTooltip(e, convertText);
    }
  }
}, true);

document.addEventListener("mouseout", function(e) {
  if (e.target && e.target.classList && e.target.classList.contains("hyper-hover")) {
    hideTooltip();
  }
}, true);

document.addEventListener("mousemove", function(e) {
  if (tooltip.style.display === "block") {
    const x = e.clientX + window.scrollX;
    const y = e.clientY + window.scrollY;
    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y - 35}px`;
  }
});

chrome.storage.sync.get(['enabled'], (result) => {
  const isEnabled = result.enabled ?? true;
  
  if (isEnabled) {
    processContainer(document.body);
    processAllRecipesIngredients(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            processContainer(node);
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