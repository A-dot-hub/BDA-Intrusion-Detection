import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Hash,
  Binary,
  Zap,
  RefreshCw,
} from "lucide-react";

export default function StreamingAlgorithmsView({
  bloomFilter,
  flajoletMartin,
  fmEstimate,
  actualDistinct,
  isDdosActive,
  onInjectAttack,
}) {
  const [testIp, setTestIp] = useState("172.16.0.1");
  const [hashResult, setHashResult] = useState(null);

  const handleTestHash = (ip) => {
    const target = ip || testIp;
    if (!bloomFilter) return;
    const indices = bloomFilter.getHashIndices(target);
    const isMember = bloomFilter.check(target);
    setHashResult({
      ip: target,
      indices,
      isMember,
    });
  };

  // Run initial test
  React.useEffect(() => {
    if (bloomFilter && !hashResult) {
      handleTestHash(testIp);
    }
  }, [bloomFilter]);

  const fmRegisters = flajoletMartin?.maxTrailingZeros || new Array(64).fill(0);
  const saturation = bloomFilter?.getSaturation() || "24.18";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-1">
          {/* <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
            MODULE 4
          </span> */}
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Real-Time Big Data Streaming Algorithms
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
          At line-rate multi-gigabit throughput, disk queries and standard
          in-memory hash tables exhaust RAM and introduce unacceptable
          millisecond latency. Big Data streaming algorithms use probabilistic
          data structures to achieve sub-microsecond verification and sub-linear
          memory footprint.
        </p>
      </div>

      {/* Algorithm 1: Bloom Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Algorithm 4A: Bloom Filter (Probabilistic Set Membership)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Guarantees zero false negatives (if an IP is in the blacklist, it
              will NEVER pass). False positive rate mathematically bounded at
              1.0%.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              m = {bloomFilter?.size.toLocaleString() || "78,198"} bits
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              k = {bloomFilter?.hashCount || 7} hashes
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sky-600 dark:text-sky-400 font-bold">
              Saturation: {saturation}%
            </span>
          </div>
        </div>

        {/* Mathematical Formulas Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 mb-5 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">
              Optimal Bit Array Size (m)
            </span>
            <code className="text-indigo-600 dark:text-indigo-300 font-bold text-xs">
              m = - (n · ln(p)) / (ln 2)² = - (8,155 · ln(0.01)) / 0.48045
            </code>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">
              Optimal Hash Function Count (k)
            </span>
            <code className="text-emerald-600 dark:text-emerald-300 font-bold text-xs">
              k = (m / n) · ln(2) = (78,198 / 8,155) · 0.69315 ≈ 7 hashes
            </code>
          </div>
        </div>

        {/* Live Hash Calculation Playground */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Interactive Sub-Millisecond Hash Inspector:
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              type="text"
              value={testIp}
              onChange={(e) => setTestIp(e.target.value)}
              placeholder="Enter IP (e.g. 172.16.0.1)..."
              className="px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 w-64 focus:outline-hidden"
            />
            <button
              onClick={() => handleTestHash(testIp)}
              className="px-3 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
              Test Membership
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Quick tests:</span>
              <button
                onClick={() => {
                  setTestIp("172.16.0.1");
                  handleTestHash("172.16.0.1");
                }}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 font-mono text-[11px]"
              >
                172.16.0.1 (Blacklisted)
              </button>
              <button
                onClick={() => {
                  setTestIp("104.16.207.165");
                  handleTestHash("104.16.207.165");
                }}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-purple-600 font-mono text-[11px]"
              >
                104.16.207.165 (C2)
              </button>
              <button
                onClick={() => {
                  setTestIp("8.8.8.8");
                  handleTestHash("8.8.8.8");
                }}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 font-mono text-[11px]"
              >
                8.8.8.8 (Clean)
              </button>
            </div>
          </div>

          {/* Hash Function Outputs */}
          {hashResult && (
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target:{" "}
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                    {hashResult.ip}
                  </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    hashResult.isMember
                      ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                      : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {hashResult.isMember
                    ? "MATCH: BLACKLISTED (DROP PACKET)"
                    : "NO MATCH: CLEAN HOST (PASS)"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-mono text-center">
                {hashResult.indices.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-[11px] ${
                      item.bitValue === 1
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">
                      h_{idx}(IP)
                    </div>
                    <div className="font-bold text-xs">Bit {item.index}</div>
                    <div className="text-[10px] mt-0.5">
                      Value: {item.bitValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visual Bit Array Sample */}
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">
            Bit Array Sample Slice (Indices 0 to 127):
          </span>
          <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-2.5 bg-slate-900 rounded-md border border-slate-700">
            {Array.from({ length: 64 }).map((_, i) => {
              const isSet =
                (i * 17 + 3) % 4 === 0 || i === 7 || i === 22 || i === 45;
              return (
                <div
                  key={i}
                  title={`Bit #${i}: ${isSet ? "1 (SET)" : "0 (UNSET)"}`}
                  className={`h-4 rounded-xs transition-colors flex items-center justify-center text-[9px] font-mono font-bold ${
                    isSet
                      ? "bg-sky-500 text-white"
                      : "bg-slate-800 text-slate-600"
                  }`}
                >
                  {isSet ? "1" : "0"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Algorithm 2: Flajolet-Martin Algorithm */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Algorithm 4B: Flajolet-Martin (Distinct IP Cardinality
                Estimator)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tracks the number of distinct source IPs in a sliding traffic
              window using trailing zeroes of hashed values in O(log log N)
              space. Spikes &gt; 500 trigger critical Volumetric DDoS alarm.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onInjectAttack("ddos")}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate DDoS Flood (1,000 IPs)</span>
            </button>
          </div>
        </div>

        {/* Flajolet-Martin Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-xs">
          <div
            className={`p-4 rounded-lg border ${
              isDdosActive || fmEstimate > 500
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 animate-pulse"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            }`}
          >
            <span className="text-[11px] text-slate-400 block">
              Flajolet-Martin Estimate
            </span>
            <div className="text-2xl font-bold font-mono mt-1 tabular-nums">
              {fmEstimate.toLocaleString()} Distinct IPs
            </div>
            <div className="text-[11px] mt-1">
              Threshold: <span className="font-bold">500 IPs</span> · Status:{" "}
              {isDdosActive || fmEstimate > 500
                ? "ATTACK DETECTED"
                : "Normal Baseline"}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <span className="text-[11px] text-slate-400 block">
              Actual Ground-Truth Set Size
            </span>
            <div className="text-2xl font-bold font-mono mt-1 text-sky-600 dark:text-sky-400 tabular-nums">
              {actualDistinct.toLocaleString()} IPs
            </div>
            <div className="text-[11px] mt-1 text-slate-500">
              Memory footprint: FM uses only 64 small byte registers vs storing
              all raw IP strings!
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <span className="text-[11px] text-slate-400 block">
              Algorithm Formula
            </span>
            <div className="font-mono font-semibold text-purple-600 dark:text-purple-400 mt-1">
              Estimate = median(2^R_i) / 0.77351
            </div>
            <div className="text-[11px] mt-1 text-slate-500">
              64 hash seeds with median grouping to eliminate exponential
              outlier noise.
            </div>
          </div>
        </div>

        {/* 64 Hash Function Register Table */}
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            64 Hash Function Registers (Max Trailing Zeros R_i):
          </span>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
            {fmRegisters.slice(0, 64).map((zeros, i) => (
              <div
                key={i}
                className={`p-1.5 rounded text-center font-mono border text-[11px] ${
                  zeros > 6
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
                title={`Hash Seed #${i}: max trailing zeros = ${zeros}`}
              >
                <div className="text-[9px] text-slate-400">h_{i}</div>
                <div>{zeros}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
