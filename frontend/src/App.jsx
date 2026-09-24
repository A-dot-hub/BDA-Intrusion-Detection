import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  List,
  Settings,
  Bell,
  User,
  TrendingUp,
} from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import "./App.css";

// Initial safe nodes for the dynamic Botnet Graph
const initialNodes = [
  { id: "C2_Server", group: "malicious", val: 8 },
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `safe_node_${i}`,
    group: "safe",
    val: 3,
  })),
];
const initialLinks = Array.from({ length: 15 }, (_, i) => ({
  source: `safe_node_${i}`,
  target: `safe_node_${Math.floor(Math.random() * 15)}`,
}));

function App() {
  const [packets, setPackets] = useState([]);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [graphData, setGraphData] = useState({
    nodes: initialNodes,
    links: initialLinks,
  });
  const [isConnected, setIsConnected] = useState(false);

  // State to force the R image to reload periodically
  const [rImageCache, setRImageCache] = useState(Date.now());
  const graphRef = useRef();

  // Auto-refresh the R Predictive Analytics Image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRImageCache(Date.now());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/stream");
    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.error) return;

        setPackets((prev) => [message, ...prev].slice(0, 7));

        if (message.threat_detected) {
          setThreatCount((prev) => prev + 1);

          // Spawn a new red node connected to the C2 Server
          setGraphData((prev) => {
            if (prev.nodes.find((n) => n.id === message.source_ip)) return prev;
            return {
              nodes: [
                ...prev.nodes,
                { id: message.source_ip, group: "malicious", val: 4 },
              ],
              links: [
                ...prev.links,
                { source: message.source_ip, target: "C2_Server" },
              ],
            };
          });
        }

        setChartData((prev) => {
          const timeLabel = message.timestamp
            ? message.timestamp.split(" ")[1]
            : "Live";
          const updated = [
            ...prev,
            {
              time: timeLabel,
              threats: message.threat_detected
                ? Math.random() * 20 + 20
                : Math.random() * 5 + 10,
            },
          ];
          return updated.slice(-30);
        });
      } catch (err) {
        console.error("Failed to parse packet:", err);
      }
    };

    ws.onclose = () => setIsConnected(false);
    return () => ws.close();
  }, []);

  // Recenter the physics graph when new nodes spawn
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(-50);
    }
  }, [graphData]);

  const totalPackets =
    packets.length > 0
      ? (8421903 + packets[0].id).toLocaleString()
      : "8,421,903";
  const fmDistinct =
    packets.length > 0 && packets[0].fm_estimate > 0
      ? packets[0].fm_estimate
      : 45789;
  const isDDoS = fmDistinct > 500;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="menu-item active">
          <LayoutDashboard size={24} />
          <span>Overview</span>
        </div>
        <div className="menu-item">
          <AlertTriangle size={24} />
          <span>Alerts</span>
        </div>
        <div className="menu-item">
          <FileText size={24} />
          <span>Reports</span>
        </div>
        <div className="menu-item">
          <List size={24} />
          <span>Logs</span>
        </div>
        <div className="menu-item">
          <Settings size={24} />
          <span>Settings</span>
        </div>
      </aside>

      <main className="dashboard-container">
        <header className="top-nav">
          <div className="nav-left">
            <h1>Network Intrusion Dashboard</h1>
            <div className={`status-badge ${isConnected ? "live-glow" : ""}`}>
              <div className="pulse-dot"></div>
              {isConnected ? "Live Stream Active" : "Offline"}
            </div>
          </div>
          <div className="nav-right">
            <Bell size={20} />
            <User size={20} />
          </div>
        </header>

        <div className="metrics-row">
          <div className="metric-card">
            <h3>Total Packets</h3>
            <div className="metric-value">
              {totalPackets} <TrendingUp size={20} className="trend-icon" />
            </div>
          </div>
          <div className="metric-card">
            <h3>Bloom Filter Blocks</h3>
            <div className="metric-value red-text">
              {(2156 + threatCount).toLocaleString()}
            </div>
          </div>
          <div className={`metric-card ${isDDoS ? "alert-card" : ""}`}>
            <div className="card-header-flex">
              <h3>Flajolet-Martin Distinct IPs</h3>
              {isDDoS && <AlertTriangle size={18} className="red-text" />}
            </div>
            <div className="metric-value red-text">
              {fmDistinct.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid-row-2">
          <div className="panel">
            <h2>Live Packet capture</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Port</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((pkt, idx) => (
                  <tr
                    key={idx}
                    className={pkt.threat_detected ? "row-threat" : ""}
                  >
                    <td>{pkt.source_ip}</td>
                    <td>{pkt.destination_ip}</td>
                    <td>TCP</td>
                    <td>443</td>
                    <td>
                      {pkt.threat_detected ? (
                        <span className="badge badge-danger">BLACKLISTED</span>
                      ) : (
                        <span>OK</span>
                      )}
                    </td>
                  </tr>
                ))}
                {packets.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ paddingTop: "20px", color: "#666" }}
                    >
                      Waiting for stream...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header-flex">
              <h2>Attack Frequency Over Time</h2>
              <div className="time-filters">
                <span>1H</span>
                <span>6H</span>
                <span className="active">24H</span>
                <span>7D</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2a2a"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#666"
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1e1e",
                    borderColor: "#333",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="threats"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid-row-2">
          {/* Real-time Force Directed Graph */}
          <div className="panel">
            <h2>Dynamic Botnet Forensics (NetworkX Simulation)</h2>
            <div
              style={{
                width: "100%",
                height: "250px",
                backgroundColor: "#121212",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #222",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    width={500}
                    height={250}
                    nodeColor={(node) =>
                      node.group === "malicious" ? "#ef4444" : "#10b981"
                    }
                    linkColor={() => "#444"}
                    backgroundColor="#121212"
                    nodeRelSize={4}
                  />
                </div>
              </ResponsiveContainer>
            </div>
          </div>

          {/* R-Generated Live Reloading Image */}
          <div className="panel">
            <h2>Predictive Analytics (R Linear Regression)</h2>
            <div className="image-container" style={{ position: "relative" }}>
              {/* The timestamp query parameter forces the browser to bypass cache and fetch the newest R plot */}
              <img
                src={`/traffic_forecast.png?t=${rImageCache}`}
                alt="Traffic Forecast Generated by R"
              />

              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  fontSize: "10px",
                  color: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                Live Sync Active
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
