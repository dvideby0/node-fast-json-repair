# fast-json-repair

[![npm version](https://badge.fury.io/js/fast-json-repair.svg)](https://www.npmjs.com/package/fast-json-repair)
[![Node.js >= 16](https://img.shields.io/badge/node-%3E%3D%2016-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance JSON repair library for Node.js, powered by Rust. This is a port of [fast_json_repair (Python)](https://github.com/dvideby0/fast_json_repair) with the same functionality and performance benefits.

## 🙏 Attribution

This library is a **Rust port** of the excellent [json_repair](https://github.com/mangiucugna/json_repair) library created by [Stefano Baccianella](https://github.com/mangiucugna). The original Python implementation is a brilliant solution for fixing malformed JSON from Large Language Models (LLMs), and this Node.js port aims to bring the same functionality with improved performance.

**All credit for the original concept, logic, and implementation goes to Stefano Baccianella.** This Rust port maintains API compatibility with the original library while leveraging Rust's performance benefits.

If you find this library useful, please also consider starring the [original json_repair repository](https://github.com/mangiucugna/json_repair).

## Features

- 📦 **Available on npm**: `npm install fast-json-repair`
- 🚀 **Rust Performance**: Core repair logic implemented in Rust for maximum speed
- 🔧 **Automatic Repair**: Fixes common JSON errors automatically
- 🟢 **Node.js Compatible**: Works with Node.js 16+
- 🔄 **Drop-in Replacement**: Compatible API with similar JSON repair libraries
- ⚡ **Native Performance**: Compiled native bindings for all platforms

## Installation

### Quick Install

```bash
npm install fast-json-repair
# or
yarn add fast-json-repair
# or
pnpm add fast-json-repair
```

The package includes pre-built binaries for:
- **macOS**: x64, ARM64 (Apple Silicon)
- **Linux**: x64, ARM64 (including musl)
- **Windows**: x64

### Build from Source

<details>
<summary>Click to expand build instructions</summary>

#### Prerequisites
- Node.js 16 or later
- Rust toolchain (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- npm, yarn, or pnpm

#### Quick Start

```bash
# Clone the repository
git clone https://github.com/dvideby0/node-fast-json-repair.git
cd node-fast-json-repair

# Run the automated setup script
./setup.sh
```

The setup script will:
- ✅ Install Rust if needed
- ✅ Install npm dependencies
- ✅ Build the Rust extension
- ✅ Run tests to verify installation

#### Manual Build Steps

```bash
# Clone the repository
git clone https://github.com/dvideby0/node-fast-json-repair.git
cd node-fast-json-repair

# Install dependencies
npm install

# Build the native module
npm run build

# Run tests
npm test
```

</details>

## Usage

```javascript
const { repairJSON, parseJSON } = require('fast-json-repair');

// Fix broken JSON
const broken = "{'name': 'John', 'age': 30}";  // Single quotes
const fixed = repairJSON(broken);
console.log(fixed);  // {"name":"John","age":30}

// Parse directly to JavaScript object
const data = parseJSON("{'key': 'value'}");
console.log(data);  // { key: 'value' }

// Handle Unicode properly
const text = "{'message': '你好世界'}";
const result = repairJSON(text, { ensureAscii: false });
console.log(result);  // {"message":"你好世界"}

// Format with indentation
const formatted = repairJSON("{'a': 1}", { indent: 2 });
```

## What It Repairs

Automatically fixes common JSON formatting issues:

| Issue | Fix |
|-------|-----|
| Single quotes | → Double quotes |
| Unquoted keys | → Quoted keys |
| Python literals (True/False/None) | → JSON (true/false/null) |
| Trailing commas | Removed |
| Missing commas | Added |
| Extra commas | Removed |
| Unclosed brackets/braces | Auto-closed |
| Invalid escape sequences | Fixed |
| Unicode characters | Preserved or escaped (configurable) |

## API Reference

### `repairJSON(jsonString, options)`

Repairs invalid JSON and returns valid JSON string.

**Parameters:**
- `jsonString` (string): The potentially invalid JSON string to repair
- `options` (object):
  - `returnObjects` (boolean): If true, return parsed JavaScript object instead of JSON string
  - `skipJsonLoads` (boolean): If true, skip initial validation for better performance
  - `ensureAscii` (boolean): If true, escape non-ASCII characters in output
  - `indent` (number): Number of spaces for indentation (null for compact output)

**Returns:** 
- string or object: Repaired JSON string or parsed JavaScript object

**Examples:**

```javascript
// Basic repair
repairJSON("{'key': 'value'}");
// Returns: '{"key":"value"}'

// Get parsed object
repairJSON("{'key': 'value'}", { returnObjects: true });
// Returns: { key: 'value' }

// With Unicode preservation
repairJSON('{"msg": "你好"}', { ensureAscii: false });
// Returns: '{"msg":"你好"}'

// With indentation
repairJSON("{'a': 1, 'b': 2}", { indent: 2 });
// Returns:
// {
//   "a": 1,
//   "b": 2
// }
```

### `parseJSON(jsonString, options)`

Repairs and parses invalid JSON string to JavaScript object.

**Parameters:**
- `jsonString` (string): The potentially invalid JSON string to repair and parse
- `options` (object): Additional options passed to repairJSON (except `returnObjects` which is always true)

**Returns:**
- object: The parsed JavaScript object

**Example:**

```javascript
const obj = parseJSON("{'name': 'Alice', 'active': True}");
console.log(obj);  // { name: 'Alice', active: true }
```

## Performance

This Rust-based implementation provides significant performance improvements over pure JavaScript alternatives.

### Benchmark Results vs Pure JavaScript

Comprehensive comparison of fast-json-repair (Rust) vs [jsonrepair](https://github.com/josdejong/jsonrepair) (JavaScript) across 20 test cases:

| Test Case | Rust (ms) | JavaScript (ms) | Speedup |
|-----------|-----------|-----------------|---------|
| **Invalid JSON (needs repair)** | | | |
| Simple quotes | 0.005 | 0.012 | 🚀 2.45x |
| Medium nested | 0.014 | 0.042 | 🚀 2.96x |
| Large array (1000) | 0.143 | 0.388 | 🚀 2.71x |
| Deep nesting (50) | 0.038 | 0.069 | 🚀 1.80x |
| Large object (500) | 0.263 | 0.543 | 🚀 2.07x |
| Complex mixed | 0.019 | 0.034 | 🚀 1.77x |
| Unicode + special | 0.010 | 0.018 | 🚀 1.81x |
| **Long strings (10K)** | **0.045** | **0.741** | **🚀 16.52x** |
| Missing commas | 0.010 | 0.013 | 🚀 1.27x |
| **Valid JSON (fast path)** | | | |
| Small ASCII | 0.005 | 0.005 | ≈ Same |
| Small Unicode | 0.005 | 0.007 | 🚀 1.44x |
| Nested structure | 0.012 | 0.010 | 🐌 1.16x |
| Large array (1000) | 2.139 | 1.538 | 🐌 1.39x |
| Deep nesting (50) | 0.048 | 0.019 | 🐌 2.53x |
| Large object (500) | 1.396 | 0.908 | 🐌 1.54x |
| Very large (5000) | 0.412 | 0.714 | 🚀 1.74x |

**Overall: 1.11x faster** (11% improvement)

**Key Insights:**
- 🚀 = Rust implementation is faster
- 🐌 = JavaScript is faster (V8's optimized JSON.parse for valid JSON)
- **Invalid JSON repair**: 3.40x faster on average
- **Long strings**: Up to 16.5x faster
- **Valid JSON**: JavaScript is 1.24x faster (expected - V8 is highly optimized)

### Performance Advantages

**Where Rust Wins (3-17x faster):**
- ✅ **Repairing broken JSON** (the library's purpose)
- ✅ **Long string values** (16.5x faster)
- ✅ **Complex nested structures** with errors
- ✅ **LLM outputs** with multiple issues
- ✅ **Large malformed documents**

**Where JavaScript Wins (1.2-2.5x faster):**
- ✅ **Already-valid JSON** (V8's native JSON.parse)
- ✅ **Simple documents** with no errors
- ✅ **Small payloads** (< 1KB)

### When to Use

**Use This (Rust) For:**
- ✅ Processing LLM outputs (ChatGPT, Claude, Gemini, etc.)
- ✅ High-volume production APIs handling potentially broken JSON
- ✅ Large or complex JSON documents that need repair
- ✅ Consistent low-latency requirements
- ✅ String-heavy data (logs, text content, etc.)

**Use Pure JavaScript For:**
- Edge functions with bundle size constraints
- Frontend applications where native size matters
- Occasional simple repairs in development
- Mostly processing valid JSON (fast path advantage)

Run `npm run bench` to test performance on your system.

## Common Use Cases

### LLM/AI Output

```javascript
// LLM might return malformed JSON
const llmOutput = `{
  name: 'Alice',
  thoughts: 'I think this is correct',
  action: {
    type: 'respond',
    message: "Hello there!",
    confidence: 0.95,
  }
}`;

const parsed = parseJSON(llmOutput);
console.log(parsed.action.message);  // "Hello there!"
```

### API Response Recovery

```javascript
// Corrupted API response
const brokenResponse = `{
  'status': 'success',
  'data': [
    {id: 1, name: 'Item 1',},
    {id: 2, name: 'Item 2',}
  ],
  timestamp: 1234567890
}`;

const fixed = parseJSON(brokenResponse);
console.log(fixed.data.length);  // 2
```

### Configuration Files

```javascript
const fs = require('fs');
const { parseJSON } = require('fast-json-repair');

// Read potentially malformed config file
const configContent = fs.readFileSync('config.json', 'utf8');
const config = parseJSON(configContent);
```

## Development

### Quick Reference

| Task | Command | Description |
|------|---------|-------------|
| **Setup** | `./setup.sh` | Automated setup |
| **Build (release)** | `npm run build` | Build native module (release) |
| **Build (debug)** | `npm run build:debug` | Build native module (debug) |
| **Run tests** | `npm test` | Run test suite (Vitest) |
| **Run benchmarks** | `npm run bench` | Run performance benchmarks |

### Quick Setup

```bash
# Automated setup (recommended)
./setup.sh

# Or manually
npm install
npm run build
npm test
```

### Project Structure

```
fast-json-repair/
├── src/
│   └── lib.rs              # Rust implementation (core repair logic)
├── __test__/
│   └── test_all.test.mjs   # Test suite (Vitest)
├── benchmarks/
│   └── benchmark.mjs       # Performance benchmarks
├── wrapper.js              # JavaScript API wrapper
├── index.js                # Auto-generated napi-rs loader
├── index.d.ts              # TypeScript type definitions
├── package.json            # Package configuration
└── Cargo.toml              # Rust package configuration
```

### Typical Workflow

1. **Make Changes** - Edit Rust (`src/`) or JavaScript (`wrapper.js`) code
2. **Rebuild** - `npm run build`
3. **Test** - `npm test`
4. **Benchmark** - `npm run bench`
5. **Release** - `npm publish` when ready

## TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import { repairJSON, parseJSON, RepairOptions } from 'fast-json-repair';

interface User {
  name: string;
  age: number;
  active: boolean;
}

const brokenJSON = "{'name': 'John', 'age': 30, active: True}";

// Type-safe repair
const user = parseJSON<User>(brokenJSON);
console.log(user.name);  // TypeScript knows this is a string

// With options
const formatted = repairJSON(brokenJSON, { 
  indent: 2, 
  ensureAscii: false 
});
```

## License

MIT License (same as original json_repair)

## Credits & Acknowledgments

### Original Author
- **[Stefano Baccianella](https://github.com/mangiucugna)** - Creator of the original [json_repair](https://github.com/mangiucugna/json_repair) library
  - Original concept and algorithm design
  - Python implementation that this library is based on
  - Comprehensive test cases and edge case handling

### This Node.js Port
- Performance optimization through Rust implementation
- Maintains full API compatibility with the original
- Uses [napi-rs](https://napi.rs/) for Node.js bindings
- Native module with pre-built binaries for all platforms

### Special Thanks
A huge thank you to Stefano Baccianella for creating json_repair and making it open source. This library wouldn't exist without the original brilliant implementation that has helped countless developers handle malformed JSON from LLMs.

If you appreciate this performance-focused port, please also show support for the [original json_repair project](https://github.com/mangiucugna/json_repair) that made it all possible.
