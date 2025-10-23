import { describe, it, expect } from 'vitest';
import { repairJSON, parseJSON } from '../wrapper.js';

// ============================================================================
// BASIC TESTS
// ============================================================================

describe('Basic JSON Repair', () => {
  it('should convert single quotes to double quotes', () => {
    const result = repairJSON("{'key': 'value'}");
    expect(JSON.parse(result)).toEqual({ key: 'value' });
  });

  it('should handle unquoted keys', () => {
    const result = repairJSON("{key: 'value'}");
    expect(JSON.parse(result)).toEqual({ key: 'value' });
  });

  it('should convert Python literals', () => {
    const result = repairJSON("{a: True, b: False, c: None}");
    expect(JSON.parse(result)).toEqual({ a: true, b: false, c: null });
  });

  it('should remove trailing commas', () => {
    const result = repairJSON('{"a": 1, "b": 2,}');
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
  });

  it('should auto-close missing brackets', () => {
    const result = repairJSON('{"a": [1, 2');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: [1, 2] });
  });

  it('should work with parseJSON convenience function', () => {
    const result = parseJSON("{'key': 'value'}");
    expect(result).toEqual({ key: 'value' });
  });

  it('should handle Unicode', () => {
    const result = repairJSON("{'msg': '你好'}", { ensureAscii: false });
    expect(result).toContain('你好');
    
    const resultAscii = repairJSON("{'msg': '你好'}", { ensureAscii: true });
    expect(resultAscii).toContain('\\u');
  });

  it('should support returnObjects parameter', () => {
    const result = repairJSON("{'key': 'value'}", { returnObjects: true });
    expect(result).toEqual({ key: 'value' });
    expect(typeof result).toBe('object');
  });

  it('should handle empty input', () => {
    expect(repairJSON('')).toBe('null');
    expect(repairJSON('   ')).toBe('null');
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('should escape non-ASCII with ensureAscii=true', () => {
    const result = repairJSON('{"msg": "你好"}', { ensureAscii: true });
    expect(result).toContain('\\u');
    expect(result).not.toContain('你好');
    // Verify it's valid JSON
    const parsed = JSON.parse(result);
    expect(parsed.msg).toBe('你好');
  });

  it('should preserve non-ASCII with ensureAscii=false', () => {
    const result = repairJSON('{"msg": "你好"}', { ensureAscii: false });
    expect(result).toContain('你好');
    expect(result).not.toContain('\\u');
    const parsed = JSON.parse(result);
    expect(parsed.msg).toBe('你好');
  });

  it('should handle various indent values', () => {
    const obj = '{"a": 1, "b": {"c": 2}}';
    
    // No indent (compact)
    const resultCompact = repairJSON(obj, { indent: null });
    expect(resultCompact).not.toContain('\n');
    
    // Indent = 2
    const result2 = repairJSON(obj, { indent: 2 });
    expect(result2).toContain('\n');
    expect(result2.match(/  "a"|  "b"/) !== null).toBe(true);
    
    // Indent = 4
    const result4 = repairJSON(obj, { indent: 4 });
    expect(result4).toContain('\n');
    expect(result4.match(/    "a"|    "b"/) !== null).toBe(true);
  });

  it('should preserve key order', () => {
    const inputJson = '{"z": 1, "a": 2, "m": 3}';
    const result = repairJSON(inputJson);
    
    // Extract key order from result
    const keyPattern = result.match(/"([^"]+)":/g).map(k => k.replace(/"/g, '').replace(':', ''));
    expect(keyPattern).toEqual(['z', 'a', 'm']);
  });

  it('should handle very deep nesting', () => {
    // Create deeply nested JSON (100 levels)
    const deepJson = '{"a":'.repeat(100) + '1' + '}'.repeat(100);
    const result = repairJSON(deepJson, { returnObjects: true });
    expect(result).not.toBeNull();
    
    // Verify structure
    let current = result;
    for (let i = 0; i < 100; i++) {
      expect(typeof current).toBe('object');
      expect('a' in current).toBe(true);
      current = current.a;
    }
    expect(current).toBe(1);
  });

  it('should handle exceeding max nesting depth', () => {
    // Create JSON deeper than max_depth (1000)
    const veryDeepJson = '{"a":'.repeat(1001) + '1' + '}'.repeat(1001);
    // Use skipJsonLoads=true to avoid JavaScript's recursion limit in JSON.stringify
    const result = repairJSON(veryDeepJson, { skipJsonLoads: true });
    expect(result).toBe('null');
  });

  it('should handle invalid numbers', () => {
    const testCases = [
      ['{"val": 1e999}', null],  // Overflow to infinity
      ['{"val": -1e999}', null],  // Negative infinity
      ['{"val": 0.0}', 0.0],
      ['{"val": -0.0}', -0.0],
      ['{"val": 1.23e-10}', 1.23e-10],
    ];
    
    for (const [inputStr, expected] of testCases) {
      const result = repairJSON(inputStr, { returnObjects: true });
      if (expected === null) {
        expect(result.val).toBeNull();
      } else {
        expect(result.val).toBe(expected);
      }
    }
  });

  it('should handle control characters', () => {
    const inputJson = '{"text": "line1\\nline2\\ttab\\rcarriage"}';
    const result = repairJSON(inputJson);
    const parsed = JSON.parse(result);
    expect(parsed.text).toBe("line1\nline2\ttab\rcarriage");
  });

  it('should handle unicode escape sequences', () => {
    const testCases = [
      ['{"text": "\\u0041"}', 'A'],
      ['{"text": "\\u4e2d\\u6587"}', '中文'],
      ['{"text": "\\u00e9"}', 'é'],
    ];
    
    for (const [inputStr, expected] of testCases) {
      const result = repairJSON(inputStr, { returnObjects: true });
      expect(result.text).toBe(expected);
    }
  });

  it('should handle mixed quotes complex scenarios', () => {
    const testCases = [
      ["{'a': \"b's value\"}", { a: "b's value" }],
      ['{"a": "b\\"s value"}', { a: 'b"s value' }],
      ["{'a': 'b\\'s value'}", { a: "b's value" }],
    ];
    
    for (const [inputStr, expected] of testCases) {
      const result = repairJSON(inputStr, { returnObjects: true });
      expect(result).toEqual(expected);
    }
  });

  it('should handle empty containers', () => {
    expect(repairJSON('[]', { returnObjects: true })).toEqual([]);
    expect(repairJSON('{}', { returnObjects: true })).toEqual({});
    expect(repairJSON('[[], {}, [{}]]', { returnObjects: true })).toEqual([[], {}, [{}]]);
  });

  it('should respect skipJsonLoads parameter', () => {
    // Valid JSON with skipJsonLoads=true should still work
    const validJson = '{"valid": true}';
    const result = repairJSON(validJson, { skipJsonLoads: true });
    expect(JSON.parse(result)).toEqual({ valid: true });
    
    // Invalid JSON should be repaired
    const invalidJson = "{'invalid': True}";
    const result2 = repairJSON(invalidJson, { skipJsonLoads: true });
    expect(JSON.parse(result2)).toEqual({ invalid: true });
  });

  it('should handle large arrays', () => {
    // Create array with 1000 elements
    const largeArray = '[' + Array.from({ length: 1000 }, (_, i) => i).join(',') + ']';
    const result = repairJSON(largeArray, { returnObjects: true });
    expect(result.length).toBe(1000);
    expect(result[0]).toBe(0);
    expect(result[999]).toBe(999);
  });

  it('should handle malformed escape sequences', () => {
    const testCases = [
      [String.raw`{"text": "\x41"}`, { text: "x41" }],  // Invalid hex escape
      [String.raw`{"text": "\u"}`, { text: "\\u" }],  // Incomplete unicode
      [String.raw`{"text": "\u00"}`, { text: "\\u00" }],  // Incomplete unicode
      [String.raw`{"text": "\u00G1"}`, { text: "\\u00G1" }],  // Invalid hex digit
    ];
    
    for (const [inputStr, expected] of testCases) {
      const result = repairJSON(inputStr, { returnObjects: true });
      expect(result).toEqual(expected);
    }
  });

  it('should handle numeric strings correctly', () => {
    const testCases = [
      ['{"val": "123"}', { val: "123" }],  // String should stay string
      ["{val: '123'}", { val: "123" }],  // Single quoted string
      ["{val: 123}", { val: 123 }],  // Actual number
      ['{val: "12.34e5"}', { val: "12.34e5" }],  // Scientific notation string
      ['{val: 12.34e5}', { val: 12.34e5 }],  // Scientific notation number
    ];
    
    for (const [inputStr, expected] of testCases) {
      const result = repairJSON(inputStr, { returnObjects: true });
      expect(result).toEqual(expected);
    }
  });

  it('should add missing commas between key-value pairs', () => {
    const result = repairJSON('{"a": 1 "b": 2 "c": 3}', { returnObjects: true });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
    
    // Array missing commas
    const result2 = repairJSON('[1 2 3]', { returnObjects: true });
    expect(result2).toEqual([1, 2, 3]);
  });

  it('should remove multiple trailing commas', () => {
    const result = repairJSON('{"a": 1,,,,"b": 2}', { returnObjects: true });
    expect(result).toEqual({ a: 1, b: 2 });
    
    const result2 = repairJSON('[1,,,2,,,3]', { returnObjects: true });
    expect(result2).toEqual([1, 2, 3]);
  });

  it('should throw TypeError for invalid input types', () => {
    expect(() => repairJSON(123)).toThrow(TypeError);
    expect(() => repairJSON(null)).toThrow(TypeError);
    expect(() => repairJSON({ already: 'dict' })).toThrow(TypeError);
    expect(() => repairJSON([1, 2, 3])).toThrow(TypeError);
  });

  it('should handle special numeric values', () => {
    const result = repairJSON(
      '{"zero": 0, "negative": -42, "float": 3.14159, "sci": 1.23e-10}',
      { returnObjects: true }
    );
    expect(result.zero).toBe(0);
    expect(result.negative).toBe(-42);
    expect(result.float).toBe(3.14159);
    expect(Math.abs(result.sci - 1.23e-10)).toBeLessThan(1e-15);
  });

  it('should handle completely invalid input gracefully', () => {
    // Should handle gracefully without crashing
    const result = repairJSON("not json at all!");
    expect(result).toBeDefined();
    
    const result2 = repairJSON("}{][ backwards");
    expect(result2).toBeDefined();
  });

  it('should preserve key order (regression test)', () => {
    // Test with indentation (where sorting bug occurred)
    const inputJson = '{"zebra": 1, "apple": 2, "middle": 3}';
    const result = repairJSON(inputJson, { indent: 2 });
    
    // Extract key order from result
    const keyPattern = result.match(/"([^"]+)":/g).map(k => k.replace(/"/g, '').replace(':', ''));
    expect(keyPattern).toEqual(['zebra', 'apple', 'middle']);
    
    // Also test compact format
    const resultCompact = repairJSON(inputJson);
    const keyPatternCompact = resultCompact.match(/"([^"]+)":/g).map(k => k.replace(/"/g, '').replace(':', ''));
    expect(keyPatternCompact).toEqual(['zebra', 'apple', 'middle']);
  });
});

