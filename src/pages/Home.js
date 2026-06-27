import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

function Home() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'issues'));
      const issues = snapshot.docs.map(doc => doc.data());
      setStats({
        total: issues.length,
        resolved: issues.filter(i => i.status === 'Resolved').length,
        inProgress: issues.filter(i => i.status === 'In Progress').length
      });
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .hero-emoji { animation: float 3s ease-in-out infinite; }
        .fade-up { animation: fadeInUp 0.6s ease; }
        .stat-card { transition: transform 0.2s ease; }
        .stat-card:hover { transform: translateY(-4px); }
        .step-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .step-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .btn-primary { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .btn-outline { transition: all 0.2s ease; }
        .btn-outline:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .shimmer-btn {
          background: linear-gradient(90deg, white, #e0f2fe, white);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
          transition: transform 0.2s;
        }
        .shimmer-btn:hover { transform: translateY(-2px); }
      `}</style>

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%)',
        padding: '5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          opacity: 0.07, width: '400px', height: '400px', top: '-120px', right: '-80px'
        }} />
        <div style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          opacity: 0.05, width: '250px', height: '250px', bottom: '-60px', left: '-60px'
        }} />

        <div className="fade-up" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-emoji" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🦸</div>
          <h1 style={{
            fontSize: '2.8rem', fontWeight: '800', color: 'white',
            margin: '0 0 1rem', letterSpacing: '-1px'
          }}>
            Be a Community Hero
          </h1>
          <p style={{
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)',
            margin: '0 auto 2.5rem', maxWidth: '560px', lineHeight: '1.6'
          }}>
            Report local issues with AI-powered tracking and help make your city better
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/report">
              <button className="btn-primary" style={{
                backgroundColor: 'white', color: '#1e3a8a',
                padding: '0.9rem 2.5rem', border: 'none',
                borderRadius: '50px', fontSize: '1rem',
                fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                🚨 Report an Issue
              </button>
            </Link>
            <Link to="/dashboard">
              <button className="btn-outline" style={{
                backgroundColor: 'transparent', color: 'white',
                padding: '0.9rem 2.5rem',
                border: '1.5px solid rgba(255,255,255,0.6)',
                borderRadius: '50px', fontSize: '1rem',
                fontWeight: 'bold', cursor: 'pointer'
              }}>
                📊 View Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: '1.5rem', padding: '2.5rem 2rem',
        backgroundColor: 'white', flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {[
          { value: stats.total, label: 'Issues Reported', color: '#1d4ed8', icon: '📋' },
          { value: stats.resolved, label: 'Issues Resolved', color: '#16a34a', icon: '✅' },
          { value: stats.inProgress, label: 'In Progress', color: '#d97706', icon: '🔧' }
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{
            textAlign: 'center', padding: '1.5rem 2.5rem',
            borderRadius: '16px', border: '1px solid #e2e8f0', minWidth: '160px'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{stat.icon}</div>
            <h2 style={{ color: stat.color, fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
              {stat.value}
            </h2>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.85rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* How it Works */}
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <h2 style={{
          color: '#1e3a8a', fontSize: '2rem', fontWeight: '800',
          margin: '0 0 0.5rem', letterSpacing: '-0.5px'
        }}>
          How it Works
        </h2>
        <p style={{ color: '#9ca3af', margin: '0 0 3rem', fontSize: '0.95rem' }}>
          Four simple steps to make your community better
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1.5rem', maxWidth: '800px', margin: '0 auto'
        }}>
          {[
            { icon: '📸', title: 'Report', desc: 'Take a photo and report the issue in your area' },
            { icon: '🤖', title: 'AI Analyzes', desc: 'Gemini AI automatically categorizes your issue' },
            { icon: '👥', title: 'Community Votes', desc: 'Upvotes help prioritize the most urgent issues' },
            { icon: '✅', title: 'Get Resolved', desc: 'Track progress until the issue is fixed' }
          ].map((step, i) => (
            <div key={i} className="step-card" style={{
              backgroundColor: 'white', padding: '2rem 1.5rem',
              borderRadius: '16px', border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{step.icon}</div>
              <h3 style={{ color: '#1e3a8a', margin: '0 0 0.5rem', fontSize: '1rem' }}>{step.title}</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)',
        padding: '4rem 2rem', textAlign: 'center'
      }}>
        <h2 style={{
          color: 'white', fontSize: '2rem', fontWeight: '800',
          margin: '0 0 0.8rem', letterSpacing: '-0.5px'
        }}>
          Ready to make a difference? 🌟
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
          Join citizens making their communities better
        </p>
        <Link to="/report">
          <button className="shimmer-btn" style={{
            color: '#1e3a8a', padding: '0.9rem 2.5rem',
            border: 'none', borderRadius: '50px',
            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            🚨 Report Your First Issue
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Home;