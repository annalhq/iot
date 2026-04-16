'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, BellRing, CheckCircle, ShieldAlert, Volume2, XCircle } from 'lucide-react';

// ─── Threshold configuration ───────────────────────────────────────────────
// Analog level is a raw ADC value from ESP8266 (0–1023).
// Rough dB mapping is estimated for a typical electret mic +  module.
const THRESHOLDS = [
  {
    level: 'Quiet',
    analogMin: 0,
    analogMax: 10,
    dbMin: 0,
    dbMax: 40,
    description: 'Ambient / silent environment',
    examples: 'Library, empty room, whisper',
    severity: 'safe',
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.18)',
  },
  {
    level: 'Moderate',
    analogMin: 11,
    analogMax: 25,
    dbMin: 40,
    dbMax: 60,
    description: 'Normal conversation level',
    examples: 'Office, normal speech, background music',
    severity: 'info',
    icon: Volume2,
    color: '#eab308',
    bg: 'rgba(234,179,8,0.06)',
    border: 'rgba(234,179,8,0.18)',
  },
  {
    level: 'Loud',
    analogMin: 26,
    analogMax: 50,
    dbMin: 60,
    dbMax: 75,
    description: 'Elevated noise — monitor closely',
    examples: 'Busy street, power tools at distance',
    severity: 'warning',
    icon: AlertTriangle,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.18)',
  },
  {
    level: 'Very Loud',
    analogMin: 51,
    analogMax: 80,
    dbMin: 75,
    dbMax: 90,
    description: 'Harmful with prolonged exposure',
    examples: 'Lawnmower, heavy traffic, jackhammer',
    severity: 'danger',
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.18)',
  },
  {
    level: 'Hazardous',
    analogMin: 81,
    analogMax: 1023,
    dbMin: 90,
    dbMax: 140,
    description: 'Immediate risk of hearing damage',
    examples: 'Jet engine, gunshot, concert near speaker',
    severity: 'critical',
    icon: ShieldAlert,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.28)',
  },
] as const;

type TelemetryData = {
  analogLevel: number;
  noiseLevel: string;
  timestamp: string;
  lat: number;
  lng: number;
};

export default function AlarmsPage() {
  const [data, setData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/telemetry');
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch telemetry', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Only show alarm events (Loud and above)
  const alarmData = data.filter((d) =>
    ['Loud', 'Very Loud', 'Hazardous'].includes(d.noiseLevel)
  );

  const filteredAlarms =
    filter === 'All' ? alarmData : alarmData.filter((d) => d.noiseLevel === filter);

  const countByLevel = (level: string) =>
    alarmData.filter((d) => d.noiseLevel === level).length;

  const getLevelCfg = (level: string) =>
    THRESHOLDS.find((t) => t.level === level) ?? THRESHOLDS[0];

  return (
    <div style={{ minHeight: '100vh', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Alarm Alerts
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Threshold configuration and alarm event log
        </p>
      </div>

      {/* ── Threshold Reference Table ───────────────────────────── */}
      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Decibel Threshold Reference
        </p>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Severity', 'Level', 'dB Range', 'Analog Range', 'Description', 'Examples', 'Alarm?'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {THRESHOLDS.map((t, idx) => {
                const Icon = t.icon;
                const isAlarm = ['Loud', 'Very Loud', 'Hazardous'].includes(t.level);
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: idx < THRESHOLDS.length - 1 ? '1px solid var(--border)' : 'none',
                      background: 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Severity */}
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: t.bg,
                          border: `1px solid ${t.border}`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: t.color,
                        }}
                      >
                        <Icon size={12} />
                        {t.severity.toUpperCase()}
                      </div>
                    </td>
                    {/* Level */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: t.color }}>{t.level}</td>
                    {/* dB Range */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.dbMin}–{t.dbMax} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>dB</span>
                    </td>
                    {/* Analog Range */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.analogMin}–{t.analogMax === 1023 ? '1023+' : t.analogMax}
                    </td>
                    {/* Description */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', maxWidth: 220 }}>{t.description}</td>
                    {/* Examples */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 11, maxWidth: 200 }}>{t.examples}</td>
                    {/* Alarm? */}
                    <td style={{ padding: '14px 16px' }}>
                      {isAlarm ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 5,
                            padding: '3px 9px',
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#ef4444',
                          }}
                        >
                          <BellRing size={10} />
                          YES
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Alarm Summary Chips ─────────────────────────────────── */}
      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Alarm Summary
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['All', 'Loud', 'Very Loud', 'Hazardous'].map((lvl) => {
            const cfg = lvl !== 'All' ? getLevelCfg(lvl) : null;
            const count = lvl === 'All' ? alarmData.length : countByLevel(lvl);
            const active = filter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 9,
                  border: active
                    ? `1px solid ${cfg ? cfg.border : 'rgba(59,130,246,0.3)'}`
                    : '1px solid var(--border)',
                  background: active
                    ? cfg
                      ? cfg.bg
                      : 'rgba(59,130,246,0.08)'
                    : 'var(--bg-surface)',
                  color: active ? (cfg ? cfg.color : '#3b82f6') : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {lvl === 'All' ? <BellRing size={13} /> : null}
                {lvl}
                <span
                  style={{
                    background: active
                      ? cfg
                        ? cfg.border
                        : 'rgba(59,130,246,0.2)'
                      : 'var(--bg-elevated)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? (cfg ? cfg.color : '#3b82f6') : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Alarm Event Log ─────────────────────────────────────── */}
      <section style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Alarm Event Log{' '}
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
            ({filteredAlarms.length} events)
          </span>
        </p>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading data…
            </div>
          ) : filteredAlarms.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>All Clear</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                No{filter !== 'All' ? ` "${filter}"` : ''} alarm events recorded
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Timestamp', 'Analog Level', 'Status', 'Location', 'dB (est.)'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAlarms.slice(0, 60).map((row, idx) => {
                  const cfg = getLevelCfg(row.noiseLevel);
                  const dbEst = THRESHOLDS.find((t) => t.level === row.noiseLevel);
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
                      <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {format(new Date(row.timestamp), 'MMM d, HH:mm:ss')}
                      </td>
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.analogLevel}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: 5,
                            padding: '3px 9px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: cfg.color,
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                          {row.noiseLevel}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
                        {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                      </td>
                      <td style={{ padding: '11px 16px', color: cfg.color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {dbEst ? `${dbEst.dbMin}–${dbEst.dbMax}` : '—'} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>dB</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
