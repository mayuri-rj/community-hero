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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🦸</div>
        <h1 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Community Hero</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Sign in to report issues and help your community
        </p>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#93c5fd' : '#2563eb',
            color: 'white',
            padding: '0.8rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? 'Signing in...' : '🔐 Sign in with Google'}
        </button>
      </div>
    </div>
  );
}

export default Login;