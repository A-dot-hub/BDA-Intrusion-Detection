import React, { useEffect } from "react";
import {
  X,
  Radio,
  Database,
  Server,
  Binary,
  Network,
  TrendingUp,
  Zap,
  Play,
  Pause,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export default function Sidebar({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  isPlaying,
  setIsPlaying,
  theme,
  toggleTheme,
  onInjectAttack,
  isConnected,
  streamSource,
  threatCount,
  packetCount,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  const navItems = [
    {
      id: "stream",
      label: "Live Operations",
      module: "MODULE 4",
      desc: "Real-time packet inspection & line-rate flow drops",
      icon: Radio,
      badge: isPlaying ? "Active Stream" : "Paused",
      badgeColor: isPlaying
        ? "text-emerald-500 bg-emerald-500/10"
        : "text-amber-500 bg-amber-500/10",
    },
    {
      id: "mapreduce",
      label: "MapReduce Baselines",
      module: "MODULE 1 & 2",
      desc: "17,006 Hadoop IP profiles & 79 flow metrics",
      icon: Database,
      badge: "17,006 IPs",
      badgeColor: "text-indigo-500 bg-indigo-500/10",
    },
    {
      id: "nosql",
      label: "NoSQL Serving Layer",
      module: "MODULE 3",
      desc: "MongoDB Blacklist & sub-ms indexed lookups",
      icon: Server,
      badge: "< 0.4ms",
      badgeColor: "text-emerald-500 bg-emerald-500/10",
    },
    {
      id: "streaming-algo",
      label: "Streaming Algorithms",
      module: "MODULE 4",
      desc: "Bloom Filter k=7 & Flajolet-Martin 64-register",
      icon: Binary,
      badge: "Probabilistic",
      badgeColor: "text-sky-500 bg-sky-500/10",
    },
    {
      id: "botnet",
      label: "Botnet Community Graph",
      module: "MODULE 5",
      desc: "Greedy Modularity clustering & C2 star swarm",
      icon: Network,
      badge: "Q = 0.684",
      badgeColor: "text-purple-500 bg-purple-500/10",
    },
    {
      id: "r-prediction",
      label: "R Predictive Analytics",
      module: "MODULE 6",
      desc: "Multiple Linear Regression bandwidth forecast",
      icon: TrendingUp,
      badge: "R² = 0.941",
      badgeColor: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <>
      {/* Backdrop Dimmer */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Header with Brand & Close Button */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="BDA Cyber Defense Logo"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/50 shadow-md"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  isPlaying ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                BDA Intrusion Detection
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Big Data Analytics System
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close sidebar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Engine Status Mini-Card */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Engine Pipeline:
            </span>
            <span
              className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                streamSource === "websocket"
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
              }`}
            >
              {streamSource === "websocket"
                ? "Local WebSocket"
                : "Hadoop BDA Stream"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-600 dark:text-slate-400">
              Flows: {packetCount.toLocaleString()}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              Drops: {threatCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Navigation Modules List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Architecture Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-3 group cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div
                  className={`p-2 rounded-md shrink-0 transition-colors ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 dark:bg-slate-100 dark:text-emerald-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs truncate">
                      {item.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] leading-tight truncate ${
                      isActive
                        ? "text-slate-300 dark:text-slate-600"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 self-center transition-transform ${
                    isActive
                      ? "opacity-100 translate-x-0.5"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Quick Attack Simulator in Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Quick Attack Injection
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => {
                onInjectAttack("ddos");
                setIsOpen(false);
              }}
              className="px-2 py-1.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-medium hover:bg-rose-100 transition-colors text-center cursor-pointer"
            >
              DDoS Flood
            </button>
            <button
              onClick={() => {
                onInjectAttack("blacklist");
                setIsOpen(false);
              }}
              className="px-2 py-1.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[11px] font-medium hover:bg-amber-100 transition-colors text-center cursor-pointer"
            >
              Attacker IP
            </button>
            <button
              onClick={() => {
                onInjectAttack("botnet");
                setIsOpen(false);
              }}
              className="px-2 py-1.5 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-[11px] font-medium hover:bg-purple-100 transition-colors text-center cursor-pointer"
            >
              C2 Botnet Swarm
            </button>
            <button
              onClick={() => {
                onInjectAttack("benign");
                setIsOpen(false);
              }}
              className="px-2 py-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium hover:bg-emerald-100 transition-colors text-center cursor-pointer"
            >
              Benign Flow
            </button>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          {/* Pause / Resume */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
              isPlaying
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-700 font-bold"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isPlaying ? "Pause Stream" : "Resume"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px]">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
