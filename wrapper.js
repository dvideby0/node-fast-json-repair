const { repairJsonRust } = require('./index.js');

/**
 * Repair invalid JSON string and return either the repaired JSON string or parsed object.
 * 
 * @param {string} jsonString - The potentially invalid JSON string to repair
 * @param {Object} options - Options for repair
 * @param {boolean} [options.returnObjects=false] - If true, return the parsed JavaScript object instead of JSON string
 * @param {boolean} [options.skipJsonLoads=false] - If true, skip initial validation with JSON.parse
 * @param {boolean} [options.ensureAscii=true] - If true, escape non-ASCII characters in output
 * @param {number|null} [options.indent=null] - Number of spaces for indentation (null for compact output)
 * @returns {string|any} Either the repaired JSON string or parsed JavaScript object (if returnObjects=true)
 */
function repairJSON(jsonString, options = {}) {
  const {
    returnObjects = false,
    skipJsonLoads = false,
    ensureAscii = true,
    indent = null,
  } = options;

  if (typeof jsonString !== 'string') {
    throw new TypeError(`Expected string, got ${typeof jsonString}`);
  }

  if (!jsonString.trim()) {
    if (returnObjects) {
      return null;
    }
    return 'null';
  }

  // Fast path: if skipJsonLoads is false, try parsing with JSON.parse first
  // Skip fast path if ensureAscii is true, as we need Rust to handle ASCII escaping
  if (!skipJsonLoads && !ensureAscii) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check for Infinity/NaN which should be converted to null
      const hasInvalidNumbers = JSON.stringify(parsed).includes('null') !== 
                                 JSON.stringify(parsed, (key, value) => {
                                   if (typeof value === 'number' && !isFinite(value)) {
                                     return null;
                                   }
                                   return value;
                                 }).includes('null');
      
      if (hasInvalidNumbers || JSON.stringify(parsed).match(/[Infinity|NaN]/)) {
        // Fall through to Rust repair logic
      } else {
        if (returnObjects) {
          return parsed;
        }
        // Re-serialize with the requested options
        if (indent !== null) {
          return JSON.stringify(parsed, null, indent);
        }
        return JSON.stringify(parsed);
      }
    } catch (e) {
      // Fall through to repair logic
    }
  }

  // Call Rust repair function
  const repaired = repairJsonRust(jsonString, ensureAscii, indent || 0);

  if (returnObjects) {
    // Parse the repaired JSON string
    try {
      return JSON.parse(repaired);
    } catch (e) {
      // If still invalid after repair, return null
      return null;
    }
  }

  return repaired;
}

/**
 * Repair and parse invalid JSON string to JavaScript object.
 * 
 * This is a convenience wrapper around repairJSON with returnObjects=true.
 * 
 * @param {string} jsonString - The potentially invalid JSON string to repair and parse
 * @param {Object} options - Additional options passed to repairJSON
 * @returns {any} The parsed JavaScript object
 */
function parseJSON(jsonString, options = {}) {
  return repairJSON(jsonString, { ...options, returnObjects: true });
}

module.exports = { repairJSON, parseJSON };

