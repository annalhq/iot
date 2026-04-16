'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, BellRing, MapPin, Volume2 } from 'lucide-react';
import { format } from 'date-fns';

// Dynamically import Map to prevent SSR errors with Leaflet
const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-900 rounded-2xl animate-pulse text-slate-400">Loading Map...</div>
});

type TelemetryData = {
  analogLevel: number;
  noiseLevel: string;
  timestamp: string;
  lat: number;
  lng: number;
};

export default function Dashboard() {
  const [data, setData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll API every 1 second
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/telemetry');
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch telemetry data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const latest = data.length > 0 ? data[0] : null;

  const isAlarm = latest ? ["Loud", "Very Loud", "Hazardous"].includes(latest.noiseLevel) : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center gap-3">
            <Activity className="text-emerald-400" size={32} />
            IoT Noise Monitor
          </h1>
          <p className="text-slate-400 mt-1">Live telemetry dashboard for ESP8266</p>
        </div>
        
        {isAlarm && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full border border-red-500/30 animate-pulse font-semibold shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <BellRing size={20} />
            HIGH NOISE ALARM DETECTED
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Table */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Volume2 size={100} />
            </div>
            
            <h2 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-4">Current Reading</h2>
            
            {loading ? (
              <div className="animate-pulse h-20 bg-slate-800 rounded-lg"></div>
            ) : latest ? (
              <div>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-6xl font-black text-white">{latest.analogLevel}</span>
                  <span className="text-slate-400 pb-1 font-medium">Amplitude</span>
                </div>
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold
                  ${latest.noiseLevel === 'Quiet' ? 'bg-emerald-500/20 text-emerald-400' :
                    latest.noiseLevel === 'Moderate' ? 'bg-amber-500/20 text-amber-400' :
                    latest.noiseLevel === 'Loud' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                  }
                `}>
                  {latest.noiseLevel.toUpperCase()}
                </div>
                <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                  <MapPin size={14} /> 
                  Location: {latest.lat.toFixed(4)}, {latest.lng.toFixed(4)}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">Awaiting data...</p>
            )}
          </div>

          {/* Alarm / History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col h-[500px]">
            <h2 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-4">Recent Telemetry</h2>
            
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.length === 0 ? (
                <p className="text-slate-500 text-center mt-10">No records found</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-900 z-10 text-slate-400">
                    <tr>
                      <th className="pb-3 border-b border-slate-800 font-medium">Time</th>
                      <th className="pb-3 border-b border-slate-800 font-medium">Lvl</th>
                      <th className="pb-3 border-b border-slate-800 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.slice(0, 30).map((row, idx) => (
                      <tr key={idx} className="group hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 text-slate-400 whitespace-nowrap">
                          {format(new Date(row.timestamp), 'HH:mm:ss')}
                        </td>
                        <td className="py-3 font-semibold text-slate-300">
                          {row.analogLevel}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold
                             ${row.noiseLevel === 'Quiet' ? 'bg-emerald-500/10 text-emerald-400' :
                               row.noiseLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-400' :
                               row.noiseLevel === 'Loud' ? 'bg-orange-500/10 text-orange-400' :
                               'bg-red-500/10 text-red-500'
                             }
                          `}>
                            {row.noiseLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Map Heatmap */}
        <div className="lg:col-span-2 h-[800px] lg:h-auto bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl shadow-slate-900/50 relative">
          <div className="absolute top-6 left-6 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-2 border border-slate-700 rounded-xl shadow-lg">
            <h3 className="font-bold text-slate-200">Noise Heatmap</h3>
            <p className="text-xs text-slate-400">Live sensor pulse locations</p>
          </div>
          <MapComponent data={data} />
        </div>
      </div>
      
      {/* Basic Global Styles for map popup tweaking and scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { background: #0f172a !important; }
        .leaflet-popup-content-wrapper { background: #1e293b; color: #f1f5f9; border-radius: 12px; border: 1px solid #334155; }
        .leaflet-popup-tip { background: #1e293b; border: 1px solid #334155; }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}
