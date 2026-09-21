import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { ADMIN_EMAILS } from '../utils/adminConfig';

function Home({ user }) {
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0 });
  const [animatedStats, setAnimatedStats] = useState({ total: 0, resolved: 0, inProgress: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    fetchStats();
    setIsVisible(true);
  }, []);

  // Animated counter effect
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setAnimatedStats({
        total: Math.round(stats.total * ease),
        resolved: Math.round(stats.resolved * ease),
        inProgress: Math.round(stats.inProgress * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const fetchStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'issues'));
      const issues = snapshot.docs.map(doc => doc.data());
      setStats({
        total: issues.length,
        resolved: issues.filter(i => i.status === 'Resolved').length,
        inProgress: issues.filter(i => i.status === 'In Progress').length,
      });
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  return (
    <div style={{ overflowX: 'hidden' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        .hero-emoji {
          animation: float 3s ease-in-out infinite;
          display: inline-block;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
        }
        .fade-up-1 { animation: fadeInUp 0.7s ease both; animation-delay: 0.1s; }
        .fade-up-2 { animation: fadeInUp 0.7s ease both; animation-delay: 0.25s; }
        .fade-up-3 { animation: fadeInUp 0.7s ease both; animation-delay: 0.4s; }
        .fade-up-4 { animation: fadeInUp 0.7s ease both; animation-delay: 0.55s; }
        .fade-scale { animation: fadeInScale 0.6s ease both; }

        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          border-radius: 4px 4px 0 0;
          background: var(--accent);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        .stat-card:hover::before { transform: scaleX(1); }
        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.1);
        }

        .step-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .step-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%; transform: translateX(-50%);
          width: 0; height: 3px;
          background: linear-gradient(90deg, #1d4ed8, #0891b2);
          transition: width 0.3s ease;
          border-radius: 3px;
        }
        .step-card:hover::after { width: 60%; }
        .step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          border-color: transparent;
        }
        .step-icon {
          transition: transform 0.3s ease;
          display: inline-block;
        }
        .step-card:hover .step-icon { transform: scale(1.15) rotate(-5deg); }

        .btn-primary {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(0,0,0,0.06) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-primary:hover::after { opacity: 1; }
        .btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 28px rgba(0,0,0,0.25);
        }
        .btn-primary:active { transform: translateY(0) scale(0.98); }

        .btn-outline {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(4px);
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.15) !important;
          border-color: rgba(255,255,255,0.9) !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .shimmer-btn {
          background: linear-gradient(90deg, white, #e0f2fe, #bae6fd, white);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .shimmer-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 32px rgba(0,0,0,0.25);
        }

        .step-number {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #1d4ed8, #0891b2);
          margin-bottom: 0.75rem;
        }

        .hero-bg {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 70%, #0891b2 100%);
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }

        .cta-bg {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0891b2 100%);
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
        }

        .scroll-indicator {
          animation: float 2s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .hero-title { font-size: 2rem !important; }
          .hero-subtitle { font-size: 1rem !important; }
          .section-title { font-size: 1.6rem !important; }
        }
      `}</style>

      {/* ───── Hero Section ───── */}
      <div className="hero-bg" style={{
        padding: '6rem 2rem 5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)',
          width: '500px', height: '500px', top: '-150px', right: '-100px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)',
          width: '350px', height: '350px', bottom: '-80px', left: '-80px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8,145,178,0.2), transparent 70%)',
          width: '200px', height: '200px', top: '40%', left: '15%',
          pointerEvents: 'none',
        }} />

        {/* Dot grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div className="fade-up-1">
            <span className="hero-emoji" style={{ fontSize: '4.5rem', marginBottom: '1.2rem' }}>🦸</span>
          </div>

          <h1 className="fade-up-2 hero-title" style={{
            fontSize: '3.2rem', fontWeight: '800', color: 'white',
            margin: '0.5rem 0 1rem', letterSpacing: '-1.5px', lineHeight: 1.1,
          }}>
            Be a Community Hero
          </h1>

          <p className="fade-up-3 hero-subtitle" style={{
            fontSize: '1.15rem', color: 'rgba(255,255,255,0.8)',
            margin: '0 auto 2.5rem', maxWidth: '520px', lineHeight: '1.7',
            fontWeight: 400,
          }}>
            Report local issues with <span style={{ color: '#67e8f9', fontWeight: 600 }}>AI-powered</span> tracking
            and help make your city a better place to live.
          </p>

          <div className="fade-up-4" style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {!ADMIN_EMAILS.includes(user?.email) && (
              <Link to="/report" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{
                  backgroundColor: 'white', color: '#1e3a8a',
                  padding: '1rem 2.8rem', border: 'none',
                  borderRadius: '50px', fontSize: '1rem',
                  fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  🚨 Report an Issue
                </button>
              </Link>
            )}
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="btn-outline" style={{
                backgroundColor: 'rgba(255,255,255,0.06)', color: 'white',
                padding: '1rem 2.8rem',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: '50px', fontSize: '1rem',
                fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                📊 View Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" style={{
          position: 'absolute', bottom: '1.5rem', left: '50%',
          transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.4)',
          fontSize: '1.2rem',
        }}>
          ▼
        </div>
      </div>

      {/* ───── Stats Section ───── */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: '1.5rem', padding: '3rem 2rem',
        backgroundColor: 'white', flexWrap: 'wrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        position: 'relative', zIndex: 2,
      }}>
        {[
          { value: animatedStats.total, label: 'Issues Reported', color: '#1d4ed8', bg: '#eff6ff', icon: '📋' },
          { value: animatedStats.resolved, label: 'Issues Resolved', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
          { value: animatedStats.inProgress, label: 'In Progress', color: '#d97706', bg: '#fffbeb', icon: '🔧' },
        ].map((stat, i) => (
          <div key={i} className="stat-card fade-scale" style={{
            '--accent': stat.color,
            textAlign: 'center', padding: '1.8rem 2.8rem',
            borderRadius: '20px', border: '1px solid #e2e8f0',
            minWidth: '170px', backgroundColor: '#fff',
            animationDelay: `${0.2 + i * 0.15}s`,
          }}>
            <div style={{
              fontSize: '2.2rem', marginBottom: '0.5rem',
              width: '56px', height: '56px', borderRadius: '16px',
              backgroundColor: stat.bg, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {stat.icon}
            </div>
            <h2 style={{
              color: stat.color, fontSize: '2.8rem',
              fontWeight: '800', margin: '0.3rem 0 0.1rem',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {stat.value}
            </h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ───── How it Works ───── */}
      <div style={{
        padding: '5rem 2rem', textAlign: 'center',
        backgroundColor: '#f8fafc',
        position: 'relative',
      }}>
        {/* Subtle top border gradient */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, #1d4ed8, #0891b2, transparent)',
          opacity: 0.3,
        }} />

        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{
            display: 'inline-block', padding: '0.35rem 1rem',
            borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #eff6ff, #e0f2fe)',
            color: '#1d4ed8', letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            Simple Process
          </span>
        </div>

        <h2 className="section-title" style={{
          color: '#0f172a', fontSize: '2.2rem', fontWeight: '800',
          margin: '0.8rem 0 0.5rem', letterSpacing: '-0.5px',
        }}>
          How it Works
        </h2>
        <p style={{ color: '#94a3b8', margin: '0 0 3.5rem', fontSize: '1rem' }}>
          Four simple steps to make your community better
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem', maxWidth: '880px', margin: '0 auto',
        }}>
          {[
            { icon: '📸', title: 'Report', desc: 'Take a photo and report the issue in your area' },
            { icon: '🤖', title: 'AI Analyzes', desc: 'Gemini AI automatically categorizes your issue' },
            { icon: '👥', title: 'Community Votes', desc: 'Upvotes help prioritize the most urgent issues' },
            { icon: '✅', title: 'Get Resolved', desc: 'Track progress until the issue is fully fixed' },
          ].map((step, i) => (
            <div key={i} className="step-card" style={{
              backgroundColor: 'white', padding: '2.2rem 1.5rem',
              borderRadius: '20px', border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div className="step-number">{i + 1}</div>
              <span className="step-icon" style={{ fontSize: '2.8rem', marginBottom: '1rem' }}>
                {step.icon}
              </span>
              <h3 style={{
                color: '#0f172a', margin: '0 0 0.5rem',
                fontSize: '1.05rem', fontWeight: 700,
              }}>
                {step.title}
              </h3>
              <p style={{
                color: '#94a3b8', fontSize: '0.85rem',
                lineHeight: '1.7', margin: 0,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ───── CTA Section ───── */}
      {!ADMIN_EMAILS.includes(user?.email) && (
        <div className="cta-bg" style={{
          padding: '5rem 2rem', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative orb */}
          <div style={{
            position: 'absolute', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(8,145,178,0.25), transparent 70%)',
            width: '400px', height: '400px', top: '-100px', right: '-100px',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌟</div>
            <h2 style={{
              color: 'white', fontSize: '2.2rem', fontWeight: '800',
              margin: '0 0 0.8rem', letterSpacing: '-0.5px',
            }}>
              Ready to make a difference?
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)', margin: '0 0 2.5rem',
              fontSize: '1rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto',
              lineHeight: 1.6,
            }}>
              Join hundreds of citizens already making their communities better, one report at a time.
            </p>
            <Link to="/report" style={{ textDecoration: 'none' }}>
              <button className="shimmer-btn" style={{
                color: '#1e3a8a', padding: '1rem 3rem',
                border: 'none', borderRadius: '50px',
                fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              }}>
                🚨 Report Your First Issue
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ───── Footer accent ───── */}
      <div style={{
        height: '4px',
        background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8, #0891b2, #1d4ed8, #1e3a8a)',
      }} />
    </div>
  );
}

export default Home;