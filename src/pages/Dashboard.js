import React, { useEffect, useState } from 'react';
import { generateInsights } from '../services/insightsService';
import { db } from '../firebase/config';
import { awardPointsForUpvote, awardPointsForResolved } from '../services/gamificationService';
import { getBadgesForUser } from '../services/gamificationService';
import { runAgentCycle } from '../services/agentService';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, getDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { ADMIN_EMAILS } from '../utils/adminConfig';
import StatusTimeline from '../components/StatusTimeline';

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

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Admin
  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  const [agentActions, setAgentActions] = useState([]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allIssues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const issuesList = allIssues.filter(issue => {
          if (issue.status === 'Rejected') return false;
          if (issue.status === 'Pending Review') {
            return issue.reporterUid === user?.uid;
          }
          return true;
        });
        setIssues(issuesList);
        setLoading(false);
        runAgentCycle(issuesList);
      },
      (error) => {
        console.error('Error listening to issues:', error);
        setLoading(false);
      }
    );

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
  }, [user?.uid]);

  // 5-day review deadline & 3-day assignment check
  useEffect(() => {
    const checkOverdue = async () => {
      const now = new Date();

      const overdueReviews = issues.filter(
        (i) => i.status === 'Awaiting Reporter Confirmation' &&
          i.reviewDeadline && i.reviewDeadline.toDate() < now
      );
      for (const issue of overdueReviews) {
        try {
          await updateDoc(doc(db, 'issues', issue.id), { status: 'Needs Admin Review' });
        } catch (err) { console.error('Overdue review error:', err); }
      }

      const overdueAssignments = issues.filter((i) => {
        if (i.status !== 'Under University Review' || !i.assignedAt) return false;
        const hoursSince = (now - i.assignedAt.toDate()) / (1000 * 60 * 60);
        return hoursSince >= 72;
      });
      for (const issue of overdueAssignments) {
        try {
          await updateDoc(doc(db, 'issues', issue.id), {
            assignedTo: null,
            assignedUniName: null,
            status: 'Reported',
            assignedAt: null,
          });
        } catch (err) { console.error('Assignment timeout error:', err); }
      }
    };
    if (issues.length > 0) checkOverdue();
  }, [issues]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedIssue(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'agentActions'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const actions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 5);
      setAgentActions(actions);
    });
    return () => unsub();
  }, []);

  const handleUpvote = async (issue) => {
    if (issue.reporterUid && user?.uid === issue.reporterUid) {
      alert("You can't upvote your own issue!");
      return;
    }

    if (issue.upvoters?.includes(user?.uid)) {
      alert("You already upvoted this issue!");
      return;
    }

    try {
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, {
        upvotes: increment(1),
        upvoters: [...(issue.upvoters || []), user.uid]
      });

      if (issue.reporterUid) {
        await awardPointsForUpvote(issue.reporterUid);
      }

      if (issue.reporterUid && issue.reporterUid !== user?.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            toUid: issue.reporterUid,
            message: `👍 ${user.displayName} upvoted your issue at ${issue.location}!`,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.error('Notification error:', err);
        }
      }
    } catch (error) {
      console.error('Upvote error:', error);
    }
  };

  const handleRejectAsFake = async (issue) => {
    if (!window.confirm(`Reject "${issue.description?.slice(0, 40)}..." as fake?`)) return;

    try {
      await updateDoc(doc(db, 'issues', issue.id), {
        status: 'Rejected',
        rejectedAt: serverTimestamp(),
      });

      if (issue.reporterUid) {
        const userRef = doc(db, 'users', issue.reporterUid);
        const userSnap = await getDoc(userRef);
        const currentRejected = (userSnap.exists() ? userSnap.data().rejectedCount : 0) || 0;
        const newCount = currentRejected + 1;

        await updateDoc(userRef, { rejectedCount: increment(1) });

        if (newCount === 3) {
          alert(`Reporter has now hit 3 rejected reports (warning threshold).`);
        } else if (newCount >= 5) {
          await updateDoc(userRef, { suspended: true });
          alert(`Reporter has hit 5 rejected reports — account suspended.`);
        }
      }
    } catch (err) {
      console.error('Reject as fake error:', err);
      alert('Something went wrong rejecting this issue.');
    }
  };

  const handleWitness = async (issue) => {
    if (issue.reporterUid === user?.uid) {
      alert("You can't witness your own issue!");
      return;
    }
    if (issue.witnesses?.includes(user?.uid)) {
      alert("You already confirmed this issue!");
      return;
    }
    try {
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, {
        witnesses: [...(issue.witnesses || []), user.uid],
        witnessCount: increment(1)
      });
    } catch (error) {
      console.error('Witness error:', error);
    }
    if (issue.reporterUid && issue.reporterUid !== user?.uid) {
      try {
        await addDoc(collection(db, 'notifications'), {
          toUid: issue.reporterUid,
          message: `👀 ${user.displayName} also sees your issue at ${issue.location}!`,
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Notification error:', err);
      }
    }
  };

  const handleStatusUpdate = async (issue) => {
    if (!isAdmin) {
      alert("Only admins can update issue status!");
      return;
    }
    const newStatus = STATUS_FLOW[issue.status] || 'Reported';

    try {
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, { status: newStatus });

      if (issue.reporterUid && issue.reporterUid !== user?.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            toUid: issue.reporterUid,
            message: `🔄 Your issue at ${issue.location} status changed to ${newStatus}!`,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.error('Notification error:', err);
        }
      }

      if (newStatus === 'Resolved' && issue.reporterUid) {
        await awardPointsForResolved(issue.reporterUid);
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleConfirmResolution = async (issue, confirmed) => {
    try {
      const issueRef = doc(db, 'issues', issue.id);
      if (confirmed) {
        await updateDoc(issueRef, { status: 'Resolved', resolvedAt: serverTimestamp() });
        if (issue.reporterUid) await awardPointsForResolved(issue.reporterUid);
        if (issue.assignedTo) {
          await addDoc(collection(db, 'notifications'), {
            toUid: issue.assignedTo,
            message: `✅ Reporter confirmed your resolution for "${issue.location}"!`,
            read: false, createdAt: serverTimestamp(),
          });
        }
      } else {
        await updateDoc(issueRef, { status: 'In Progress', afterImageUrl: null, reviewDeadline: null });
        if (issue.assignedTo) {
          await addDoc(collection(db, 'notifications'), {
            toUid: issue.assignedTo,
            message: `❌ Reporter says "${issue.location}" is not fixed yet — please review.`,
            read: false, createdAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.error('Confirm resolution error:', err);
      alert('Something went wrong, please try again.');
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

  const categories = ['All', ...new Set(issues.map(i => i.aiCategory).filter(Boolean))];
  const severities = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Reported', 'In Progress', 'Resolved'];
  const sortOptions = ['Newest', 'Most Upvoted', 'Severity'];

  const selectStyle = {
    padding: '0.65rem 0.9rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#fff',
    fontSize: '0.88rem',
    color: '#1e293b',
    cursor: 'pointer',
    fontWeight: '600',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s ease'
  };

  const myBadges = userStats
    ? getBadgesForUser(userStats.reportsCount || 0, userStats.points || 0)
    : [];

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = categoryFilter === 'All' || issue.aiCategory === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || issue.aiSeverity === severityFilter;
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    const matchLocation = searchLocation === '' ||
      issue.location.toLowerCase().includes(searchLocation.toLowerCase());
    return matchesCategory && matchesSeverity && matchesStatus && matchLocation;
  });

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'Most Upvoted') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === 'Severity') {
      return (SEVERITY_RANK[b.aiSeverity] || 0) - (SEVERITY_RANK[a.aiSeverity] || 0);
    }
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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
        .db-fade-up { animation: fadeInUp 0.5s ease both; }
        .db-scale-in { animation: scaleIn 0.25s ease; }
        
        .db-skeleton {
          background: linear-gradient(90deg, #eef1f6 25%, #f7f9fc 50%, #eef1f6 75%);
          background-size: 200% 100%;
          animation: shimmerSkeleton 1.4s ease-in-out infinite;
          border-radius: 12px;
        }

        .db-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: box-shadow 0.25s ease;
        }
        .db-panel:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.06);
        }

        .db-issue-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }
        .db-issue-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.09);
          border-color: #cbd5e1;
        }
        .db-issue-card img, .db-issue-card video {
          transition: transform 0.4s ease;
        }
        .db-issue-card:hover img, .db-issue-card:hover video {
          transform: scale(1.04);
        }

        .db-select:focus, .db-search:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12) !important;
        }

        .db-btn {
          transition: all 0.2s ease;
        }
        .db-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          filter: brightness(0.96);
        }
        .db-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .db-badge-pulse { animation: pulseGold 2.5s ease-in-out infinite; }

        .db-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1.5rem;
        }

        /* Desktop Layout: Main feed on left, widgets on right */
        @media (min-width: 1024px) {
          .db-grid-container {
            display: grid;
            grid-template-columns: 1fr 360px;
            gap: 1.8rem;
            align-items: start;
          }
          .db-filter-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr) auto;
            gap: 0.8rem;
            align-items: flex-end;
          }
        }
        @media (max-width: 1023px) {
          .db-grid-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .db-filter-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.8rem;
          }
        }
      `}</style>

      {/* ───── Top Banner / Header ───── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 75%, #0891b2 100%)',
        padding: '3.5rem 2rem 5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)',
          width: '450px', height: '450px', top: '-150px', right: '-80px', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px', pointerEvents: 'none'
        }} />

        <div className="db-fade-up" style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'left', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                <span className="db-hero-emoji" style={{ fontSize: '2.5rem' }}>📊</span>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.8px' }}>
                  Community Dashboard
                </h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '1rem' }}>
                Real-time citizen reports, AI categorization, and community progress
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: '16px',
              padding: '0.8rem 1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1.2rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Issues</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{issues.length}</div>
              </div>
              <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Showing</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#67e8f9' }}>{sortedIssues.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Main Dashboard Workspace (Max Width 1240px) ───── */}
      <div style={{ maxWidth: '1240px', margin: '-2.8rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 2 }}>

        {/* User Hero Civic Score Card */}
        {user && userStats && (
          <div className="db-fade-up db-panel" style={{
            background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
            border: '1px solid #eab308',
            padding: '1.4rem 1.8rem',
            marginBottom: '1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            <div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px' }}>
                YOUR CIVIC PROFILE
              </p>
              <h2 style={{ color: '#facc15', margin: '4px 0', fontSize: '2rem', fontWeight: '800' }}>
                ⭐ {userStats.points || 0} pts
              </h2>
              <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.85rem' }}>
                {userStats.reportsCount || 0} issues reported · Level: Active Contributor
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px' }}>
                EARNED BADGES
              </p>
              {myBadges.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Report your first issue to earn badges! 🌱</p>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {myBadges.map(badge => (
                    <span key={badge.name} className="db-badge-pulse" style={{
                      background: '#1e293b', borderRadius: '20px',
                      padding: '6px 14px', fontSize: '0.82rem', color: '#fff',
                      border: '1px solid rgba(250, 204, 21, 0.4)', fontWeight: '600'
                    }}>
                      {badge.emoji} {badge.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───── Two-Column Grid ───── */}
        <div className="db-grid-container">

          {/* ════ LEFT COLUMN: Controls & Issues Feed ════ */}
          <div>

            {/* Search and Filters Bar */}
            <div className="db-panel" style={{ padding: '1.3rem', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <input
                  type="text"
                  className="db-search"
                  placeholder="🔍 Search issues by street, city, or area (e.g. Ranchi, MG Road)..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  style={{
                    width: '100%', padding: '0.85rem 1.2rem',
                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                    fontSize: '0.95rem', boxSizing: 'border-box',
                    outline: 'none', background: '#f8fafc', color: '#0f172a',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              {/* Filters row */}
              <div className="db-filter-row">
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: '700', letterSpacing: '0.5px' }}>
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
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: '700', letterSpacing: '0.5px' }}>
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
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: '700', letterSpacing: '0.5px' }}>
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
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: '700', letterSpacing: '0.5px' }}>
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

                {(categoryFilter !== 'All' || severityFilter !== 'All' || statusFilter !== 'All' || searchLocation !== '') && (
                  <div>
                    <button
                      className="db-btn"
                      onClick={() => {
                        setCategoryFilter('All');
                        setSeverityFilter('All');
                        setStatusFilter('All');
                        setSearchLocation('');
                      }}
                      style={{
                        padding: '0.65rem 1rem',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1.5px solid #fecaca',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        width: '100%'
                      }}
                    >
                      ✕ Reset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Skeleton Loading State */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="db-panel" style={{ display: 'flex', gap: '1.2rem', padding: '1.2rem', overflow: 'hidden' }}>
                    <div className="db-skeleton" style={{ width: '160px', height: '140px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="db-skeleton" style={{ height: '20px', width: '45%', marginBottom: '0.8rem' }} />
                      <div className="db-skeleton" style={{ height: '14px', width: '80%', marginBottom: '0.5rem' }} />
                      <div className="db-skeleton" style={{ height: '14px', width: '60%', marginBottom: '1rem' }} />
                      <div className="db-skeleton" style={{ height: '30px', width: '130px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && sortedIssues.length === 0 && (
              <div className="db-panel" style={{ textAlign: 'center', padding: '4.5rem 1.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏘️</div>
                <h3 style={{ color: '#0f172a', margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: '800' }}>No Issues Found</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  {issues.length === 0
                    ? 'No issues reported yet. Be the community champion and report one!'
                    : 'No issues match your current filters or search query.'}
                </p>
              </div>
            )}

            {/* Issues Feed List */}
            {!loading && sortedIssues.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedIssues.map((issue, idx) => (
                  <div
                    key={issue.id}
                    className="db-panel db-issue-card db-fade-up"
                    onClick={() => setSelectedIssue(issue)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '1.2rem',
                      padding: '1.2rem',
                      animationDelay: `${Math.min(idx * 0.04, 0.3)}s`
                    }}
                  >
                    {/* Media Thumbnail */}
                    {issue.imageUrl && (
                      <div style={{ width: '160px', height: '150px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                        {issue.mediaType === 'video' ? (
                          <video
                            src={issue.imageUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            muted autoPlay loop
                          />
                        ) : (
                          <img
                            src={issue.imageUrl}
                            alt="issue"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        )}
                      </div>
                    )}

                    {/* Content Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{
                            backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.65rem',
                            borderRadius: '16px', fontSize: '0.78rem', fontWeight: '700'
                          }}>
                            🏷️ {issue.aiCategory}
                          </span>
                          <span style={{
                            backgroundColor: '#fef2f2', color: getSeverityColor(issue.aiSeverity),
                            padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.78rem', fontWeight: '700'
                          }}>
                            ⚠️ {issue.aiSeverity}
                          </span>
                          <span style={{
                            backgroundColor: '#f0fdf4', color: getStatusColor(issue.status),
                            padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.78rem', fontWeight: '700'
                          }}>
                            ● {issue.status}
                          </span>
                        </div>

                        {issue.status === 'Awaiting Reporter Confirmation' && issue.reporterUid === user?.uid && (
                          <div style={{
                            marginTop: '0.6rem', background: '#fefce8', border: '1px solid #fde047',
                            padding: '0.8rem 1rem', borderRadius: '10px'
                          }} onClick={(e) => e.stopPropagation()}>
                            <p style={{ fontWeight: '700', margin: '0 0 0.5rem', color: '#854d0e', fontSize: '0.85rem' }}>
                              🔍 University claims this is resolved. Please confirm:
                            </p>
                            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.6rem' }}>
                              <div>
                                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 2px' }}>Before</p>
                                <img src={issue.imageUrl} alt="before" style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                              </div>
                              <div>
                                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 2px' }}>After</p>
                                <img src={issue.afterImageUrl} alt="after" style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleConfirmResolution(issue, true)}
                                style={{ padding: '0.4rem 0.9rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                              >
                                ✅ Yes, fixed
                              </button>
                              <button
                                onClick={() => handleConfirmResolution(issue, false)}
                                style={{ padding: '0.4rem 0.9rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                              >
                                ❌ Not fixed
                              </button>
                            </div>
                          </div>
                        )}

                        {issue.status === 'Needs Admin Review' && (
                          <p style={{ color: '#dc2626', fontWeight: '700', margin: '0.4rem 0', fontSize: '0.85rem' }}>
                            🚩 Needs Admin Review (5-day window expired)
                          </p>
                        )}

                        <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                          📍 {issue.location}
                        </h3>

                        {issue.description && (
                          <p style={{
                            margin: '0 0 0.5rem', color: '#475569', fontSize: '0.88rem',
                            lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                          }}>
                            {issue.description}
                          </p>
                        )}

                        <p style={{ margin: '0 0 0.8rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                          Reported by <strong style={{ color: '#475569' }}>{issue.name}</strong>
                        </p>
                      </div>

                      {/* Interactive Action Bar */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="db-btn"
                          onClick={() => handleUpvote(issue)}
                          disabled={user?.uid === issue.reporterUid || issue.upvoters?.includes(user?.uid)}
                          style={{
                            backgroundColor: (user?.uid === issue.reporterUid || issue.upvoters?.includes(user?.uid)) ? '#f1f5f9' : '#eff6ff',
                            color: (user?.uid === issue.reporterUid || issue.upvoters?.includes(user?.uid)) ? '#94a3b8' : '#2563eb',
                            border: `1.5px solid ${(user?.uid === issue.reporterUid || issue.upvoters?.includes(user?.uid)) ? '#e2e8f0' : '#bfdbfe'}`,
                            cursor: (user?.uid === issue.reporterUid || issue.upvoters?.includes(user?.uid)) ? 'not-allowed' : 'pointer',
                            fontWeight: '700', fontSize: '0.82rem', borderRadius: '20px', padding: '0.4rem 0.9rem'
                          }}
                        >
                          👍 {issue.upvotes || 0} Upvotes
                        </button>

                        <button
                          className="db-btn"
                          onClick={() => handleWitness(issue)}
                          disabled={issue.witnesses?.includes(user?.uid) || issue.reporterUid === user?.uid}
                          style={{
                            backgroundColor: (issue.witnesses?.includes(user?.uid) || issue.reporterUid === user?.uid) ? '#f1f5f9' : '#f0fdf4',
                            color: (issue.witnesses?.includes(user?.uid) || issue.reporterUid === user?.uid) ? '#94a3b8' : '#16a34a',
                            border: `1.5px solid ${(issue.witnesses?.includes(user?.uid) || issue.reporterUid === user?.uid) ? '#e2e8f0' : '#86efac'}`,
                            padding: '0.4rem 0.9rem', borderRadius: '20px',
                            cursor: (issue.witnesses?.includes(user?.uid) || issue.reporterUid === user?.uid) ? 'not-allowed' : 'pointer',
                            fontWeight: '600', fontSize: '0.82rem'
                          }}
                        >
                          👀 {issue.witnessCount || 0} Confirmed
                        </button>

                        <button
                          className="db-btn"
                          onClick={() => {
                            const text = `🚨 Community Issue Reported!\n📍 ${issue.location}\n🏷️ ${issue.aiCategory}\n⚠️ ${issue.aiSeverity} Severity\n\nHelp resolve this issue on Community Hero:\nhttps://community-hero-ec722.web.app`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          style={{
                            backgroundColor: '#f0fdf4', color: '#16a34a',
                            border: '1.5px solid #86efac', padding: '0.4rem 0.9rem',
                            borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
                          }}
                        >
                          📤 Share
                        </button>

                        {isAdmin && issue.status !== 'Rejected' && (
                          <button
                            className="db-btn"
                            onClick={() => handleRejectAsFake(issue)}
                            style={{
                              backgroundColor: '#fef2f2', color: '#dc2626',
                              border: '1.5px solid #fecaca', cursor: 'pointer',
                              fontWeight: '700', fontSize: '0.82rem', borderRadius: '20px', padding: '0.4rem 0.9rem'
                            }}
                          >
                            🚫 Reject Fake
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            className="db-btn"
                            onClick={() => handleStatusUpdate(issue)}
                            style={{
                              backgroundColor: '#f0fdf4', color: getStatusColor(issue.status),
                              border: `1.5px solid ${getStatusColor(issue.status)}`, padding: '0.4rem 1rem',
                              borderRadius: '20px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem'
                            }}
                          >
                            🔄 Set {STATUS_FLOW[issue.status] || 'Reported'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN: Widgets & Community Rail ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Leaderboard Card */}
            {topHeroes.length > 0 && (
              <div className="db-panel" style={{ padding: '1.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                    🏆 Top Community Heroes
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Live Rank</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topHeroes.map((hero, idx) => (
                    <div key={hero.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '10px',
                      backgroundColor: idx === 0 ? '#fefce8' : idx === 1 ? '#f8fafc' : 'transparent',
                      border: idx === 0 ? '1px solid #fde68a' : '1px solid transparent'
                    }}>
                      <span style={{ fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      {hero.photoURL ? (
                        <img src={hero.photoURL} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0
                        }}>🦸</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {hero.displayName || 'Anonymous'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                          {hero.reportsCount || 0} reports
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: '#eff6ff', color: '#1d4ed8',
                        padding: '3px 9px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700'
                      }}>
                        ⭐ {hero.points || 0}
                      </span>
                      {hero.id === user?.uid && (
                        <span style={{
                          backgroundColor: '#dcfce7', color: '#16a34a',
                          padding: '2px 7px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '700'
                        }}>You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights Card */}
            <div className="db-panel" style={{ padding: '1.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                  🤖 AI Insights
                </h3>
                <button
                  className="db-btn"
                  onClick={async () => {
                    setInsightsLoading(true);
                    const result = await generateInsights(issues);
                    setInsights(result);
                    setInsightsLoading(false);
                  }}
                  style={{
                    backgroundColor: '#eff6ff', color: '#2563eb',
                    border: '1.5px solid #bfdbfe', padding: '0.4rem 0.9rem',
                    borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700'
                  }}
                >
                  {insightsLoading ? '⏳ Analyzing...' : '✨ Analyze'}
                </button>
              </div>

              {insightsLoading && (
                <div style={{ textAlign: 'center', padding: '1.2rem', color: '#64748b', fontSize: '0.85rem' }}>
                  🤖 AI is analyzing city patterns...
                </div>
              )}

              {insights && !insightsLoading && (
                <div>
                  <p style={{
                    backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.7rem 0.9rem',
                    borderRadius: '10px', fontSize: '0.82rem', fontWeight: '600', margin: '0 0 0.8rem', lineHeight: 1.5
                  }}>
                    📊 {insights.summary}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {insights.insights?.map((insight, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.7rem',
                        backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>{insight.icon}</span>
                        <div>
                          <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '0.82rem', color: '#0f172a' }}>
                            {insight.title}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!insights && !insightsLoading && (
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, textAlign: 'center', padding: '0.6rem 0' }}>
                  Click "Analyze" to generate AI trend and cluster reports.
                </p>
              )}
            </div>

            {/* Autonomous AI Agent Feed */}
            {agentActions.length > 0 && (
              <div className="db-panel" style={{
                backgroundColor: '#fffbeb', border: '1px solid #fde047', padding: '1.3rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <h3 style={{ margin: 0, color: '#854d0e', fontSize: '0.95rem', fontWeight: '800' }}>
                      AI Agent Activity
                    </h3>
                  </div>
                  <span style={{
                    fontSize: '0.68rem', backgroundColor: '#fde047', color: '#713f12',
                    padding: '2px 7px', borderRadius: '8px', fontWeight: '800'
                  }}>
                    LIVE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {agentActions.map(action => (
                    <div key={action.id} style={{
                      display: 'flex', gap: '0.6rem', padding: '0.55rem 0',
                      borderTop: '1px solid rgba(253, 224, 71, 0.4)'
                    }}>
                      <span style={{ fontSize: '1rem' }}>{action.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: '700', color: '#713f12', fontSize: '0.82rem' }}>
                          {action.title}
                        </p>
                        <p style={{ margin: '2px 0 0', color: '#a16207', fontSize: '0.75rem' }}>
                          {action.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ───── Detail Modal ───── */}
      {selectedIssue && (
        <div className="db-modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div
            className="db-scale-in db-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '640px', width: '100%', maxHeight: '88vh',
              overflowY: 'auto', position: 'relative', padding: 0
            }}
          >
            <button
              onClick={() => setSelectedIssue(null)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                width: '36px', height: '36px', borderRadius: '50%',
                border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', color: '#0f172a',
                fontSize: '1.2rem', cursor: 'pointer', zIndex: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              ✕
            </button>

            {selectedIssue.imageUrl && (
              <div style={{ width: '100%', height: '300px', backgroundColor: '#0f172a', overflow: 'hidden' }}>
                {selectedIssue.mediaType === 'video' ? (
                  <video src={selectedIssue.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay />
                ) : (
                  <img src={selectedIssue.imageUrl} alt="issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            )}

            <div style={{ padding: '1.8rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.3rem 0.8rem',
                  borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700'
                }}>
                  🏷️ {selectedIssue.aiCategory}
                </span>
                <span style={{
                  backgroundColor: '#fef2f2', color: getSeverityColor(selectedIssue.aiSeverity),
                  padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700'
                }}>
                  ⚠️ {selectedIssue.aiSeverity}
                </span>
                <span style={{
                  backgroundColor: '#f0fdf4', color: getStatusColor(selectedIssue.status),
                  padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700'
                }}>
                  ● {selectedIssue.status}
                </span>
              </div>

              <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' }}>
                📍 {selectedIssue.location}
              </h2>

              {selectedIssue.description && (
                <p style={{ margin: '0 0 1.2rem', color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {selectedIssue.description}
                </p>
              )}

              <p style={{ margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                Reported by <strong style={{ color: '#334155' }}>{selectedIssue.name}</strong> · 👍 {selectedIssue.upvotes || 0} upvotes
              </p>

              <StatusTimeline issue={selectedIssue} />

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  className="db-btn"
                  onClick={() => handleUpvote(selectedIssue)}
                  disabled={user?.uid === selectedIssue.reporterUid}
                  style={{
                    backgroundColor: user?.uid === selectedIssue.reporterUid ? '#f1f5f9' : '#eff6ff',
                    color: user?.uid === selectedIssue.reporterUid ? '#94a3b8' : '#2563eb',
                    border: `1.5px solid ${user?.uid === selectedIssue.reporterUid ? '#e2e8f0' : '#bfdbfe'}`,
                    padding: '0.6rem 1.4rem', borderRadius: '25px',
                    cursor: user?.uid === selectedIssue.reporterUid ? 'not-allowed' : 'pointer',
                    fontWeight: '700', fontSize: '0.9rem'
                  }}
                >
                  👍 Upvote Issue
                </button>

                {isAdmin && (
                  <button
                    className="db-btn"
                    onClick={() => handleStatusUpdate(selectedIssue)}
                    style={{
                      backgroundColor: '#f0fdf4', color: getStatusColor(selectedIssue.status),
                      border: `1.5px solid ${getStatusColor(selectedIssue.status)}`, padding: '0.6rem 1.4rem',
                      borderRadius: '25px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
                    }}
                  >
                    🔄 Advance Status to {STATUS_FLOW[selectedIssue.status] || 'Reported'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;