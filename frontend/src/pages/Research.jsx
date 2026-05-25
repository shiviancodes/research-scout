import { useEffect } from 'react';
import IdeasTab from './IdeasTab.jsx';

export default function Research() {
  useEffect(() => {
    document.title = 'Research — Research Scout';
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <header>
        <h1 style={{ fontFamily: 'IBM Plex Sans', fontSize: 32, fontWeight: 300, color: '#f0f0f0', margin: 0, letterSpacing: '-0.02em' }}>
          Research
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#6b6b6b', marginTop: 8, marginBottom: 0 }}>
          Registered findings and ideas under active investigation.
        </p>
      </header>
      <IdeasTab />
    </div>
  );
}
