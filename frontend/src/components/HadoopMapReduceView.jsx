import React, { useState } from "react";
import {
  Database,
  Search,
  ArrowRight,
  Layers,
  FileText,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";

export default function HadoopMapReduceView({
  baselines,
  processedFeatures,
  summary,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minCountFilter, setMinCountFilter] = useState("5");
  const [featureTab, setFeatureTab] = useState("baselines"); // 'baselines' | 'schema'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const filteredBaselines = (baselines || []).filter((b) => {
    const matchesSearch = b.ip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCount =
      minCountFilter === "all" ? true : b.count >= parseInt(minCountFilter, 10);
    return matchesSearch && matchesCount;
  });

  const totalPages = Math.ceil(filteredBaselines.length / rowsPerPage);
  const displayedBaselines = filteredBaselines.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <div className="space-y-6">
      {/* Architecture Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              {/* <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                MODULE 1 &amp; 2
              </span> */}
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hadoop HDFS &amp; MapReduce Batch Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Historical baseline aggregation on the CICIDS2017 dataset.
              Distributed MapReduce jobs extract traffic frequency baselines
              across big data logs to isolate recurrent attackers from normal
              hosts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeatureTab("baselines")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                featureTab === "baselines"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              IP Baselines (17,006 Records)
            </button>
            <button
              onClick={() => setFeatureTab("schema")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                featureTab === "schema"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              HDFS Flow Features (79 Columns)
            </button>
          </div>
        </div>

        {/* MapReduce Workflow Pipeline Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-1">
              <span>1. HDFS Storage</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Raw CICIDS2017 PCAP logs partitioned across HDFS blocks with 3x
              replication.
            </p>
            <div className="mt-2 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
              /hdfs/cicids2017/*.csv
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-1">
              <span>2. Map Phase</span>
              <span className="font-mono text-[10px] text-slate-400">
                map()
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Each worker reads flows, parses Source IP, and outputs key-value
              pairs:
            </p>
            <div className="mt-2 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
              emit(sourceIP, 1)
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-1">
              <span>3. Shuffle &amp; Sort</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Hadoop groups identical IP keys together across cluster network
              partitions:
            </p>
            <div className="mt-2 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
              (IP, [1, 1, 1, 1, ...])
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-1">
              <span>4. Reduce Phase</span>
              <span className="font-mono text-[10px] text-slate-400">
                reduce()
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sums occurrences into final baseline dataset and filters
              threshold:
            </p>
            <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              count &gt; 5 → Blacklist (8,155 IPs)
            </div>
          </div>
        </div>
      </div>

      {featureTab === "baselines" ? (
        /* Baselines Explorer Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Historical IP Baselines (
                <span className="font-mono">historical_ip_baselines.csv</span>)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                17,006 unique IPs calculated by MapReduce. IPs with count &gt; 5
                are loaded into the NoSQL Blacklist.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search IP in baselines..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <select
                value={minCountFilter}
                onChange={(e) => {
                  setMinCountFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="5">Blacklist Threshold (Count &gt; 5)</option>
                <option value="1000">Heavy Attacker (Count &gt; 1,000)</option>
                <option value="all">All Baselines (Count &ge; 1)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">IP Address</th>
                  <th className="py-2.5 px-4 font-semibold">
                    MapReduce Flow Count
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    Threat Level Classification
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    NoSQL Blacklist Status
                  </th>
                  <th className="py-2.5 px-4 font-semibold">
                    Known CICIDS Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {displayedBaselines.map((b, idx) => {
                  const isHigh = b.count > 10000;
                  const isBlacklisted = b.count > 5;

                  let role = "Normal Host";
                  if (b.ip === "172.16.0.1")
                    role = "Primary Attacker (Kali Infiltration / DDoS)";
                  else if (b.ip === "104.16.207.165")
                    role = "Botnet C2 Server Node";
                  else if (b.ip.startsWith("192.168.10."))
                    role = "Victim Network Workstation";
                  else if (b.count > 5000)
                    role = "External High-Frequency Endpoint";

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {b.ip}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {b.count.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isHigh
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                              : isBlacklisted
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {isHigh
                            ? "Critical Malicious"
                            : isBlacklisted
                              ? "Blacklisted"
                              : "Low Frequency"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {isBlacklisted ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>Indexed in Blacklist</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Allowed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                        {role}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <div>
              Showing page {currentPage} of {totalPages || 1} (
              {filteredBaselines.length} total filtered)
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Processed HDFS 79-Feature Explorer */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              CICIDS2017 Processed Flow Records (
              <span className="font-mono">cicids2017_processed.csv</span>)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The 79 statistical flow features computed by the Hadoop batch
              pipeline for forensic deep-packet inspection.
            </p>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 px-3">Port</th>
                  <th className="py-2 px-3">Duration (µs)</th>
                  <th className="py-2 px-3">Fwd Pkts</th>
                  <th className="py-2 px-3">Bwd Pkts</th>
                  <th className="py-2 px-3">Flow Bytes/s</th>
                  <th className="py-2 px-3">Flow Pkts/s</th>
                  <th className="py-2 px-3">Fwd Mean Len</th>
                  <th className="py-2 px-3">Bwd Mean Len</th>
                  <th className="py-2 px-3">SYN Flag</th>
                  <th className="py-2 px-3">ACK Flag</th>
                  <th className="py-2 px-3">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(processedFeatures || []).map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-3">{row["Destination Port"]}</td>
                    <td className="py-2 px-3 tabular-nums">
                      {parseInt(row["Flow Duration"] || 0, 10).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">{row["Total Fwd Packets"]}</td>
                    <td className="py-2 px-3">
                      {row["Total Backward Packets"]}
                    </td>
                    <td className="py-2 px-3 tabular-nums">
                      {row["Flow Bytes/s"]}
                    </td>
                    <td className="py-2 px-3 tabular-nums">
                      {row["Flow Packets/s"]}
                    </td>
                    <td className="py-2 px-3">
                      {row["Fwd Packet Length Mean"]}
                    </td>
                    <td className="py-2 px-3">
                      {row["Bwd Packet Length Mean"]}
                    </td>
                    <td className="py-2 px-3">{row["SYN Flag Count"]}</td>
                    <td className="py-2 px-3">{row["ACK Flag Count"]}</td>
                    <td className="py-2 px-3 font-semibold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          row["Label"] === "BENIGN"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold"
                        }`}
                      >
                        {row["Label"]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-sans">
            Displaying sample batch records extracted from Hadoop HDFS processed
            file. Total features per flow: 79 metrics.
          </div>
        </div>
      )}
    </div>
  );
}
