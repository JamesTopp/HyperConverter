/**
 * HyperConverter - Automatic Unit Conversion Extension
 * 
 * Detects measurements on web pages and provides instant conversions
 * via hover tooltips (Imperial ↔ Metric, Fahrenheit ↔ Celsius).
 * 
 * Features:
 * - Handles complex patterns (5'10", 1½ cups, 32-40°F)
 * - Works with recipe sites, e-commerce, news articles
 * - Caches conversions for performance
 * - Respects user input fields and contenteditable areas
 * 
 * @version 1.0.0
 */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

// Performance Settings
const PERFORMANCE_SETTINGS = {
  MAX_CACHE_SIZE: 1000,
  MUTATION_DEBOUNCE_MS: 150,
  SCROLL_DEBOUNCE_MS: 250,
};

// DOM Selectors
const EXCLUDED_SELECTORS = ".hyper-hover, script, style, noscript, input, textarea, [contenteditable='true'], #hyper-converter-tooltip, nav, header, [role='navigation'], [role='banner'], .nav, .navbar, .navigation, .menu, .header";

const CONVERSION_FACTORS = {
  INCH_TO_CM: 2.54,
  FOOT_TO_M: 0.3048,
  YARD_TO_M: 0.9144,
  MILE_TO_KM: 1.60934,
  KM_TO_MILE: 0.621371,
  MM_TO_IN: 0.0393701,
  LB_TO_KG: 0.453592,
  OZ_TO_G: 28.3495,
  GALLON_TO_L: 3.78541,
  QUART_TO_L: 0.946353,
  PINT_TO_L: 0.473176,
  PINT_TO_ML: 473.176,
  CUP_TO_ML: 237,
  TBSP_TO_ML: 14.787,
  TSP_TO_ML: 4.929,
  SQ_FT_TO_SQ_M: 0.092903,
  SQ_IN_TO_SQ_CM: 6.4516,
  CU_FT_TO_CU_M: 0.0283168,
  CU_IN_TO_CU_CM: 16.387,
  MPH_TO_KMH: 1.60934,
};

const UNICODE_FRACTIONS = {
  "⅛": 0.125, "⅙": 0.167, "⅕": 0.2, "¼": 0.25, "⅓": 0.333, "⅜": 0.375,
  "⅖": 0.4, "½": 0.5, "⅔": 0.667, "⅗": 0.6, "¾": 0.75, "⅘": 0.8,
  "⅚": 0.833, "⅞": 0.875,
};

const INCH_SYMBOLS = `"|″|"|"|''|′′|''|inches?|inch|in|IN|In`;
const FEET_SYMBOLS = `'|'|'|′|feet|foot|ft|FT|Ft`;

const createInchPattern = () => `(?:${INCH_SYMBOLS})`;
const createFeetPattern = () => `(?:${FEET_SYMBOLS})`;

const MEASUREMENT_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100, 'thousand': 1000,
  
  'half': 0.5, 'halves': 0.5,
  'quarter': 0.25, 'quarters': 0.25,
  'third': 0.333, 'thirds': 0.333,
  'eighth': 0.125, 'eighths': 0.125,
  'sixteenth': 0.0625, 'sixteenths': 0.0625,
  
  'three-quarters': 0.75, 'three quarters': 0.75,
  'two-thirds': 0.667, 'two thirds': 0.667,
  'three-eighths': 0.375, 'three eighths': 0.375,
  'five-eighths': 0.625, 'five eighths': 0.625,
  'seven-eighths': 0.875, 'seven eighths': 0.875,
  'three-sixteenths': 0.1875, 'three sixteenths': 0.1875,
  'five-sixteenths': 0.3125, 'five sixteenths': 0.3125,
  'seven-sixteenths': 0.4375, 'seven sixteenths': 0.4375,
  'nine-sixteenths': 0.5625, 'nine sixteenths': 0.5625,
  'eleven-sixteenths': 0.6875, 'eleven sixteenths': 0.6875,
  'thirteen-sixteenths': 0.8125, 'thirteen sixteenths': 0.8125,
  'fifteen-sixteenths': 0.9375, 'fifteen sixteenths': 0.9375,
  
  'a': 1, 'an': 1, 'couple': 2, 'few': 3, 'several': 4,
  
  'one and half': 1.5, 'one and a half': 1.5,
  'two and half': 2.5, 'two and a half': 2.5, 
  'three and half': 3.5, 'three and a half': 3.5,
  'four and half': 4.5, 'four and a half': 4.5,
  'five and half': 5.5, 'five and a half': 5.5,
  'one and quarter': 1.25, 'one and a quarter': 1.25,
  'two and quarter': 2.25, 'two and a quarter': 2.25,
  'three and quarter': 3.25, 'three and a quarter': 3.25,
  'four and quarter': 4.25, 'four and a quarter': 4.25,
  'one and third': 1.333, 'one and a third': 1.333,
  'two and third': 2.333, 'two and a third': 2.333,
  
  'one and three quarters': 1.75, 'one and three-quarters': 1.75,
  'two and three quarters': 2.75, 'two and three-quarters': 2.75,
  'one and two thirds': 1.667, 'one and two-thirds': 1.667,
  
  'half a': 0.5, 'half an': 0.5,
  'quarter': 0.25,
  'couple': 2,
  'few': 3,
  
  'half of a': 0.5, 'half of an': 0.5,
  'quarter of a': 0.25, 'quarter of an': 0.25,
  'third of a': 0.333, 'third of an': 0.333,
  'couple of': 2, 'few of': 3,
  'half of': 0.5, 'quarter of': 0.25, 'third of': 0.333
};

// ============================================
// PATTERN CREATION
// ============================================

const createNumberPattern = () => {
    const textMixedNumber = `\\d+\\s+\\d+\\/\\d+`;
    const numbers = `\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?(?:\\/\\d+)?|\\d+\\s+[${Object.keys(UNICODE_FRACTIONS).join('')}]`;
    const unicodes = Object.keys(UNICODE_FRACTIONS).join('|');
    const allWordKeys = Object.keys(MEASUREMENT_WORDS);
    const baseWords = ['half', 'quarter', 'third', 'eighth', 'couple', 'few'];
    const wordPhrases = `(?:(?:${baseWords.join('|')})\\s+(?:of\\s+)?(?:a|an)\\s+)`;
    const singleWords = `(?:\\b(?:${allWordKeys.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b)`;
    const compoundPhrases = `(?:\\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\\s+and\\s+(?:a\\s+)?(?:half|quarter|third|eighth|sixteenth)\\b|\\d+\\s+[${Object.keys(UNICODE_FRACTIONS).join('')}])`;

    return `(${textMixedNumber}|${numbers}|${unicodes}|${compoundPhrases}|${wordPhrases}|${singleWords})`;
};

