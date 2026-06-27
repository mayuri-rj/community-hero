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
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated blobs */}
      <div style={{
        position: 'absolute', borderRadius: '50%', opacity: 0.12,
        background: 'white', width: '400px', height: '400px',
        top: '-120px', right: '-100px',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%', opacity: 0.08,
        background: 'white', width: '250px', height: '250px',
        bottom: '-80px', left: '-80px',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        .login-card {
          animation: fadeInUp 0.6s ease;
        }
        .google-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .google-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(29, 78, 216, 0.4) !important;
        }
        .google-btn:active {
          transform: translateY(0px);
        }
        .feature-chip {
          transition: transform 0.2s ease;
        }
        .feature-chip:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div className="login-card" style={{
        backgroundColor: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        maxWidth: '400px',
        width: '100%',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Hero Icon */}
        <div style={{
          fontSize: '4rem',
          textAlign: 'center',
          marginBottom: '0.5rem',
          animation: 'heroFloat 3s ease-in-out infinite',
          display: 'block'
        }}>
          🦸
        </div>

        <h1 style={{
          color: '#1e3a8a',
          textAlign: 'center',
          fontSize: '1.8rem',
          fontWeight: '800',
          margin: '0 0 0.3rem',
          letterSpacing: '-0.5px'
        }}>
          Community Hero
        </h1>
        <p style={{
          color: '#9ca3af',
          textAlign: 'center',
          fontSize: '0.9rem',
          margin: '0 0 1.5rem'
        }}>
          Making cities better, one report at a time
        </p>

        {/* Feature chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '1.5rem'
        }}>
          {[
            { icon: '📸', label: 'Report issues' },
            { icon: '🤖', label: 'AI detection' },
            { icon: '🗺️', label: 'Live map' },
            { icon: '🏆', label: 'Earn badges' }
          ].map((f, i) => (
            <div key={i} className="feature-chip" style={{
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{f.icon}</span> {f.label}
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 1.5rem' }} />

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="google-btn"
          style={{
            width: '100%',
            padding: '0.9rem',
            borderRadius: '50px',
            border: 'none',
            background: loading
              ? '#93c5fd'
              : 'linear-gradient(90deg, #1e3a8a, #1d4ed8, #0891b2, #1d4ed8, #1e3a8a)',
            backgroundSize: '200% auto',
            animation: loading ? 'none' : 'shimmer 3s linear infinite',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(29, 78, 216, 0.3)'
          }}
        >
          {loading ? '⏳ Signing in...' : (
            <>
              <svg width="20" height="20" viewBox="0 0 18 18">
                <path fill="white" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"/>
                <path fill="white" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                <path fill="white" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"/>
                <path fill="white" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          {[
            { num: '500+', label: 'Issues reported' },
            { num: '120+', label: 'Resolved' },
            { num: '50+', label: 'Heroes' }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1d4ed8' }}>{s.num}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <p style={{
          color: '#9ca3af',
          fontSize: '0.75rem',
          textAlign: 'center',
          marginTop: '1rem'
        }}>
          By signing in, you agree to help make your community better 🌟
        </p>
      </div>
    </div>
  );
}

export default Login;