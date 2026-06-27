import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, increment } from 'firebase/firestore';
import { awardPointsForUpvote, awardPointsForResolved } from '../services/gamificationService';
import { getBadgesForUser } from '../services/gamificationService';

const STATUS_FLOW = {
  'Reported': 'In Progress',
  'In Progress': 'Resolved',
  'Resolved': 'Reported'
};

const SEVERITY_RANK = { High: 3, Medium: 2, Low: 1 };

function Dashboard({ user, userStats }) {
  const [issues, setIssues] = useState([]);
  const [topHeroes, setTopHeroes] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sort state
  const [sortBy, setSortBy] = useState('Newest');

  // Modal state
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));

    // onSnapshot fires immediately with current data, then again every time
    // anything in the 'issues' collection changes — no manual refetch needed.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const issuesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setIssues(issuesList);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to issues:', error);
        setLoading(false);
      }
    );

    // cleanup: detach the listener when the component unmounts
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('points', 'desc')
    );
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).slice(0, 5);
      setTopHeroes(usersList);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);
  
  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedIssue(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleUpvote = async (issue) => {
    // Prevent users from upvoting their own issue to farm points
    if (issue.reporterUid && user?.uid === issue.reporterUid) {
      alert("You can't upvote your own report!");
      return;
    }

    try {
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, {
        upvotes: increment(1)
      });

      // Gamification: the ORIGINAL REPORTER earns points when their issue gets upvoted
      if (issue.reporterUid) {
        await awardPointsForUpvote(issue.reporterUid);
      }
      // No need to manually refetch — the onSnapshot listener picks this up automatically
    } catch (error) {
      console.error('Upvote error:', error);
    }
  };

  const handleStatusUpdate = async (issue) => {
    const newStatus = STATUS_FLOW[issue.status] || 'Reported';

    try {
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, {
        status: newStatus
      });

      // Gamification: bonus points to the reporter only when an issue newly becomes Resolved
      if (newStatus === 'Resolved' && issue.reporterUid) {
        await awardPointsForResolved(issue.reporterUid);
      }
      // No need to manually refetch — the onSnapshot listener picks this up automatically
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === 'High') return '#dc2626';
    if (severity === 'Medium') return '#d97706';
    return '#16a34a';
  };

  const getStatusColor = (status) => {
    if (status === 'Resolved') return '#16a34a';
    if (status === 'In Progress') return '#d97706';
    return '#2563eb';
  };

  // ---- Derive filter option lists dynamically from the data ----
  const categories = ['All', ...new Set(issues.map(i => i.aiCategory).filter(Boolean))];
  const severities = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Reported', 'In Progress', 'Resolved'];
  const sortOptions = ['Newest', 'Most Upvoted', 'Severity'];

  const selectStyle = {
    padding: '0.55rem 0.9rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: 'white',
    fontSize: '0.88rem',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '500',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  };

  const myBadges = userStats
    ? getBadgesForUser(userStats.reportsCount || 0, userStats.points || 0)
    : [];

  // ---- Apply filters ----
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = categoryFilter === 'All' || issue.aiCategory === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || issue.aiSeverity === severityFilter;
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    const matchLocation = searchLocation === '' ||
      issue.location.toLowerCase().includes(searchLocation.toLowerCase());
    return matchesCategory && matchesSeverity && matchesStatus && matchLocation;
  });

  // ---- Apply sort (on a copy — never mutate state directly) ----
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'Most Upvoted') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === 'Severity') {
      return (SEVERITY_RANK[b.aiSeverity] || 0) - (SEVERITY_RANK[a.aiSeverity] || 0);
    }
    // Newest — createdAt is a Firestore Timestamp; fall back to 0 if missing
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  return (
    <div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmerSkeleton {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(240, 192, 64, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(240, 192, 64, 0); }
        }
        .db-hero-emoji { animation: float 3s ease-in-out infinite; }
        .db-fade-up { animation: fadeInUp 0.5s ease; }
        .db-fade-in { animation: fadeIn 0.3s ease; }
        .db-scale-in { animation: scaleIn 0.25s ease; }
        .db-skeleton {
          background: linear-gradient(90deg, #eef1f6 25%, #f7f9fc 50%, #eef1f6 75%);
          background-size: 200% 100%;
          animation: shimmerSkeleton 1.4s ease-in-out infinite;
          border-radius: 12px;
        }
        .db-stats-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .db-stats-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.25); }
        .db-badge-pulse { animation: pulseGold 2.4s ease-in-out infinite; }
        .db-filter-card { transition: box-shadow 0.25s ease; }
        .db-select:focus, .db-search:focus {
          border-color: #1d4ed8 !important;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
        }
        .db-issue-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          cursor: pointer;
        }
        .db-issue-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }
        .db-issue-card img { transition: transform 0.35s ease; }
        .db-issue-card:hover img { transform: scale(1.05); }
        .db-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
        }
        .db-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(0.97);
        }
        .db-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .db-clear-btn:hover {
          background-color: #fee2e2 !important;
        }
        .db-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1.5rem;
        }
        .db-modal-close {
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .db-modal-close:hover {
          background-color: #f1f5f9;
          transform: rotate(90deg);
        }
        .db-empty-icon { animation: float 3.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%)',
        padding: '3rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          opacity: 0.07, width: '300px', height: '300px', top: '-100px', right: '-60px'
        }} />
        <div style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          opacity: 0.05, width: '200px', height: '200px', bottom: '-60px', left: '-40px'
        }} />
        <div className="db-fade-up" style={{ position: 'relative', zIndex: 1 }}>
          <div className="db-hero-emoji" style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>📊</div>
          <h1 style={{
            fontSize: '2.2rem', fontWeight: '800', color: 'white',
            margin: '0 0 0.4rem', letterSpacing: '-1px'
          }}>
            Community Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.95rem' }}>
            {issues.length === 0
              ? 'No issues reported yet'
              : `${sortedIssues.length} of ${issues.length} issue${issues.length !== 1 ? 's' : ''} shown`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '-2.5rem auto 2rem', padding: '0 1rem', position: 'relative', zIndex: 2 }}>

        {/* My Hero Stats — kept dark navy + gold premium theme */}
        {user && userStats && (
          <div className="db-fade-up db-stats-card" style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            border: '1px solid #f0c040',
            borderRadius: '16px',
            padding: '20px 28px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
          }}>
            <div>
              <p style={{ color: '#aaa', margin: 0, fontSize: '13px', letterSpacing: '0.5px' }}>YOUR CIVIC SCORE</p>
              <h2 style={{ color: '#f0c040', margin: '4px 0', fontSize: '30px', fontWeight: '800' }}>
                ⭐ {userStats.points || 0} pts
              </h2>
              <p style={{ color: '#ccc', margin: 0, fontSize: '13px' }}>
                {userStats.reportsCount || 0} issues reported
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#aaa', margin: '0 0 8px', fontSize: '13px', letterSpacing: '0.5px' }}>YOUR BADGES</p>
              {myBadges.length === 0
                ? <p style={{ color: '#888', fontSize: '13px' }}>Report your first issue to earn badges! 🌱</p>
                : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {myBadges.map(badge => (
                      <span key={badge.name} className="db-badge-pulse" style={{
                        background: '#0f3460', borderRadius: '20px',
                        padding: '5px 12px', fontSize: '13px', color: '#fff',
                        border: '1px solid rgba(240,192,64,0.4)'
                      }}>
                        {badge.emoji} {badge.name}
                      </span>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          className="db-search"
          placeholder="🔍 Search by location..."
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          style={{
            width: '100%',
            padding: '0.8rem 1rem',
            marginBottom: '1.2rem',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '1rem',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        />

        {/* Leaderboard */}
{topHeroes.length > 0 && (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem'
  }}>
    <h3 style={{ color: '#1e3a8a', margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700' }}>
      🏆 Top Community Heroes
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {topHeroes.map((hero, idx) => (
        <div key={hero.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px',
          borderRadius: '10px',
          backgroundColor: idx === 0 ? '#fefce8' : idx === 1 ? '#f8fafc' : 'transparent',
          border: idx === 0 ? '1px solid #fde68a' : '1px solid transparent'
        }}>
          <span style={{ fontSize: '1.2rem', minWidth: '28px', textAlign: 'center' }}>
            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
          </span>
          {hero.photoURL ? (
            <img src={hero.photoURL} alt="avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#dbeafe', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', flexShrink: 0
            }}>🦸</div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem', color: '#111827' }}>
              {hero.displayName || 'Anonymous Hero'}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
              {hero.reportsCount || 0} reports
            </p>
          </div>
          <span style={{
            backgroundColor: '#eff6ff', color: '#2563eb',
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '0.8rem', fontWeight: '700'
          }}>
            ⭐ {hero.points || 0}
          </span>
          {hero.id === user?.uid && (
            <span style={{
              backgroundColor: '#dcfce7', color: '#16a34a',
              padding: '2px 8px', borderRadius: '20px',
              fontSize: '0.7rem', fontWeight: '600'
            }}>You</span>
          )}
        </div>
      ))}
    </div>
  </div>
)}

        {/* Filters + Sort */}
        <div className="db-filter-card" style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          backgroundColor: 'white',
          padding: '1.2rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: '600', letterSpacing: '0.3px' }}>
              CATEGORY
            </label>
            <select
              className="db-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: '600', letterSpacing: '0.3px' }}>
              SEVERITY
            </label>
            <select
              className="db-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={selectStyle}
            >
              {severities.map(sev => (
                <option key={sev} value={sev}>{sev}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: '600', letterSpacing: '0.3px' }}>
              STATUS
            </label>
            <select
              className="db-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: '600', letterSpacing: '0.3px' }}>
              SORT BY
            </label>
            <select
              className="db-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={selectStyle}
            >
              {sortOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {(categoryFilter !== 'All' || severityFilter !== 'All' || statusFilter !== 'All') && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="db-btn db-clear-btn"
                onClick={() => {
                  setCategoryFilter('All');
                  setSeverityFilter('All');
                  setStatusFilter('All');
                }}
                style={{
                  ...selectStyle,
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1.5px solid #fecaca',
                  fontWeight: 'bold'
                }}
              >
                ✕ Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', backgroundColor: 'white',
                borderRadius: '14px', overflow: 'hidden', border: '1px solid #f1f5f9'
              }}>
                <div className="db-skeleton" style={{ width: '150px', height: '150px', flexShrink: 0, borderRadius: 0 }} />
                <div style={{ padding: '1rem', flex: 1 }}>
                  <div className="db-skeleton" style={{ height: '18px', width: '40%', marginBottom: '0.6rem' }} />
                  <div className="db-skeleton" style={{ height: '14px', width: '70%', marginBottom: '0.5rem' }} />
                  <div className="db-skeleton" style={{ height: '14px', width: '50%', marginBottom: '0.8rem' }} />
                  <div className="db-skeleton" style={{ height: '28px', width: '120px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sortedIssues.length === 0 && (
          <div className="db-fade-in" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="db-empty-icon" style={{ fontSize: '3.5rem' }}>🏘️</div>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginTop: '1rem' }}>
              {issues.length === 0
                ? 'No issues reported yet. Be the first to report!'
                : 'No issues match the selected filters.'}
            </p>
          </div>
        )}

        {/* Issue list */}
        {!loading && sortedIssues.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sortedIssues.map((issue, idx) => (
              <div
                key={issue.id}
                className="db-issue-card db-fade-up"
                onClick={() => setSelectedIssue(issue)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  overflow: 'hidden',
                  display: 'flex',
                  gap: '1rem',
                  border: '1px solid #f1f5f9',
                  animationDelay: `${Math.min(idx * 0.05, 0.4)}s`
                }}
              >
                {/* Image */}
                {issue.imageUrl && (
                  <div style={{ width: '150px', height: '150px', flexShrink: 0, overflow: 'hidden' }}>
                    <img
                      src={issue.imageUrl}
                      alt="issue"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '1rem', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      🤖 {issue.aiCategory}
                    </span>
                    <span style={{
                      backgroundColor: '#fef2f2',
                      color: getSeverityColor(issue.aiSeverity),
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      ⚠️ {issue.aiSeverity}
                    </span>
                    <span style={{
                      backgroundColor: '#f0fdf4',
                      color: getStatusColor(issue.status),
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {issue.status}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.3rem', fontWeight: 'bold', color: '#111827' }}>
                    📍 {issue.location}
                  </p>
                  {issue.description && (
                    <p style={{
                      margin: '0 0 0.3rem', color: '#6b7280', fontSize: '0.9rem',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {issue.description}
                    </p>
                  )}
                  <p style={{ margin: '0 0 0.8rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                    Reported by: {issue.name}
                  </p>

                  {/* Upvote + Status update — stopPropagation so card click (modal) doesn't fire */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="db-btn"
                      onClick={() => handleUpvote(issue)}
                      disabled={user?.uid === issue.reporterUid}
                      title={user?.uid === issue.reporterUid ? "You can't upvote your own report" : 'Upvote this issue'}
                      style={{
                        backgroundColor: user?.uid === issue.reporterUid ? '#f3f4f6' : '#eff6ff',
                        color: user?.uid === issue.reporterUid ? '#9ca3af' : '#2563eb',
                        border: `1px solid ${user?.uid === issue.reporterUid ? '#e5e7eb' : '#bfdbfe'}`,
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        cursor: user?.uid === issue.reporterUid ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    >
                      👍 {issue.upvotes || 0} Upvotes
                    </button>

                    <button
                      className="db-btn"
                      onClick={() => handleStatusUpdate(issue)}
                      style={{
                        backgroundColor: '#f0fdf4',
                        color: getStatusColor(issue.status),
                        border: `1px solid ${getStatusColor(issue.status)}`,
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                      title="Click to move to next status"
                    >
                      🔄 Mark as {STATUS_FLOW[issue.status] || 'Reported'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIssue && (
        <div className="db-modal-overlay db-fade-in" onClick={() => setSelectedIssue(null)}>
          <div
            className="db-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '18px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <button
              className="db-modal-close"
              onClick={() => setSelectedIssue(null)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                width: '34px', height: '34px', borderRadius: '50%',
                border: 'none', backgroundColor: 'white', color: '#374151',
                fontSize: '1.1rem', cursor: 'pointer', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              ✕
            </button>

            {selectedIssue.imageUrl && (
              <img
                src={selectedIssue.imageUrl}
                alt="issue"
                style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
              />
            )}

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.7rem',
                  borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                }}>
                  🤖 {selectedIssue.aiCategory}
                </span>
                <span style={{
                  backgroundColor: '#fef2f2', color: getSeverityColor(selectedIssue.aiSeverity),
                  padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                }}>
                  ⚠️ {selectedIssue.aiSeverity}
                </span>
                <span style={{
                  backgroundColor: '#f0fdf4', color: getStatusColor(selectedIssue.status),
                  padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                }}>
                  {selectedIssue.status}
                </span>
              </div>

              <h2 style={{ margin: '0 0 0.5rem', color: '#1e3a8a', fontSize: '1.4rem', fontWeight: '800' }}>
                📍 {selectedIssue.location}
              </h2>

              {selectedIssue.description && (
                <p style={{ margin: '0 0 1rem', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {selectedIssue.description}
                </p>
              )}

              <p style={{ margin: '0 0 1.2rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                Reported by: {selectedIssue.name} · 👍 {selectedIssue.upvotes || 0} upvotes
              </p>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  className="db-btn"
                  onClick={() => handleUpvote(selectedIssue)}
                  disabled={user?.uid === selectedIssue.reporterUid}
                  style={{
                    backgroundColor: user?.uid === selectedIssue.reporterUid ? '#f3f4f6' : '#eff6ff',
                    color: user?.uid === selectedIssue.reporterUid ? '#9ca3af' : '#2563eb',
                    border: `1px solid ${user?.uid === selectedIssue.reporterUid ? '#e5e7eb' : '#bfdbfe'}`,
                    padding: '0.5rem 1.2rem', borderRadius: '20px',
                    cursor: user?.uid === selectedIssue.reporterUid ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold', fontSize: '0.9rem'
                  }}
                >
                  👍 Upvote
                </button>
                <button
                  className="db-btn"
                  onClick={() => handleStatusUpdate(selectedIssue)}
                  style={{
                    backgroundColor: '#f0fdf4',
                    color: getStatusColor(selectedIssue.status),
                    border: `1px solid ${getStatusColor(selectedIssue.status)}`,
                    padding: '0.5rem 1.2rem', borderRadius: '20px',
                    cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                  }}
                >
                  🔄 Mark as {STATUS_FLOW[selectedIssue.status] || 'Reported'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;