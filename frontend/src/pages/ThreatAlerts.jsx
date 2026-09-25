import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';

export default function ThreatAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/alerts');
      if (!res.ok) throw new Error('Failed to fetch alerts from backend');
      const data = await res.json();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#161925] border border-[#222533]">
        <div>
          <h3 className="text-sm font-bold text-slate-100">MongoDB Threat Alerts & Blacklist Matches</h3>
          <p className="text-xs text-slate-400">Real-time alerts persisted in the `LiveAlerts` NoSQL collection</p>
        </div>
        <button 
          onClick={fetchAlerts}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1a1d2b] border border-[#2e3244] text-slate-200 hover:bg-[#222638] flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Could not retrieve alerts from backend ({error}). Ensure FastAPI and MongoDB are running.</span>
        </div>
      )}

      <div className="rounded-2xl bg-[#161925] border border-[#222533] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222533] text-[11px] font-mono text-slate-400 bg-[#12141c]">
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">SOURCE IP</th>
                <th className="py-3 px-4">DESTINATION IP</th>
                <th className="py-3 px-4">DETECTION METHOD</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222533] text-xs font-mono">
              {alerts.map((alert, idx) => (
                <tr key={idx} className="hover:bg-[#1a1d2b]/50 text-slate-300">
                  <td className="py-3 px-4 text-slate-400">{alert.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-red-400">{alert.ip}</td>
                  <td className="py-3 px-4 text-slate-300">{alert.destination_ip || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                      {alert.type || 'Bloom Filter Match'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {alert.status || 'Blocked'}
                    </span>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-slate-500 text-xs font-sans">
                    No threat alerts recorded in MongoDB yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
