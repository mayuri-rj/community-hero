import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateCSRCertificate } from '../services/csrPdfService';

function IndustryDashboard({ user, userStats }) {
  const [proposals, setProposals] = useState([]);
  const [myFundings, setMyFundings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openFormFor, setOpenFormFor] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'proposals'), where('status', '==', 'Pending Funding'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProposals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'fundings'), where('company', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyFundings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const openFundForm = (propId) => {
    setOpenFormFor(propId);
    setAmount('');
  };

  const handleFund = async (proposal) => {
    if (!amount.trim()) {
      alert('Please enter an amount.');
      return;
    }
    if (!userStats?.verified) {
      alert('Your account is pending verification.');
      return;
    }
    setSubmitting(true);
    try {
      const fundingData = {
        propId: proposal.id,
        issueId: proposal.issueId,
        company: user.uid,
        companyEmail: user.email,
        amount,
        status: 'Funded',
        createdAt: serverTimestamp(),
      };
      const fundingRef = await addDoc(collection(db, 'fundings'), fundingData);

      await addDoc(collection(db, 'notifications'), {
        toUid: proposal.uniId,
        message: `💰 Your proposal has been funded (Rs. ${amount}) by ${user.email}!`,
        read: false,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'proposals', proposal.id), { status: 'Funded' });
      await updateDoc(doc(db, 'issues', proposal.issueId), {
        status: 'Funded — In Progress',
        fundedAt: serverTimestamp(),
      });

      const issueSnap = await getDoc(doc(db, 'issues', proposal.issueId));
      const issueData = issueSnap.exists() ? issueSnap.data() : null;

      generateCSRCertificate({ id: fundingRef.id, ...fundingData }, proposal, issueData);

      setOpenFormFor(null);
    } catch (err) {
      console.error('Funding error:', err);
      alert('Funding submission failed, please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="partner-page">
      <div className="partner-header"><h1>🏭 Industry Dashboard</h1></div>
      <p className="partner-subtitle">Welcome, {userStats?.orgName || user?.email}</p>

      {!userStats?.verified && (
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#92400e', fontWeight: 700, fontSize: '0.9rem' }}>
            ⏳ Pending Verification — an admin needs to approve your account before you can fund proposals.
          </p>
        </div>
      )}

      <h2 className="section-title">
        💰 My Fundings <span className="section-count">{myFundings.length}</span>
      </h2>
      {myFundings.length === 0 && <div className="empty-state">No fundings made yet.</div>}
      {myFundings.map((f) => (
        <div key={f.id} className="partner-card">
          <p><strong>Amount:</strong> {f.amount}</p>
          <span className="badge badge-green" style={{ marginTop: '0.4rem', display: 'inline-block' }}>{f.status}</span>
        </div>
      ))}

      <h2 className="section-title">
        📄 Proposals Seeking Funding <span className="section-count">{proposals.length}</span>
      </h2>
      {loading && <p>Loading...</p>}
      {!loading && proposals.length === 0 && <div className="empty-state">No proposals available right now.</div>}
      {proposals.map((p) => (
        <div key={p.id} className="partner-card">
          <p><strong>Solution:</strong> {p.solution}</p>
          <p><strong>Timeline:</strong> {p.timeline}</p>
          <p><strong>Budget requested:</strong> {p.budget}</p>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.3rem' }}>Submitted by: {p.uniEmail}</p>

          {openFormFor === p.id ? (
            <div className="pending-box">
              <input
                className="partner-input"
                type="text"
                placeholder="Funding amount (e.g. Rs. 75,000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button className="btn btn-success" onClick={() => handleFund(p)} disabled={submitting} style={{ marginRight: '0.5rem' }}>
                {submitting ? 'Submitting...' : 'Confirm Funding'}
              </button>
              <button className="btn btn-secondary" onClick={() => setOpenFormFor(null)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-danger" style={{ marginTop: '0.6rem' }} onClick={() => openFundForm(p.id)} disabled={!userStats?.verified}>
              Fund This
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default IndustryDashboard;