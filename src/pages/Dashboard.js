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

function Dashboard({ user, userStats }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

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
    return () => unsubscribe();
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

  // ---- Apply filters ----
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = categoryFilter === 'All' || issue.aiCategory === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || issue.aiSeverity === severityFilter;
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    return matchesCategory && matchesSeverity && matchesStatus;
  });

  const selectStyle = {
    padding: '0.5rem 0.8rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    fontSize: '0.9rem',
    color: '#374151',
    cursor: 'pointer'
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading issues... 🔄</p>
      </div>
    );
  }

  const myBadges = userStats
    ? getBadgesForUser(userStats.reportsCount || 0, userStats.points || 0)
    : [];

  return (

    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>📊 Community Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        {filteredIssues.length} of {issues.length} issue{issues.length !== 1 ? 's' : ''} shown
      </p>

      {user && userStats && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid #f0c040',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <p style={{ color: '#aaa', margin: 0, fontSize: '13px' }}>Your Civic Score</p>
            <h2 style={{ color: '#f0c040', margin: '4px 0', fontSize: '28px' }}>
              ⭐ {userStats.points || 0} pts
            </h2>
            <p style={{ color: '#ccc', margin: 0, fontSize: '13px' }}>
              {userStats.reportsCount || 0} issues reported
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#aaa', margin: '0 0 6px', fontSize: '13px' }}>Your Badges</p>
            {myBadges.length === 0
              ? <p style={{ color: '#888', fontSize: '13px' }}>Report your first issue to earn badges! 🌱</p>
              : myBadges.map(badge => (
                <span key={badge.name} style={{
                  background: '#0f3460', borderRadius: '8px',
                  padding: '4px 10px', fontSize: '13px', color: '#fff', marginLeft: '6px'
                }}>
                  {badge.emoji} {badge.name}
                </span>
              ))
            }
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '0.8rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        backgroundColor: '#f9fafb',
        padding: '1rem',
        borderRadius: '10px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.2rem' }}>
            Category
          </label>
          <select
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
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.2rem' }}>
            Severity
          </label>
          <select
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
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.2rem' }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            {statuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {(categoryFilter !== 'All' || severityFilter !== 'All' || statusFilter !== 'All') && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                setCategoryFilter('All');
                setSeverityFilter('All');
                setStatusFilter('All');
              }}
              style={{
                ...selectStyle,
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                fontWeight: 'bold'
              }}
            >
              ✕ Clear filters
            </button>
          </div>
        )}
      </div>

      {filteredIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem' }}>🏘️</div>
          <p style={{ color: '#6b7280' }}>
            {issues.length === 0
              ? 'No issues reported yet. Be the first to report!'
              : 'No issues match the selected filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredIssues.map(issue => (
            <div key={issue.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              gap: '1rem'
            }}>
              {/* Image */}
              {issue.imageUrl && (
                <img
                  src={issue.imageUrl}
                  alt="issue"
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
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
                  <p style={{ margin: '0 0 0.3rem', color: '#6b7280', fontSize: '0.9rem' }}>
                    {issue.description}
                  </p>
                )}
                <p style={{ margin: '0 0 0.8rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                  Reported by: {issue.name}
                </p>

                {/* Upvote + Status update */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
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
  );
}

export default Dashboard;