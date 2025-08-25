const unicodeFractions = {
  "⅛": 0.125, "⅙": 0.167, "⅕": 0.2, "¼": 0.25, "⅓": 0.333, "⅜": 0.375,
  "⅖": 0.4, "½": 0.5, "⅔": 0.667, "⅗": 0.6, "¾": 0.75, "⅘": 0.8,
  "⅚": 0.833, "⅞": 0.875,
};

const CONVERSION_FACTORS = {
  INCH_TO_CM: 2.54,
  FOOT_TO_M: 0.3048,
  LB_TO_KG: 0.453592,
  OZ_TO_G: 28.3495,
  GALLON_TO_L: 3.78541,
  CUP_TO_ML: 237,
  TBSP_TO_ML: 14.787,
  TSP_TO_ML: 4.929,
};

// Enhanced word-based measurement dictionary
const measurementWords = {
  // Numbers 0-100
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100, 'thousand': 1000,
  
  // Complete fraction system (eighths and sixteenths)
  'half': 0.5, 'quarter': 0.25, 'third': 0.333, 
  'eighth': 0.125, 'three-eighths': 0.375, 'five-eighths': 0.625, 'seven-eighths': 0.875,
  'sixteenth': 0.0625, 'three-sixteenths': 0.1875, 'five-sixteenths': 0.3125, 
  'seven-sixteenths': 0.4375, 'nine-sixteenths': 0.5625, 'eleven-sixteenths': 0.6875,
  'thirteen-sixteenths': 0.8125, 'fifteen-sixteenths': 0.9375,
  
  // Articles and common words
  'a': 1, 'an': 1, 'couple': 2, 'few': 3,
  
  // Phrase variants with "a/an"
  'half a': 0.5, 'half an': 0.5,
  'quarter a': 0.25, 'quarter an': 0.25, 
  'third a': 0.333, 'third an': 0.333,
  'eighth a': 0.125, 'eighth an': 0.125,
  
  // Phrase variants with "of a/an"  
  'half of a': 0.5, 'half of an': 0.5,
  'quarter of a': 0.25, 'quarter of an': 0.25,
  'third of a': 0.333, 'third of an': 0.333,
  'eighth of a': 0.125, 'eighth of an': 0.125,
  'couple of': 2, 'few of': 3
};

const createUniversalPattern = () => {
  const numbers = `\\d+(?:\\.\\d+)?(?:\\/\\d+)?`;
  const unicodes = Object.keys(unicodeFractions).join('|');
  
  // Create word phrases using the measurementWords keys
  const baseWords = Object.keys(measurementWords).filter(word => 
    ['half', 'quarter', 'third', 'eighth', 'couple', 'few'].includes(word)
  ).join('|');
  
  // Word phrases with "a/an" and "of a/an" support  
  const wordPhrases = `(?:(?:${baseWords})\\s+(?:of\\s+)?(?:a|an)\\s+)`;
  
  // Single words from measurementWords
  const singleWords = `(?:${Object.keys(measurementWords).join('|')})`;
  
  return `(${numbers}|${unicodes}|${wordPhrases}|${singleWords})`;
};

const createEnhancedFractionPattern = () => {
  const numbers = `\\d+(?:\\.\\d+)?(?:\\/\\d+)?`;
  const unicodes = Object.keys(unicodeFractions).join('|');
  const words = `(?:${Object.keys(measurementWords).join('|')})`;
  const wordPhrases = `(?:${words}(?:\\s+of)?)`;
  
  return `(${numbers}|${unicodes}|${wordPhrases})`;
};

// Helper function for creating fraction patterns  
const createFractionPattern = () => createEnhancedFractionPattern();
const createNumberPattern = () => createUniversalPattern();

