import React from "react";
import { Play, Pause, Sun, Moon, Zap, Menu, Compass } from "lucide-react";

export default function Navbar({
  activeTab,
  onOpenSidebar,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  theme,
  toggleTheme,
  onInjectAttack,
  isConnected,
  streamSource,
}) {
  const activeTabLabels = {
    stream: "Live Operations",
    mapreduce: "MapReduce Baselines",
    nosql: "NoSQL Serving",
    "streaming-algo": "Streaming Algorithms",
    botnet: "Botnet Community Graph",
    "r-prediction": "R Predictive Analytics",
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Clickable Logo & Brand Name - Clicking opens the Sidebar! */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            title="Click logo to open navigation sidebar"
            className="flex items-center gap-3 group p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer text-left"
          >
            {/* Unique Generated Insignia Logo */}
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="BDA Cyber Defense Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-emerald-500/60 shadow-md group-hover:ring-emerald-400 group-hover:scale-105 transition-all"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  isPlaying ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  BDA Intrusion Detection
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hidden sm:inline-flex items-center gap-1">
                  <Menu className="w-2.5 h-2.5" />
                  <span>Menu</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                Real-Time Network &amp; Attack Detection System
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Active Module Breadcrumb / Indicator (Replaces wide navbar tabs) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400">
            Current View:
          </span>
          <button
            onClick={onOpenSidebar}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
            title="Click to switch module"
          >
            <span>{activeTabLabels[activeTab] || "Live Operations"}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
              ▼
            </span>
          </button>
        </div>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Stream Play/Pause Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={
              isPlaying
                ? "Pause Stream (Stop Ingestion)"
                : "Resume Stream (Start Ingestion)"
            }
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
              isPlaying
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                : "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900 ring-2 ring-amber-400/30 font-bold"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-current" />
                <span>Paused (Resume)</span>
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  speed === s
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Attack Injector Menu */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
              title="Inject Simulated Attack to test BDA algorithms"
            >
              <Zap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden md:inline">Inject Attack</span>
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulate Scenario
              </div>
              <button
                onClick={() => onInjectAttack("ddos")}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <div>
                  <div className="font-medium">Volumetric DDoS Flood</div>
                  <div className="text-[10px] text-slate-400">
                    Triggers Flajolet-Martin &gt;500
                  </div>
                </div>
              </button>
              <button
                onClick={() => onInjectAttack("blacklist")}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <div>
                  <div className="font-medium">Blacklisted Attacker IP</div>
                  <div className="text-[10px] text-slate-400">
                    Triggers Bloom Filter Drop
                  </div>
                </div>
              </button>
              <button
                onClick={() => onInjectAttack("botnet")}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <div>
                  <div className="font-medium">C2 Botnet Swarm</div>
                  <div className="text-[10px] text-slate-400">
                    Triggers Graph Community Detection
                  </div>
                </div>
              </button>
              <button
                onClick={() => onInjectAttack("benign")}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 mt-1 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div>
                  <div className="font-medium">Normal Enterprise Traffic</div>
                  <div className="text-[10px] text-slate-400">
                    Clean passes through Bloom Filter
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Theme Toggle (Dark / Light mode) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
