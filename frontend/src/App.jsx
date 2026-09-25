import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopNavbar from './components/layout/TopNavbar';
import Overview from './pages/Overview';
import LiveMonitor from './pages/LiveMonitor';
import ThreatAlerts from './pages/ThreatAlerts';
import IPIntelligence from './pages/IPIntelligence';
import StreamAnalytics from './pages/StreamAnalytics';
import NetworkGraphView from './pages/NetworkGraphView';
import HistoricalAnalytics from './pages/HistoricalAnalytics';
import Reports from './pages/Reports';
import SystemLogs from './pages/SystemLogs';
import Settings from './pages/Settings';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Stream & Analytics State
  const [packets, setPackets] = useState([]);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fmEstimate, setFmEstimate] = useState(0);

  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
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
        } catch (err) {
          console.error("Failed to parse packet payload:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isPaused]);

  const totalPackets = packets.length > 0 ? packets[0].id + 1 : 0;

  return (
    <div className="min-h-screen bg-[#0e1017] text-slate-100 flex font-sans antialiased">
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
          {currentView === 'overview' && (
            <Overview 
              packets={packets}
              threatCount={threatCount}
              isConnected={isConnected}
              chartData={chartData}
              fmEstimate={fmEstimate}
            />
          )}

          {currentView === 'monitor' && (
            <LiveMonitor 
              packets={packets}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
            />
          )}

          {currentView === 'alerts' && <ThreatAlerts />}

          {currentView === 'intelligence' && <IPIntelligence />}

          {currentView === 'stream-analytics' && (
            <StreamAnalytics 
              chartData={chartData}
              fmEstimate={fmEstimate}
            />
          )}

          {currentView === 'network-graph' && <NetworkGraphView />}

          {currentView === 'historical' && <HistoricalAnalytics />}

          {currentView === 'reports' && (
            <Reports 
              packets={packets}
              threatCount={threatCount}
              fmEstimate={fmEstimate}
            />
          )}

          {currentView === 'logs' && <SystemLogs isConnected={isConnected} />}

          {currentView === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
