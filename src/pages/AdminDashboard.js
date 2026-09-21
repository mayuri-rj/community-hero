import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getDeptForCategory, DEPARTMENTS } from '../utils/departmentMapping';


function AdminDashboard() {
  const [pendingPartners, setPendingPartners] = useState([]);
  const [uniRankings, setUniRankings] = useState([]);
  const [industryRankings, setIndustryRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptStats, setDeptStats] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [pendingIssues, setPendingIssues] = useState([]);
  // Pending verification list
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('verified', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === 'university' || u.role === 'industry');
      setPendingPartners(list);
    });
    return () => unsubscribe();
  }, []);

  // Rankings — computed once on load from proposals + fundings + users
  useEffect(() => {
    const computeRankings = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = {};
      usersSnap.docs.forEach((d) => {
        usersMap[d.id] = d.data();
      });

      // University ranking: count of funded proposals per uniId
      const proposalsSnap = await getDocs(
        query(collection(db, 'proposals'), where('status', '==', 'Funded'))
      );
      const uniCounts = {};
      proposalsSnap.docs.forEach((d) => {
        const uniId = d.data().uniId;
        uniCounts[uniId] = (uniCounts[uniId] || 0) + 1;
      });
      const uniList = Object.entries(uniCounts)
        .map(([uid, count]) => ({
          name: usersMap[uid]?.orgName || usersMap[uid]?.displayName || 'Unknown University',
          count,
        }))
        .sort((a, b) => b.count - a.count);
      setUniRankings(uniList);

      // Industry ranking: total amount funded per company
      const fundingsSnap = await getDocs(collection(db, 'fundings'));
      const industryTotals = {};
      fundingsSnap.docs.forEach((d) => {
        const company = d.data().company;
        const amt = parseFloat(String(d.data().amount).replace(/[^0-9.]/g, '')) || 0;
        industryTotals[company] = (industryTotals[company] || 0) + amt;
      });
      const industryList = Object.entries(industryTotals)
        .map(([uid, total]) => ({
          name: usersMap[uid]?.orgName || usersMap[uid]?.displayName || 'Unknown Industry',
          total,
        }))
        .sort((a, b) => b.total - a.total);
      setIndustryRankings(industryList);

      // Domain-wise distribution + completion rate
      const issuesSnap = await getDocs(collection(db, 'issues'));
      const allIssues = issuesSnap.docs.map((d) => d.data());

      const deptCounts = {};
      DEPARTMENTS.forEach((dept) => { deptCounts[dept] = { total: 0, resolved: 0 }; });

      allIssues.forEach((issue) => {
        const dept = getDeptForCategory(issue.aiCategory);
        if (!deptCounts[dept]) deptCounts[dept] = { total: 0, resolved: 0 };
        deptCounts[dept].total += 1;
        if (issue.status === 'Resolved') deptCounts[dept].resolved += 1;
      });

      const deptStatsArray = Object.entries(deptCounts)
        .filter(([, v]) => v.total > 0)
        .map(([dept, v]) => ({ dept, ...v }));
      setDeptStats(deptStatsArray);

      const totalResolved = allIssues.filter((i) => i.status === 'Resolved').length;
      setCompletionRate(allIssues.length > 0 ? Math.round((totalResolved / allIssues.length) * 100) : 0);

      setLoading(false);
    };
    computeRankings();
  }, []);

  const handleVerify = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { verified: true });
    } catch (err) {
      console.error('Verify error:', err);
      alert('Could not verify this account, please try again.');
    }
  };
  // Pending Review issues fetch karo
  useEffect(() => {
    const q = query(
      collection(db, 'issues'),
      where('status', '==', 'Pending Review')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingIssues(issues);
    });
    return () => unsub();
  }, []);

  const handleApproveIssue = async (issueId) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status: 'Reported',
        pendingReview: false
      });
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleRejectIssue = async (issueId) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status: 'Rejected',
        pendingReview: false
      });
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  return (
    <div className="partner-page">
      <div className="partner-header"><h1>🏛️ Government Department Dashboard</h1></div>
      <p className="partner-subtitle">Department of Higher & Technical Education — Partner verification & platform analytics</p>

      <h2 className="section-title">
        ⏳ Pending Verification <span className="section-count">{pendingPartners.length}</span>
      </h2>
      {pendingPartners.length === 0 && <div className="empty-state">No accounts awaiting verification.</div>}
      {pendingPartners.map((p) => (
        <div key={p.id} className="partner-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <p style={{ fontWeight: 700 }}>{p.orgName || 'Unnamed Organization'}</p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {p.role === 'university' ? '🎓 University' : '🏭 Industry'} · {p.displayName}
              {p.specialization && ` · ${p.specialization}`}
            </p>
          </div>
          <button className="btn btn-success" onClick={() => handleVerify(p.id)}>
            ✅ Verify
          </button>
        </div>
      ))}

      <h2 className="section-title">
        📋 Pending Review Issues <span className="section-count">{pendingIssues.length}</span>
      </h2>
      {pendingIssues.length === 0 && (
        <div className="empty-state">No issues pending review.</div>
      )}
      {pendingIssues.map((issue) => (
        <div key={issue.id} className="partner-card" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.6rem'
        }}>

          {/* Photo/Video — visual proof for admin to judge authenticity */}
          {issue.imageUrl && (
            <div style={{ width: '120px', height: '120px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
              {issue.mediaType === 'video' ? (
                <video src={issue.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop />
              ) : (
                <img src={issue.imageUrl} alt="issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, margin: '0 0 4px' }}>
              📍 {issue.location}
            </p>

            {issue.lat && issue.lng && (
              <p style={{ fontSize: '0.75rem', margin: '0 0 4px' }}>
                <a
                  href={`https://www.google.com/maps?q=${issue.lat},${issue.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb' }}
                >
                  🗺️ View exact location on map ({issue.lat.toFixed(4)}, {issue.lng.toFixed(4)})
                </a>
              </p>
            )}

            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 4px' }}>
              {issue.aiCategory} · {issue.aiSeverity} severity
            </p>
            <p style={{ fontSize: '0.85rem', color: '#374151', margin: '0 0 4px' }}>
              {issue.description || 'No description provided'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
              Reported by {issue.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              className="btn btn-success"
              onClick={() => handleApproveIssue(issue.id)}
            >
              ✅ Approve
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleRejectIssue(issue.id)}
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 600 }}
            >
              🚫 Reject
            </button>
          </div>
        </div>
      ))}

      <h2 className="section-title">📊 Overall Completion Rate</h2>
      <div className="partner-card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#16a34a', margin: 0 }}>{completionRate}%</p>
        <p style={{ color: '#6b7280', margin: 0 }}>of reported issues resolved</p>
      </div>

      <h2 className="section-title">🧭 Domain-wise Distribution</h2>
      {deptStats.length === 0 && <div className="empty-state">No data yet.</div>}
      {deptStats.map((d) => (
        <div key={d.dept} className="partner-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{d.dept}</span>
          <span className="badge badge-blue">{d.total} reported · {d.resolved} resolved</span>
        </div>
      ))}

      <h2 className="section-title">🏆 Top Universities (by challenges resolved)</h2>
      {loading && <p>Loading rankings...</p>}
      {!loading && uniRankings.length === 0 && <div className="empty-state">No data yet.</div>}
      {uniRankings.map((u, i) => (
        <div key={i} className="partner-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{i + 1}. {u.name}</span>
          <span className="badge badge-blue">{u.count} funded</span>
        </div>
      ))}

      <h2 className="section-title">💰 Top Industries (by amount funded)</h2>
      {!loading && industryRankings.length === 0 && <div className="empty-state">No data yet.</div>}
      {industryRankings.map((c, i) => (
        <div key={i} className="partner-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{i + 1}. {c.name}</span>
          <span className="badge badge-green">Rs. {c.total.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;