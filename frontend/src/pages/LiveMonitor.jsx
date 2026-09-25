import React, { useState } from 'react';
import { Search, Filter, Download, Pause, Play, RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function LiveMonitor({ packets, isPaused, setIsPaused, clearPackets }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, threats, clean

  const filteredPackets = packets.filter(pkt => {
    const matchesSearch = 
      pkt.source_ip.includes(searchTerm) || 
      pkt.destination_ip.includes(searchTerm) || 
      pkt.protocol.toString().includes(searchTerm) ||
      pkt.flow_id.toLowerCase().includes(searchTerm);
    
    if (filterType === 'threats') return matchesSearch && pkt.threat_detected;
    if (filterType === 'clean') return matchesSearch && !pkt.threat_detected;
    return matchesSearch;
  });

  const exportCSV = () => {
    const headers = ["Flow ID", "Timestamp", "Source IP", "Source Port", "Destination IP", "Destination Port", "Protocol", "Label", "Threat Detected", "FM Estimate"];
    const rows = filteredPackets.map(p => [
      p.flow_id, p.timestamp, p.source_ip, p.source_port, p.destination_ip, p.destination_port, p.protocol, p.label, p.threat_detected, p.fm_estimate
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "netsentinel_live_packets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#161925] border border-[#222533]">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search Source IP, Destination IP, Protocol, Flow ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1d2b] border border-[#2e3244] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#1a1d2b] border border-[#2e3244] p-1 rounded-xl">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('threats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === 'threats' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Threats
            </button>
            <button 
              onClick={() => setFilterType('clean')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === 'clean' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Clean
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors ${
              isPaused 
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30' 
                : 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          <button 
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1a1d2b] border border-[#2e3244] text-slate-200 hover:bg-[#222638] flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Packet Table Card */}
      <div className="rounded-2xl bg-[#161925] border border-[#222533] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222533] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Network Stream Inspection</h3>
            <p className="text-xs text-slate-400">Showing recent packets processed via Bloom Filter pipeline</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredPackets.length} packets displayed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222533] text-[11px] font-mono text-slate-400 bg-[#12141c]">
                <th className="py-3 px-4">FLOW ID</th>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">SOURCE IP : PORT</th>
                <th className="py-3 px-4">DEST IP : PORT</th>
                <th className="py-3 px-4">PROTOCOL</th>
                <th className="py-3 px-4">LABEL</th>
                <th className="py-3 px-4">FM ESTIMATE</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222533] text-xs font-mono">
              {filteredPackets.map((pkt, idx) => (
                <tr 
                  key={idx}
                  className={`transition-colors hover:bg-[#1a1d2b]/60 ${
                    pkt.threat_detected ? 'bg-red-500/10 text-red-300' : 'text-slate-300'
                  }`}
                >
                  <td className="py-3 px-4 text-slate-400">{pkt.flow_id}</td>
                  <td className="py-3 px-4 text-slate-400">{pkt.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-200">{pkt.source_ip}:{pkt.source_port}</td>
                  <td className="py-3 px-4 text-slate-300">{pkt.destination_ip}:{pkt.destination_port}</td>
                  <td className="py-3 px-4">TCP ({pkt.protocol})</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {pkt.label || 'BENIGN'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-purple-400">{pkt.fm_estimate}</td>
                  <td className="py-3 px-4">
                    {pkt.threat_detected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        <ShieldAlert className="w-3 h-3" />
                        BLACKLIST MATCH
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        CLEAN
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPackets.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-slate-500 text-xs font-sans">
                    No packet records found matching criteria.
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
