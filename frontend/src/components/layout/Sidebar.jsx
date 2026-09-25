import React from 'react';
import { 
  LayoutDashboard, Activity, ShieldAlert, Cpu, BarChart3, 
  Network, TrendingUp, FileText, Terminal, Settings, ShieldCheck, Wifi 
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, isConnected, isMobileOpen, setIsMobileOpen }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'monitor', label: 'Live Monitor', icon: Activity },
    { id: 'alerts', label: 'Threat Alerts', icon: ShieldAlert },
    { id: 'intelligence', label: 'IP Intelligence', icon: Cpu },
    { id: 'stream-analytics', label: 'Stream Analytics', icon: BarChart3 },
    { id: 'network-graph', label: 'Network Graph', icon: Network },
    { id: 'historical', label: 'Historical Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'logs', label: 'System Logs', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#12141c] border-r border-[#222533] 
        flex flex-col transition-transform duration-300 transform 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#222533]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-slate-100">NetSentinel</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">BIG DATA SEC v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Monitoring & Analytics
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all
                  ${isActive 
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1d2b]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-4 border-t border-[#222533] bg-[#0e1017]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-300 font-medium">
                {isConnected ? 'Stream Active' : 'Disconnected'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">WebSocket</span>
          </div>
        </div>
      </aside>
    </>
  );
}
