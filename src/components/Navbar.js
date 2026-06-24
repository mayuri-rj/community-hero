import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

function Navbar({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav style={{
      backgroundColor: '#2563eb',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
        🦸 Community Hero
      </h1>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
        <Link to="/report" style={{ color: 'white', textDecoration: 'none' }}>Report Issue</Link>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/map" style={{ color: 'white', textDecoration: 'none' }}>Map</Link>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="profile"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid white'
                }}
              />
            )}
            <span style={{ color: 'white', fontSize: '0.9rem' }}>
              {user.displayName}
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'white',
                color: '#2563eb',
                border: 'none',
                padding: '0.3rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;