const createFractionPattern = () => {
  const numbers = `\\d+(?:\\.\\d+)?(?:\\/\\d+)?`;
  const unicodes = Object.keys(UNICODE_FRACTIONS).join('|');
  const words = `(?:${Object.keys(MEASUREMENT_WORDS).join('|')})`;
  const wordPhrases = `(?:${words}(?:\\s+of)?)`;
  
  return `(${numbers}|${unicodes}|${wordPhrases})`;
};

// ============================================
// CONVERSION DEFINITIONS
// ============================================

const conversions = [
  // Complex Multi-Part Patterns
  {
    name: "feet_and_inches",
    pattern: `(${createNumberPattern()})\\s*${createFeetPattern()}\\s*[−–\\-\\s]*\\s*(${createNumberPattern()})\\s*${createInchPattern()}`,
    convert: (match) => {
      const feet = parseMeasurementValue(match[1]);
      const inches = parseMeasurementValue(match[2]);
      if (isNaN(feet) || isNaN(inches)) return null;
      
      const totalInches = feet * 12 + inches;
      const totalCm = totalInches * CONVERSION_FACTORS.INCH_TO_CM;
      const totalM = totalCm / 100;
      
      if (totalCm > 100) {
        return `${match[0]} = ${totalCm.toFixed(1)} cm (${totalM.toFixed(2)} m)`;
      }
      return `${match[0]} = ${totalCm.toFixed(1)} cm`;
    }
  },
  
  {
      name: "multi_dimensions_symbol", 
      pattern: `${createNumberPattern()}\\s*${createInchPattern()}?\\s*[xX×]\\s*${createNumberPattern()}\\s*${createInchPattern()}`,
      convert: (match) => {
          if (!match || !match[1] || !match[2]) return null;
          const val1 = parseMeasurementValue(match[1]);
          const val2 = parseMeasurementValue(match[2]);
          if (isNaN(val1) || isNaN(val2)) return null;

          const cm1 = (val1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
          const cm2 = (val2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
          
          return `${val1}" = ${cm1} cm\n${val2}" = ${cm2} cm`;
      }
  },

  {
    name: "dimensions_with_x",
    pattern: `(${createNumberPattern()})\\s*${createFeetPattern()}?\\s*(${createNumberPattern()})?\\s*${createInchPattern()}?\\s*[xX×]\\s*(${createNumberPattern()})\\s*${createFeetPattern()}?\\s*(${createNumberPattern()})?\\s*${createInchPattern()}`,
    convert: (match) => {
      const feet1 = match[1] ? parseMeasurementValue(match[1]) : 0;
      const inches1 = match[2] ? parseMeasurementValue(match[2]) : feet1;
      const totalInches1 = match[2] ? (feet1 * 12 + inches1) : inches1;
      
      const feet2 = match[3] ? parseMeasurementValue(match[3]) : 0;
      const inches2 = match[4] ? parseMeasurementValue(match[4]) : feet2;
      const totalInches2 = match[4] ? (feet2 * 12 + inches2) : inches2;
      
      if (isNaN(totalInches1) || isNaN(totalInches2)) return null;
      
      const cm1 = (totalInches1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
      const cm2 = (totalInches2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
      
      return `${match[0]} = ${cm1} cm × ${cm2} cm`;
    }
  },
  
  {
    name: "fractional_inches",
    pattern: `(\\d+)\\s*[−–\\-]?\\s*([${Object.keys(UNICODE_FRACTIONS).join('')}]|\\d+[⁄\\/]\\d+)\\s*${createInchPattern()}`,
    convert: (match) => {
      const whole = parseFloat(match[1]);
      let fraction = 0;
      
      if (UNICODE_FRACTIONS[match[2]]) {
        fraction = UNICODE_FRACTIONS[match[2]];
      } else {
        const parts = match[2].split(/[⁄\/]/);
        if (parts.length === 2) {
          fraction = parseFloat(parts[0]) / parseFloat(parts[1]);
        }
      }
      
      const total = whole + fraction;
      if (isNaN(total)) return null;
      return `${match[0]} = ${(total * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    }
  },
  
  {
    name: "fraction_only_inches",
    pattern: `([${Object.keys(UNICODE_FRACTIONS).join('')}]|\\d+[⁄\\/]\\d+|\\.\\d+)\\s*${createInchPattern()}`,
    convert: (match) => {
      let value = 0;
      
      if (UNICODE_FRACTIONS[match[1]]) {
        value = UNICODE_FRACTIONS[match[1]];
      } else if (match[1].includes('⁄') || match[1].includes('/')) {
        const parts = match[1].split(/[⁄\/]/);
        value = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        value = parseFloat(match[1]);
      }
      
      if (isNaN(value)) return null;
      return `${match[0]} = ${(value * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    }
  },

  {
    name: "ranges_and_dimensions",
    pattern: `(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)\\s*(?:-|—|–|to|[xX×]|x)\\s*(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)(?:\\s*(?:[xX×]|x)\\s*(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?))?\\s*(cm|centimeters?|centimetres?|in|inch|inches?|"|″|"|"|ft|feet|'|'|'|m|meters?|metres?|mm|millimeters?|millimetres?|km|kilometers?|kilometres?|yd|yards?|lbs?|pounds?|kg|kilograms?|g|grams?|oz|ounces?|gal|gallons?|qt|quarts?|pt|pints?|l|liters?|litres?|ml|milliliters?|millilitres?|cups?|tbsp|tablespoons?|tsp|teaspoons?|[°º]\\s?[fFcC]|degrees?\\s?[fFcC]|degrees?\\s?fahrenheit|degrees?\\s?celsius|fahrenheit|celsius)(?=\\s|$|[^a-zA-Z])`,
    convert: (match) => {
        if (!match || !match[1] || !match[2] || !match[4]) return null;
        
        const val1 = parseMeasurementValue(match[1]);
        const val2 = parseMeasurementValue(match[2]);
        const hasThirdDimension = match[3] !== undefined;
        const val3 = hasThirdDimension ? parseMeasurementValue(match[3]) : null;
        const unit = match[4].toLowerCase();
        const separator = match[0].match(/\d+\s*[xX×]\s*\d+/) ? 'x' : 'range';
        
        if (isNaN(val1) || isNaN(val2) || (hasThirdDimension && isNaN(val3))) return null;
        
        if (separator === 'x') {
            let res1, res2, res3;
            
            if (unit.startsWith("in") || unit.startsWith("inch") || unit === '"' || unit === '"' || unit === '″' || unit === '"') {
                res1 = `${val1} in = ${(val1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
                res2 = `${val2} in = ${(val2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
                if (hasThirdDimension) res3 = `${val3} in = ${(val3 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} cm`;
            } else if (unit.startsWith("cm") || unit.startsWith("centimeter") || unit.startsWith("centimetre")) {
                res1 = `${val1} cm = ${(val1 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} in`;
                res2 = `${val2} cm = ${(val2 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} in`;
                if (hasThirdDimension) res3 = `${val3} cm = ${(val3 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1)} in`;
            } else if (unit.startsWith("ft") || unit.startsWith("feet") || unit.startsWith("foot") || unit === "'" || unit === "'" || unit === "'") {
                res1 = `${val1} ft = ${(val1 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} m`;
                res2 = `${val2} ft = ${(val2 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} m`;
                if (hasThirdDimension) res3 = `${val3} ft = ${(val3 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} m`;
            } else if (unit.startsWith("yd") || unit.startsWith("yard")) {
                res1 = `${val1} yd = ${(val1 * CONVERSION_FACTORS.YARD_TO_M).toFixed(1)} m`;
                res2 = `${val2} yd = ${(val2 * CONVERSION_FACTORS.YARD_TO_M).toFixed(1)} m`;
                if (hasThirdDimension) res3 = `${val3} yd = ${(val3 * CONVERSION_FACTORS.YARD_TO_M).toFixed(1)} m`;
            } else if (unit.startsWith("mm") || unit.startsWith("millimeter") || unit.startsWith("millimetre")) {
                res1 = `${val1} mm = ${(val1 * CONVERSION_FACTORS.MM_TO_IN).toFixed(1)} in`;
                res2 = `${val2} mm = ${(val2 * CONVERSION_FACTORS.MM_TO_IN).toFixed(1)} in`;
                if (hasThirdDimension) res3 = `${val3} mm = ${(val3 * CONVERSION_FACTORS.MM_TO_IN).toFixed(1)} in`;
            } else if ((unit.startsWith("m") && !unit.startsWith("mm") && !unit.startsWith("ml")) || unit.startsWith("meter") || unit.startsWith("metre")) {
                res1 = `${val1} m = ${(val1 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} ft`;
                res2 = `${val2} m = ${(val2 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} ft`;
                if (hasThirdDimension) res3 = `${val3} m = ${(val3 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1)} ft`;
            } else {
                return null;
            }
            
            return hasThirdDimension ? `${res1}\n${res2}\n${res3}` : `${res1}\n${res2}`;
        }
        
        else {
            let res1, res2, resUnit;
            const rangeUnit = match[4].toLowerCase();
            
            if (rangeUnit.startsWith("in") || rangeUnit.startsWith("inch") || rangeUnit === '"' || rangeUnit === '"' || rangeUnit === '″' || rangeUnit === '"') {
                res1 = (val1 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
                resUnit = 'cm';
            } else if (rangeUnit.startsWith("cm") || rangeUnit.startsWith("centimeter") || rangeUnit.startsWith("centimetre")) {
                res1 = (val1 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
                res2 = (val2 / CONVERSION_FACTORS.INCH_TO_CM).toFixed(1);
                resUnit = 'in';
            } else if (rangeUnit.startsWith("ft") || rangeUnit.startsWith("feet") || rangeUnit.startsWith("foot") || rangeUnit === "'" || rangeUnit === "'" || rangeUnit === "'") {
                res1 = (val1 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.FOOT_TO_M).toFixed(1);
                resUnit = 'm';
            } else if (rangeUnit.startsWith("yd") || rangeUnit.startsWith("yard")) {
                res1 = (val1 * CONVERSION_FACTORS.YARD_TO_M).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.YARD_TO_M).toFixed(1);
                resUnit = 'm';
            } else if (rangeUnit.startsWith("mm") || rangeUnit.startsWith("millimeter") || rangeUnit.startsWith("millimetre")) {
                res1 = (val1 * CONVERSION_FACTORS.MM_TO_IN).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.MM_TO_IN).toFixed(1);
                resUnit = 'in';
            } else if (rangeUnit.startsWith("km") || rangeUnit.startsWith("kilometer") || rangeUnit.startsWith("kilometre")) {
                res1 = (val1 * CONVERSION_FACTORS.KM_TO_MILE).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.KM_TO_MILE).toFixed(1);
                resUnit = 'mi';
            } else if ((rangeUnit.startsWith("m") && !rangeUnit.startsWith("mm") && !rangeUnit.startsWith("ml")) || rangeUnit.startsWith("meter") || rangeUnit.startsWith("metre")) {
                res1 = (val1 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1);
                res2 = (val2 / CONVERSION_FACTORS.FOOT_TO_M).toFixed(1);
                resUnit = 'ft';
            } else if (rangeUnit.startsWith("lb") || rangeUnit.startsWith("pound")) {
                res1 = (val1 * CONVERSION_FACTORS.LB_TO_KG).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.LB_TO_KG).toFixed(1);
                resUnit = 'kg';
            } else if (rangeUnit.startsWith("kg") || rangeUnit.startsWith("kilogram")) {
                res1 = (val1 / CONVERSION_FACTORS.LB_TO_KG).toFixed(1);
                res2 = (val2 / CONVERSION_FACTORS.LB_TO_KG).toFixed(1);
                resUnit = 'lbs';
            } else if (rangeUnit.startsWith("oz") || rangeUnit.startsWith("ounce")) {
                res1 = (val1 * CONVERSION_FACTORS.OZ_TO_G).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.OZ_TO_G).toFixed(1);
                resUnit = 'g';
            } else if (rangeUnit.startsWith("g") && !rangeUnit.startsWith("gal") && rangeUnit !== "g") {
                res1 = (val1 / CONVERSION_FACTORS.OZ_TO_G).toFixed(1);
                res2 = (val2 / CONVERSION_FACTORS.OZ_TO_G).toFixed(1);
                resUnit = 'oz';
            } else if (rangeUnit.startsWith("gal") || rangeUnit.startsWith("gallon")) {
                res1 = (val1 * CONVERSION_FACTORS.GALLON_TO_L).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.GALLON_TO_L).toFixed(1);
                resUnit = 'L';
            } else if (rangeUnit.startsWith("qt") || rangeUnit.startsWith("quart")) {
                res1 = (val1 * CONVERSION_FACTORS.QUART_TO_L).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.QUART_TO_L).toFixed(1);
                resUnit = 'L';
            } else if (rangeUnit.startsWith("pt") || rangeUnit.startsWith("pint")) {
                res1 = (val1 * CONVERSION_FACTORS.PINT_TO_L).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.PINT_TO_L).toFixed(1);
                resUnit = 'L';
            } else if ((rangeUnit.startsWith("l") && !rangeUnit.startsWith("lb")) || rangeUnit.startsWith("liter") || rangeUnit.startsWith("litre")) {
                res1 = (val1 / CONVERSION_FACTORS.GALLON_TO_L).toFixed(1);
                res2 = (val2 / CONVERSION_FACTORS.GALLON_TO_L).toFixed(1);
                resUnit = 'gal';
            } else if (rangeUnit.startsWith("ml") || rangeUnit.startsWith("milliliter") || rangeUnit.startsWith("millilitre")) {
                res1 = (val1 / CONVERSION_FACTORS.TSP_TO_ML).toFixed(1);
                res2 = (val2 / CONVERSION_FACTORS.TSP_TO_ML).toFixed(1);
                resUnit = 'tsp';
            } else if (rangeUnit.startsWith("cup")) {
                res1 = (val1 * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0);
                res2 = (val2 * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0);
                resUnit = 'ml';
            } else if (rangeUnit.startsWith("tbsp") || rangeUnit.startsWith("tablespoon")) {
                res1 = (val1 * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1);
                resUnit = 'ml';
            } else if (rangeUnit.startsWith("tsp") || rangeUnit.startsWith("teaspoon")) {
                res1 = (val1 * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1);
                res2 = (val2 * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1);
                resUnit = 'ml';
            } else if (rangeUnit.match(/[°º]\s?f|degrees?\s?f|degrees?\s?fahrenheit|fahrenheit/i)) {
                res1 = (((val1 - 32) * 5) / 9).toFixed(1);
                res2 = (((val2 - 32) * 5) / 9).toFixed(1);
                resUnit = '°C';
            } else if (rangeUnit.match(/[°º]\s?c|degrees?\s?c|degrees?\s?celsius|celsius/i)) {
                res1 = ((val1 * 9) / 5 + 32).toFixed(1);
                res2 = ((val2 * 9) / 5 + 32).toFixed(1);
                resUnit = '°F';
            } else {
                return null;
            }
            
            return `${match[0]} = ${res1}–${res2} ${resUnit}`;
        }
    }
  },
  
  // Fraction Patterns
  {
      name: "fraction_of_unit",
      pattern: `${createFractionPattern()}\\s+of\\s+an?\\s+(inches?|in|feet|foot|ft|yards?|yd|centimet(er|re)s?|cm|millimet(er|re)s?|mm|met(er|re)s?|m|kilomet(er|re)s?|km|miles?|mi|pounds?|lbs?|lb|ounces?|oz|grams?|g|kilograms?|kg|gallons?|gal|quarts?|qt|pints?|pt|lit(er|re)s?|l|millilit(er|re)s?|ml|cups?|tablespoons?|tbsp|teaspoons?|tsp|fahrenheit|celsius)\\b`,
      convert: (match) => {
          const fraction = parseMeasurementValue(match[1]);
          const unit = match[2].toLowerCase();
          if (isNaN(fraction)) return null;

          if (unit.startsWith("inche") || unit === "in") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
          }
          if (unit.startsWith("feet") || unit.startsWith("foot") || unit === "ft") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
          }
          if (unit.startsWith("yard") || unit === "yd") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.YARD_TO_M).toFixed(2)} m`;
          }
          if (unit.startsWith("centimet")) {
              return `${match[0]} = ${(fraction / CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} in`;
          }
          if (unit.startsWith("millimet")) {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.MM_TO_IN).toFixed(2)} in`;
          }
          if (unit.startsWith("met")) {
              return `${match[0]} = ${(fraction / CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} ft`;
          }
          if (unit.startsWith("kilomet") || unit === "km") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.KM_TO_MILE).toFixed(2)} miles`;
          }
          if (unit.startsWith("mile") || unit === "mi") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.MILE_TO_KM).toFixed(2)} km`;
          }
          if (unit.startsWith("pound") || unit.startsWith("lb")) {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} kg`;
          }
          if (unit.startsWith("ounce") || unit === "oz") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} g`;
          }
          if (unit.startsWith("gram") || unit === "g") {
              return `${match[0]} = ${(fraction / CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} oz`;
          }
          if (unit.startsWith("kilogram") || unit === "kg") {
              return `${match[0]} = ${(fraction / CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} lbs`;
          }
          if (unit.startsWith("gallon") || unit === "gal") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.GALLON_TO_L).toFixed(2)} L`;
          }
          if (unit.startsWith("quart") || unit === "qt") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.QUART_TO_L).toFixed(2)} L`;
          }
          if (unit.startsWith("pint") || unit === "pt") {
              const ml = fraction * CONVERSION_FACTORS.PINT_TO_ML;
              if (ml >= 1000) {
                  return `${match[0]} = ${(ml / 1000).toFixed(2)} L`;
              }
              return `${match[0]} = ${ml.toFixed(0)} ml`;
          }
          if (unit.startsWith("lit") || unit === "l") {
              return `${match[0]} = ${(fraction / CONVERSION_FACTORS.GALLON_TO_L).toFixed(2)} gal`;
          }
          if (unit.startsWith("millilit") || unit === "ml") {
              return `${match[0]} = ${(fraction / CONVERSION_FACTORS.TSP_TO_ML).toFixed(2)} tsp`;
          }
          if (unit.startsWith("cup")) {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0)} ml`;
          }
          if (unit.startsWith("tablespoon") || unit === "tbsp") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1)} ml`;
          }
          if (unit.startsWith("teaspoon") || unit === "tsp") {
              return `${match[0]} = ${(fraction * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1)} ml`;
          }
          if (unit.startsWith("fahrenheit")) {
              return `${match[0]} = ${(((fraction - 32) * 5) / 9).toFixed(1)} °C`;
          }
          if (unit.startsWith("celsius")) {
              return `${match[0]} = ${((fraction * 9) / 5 + 32).toFixed(1)} °F`;
          }

          return null;
      }
  },
  
  // Area Conversions
  {
    name: "area_square_feet",
    pattern: `${createNumberPattern()}\\s*(?:square\\s+feet|square\\s+foot|sq\\.?\\s*ft|sqft|ft[\u00B2\u00B3\u2070-\u209F23])\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const sqMeters = num * CONVERSION_FACTORS.SQ_FT_TO_SQ_M;
      return `${match[0]} = ${sqMeters.toFixed(2)} m²`;
    }
  },

  {
    name: "area_square_inches",
    pattern: `${createNumberPattern()}\\s*(?:square\\s+inches?|sq\\.?\\s*in|sqin|in²|in2)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const sqCm = num * CONVERSION_FACTORS.SQ_IN_TO_SQ_CM;
      return `${match[0]} = ${sqCm.toFixed(2)} cm²`;
    }
  },

  // Volume Conversions
  {
    name: "volume_cubic_feet",
    pattern: `${createNumberPattern()}\\s*(?:cubic\\s+feet|cubic\\s+foot|cu\\.?\\s*ft|cuft|ft³|ft3)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const cubicMeters = num * CONVERSION_FACTORS.CU_FT_TO_CU_M;
      return `${match[0]} = ${cubicMeters.toFixed(3)} m³`;
    }
  },

  {
    name: "volume_cubic_inches",
    pattern: `${createNumberPattern()}\\s*(?:cubic\\s+inches?|cu\\.?\\s*in|cuin|in[\u00B2\u00B3\u2070-\u209F23])\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const cubicCm = num * CONVERSION_FACTORS.CU_IN_TO_CU_CM;
      return `${match[0]} = ${cubicCm.toFixed(2)} cm³`;
    }
  },
  
