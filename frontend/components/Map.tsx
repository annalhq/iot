'use client';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

type MarkerData = {
  analogLevel: number;
  noiseLevel: string;
  timestamp: string;
  lat: number;
  lng: number;
};

const LEVEL_PALETTE: Record<string, { fill: string; glow: string }> = {
  quiet:     { fill: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
  moderate:  { fill: '#eab308', glow: 'rgba(234,179,8,0.3)' },
  loud:      { fill: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  'very loud': { fill: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  hazardous: { fill: '#f87171', glow: 'rgba(248,113,113,0.5)' },
};

const getPalette = (level: string) =>
  LEVEL_PALETTE[level.toLowerCase()] ?? { fill: '#3b82f6', glow: 'rgba(59,130,246,0.3)' };

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour12: false });
}

// Jitter is stable per-index so it doesn't re-randomize on every render
const JITTER_CACHE: Record<number, [number, number]> = {};
function getJitter(idx: number): [number, number] {
  if (!JITTER_CACHE[idx]) {
    JITTER_CACHE[idx] = [
      (Math.random() - 0.5) * 0.0012,
      (Math.random() - 0.5) * 0.0012,
    ];
  }
  return JITTER_CACHE[idx];
}

const LEGEND_ITEMS = [
  { label: 'Quiet',      color: '#22c55e' },
  { label: 'Moderate',   color: '#eab308' },
  { label: 'Loud',       color: '#f97316' },
  { label: 'Very Loud',  color: '#ef4444' },
  { label: 'Hazardous',  color: '#f87171' },
];

export default function Map({ data }: { data: MarkerData[] }) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  const centerLat = data.length > 0 ? data[0].lat : 28.6139;
  const centerLng = data.length > 0 ? data[0].lng : 77.209;

  // Show up to 15 most-recent markers
  const markers = data.slice(0, 15);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '560px' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        zoomControl={false}
        style={{ width: '100%', height: '100%', minHeight: '560px' }}
        className="z-0"
      >
        {/* Professional dark vector tile */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />

        {markers.map((item, idx) => {
          const palette = getPalette(item.noiseLevel);
          const [jLat, jLng] = getJitter(idx);
          const opacity = Math.max(0.25, 1 - idx * 0.06);
          // Radius scales with analog level, but capped
          const radius = Math.min(30, Math.max(8, item.analogLevel * 1.5));

          return (
            <CircleMarker
              key={idx}
              center={[item.lat + jLat, item.lng + jLng]}
              radius={radius}
              pathOptions={{
                fillColor: palette.fill,
                fillOpacity: opacity * 0.55,
                color: palette.fill,
                weight: 1.5,
                opacity: opacity * 0.85,
              }}
            >
              <Popup>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    padding: '12px 14px',
                    minWidth: 160,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 10,
                      paddingBottom: 10,
                      borderBottom: '1px solid #1e2330',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: palette.fill,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${palette.glow}`,
                      }}
                    />
                    <span style={{ fontWeight: 700, color: palette.fill, fontSize: 13 }}>
                      {item.noiseLevel}
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {[
                        ['Amplitude', item.analogLevel],
                        ['Time', formatTime(item.timestamp)],
                        ['Lat', item.lat.toFixed(5)],
                        ['Lng', item.lng.toFixed(5)],
                      ].map(([k, v]) => (
                        <tr key={String(k)}>
                          <td style={{ color: '#7a8494', paddingBottom: 4, paddingRight: 12 }}>{k}</td>
                          <td style={{ color: '#e8ecf0', fontWeight: 500 }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          zIndex: 1000,
          background: 'rgba(17,19,24,0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #1e2330',
          borderRadius: 8,
          padding: '10px 14px',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: '#4a5268',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Noise Level
        </p>
        {LEGEND_ITEMS.map(({ label, color }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
                boxShadow: `0 0 5px ${color}55`,
              }}
            />
            <span style={{ fontSize: 11, color: '#7a8494' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
