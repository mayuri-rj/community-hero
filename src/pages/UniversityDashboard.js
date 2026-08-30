import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { getDeptForCategory } from '../utils/departmentMapping';


function UniversityDashboard({ user, userStats }) {
  const [availableIssues, setAvailableIssues] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openFormFor, setOpenFormFor] = useState(null);
  const [solution, setSolution] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budget, setBudget] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [afterImageFile, setAfterImageFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'issues'), where('assignedTo', '==', null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAvailableIssues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'issues'), where('assignedTo', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyIssues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'proposals'), where('uniId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyProposals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAccept = async (issueId) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        assignedTo: user.uid,
        assignedUniName: user.email,
        status: 'Under University Review',
      });
    } catch (err) {
      console.error('Accept challenge error:', err);
      alert('Something went wrong, please try again.');
    }
  };

  const openProposalForm = (issueId) => {
    setOpenFormFor(issueId);
    setSolution('');
    setTimeline('');
    setBudget('');
  };

  const handleSubmitProposal = async (issueId) => {
    if (!solution.trim() || !timeline.trim() || !budget.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setSubmittingProposal(true);
    try {
      await addDoc(collection(db, 'proposals'), {
        issueId,
        uniId: user.uid,
        uniEmail: user.email,
        solution,
        timeline,
        budget,
        status: 'Pending Funding',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'issues', issueId), { status: 'Proposal Submitted' });
      setOpenFormFor(null);
    } catch (err) {
      console.error('Proposal submit error:', err);
      alert('Proposal submission failed, please try again.');
    }
    setSubmittingProposal(false);
  };

  const handleAfterImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setAfterImageFile(file);
  };

  const submitResolutionProof = async (issueId) => {
    if (!afterImageFile) {
      alert('Please select an after-photo first.');
      return;
    }
    setUploadingProof(issueId);
    try {
      const result = await uploadImageToCloudinary(afterImageFile);
      const afterImageUrl = result?.url || null;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      await updateDoc(doc(db, 'issues', issueId), {
        afterImageUrl,
        status: 'Awaiting Reporter Confirmation',
        reviewDeadline: deadline,
      });
      setAfterImageFile(null);
    } catch (err) {
      console.error('Proof upload error:', err);
      alert('Proof upload failed, please try again.');
    }
    setUploadingProof(null);
  };

  const hasProposal = (issueId) => myProposals.some((p) => p.issueId === issueId);

  const matchingIssues = availableIssues.filter(
    (issue) => getDeptForCategory(issue.aiCategory) === userStats?.specialization
  );

  return (
    <div className="partner-page">
      <div className="partner-header"><h1>🎓 University Dashboard</h1></div>
      <p className="partner-subtitle">Welcome, {user?.email}</p>

      {userStats?.specialization && (
        <p style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>
          🏛️ Department: {userStats.specialization}
        </p>
      )}

      <h2 className="section-title">
        📋 My Accepted Challenges <span className="section-count">{myIssues.length}</span>
      </h2>
      {myIssues.length === 0 && <div className="empty-state">No challenges accepted yet.</div>}
      {myIssues.map((issue) => (
        <div key={issue.id} className="partner-card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">🤖 {issue.aiCategory || 'Issue'}</span>
            <span className="badge badge-red">⚠️ {issue.aiSeverity}</span>
            <span className="badge badge-yellow">{issue.status}</span>
          </div>
          <p>{issue.description}</p>

          {hasProposal(issue.id) ? (
            <p style={{ color: '#16a34a', fontWeight: 700, marginTop: '0.6rem' }}>✅ Proposal Submitted</p>
          ) : openFormFor === issue.id ? (
            <div className="pending-box">
              <textarea
                className="partner-textarea"
                placeholder="Proposed solution — what will you do to solve this?"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={3}
              />
              <input
                className="partner-input"
                type="text"
                placeholder="Timeline (e.g. 3 months)"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
              <input
                className="partner-input"
                type="text"
                placeholder="Budget required (e.g. Rs. 50,000)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <button className="btn btn-success" onClick={() => handleSubmitProposal(issue.id)} disabled={submittingProposal} style={{ marginRight: '0.5rem' }}>
                {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
              </button>
              <button className="btn btn-secondary" onClick={() => setOpenFormFor(null)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-purple" style={{ marginTop: '0.6rem' }} onClick={() => openProposalForm(issue.id)}>
              Submit Proposal
            </button>
          )}

          {issue.status === 'Funded — In Progress' && (
            <div className="proof-box">
              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>📸 Upload proof photo to mark this resolved:</p>
              <input type="file" accept="image/*" onChange={handleAfterImageChange} style={{ marginBottom: '0.6rem' }} />
              <br />
              <button className="btn btn-orange" onClick={() => submitResolutionProof(issue.id)} disabled={uploadingProof === issue.id}>
                {uploadingProof === issue.id ? 'Uploading...' : 'Submit Resolution Proof'}
              </button>
            </div>
          )}

          {issue.status === 'Awaiting Reporter Confirmation' && (
            <p style={{ color: '#d97706', fontWeight: 700, marginTop: '0.6rem' }}>⏳ Awaiting reporter confirmation</p>
          )}
        </div>
      ))}

      <h2 className="section-title">
        🔍 Available Challenges <span className="section-count">{matchingIssues.length}</span>
      </h2>
      {loading && <p>Loading...</p>}
      {!loading && matchingIssues.length === 0 && (
        <div className="empty-state">No open challenges match your department right now.</div>
      )}
      {matchingIssues.map((issue) => (
        <div key={issue.id} className="partner-card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">🤖 {issue.aiCategory || 'Issue'}</span>
            <span className="badge badge-red">⚠️ {issue.aiSeverity}</span>
          </div>
          <p>{issue.description}</p>
          <button className="btn btn-primary" style={{ marginTop: '0.6rem' }} onClick={() => handleAccept(issue.id)} disabled={!userStats?.verified}>
            Express Interest & Accept
          </button>
        </div>
      ))}
    </div>
  );
}

export default UniversityDashboard;