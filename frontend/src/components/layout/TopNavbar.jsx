import React from 'react';
import { Menu, Bell, Search, ShieldAlert, CheckCircle2, User, Database, Cpu } from 'lucide-react';

export default function TopNavbar({ currentView, isConnected, totalPackets, threatCount, setIsMobileOpen }) {
  const getViewTitle = () => {
    switch(currentView) {
      case 'overview': return { title: 'System Overview', subtitle: 'Real-time cybersecurity telemetry & analytics' };
      case 'monitor': return { title: 'Live Packet Monitor', subtitle: 'Continuous streaming inspection via Bloom Filter' };
      case 'alerts': return { title: 'Threat Alerts', subtitle: 'MongoDB live alert logs and blacklist matches' };
      case 'intelligence': return { title: 'IP Intelligence & Bloom Filter', subtitle: 'Sub-millisecond NoSQL blacklist membership validation' };
      case 'stream-analytics': return { title: 'Stream Cardinality (Flajolet-Martin)', subtitle: 'Approximate distinct IP tracking using hash bitstreams' };
      case 'network-graph': return { title: 'Botnet Community Detection', subtitle: 'NetworkX Greedy Modularity graph clustering & C2 analysis' };
      case 'historical': return { title: 'Traffic Analytics & Forecasting', subtitle: 'R Multiple Linear Regression traffic volume forecast' };
      case 'reports': return { title: 'Executive Reports', subtitle: 'Summary telemetry and audit exports' };
      case 'logs': return { title: 'System Logs', subtitle: 'Backend event logs and engine diagnostics' };
      case 'settings': return { title: 'Engine Settings', subtitle: 'Configuration parameters and thresholds' };
      default: return { title: 'Dashboard', subtitle: 'NetSentinel Analytics' };
    }
  };

  const meta = getViewTitle();

  return (
    <header className="h-16 px-6 bg-[#12141c]/90 border-b border-[#222533] backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1d2b]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-100">{meta.title}</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Status Badge */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span>{isConnected ? 'LIVE STREAM' : 'OFFLINE'}</span>
        </div>

        {/* Quick Stats Pill */}
        <div className="hidden lg:flex items-center gap-4 px-3 py-1 rounded-xl bg-[#1a1d2b] border border-[#2e3244] text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-medium">{totalPackets}</span>
            <span className="text-slate-400">Packets</span>
          </div>
          <div className="w-[1px] h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono font-medium text-red-400">{threatCount}</span>
            <span className="text-slate-400">Threats</span>
          </div>
        </div>

        {/* User Profile avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow">
          NS
        </div>
      </div>
    </header>
  );
}
