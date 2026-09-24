import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  const [packets, setPackets] = useState([]);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/stream");

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.error) return;

        // Keep the latest 50 packets to keep the table fast
        setPackets((prev) => [message, ...prev].slice(0, 50));

        if (message.threat_detected) {
          setThreatCount((prev) => prev + 1);
        }

        setChartData((prev) => {
          const timeLabel = message.timestamp
            ? message.timestamp.split(" ")[1]
            : "Live";
          const updated = [
            ...prev,
            {
              time: timeLabel,
              threats: message.threat_detected ? 1 : 0,
            },
          ];
          return updated.slice(-30);
        });
      } catch (err) {
        console.error("Failed to parse packet payload:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Real-Time Intrusion Detection System</h1>
        <div className={`status-badge ${isConnected ? "live" : "offline"}`}>
          {isConnected ? "Live Stream Active" : "Disconnected"}
        </div>
      </header>

      <div className="metrics-row">
        <div className="metric-card">
          <h3>Total Packets Scanned</h3>
          <p className="value">{packets.length ? packets[0].id : 0}</p>
        </div>
        <div className="metric-card threat">
          <h3>Threats Blocked (NoSQL)</h3>
          <p className="value">{threatCount}</p>
        </div>
      </div>

      <div className="main-content">
        <div className="table-container">
          <h2>Live Packet Capture</h2>
          <table>
            <thead>
              <tr>
                <th>Flow ID</th>
                <th>Timestamp</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {packets.map((pkt, idx) => (
                <tr
                  key={idx}
                  className={pkt.threat_detected ? "row-threat" : "row-safe"}
                >
                  <td>{pkt.id}</td>
                  <td>{pkt.timestamp}</td>
                  <td>{pkt.source_ip}</td>
                  <td>{pkt.destination_ip}</td>
                  <td>TCP ({pkt.protocol})</td>
                  <td>
                    {pkt.threat_detected ? (
                      <span className="badge badge-danger">BLACKLISTED</span>
                    ) : (
                      <span className="badge badge-success">CLEAN</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-container" style={{ marginTop: "20px" }}>
          <h2>Module 5: Network Topology & Botnet Forensics</h2>
          <div style={{ textAlign: "center", padding: "10px" }}>
            <p style={{ color: "#aaa", marginBottom: "15px" }}>
              Graph Analytics Engine (NetworkX) - Greedy Modularity Community
              Detection
            </p>
            <img
              src="/botnet_topology.png"
              alt="Botnet Topology Map"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "8px",
                border: "1px solid #444",
              }}
            />
          </div>
        </div>

        <div className="chart-container">
          <h2>Threat Detection Frequency</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{ backgroundColor: "#222", border: "none" }}
              />
              <Line
                type="step"
                dataKey="threats"
                stroke="#ff4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