// Symbol-Based Units
  {
    name: "inches_symbol",
    pattern: `${createNumberPattern()}${createInchPattern()}`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const result = `${match[0]} = ${(num * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
      return result.replace(/"/g, '&quot;');
    },
  },
  
  {
    name: "feet_symbol",
    pattern: `${createNumberPattern()}${createFeetPattern()}`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
    },
  },
  
// Single Unit Conversions
  {
    name: "yards",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:yards?|yds?|YD)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const meters = num * CONVERSION_FACTORS.YARD_TO_M;
      
      if (meters >= 1000) {
        const km = meters / 1000;
        return `${match[0]} = ${km.toFixed(2)} km`;
      }
      return `${match[0]} = ${meters.toFixed(2)} m`;
    }
  },
  
  {
    name: "inches",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:inches?|inch|in)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} cm`;
    },
  },
  
  {
    name: "feet",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:feet|foot|ft)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} m`;
    },
  },
  
  {
    name: "centimeters",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:centimetres?|centimeters?|cm|CM)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.INCH_TO_CM).toFixed(2)} in`;
    },
  },
  
  {
    name: "millimeters",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:millimeters?|mm)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.MM_TO_IN).toFixed(2)} in`;
    },
  },
  
  {
    name: "meters",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:metres?|meters?|m|M)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.FOOT_TO_M).toFixed(2)} ft`;
    },
  },
  
  {
    name: "kilometers",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:kilometres?|kilometers?|km|KM)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.KM_TO_MILE).toFixed(2)} miles`;
    },
  },
  
  {
    name: "miles",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:miles?|mi)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.MILE_TO_KM).toFixed(2)} km`;
    },
  },
  
  {
    name: "miles_per_hour",
    pattern: `${createNumberPattern()}\\s*(?:mph|miles?\\s*per\\s*hour|miles?\\/h)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const kmh = num * CONVERSION_FACTORS.MPH_TO_KMH;
      return `${match[0]} = ${kmh.toFixed(1)} km/h`;
    }
  },

  {
    name: "miles_per_gallon",
    pattern: `${createNumberPattern()}\\s*(?:mpg|miles?\\s*per\\s*gallon|miles?\\/gal)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const lper100km = 235.214 / num;
      return `${match[0]} = ${lper100km.toFixed(1)} L/100km`;
    }
  },
  
  {
    name: "pounds",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:pounds?|lbs?|lb)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} kg`;
    },
  },
  
  {
    name: "ounces",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:ounces?|oz)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} g`;
    },
  },
  
  {
    name: "grams",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:grams?|g)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.OZ_TO_G).toFixed(2)} oz`;
    },
  },
  
  {
    name: "kilograms",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:kilograms?|kg)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.LB_TO_KG).toFixed(2)} lbs`;
    },
  },
  
  {
    name: "gallons",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:gallons?|gal)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.GALLON_TO_L).toFixed(2)} L`;
    },
  },
  
  {
    name: "quarts",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:quarts?|qts?|QT)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const liters = num * CONVERSION_FACTORS.QUART_TO_L;
      return `${match[0]} = ${liters.toFixed(2)} L`;
    }
  },

  {
    name: "pints",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:pints?|pts?|PT)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      const liters = num * CONVERSION_FACTORS.PINT_TO_L;
      const ml = num * CONVERSION_FACTORS.PINT_TO_ML;
      
      if (liters >= 1) {
        return `${match[0]} = ${liters.toFixed(2)} L`;
      }
      return `${match[0]} = ${ml.toFixed(0)} ml`;
    }
  },
  
  {
    name: "liters",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:litres?|liters?|l|L)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.GALLON_TO_L).toFixed(2)} gal`;
    },
  },
  
  {
    name: "milliliters",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:millilitres?|milliliters?|ml|mL)\\b(?![a-zA-Z])`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num / CONVERSION_FACTORS.TSP_TO_ML).toFixed(2)} tsp`;
    },
  },
  
  {
    name: "cups",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:cups?)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.CUP_TO_ML).toFixed(0)} ml`;
    },
  },
  
  {
    name: "tablespoons",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:tablespoons?|tbsp)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.TBSP_TO_ML).toFixed(1)} ml`;
    },
  },
  
  {
    name: "teaspoons",
    pattern: `${createNumberPattern()}\\s*-?\\s*(?:teaspoons?|tsp)\\b`,
    convert: (match) => {
      const num = parseMeasurementValue(match[1]);
      if (isNaN(num)) return null;
      return `${match[0]} = ${(num * CONVERSION_FACTORS.TSP_TO_ML).toFixed(1)} ml`;
    },
  },
  
