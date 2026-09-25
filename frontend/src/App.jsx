import React, { useState, useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopNavbar from "./components/layout/TopNavbar";
import Overview from "./pages/Overview";
import LiveMonitor from "./pages/LiveMonitor";
import ThreatAlerts from "./pages/ThreatAlerts";
import IPIntelligence from "./pages/IPIntelligence";
import StreamAnalytics from "./pages/StreamAnalytics";
import NetworkGraphView from "./pages/NetworkGraphView";
import HistoricalAnalytics from "./pages/HistoricalAnalytics";
import Reports from "./pages/Reports";
import SystemLogs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import "./App.css";

const MALICIOUS_IPS = [
  "104.16.207.165",
  "185.220.101.5",
  "45.154.255.88",
  "193.201.28.91",
  "198.51.100.42",
  "203.0.113.195",
  "10.0.0.15",
  "1.1.70.73",
];

const NORMAL_IPS = [
  "192.168.1.10",
  "192.168.1.15",
  "10.20.30.40",
  "172.16.0.5",
  "192.168.10.50",
  "8.8.8.8",
  "1.1.1.1",
  "192.168.1.105",
];

export default function App() {
  const [currentView, setCurrentView] = useState("overview");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [packets, setPackets] = useState([]);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fmEstimate, setFmEstimate] = useState(142);

  useEffect(() => {
    let ws = null;
    let fallbackInterval = null;
    let packetId = 0;

    const startSimulator = () => {
      setIsConnected(false);
      fallbackInterval = setInterval(() => {
        if (isPaused) return;

        packetId += 1;
        const isThreat = Math.random() < 0.25;
        const srcIp = isThreat
          ? MALICIOUS_IPS[Math.floor(Math.random() * MALICIOUS_IPS.length)]
          : NORMAL_IPS[Math.floor(Math.random() * NORMAL_IPS.length)];

        const dstIp = "192.168.1.1";
        const srcPort = Math.floor(Math.random() * 50000) + 1024;
        const dstPort = [80, 443, 22, 3389][Math.floor(Math.random() * 4)];
        const protocol = "6";
        const timestamp = new Date()
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);
        const label = "BENIGN";

        setFmEstimate((prev) => prev + (Math.random() < 0.3 ? 1 : 0));

        const packet = {
          id: packetId,
          flow_id: `FLOW-${packetId}`,
          timestamp,
          source_ip: srcIp,
          source_port: srcPort,
          destination_ip: dstIp,
          destination_port: dstPort,
          protocol,
          label,
          threat_detected: isThreat,
          detection_method: isThreat ? "Bloom Filter Match" : "None",
          fm_estimate: 142 + Math.floor(packetId / 3),
        };

        setPackets((prev) => [packet, ...prev].slice(0, 200));

        if (isThreat) {
          setThreatCount((prev) => prev + 1);
        }

        const timeLabel = timestamp.split(" ")[1] || "Live";
        setChartData((prev) =>
          [...prev, { time: timeLabel, threats: isThreat ? 1 : 0 }].slice(-30),
        );
      }, 500);
    };

    try {
      ws = new WebSocket("ws://127.0.0.1:8000/ws/stream");

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (isPaused) return;
        try {
          const message = JSON.parse(event.data);
          if (message.error) return;

          setPackets((prev) => [message, ...prev].slice(0, 200));

          if (message.threat_detected) {
            setThreatCount((prev) => prev + 1);
          }

          if (message.fm_estimate) {
            setFmEstimate(message.fm_estimate);
          }

          setChartData((prev) => {
            const timeLabel = message.timestamp
              ? message.timestamp.split(" ")[1] || "Live"
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
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        startSimulator();
      };

      ws.onclose = () => {
        startSimulator();
      };
    } catch {
      startSimulator();
    }

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [isPaused]);

  const totalPackets = packets.length > 0 ? packets[0].id + 1 : 0;

  return (
    <div className="min-h-screen bg-[#0e1017] text-slate-100 flex font-sans antialiased w-full">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isConnected={isConnected}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          currentView={currentView}
          isConnected={isConnected}
          totalPackets={totalPackets}
          threatCount={threatCount}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {currentView === "overview" && (
            <Overview
              packets={packets}
              threatCount={threatCount}
              isConnected={isConnected}
              chartData={chartData}
              fmEstimate={fmEstimate}
            />
          )}

          {currentView === "monitor" && (
            <LiveMonitor
              packets={packets}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
            />
          )}

          {currentView === "alerts" && <ThreatAlerts />}

          {currentView === "intelligence" && <IPIntelligence />}

          {currentView === "stream-analytics" && (
            <StreamAnalytics chartData={chartData} fmEstimate={fmEstimate} />
          )}

          {currentView === "network-graph" && <NetworkGraphView />}

          {currentView === "historical" && <HistoricalAnalytics />}

          {currentView === "reports" && (
            <Reports
              packets={packets}
              threatCount={threatCount}
              fmEstimate={fmEstimate}
            />
          )}

          {currentView === "logs" && <SystemLogs isConnected={isConnected} />}

          {currentView === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}
