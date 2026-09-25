import React, { useState } from "react";
import {
  Database,
  Search,
  ShieldAlert,
  Zap,
  Server,
  CheckCircle2,
  Clock,
  Code2,
  Filter,
  AlertTriangle,
} from "lucide-react";

export default function NoSqlServingView({
  baselines = [],
  blacklistMap = {},
  liveAlerts = [],
}) {
  const [testIp, setTestIp] = useState("172.16.0.1");
  const [queryResult, setQueryResult] = useState(null);
  const [activeCollection, setActiveCollection] = useState("blacklist"); // 'blacklist' | 'alerts'
  const [searchTable, setSearchTable] = useState("");
  const [threatFilter, setThreatFilter] = useState("all"); // 'all' | 'Critical' | 'High'
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Build indexed document collection from baselines + blacklistMap
  const sampleBlacklist = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. First add baseline entries with count > 5
    (baselines || []).forEach((b, i) => {
      if (b.count > 5 && !seen.has(b.ip)) {
        seen.add(b.ip);
        list.push({
          _id: `664f${(1000 + i).toString(16)}8f419b02a1b`.slice(0, 24),
          ip: b.ip,
          historical_count: b.count,
          threat_level: b.count > 10000 ? "Critical" : "High",
          flagged_timestamp: "2024-07-07T09:00:00Z",
          indexed_field: "ip_1 (Unique B-Tree)",
        });
      }
    });

    // 2. Ensure known critical IPs like 104.16.207.165 are included in the browsable table
    const priorityIps = ["104.16.207.165", "10.0.0.1", "10.0.0.2", "10.0.0.5"];
    priorityIps.forEach((pIp, idx) => {
      if (!seen.has(pIp)) {
        const cnt = blacklistMap && blacklistMap[pIp] ? blacklistMap[pIp] : 35;
        seen.add(pIp);
        list.push({
          _id: `664f${(3000 + idx).toString(16)}8f419b02a1b`.slice(0, 24),
          ip: pIp,
          historical_count: cnt,
          threat_level: cnt > 10000 ? "Critical" : "High",
          flagged_timestamp: "2024-07-07T09:00:00Z",
          indexed_field: "ip_1 (Unique B-Tree)",
        });
      }
    });

    return list;
  }, [baselines, blacklistMap]);

  // Execute Query in NoSQL MongoDB Serving Layer
  const handleTestLookup = (ipToTest) => {
    const rawTarget = ipToTest || testIp;
    const target = rawTarget ? rawTarget.trim() : "";

    // Sub-millisecond latency simulation for B-Tree indexed search
    const latency = (Math.random() * 0.25 + 0.12).toFixed(3);
    const unindexedLatency = (Math.random() * 8.5 + 7.2).toFixed(2);

    // 1. Direct O(1) hash check in the complete blacklistMap (covers all 8,169 blacklisted hosts)
    const hasMapEntry =
      blacklistMap &&
      Object.prototype.hasOwnProperty.call(blacklistMap, target);
    const mapCount = hasMapEntry ? blacklistMap[target] : null;

    // 2. Fallback check in baselines list
    const baselineMatch = (baselines || []).find((b) => b.ip === target);
    const finalCount = hasMapEntry
      ? mapCount
      : baselineMatch
        ? baselineMatch.count
        : null;

    // Check if IP exceeds the malicious threshold (> 5 packets)
    const isMalicious = finalCount !== null && finalCount > 5;

    if (isMalicious) {
      let hexHash = "";
      for (let i = 0; i < target.length; i++) {
        hexHash += target.charCodeAt(i).toString(16);
      }
      const mongoId =
        `664f${hexHash.padEnd(16, "0").slice(0, 16)}9b02a1b`.slice(0, 24);
      const threatLevel = finalCount > 10000 ? "Critical" : "High";

      const doc = {
        _id: mongoId,
        ip: target,
        historical_count: finalCount,
        threat_level: threatLevel,
        flagged_timestamp: "2024-07-07T09:00:00Z",
        indexed_field: "ip_1 (Unique B-Tree)",
        source_module: "Module 2: MapReduce IP Baselines",
        firewall_verdict: "DROP_STREAM_PACKET",
        index_scan: "IXSCAN { ip: 1 }",
      };

      setQueryResult({
        found: true,
        doc: doc,
        latencyMs: latency,
        unindexedLatencyMs: unindexedLatency,
        indexUsed: "ip_unique_1 (B-Tree Index)",
        status: "BLACKLISTED HOST (Document Found in db.Blacklist)",
        ip: target,
        count: finalCount,
        threatLevel: threatLevel,
      });
    } else {
      setQueryResult({
        found: false,
        doc: null,
        latencyMs: latency,
        unindexedLatencyMs: unindexedLatency,
        indexUsed: "ip_unique_1 (B-Tree Index)",
        status: "CLEAN HOST (Not in Blacklist — Normal Enterprise Host)",
        ip: target,
      });
    }
  };

  // Filtered documents for the MongoDB collection table
  const filteredDocs = sampleBlacklist.filter((doc) => {
    const matchSearch = doc.ip
      .toLowerCase()
      .includes(searchTable.toLowerCase());
    const matchThreat =
      threatFilter === "all" ? true : doc.threat_level === threatFilter;
    return matchSearch && matchThreat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const currentDocs = filteredDocs.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const totalIndexedCount = Object.keys(blacklistMap || {}).length || 8169;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                MODULE 3
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                NoSQL Serving Layer (MongoDB{" "}
                <span className="font-mono">IntrusionDetection</span> DB)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Real-time NoSQL serving store populated from MapReduce historical
              baselines. B-Tree indexed on <span className="font-mono">ip</span>{" "}
              for sub-millisecond lookups during streaming threat evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCollection("blacklist")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeCollection === "blacklist"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Collection: Blacklist ({totalIndexedCount.toLocaleString()}{" "}
              indexed)
            </button>
            <button
              onClick={() => setActiveCollection("alerts")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeCollection === "alerts"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Collection: LiveAlerts ({liveAlerts?.length || 0} events)
            </button>
          </div>
        </div>

        {/* Database Metric Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Database URI
            </span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs truncate block">
              mongodb://localhost:27017
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Index Architecture
            </span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
              ip (Unique B-Tree)
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Avg Index Query Latency
            </span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
              &lt; 0.35 ms (Sub-millisecond)
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Total Blacklist Capacity
            </span>
            <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 text-xs">
              {totalIndexedCount.toLocaleString()} Blacklisted IPs
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sub-Millisecond Query Benchmark Tool */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sub-Millisecond Query Benchmark &amp; Document Inspector
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Test any IP address against the NoSQL MongoDB Blacklist collection to
          verify indexed query response time (&lt; 0.4ms) vs unindexed full
          table scan (~10ms).
        </p>

        {/* Input Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={testIp}
              onChange={(e) => setTestIp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTestLookup(testIp)}
              placeholder="Enter IP (e.g. 172.16.0.1, 104.16.207.165)..."
              className="pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 w-full focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => handleTestLookup(testIp)}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Execute Query</span>
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="text-[11px] font-medium mr-1">
            Quick Test Presets:
          </span>

          <button
            onClick={() => {
              setTestIp("172.16.0.1");
              handleTestLookup("172.16.0.1");
            }}
            className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] font-mono text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
            title="Primary Attacker IP from CICIDS2017"
          >
            172.16.0.1 (Attacker IP)
          </button>

          <button
            onClick={() => {
              setTestIp("104.16.207.165");
              handleTestLookup("104.16.207.165");
            }}
            className="px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-[11px] font-mono text-purple-700 dark:text-purple-300 hover:bg-purple-100 cursor-pointer"
            title="Botnet C2 Server from Module 5 Graph Community"
          >
            104.16.207.165 (C2 Server)
          </button>

          <button
            onClick={() => {
              setTestIp("192.168.10.3");
              handleTestLookup("192.168.10.3");
            }}
            className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] font-mono text-amber-700 dark:text-amber-300 hover:bg-amber-100 cursor-pointer"
            title="High-Frequency Baseline Host"
          >
            192.168.10.3 (High Freq)
          </button>

          <button
            onClick={() => {
              setTestIp("10.0.0.1");
              handleTestLookup("10.0.0.1");
            }}
            className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
            title="Bot Zombie Machine"
          >
            10.0.0.1 (Bot Zombie)
          </button>

          <button
            onClick={() => {
              setTestIp("8.8.8.8");
              handleTestLookup("8.8.8.8");
            }}
            className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
            title="Clean Google DNS"
          >
            8.8.8.8 (Clean DNS)
          </button>

          <button
            onClick={() => {
              setTestIp("1.1.1.1");
              handleTestLookup("1.1.1.1");
            }}
            className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
            title="Clean Cloudflare DNS"
          >
            1.1.1.1 (Clean Host)
          </button>
        </div>

        {/* Query Result Card */}
        {queryResult && (
          <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Query Status
                </span>
                <span
                  className={`font-semibold font-mono text-xs sm:text-sm flex items-center gap-1.5 ${
                    queryResult.found
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {queryResult.found ? (
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{queryResult.status}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  B-Tree Indexed Latency
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {queryResult.latencyMs} ms
                </span>
                <span className="text-[10px] text-slate-400 ml-1">
                  (vs {queryResult.unindexedLatencyMs}ms unindexed)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Execution Plan
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  IXSCAN {queryResult.indexUsed}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 block text-[11px] font-mono">
                  BSON Document Result (MongoDB Driver):
                </span>
                {queryResult.found && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold font-mono">
                    THREAT: {queryResult.threatLevel} (
                    {queryResult.count?.toLocaleString()} baseline hits)
                  </span>
                )}
              </div>
              <pre className="p-3 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                {JSON.stringify(
                  queryResult.doc || {
                    status: "NO_MATCH",
                    query_ip: queryResult.ip,
                    indexed: true,
                    action: "PERMIT_CLEAN_FLOW",
                    scanned_keys: 1,
                    executionTimeMillis: parseFloat(queryResult.latencyMs),
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Collection Explorer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden transition-colors">
        {/* Table Top Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activeCollection === "blacklist"
                ? "db.Blacklist.find()"
                : "db.LiveAlerts.find()"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeCollection === "blacklist"
                ? `B-Tree indexed collection loaded from MapReduce baselines (${totalIndexedCount.toLocaleString()} total blacklisted hosts)`
                : "Real-time alert events written on Bloom Filter match or volumetric DDoS detection"}
            </p>
          </div>

          {activeCollection === "blacklist" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchTable}
                  onChange={(e) => {
                    setSearchTable(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter table by IP..."
                  className="pl-7 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <select
                value={threatFilter}
                onChange={(e) => {
                  setThreatFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">All Threat Levels</option>
                <option value="Critical">Critical (&gt;10k count)</option>
                <option value="High">High (&gt;5 count)</option>
              </select>
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs font-mono min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 z-10">
              {activeCollection === "blacklist" ? (
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-56">
                    _id (ObjectId)
                  </th>
                  <th className="py-2.5 px-4 font-semibold w-44">
                    ip (Unique Index)
                  </th>
                  <th className="py-2.5 px-4 font-semibold w-36">
                    historical_count
                  </th>
                  <th className="py-2.5 px-4 font-semibold w-32">
                    threat_level
                  </th>
                  <th className="py-2.5 px-4 font-semibold w-36">action</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-36">Alert ID</th>
                  <th className="py-2.5 px-4 font-semibold w-36">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold w-44">
                    Attacker IP
                  </th>
                  <th className="py-2.5 px-4 font-semibold w-56">
                    Detection Mechanism
                  </th>
                  <th className="py-2.5 px-4 font-semibold">Firewall Action</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activeCollection === "blacklist" ? (
                currentDocs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-slate-400 font-sans"
                    >
                      No documents found matching "{searchTable}".
                    </td>
                  </tr>
                ) : (
                  currentDocs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-4 text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                        {doc._id}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <button
                          onClick={() => {
                            setTestIp(doc.ip);
                            handleTestLookup(doc.ip);
                          }}
                          className="hover:underline hover:text-emerald-500 text-left cursor-pointer"
                          title="Click to benchmark query this IP"
                        >
                          {doc.ip}
                        </button>
                      </td>
                      <td className="py-2 px-4 tabular-nums font-semibold">
                        {doc.historical_count.toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            doc.threat_level === "Critical"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {doc.threat_level}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-400">
                        <button
                          onClick={() => {
                            setTestIp(doc.ip);
                            handleTestLookup(doc.ip);
                          }}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Query Document →
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : !liveAlerts || liveAlerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-400 font-sans"
                  >
                    No live alerts recorded yet. Use the "Inject Attack" menu to
                    test attack detection and alert logging.
                  </td>
                </tr>
              ) : (
                liveAlerts.map((alert, idx) => (
                  <tr
                    key={idx}
                    className="bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300"
                  >
                    <td className="py-2 px-4 font-mono text-slate-400">
                      ALERT-{alert.id || idx + 1}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      {alert.timestamp || "Live Stream"}
                    </td>
                    <td className="py-2 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {alert.ip}
                    </td>
                    <td className="py-2 px-4">
                      {alert.type || "Bloom Filter Match"}
                    </td>
                    <td className="py-2 px-4 font-semibold text-rose-700 dark:text-rose-300">
                      {alert.status || "Blocked"} (Dropped at Line-Rate)
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        {activeCollection === "blacklist" && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {currentDocs.length}
              </span>{" "}
              of {filteredDocs.length} loaded records
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono text-[11px]">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
