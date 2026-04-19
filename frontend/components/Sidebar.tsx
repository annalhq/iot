'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BellRing, LayoutDashboard, Map } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alarms', label: 'Alarm Alerts', icon: BellRing },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ marginBottom: '32px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              NoiseTrack
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>IoT Monitor</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0 10px',
            marginBottom: '8px',
          }}
        >
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} style={{ color: active ? '#8b5cf6' : 'inherit', flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          ESP8266 · Live telemetry
          <br />
          1s polling interval
        </p>
      </div>
    </aside>
  );
}
