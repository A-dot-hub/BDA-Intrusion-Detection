import React from 'react';
import { FileText, Download, ShieldCheck, Activity } from 'lucide-react';

export default function Reports({ packets, threatCount, fmEstimate }) {
  const totalPackets = packets.length > 0 ? packets[0].id + 1 : 0;

  const downloadReport = () => {
    const reportText = `NETSENTINEL EXECUTIVE SECURITY & ANALYTICS REPORT\n` +
      `====================================================\n` +
      `Generated: ${new Date().toISOString()}\n` +
      `Total Packets Processed: ${totalPackets}\n` +
      `Bloom Filter Threats Blocked: ${threatCount}\n` +
      `Distinct IP Cardinality (FM Estimate): ${fmEstimate}\n` +
      `Status: Operational\n`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'netsentinel_executive_report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Executive Security & Analytics Summary</h3>
          <p className="text-xs text-slate-400 mt-1">Export structured audit reports for project evaluations</p>
        </div>
        <button 
          onClick={downloadReport}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Summary Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Total Stream Flow Count</span>
          <p className="text-3xl font-bold font-mono text-slate-100 mt-2">{totalPackets}</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Total Blacklist Matches</span>
          <p className="text-3xl font-bold font-mono text-red-400 mt-2">{threatCount}</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#161925] border border-[#222533]">
          <span className="text-xs text-slate-400">Cardinality Estimate</span>
          <p className="text-3xl font-bold font-mono text-purple-400 mt-2">{fmEstimate}</p>
        </div>
      </div>
    </div>
  );
}
