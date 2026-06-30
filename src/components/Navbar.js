import React from 'react';
import Notifications from './Notifications';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

function Navbar({ user, userStats }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  const location = useLocation();

  const navLinkStyle = (path) => ({
    color: location.pathname === path ? '#93c5fd' : 'white',
    textDecoration: 'none',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
    borderBottom: location.pathname === path ? '2px solid #93c5fd' : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'all 0.2s ease'
  });

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      boxShadow: '0 2px 12px rgba(37, 99, 235, 0.3)'
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
          🦸 Community Hero
        </h1>
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={navLinkStyle('/')}>Home</Link>
        <Link to="/report" style={navLinkStyle('/report')}>Report Issue</Link>
        <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Dashboard</Link>
        <Link to="/map" style={navLinkStyle('/map')}>Map</Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Notifications user={user} />
            {userStats && (
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>
                ⭐ {userStats.points || 0} pts
              </span>
            )}

            
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="profile"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              />
            )}
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>
              {user.displayName?.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.3rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                backdropFilter: 'blur(4px)'
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