import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div style={{
        backgroundColor: '#eff6ff',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e40af', marginBottom: '1rem' }}>
          🦸 Be a Community Hero
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '2rem' }}>
          Report local issues in your community and help make your city better
        </p>
        <Link to="/report">
          <button style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.8rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}>
            Report an Issue 🚨
          </button>
        </Link>
      </div>

      {/* Stats Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        padding: '3rem 2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          minWidth: '150px'
        }}>
          <h2 style={{ color: '#2563eb', fontSize: '2rem' }}>0</h2>
          <p style={{ color: '#6b7280' }}>Issues Reported</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          minWidth: '150px'
        }}>
          <h2 style={{ color: '#16a34a', fontSize: '2rem' }}>0</h2>
          <p style={{ color: '#6b7280' }}>Issues Resolved</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          minWidth: '150px'
        }}>
          <h2 style={{ color: '#d97706', fontSize: '2rem' }}>0</h2>
          <p style={{ color: '#6b7280' }}>In Progress</p>
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '2rem' }}>How it Works</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>📸</div>
            <h3>Report</h3>
            <p style={{ color: '#6b7280' }}>Take a photo and report the issue in your area</p>
          </div>
          <div style={{ maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🤖</div>
            <h3>AI Analyzes</h3>
            <p style={{ color: '#6b7280' }}>Gemini AI automatically categorizes your issue</p>
          </div>
          <div style={{ maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>👥</div>
            <h3>Community Votes</h3>
            <p style={{ color: '#6b7280' }}>Community upvotes to prioritize urgent issues</p>
          </div>
          <div style={{ maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <h3>Get Resolved</h3>
            <p style={{ color: '#6b7280' }}>Track progress until the issue is resolved</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;