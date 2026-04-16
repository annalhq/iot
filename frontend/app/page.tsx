'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, BellRing, MapPin, TrendingUp, Volume2, Wifi } from 'lucide-react';
import { format } from 'date-fns';

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-elevated)',
        borderRadius: 12,
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '2px solid var(--border)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 10px',
          }}
        />
        Loading map…
      </div>
    </div>
  ),
});

type TelemetryData = {
  analogLevel: number;
  noiseLevel: string;
  timestamp: string;
  lat: number;
  lng: number;
};

const LEVEL_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; dot: string }
> = {
  Quiet:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  dot: '#22c55e' },
  Moderate:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)',  dot: '#eab308' },
  Loud:       { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', dot: '#f97316' },
  'Very Loud': { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',  dot: '#ef4444' },
  Hazardous:  { color: '#f87171', bg: 'rgba(248,113,113,0.15)',border: 'rgba(248,113,113,0.3)',dot: '#f87171' },
};

const getLevelCfg = (level: string) =>
  LEVEL_CONFIG[level] ?? { color: '#7a8494', bg: 'rgba(122,132,148,0.08)', border: 'rgba(122,132,148,0.2)', dot: '#7a8494' };

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: `${accent}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={14} color={accent} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/telemetry');
        const json = await res.json();
        setData(json);
        setLoading(false);
        setConnected(true);
      } catch (err) {
        console.error('Failed to fetch telemetry data', err);
        setConnected(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const latest = data.length > 0 ? data[0] : null;
  const isAlarm = latest
    ? ['Loud', 'Very Loud', 'Hazardous'].includes(latest.noiseLevel)
    : false;

  const alarmCount = data.filter((d) =>
    ['Loud', 'Very Loud', 'Hazardous'].includes(d.noiseLevel)
  ).length;

  const avgLevel =
    data.length > 0
      ? Math.round(data.slice(0, 20).reduce((s, d) => s + d.analogLevel, 0) / Math.min(data.length, 20))
      : 0;

  const levelCfg = latest ? getLevelCfg(latest.noiseLevel) : getLevelCfg('');

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            Live Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Real-time noise telemetry · ESP8266
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAlarm && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#ef4444',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <BellRing size={13} />
              HIGH NOISE ALARM
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              color: connected ? '#22c55e' : '#ef4444',
            }}
          >
            <Wifi size={13} />
            {connected ? 'Live' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard
          label="Current Level"
          value={loading ? '—' : (latest?.analogLevel ?? '—')}
          sub={latest?.noiseLevel ?? 'No data'}
          icon={Volume2}
          accent="#3b82f6"
        />
        <StatCard
          label="Avg (last 20)"
          value={loading ? '—' : avgLevel}
          sub="amplitude reading"
          icon={TrendingUp}
          accent="#8b5cf6"
        />
        <StatCard
          label="Alarm Events"
          value={loading ? '—' : alarmCount}
          sub="of last 100 readings"
          icon={BellRing}
          accent="#ef4444"
        />
      </div>

      {/* Main grid: status + table | map */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', flex: 1 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Current status card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '16px',
              }}
            >
              Current Reading
            </p>

            {loading ? (
              <div style={{ height: 80, background: 'var(--bg-elevated)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : latest ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: 52,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                    }}
                  >
                    {latest.analogLevel}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 4 }}>amplitude</span>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: levelCfg.bg,
                    border: `1px solid ${levelCfg.border}`,
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: levelCfg.color,
                    marginBottom: '14px',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: levelCfg.dot,
                      flexShrink: 0,
                    }}
                  />
                  {latest.noiseLevel.toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 11, color: 'var(--text-muted)' }}>
                  <MapPin size={11} />
                  {latest.lat.toFixed(4)}, {latest.lng.toFixed(4)}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting data…</p>
            )}
          </div>

          {/* Recent telemetry table */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '14px',
                flexShrink: 0,
              }}
            >
              Recent Readings
            </p>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {data.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 32, fontStyle: 'italic' }}>
                  No records yet
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Time', 'Level', 'Status'].map((h) => (
                        <th
                          key={h}
                          style={{
                            position: 'sticky',
                            top: 0,
                            background: 'var(--bg-surface)',
                            textAlign: 'left',
                            padding: '0 0 10px 0',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            fontSize: 10,
                            borderBottom: '1px solid var(--border)',
                            zIndex: 1,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 40).map((row, idx) => {
                      const cfg = getLevelCfg(row.noiseLevel);
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '9px 0', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                            {format(new Date(row.timestamp), 'HH:mm:ss')}
                          </td>
                          <td style={{ padding: '9px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {row.analogLevel}
                          </td>
                          <td style={{ padding: '9px 0' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                borderRadius: 4,
                                padding: '2px 7px',
                                fontSize: 10,
                                fontWeight: 600,
                                color: cfg.color,
                              }}
                            >
                              <span
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  background: cfg.dot,
                                  flexShrink: 0,
                                }}
                              />
                              {row.noiseLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            minHeight: '560px',
          }}
        >
          {/* Map overlay label */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1000,
              background: 'rgba(17,19,24,0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 14px',
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Noise Heatmap</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Live sensor pulse locations</p>
          </div>
          <MapComponent data={data} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