// Temperature Conversions
  {
      name: "fahrenheit",
      pattern: `(?<!\\d)(-?\\d+(?:\\.\\d+)?)\\s*(?:[°º]\\s?f(?:ahrenheit)?|degrees?\\s?f(?:ahrenheit)?|fahrenheit)\\b`,
      convert: (match) => {
        const num = parseMeasurementValue(match[1]);
        if (isNaN(num)) return null;
        return `${match[0]} = ${(((num - 32) * 5) / 9).toFixed(1)} °C`;
      },
  },
    
  {
      name: "celsius",
      pattern: `(?<!\\d)(-?\\d+(?:\\.\\d+)?)\\s*(?:[°º]\\s?c(?:elsius)?|degrees?\\s?c(?:elsius)?|celsius)\\b`, 
      convert: (match) => {
        const num = parseMeasurementValue(match[1]);
        if (isNaN(num)) return null;
        return `${match[0]} = ${((num * 9) / 5 + 32).toFixed(1)} °F`;
      },
  },
];

// ============================================
// REGEX COMPILATION & CACHING
// ============================================

const COMPILED_REGEX = (() => {
  const pattern = conversions.map(c => `(?<${c.name}>${c.pattern})`).join("|");
  return new RegExp(pattern, "gi");
})();

function getCompiledRegex() {
  return COMPILED_REGEX;
}

