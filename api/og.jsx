import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #FAF8F5 0%, #F3EFE8 55%, #E8E4DC 100%)',
          fontFamily: 'Georgia, serif',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(201, 169, 110, 0.18)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(31, 78, 70, 0.08)',
            transform: 'translate(-30%, 30%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 56,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: '#1F4E46',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              color: '#FAF8F5',
              fontWeight: 700,
              fontFamily: 'sans-serif',
            }}
          >
            Q
          </div>
          <span
            style={{
              fontSize: 28,
              color: '#1F4E46',
              fontWeight: 700,
              letterSpacing: 6,
              fontFamily: 'sans-serif',
            }}
          >
            QYRAZE
          </span>
        </div>

        <div
          style={{
            fontSize: 52,
            color: '#1B1B1B',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 900,
            position: 'relative',
          }}
        >
          Your personal partner
        </div>

        <div
          style={{
            fontSize: 40,
            color: '#1F4E46',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 48,
            maxWidth: 900,
            position: 'relative',
          }}
        >
          for business growth
        </div>

        <div
          style={{
            width: 72,
            height: 3,
            background: '#C9A96E',
            borderRadius: 2,
            position: 'relative',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
