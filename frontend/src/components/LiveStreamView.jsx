import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ShieldCheck, ShieldAlert, Search, Filter, AlertTriangle, Radio } from 'lucide-react';

export default function LiveStreamView({
  packets,
  chartData,
  threatCount,
  isDdosActive,
  streamSource,
  isConnected,
  onClearStream
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, blocked, clean
  const [labelFilter, setLabelFilter] = useState('all');

  const filteredPackets = packets.filter((pkt) => {
    const matchesSearch =
      pkt.source_ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkt.destination_ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkt.flow_id && pkt.flow_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(pkt.destination_port).includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'blocked'
        ? pkt.threat_detected
        : !pkt.threat_detected;

    const matchesLabel =
      labelFilter === 'all'
        ? true
        : pkt.label?.toLowerCase() === labelFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesLabel;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Stream Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'
          }`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Live Flow Inspection Engine
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                {streamSource === 'websocket' ? 'FastAPI WebSocket (ws://127.0.0.1:8000)' : 'Real BDA Stream Engine (Hadoop CICIDS2017 Dataset)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluating network flows against MapReduce baselines via sub-millisecond Bloom Filter &amp; Flajolet-Martin estimation.
            </p>
          </div>
        </div>

        {isDdosActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 rounded text-rose-700 dark:text-rose-300 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>CRITICAL: Distinct IP Spike (&gt;500) Detected — Volumetric DDoS Attack in progress!</span>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Live Flow Volume &amp; Attack Frequency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Timeline view of benign packet stream vs Bloom Filter flagged threat packets
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>Total Traffic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Threats Blocked</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#totalGrad)"
                name="Total Packets"
              />
              <Area
                type="stepAfter"
                dataKey="threats"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#threatGrad)"
                name="Threats Flagged"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-Time Packet Stream Table & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden transition-colors">
        
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Live Network Packet Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time ingestion from Hadoop stream dataset (<span className="font-mono">cicids2017_stream_processed.csv</span>)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IP, Port, ID..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="blocked">Blocked Only</option>
              <option value="clean">Clean Only</option>
            </select>

            {/* Label Filter */}
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Labels</option>
              <option value="ddos">DDoS</option>
              <option value="botnet">Botnet</option>
              <option value="portscan">PortScan</option>
              <option value="benign">BENIGN</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Flow ID</th>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Source IP</th>
                <th className="py-2.5 px-3 font-semibold">Destination IP</th>
                <th className="py-2.5 px-3 font-semibold">Protocol</th>
                <th className="py-2.5 px-3 font-semibold">Dst Port</th>
                <th className="py-2.5 px-3 font-semibold">Attack Label</th>
                <th className="py-2.5 px-3 font-semibold">Bloom Filter Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                    No packet flows matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => (
                  <tr
                    key={pkt.id || idx}
                    className={`transition-colors ${
                      pkt.threat_detected
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 dark:text-slate-500">
                      #{pkt.id}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {pkt.timestamp}
                    </td>
                    <td className="py-2 px-3 font-bold">
                      {pkt.source_ip}
                    </td>
                    <td className="py-2 px-3">
                      {pkt.destination_ip}
                    </td>
                    <td className="py-2 px-3">
                      {pkt.protocol === '6' ? 'TCP (6)' : pkt.protocol === '17' ? 'UDP (17)' : `Proto ${pkt.protocol}`}
                    </td>
                    <td className="py-2 px-3">
                      {pkt.destination_port || 80}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        pkt.label === 'DDoS'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : pkt.label === 'Botnet'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : pkt.label === 'PortScan'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {pkt.label || 'BENIGN'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold whitespace-nowrap">
                      {pkt.threat_detected ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>BLOCKED (Hash Match)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>PASS (Clean)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{filteredPackets.length}</span> of {packets.length} buffered flows
          </div>
          <div className="flex items-center gap-3">
            <span>Buffer capacity: 50 recent flows</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>Lookup latency: &lt; 0.05ms</span>
          </div>
        </div>
      </div>

    </div>
  );
}
