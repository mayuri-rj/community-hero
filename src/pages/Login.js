import React, { useState } from 'react';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again!');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 70%, #0891b2 100%)',
      backgroundSize: '200% 200%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(3deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          25% { transform: translateY(-6px) rotate(3deg) scale(1.02); }
          75% { transform: translateY(-10px) rotate(-2deg) scale(1.04); }
          50% { transform: translateY(-12px) rotate(5deg) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes ripple {
          0% { box-shadow: 0 0 0 0 rgba(29, 78, 216, 0.3); }
          100% { box-shadow: 0 0 0 20px rgba(29, 78, 216, 0); }
        }
        @keyframes slideInChip {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes counterUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .login-bg {
          animation: gradientShift 10s ease infinite;
        }
        .login-card {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-icon {
          animation: heroFloat 4s ease-in-out infinite;
          display: inline-block;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
        }

        .google-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .google-btn::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 0; height: 0;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.5s ease, height 0.5s ease;
        }
        .google-btn:hover::before {
          width: 400px; height: 400px;
        }
        .google-btn:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 12px 32px rgba(29, 78, 216, 0.45) !important;
        }
        .google-btn:active {
          transform: translateY(0px) scale(0.98);
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3) !important;
        }

        .feature-chip {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .feature-chip::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(29, 78, 216, 0.06));
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .feature-chip:hover::after { opacity: 1; }
        .feature-chip:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(29, 78, 216, 0.12);
          border-color: #bfdbfe !important;
        }
        .chip-icon {
          transition: transform 0.3s ease;
          display: inline-block;
        }
        .feature-chip:hover .chip-icon {
          transform: scale(1.2) rotate(-8deg);
        }

        .stat-item {
          transition: transform 0.2s ease;
          cursor: default;
        }
        .stat-item:hover { transform: translateY(-2px); }
        .stat-num {
          background: linear-gradient(135deg, #1e3a8a, #0891b2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .partner-link {
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .partner-link:hover {
          color: #1d4ed8 !important;
          letter-spacing: 0.3px;
        }

        .divider-line {
          position: relative;
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 0;
        }

        @media (max-width: 480px) {
          .login-card-inner { padding: 2rem 1.5rem !important; }
          .hero-title { font-size: 1.6rem !important; }
        }
      `}</style>

      {/* ───── Decorative Background ───── */}

      {/* Floating orbs */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)',
        width: '500px', height: '500px',
        top: '-150px', right: '-120px',
        animation: 'float 7s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)',
        width: '300px', height: '300px',
        bottom: '-100px', left: '-80px',
        animation: 'floatReverse 9s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,145,178,0.2), transparent 70%)',
        width: '200px', height: '200px',
        top: '60%', left: '10%',
        animation: 'float 5s ease-in-out infinite 1s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,58,138,0.15), transparent 70%)',
        width: '160px', height: '160px',
        top: '15%', left: '60%',
        animation: 'floatReverse 6s ease-in-out infinite 0.5s',
        pointerEvents: 'none',
      }} />

      {/* Dot grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      {/* ───── Login Card ───── */}
      <div className="login-card" style={{
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Top gradient accent */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8, #0891b2, #06b6d4)',
        }} />

        <div className="login-card-inner" style={{ padding: '2.5rem 2.2rem' }}>

          {/* Hero Icon */}
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span className="hero-icon" style={{ fontSize: '4.5rem' }}>🦸</span>
          </div>

          <h1 className="hero-title" style={{
            color: '#0f172a',
            textAlign: 'center',
            fontSize: '1.9rem',
            fontWeight: '800',
            margin: '0 0 0.3rem',
            letterSpacing: '-0.8px',
          }}>
            Community Hero
          </h1>
          <p style={{
            color: '#94a3b8',
            textAlign: 'center',
            fontSize: '0.9rem',
            margin: '0 0 1.8rem',
            lineHeight: 1.5,
          }}>
            Making cities better, one report at a time
          </p>

          {/* Feature chips */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '1.8rem',
          }}>
            {[
              { icon: '📸', label: 'Report issues' },
              { icon: '🤖', label: 'AI detection' },
              { icon: '🗺️', label: 'Live map' },
              { icon: '🏆', label: 'Earn badges' },
            ].map((f, i) => (
              <div key={i} className="feature-chip" style={{
                backgroundColor: '#f0f7ff',
                color: '#1e40af',
                borderRadius: '14px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #e0ecff',
                animation: `slideInChip 0.5s ease both`,
                animationDelay: `${0.3 + i * 0.08}s`,
              }}>
                <span className="chip-icon" style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>

          <div className="divider-line" style={{ marginBottom: '1.8rem' }} />

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-btn"
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '50px',
              border: 'none',
              background: loading
                ? '#93c5fd'
                : 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #0891b2 100%)',
              backgroundSize: '200% auto',
              animation: loading ? 'none' : 'shimmer 4s linear infinite',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 6px 20px rgba(29, 78, 216, 0.35)',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.2px',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block', width: '20px', height: '20px',
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                  <path fill="#fff" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" />
                  <path fill="#fff" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z" />
                  <path fill="#fff" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" />
                  <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {/* Partner link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
              University or Industry partner?{' '}
              <a href="/partner-login" className="partner-link" style={{
                color: '#2563eb', fontWeight: '700',
                textDecoration: 'none',
              }}>
                Partner Portal →
              </a>
            </p>
          </div>

          <div className="divider-line" style={{ margin: '1.5rem 0' }} />

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
          }}>
            {[
              { num: '500+', label: 'Reported' },
              { num: '120+', label: 'Resolved' },
              { num: '50+', label: 'Heroes' },
            ].map((s, i) => (
              <div key={i} className="stat-item" style={{
                textAlign: 'center',
                animation: `counterUp 0.5s ease both`,
                animationDelay: `${0.6 + i * 0.1}s`,
              }}>
                <div className="stat-num" style={{
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {s.num}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Footer text */}
          <p style={{
            color: '#cbd5e1',
            fontSize: '0.72rem',
            textAlign: 'center',
            marginTop: '1.2rem',
            marginBottom: 0,
          }}>
            By signing in, you agree to help make your community better 🌟
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;