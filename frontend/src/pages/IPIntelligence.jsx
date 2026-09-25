import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Database, ArrowDown, Lock, CheckCircle2 } from 'lucide-react';

export default function IPIntelligence() {
  const [blacklist, setBlacklist] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/blacklist')
      .then(res => res.json())
      .then(data => setBlacklist(data))
      .catch(() => {});

    fetch('http://127.0.0.1:8000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Pipeline Architecture Visual Representation */}
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
        <h3 className="text-sm font-bold text-slate-100 mb-1">Bloom Filter & NoSQL Blacklist Pipeline</h3>
        <p className="text-xs text-slate-400 mb-6">Sub-millisecond membership validation architecture</p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center">
          <div className="p-4 rounded-xl bg-[#1a1d2b] border border-[#2e3244]">
            <Database className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-200">Historical Baselines</h4>
            <p className="text-[10px] text-slate-400 mt-1">MapReduce IP counts</p>
          </div>
          <div className="text-slate-600 hidden md:block">→</div>
          <div className="p-4 rounded-xl bg-[#1a1d2b] border border-[#2e3244]">
            <Lock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-200">MongoDB Blacklist</h4>
            <p className="text-[10px] text-slate-400 mt-1">IntrusionDetection.Blacklist</p>
          </div>
          <div className="text-slate-600 hidden md:block">→</div>
          <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
            <Cpu className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-blue-300">Bloom Filter</h4>
            <p className="text-[10px] text-slate-400 mt-1">O(1) Bit Array Membership</p>
          </div>
        </div>
      </div>

      {/* Metrics & Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Blacklist Size</span>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{blacklist.length || health?.blacklist_size || 0}</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Bit Array Size (m)</span>
          <p className="text-2xl font-bold font-mono text-blue-400 mt-2">{health?.bloom_filter_bits || '19,170'} bits</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Hash Functions (k)</span>
          <p className="text-2xl font-bold font-mono text-purple-400 mt-2">{health?.bloom_filter_hashes || '7'} hashes</p>
        </div>
      </div>

      {/* Blacklist Table */}
      <div className="rounded-2xl bg-[#161925] border border-[#222533] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222533]">
          <h3 className="text-sm font-bold text-slate-100">Loaded Blacklisted IPs (MongoDB)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222533] text-[11px] font-mono text-slate-400 bg-[#12141c]">
                <th className="py-3 px-6">IP ADDRESS</th>
                <th className="py-3 px-6">HISTORICAL COUNT</th>
                <th className="py-3 px-6">THREAT LEVEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222533] text-xs font-mono">
              {blacklist.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1a1d2b]/50 text-slate-300">
                  <td className="py-3 px-6 font-bold text-slate-200">{item.ip}</td>
                  <td className="py-3 px-6 text-slate-400">{item.historical_count}</td>
                  <td className="py-3 px-6">
                    <span className="px-2.5 py-1 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                      {item.threat_level || 'High'}
                    </span>
                  </td>
                </tr>
              ))}
              {blacklist.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-12 text-slate-500 text-xs font-sans">
                    No blacklisted IPs loaded. Run setup_nosql.py.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
