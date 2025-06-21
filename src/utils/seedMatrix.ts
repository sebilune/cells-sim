// Utilities for converting between a 16-char base-36 seed and a 6x6 matrix of floats

// Use all two-decimal values from -1.00 to 1.00 (inclusive)
const DIGIT_TO_FLOAT = (() => {
  const values: number[] = [];
  for (let i = 0; i <= 200; i++) {
    values.push(parseFloat((-1 + i * 0.01).toFixed(2)));
  }
  return values;
})();

const FLOAT_TO_DIGIT = (() => {
  const map: Record<string, number> = {};
  DIGIT_TO_FLOAT.forEach((val, idx) => {
    map[val.toFixed(2)] = idx;
  });
  return map;
})();

// Use base-62 (0-9, a-z, A-Z)
const BASE62_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Converts a base-62 seed string into a 6x6 matrix of floats.
 * @param seed - A 66-character base-62 seed string (0-9, a-z, A-Z).
 * @returns 6x6 matrix with float values.
 */
export function seedToMatrix(seed: string): number[][] {
  seed = seed.trim();
  if (!/^[0-9a-zA-Z]{66}$/.test(seed)) {
    throw new Error(
      "Seed must be exactly 66 alphanumeric characters (0-9, a-z, A-Z)."
    );
  }
  // Convert from base-62 to a number
  let bigInt = BigInt(0);
  for (let i = 0; i < seed.length; i++) {
    const char = seed[i];
    const value = BASE62_CHARS.indexOf(char);
    if (value === -1) throw new Error("Invalid character in seed");
    bigInt = bigInt * BigInt(62) + BigInt(value);
  }
  const base = BigInt(201);
  const digits: number[] = [];
  for (let i = 0; i < 36; i++) {
    digits.unshift(Number(bigInt % base));
    bigInt = bigInt / base;
  }
  const matrix: number[][] = [];
  for (let row = 0; row < 6; row++) {
    matrix.push([]);
    for (let col = 0; col < 6; col++) {
      const val = DIGIT_TO_FLOAT[digits[row * 6 + col]];
      matrix[row].push(val);
    }
  }
  return matrix;
}

/**
 * Converts a 6x6 matrix of floats back into the original seed string (0-9, a-z, A-Z).
 * @param matrix - 6x6 matrix of floats.
 * @returns The original 66-character seed string (0-9, a-z, A-Z).
 */
export function matrixToSeed(matrix: number[][]): string {
  if (
    !Array.isArray(matrix) ||
    matrix.length !== 6 ||
    matrix.some((row) => row.length !== 6)
  ) {
    throw new Error("Matrix must be a 6x6 array.");
  }
  const digits = matrix.flat().map((val) => {
    const key = val.toFixed(2);
    if (!(key in FLOAT_TO_DIGIT)) {
      throw new Error(`Invalid matrix value: ${val}`);
    }
    return FLOAT_TO_DIGIT[key];
  });
  let bigInt = BigInt(0);
  const base = BigInt(201);
  for (let i = 0; i < digits.length; i++) {
    bigInt = bigInt * base + BigInt(digits[i]);
  }
  // Convert bigInt to base-62 string (0-9, a-z, A-Z)
  let seed = "";
  const base62 = BigInt(62);
  while (seed.length < 66) {
    const remainder = bigInt % base62;
    seed = BASE62_CHARS[Number(remainder)] + seed;
    bigInt = bigInt / base62;
  }
  return seed;
}

/**
 * Generates a random 6x6 matrix of floats from -1.00 to 1.00, rounded to 2 decimals.
 * @returns 6x6 matrix with random float values.
 */
export function randomAttractionRules(): number[][] {
  const rules: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const row: number[] = [];
    for (let j = 0; j < 6; j++) {
      // Random float from -1.00 to 1.00, rounded to 2 decimals
      const val = Math.round((Math.random() * 2 - 1) * 100) / 100;
      row.push(val);
    }
    rules.push(row);
  }
  return rules;
}