const conversions = [
  // ======= HIGHEST PRIORITY: Complex Multi-part patterns =======
  {
    name: "feet_and_inches",
    pattern: `${createNumberPattern()}\\s*(?:'|ft|feet)\\s*${createNumberPattern()}\\s*(?:"|″|"|inches?|inch|in)`,
    convert: (match) => {
      const feet = parseMeasurementValue(match[1]);
      const inches = parseMeasurementValue(match[2]);
      if (isNaN(feet) || isNaN(inches)) return null;
      
      const totalInches = feet * 12 + inches;
      const totalCm = totalInches * CONVERSION_FACTORS.INCH_TO_CM;
      return `${match[0]} = ${totalCm.toFixed(1)} cm`;
    }
  },
  {
    name: "multi_dimensions_symbol", 
    pattern: `${createNumberPattern()}(?:"|″|")\\s*[xX×]\\s*${createNumberPattern()}(?:"|″|")`,
    convert: (match) => {
        if (!match || !match[1] || !match[2]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        if (isNaN(val1) || isNaN(val2)) return null;

        const res1 = `${match[1]}" = ${(val1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
        const res2 = `${match[2]}" = ${(val2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
        return `${res1}\n${res2}`;
    }
  },
  {
    name: "multi_dimensions",
    pattern: `${createNumberPattern()}\\s*[xX×]\\s*${createNumberPattern()}\\s*(centimeters?|cm|inches?|inch|in|feet|ft|meters?|m)\\b`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[3]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase();
        if (isNaN(val1) || isNaN(val2)) return null;

        let res1, res2;
        if (unit.startsWith("in")) {
            res1 = `${match[1]} in = ${(val1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
            res2 = `${match[2]} in = ${(val2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
        } else if (unit.startsWith("centimeter") || unit.startsWith("cm")) {
            res1 = `${match[1]} cm = ${(val1 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} in`;
            res2 = `${match[2]} cm = ${(val2 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} in`;
        } else if (unit.startsWith("feet") || unit.startsWith("ft")) {
            res1 = `${match[1]} ft = ${(val1 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} m`;
            res2 = `${match[2]} ft = ${(val2 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} m`;
        } else if (unit.startsWith("meter") || unit.startsWith("m")) {
            res1 = `${match[1]} m = ${(val1 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} ft`;
            res2 = `${match[2]} m = ${(val2 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} ft`;
        } else { return null; }
        return `${res1}\n${res2}`;
    }
  },
  {
    name: "ranges",
    pattern: `${createNumberPattern()}\\s*(?:-|to|–)\\s*${createNumberPattern()}\\s*(cm|centimeters?|in|inch|inches?|"|″|"|ft|feet|'|m|meters?|lbs?|pounds?|kg|kilograms?)\\b`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[3]) return null;
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const unit = match[3].toLowerCase();
        if (isNaN(val1) || isNaN(val2)) return null;
        
        let res1, res2, resUnit;
        if (unit.startsWith("in") || unit === '"' || unit === '"' || unit === '″') {
            res1 = (val1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1); 
            res2 = (val2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1); 
            resUnit = 'cm';
        } else if (unit.startsWith("cm")) {
            res1 = (val1 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1); 
            res2 = (val2 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1); 
            resUnit = 'in';
        } else if (unit.startsWith("ft") || unit === "'") {
            res1 = (val1 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1); 
            res2 = (val2 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1); 
            resUnit = 'm';
        } else if (unit.startsWith("m")) {
            res1 = (val1 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1); 
            res2 = (val2 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1); 
            resUnit = 'ft';
        } else if (unit.startsWith("lb") || unit.startsWith("pound")) {
            res1 = (val1 * CONVERSION_FACTORS.LB_TO_KG).toFixed(1); 
            res2 = (val2 * CONVERSION_FACTORS.LB_TO_KG).toFixed(1); 
            resUnit = 'kg';
        } else if (unit.startsWith("kg")) {
            res1 = (val1 / CONVERSION_FACTORS.LB_TO_KG).toFixed(1); 
            res2 = (val2 / CONVERSION_FACTORS.LB_TO_KG).toFixed(1); 
            resUnit = 'lb';
        } else { return null; }
        return `${match[0]} = ${res1}–${res2} ${resUnit}`;
    }
  },
  // ======= HIGH PRIORITY: "Fraction of" patterns =======
  {
    name: "fraction_of_tablespoon",
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(tablespoons?|tbsp?)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1)} ml`;
    }
  },
  {
    name: "fraction_of_teaspoon", 
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(teaspoons?|tsp?)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1)} ml`;
    }
  },
  {
    name: "fraction_of_cup",
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(cups?)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0)} ml`;
    }
  },
  {
    name: "fraction_of_inch",
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(inches?|inch|in)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    }
  },
  {
    name: "fraction_of_foot",
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(feet|foot|ft)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
    }
  },
  {
    name: "fraction_of_pound",
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(pounds?|lbs?|lb)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} kg`;
    }
  },
  {
    name: "fraction_of_ounce",
    pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(ounces?|oz)\\b`,
    convert: (match) => {
      const fraction = parseMeasurementValue(match[1]);
      if (isNaN(fraction)) return null;
      return `${match[0]} = ${(fraction * CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} g`;
    }
  },
  // ======= MEDIUM PRIORITY: Symbol-based units =======
  {
    name: "inches_symbol",
    pattern: `${createNumberPattern()}(?:"|″|")`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    },
  },
  {
    name: "feet_symbol",
    pattern: `${createNumberPattern()}'`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
    },
  },
  // ======= STANDARD PRIORITY: Regular units (FIXED - No lookbehinds) =======
  {
    name: "inches",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:inches?|inch|in)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    },
  },
  {
    name: "feet",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:feet|foot|ft)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
    },
  },
  {
    name: "centimeters",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:centimetres?|centimeters?|cm|CM)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} in`;
    },
  },
  {
    name: "millimeters",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:millimeters?|mm)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * 0.0393701).toFixed(2)} in`;
    },
  },
  {
    name: "meters",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:metres?|meters?|m|M)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} ft`;
    },
  },
  {
    name: "pounds",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:pounds?|lbs?|lb)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} kg`;
    },
  },
  {
  name: "kilometers",
  pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:kilometres?|kilometers?|km|KM)\\b`,
  convert: (match) => {
    const num = parseMeasurementValue(match[1]);
    if (isNaN(num)) return null;
    return `${match[0]} = ${(num * 0.621371).toFixed(2)} miles`;
    },
  },
  {
    name: "ounces",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:ounces?|oz)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} g`;
    },
  },
  {
    name: "grams",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:grams?|g)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} oz`;
    },
  },
  {
    name: "gallons",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:gallons?|gal)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.GALLON_TO_L).toFixed(2)} L`;
    },
  },
  {
    name: "liters",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:litres?|liters?|l|L)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.GALLON_TO_L).toFixed(2)} gal`;
    },
  },
  {
  name: "milliliters",
  pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:millilitres?|milliliters?|ml|mL)\\b(?![a-zA-Z])`,
  convert: (match) => {
    const num = parseMeasurementValue(match[1]);
    if (isNaN(num)) return null;
    return `${match[0]} = ${(num / CONVERSION_FACTORS.TSP_TO_ML).toFixed(2)} tsp`;
    },
  },
  {
  name: "cups",
  pattern: `\\b${createNumberPattern()}\\s*-?\\s*(?:cups?)\\b`,
  convert: (match) => {
    const num = parseMeasurementValue(match[1]);
    if (isNaN(num)) return null;
    return `${match[0]} = ${(num * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0)} ml`;
    },
  },
  {
    name: "tablespoons",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:tablespoons?|tbsp)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1)} ml`;
    },
  },
  {
    name: "teaspoons",
    pattern: `\\b(-?[\\d\\w\\.\\/]+|${Object.keys(unicodeFractions).join('|')}|(?:\\d+\\s+)?(?:quarters?|halves?|thirds?|half|quarter|third)|(?: and a half)?)\\s*-?\\s*(?:teaspoons?|tsp)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1)} ml`;
    },
  },
  // ======= TEMPERATURE CONVERSIONS =======
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

// ===== PERFORMANCE OPTIMIZATION: Pre-compile the massive regex =====
let COMPILED_REGEX = null;
let COMPILED_PATTERN = null;

function getCompiledRegex() {
  const currentPattern = conversions.map(c => `(?<${c.name}>${c.pattern})`).join("|");
  
  // Only recompile if pattern changed
  if (COMPILED_PATTERN !== currentPattern) {
    COMPILED_PATTERN = currentPattern;
    COMPILED_REGEX = new RegExp(currentPattern, "gi");
  }
  
  return COMPILED_REGEX;
}

/**
 * Parses a string that may contain numbers, fractions, or spelled-out words.
 * @param {string} valueString The string to parse.
 * @returns {number} The parsed numeric value, or NaN if parsing fails.
 */
function parseMeasurementValue(valueString) {
  const valStr = String(valueString).toLowerCase().trim();

  // Check measurement words first (including "of" phrases)
  if (measurementWords[valStr]) return measurementWords[valStr];
  
  // Handle "of" phrases like "half of a", "quarter of an"
  if (valStr.includes(' of ')) {
    const cleanStr = valStr.replace(/ of (?:a|an)\s*$/, '').replace(/ of$/, '');
    if (measurementWords[cleanStr]) return measurementWords[cleanStr];
  }

  // Unicode fractions
  if (unicodeFractions[valStr]) return unicodeFractions[valStr];

  // Legacy word-to-number dictionary (keeping for backwards compatibility)
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
    // Articles and fractions (now handled by measurementWords, but kept for safety)
    'a': 1, 'an': 1, 'half': 0.5, 'quarter': 0.25,
  };
  if (wordToNumber[valStr]) return wordToNumber[valStr];
  
  // Handle complex phrases like "one and a half", "two and a quarter"
  const complexMatch = valStr.match(/^(\w+)\s+and\s+(?:a\s+)?(\w+)$/);
  if (complexMatch) {
    const first = measurementWords[complexMatch[1]] || wordToNumber[complexMatch[1]];
    const second = measurementWords[complexMatch[2]] || wordToNumber[complexMatch[2]];
    if (!isNaN(first) && !isNaN(second)) {
      return first + second;
    }
  }
  
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

// This uses named capture groups based on the 'name' property in objects.
const combinedPattern = conversions.map(c => `(?<${c.name}>${c.pattern})`).join("|");

// Gemini text node processor
function processTextNode(textNode) {
  if (!textNode || textNode.nodeType !== 3) return;

  const parent = textNode.parentNode;
  if (!parent ||
      parent.closest(".hyper-hover, script, style, noscript, input, textarea, [contenteditable='true']") ||
      parent.closest("#hyper-converter-tooltip")) return;

  let text = textNode.textContent;
  if (!text.trim()) return;

  // --- NEW, SMARTER "TEXT STITCHING" LOGIC (Handles Sibling and Cousin nodes) ---
  let stitched = false;
  let previousTextNode = null;
  
  // Start by looking for an immediate previous sibling that is a text node
  let p = textNode.previousSibling;
  if (p && p.nodeType === 3) {
      previousTextNode = p;
  } 
  // If not found, check if the previous sibling is an element (like <span>)
  // and look for a text node as its last child. This finds the "cousin".
  else if (p && p.nodeType === 1 && p.lastChild && p.lastChild.nodeType === 3) {
      previousTextNode = p.lastChild;
  }

 // If we found a valid previous text node, check if it looks like the start of a measurement.
if (previousTextNode) {
  const prevText = previousTextNode.textContent;
  // Enhanced stitching: dimensions OR word fractions/numbers
  if (prevText.match(/(?:\b|\s)\d+(\.\d+)?\s*[xX]\s*$/) || 
      prevText.match(/\b(half|quarter|third|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|a|an)\s+$/i)) {
    text = prevText + text; // Stitch the text together
    stitched = true;
  }
}

  const regex = getCompiledRegex();
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach(match => {
    if (stitched && match.index !== 0) return;

    const fullMatch = match[0];
    const matchStart = match.index;
    const groups = match.groups;

    if (matchStart > lastIndex) {
      const beforeText = text.slice(lastIndex, matchStart);
      fragment.appendChild(document.createTextNode(beforeText));
    }

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
        const valueRegex = new RegExp(conversion.pattern, "i");
        const valueMatch = fullMatch.match(valueRegex);

        if (valueMatch) {
          const conversionResult = conversion.convert(valueMatch);

          if (conversionResult) {
            const span = document.createElement("span");
            span.className = "hyper-hover";
            // If we stitched, the span should contain the original, unstitched text
            span.textContent = stitched ? textNode.textContent : fullMatch;
            span.dataset.convert = conversionResult;
            fragment.appendChild(span);
          } else {
            fragment.appendChild(document.createTextNode(stitched ? textNode.textContent : fullMatch));
          }
        } else {
          fragment.appendChild(document.createTextNode(stitched ? textNode.textContent : fullMatch));
        }
      }
    } else {
      fragment.appendChild(document.createTextNode(stitched ? textNode.textContent : fullMatch));
    }
    
    lastIndex = matchStart + fullMatch.length;
  });

  // Only append trailing text if we didn't stitch
  if (!stitched && lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  if (fragment.hasChildNodes()) {
    try {
      if (stitched && previousTextNode) {
        // If we stitched, we need to replace BOTH the previous and current text nodes.
        previousTextNode.parentNode.removeChild(previousTextNode);
        parent.replaceChild(fragment, textNode);
      } else {
        parent.replaceChild(fragment, textNode);
      }
    } catch (e) {
      console.warn("Could not replace text node:", e);
    }
  }
}
// ===== PHASE 2: UNIFIED HIGH-PERFORMANCE PROCESSOR =====

// Debouncing for mutation observer
let mutationDebounceTimer = null;
const MUTATION_DEBOUNCE_DELAY = 150; // ms

// Cache for performance
const CONVERSION_CACHE = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * UNIFIED PROCESSOR - Replaces all 4 separate functions
 * Processes text nodes, split measurements, AllRecipes ingredients, and table measurements
 * in a single DOM traversal for maximum performance
 */
function processUnified(container) {
  if (!container) return;
  
  console.log("🚀 Unified processor starting...");
  
  // Step 1: Process regular text nodes (main conversion logic)
  processTextNodes(container);
  
  // Step 2: Process special cases in single query
  processSpecialCases(container);
  
  console.log("✅ Unified processing complete");
}

/**
 * Process all text nodes efficiently
 */
function processTextNodes(container) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentNode?.closest(".hyper-hover") ||
            node.parentNode?.closest("script, style, noscript, input, textarea") ||
            node.parentNode?.closest("#hyper-converter-tooltip") ||
            node.parentNode?.closest("[contenteditable='true']")) {
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

  // Process all text nodes
  textNodes.forEach(processTextNode);
}

/**
 * Process special cases in a single DOM query
 * Combines: split measurements, AllRecipes ingredients, table measurements
 */
function processSpecialCases(container) {
  // Single query for all special elements we need to check
  const specialElements = container.querySelectorAll(`
    em, strong, b, i,
    ul li,
    dl[class*="acl-dl"] dd,
    .mm-recipes-structured-ingredients__list li,
    ul[class*="ingredient"] li,
    ul[class*="recipe"] li,
    .ingredients ul li,
    .recipe-ingredients ul li
  `);
  
  const processedElements = new Set(); // Avoid double-processing
  
  specialElements.forEach(element => {
    if (processedElements.has(element)) return;
    processedElements.add(element);
    
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent.trim();
    
    // SPLIT MEASUREMENTS (em, strong, b, i tags)
    if (['em', 'strong', 'b', 'i'].includes(tagName)) {
      processSplitMeasurement(element, text);
    }
    
    // ALLRECIPES INGREDIENTS (li tags)
    else if (tagName === 'li' && text) {
      processIngredientItem(element, text);
    }
    
    // TABLE MEASUREMENTS (dd tags)
    else if (tagName === 'dd' && element.closest('dl[class*="acl-dl"]')) {
      processTableMeasurement(element, text);
    }
  });
}


 // Process split measurements (like "1/64 <em>inch</em>" or "3/4 <strong>teaspoon</strong>")
function processSplitMeasurement(element, unitText) {
  // Check if this element contains a unit word
  if (!isUnitWord(unitText)) return;
  
  // Look at the text immediately before this element
  const prevNode = element.previousSibling;
  if (prevNode && prevNode.nodeType === 3) { // text node
    const prevText = prevNode.textContent;
    
    // Enhanced pattern that includes Unicode fractions AND regular fractions
    const fractionPattern = `([\\d\\/]+|${Object.keys(unicodeFractions).join('|')})\\s*$`;
    const match = prevText.match(new RegExp(fractionPattern));
    
    if (match) {
      const numberPart = match[1];
      const fullMeasurement = numberPart + ' ' + unitText;
      
      // Find conversion
      const conversionResult = findConversion(fullMeasurement);
      
      if (conversionResult) {
        // Create a wrapper span around BOTH the number and unit
        const wrapper = document.createElement('span');
        wrapper.className = 'hyper-hover';
        wrapper.dataset.convert = conversionResult;
        
        // Update the previous text node to remove the number part
        const newPrevText = prevText.replace(new RegExp(fractionPattern), '');
        prevNode.textContent = newPrevText;
        
        // Add number + unit to wrapper
        wrapper.textContent = numberPart + ' ' + unitText;
        
        // Replace the unit element with our wrapper
        element.parentNode.replaceChild(wrapper, element);
      }
    }
  }
}

/**
 * Process ingredient items (AllRecipes and general cooking sites)
 */
function processIngredientItem(element, text) {
  // Check if this contains cooking measurements
  if (!hasCookingMeasurement(text)) return;
  
  console.log("Processing ingredient:", text);
  
  // Try to match cooking patterns
  const match = text.match(
    /(½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞|\d+(?:\/\d+)?)\s+(teaspoon|teaspoons|cup|cups|tablespoon|tablespoons|tsp|tbsp|ounce|ounces|oz)/i
  );
  
  if (match) {
    const value = match[1];
    const unit = match[2];
    
    // Get conversion using centralized factors
    const conversion = getCookingConversion(value, unit);
    
    if (conversion) {
      const measurementText = `${value} ${unit}`;
      element.innerHTML = text.replace(
        measurementText,
        `<span class="hyper-hover" data-convert="${conversion}">${measurementText}</span>`
      );
      console.log("Successfully highlighted ingredient:", text);
    }
  }
}

/**
 * Process table measurements (Home Depot style)
 */
function processTableMeasurement(element, text) {
  // Check if this DD contains only a number
  const numberMatch = text.match(/^\d+(\.\d+)?$/);
  
  if (numberMatch) {
    const numericValue = parseFloat(text);
    console.log(`📊 Found potential measurement number: ${text}`);
    
    // Look for unit context in nearby elements
    const unitContext = findUnitContext(element);
    
    if (unitContext) {
      const conversionResult = convertTableMeasurement(numericValue, unitContext.unit);
      
      if (conversionResult) {
        console.log(`✅ Converting: ${text} ${unitContext.unit} = ${conversionResult}`);
        
        // Create tooltip for this measurement
        element.classList.add('hyper-hover');
        element.dataset.convert = `${text} ${unitContext.unit} = ${conversionResult}`;
        
        // Add CSS styling if not already added
        if (!document.querySelector('#hyper-converter-table-styles')) {
          const style = document.createElement('style');
          style.id = 'hyper-converter-table-styles';
          style.textContent = `dd.hyper-hover { cursor: help !important; }`;
          document.head.appendChild(style);
        }
      }
    }
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Check if text is a unit word (cached for performance)
 */
let UNIT_PATTERN = null;
function isUnitWord(text) {
  if (!UNIT_PATTERN) {
    const unitWords = [
      'inch', 'inches', 'ft', 'feet', 'cm', 'centimeters', 'centimetres',
      'mm', 'millimeters', 'millimetres', 'm', 'meters', 'metres',
      'kg', 'kilograms', 'kgs', 'g', 'grams', 'l', 'liters', 'litres',
      'lb', 'lbs', 'pounds', 'oz', 'ounce', 'ounces', 'gal', 'gallons',
      'cup', 'cups', 'tbsp', 'tablespoons', 'tsp', 'teaspoons', 'teaspoon',
      'fahrenheit', 'celsius'
    ];
    UNIT_PATTERN = new RegExp(`^(${unitWords.join('|')})$`, 'i');
  }
  return UNIT_PATTERN.test(text);
}

/**
 * Check if text contains cooking measurements
 */
function hasCookingMeasurement(text) {
  return /(\d+|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞)\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs)/i.test(text);
}

/**
 * Find conversion with caching
 */
function findConversion(text) {
  if (CONVERSION_CACHE.has(text)) {
    return CONVERSION_CACHE.get(text);
  }
  
  // Try each conversion pattern
  for (const conversion of conversions) {
    const testRegex = new RegExp(conversion.pattern, "gi");
    const testMatch = testRegex.exec(text);
    if (testMatch) {
      const result = conversion.convert(testMatch);
      
      // Cache the result
      if (CONVERSION_CACHE.size >= MAX_CACHE_SIZE) {
        CONVERSION_CACHE.clear(); // Simple cache invalidation
      }
      CONVERSION_CACHE.set(text, result);
      
      return result;
    }
  }
  return null;
}

/**
 * Get cooking conversion using centralized factors
 */
function getCookingConversion(value, unit) {
  const numericValue = parseMeasurementValue(value);
  if (isNaN(numericValue)) return null;
  
  if (unit.includes("teaspoon") || unit === "tsp") {
    return `${value} ${unit} = ${(numericValue * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1)} ml`;
  } else if (unit.includes("cup")) {
    return `${value} ${unit} = ${(numericValue * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0)} ml`;
  } else if (unit.includes("tablespoon") || unit === "tbsp") {
    return `${value} ${unit} = ${(numericValue * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1)} ml`;
  } else if (unit.includes("ounce") || unit === "oz") {
    return `${value} ${unit} = ${(numericValue * CONVERSION_FACTORS.OZ_TO_G).toFixed(1)} g`;
  }
  return null;
}

// ===== DEBOUNCED MUTATION OBSERVER =====

/**
 * Debounced processing for mutations
 */
function debouncedProcess(container) {
  if (mutationDebounceTimer) {
    clearTimeout(mutationDebounceTimer);
  }
  
  mutationDebounceTimer = setTimeout(() => {
    processUnified(container);
    mutationDebounceTimer = null;
  }, MUTATION_DEBOUNCE_DELAY);
}

// ===== KEEP EXISTING HELPER FUNCTIONS =====
// (findUnitContext, extractUnit, convertTableMeasurement stay the same)

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
      return `${(value * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    case 'feet':
      return `${(value * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
    case 'cm':
      return `${(value / CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} inches`;
    case 'meters':
      return `${(value / CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} feet`;
    case 'pounds':
      return `${(value * CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} kg`;
    case 'kg':
      return `${(value / CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} lbs`;
    default:
      return null;
  }
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
  processUnified(document.body);
  
  const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Process the new node
        debouncedProcess(node);
        
        // AMAZON FIX: Also check for nested content that might contain measurements
        const measurementElements = node.querySelectorAll && node.querySelectorAll('[data-asin], .s-result-item, .a-section, .a-row');
        if (measurementElements && measurementElements.length > 0) {
          console.log("🛒 Amazon: Processing", measurementElements.length, "newly loaded elements");
          measurementElements.forEach(el => debouncedProcess(el));
        }
      }
    });
  });
});

// Scroll-based trigger for added robustness =====
let scrollDebounceTimer = null;
const SCROLL_DEBOUNCE_DELAY = 250; // ms

window.addEventListener('scroll', () => {
  if (scrollDebounceTimer) {
    clearTimeout(scrollDebounceTimer);
  }
  
  scrollDebounceTimer = setTimeout(() => {
    console.log("📜 Scroll event triggered processing...");
    processUnified(document.body); // Re-process the body
  }, SCROLL_DEBOUNCE_DELAY);
}); 

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true // Make sure you've made this change too
    });

        observer.observe(document.body, {
      childList: true,      // Watches for nodes being added/removed
      subtree: true,        // Watches descendants of the target
      characterData: true   // Watches for changes to text content
    });

    console.log("🚀 HyperConverter initialized");
  }
});