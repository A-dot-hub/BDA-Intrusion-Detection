import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Database, Network, TrendingUp } from 'lucide-react';

export default function MetricCards({
  packetCount,
  threatCount,
  fmEstimate,
  actualDistinct,
  isDdosActive,
  baselineStats,
  liveRate
}) {
  const isThreatHigh = fmEstimate > 500 || isDdosActive;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      
      {/* Metric 1: Total Packets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-medium">Flows Processed</span>
          <Cpu className="w-3.5 h-3.5 text-sky-500" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
          {packetCount.toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{liveRate} pkts/sec</span>
          <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
          <span>Line-Rate</span>
        </div>
      </div>

      {/* Metric 2: Bloom Filter Drops */}
      <div className={`bg-white dark:bg-slate-900 border rounded-lg p-3.5 shadow-xs transition-colors ${
        threatCount > 0
          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-medium">Bloom Filter Drops</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono tabular-nums">
          {threatCount.toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>k=7 hashes</span>
          <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
          <span>0.01% FP bound</span>
        </div>
      </div>

      {/* Metric 3: Flajolet-Martin Distinct Estimate */}
      <div className={`bg-white dark:bg-slate-900 border rounded-lg p-3.5 shadow-xs transition-colors ${
        isThreatHigh
          ? 'border-rose-400 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/30 animate-pulse'
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-medium">FM Distinct IPs</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isThreatHigh ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isThreatHigh ? 'DDoS Alert' : 'Normal'}
          </span>
        </div>
        <div className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${
          isThreatHigh ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
        }`}>
          {fmEstimate.toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Actual: {actualDistinct}</span>
          <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
          <span>Limit: 500</span>
        </div>
      </div>

      {/* Metric 4: MapReduce Baselines Loaded */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-medium">Hadoop Baselines</span>
          <Database className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
          {baselineStats?.total || '17,006'}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{baselineStats?.blacklisted || '8,155'} Blacklisted</span>
          <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
          <span>Count &gt; 5</span>
        </div>
      </div>

      {/* Metric 5: Botnet Graph Clusters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-medium">Botnet Community</span>
          <Network className="w-3.5 h-3.5 text-purple-500" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400 font-mono tabular-nums">
          Q = 0.684
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>C2: 104.16.207.165</span>
          <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
          <span>14 Bots</span>
        </div>
      </div>

      {/* Metric 6: R Predictive Engine */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-medium">R Forecast Engine</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
          R² = 0.941
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Multiple Linear Reg</span>
          <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
          <span>p &lt; 2.2e-16</span>
        </div>
      </div>

    </div>
  );
}
