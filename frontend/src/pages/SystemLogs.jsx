import React from 'react';
import { Terminal, CheckCircle2, ShieldAlert, Info } from 'lucide-react';

export default function SystemLogs({ isConnected }) {
  const logs = [
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Big Data Stream Engine initialized successfully.' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Connected to MongoDB serving layer (IntrusionDetection).' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Bloom Filter configured with false positive rate 0.01.' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Flajolet-Martin estimator loaded with 64 hash functions.' },
    { time: new Date().toLocaleTimeString(), level: isConnected ? 'INFO' : 'WARN', message: isConnected ? 'WebSocket client connected to /ws/stream.' : 'WebSocket client disconnected.' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
        <h3 className="text-sm font-bold text-slate-100 mb-1">Backend Engine Diagnostic Logs</h3>
        <p className="text-xs text-slate-400 mb-4">Real-time event logging from FastAPI & streaming pipeline</p>

        <div className="rounded-xl bg-[#0e1017] border border-[#222533] p-4 font-mono text-xs space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-slate-500">[{log.time}]</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                log.level === 'INFO' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {log.level}
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
