import React from 'react';
import { BarChart3, Cpu, Activity, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StreamAnalytics({ chartData, fmEstimate }) {
  return (
    <div className="space-y-6">
      {/* Description Card */}
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533] flex items-start gap-4">
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 mt-1">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">Flajolet-Martin Algorithm for Distinct IP Cardinality</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            The Flajolet-Martin algorithm computes approximate distinct element counts (cardinality) in data streams using hash functions and trailing zero bit patterns. By using 64 hash functions and median estimators, NetSentinel tracks unique IP volumes without storing infinite state.
          </p>
        </div>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Current Distinct IP Estimate</span>
          <p className="text-4xl font-bold font-mono text-purple-400 mt-2">{fmEstimate}</p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">64 Hash Functions Active</span>
        </div>
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Estimation Accuracy</span>
          <p className="text-4xl font-bold font-mono text-emerald-400 mt-2">± 1.28 / √m</p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Log-space probabilistic approximation</span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
        <h3 className="text-sm font-bold text-slate-100 mb-4">Cardinality Estimation Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222533" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#161925', borderColor: '#222533', borderRadius: '12px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="threats" stroke="#c084fc" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
