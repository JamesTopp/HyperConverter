// --- Conversion Definitions ---
const conversions = [
  {
    name: "centimeters",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(cm|centimeters?|centimetres?)\b/gi,
    convert: (val) => `${(val * 0.393701).toFixed(2)} in`
  },
  {
    name: "meters",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(m|meters?)\b/gi,
    convert: (val) => `${(val * 3.28084).toFixed(2)} ft`
  },
  {
    name: "kilograms",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(kg|kilograms?|kgs?)\b/gi,
    convert: (val) => `${(val * 2.20462).toFixed(2)} lb`
  },
  {
    name: "grams",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(g|grams?)\b/gi,
    convert: (val) => `${(val * 0.035274).toFixed(2)} oz`
  },
  {
    name: "liters",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(l|liters?|litres?)\b/gi,
    convert: (val) => `${(val * 0.264172).toFixed(2)} gal`
  },
  {
    name: "celsius",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(\u00b0?\s?(c|celsius|deg\s?c))\b/gi,
    convert: (val) => `${((val * 9) / 5 + 32).toFixed(1)} °F`
  },
  {
    name: "inches",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(in|inches?)\b/gi,
    convert: (val) => `${(val / 0.393701).toFixed(2)} cm`
  },
  {
    name: "feet",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(ft|feet)\b/gi,
    convert: (val) => `${(val / 3.28084).toFixed(2)} m`
  },
  {
    name: "pounds",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(lb|lbs|pounds?)\b/gi,
    convert: (val) => `${(val / 2.20462).toFixed(2)} kg`
  },
  {
    name: "ounces",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(oz|ounces?)\b/gi,
    convert: (val) => `${(val / 0.035274).toFixed(2)} g`
  },
  {
    name: "gallons",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(gal|gallons?)\b/gi,
    convert: (val) => `${(val / 0.264172).toFixed(2)} L`
  },
  {
    name: "fahrenheit",
    regex: /(?<!\d)(\d+(\.\d+)?)\s?(\u00b0?\s?(f|fahrenheit|deg\s?f))\b/gi,
    convert: (val) => `${(((val - 32) * 5) / 9).toFixed(1)} °C`
  }
];

// 🧰 Tooltip setup
const tooltip = document.createElement("div");
Object.assign(tooltip.style, {
  position: "fixed",
  background: "#333",
  color: "#fff",
  padding: "5px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  zIndex: "999999",
  pointerEvents: "none",
  display: "none",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  maxWidth: "250px"
});
document.body.appendChild(tooltip);

function showTooltip(e, text) {
  tooltip.innerText = text;
  tooltip.style.display = "block";
  tooltip.style.left = `${e.pageX + 10}px`;
  tooltip.style.top = `${e.pageY + 10}px`;
  console.log("📦 Tooltip text shown:", text);
}

function hideTooltip() {
  tooltip.style.display = "none";
}

// 🔍 Text Node Processor
function safelyWrapTextNodes(node) {
  if (
    node.nodeType === 3 &&
    node.parentNode &&
    !node.parentNode.closest(".unit-converted") &&
    node.parentNode.offsetParent !== null
  ) {
    const text = node.textContent;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let hasMatch = false;

    const allPatterns = conversions.map(c => c.regex);
    const combinedRegex = new RegExp(allPatterns.map(r => r.source).join("|"), "gi");
    const matches = [...text.matchAll(combinedRegex)];
    if (matches.length === 0) return;

    matches.forEach(match => {
      const matchedText = match[0];
      const offset = match.index;
      const before = text.slice(lastIndex, offset);
      if (before) frag.appendChild(document.createTextNode(before));

      const span = document.createElement("span");
      span.className = "hyper-hover";
      span.style.border = "1px dashed red";
      span.style.cursor = "help";
      span.textContent = matchedText;
      span.style.pointerEvents = "auto";

      const conversion = conversions.find(({ regex }) => regex.test(matchedText));
      if (conversion) {
        const numberPart = match.find((part, i) => i !== 0 && part && /^\d/.test(part));
        const val = parseFloat(numberPart);
        if (!isNaN(val)) {
          span.dataset.convert = `${matchedText} = ${conversion.convert(val)}`;
        }
      }

      frag.appendChild(span);
      lastIndex = offset + matchedText.length;
      hasMatch = true;
    });

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (hasMatch) {
      node.parentNode.replaceChild(frag, node);
    }
  } else if (
    node.nodeType === 1 &&
    node.nodeName !== "SCRIPT" &&
    node.nodeName !== "STYLE"
  ) {
    for (let child of node.childNodes) {
      safelyWrapTextNodes(child);
    }
  }
}

// 🧠 Init
chrome.storage.sync.get(['enabled'], (res) => {
  if (res.enabled ?? true) {
    safelyWrapTextNodes(document.body);

    document.body.addEventListener("mouseover", (e) => {
      const target = e.target;
      if (target.classList.contains("hyper-hover")) {
        const text = target.dataset.convert;
        console.log("🖱 Hovered element text:", target.textContent);
        if (text) showTooltip(e, text);
      }
    });

    document.body.addEventListener("mousemove", (e) => {
      if (tooltip.style.display === "block") {
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
      }
    });

    document.body.addEventListener("mouseout", (e) => {
      if (e.target.classList.contains("hyper-hover")) hideTooltip();
    });

    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1) safelyWrapTextNodes(node);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
});
