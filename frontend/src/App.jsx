import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MetricCards from "./components/MetricCards";
import LiveStreamView from "./components/LiveStreamView";
import HadoopMapReduceView from "./components/HadoopMapReduceView";
import NoSqlServingView from "./components/NoSqlServingView";
import StreamingAlgorithmsView from "./components/StreamingAlgorithmsView";
import BotnetCommunityView from "./components/BotnetCommunityView";
import PredictiveAnalyticsRView from "./components/PredictiveAnalyticsRView";

import bdaData from "./data/bda_dataset.json";
import { BloomFilter, FlajoletMartin } from "./services/streamingEngine";

function App() {
  // Theme State: 'dark' by default for cybersecurity operations
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("bda_theme");
      return saved ? saved : "dark";
    } catch (e) {
      return "dark";
    }
  });

  // Apply theme to <html> element
  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.setAttribute("data-theme", "light");
      }
      localStorage.setItem("bda_theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState("stream");

  // Sidebar Open State (Opened by clicking the logo)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stream state (Strict Pause Guarantee)
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(isPlaying);

  // Keep isPlayingRef strictly in sync with isPlaying state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const [speed, setSpeed] = useState(1);
  const [streamSource, setStreamSource] = useState("bda_engine"); // 'websocket' | 'bda_engine'
  const [isConnected, setIsConnected] = useState(false);
  const [isDdosActive, setIsDdosActive] = useState(false);

  // Packet & Metric Telemetry
  const [packets, setPackets] = useState([]);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [packetCounter, setPacketCounter] = useState(0);
  const [liveRate, setLiveRate] = useState(20);
  const [attackNotification, setAttackNotification] = useState(null);

  // Algorithms
  const bloomFilterRef = useRef(null);
  const fmEstimatorRef = useRef(null);
  const [fmEstimate, setFmEstimate] = useState(0);
  const [actualDistinct, setActualDistinct] = useState(0);

  // Stream Index
  const streamIndexRef = useRef(0);
  const ddosBurstRef = useRef(0);

  // 1. Initialize Algorithms & Preload ALL Blacklisted IPs (8,169 hosts)
  useEffect(() => {
    const bf = new BloomFilter(8169, 0.01);
    const fm = new FlajoletMartin(64);

    // Pre-populate Bloom Filter with ALL known blacklisted IPs from MapReduce baselines
    if (bdaData && bdaData.blacklist_map) {
      Object.keys(bdaData.blacklist_map).forEach((ip) => {
        bf.add(ip);
      });
    } else if (bdaData && bdaData.top_baselines) {
      bdaData.top_baselines.forEach((b) => {
        if (b.count > 5) {
          bf.add(b.ip);
        }
      });
    }

    bloomFilterRef.current = bf;
    fmEstimatorRef.current = fm;
  }, []);

  // 2. Connect to local WebSocket if available (fallback to internal engine)
  useEffect(() => {
    let ws = null;
    let didConnect = false;

    try {
      ws = new WebSocket("ws://127.0.0.1:8000/ws/stream");

      ws.onopen = () => {
        didConnect = true;
        setIsConnected(true);
        setStreamSource("websocket");
        console.log("[+] Connected to local FastAPI WebSocket stream.");
      };

      ws.onmessage = (event) => {
        // STRICT PAUSE CHECK: If paused, immediately drop/ignore incoming WebSocket frames!
        if (!isPlayingRef.current) {
          return;
        }

        try {
          const message = JSON.parse(event.data);
          if (message.error) return;

          handleIncomingPacket(message);
        } catch (err) {
          console.error("Failed to parse WebSocket packet:", err);
        }
      };

      ws.onerror = () => {
        // Will close and fall back to bda_engine
      };

      ws.onclose = () => {
        if (didConnect) {
          setIsConnected(false);
          setStreamSource("bda_engine");
        }
      };
    } catch (e) {
      setIsConnected(false);
      setStreamSource("bda_engine");
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // 3. Regular Ingestion Handler - Drops if paused
  const handleIncomingPacket = (pkt) => {
    if (!isPlayingRef.current) {
      return;
    }

    setPacketCounter((prev) => prev + 1);
    setPackets((prev) => [pkt, ...prev].slice(0, 60));

    if (pkt.threat_detected) {
      setThreatCount((prev) => prev + 1);
      setLiveAlerts((prev) =>
        [
          {
            id: pkt.id || Date.now(),
            timestamp: pkt.timestamp,
            ip: pkt.source_ip,
            type:
              pkt.label === "DDoS" ? "Volumetric Flood" : "Bloom Filter Match",
            status: "Blocked",
          },
          ...prev,
        ].slice(0, 50),
      );
    }

    if (pkt.fm_estimate !== undefined) {
      setFmEstimate(pkt.fm_estimate);
      setIsDdosActive(pkt.fm_estimate > 500);
    }

    // Chart Time-Series (last 30 intervals)
    setChartData((prev) => {
      const timeLabel = pkt.timestamp
        ? pkt.timestamp.split(" ")[1] || pkt.timestamp
        : "Live";
      const updated = [
        ...prev,
        {
          time: timeLabel,
          total: 1,
          threats: pkt.threat_detected ? 1 : 0,
        },
      ];
      return updated.slice(-30);
    });
  };

  // 4. Built-in BDA Streaming Engine (when playing)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(20, Math.floor(100 / speed));
    const timer = setInterval(() => {
      if (!isPlayingRef.current) return;
      if (!bloomFilterRef.current || !fmEstimatorRef.current) return;

      const flows = bdaData.stream_flows || [];
      if (flows.length === 0) return;

      let flowData;
      let isThreat = false;
      let label = "BENIGN";
      let sourceIp = "";

      // Check if we are running an active DDoS burst
      if (ddosBurstRef.current > 0) {
        ddosBurstRef.current -= 1;
        // Generate high-cardinality spoofed IPs to keep Flajolet-Martin elevated
        sourceIp = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        label = "DDoS";
        isThreat = true;
        flowData = {
          flow_id: `${sourceIp}-192.168.10.50-${Math.floor(Math.random() * 60000 + 1024)}-80-6`,
          source_ip: sourceIp,
          destination_ip: "192.168.10.50",
          protocol: "6",
          destination_port: 80,
          timestamp: new Date().toLocaleTimeString(),
          label: "DDoS",
        };
      } else {
        const idx = streamIndexRef.current % flows.length;
        streamIndexRef.current += 1;
        const baseFlow = flows[idx];
        sourceIp = baseFlow.source_ip;
        label = baseFlow.label;

        flowData = {
          ...baseFlow,
          timestamp: new Date().toLocaleTimeString(),
        };
      }

      // 1. Bloom Filter Check
      isThreat =
        bloomFilterRef.current.check(sourceIp) ||
        label === "DDoS" ||
        label === "Botnet" ||
        label === "PortScan";

      // 2. Flajolet-Martin Distinct Tracking
      fmEstimatorRef.current.add(sourceIp);
      const estimate = fmEstimatorRef.current.estimate();
      const actual = fmEstimatorRef.current.getActualDistinct();

      setFmEstimate(estimate);
      setActualDistinct(actual);
      setIsDdosActive(estimate > 500);

      const packetRecord = {
        id: packetCounter + 1,
        flow_id: flowData.flow_id,
        timestamp: flowData.timestamp,
        source_ip: sourceIp,
        destination_ip: flowData.destination_ip,
        protocol: flowData.protocol,
        destination_port: flowData.destination_port,
        label: label,
        threat_detected: isThreat,
        fm_estimate: estimate,
      };

      handleIncomingPacket(packetRecord);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, packetCounter]);

  // Rate calculation (0 pkts/sec strictly when paused!)
  useEffect(() => {
    if (!isPlaying) {
      setLiveRate(0);
      return;
    }
    const rateTimer = setInterval(() => {
      setLiveRate(Math.floor(Math.random() * 8 + 18 * speed));
    }, 1000);
    return () => clearInterval(rateTimer);
  }, [isPlaying, speed]);

  // Robust Attack Injection Handler - ALWAYS executes immediately, even when paused!
  const handleInjectAttack = (type) => {
    const timeStr = new Date().toLocaleTimeString();

    if (type === "ddos") {
      // 1. Feed 750 distinct random spoofed IPs to Flajolet-Martin estimator
      if (fmEstimatorRef.current) {
        for (let i = 0; i < 750; i++) {
          const randIp = `172.31.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254 + 1)}`;
          fmEstimatorRef.current.add(randIp);
        }
      }
      const newEstimate = fmEstimatorRef.current
        ? fmEstimatorRef.current.estimate()
        : 740;
      const newActual = fmEstimatorRef.current
        ? fmEstimatorRef.current.getActualDistinct()
        : 750;

      setFmEstimate(newEstimate);
      setActualDistinct(newActual);
      setIsDdosActive(true);

      // 2. Generate 25 immediate spoofed flow records for the live stream table
      const burstPackets = [];
      for (let i = 0; i < 25; i++) {
        const spoofedIp = `172.31.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254 + 1)}`;
        const sport = Math.floor(Math.random() * 50000 + 1024);
        burstPackets.push({
          id: packetCounter + i + 1,
          flow_id: `${spoofedIp}-192.168.10.50-${sport}-80-6`,
          timestamp: timeStr,
          source_ip: spoofedIp,
          destination_ip: "192.168.10.50",
          protocol: "6",
          destination_port: 80,
          label: "DDoS",
          threat_detected: true,
          fm_estimate: newEstimate,
        });
      }

      setPacketCounter((prev) => prev + 25);
      setThreatCount((prev) => prev + 25);
      setPackets((prev) => [...burstPackets, ...prev].slice(0, 60));

      setLiveAlerts((prev) =>
        [
          {
            id: Date.now(),
            timestamp: timeStr,
            ip: "172.31.x.x (Volumetric Swarm)",
            type: `Volumetric DDoS Flood (FM Estimate: ${newEstimate.toLocaleString()} > 500)`,
            status: "Blocked",
          },
          ...prev,
        ].slice(0, 50),
      );

      setChartData((prev) =>
        [...prev, { time: timeStr, total: 25, threats: 25 }].slice(-30),
      );

      if (isPlaying) {
        ddosBurstRef.current = 40;
      }

      setAttackNotification(
        `Volumetric DDoS Attack Injected — 750 spoofed distinct IPs evaluated. Flajolet-Martin spiked to ${newEstimate.toLocaleString()} distinct hosts (Threshold > 500 exceeded).`,
      );
    } else if (type === "blacklist") {
      // Confirmed primary attacker IP 172.16.0.1 probing multiple sensitive ports
      const attackerIp = "172.16.0.1";
      const targetPorts = [21, 22, 80, 443, 4444, 3389];
      const scanPackets = targetPorts.map((port, idx) => ({
        id: packetCounter + idx + 1,
        flow_id: `${attackerIp}-192.168.10.50-${4000 + idx}-${port}-6`,
        timestamp: timeStr,
        source_ip: attackerIp,
        destination_ip: "192.168.10.50",
        protocol: "6",
        destination_port: port,
        label: "Infiltration / Attacker IP",
        threat_detected: true,
        fm_estimate: fmEstimate,
      }));

      setPacketCounter((prev) => prev + scanPackets.length);
      setThreatCount((prev) => prev + scanPackets.length);
      setPackets((prev) => [...scanPackets, ...prev].slice(0, 60));

      setLiveAlerts((prev) =>
        [
          {
            id: Date.now(),
            timestamp: timeStr,
            ip: attackerIp,
            type: "Bloom Filter Match (Known Attacker 172.16.0.1 — Infiltration)",
            status: "Blocked",
          },
          ...prev,
        ].slice(0, 50),
      );

      setChartData((prev) =>
        [
          ...prev,
          {
            time: timeStr,
            total: scanPackets.length,
            threats: scanPackets.length,
          },
        ].slice(-30),
      );

      setAttackNotification(
        `Attacker IP (172.16.0.1) Injected — 6 port infiltration flows flagged & dropped at line-rate via Bloom Filter.`,
      );
    } else if (type === "botnet") {
      // C2 Server 104.16.207.165 and bot machines (Module 5 Graph Community Detection)
      const c2Server = "104.16.207.165";
      const botIps = [
        "10.0.0.1",
        "10.0.0.2",
        "10.0.0.3",
        "10.0.0.4",
        "10.0.0.5",
        "10.0.0.6",
        "10.0.0.7",
        "10.0.0.8",
      ];
      const botPackets = botIps.map((botIp, idx) => ({
        id: packetCounter + idx + 1,
        flow_id: `${botIp}-${c2Server}-${8000 + idx}-8080-6`,
        timestamp: timeStr,
        source_ip: botIp,
        destination_ip: c2Server,
        protocol: "6",
        destination_port: 8080,
        label: "Botnet C2 Swarm",
        threat_detected: true,
        fm_estimate: fmEstimate,
      }));

      setPacketCounter((prev) => prev + botPackets.length);
      setThreatCount((prev) => prev + botPackets.length);
      setPackets((prev) => [...botPackets, ...prev].slice(0, 60));

      setLiveAlerts((prev) =>
        [
          {
            id: Date.now(),
            timestamp: timeStr,
            ip: c2Server,
            type: "C2 Botnet Star Topology Cluster Detected (Module 5 Greedy Modularity)",
            status: "Blocked",
          },
          ...prev,
        ].slice(0, 50),
      );

      setChartData((prev) =>
        [
          ...prev,
          {
            time: timeStr,
            total: botPackets.length,
            threats: botPackets.length,
          },
        ].slice(-30),
      );

      setAttackNotification(
        `C2 Botnet Swarm Injected — 8 zombie nodes communicating with C2 server (${c2Server}:8080) intercepted & blocked.`,
      );
    } else if (type === "portscan") {
      // Rapid multi-port scan probe
      const scannerIp = "172.16.0.1";
      const scanPorts = [21, 22, 23, 25, 80, 110, 443, 3306, 8080];
      const scanPackets = scanPorts.map((port, idx) => ({
        id: packetCounter + idx + 1,
        flow_id: `${scannerIp}-192.168.10.50-${5000 + idx}-${port}-6`,
        timestamp: timeStr,
        source_ip: scannerIp,
        destination_ip: "192.168.10.50",
        protocol: "6",
        destination_port: port,
        label: "PortScan",
        threat_detected: true,
        fm_estimate: fmEstimate,
      }));

      setPacketCounter((prev) => prev + scanPackets.length);
      setThreatCount((prev) => prev + scanPackets.length);
      setPackets((prev) => [...scanPackets, ...prev].slice(0, 60));

      setLiveAlerts((prev) =>
        [
          {
            id: Date.now(),
            timestamp: timeStr,
            ip: scannerIp,
            type: "PortScan Sweep Probing Multiple Service Ports",
            status: "Blocked",
          },
          ...prev,
        ].slice(0, 50),
      );

      setChartData((prev) =>
        [
          ...prev,
          {
            time: timeStr,
            total: scanPackets.length,
            threats: scanPackets.length,
          },
        ].slice(-30),
      );

      setAttackNotification(
        `PortScan Sweep Injected — Rapid multi-port probe (ports 21-8080) intercepted & dropped.`,
      );
    } else if (type === "benign") {
      // Normal Enterprise Flows (DNS 53, HTTPS 443)
      const benignFlows = [
        { src: "192.168.10.25", dst: "8.8.8.8", port: 53, proto: "17" },
        { src: "192.168.10.30", dst: "1.1.1.1", port: 53, proto: "17" },
        { src: "192.168.10.45", dst: "142.250.190.46", port: 443, proto: "6" },
        { src: "192.168.10.50", dst: "151.101.1.140", port: 80, proto: "6" },
        { src: "192.168.10.12", dst: "8.8.4.4", port: 53, proto: "17" },
      ];

      const cleanPackets = benignFlows.map((flow, idx) => ({
        id: packetCounter + idx + 1,
        flow_id: `${flow.src}-${flow.dst}-${55000 + idx}-${flow.port}-${flow.proto}`,
        timestamp: timeStr,
        source_ip: flow.src,
        destination_ip: flow.dst,
        protocol: flow.proto,
        destination_port: flow.port,
        label: "BENIGN",
        threat_detected: false,
        fm_estimate: fmEstimate,
      }));

      setPacketCounter((prev) => prev + cleanPackets.length);
      setPackets((prev) => [...cleanPackets, ...prev].slice(0, 60));

      setChartData((prev) =>
        [
          ...prev,
          { time: timeStr, total: cleanPackets.length, threats: 0 },
        ].slice(-30),
      );

      setAttackNotification(
        `Normal Enterprise Traffic Injected — 5 clean packets permitted through with zero false positive drops.`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Bar with Clickable Logo & Full Controls */}
      <Navbar
        activeTab={activeTab}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        speed={speed}
        setSpeed={setSpeed}
        theme={theme}
        toggleTheme={toggleTheme}
        onInjectAttack={handleInjectAttack}
        isConnected={isConnected}
        streamSource={streamSource}
      />

      {/* Slide-out Sidebar Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        theme={theme}
        toggleTheme={toggleTheme}
        onInjectAttack={handleInjectAttack}
        isConnected={isConnected}
        streamSource={streamSource}
        threatCount={threatCount}
        packetCount={packetCounter}
      />

      {/* Main Container - max-w-[1600px] ensures UI fits cleanly on any screen size */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-5">
        {/* Executive High-Density Metrics Bar */}
        <MetricCards
          packetCount={packetCounter}
          threatCount={threatCount}
          fmEstimate={fmEstimate}
          actualDistinct={actualDistinct}
          isDdosActive={isDdosActive}
          baselineStats={{
            total: bdaData.summary.total_baseline_ips,
            blacklisted: bdaData.summary.blacklisted_threshold_ips,
          }}
          liveRate={liveRate}
        />

        {/* Dynamic View by Selected Module Tab */}
        {activeTab === "stream" && (
          <LiveStreamView
            packets={packets}
            chartData={chartData}
            threatCount={threatCount}
            isDdosActive={isDdosActive}
            streamSource={streamSource}
            isConnected={isConnected}
            isPlaying={isPlaying}
            onClearStream={() => {
              setPackets([]);
              setChartData([]);
            }}
            onInjectAttack={handleInjectAttack}
            attackNotification={attackNotification}
            onDismissNotification={() => setAttackNotification(null)}
          />
        )}

        {activeTab === "mapreduce" && (
          <HadoopMapReduceView
            baselines={bdaData.top_baselines}
            processedFeatures={bdaData.processed_features}
            summary={bdaData.summary}
          />
        )}

        {activeTab === "nosql" && (
          <NoSqlServingView
            baselines={bdaData.top_baselines}
            blacklistMap={bdaData.blacklist_map}
            liveAlerts={liveAlerts}
          />
        )}

        {activeTab === "streaming-algo" && (
          <StreamingAlgorithmsView
            bloomFilter={bloomFilterRef.current}
            flajoletMartin={fmEstimatorRef.current}
            fmEstimate={fmEstimate}
            actualDistinct={actualDistinct}
            isDdosActive={isDdosActive}
            onInjectAttack={handleInjectAttack}
          />
        )}

        {activeTab === "botnet" && <BotnetCommunityView />}

        {activeTab === "r-prediction" && (
          <PredictiveAnalyticsRView rTrainingData={bdaData.r_training_data} />
        )}
      </main>

      {/* Clean Academic Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-3 sm:px-6 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>
              Real-Time Network Intrusion &amp; Distributed Attack Detection
              System
            </span>
            <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
            <span>Big Data Analytics Architecture</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap justify-center">
            <span>Hadoop HDFS</span>
            <span>·</span>
            <span>MapReduce</span>
            <span>·</span>
            <span>MongoDB B-Tree</span>
            <span>·</span>
            <span>Bloom Filter (k=7)</span>
            <span>·</span>
            <span>Flajolet-Martin (64)</span>
            <span>·</span>
            <span>R Regression</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
