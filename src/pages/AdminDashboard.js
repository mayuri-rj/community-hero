import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function AdminDashboard() {
  const [pendingPartners, setPendingPartners] = useState([]);
  const [uniRankings, setUniRankings] = useState([]);
  const [industryRankings, setIndustryRankings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="partner-page">
      <div className="partner-header"><h1>👑 Admin Dashboard</h1></div>
      <p className="partner-subtitle">Partner verification & platform analytics</p>

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