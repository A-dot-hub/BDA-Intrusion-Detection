import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const [streamSpeed, setStreamSpeed] = useState('40');
  const [falsePositive, setFalsePositive] = useState('0.01');
  const [hashesCount, setHashesCount] = useState('64');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
        <h3 className="text-sm font-bold text-slate-100 mb-1">Engine Configuration Parameters</h3>
        <p className="text-xs text-slate-400 mb-6">Adjust streaming rate, Bloom Filter parameters, and FM hash counts</p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Stream Interval Tick (ms)</label>
            <input 
              type="number" 
              value={streamSpeed} 
              onChange={(e) => setStreamSpeed(e.target.value)}
              className="w-full bg-[#1a1d2b] border border-[#2e3244] rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Bloom Filter False Positive Rate</label>
            <input 
              type="text" 
              value={falsePositive} 
              onChange={(e) => setFalsePositive(e.target.value)}
              className="w-full bg-[#1a1d2b] border border-[#2e3244] rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Flajolet-Martin Hash Functions (num_hashes)</label>
            <input 
              type="number" 
              value={hashesCount} 
              onChange={(e) => setHashesCount(e.target.value)}
              className="w-full bg-[#1a1d2b] border border-[#2e3244] rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
            {saved && <span className="text-emerald-400 font-medium font-mono">Settings saved successfully!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
