import React from 'react';
import { 
  ShieldAlert, Activity, Cpu, Database, Network, TrendingUp, 
  ArrowUpRight, ShieldCheck, AlertTriangle, CheckCircle, Radio 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview({ packets, threatCount, isConnected, chartData, fmEstimate }) {
  const latestPacket = packets.length > 0 ? packets[0] : null;
  const totalPackets = latestPacket ? latestPacket.id + 1 : 0;
  const threatPercentage = totalPackets > 0 ? ((threatCount / totalPackets) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Banner / Welcome */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/20 via-[#161925] to-[#12141c] border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-semibold mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>BIG DATA PIPELINE ACTIVE</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">NetSentinel Security Operations Center</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time stream telemetry analyzed via NoSQL MongoDB Blacklists, Bloom Filter set membership, and Flajolet-Martin distinct IP cardinality estimation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#1a1d2b] border border-[#2e3244] text-xs">
            <span className="text-slate-400 block text-[10px]">ENGINE STATUS</span>
            <span className="text-emerald-400 font-bold font-mono">Operational</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#1a1d2b] border border-[#2e3244] text-xs">
            <span className="text-slate-400 block text-[10px]">FALSE POSITIVE RATE</span>
            <span className="text-blue-400 font-bold font-mono">1.0% (Optimum)</span>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Packets Processed</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-slate-100">{totalPackets}</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">flows</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Bloom Filter Blocks</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold font-mono text-red-400">{threatCount}</span>
              <span className="text-xs text-slate-400 ml-2 font-mono">matches</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400">
              {threatPercentage}%
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Distinct IPs (FM Estimate)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-purple-400">{fmEstimate}</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">cardinality</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">MongoDB Storage</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-base font-bold font-mono text-emerald-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volumetric Attack Frequency Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Volumetric Threat Frequency</h3>
              <p className="text-xs text-slate-400">Real-time threat events detected across stream window</p>
            </div>
            <div className="text-xs font-mono text-slate-400 px-3 py-1 rounded bg-[#1a1d2b]">
              Live Stream
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222533" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161925', borderColor: '#222533', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="step" dataKey="threats" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Packet Preview / Recent Activity */}
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Live Packet Feed</h3>
          <p className="text-xs text-slate-400 mb-4">Latest inspected network flows</p>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-72 pr-1">
            {packets.slice(0, 6).map((pkt, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  pkt.threat_detected 
                    ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                    : 'bg-[#1a1d2b] border-[#2e3244] text-slate-300'
                }`}
              >
                <div>
                  <div className="font-mono font-medium">{pkt.source_ip}:{pkt.source_port}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Dest: {pkt.destination_ip}:{pkt.destination_port}</div>
                </div>
                <div>
                  {pkt.threat_detected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500 text-white font-bold">BLOCKED</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">CLEAN</span>
                  )}
                </div>
              </div>
            ))}
            {packets.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                Waiting for stream packets...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
