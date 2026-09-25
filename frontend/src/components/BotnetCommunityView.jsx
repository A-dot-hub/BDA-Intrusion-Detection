import React, { useState } from 'react';
import { Network, ShieldAlert, CheckCircle2, Info, Eye, Image as ImageIcon } from 'lucide-react';

export default function BotnetCommunityView() {
  const [selectedNode, setSelectedNode] = useState('104.16.207.165');
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'artifact'
  const [filterCluster, setFilterCluster] = useState('all'); // 'all' | 'botnet' | 'benign'

  const c2Server = '104.16.207.165';
  
  // Simulated nodes matching streaming/botnet_community_detection.py
  const botNodes = Array.from({ length: 14 }).map((_, i) => ({
    id: `10.0.0.${i + 1}`,
    type: 'bot',
    community: 1,
    degree: (i % 3) + 2,
    role: 'Compromised Bot Machine'
  }));

  const benignNodes = Array.from({ length: 10 }).map((_, i) => ({
    id: `192.168.1.${i + 1}`,
    type: 'benign',
    community: 2,
    degree: (i % 4) + 1,
    role: 'Benign Workstation / Server'
  }));

  const allNodes = [
    { id: c2Server, type: 'c2', community: 1, degree: 14, role: 'Command & Control (C2) Server' },
    ...botNodes,
    ...benignNodes
  ];

  const activeNodeInfo = allNodes.find(n => n.id === selectedNode) || allNodes[0];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                MODULE 5
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Graph Analytics: Botnet Community Detection
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Identifies distributed botnet swarms and coordinated command-and-control infrastructures using Clauset-Newman-Moore Greedy Modularity Optimization on network traffic flow graphs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'interactive'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
            </button>
            <button
              onClick={() => setViewMode('artifact')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'artifact'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Academic Plot (PNG)</span>
            </button>
          </div>
        </div>

        {/* Algorithm Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Community Detection Metric</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">Modularity Q = 0.684</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Identified C2 Server Node</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">{c2Server}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Botnet Topology Structure</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Star + Peer-to-Peer Mesh</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Total Graph Nodes / Edges</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">25 Nodes · 36 Edges</span>
          </div>
        </div>
      </div>

      {viewMode === 'interactive' ? (
        /* Interactive Network Graph Visualizer */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Graph Canvas Area */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Interactive Network Graph Topology
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any node to inspect connected flow edges and community clustering
                </p>
              </div>

              {/* Cluster Filter */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                <button
                  onClick={() => setFilterCluster('all')}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    filterCluster === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterCluster('botnet')}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    filterCluster === 'botnet' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Botnet Only
                </button>
                <button
                  onClick={() => setFilterCluster('benign')}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    filterCluster === 'benign' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Benign Only
                </button>
              </div>
            </div>

            {/* SVG Graph Visualization */}
            <div className="w-full h-96 bg-slate-950 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-800">
              <svg width="100%" height="100%" viewBox="0 0 800 480" className="select-none">
                <defs>
                  <radialGradient id="c2Pulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                  </radialGradient>
                </defs>

                {/* Background Grid Lines */}
                <g stroke="#1e293b" strokeWidth="0.5">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="480" />
                  ))}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 40} x2="800" y2={i * 40} />
                  ))}
                </g>

                {/* Cluster Boundaries */}
                {(filterCluster === 'all' || filterCluster === 'botnet') && (
                  <g>
                    <ellipse cx="260" cy="240" rx="190" ry="170" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                    <text x="140" y="70" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Community 1: Botnet Cluster (15 Nodes)
                    </text>
                  </g>
                )}

                {(filterCluster === 'all' || filterCluster === 'benign') && (
                  <g>
                    <ellipse cx="610" cy="240" rx="140" ry="140" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                    <text x="510" y="90" fill="#4ade80" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Community 2: Benign LAN (10 Nodes)
                    </text>
                  </g>
                )}

                {/* Botnet Edges */}
                {(filterCluster === 'all' || filterCluster === 'botnet') && (
                  <g stroke="#b91c1c" strokeWidth="1.2" opacity="0.6">
                    {botNodes.map((bot, i) => {
                      const angle = (i / botNodes.length) * 2 * Math.PI;
                      const bx = 260 + Math.cos(angle) * 125;
                      const by = 240 + Math.sin(angle) * 125;
                      const isHighlighted = selectedNode === c2Server || selectedNode === bot.id;
                      return (
                        <line
                          key={bot.id}
                          x1="260"
                          y1="240"
                          x2={bx}
                          y2={by}
                          stroke={isHighlighted ? '#ef4444' : '#7f1d1d'}
                          strokeWidth={isHighlighted ? 2.5 : 1}
                        />
                      );
                    })}
                    {/* Inter-bot P2P edges */}
                    <line x1="180" y1="160" x2="340" y2="160" stroke="#7f1d1d" strokeWidth="0.8" />
                    <line x1="380" y1="240" x2="340" y2="320" stroke="#7f1d1d" strokeWidth="0.8" />
                    <line x1="140" y1="240" x2="180" y2="320" stroke="#7f1d1d" strokeWidth="0.8" />
                  </g>
                )}

                {/* Benign Edges */}
                {(filterCluster === 'all' || filterCluster === 'benign') && (
                  <g stroke="#15803d" strokeWidth="1" opacity="0.5">
                    {benignNodes.map((b, i) => {
                      const angle = (i / benignNodes.length) * 2 * Math.PI;
                      const bx = 610 + Math.cos(angle) * 90;
                      const by = 240 + Math.sin(angle) * 90;
                      const nextAngle = ((i + 1) / benignNodes.length) * 2 * Math.PI;
                      const nbx = 610 + Math.cos(nextAngle) * 90;
                      const nby = 240 + Math.sin(nextAngle) * 90;
                      return <line key={i} x1={bx} y1={by} x2={nbx} y2={nby} />;
                    })}
                  </g>
                )}

                {/* C2 Glow */}
                {(filterCluster === 'all' || filterCluster === 'botnet') && (
                  <circle cx="260" cy="240" r="45" fill="url(#c2Pulse)" />
                )}

                {/* Bot Nodes */}
                {(filterCluster === 'all' || filterCluster === 'botnet') &&
                  botNodes.map((bot, i) => {
                    const angle = (i / botNodes.length) * 2 * Math.PI;
                    const bx = 260 + Math.cos(angle) * 125;
                    const by = 240 + Math.sin(angle) * 125;
                    const isSelected = selectedNode === bot.id;
                    return (
                      <g
                        key={bot.id}
                        onClick={() => setSelectedNode(bot.id)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={bx}
                          cy={by}
                          r={isSelected ? 9 : 7}
                          fill="#ef4444"
                          stroke={isSelected ? '#ffffff' : '#fca5a5'}
                          strokeWidth={isSelected ? 2.5 : 1}
                        />
                        <text
                          x={bx + 10}
                          y={by + 3}
                          fill="#cbd5e1"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {bot.id}
                        </text>
                      </g>
                    );
                  })}

                {/* Benign Nodes */}
                {(filterCluster === 'all' || filterCluster === 'benign') &&
                  benignNodes.map((b, i) => {
                    const angle = (i / benignNodes.length) * 2 * Math.PI;
                    const bx = 610 + Math.cos(angle) * 90;
                    const by = 240 + Math.sin(angle) * 90;
                    const isSelected = selectedNode === b.id;
                    return (
                      <g
                        key={b.id}
                        onClick={() => setSelectedNode(b.id)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={bx}
                          cy={by}
                          r={isSelected ? 9 : 6}
                          fill="#22c55e"
                          stroke={isSelected ? '#ffffff' : '#86efac'}
                          strokeWidth={isSelected ? 2 : 1}
                        />
                        <text
                          x={bx + 9}
                          y={by + 3}
                          fill="#94a3b8"
                          fontSize="8.5"
                          fontFamily="monospace"
                        >
                          {b.id}
                        </text>
                      </g>
                    );
                  })}

                {/* C2 Server Center Node */}
                {(filterCluster === 'all' || filterCluster === 'botnet') && (
                  <g
                    onClick={() => setSelectedNode(c2Server)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx="260"
                      cy="240"
                      r="16"
                      fill="#b91c1c"
                      stroke={selectedNode === c2Server ? '#ffffff' : '#f87171'}
                      strokeWidth="3"
                    />
                    <rect x="180" y="265" width="160" height="20" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                    <text
                      x="260"
                      y="279"
                      textAnchor="middle"
                      fill="#fca5a5"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      C2: {c2Server}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Node Forensics Inspector Side Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs text-xs space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                Graph Node Forensics
              </span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                {activeNodeInfo.id}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Role Classification</span>
              <div className="flex items-center gap-1.5 mt-1">
                {activeNodeInfo.type === 'c2' ? (
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                    Command &amp; Control (C2) Hub
                  </span>
                ) : activeNodeInfo.type === 'bot' ? (
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-medium">
                    Infected Swarm Bot
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                    Benign Network Host
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Community Membership</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Community #{activeNodeInfo.community} ({activeNodeInfo.community === 1 ? 'Botnet Star Swarm' : 'Internal LAN'})
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Degree Centrality (Edges)</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {activeNodeInfo.degree} active connections
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Greedy Modularity Logic
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {activeNodeInfo.type === 'c2'
                  ? 'High-degree hub with star topology connectivity to 14 bots. Cross-checked with MapReduce baseline count: confirmed attacker infrastructure.'
                  : activeNodeInfo.type === 'bot'
                  ? 'Directly connected to C2 hub 104.16.207.165 with synchronized outgoing requests. Flagged for immediate network isolation.'
                  : 'Loosely clustered benign enterprise workstations exhibiting normal Poisson packet arrivals.'}
              </p>
            </div>

            <button
              onClick={() => setSelectedNode(c2Server)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md transition-colors"
            >
              Focus C2 Server Node
            </button>
          </div>

        </div>
      ) : (
        /* Academic PNG Plot View (generated from Python script) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Generated Topology Plot (<span className="font-mono">botnet_topology.png</span>)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rendered artifact matching <span className="font-mono">streaming/botnet_community_detection.py</span> (300 DPI Matplotlib export)
              </p>
            </div>
            <a
              href="/botnet_topology.png"
              download="botnet_topology.png"
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
            >
              Download High-Res PNG
            </a>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <img
              src="/botnet_topology.png"
              alt="Botnet Community Detection Topology"
              className="w-full max-h-[600px] object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
}
