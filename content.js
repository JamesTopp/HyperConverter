// --- Conversion Definitions ---
const conversions = [
  {
    name: "centimeters",
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(cm|centimeters?|centimetres?)\\b",
    convert: (val) => `${(val * 0.393701).toFixed(2)} in`
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
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(in|inch|inches?)\\b",
    convert: (val) => `${(val / 0.393701).toFixed(2)} cm`
  },
  {
  name: "inches_symbol",
  pattern: "(\\d+(?:\\.\\d+)?)\"",
  convert: (val) => `${(val / 0.393701).toFixed(2)} cm`
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
    pattern: "(?<!\\d)(\\d+(?:\\.\\d+)?)\\s?(oz|ounces?)\\b",
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
  pattern: "(\\d+)\\s?cups?\\b",
  convert: (val) => {
    console.log("🥄 Converting cups:", val);
    return `${(parseFloat(val) * 237).toFixed(0)} ml`;
  }
  },
  {
  name: "tablespoons",
  pattern: "(\\d+(?:\\.\\d+)?|½|¼|¾)\\s?(tbsp|tablespoons?)\\b",
  convert: (val) => {
    console.log("🥄 Converting teaspoons:", val);
    if (val === '½') return '7.5 ml';
    if (val === '¼') return '3.75 ml';
    if (val === '¾') return '11.25 ml';
    return `${(parseFloat(val) * 15).toFixed(0)} ml`;
  }
  },
  {
  name: "teaspoons",
  pattern: "(\\d+(?:\\.\\d+)?|½|¼|¾)\\s?(tsp|teaspoons?)\\b",
  convert: (val) => {
    if (val === '½') return '2.5 ml';
    if (val === '¼') return '1.25 ml'; 
    if (val === '¾') return '3.75 ml';
    return `${(parseFloat(val) * 5).toFixed(0)} ml`;
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
  background: "#333",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  zIndex: "2147483647",
  pointerEvents: "none",
  display: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  maxWidth: "200px",
  whiteSpace: "nowrap",
  fontFamily: "Arial, sans-serif"
});

// Inject CSS for highlighting
const style = document.createElement("style");
style.textContent = `
  .hyper-hover {
    border-bottom: 2px dashed #ff4444 !important;
    cursor: help !important;
    background-color: rgba(255, 68, 68, 0.1) !important;
  }
  .hyper-hover:hover {
    background-color: rgba(255, 68, 68, 0.2) !important;
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

     // Debug: Let's see what ul elements exist
     const allUls = container.querySelectorAll('ul');
     console.log("Found", allUls.length, "ul elements");
  
     allUls.forEach((ul, index) => {
    console.log(`UL ${index}:`, ul.className, "with", ul.querySelectorAll('li').length, "items");
    });
  
  // Find all text that looks like ingredients in the ingredient list
  const ingredientList = container.querySelector('ul');
  if (ingredientList) {
    const listItems = ingredientList.querySelectorAll('li');
    listItems.forEach(item => {
      const text = item.textContent.trim();
      console.log("Found ingredient text:", text);
      
      // Check if it matches our cooking patterns
      if (text.match(/\d+\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp)/)) {
        console.log("Matches cooking pattern:", text);
        // Try to process this entire text node
        processTextNode(item.firstChild);
      }
    });
  }
    // ADD: Also try looking for ingredients in other common AllRecipes structures
  const otherIngredients = container.querySelectorAll('[class*="ingredient"] li, .recipe-ingredient, [data-ingredient]');
  otherIngredients.forEach(item => {
    const text = item.textContent.trim();
    if (text.match(/\d+\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp)/)) {
      console.log("Found ingredient in other structure:", text);
      processTextNode(item.firstChild);
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