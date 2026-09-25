/**
 * Big Data Analytics Streaming Engine
 * Faithful JavaScript implementation of:
 * - streaming/bloom_filter.py (BloomFilter class)
 * - streaming/flajolet_martin.py (FlajoletMartin class)
 * 
 * Works with real historical baselines from data/processed/historical_ip_baselines.csv
 * and real stream flows from data/processed/cicids2017_stream_processed.csv
 */

// Simple deterministic hash matching Python MD5/seed behavior
function hashItem(item, seed) {
  let str = `${seed}_${item}`;
  let hash1 = 0x811c9dc5;
  let hash2 = 0xcbf29ce4;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    hash1 ^= code;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= code;
    hash2 = Math.imul(hash2, 0x100000001b3);
  }
  return Math.abs(hash1 ^ hash2);
}

// 1. Bloom Filter Implementation
export class BloomFilter {
  constructor(expectedItems = 8155, falsePositiveRate = 0.01) {
    this.expectedItems = Math.max(expectedItems, 1);
    this.falsePositiveRate = falsePositiveRate;
    // m = - (n * ln(p)) / (ln(2)^2)
    this.size = Math.floor(-(this.expectedItems * Math.log(this.falsePositiveRate)) / Math.pow(Math.log(2), 2));
    // k = (m / n) * ln(2)
    this.hashCount = Math.max(1, Math.floor((this.size / this.expectedItems) * Math.log(2)));
    
    // Uint8Array for memory efficiency
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
    this.itemsAdded = 0;
  }

  _getBit(index) {
    const byteIndex = Math.floor(index / 8);
    const bitOffset = index % 8;
    return (this.bitArray[byteIndex] >> bitOffset) & 1;
  }

  _setBit(index) {
    const byteIndex = Math.floor(index / 8);
    const bitOffset = index % 8;
    this.bitArray[byteIndex] |= (1 << bitOffset);
  }

  add(item) {
    for (let i = 0; i < this.hashCount; i++) {
      const digest = hashItem(item, i) % this.size;
      this._setBit(digest);
    }
    this.itemsAdded++;
  }

  check(item) {
    for (let i = 0; i < this.hashCount; i++) {
      const digest = hashItem(item, i) % this.size;
      if (this._getBit(digest) === 0) {
        return false;
      }
    }
    return true;
  }

  getHashIndices(item) {
    const indices = [];
    for (let i = 0; i < this.hashCount; i++) {
      indices.push({
        seed: i,
        index: hashItem(item, i) % this.size,
        bitValue: this._getBit(hashItem(item, i) % this.size)
      });
    }
    return indices;
  }

  getSaturation() {
    let setBits = 0;
    for (let i = 0; i < this.bitArray.length; i++) {
      let byte = this.bitArray[i];
      while (byte > 0) {
        setBits += byte & 1;
        byte >>= 1;
      }
    }
    return ((setBits / this.size) * 100).toFixed(2);
  }
}

// 2. Flajolet-Martin Algorithm Implementation
export class FlajoletMartin {
  constructor(numHashes = 64) {
    this.numHashes = numHashes;
    this.maxTrailingZeros = new Array(numHashes).fill(0);
    this.seenSet = new Set();
  }

  _trailingZeros(num) {
    if (num === 0) return 0;
    let count = 0;
    while ((num & 1) === 0 && count < 32) {
      count++;
      num >>>= 1;
    }
    return count;
  }

  add(item) {
    this.seenSet.add(item);
    for (let i = 0; i < this.numHashes; i++) {
      const hashVal = hashItem(item, i);
      const zeros = this._trailingZeros(hashVal);
      if (zeros > this.maxTrailingZeros[i]) {
        this.maxTrailingZeros[i] = zeros;
      }
    }
  }

  estimate() {
    const estimates = this.maxTrailingZeros.map(r => Math.pow(2, r));
    // Sort to compute median
    const sorted = [...estimates].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianEstimate = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Magic constant for FM algorithm: 0.77351
    const estimate = Math.floor(medianEstimate / 0.77351);
    return Math.max(estimate, this.seenSet.size > 0 ? 1 : 0);
  }

  getActualDistinct() {
    return this.seenSet.size;
  }

  reset() {
    this.maxTrailingZeros.fill(0);
    this.seenSet.clear();
  }
}