const CONVERSION_CACHE = new Map();

// ============================================
// VALUE PARSING
// ============================================

function parseMeasurementValue(valueString) {
      const valStr = String(valueString).replace(/,/g, '').toLowerCase().trim();

    // Handle text-based mixed numbers like "1 1/2"
    const textMixedMatch = valStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (textMixedMatch) {
        const whole = parseFloat(textMixedMatch[1]);
        const num = parseFloat(textMixedMatch[2]);
        const den = parseFloat(textMixedMatch[3]);
        if (den !== 0 && !isNaN(whole) && !isNaN(num) && !isNaN(den)) {
            return whole + (num / den);
        }
    }

    // Check measurement words first (including compound phrases)
    if (MEASUREMENT_WORDS[valStr]) return MEASUREMENT_WORDS[valStr];

    // Handle "X and Y" patterns (like "two and half", "one and quarter")
    const compoundMatch = valStr.match(/^(\w+(?:\s+\w+)?)\s+and\s+(?:a\s+)?(\w+(?:\s+\w+)?)$/);
    if (compoundMatch) {
        const first = MEASUREMENT_WORDS[compoundMatch[1]];
        let second = MEASUREMENT_WORDS[compoundMatch[2]];
        const sloppyFractions = { 'half': 0.5, 'quarter': 0.25, 'third': 0.333, 'eighth': 0.125, 'sixteenth': 0.0625 };
        if (sloppyFractions[compoundMatch[2]] && !valStr.includes(`and a ${compoundMatch[2]}`)) {
            second = sloppyFractions[compoundMatch[2]];
        }
        if (!isNaN(first) && !isNaN(second)) {
            return first + second;
        }
    }

    // Handle "number + unicode fraction" patterns (like "1 ½")
    const numberUnicodeMatch = valStr.match(/^(\d+)\s+([${Object.keys(UNICODE_FRACTIONS).join('')}])/);
    if (numberUnicodeMatch) {
        const wholeNumber = parseFloat(numberUnicodeMatch[1]);
        const fractionValue = UNICODE_FRACTIONS[numberUnicodeMatch[2]];
        if (!isNaN(wholeNumber) && fractionValue !== undefined) {
            return wholeNumber + fractionValue;
        }
    }

    // Handle hyphenated numbers like "twenty-one"
    const hyphenMatch = valStr.match(/^(\w+)-(\w+)$/);
    if (hyphenMatch) {
        const first = MEASUREMENT_WORDS[hyphenMatch[1]] || 0;
        const second = MEASUREMENT_WORDS[hyphenMatch[2]] || 0;
        if (first >= 20 && first <= 90 && second >= 1 && second <= 9) {
            return first + second;
        }
    }

    // Handle "of" phrases like "half of a", "quarter of an"
    if (valStr.includes(' of ')) {
        const cleanStr = valStr.replace(/ of (?:a|an)\s*$/, '').replace(/ of$/, '');
        if (MEASUREMENT_WORDS[cleanStr]) return MEASUREMENT_WORDS[cleanStr];
    }

    // Unicode fractions
    if (UNICODE_FRACTIONS[valStr]) return UNICODE_FRACTIONS[valStr];

    // Handle simple text fractions like "1/3"
    if (valStr.includes("/") && !valStr.includes(" ")) {
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

// ============================================
// CONVERSION TRACKING
// ============================================

function incrementConversionCount() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
            chrome.storage.local.get(['conversionCount'], function(result) {
                if (chrome.runtime.lastError) {
                    return; 
                }
                const currentCount = result.conversionCount || 0;
                const newCount = currentCount + 1;
                chrome.storage.local.set({conversionCount: newCount}, function() {
                    if (chrome.runtime.lastError) {
                        return; 
                    }
                });
            });
        } catch (e) {
            return;
        }
    }
}

