import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import LogoMark from './LogoMark.jsx';

export default function Navbar() {
  const [reachable, setReachable] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch('/api/outputs');
        if (cancelled) return;
        if (!res.ok) { setReachable(false); return; }
        const body = await res.json();
        if (cancelled) return;
        setReachable(true);
        setTotalCount(Array.isArray(body) ? body.length : null);
      } catch {
        if (!cancelled) setReachable(false);
      }
    }

    ping();
    const t = setInterval(ping, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const dotColor =
    reachable === null ? '#6b6b6b' : reachable ? '#4ade80' : '#f87171';
  const dotTitle =
    reachable === null
      ? 'Checking…'
      : reachable
      ? 'API connected'
      : 'API unreachable';

  return (
    <nav style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1e1e1e' }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'IBM Plex Mono',
            fontSize: 13,
            letterSpacing: '0.15em',
            fontWeight: 500,
            color: '#f0f0f0'
          }}
        >
          <LogoMark size={20} color="#f0f0f0" />
          RESEARCH SCOUT
        </div>
        <div className="flex items-center gap-6">
          <NavItem to="/" label="Home" />
          <NavItem to="/research" label="Research" />
          <NavItem to="/history" label="History" badge={totalCount} />
          <NavItem to="/config" label="Config" />
        </div>
        <div className="ml-auto">
          <span
            title={dotTitle}
            className={reachable === true ? 'dot-pulse' : ''}
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: dotColor,
              cursor: 'help'
            }}
          />
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, label, badge }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={{ textDecoration: 'none' }}
    >
      {({ isActive }) => (
        <TabLabel label={label} isActive={isActive} badge={badge} />
      )}
    </NavLink>
  );
}

function TabLabel({ label, isActive, badge }) {
  const [hovered, setHovered] = useState(false);
  const color = isActive ? '#f0f0f0' : hovered ? '#a0a0a0' : '#6b6b6b';
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        fontFamily: 'IBM Plex Mono',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
        borderBottom: isActive ? '2px solid #f0f0f0' : '2px solid transparent',
        marginBottom: '-1px',
        transition: 'color 150ms ease, border-color 150ms ease'
      }}
    >
      {label}
      {badge != null && (
        <span
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.07)',
            color: isActive ? '#f0f0f0' : '#6b6b6b',
            lineHeight: 1.5,
            letterSpacing: 0
          }}
        >
          {badge}
        </span>
      )}
    </span>
  );
}
