import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import LiveStreamView from './components/LiveStreamView';
import HadoopMapReduceView from './components/HadoopMapReduceView';
import NoSqlServingView from './components/NoSqlServingView';
import StreamingAlgorithmsView from './components/StreamingAlgorithmsView';
import BotnetCommunityView from './components/BotnetCommunityView';
import PredictiveAnalyticsRView from './components/PredictiveAnalyticsRView';

import bdaData from './data/bda_dataset.json';
import { BloomFilter, FlajoletMartin } from './services/streamingEngine';

function App() {
  // Theme State: 'dark' by default for cybersecurity operations
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('bda_theme');
      return saved ? saved : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  // Apply theme to <html> element
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('bda_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState('stream');

  // Stream state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [streamSource, setStreamSource] = useState('bda_engine'); // 'websocket' | 'bda_engine'
  const [isConnected, setIsConnected] = useState(false);
  const [isDdosActive, setIsDdosActive] = useState(false);

  // Packet & Metric Telemetry
  const [packets, setPackets] = useState([]);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [packetCounter, setPacketCounter] = useState(0);
  const [liveRate, setLiveRate] = useState(20);

  // Algorithms
  const bloomFilterRef = useRef(null);
  const fmEstimatorRef = useRef(null);
  const [fmEstimate, setFmEstimate] = useState(0);
  const [actualDistinct, setActualDistinct] = useState(0);

  // Stream Index
  const streamIndexRef = useRef(0);
  const ddosBurstRef = useRef(0);

  // 1. Initialize Algorithms & Preload Blacklist
  useEffect(() => {
    const bf = new BloomFilter(8155, 0.01);
    const fm = new FlajoletMartin(64);

    // Pre-populate Bloom Filter with known blacklisted IPs from Hadoop baselines
    if (bdaData && bdaData.top_baselines) {
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
      ws = new WebSocket('ws://127.0.0.1:8000/ws/stream');

      ws.onopen = () => {
        didConnect = true;
        setIsConnected(true);
        setStreamSource('websocket');
        console.log('[+] Connected to local FastAPI WebSocket stream.');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.error) return;

          handleIncomingPacket(message);
        } catch (err) {
          console.error('Failed to parse WebSocket packet:', err);
        }
      };

      ws.onerror = () => {
        // Will close and fall back to bda_engine
      };

      ws.onclose = () => {
        if (didConnect) {
          setIsConnected(false);
          setStreamSource('bda_engine');
        }
      };
    } catch (e) {
      setIsConnected(false);
      setStreamSource('bda_engine');
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // 3. Packet Handling Function
  const handleIncomingPacket = (pkt) => {
    setPacketCounter((prev) => prev + 1);

    setPackets((prev) => [pkt, ...prev].slice(0, 50));
    if (pkt.threat_detected) {
      setThreatCount((prev) => prev + 1);
      setLiveAlerts((prev) => [
        {
          id: pkt.id,
          timestamp: pkt.timestamp,
          ip: pkt.source_ip,
          type: pkt.label === 'DDoS' ? 'Volumetric Flood' : 'Bloom Filter Match',
          status: 'Blocked',
        },
        ...prev,
      ].slice(0, 50));
    }

    // Chart Time-Series (last 30 intervals)
    setChartData((prev) => {
      const timeLabel = pkt.timestamp ? pkt.timestamp.split(' ')[1] || 'Live' : 'Live';
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

  // 4. Built-in BDA Streaming Engine (when offline or playing)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(20, Math.floor(100 / speed));
    const timer = setInterval(() => {
      if (!bloomFilterRef.current || !fmEstimatorRef.current) return;

      const flows = bdaData.stream_flows || [];
      if (flows.length === 0) return;

      let flowData;
      let isThreat = false;
      let label = 'BENIGN';
      let sourceIp = '';

      // Check if we are running a simulated DDoS burst
      if (ddosBurstRef.current > 0) {
        ddosBurstRef.current -= 1;
        // Generate high-cardinality spoofed IPs to trigger Flajolet-Martin
        sourceIp = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        label = 'DDoS';
        isThreat = true;
        flowData = {
          flow_id: `${sourceIp}-192.168.10.50-${Math.floor(Math.random() * 60000 + 1024)}-80-6`,
          source_ip: sourceIp,
          destination_ip: '192.168.10.50',
          protocol: '6',
          destination_port: 80,
          timestamp: new Date().toLocaleTimeString(),
          label: 'DDoS',
        };
      } else {
        setIsDdosActive(false);
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
      isThreat = bloomFilterRef.current.check(sourceIp) || label === 'DDoS' || label === 'Botnet';

      // 2. Flajolet-Martin Distinct Tracking
      fmEstimatorRef.current.add(sourceIp);
      const estimate = fmEstimatorRef.current.estimate();
      const actual = fmEstimatorRef.current.getActualDistinct();

      setFmEstimate(estimate);
      setActualDistinct(actual);

      if (estimate > 500) {
        setIsDdosActive(true);
      }

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

  // Rate calculation
  useEffect(() => {
    const rateTimer = setInterval(() => {
      setLiveRate(Math.floor(Math.random() * 8 + 18 * speed));
    }, 1000);
    return () => clearInterval(rateTimer);
  }, [speed]);

  // Attack Injection Handler
  const handleInjectAttack = (type) => {
    if (type === 'ddos') {
      ddosBurstRef.current = 80; // Burst 80 spoofed IPs
      setIsDdosActive(true);
    } else if (type === 'blacklist') {
      // Injects flow from confirmed primary attacker IP
      const pkt = {
        id: packetCounter + 1,
        flow_id: '172.16.0.1-192.168.10.50-4444-80-6',
        timestamp: new Date().toLocaleTimeString(),
        source_ip: '172.16.0.1',
        destination_ip: '192.168.10.50',
        protocol: '6',
        destination_port: 80,
        label: 'Infiltration / Attacker IP',
        threat_detected: true,
        fm_estimate: fmEstimate,
      };
      handleIncomingPacket(pkt);
    } else if (type === 'botnet') {
      const pkt = {
        id: packetCounter + 1,
        flow_id: '104.16.207.165-10.0.0.5-8080-8080-6',
        timestamp: new Date().toLocaleTimeString(),
        source_ip: '104.16.207.165',
        destination_ip: '10.0.0.5',
        protocol: '6',
        destination_port: 8080,
        label: 'Botnet',
        threat_detected: true,
        fm_estimate: fmEstimate,
      };
      handleIncomingPacket(pkt);
    } else if (type === 'benign') {
      const pkt = {
        id: packetCounter + 1,
        flow_id: '192.168.10.15-8.8.8.8-5353-53-17',
        timestamp: new Date().toLocaleTimeString(),
        source_ip: '192.168.10.15',
        destination_ip: '8.8.8.8',
        protocol: '17',
        destination_port: 53,
        label: 'BENIGN',
        threat_detected: false,
        fm_estimate: fmEstimate,
      };
      handleIncomingPacket(pkt);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6">
        
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
        {activeTab === 'stream' && (
          <LiveStreamView
            packets={packets}
            chartData={chartData}
            threatCount={threatCount}
            isDdosActive={isDdosActive}
            streamSource={streamSource}
            isConnected={isConnected}
            onClearStream={() => {
              setPackets([]);
              setChartData([]);
            }}
          />
        )}

        {activeTab === 'mapreduce' && (
          <HadoopMapReduceView
            baselines={bdaData.top_baselines}
            processedFeatures={bdaData.processed_features}
            summary={bdaData.summary}
          />
        )}

        {activeTab === 'nosql' && (
          <NoSqlServingView
            baselines={bdaData.top_baselines}
            liveAlerts={liveAlerts}
          />
        )}

        {activeTab === 'streaming-algo' && (
          <StreamingAlgorithmsView
            bloomFilter={bloomFilterRef.current}
            flajoletMartin={fmEstimatorRef.current}
            fmEstimate={fmEstimate}
            actualDistinct={actualDistinct}
            isDdosActive={isDdosActive}
            onInjectAttack={handleInjectAttack}
          />
        )}

        {activeTab === 'botnet' && (
          <BotnetCommunityView />
        )}

        {activeTab === 'r-prediction' && (
          <PredictiveAnalyticsRView
            rTrainingData={bdaData.r_training_data}
          />
        )}

      </main>

      {/* Quiet Academic Footer (Anti-Slop Restraint: No ornamental fake tickers) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 lg:px-6 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Real-Time Network Intrusion &amp; Distributed Attack Detection System</span>
            <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
            <span>Big Data Analytics Architecture</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Hadoop HDFS</span>
            <span>·</span>
            <span>MapReduce</span>
            <span>·</span>
            <span>MongoDB</span>
            <span>·</span>
            <span>Bloom Filter</span>
            <span>·</span>
            <span>Flajolet-Martin</span>
            <span>·</span>
            <span>R Regression</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
