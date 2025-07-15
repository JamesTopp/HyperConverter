// --- Conversion Definitions ---
const conversions = [
  {
    name: "centimeters",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(cm|centimeters?|centimetres?)\\b",
    convert: (val) => `${(val * 0.393701).toFixed(2)} in`
  },
  {
    name: "centimetres_attached", 
    pattern: "(\\d+(?:\\.\\d+)?)([DWHL])\\s?(?=.*centimetres?)",
    convert: (val) => `${(val * 0.393701).toFixed(2)} in`
  },
  {
    name: "meters", 
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(m|meters?)\\b",
    convert: (val) => `${(val * 3.28084).toFixed(2)} ft`
  },
  {
    name: "kilograms",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(kg|kilograms?|kgs?)\\b",
    convert: (val) => `${(val * 2.20462).toFixed(2)} lb`
  },
  {
    name: "grams",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(g|grams?)\\b",
    convert: (val) => `${(val * 0.035274).toFixed(2)} oz`
  },
  {
    name: "liters",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(l|liters?|litres?)\\b",
    convert: (val) => `${(val * 0.264172).toFixed(2)} gal`
  },
  {
    name: "celsius",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(°?\\s?(c|celsius|deg\\s?c))\\b",
    convert: (val) => `${((val * 9) / 5 + 32).toFixed(1)} °F`
  },
  {
    name: "inches",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(in|inches?)\\b",
    convert: (val) => `${(val / 0.393701).toFixed(2)} cm`
  },
  {
    name: "inches_symbol",
    pattern: "(\\d+(?:\\.\\d+)?(?:-\\d+(?:\\.\\d+)?)?)\"\?\\s?([DWHL])?",
    convert: (val) => {
      // Handle ranges like "28-45"
      if (val.includes('-')) {
        const [min, max] = val.split('-').map(Number);
        const avgVal = (min + max) / 2;
        return `${(avgVal / 0.393701).toFixed(2)} cm`;
      }
      return `${(parseFloat(val) / 0.393701).toFixed(2)} cm`;
    }
  },
  {
    name: "feet",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(ft|feet)\\b",
    convert: (val) => `${(val / 3.28084).toFixed(2)} m`
  },
  {
    name: "feet_symbol",
    pattern: "(\\d+(?:\\.\\d+)?)'\\s?",
    convert: (val) => `${(val / 3.28084).toFixed(2)} m`
  },
  {
    name: "pounds",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(lb|lbs|pounds?)\\b",
    convert: (val) => `${(val / 2.20462).toFixed(2)} kg`
  },
  {
    name: "ounces",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(oz|ounces?)\\b",
    convert: (val) => `${(val / 0.035274).toFixed(2)} g`
  },
  {
    name: "gallons",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(gal|gallons?)\\b",
    convert: (val) => `${(val / 0.264172).toFixed(2)} L`
  },
  {
    name: "fahrenheit",
    pattern: "(\\d+(?:\\.\\d+)?)\\s?(°?\\s?(f|fahrenheit|deg\\s?f))\\b",
    convert: (val) => `${(((val - 32) * 5) / 9).toFixed(1)} °C`
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
  zIndex: "2147483647", // Maximum z-index
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
  
  // Better positioning that accounts for viewport
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

  // Create fresh regex for each text node to avoid global flag issues
  const regex = new RegExp(combinedPattern, "gi");
  const matches = [...text.matchAll(regex)];
  
  if (matches.length === 0) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach(match => {
    const fullMatch = match[0];
    const matchStart = match.index;
    
    // Add text before match
    if (matchStart > lastIndex) {
      const beforeText = text.slice(lastIndex, matchStart);
      fragment.appendChild(document.createTextNode(beforeText));
    }

    // Create highlighted span
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
        
        // Special handling for inches_symbol with ranges
        if (conversion.name === "inches_symbol" && testMatch[1].includes('-')) {
          conversionResult = conversion.convert(testMatch[1]);
        } else if (!isNaN(numericValue)) {
          conversionResult = conversion.convert(numericValue);
        }
        break;
      }
    }
    
    if (conversionResult) {
      span.dataset.convert = `${fullMatch} = ${conversionResult}`;
    }
    
    fragment.appendChild(span);
    lastIndex = matchStart + fullMatch.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  // Replace the text node with our fragment
  try {
    parent.replaceChild(fragment, textNode);
  } catch (e) {
    console.warn("Could not replace text node:", e);
  }
}

// 🔄 Process all text nodes in a container
function processContainer(container) {
  if (!container) return;
  
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip if already processed or in excluded elements
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

// 🎯 Event delegation using document-level listeners
document.addEventListener("mouseover", function(e) {
  if (e.target && e.target.classList && e.target.classList.contains("hyper-hover")) {
    const convertText = e.target.dataset.convert;
    if (convertText) {
      showTooltip(e, convertText);
    }
  }
}, true); // Use capture phase for better compatibility

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

// 🧠 Initialize and observe changes
chrome.storage.sync.get(['enabled'], (result) => {
  const isEnabled = result.enabled ?? true;
  
  if (isEnabled) {
    // Process initial content
    processContainer(document.body);

    // Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Process the new element and its children
            processContainer(node);
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log("🚀 HyperConverter initialized");
  }
});