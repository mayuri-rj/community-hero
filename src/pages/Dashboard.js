import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, orderBy, query, doc, updateDoc, increment } from 'firebase/firestore';

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const issuesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIssues(issuesList);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
    setLoading(false);
  };

  const handleUpvote = async (issueId) => {
    try {
      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, {
        upvotes: increment(1)
      });
      fetchIssues();
    } catch (error) {
      console.error('Upvote error:', error);
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading issues... 🔄</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>📊 Community Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        {issues.length} issue{issues.length !== 1 ? 's' : ''} reported in your community
      </p>

      {issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem' }}>🏘️</div>
          <p style={{ color: '#6b7280' }}>No issues reported yet. Be the first to report!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {issues.map(issue => (
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

                {/* Upvote */}
                <button
                  onClick={() => handleUpvote(issue.id)}
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  👍 {issue.upvotes || 0} Upvotes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;