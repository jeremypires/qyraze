import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: 'Georgia, serif',
        padding: '60px 80px',
      }}
    >
      {/* Logo + nom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
        <div style={{
          width: 52, height: 52,
          background: '#c9a84c',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#0a0a0a', fontWeight: 700,
        }}>Q</div>
        <span style={{ fontSize: 22, color: '#f5f0eb', fontWeight: 600, letterSpacing: 4, fontFamily: 'sans-serif' }}>
          QYRAZE
        </span>
      </div>

      {/* Titre principal */}
      <div style={{
        fontSize: 58,
        color: '#f5f0eb',
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1.2,
        marginBottom: 24,
        maxWidth: 900,
      }}>
        Retraite Entrepreneurs
      </div>

      {/* Sous-titre or */}
      <div style={{
        fontSize: 22,
        color: '#c9a84c',
        marginBottom: 56,
        letterSpacing: 1,
        fontFamily: 'sans-serif',
      }}>
        7 jours d'immersion · 10 places sélectives
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
        {[['10', 'entrepreneurs'], ['7', 'jours'], ['2', 'experts']].map(([num, label], i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 42, color: '#f5f0eb', fontWeight: 700, lineHeight: 1 }}>{num}</span>
            <span style={{ fontSize: 14, color: '#888', marginTop: 6, fontFamily: 'sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Séparateur déco */}
      <div style={{
        width: 60, height: 1,
        background: '#c9a84c',
        marginTop: 48,
        opacity: 0.6,
      }} />
    </div>,
    { width: 1200, height: 630 }
  );
}
