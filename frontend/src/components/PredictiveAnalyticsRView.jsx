import React, { useState } from 'react';
import { TrendingUp, Sliders, AlertTriangle, CheckCircle2, Terminal, Image as ImageIcon, LineChart as ChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function PredictiveAnalyticsRView({ rTrainingData }) {
  const [timeOfDay, setTimeOfDay] = useState(14); // 14:00 (2 PM)
  const [activeIps, setActiveIps] = useState(800); // 800 active hosts (matching alert scenario in traffic_prediction.R)
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'artifact'

  // Model parameters from traffic_prediction.R
  // VolumeMB = (timeOfDay * 15) + (activeIps * 2.5) + noise
  const betaIntercept = 4.12;
  const betaTimeOfDay = 15.02;
  const betaActiveIps = 2.49;
  const capacityLimit = 1500; // 1500 MB auto-scale limit

  const predictedVolume = betaIntercept + (timeOfDay * betaTimeOfDay) + (activeIps * betaActiveIps);
  const baselineVolume = betaIntercept + (timeOfDay * betaTimeOfDay) + (200 * betaActiveIps); // normal 200 IPs
  const isCapacityExceeded = predictedVolume > capacityLimit;

  // Chart data for 24-hour curve comparing baseline vs simulated activeIPs
  const dayCurveData = Array.from({ length: 24 }).map((_, h) => {
    const normal = betaIntercept + (h * betaTimeOfDay) + (200 * betaActiveIps);
    const simulated = betaIntercept + (h * betaTimeOfDay) + (activeIps * betaActiveIps);
    return {
      hour: `${h}:00`,
      h,
      baseline: Math.round(normal),
      predicted: Math.round(simulated),
      capacity: capacityLimit
    };
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                MODULE 6
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Predictive Traffic Analytics (Multiple Linear Regression in R)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Statistical modeling using R's <span className="font-mono text-emerald-600 dark:text-emerald-400">lm()</span> engine. Forecasts impending network capacity saturation and triggers automated auto-scaling policies before denial-of-service occurs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'interactive'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ChartIcon className="w-3.5 h-3.5" />
              <span>Interactive R Sandbox</span>
            </button>
            <button
              onClick={() => setViewMode('artifact')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'artifact'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>R Forecast Plot (PNG)</span>
            </button>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">Model Formula</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">VolumeMB ~ TimeOfDay + ActiveIPs</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">Goodness of Fit (R²)</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 text-xs">0.9412 (94.1% variance)</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">F-Statistic / p-Value</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">F = 774.2 (p &lt; 2.2e-16)</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">Auto-Scaling Threshold</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">1,500.00 MB Capacity</span>
          </div>
        </div>
      </div>

      {viewMode === 'interactive' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Interactive Scenario Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs text-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                R Regression Forecast Calculator
              </h3>
            </div>

            {/* Slider 1: Time of Day */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Time of Day:
                </label>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {timeOfDay}:00 ({timeOfDay < 12 ? 'AM' : 'PM'})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>00:00 (Midnight)</span>
                <span>12:00 (Noon)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Slider 2: Active IP Count */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active IP Hosts in Window:
                </label>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {activeIps} Hosts
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={activeIps}
                onChange={(e) => setActiveIps(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>50 Normal</span>
                <span>500 Threshold</span>
                <span>1,000 DDoS Flood</span>
              </div>
            </div>

            {/* Calculated Results Box */}
            <div className={`p-4 rounded-lg border transition-all ${
              isCapacityExceeded
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
            }`}>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Predicted Traffic Volume (R Output)
              </span>
              <div className={`text-2xl font-bold font-mono mt-1 tabular-nums ${
                isCapacityExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {predictedVolume.toFixed(2)} MB
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Baseline Volume (200 IPs):</span>
                  <span className="font-mono font-semibold">{baselineVolume.toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Threshold:</span>
                  <span className="font-mono font-semibold">{capacityLimit}.00 MB</span>
                </div>
              </div>

              {isCapacityExceeded ? (
                <div className="mt-3 p-2 bg-rose-100 dark:bg-rose-900/60 rounded text-rose-800 dark:text-rose-200 text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>[CRITICAL] Predicted volume exceeds infrastructure capacity! Triggering auto-scaling.</span>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded text-emerald-800 dark:text-emerald-200 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Bandwidth within nominal operating headroom.</span>
                </div>
              )}
            </div>

            {/* Preset Alert Scenario matching traffic_prediction.R lines 20-27 */}
            <button
              onClick={() => { setTimeOfDay(14); setActiveIps(800); }}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md transition-colors text-xs"
            >
              Load R Script Scenario (14:00 with 800 Active IPs)
            </button>
          </div>

          {/* Right Column: 24-Hour Diurnal Forecast Curve & R Console */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Chart: 24-Hour Curve */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    24-Hour Network Traffic Forecast Curve
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comparing typical diurnal baseline against current simulated active host scenario
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span>Baseline</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Simulated</span>
                  </div>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dayCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '11px',
                      }}
                    />
                    <ReferenceLine
                      y={capacityLimit}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'Capacity Limit: 1500 MB', fill: '#ef4444', fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      dot={false}
                      name="Nominal Baseline"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke={isCapacityExceeded ? '#ef4444' : '#10b981'}
                      strokeWidth={2.5}
                      dot={false}
                      name="Forecast Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* R Terminal Output Box (matching traffic_prediction.R stdout) */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-[11px] text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>R Console Session Output (<span className="text-emerald-400">traffic_prediction.R</span>)</span>
                </div>
                <span>R Version 4.3.2 (Analytics Engine)</span>
              </div>
              <pre className="overflow-x-auto text-[10.5px] leading-relaxed text-slate-200">
{`> model <- lm(VolumeMB ~ TimeOfDay + ActiveIPs, data = network_data)
> summary(model)

Coefficients:
            Estimate Std. Error t value Pr(>|t|)    
(Intercept)   4.1205     8.9214   0.462    0.645    
TimeOfDay    15.0211     0.7320  20.520   <2e-16 ***
ActiveIPs     2.4912     0.0652  38.210   <2e-16 ***
---
Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

Residual standard error: 48.91 on 97 degrees of freedom
Multiple R-squared:  0.9412,	Adjusted R-squared:  0.9398 
F-statistic: 774.2 on 2 and 97 DF,  p-value: < 2.2e-16

[ALERT SCENARIO] Predicting traffic for ${timeOfDay}:00 with ${activeIps} Active IPs...
-> Expected Baseline Volume: ${baselineVolume.toFixed(2)} MB
-> Predicted Volume:         ${predictedVolume.toFixed(2)} MB
${isCapacityExceeded ? '[CRITICAL] Predicted volume exceeds infrastructure capacity (1500 MB)! Triggering auto-scaling.' : '[OK] Traffic volume nominal.'}`}
              </pre>
            </div>

          </div>

        </div>
      ) : (
        /* Academic PNG Plot View (generated from R script) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                R Regression Plot Artifact (<span className="font-mono">traffic_forecast.png</span>)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rendered artifact matching <span className="font-mono">traffic_prediction.R</span> with abline(lm(...), col='red')
              </p>
            </div>
            <a
              href="/traffic_forecast.png"
              download="traffic_forecast.png"
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
            >
              Download High-Res PNG
            </a>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <img
              src="/traffic_forecast.png"
              alt="R Traffic Forecast Multiple Linear Regression"
              className="w-full max-h-[600px] object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
}
