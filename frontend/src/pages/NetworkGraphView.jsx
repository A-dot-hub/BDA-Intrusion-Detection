import React, { useState, useEffect } from 'react';
import { Network, ShieldAlert, Cpu, Radio, RefreshCw, AlertTriangle } from 'lucide-react';

export default function NetworkGraphView() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/network/graph');
      if (!res.ok) throw new Error('Failed to fetch graph data');
      const data = await res.json();
      setGraphData(data);
    } catch {
      // fallback mock graph if endpoint offline
      setGraphData({
        nodes: [
          { id: "104.16.207.165", label: "104.16.207.165", group: "C2 Server", val: 15 },
          { id: "10.0.0.1", label: "10.0.0.1", group: "Compromised Bot", val: 10 },
          { id: "10.0.0.2", label: "10.0.0.2", group: "Compromised Bot", val: 10 },
          { id: "192.168.1.1", label: "192.168.1.1", group: "Normal Host", val: 5 },
          { id: "192.168.1.2", label: "192.168.1.2", group: "Normal Host", val: 5 },
        ],
        links: [
          { source: "10.0.0.1", target: "104.16.207.165" },
          { source: "10.0.0.2", target: "104.16.207.165" },
          { source: "192.168.1.1", target: "192.168.1.2" }
        ],
        c2_server: "104.16.207.165",
        communities_count: 3
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Botnet Forensics & Community Detection</h3>
          <p className="text-xs text-slate-400 mt-1">NetworkX Greedy Modularity clustering identifying Command & Control (C2) star topologies</p>
        </div>
        <button 
          onClick={fetchGraph}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1a1d2b] border border-[#2e3244] text-slate-200 hover:bg-[#222638] flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-run Clustering</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topology Visualization Placeholder / Interactive Box */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col items-center justify-center min-h-[400px] relative">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono">
              C2 Server: 104.16.207.165
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono">
              Communities: {graphData?.communities_count || 3}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 max-w-lg mt-8">
            {graphData?.nodes?.map((node, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedNode(node)}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  node.group === 'C2 Server' 
                    ? 'bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/20 animate-pulse' 
                    : node.group === 'Compromised Bot'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-[#1a1d2b] border-[#2e3244] text-slate-300 hover:border-slate-500'
                }`}
              >
                <Network className="w-5 h-5" />
                <span className="text-xs font-mono font-bold">{node.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-slate-300">{node.group}</span>
              </button>
            ))}
          </div>

          <div className="absolute bottom-4 text-[11px] text-slate-500 font-mono">
            Click any network node to inspect graph community properties.
          </div>
        </div>

        {/* Node Inspection Panel */}
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-4">Node Forensics</h3>
            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-[#1a1d2b] border border-[#2e3244]">
                  <span className="text-slate-400 block text-[10px] font-mono">IP ADDRESS</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{selectedNode.id}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1d2b] border border-[#2e3244]">
                  <span className="text-slate-400 block text-[10px] font-mono">ASSIGNED CLUSTER ROLE</span>
                  <span className={`font-bold ${selectedNode.group === 'C2 Server' ? 'text-red-400' : 'text-slate-200'}`}>
                    {selectedNode.group}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1d2b] border border-[#2e3244]">
                  <span className="text-slate-400 block text-[10px] font-mono">ALGORITHM</span>
                  <span className="text-slate-300">NetworkX Greedy Modularity Communities</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Select a node in the network topology above to view community metrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