// ============================================
// TOOLTIP SYSTEM
// ============================================

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
    background-color: #C8B5DB !important;
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
    incrementConversionCount();
  
  // Render line breaks for multi-line tooltips
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

// ============================================
// PAGE ENABLEMENT CHECK
// ============================================

function isPageEnabled(settings) {
    if (settings.globallyDisabled) {
        return false;
    }

    const currentDomain = window.location.hostname;
    const blacklistedSites = settings.blacklistedSites || [];

    const isBlacklisted = blacklistedSites.some(site =>
        currentDomain === site || currentDomain.endsWith('.' + site)
    );

    if (isBlacklisted) {
        return false;
    }

    return settings.enabled !== false;
}

// ============================================
// TEXT NODE PROCESSING
// ============================================

function processTextNode(textNode) {
    if (!textNode || textNode.nodeType !== 3) return;

    const parent = textNode.parentNode;

    if (!parent || parent.closest(EXCLUDED_SELECTORS)) return;

    let text = textNode.textContent;
    if (!text.trim()) return;

    let nodesToReplace = [textNode];
    let stitched = false;

    // Combine number + fraction in adjacent nodes
    if (text.match(/^\d+\s*$/)) {
        let nextNode = textNode.nextSibling;
        if (nextNode) {
            if (nextNode.nodeType === 3 && nextNode.textContent.match(/^\s*[⅛⅙⅕¼⅓⅜⅖½⅔⅗¾⅘⅚⅞]/)) {
                text += nextNode.textContent;
                nodesToReplace.push(nextNode);
                stitched = true;
            }
        }
    }

    // Handle mixed numbers split across nodes (e.g., "1 1/2" + "cups")
    if (!stitched && text.match(/\d+\s+\d+\/\d+\s*$/)) {
        let nextNode = textNode.nextSibling;
        if (nextNode) {
            while (nextNode && nextNode.nodeType === 1) {
                nextNode = nextNode.firstChild || nextNode.nextSibling;
            }
            if (nextNode && nextNode.nodeType === 3) {
                const nextText = nextNode.textContent;
                if (nextText.match(/^\s*(pounds?|lbs?|cups?|ounces?|oz|teaspoons?|tsp|tablespoons?|tbsp)/i)) {
                    text += nextText;
                    nodesToReplace.push(nextNode);
                    stitched = true;
                }
            }
        }
    }

    // Backward stitch: combine dimension patterns or word-based numbers
    if (!stitched) {
        let prevNode = textNode.previousSibling;
        if (prevNode && prevNode.nodeType === 3) {
            const prevText = prevNode.textContent;
            // Check for dimension patterns or word-based numbers.
            if (prevText.match(/(?:\b|\s)\d+(\.\d+)?\s*[xX]\s*$/) ||
                prevText.match(/\b(half|quarter|third|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|a|an)\s+$/i)) {
                text = prevText + text; // Stitch backward
                nodesToReplace.unshift(prevNode); // Mark the previous node to be removed
                stitched = true;
            }
        }
    }

    const regex = getCompiledRegex();
    regex.lastIndex = 0;

    // Find all matches in the (potentially stitched) text
    const matches = [];
    const processedRanges = []; // Track what we've already processed
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
            continue;
        }
        
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        // Check if this match overlaps with any already processed range
        const overlaps = processedRanges.some(range => 
            (matchStart >= range.start && matchStart < range.end) ||
            (matchEnd > range.start && matchEnd <= range.end)
        );
        
        if (!overlaps) {
            matches.push(match);
            processedRanges.push({ start: matchStart, end: matchEnd });
            
            // Special handling for mixed numbers - mark the fraction portion as processed too
            if (match[0].match(/\d+\s*[½¼¾⅛⅜⅝⅞⅓⅔⅙⅚]/)) {
            }
        }
    }

    if (matches.length === 0) return;

    // Sort matches by index, then by length (prefer longer matches at same position)
    matches.sort((a, b) => {
        if (a.index !== b.index) return a.index - b.index;
        return b[0].length - a[0].length;  // Longer matches first
    });
    
    // Build the replacement structure in a DocumentFragment
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    const usedRanges = [];

    for (const currentMatch of matches) {
        const matchStart = currentMatch.index;
        const matchEnd = currentMatch.index + currentMatch[0].length;
        
        // Check if this match overlaps with any already used range
        const isOverlapping = usedRanges.some(range => 
            (matchStart < range.end && matchEnd > range.start)
        );
        
        if (isOverlapping) {
            continue;
        }
        
        const fullMatch = currentMatch[0];
        const beforeText = text.slice(lastIndex, matchStart);
        
        if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
        }

        let conversionName = null;
        for (const key in currentMatch.groups) {
            if (currentMatch.groups[key] !== undefined) {
                conversionName = key;
                break;
            }
        }

        if (conversionName) {
            const conversion = conversions.find(c => c.name === conversionName);
            if (conversion) {
                const valueMatch = fullMatch.match(new RegExp(conversion.pattern, "i"));
                const conversionResult = valueMatch ? conversion.convert(valueMatch) : null;

                if (conversionResult) {
                    const span = document.createElement("span");
                    span.className = "hyper-hover";
                    span.textContent = fullMatch;
                    span.dataset.convert = conversionResult;
                    fragment.appendChild(span);
                } else {
                    fragment.appendChild(document.createTextNode(fullMatch));
                }
            }
            // Mark this range as used
    usedRanges.push({ start: matchStart, end: matchEnd });
    lastIndex = matchEnd;
        }    }
    const afterText = text.slice(lastIndex);
    if (afterText) {
        fragment.appendChild(document.createTextNode(afterText));
    }

    // Perform the final, safe DOM replacement
    try {
        if (nodesToReplace.length > 1) {
            // Multiple nodes were stitched - handle specially
            const firstNode = nodesToReplace[0];
            const parent = firstNode.parentNode;
            
            // Insert our new fragment before the first node
            parent.insertBefore(fragment, firstNode);
            
            // Remove ALL the original nodes that were stitched
            nodesToReplace.forEach(node => {
                if (node && node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
        } else {
            // Single node - use existing logic
            const primaryNode = nodesToReplace.shift();
            if(primaryNode && primaryNode.parentNode) {
                primaryNode.parentNode.replaceChild(fragment, primaryNode);
            }
        }
    } catch (e) {
        console.warn("HyperConverter: Could not replace text node.", e);
    }
}

// ============================================
// DOM PROCESSING
// ============================================

function processUnified(container) {
  if (!container) return;
  const textNodes = collectTextNodes(container);
  textNodes.forEach(processTextNode);
  processSpecialCases(container);
}

function collectTextNodes(container) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
         if (node.parentNode?.closest(EXCLUDED_SELECTORS)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (/[a-zA-Z0-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(node.textContent)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];
  let node;
  while (node = walker.nextNode()) {
    nodes.push(node);
  }
  return nodes;
}

function processSpecialCases(container) {

    // Handle AllRecipes split quantity/unit spans
  const quantitySpans = container.querySelectorAll('[data-ingredient-quantity="true"]');
  quantitySpans.forEach(qtySpan => {
    const unitSpan = qtySpan.nextElementSibling;
    if (unitSpan && unitSpan.getAttribute('data-ingredient-unit') === 'true') {
      const quantity = qtySpan.textContent.trim();
      const unit = unitSpan.textContent.trim();
      const fullMeasurement = `${quantity} ${unit}`;
      
      // Find conversion
      const conversionResult = findConversion(fullMeasurement);
      
      if (conversionResult) {
        // Wrap both spans in a hover element
        const wrapper = document.createElement('span');
        wrapper.className = 'hyper-hover';
        wrapper.dataset.convert = conversionResult;
        wrapper.innerHTML = qtySpan.outerHTML + unitSpan.outerHTML;
        
        qtySpan.parentNode.replaceChild(wrapper, qtySpan);
        unitSpan.remove();
      }
    }
  });

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
    
    // MULTI-MEASUREMENT LINES (li tags with multiple measurements)
    else if (tagName === 'li' && text && text.match(/(\d+|half|quarter|third|one|two|three|four|five|⅛|⅙|⅕|¼|⅓|⅜|⅖|½|⅔|⅗|¾|⅘|⅚|⅞|[\u2150-\u215F]).*?(°F|°C|degrees|fahrenheit|celsius|cups?|tsp|teaspoons?|tbsp|tablespoons?|pounds?|lbs?|ounces?|oz|inches?|inch|in|feet|foot|ft|cm|centimeters?|centimetres?|mm|millimeters?|millimetres?|meters?|metres?|m|km|kilometers?|kilometres?|kg|kilograms?|g|grams?|gal|gallons?|l|liters?|litres?|ml|milliliters?|millilitres?).*(\d+|half|quarter|third|one|two|three|four|five|⅛|⅙|⅕|¼|⅓|⅜|⅖|½|⅔|⅗|¾|⅘|⅚|⅞|[\u2150-\u215F]).*?(°F|°C|degrees|fahrenheit|celsius|cups?|tsp|teaspoons?|tbsp|tablespoons?|pounds?|lbs?|ounces?|oz|inches?|inch|in|feet|foot|ft|cm|centimeters?|centimetres?|mm|millimeters?|millimetres?|meters?|metres?|m|km|kilometers?|kilometres?|kg|kilograms?|g|grams?|gal|gallons?|l|liters?|litres?|ml|milliliters?|millilitres?)/)) {
        processRecipeInstruction(element, text);
    }

    // ALLRECIPES INGREDIENTS (li tags)
    else if (tagName === 'li' && text && !element.querySelector('.hyper-hover')) {
      processIngredientItem(element, text);
    }
        
    // TABLE MEASUREMENTS (dd tags)
    else if (tagName === 'dd' && element.closest('dl[class*="acl-dl"]')) {
      processTableMeasurement(element, text);
    }
  });
}


// Handle measurements split across text and formatting tags
function processSplitMeasurement(element, unitText) {
  // Check if this element contains a unit word
  if (!isUnitWord(unitText)) return;
  
  // Look at the text immediately before this element
  const prevNode = element.previousSibling;
  if (prevNode && prevNode.nodeType === 3) { // text node
    const prevText = prevNode.textContent;
    
    // Enhanced pattern that includes Unicode fractions AND regular fractions
    const fractionPattern = `([\\d\\/]+|${Object.keys(UNICODE_FRACTIONS).join('|')})\\s*$`;
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

function processIngredientItem(element, text) {
  if (!hasCookingMeasurement(text)) return;
    
  const match = text.match(
    /(\d+\s+\d+\/\d+|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅝|⅞|\d+(?:\/\d+)?|\d+)\s+(teaspoon|teaspoons|cup|cups|tablespoon|tablespoons|tsp|tbsp|ounce|ounces|oz|pound|pounds|lb|lbs)/i
  );
  
  if (match) {
    const value = match[1];
    const unit = match[2];
    
    const conversion = getCookingConversion(value, unit);
    
    if (conversion) {
      const measurementText = `${value} ${unit}`;
      element.innerHTML = text.replace(
        measurementText,
        `<span class="hyper-hover" data-convert="${conversion}">${measurementText}</span>`
      );
    }
  }
}

function processTableMeasurement(element, text) {
  const numberMatch = text.match(/^\d+(\.\d+)?$/);
  
  if (numberMatch) {
    const numericValue = parseFloat(text);    
    const unitContext = findUnitContext(element);
    
    if (unitContext) {
      const conversionResult = convertTableMeasurement(numericValue, unitContext.unit);
      
      if (conversionResult) {        
        element.classList.add('hyper-hover');
        element.dataset.convert = `${text} ${unitContext.unit} = ${conversionResult}`;
        
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

// ============================================
// HELPER FUNCTIONS
// ============================================

// Check if text is a unit word (cached for performance)
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
  return /(\d+\s+\d+\/\d+|\d+|½|¼|¾|⅛|⅙|⅕|⅓|⅜|⅖|⅔|⅗|⅘|⅚|⅞)\s+(cup|cups|teaspoon|teaspoons|tablespoon|tablespoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs)/i.test(text);
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
      if (CONVERSION_CACHE.size >= PERFORMANCE_SETTINGS.MAX_CACHE_SIZE) {
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

function processRecipeInstruction(element, text) {
  // Get the compiled regex to find all measurements in the text
  const regex = getCompiledRegex();
  regex.lastIndex = 0;
  
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
      continue;
    }
    matches.push(match);
  }
  
  if (matches.length <= 1) return; // Only process if multiple measurements
  
  let processedHTML = text;
  let offset = 0;
  
  for (const currentMatch of matches) {
    const matchStart = currentMatch.index + offset;
    const fullMatch = currentMatch[0];
    
    // Find the conversion
    let conversionName = null;
    for (const key in currentMatch.groups) {
      if (currentMatch.groups[key] !== undefined) {
        conversionName = key;
        break;
      }
    }
    
    if (conversionName) {
      const conversion = conversions.find(c => c.name === conversionName);
      if (conversion) {
        const valueMatch = fullMatch.match(new RegExp(conversion.pattern, "i"));
        const conversionResult = valueMatch ? conversion.convert(valueMatch) : null;
        
        if (conversionResult) {
          const replacement = `<span class="hyper-hover" data-convert="${conversionResult}">${fullMatch}</span>`;
          processedHTML = processedHTML.slice(0, matchStart) + replacement + processedHTML.slice(matchStart + fullMatch.length);
          offset += replacement.length - fullMatch.length;
        }
      }
    }
  }
  
  if (processedHTML !== text) {
    element.innerHTML = processedHTML;
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

// ============================================
// MUTATION OBSERVER
// ============================================

let mutationDebounceTimer = null;

function debouncedProcess(container) {
  if (mutationDebounceTimer) {
    clearTimeout(mutationDebounceTimer);
  }
  
  mutationDebounceTimer = setTimeout(() => {
    processUnified(container);
    mutationDebounceTimer = null;
  }, PERFORMANCE_SETTINGS.MUTATION_DEBOUNCE_MS);
}

// ============================================
// EVENT HANDLERS
// ============================================

document.addEventListener("mouseover", function(e) {
    const hoverTarget = e.target.closest('.hyper-hover');
    if (hoverTarget) {
        const convertText = hoverTarget.dataset.convert;
        if (convertText) {
            showTooltip(e, convertText);
        }
        return;
    }
  
    // Your existing button logic remains as a fallback.
    let buttonParent = e.target.closest('button, .a-button, [role="button"]');
    if (buttonParent) {
        const hyperHoverChild = buttonParent.querySelector('.hyper-hover');
        if (hyperHoverChild) {
            const convertText = hyperHoverChild.dataset.convert;
            if (convertText) {
                showTooltip(e, convertText);
            }
        }
    }
}, true);

document.addEventListener("mouseout", function(e) {
    // Use the same robust .closest() logic to find the relevant span.
    const hoverTarget = e.target.closest('.hyper-hover');

    if (hoverTarget) {
        hideTooltip();
        return;
    }
  
    // Your existing button logic.
    let buttonParent = e.target.closest('button, .a-button, [role="button"]');
    if (buttonParent && buttonParent.querySelector('.hyper-hover')) {
        hideTooltip();
    }
}, true);

// ============================================
// INITIALIZATION
// ============================================

// Listen for messages from the popup (for reloading the page).
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "reloadPage") {
            window.location.reload();
        }
    });
}

// Check if the extension should run on this page.
if (typeof chrome !== 'undefined' && chrome.storage) {
    // 1. Fetch ALL necessary settings, including the blacklist.
    chrome.storage.sync.get(['enabled', 'globallyDisabled', 'blacklistedSites'], (settings) => {
        
        // 2. Use our intelligent function to make the final decision.
        if (isPageEnabled(settings)) {
            
            // 3. If enabled, run the extension.
            processUnified(document.body);

                        let scrollDebounceTimer = null;

            window.addEventListener('scroll', () => {
                if (scrollDebounceTimer) {
                    clearTimeout(scrollDebounceTimer);
                }
                
                scrollDebounceTimer = setTimeout(() => {
                    // Re-process the entire page on scroll to catch lazy-loaded content.
                    processUnified(document.body); 
                }, PERFORMANCE_SETTINGS.SCROLL_DEBOUNCE_MS);
            });
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // Process the new node
                            debouncedProcess(node);
                            
                            const measurementElements = node.querySelectorAll && node.querySelectorAll('[data-asin], .s-result-item, .a-section, .a-row');
                            if (measurementElements && measurementElements.length > 0) {
                                measurementElements.forEach(el => debouncedProcess(el));
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });

            console.log("🚀 HyperConverter initialized");
        } else {
            // If the page is disabled, do nothing and log it.
            console.log("HyperConverter is disabled on this page.");
        }
    });
}