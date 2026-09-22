import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getDeptForCategory, DEPARTMENTS } from '../utils/departmentMapping';

// Government portal professional color palette
const GOV = {
  primary: '#0d47a1',
  primaryLight: '#1565c0',
  primaryDark: '#0a3d9e',
  secondary: '#1976d2',
  accent: '#2196f3',
  success: '#2e7d32',
  successLight: '#388e3c',
  warning: '#ed6c02',
  warningLight: '#f57c00',
  error: '#c62828',
  bg: '#f0f4f8',
  surface: '#ffffff',
  textPrimary: '#1a237e',
  textSecondary: '#455a64',
  textMuted: '#78909c',
  border: '#c5cae9',
  cardShadow: '0 2px 8px rgba(13, 71, 161, 0.08)',
  cardShadowHover: '0 8px 24px rgba(13, 71, 161, 0.14)',
};

// Professional government header component
const GovHeader = ({ title, subtitle }) => (
  <div style={{
    background: `linear-gradient(135deg, ${GOV.primary} 0%, ${GOV.primaryLight} 50%, ${GOV.secondary} 100%)`,
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 32px rgba(13, 71, 161, 0.25)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Decorative pattern overlay */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.08) 0%, transparent 40%)',
      pointerEvents: 'none'
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: 800,
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            letterSpacing: '-0.5px'
          }}>
            🏛️ {title}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: '1.05rem',
            marginTop: '0.5rem',
            fontWeight: 400,
            maxWidth: '600px',
            lineHeight: 1.5
          }}>
            {subtitle}
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>
            Portal Status
          </div>
          <div style={{ color: '#81c784', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', background: '#81c784', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Active & Online
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Government stat card
const GovStatCard = ({ title, value, color, icon, subtitle }) => (
  <div style={{
    background: GOV.surface,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: GOV.cardShadow,
    border: `1px solid ${color}25`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '100px',
      height: '100px',
      background: `${color}08`,
      borderRadius: '50%',
      transform: 'translate(35%, -35%)'
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
      <div>
        <div style={{ color: color, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: GOV.textPrimary, lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ color: GOV.textMuted, fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 500 }}>{subtitle}</div>
        )}
      </div>
      <div style={{ fontSize: '2.2rem', opacity: 0.15 }}>{icon}</div>
    </div>
  </div>
);

// Professional section title
const SectionTitle = ({ children, count }) => (
  <h2 style={{
    fontSize: '1.2rem',
    fontWeight: 700,
    color: GOV.textPrimary,
    margin: '2.5rem 0 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingLeft: '0.85rem',
    borderLeft: `4px solid ${GOV.primary}`,
    lineHeight: 1.3
  }}>
    {children}
    {count !== undefined && (
      <span style={{
        background: GOV.primary,
        color: 'white',
        fontSize: '0.8rem',
        fontWeight: 700,
        padding: '0.15rem 0.7rem',
        borderRadius: '999px'
      }}>
        {count}
      </span>
    )}
  </h2>
);

// Government empty state
const GovEmptyState = ({ message, subMessage }) => (
  <div style={{
    background: GOV.surface,
    borderRadius: '14px',
    padding: '3rem 2rem',
    textAlign: 'center',
    boxShadow: GOV.cardShadow,
    border: `2px dashed ${GOV.border}`
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>📭</div>
    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: GOV.textPrimary, margin: '0 0 0.4rem' }}>{message}</p>
    {subMessage && <p style={{ fontSize: '0.9rem', color: GOV.textMuted, margin: 0 }}>{subMessage}</p>}
  </div>
);

// Professional ranking list
const RankingList = ({ title, data, color, unit }) => (
  <div style={{
    background: GOV.surface,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: GOV.cardShadow,
    border: `1px solid ${color}20`
  }}>
    <h3 style={{
      fontSize: '1.1rem',
      fontWeight: 700,
      color: GOV.textPrimary,
      margin: '0 0 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem'
    }}>
      <span style={{ width: '4px', height: '22px', background: color, borderRadius: '2px', display: 'inline-block' }} />
      {title}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: i % 2 === 0 ? GOV.bg : 'transparent',
            borderRadius: '8px',
            border: `1px solid ${GOV.border}30`,
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: i === 0 ? '#ffd600' : i === 1 ? '#b0bec5' : i === 2 ? '#ff8a65' : color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: '0.9rem', color: GOV.textPrimary, fontWeight: 500 }}>{item.name}</span>
          </div>
          <span style={{
            background: `${color}15`,
            color: color,
            padding: '0.25rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {item.count || item.total}{unit}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Pending partner verification card
const PartnerCard = ({ partner }) => (
  <div style={{
    background: GOV.surface,
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: GOV.cardShadow,
    border: `1px solid ${GOV.warning}25`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${GOV.warning}15, ${GOV.warning}30)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        flexShrink: 0
      }}>
        ⏳
      </div>
      <div>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: GOV.textPrimary, margin: 0, marginBottom: '0.2rem' }}>
          {partner.orgName || 'Unnamed Organization'}
        </p>
        <p style={{ fontSize: '0.82rem', color: GOV.textSecondary, margin: 0 }}>
          {partner.role === 'university' ? '🎓 University' : '🏭 Industry'} · {partner.displayName}
          {partner.specialization && ` · ${partner.specialization}`}
        </p>
      </div>
    </div>
    <button
      className="btn btn-success"
      onClick={() => partner.handleVerify && partner.handleVerify(partner.id)}
      style={{
        background: `linear-gradient(135deg, ${GOV.success}, ${GOV.successLight})`,
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        padding: '0.6rem 1.4rem',
        fontWeight: 700,
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        boxShadow: `0 2px 8px ${GOV.success}40`
      }}
    >
      ✅ Verify
    </button>
  </div>
);

// Pending review issue card
const IssueReviewCard = ({ issue }) => (
  <div style={{
    background: GOV.surface,
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: GOV.cardShadow,
    border: `1px solid ${GOV.primaryLight}20`,
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    transition: 'all 0.3s ease'
  }}>
    {/* Media thumbnail */}
    {issue.imageUrl && (
      <div style={{
        width: '140px',
        height: '140px',
        borderRadius: '10px',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }}>
        {issue.mediaType === 'video' ? (
          <video src={issue.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop />
        ) : (
          <img src={issue.imageUrl} alt="Issue evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
    )}

    <div style={{ flex: 1, minWidth: '200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: GOV.textPrimary, margin: 0 }}>
            📍 {issue.location}
          </p>
          {issue.lat && issue.lng && (
            <a
              href={`https://www.google.com/maps?q=${issue.lat},${issue.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: GOV.primaryLight, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
            >
              🗺️ View exact location ({issue.lat.toFixed(4)}, {issue.lng.toFixed(4)})
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={() => issue.handleApprove && issue.handleApprove(issue.id)}
            style={{
              background: `linear-gradient(135deg, ${GOV.success}, ${GOV.successLight})`,
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            ✅ Approve
          </button>
          <button
            onClick={() => issue.handleReject && issue.handleReject(issue.id)}
            style={{
              background: `linear-gradient(135deg, ${GOV.error}, #b71c1c)`,
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            🚫 Reject
          </button>
        </div>
      </div>

      <div style={{
        background: GOV.bg,
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '0.5rem'
      }}>
        <p style={{ fontSize: '0.85rem', color: GOV.textSecondary, margin: 0 }}>
          <strong style={{ color: GOV.textPrimary }}>{issue.aiCategory}</strong> · {issue.aiSeverity} severity
        </p>
        <p style={{ fontSize: '0.85rem', color: GOV.textSecondary, margin: '0.2rem 0 0' }}>
          {issue.description || 'No description provided'}
        </p>
      </div>

      <p style={{ fontSize: '0.78rem', color: GOV.textMuted, margin: 0 }}>
        Reported by {issue.name}
      </p>
    </div>
  </div>
);

// Completion rate with circular progress
const CompletionDisplay = ({ rate }) => (
  <div style={{
    background: GOV.surface,
    borderRadius: '14px',
    padding: '2.5rem',
    boxShadow: GOV.cardShadow,
    border: `1px solid ${GOV.success}25`,
    textAlign: 'center',
    display: 'inline-block',
    width: '100%'
  }}>
    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 1.25rem' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r="60" fill="none" stroke={GOV.bg} strokeWidth="10" />
        <circle
          cx="70" cy="70" r="60" fill="none"
          stroke={GOV.success} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${rate * 3.77} ${377 - rate * 3.77}`}
          style={{ transition: 'stroke-dasharray 1.2s ease-in-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '2.2rem',
        fontWeight: 800,
        color: GOV.success
      }}>
        {rate}%
      </div>
    </div>
    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: GOV.textPrimary, margin: '0 0 0.3rem' }}>
      Overall Completion Rate
    </h3>
    <p style={{ fontSize: '0.9rem', color: GOV.textMuted, margin: 0 }}>of reported issues resolved</p>
  </div>
);

// Department stats component
const DeptStatsList = ({ stats }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    {stats.map((d, i) => (
      <div
        key={d.dept}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 1.1rem',
          background: i % 2 === 0 ? GOV.bg : 'transparent',
          borderRadius: '10px',
          border: `1px solid ${GOV.primaryLight}15`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>📂</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: GOV.textPrimary }}>{d.dept}</span>
        </div>
        <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
          {d.total} reported · {d.resolved} resolved
        </span>
      </div>
    ))}
  </div>
);


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
    const q = query(collection(db, 'users'), where('verified', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === 'university' || u.role === 'industry');
      setPendingPartners(list);
    });
    return () => unsubscribe();
  }, []);

  // Rankings and analytics
  useEffect(() => {
    const computeRankings = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = {};
      usersSnap.docs.forEach((d) => { usersMap[d.id] = d.data(); });

      const proposalsSnap = await getDocs(query(collection(db, 'proposals'), where('status', '==', 'Funded')));
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

  // Pending Review issues
  useEffect(() => {
    const q = query(collection(db, 'issues'), where('status', '==', 'Pending Review'));
    const unsub = onSnapshot(q, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingIssues(issues);
    });
    return () => unsub;
  }, []);

  const handleVerify = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { verified: true });
    } catch (err) {
      console.error('Verify error:', err);
      alert('Could not verify this account, please try again.');
    }
  };

  const handleApproveIssue = async (issueId) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), { status: 'Reported', pendingReview: false });
    } catch (err) { console.error('Approve error:', err); }
  };

  const handleRejectIssue = async (issueId) => {
    try {
      await updateDoc(doc(db, 'issues', issueId), { status: 'Rejected', pendingReview: false });
    } catch (err) { console.error('Reject error:', err); }
  };

  return (
    <div className="partner-page" style={{ maxWidth: '1200px' }}>
      {/* Government Portal Header */}
      <GovHeader
        title="Government Department Dashboard"
        subtitle="Department of Higher & Technical Education — Partner verification & platform analytics"
      />

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <GovStatCard
          title="Pending Verifications"
          value={pendingPartners.length}
          color={GOV.warning}
          icon="⏳"
          subtitle="Accounts awaiting approval"
        />
        <GovStatCard
          title="Universities Ranked"
          value={uniRankings.length}
          color={GOV.primaryLight}
          icon="🏛️"
          subtitle="By challenges resolved"
        />
        <GovStatCard
          title="Industries Ranked"
          value={industryRankings.length}
          color={GOV.success}
          icon="🏭"
          subtitle="By funding amount"
        />
        <GovStatCard
          title="Domain Categories"
          value={deptStats.length}
          color={GOV.error}
          icon="📊"
          subtitle="Technical domains"
        />
      </div>

      {/* Pending Verification Section */}
      <SectionTitle count={pendingPartners.length}>⏳ Pending Verification</SectionTitle>
      {pendingPartners.length === 0 && (
        <GovEmptyState message="No accounts awaiting verification." subMessage="All new registrations have been processed." />
      )}
      {pendingPartners.map((p) => (
        <div key={p.id} style={{ marginBottom: '0.75rem' }}>
          <PartnerCard partner={{ ...p, handleVerify }} />
        </div>
      ))}

      {/* Pending Review Issues */}
      <SectionTitle count={pendingIssues.length}>📋 Pending Review Issues</SectionTitle>
      {pendingIssues.length === 0 && (
        <GovEmptyState message="No issues pending review." subMessage="All submitted issues have been processed." />
      )}
      {pendingIssues.map((issue) => (
        <div key={issue.id} style={{ marginBottom: '0.75rem' }}>
          <IssueReviewCard issue={{ ...issue, handleApprove: handleApproveIssue, handleReject: handleRejectIssue }} />
        </div>
      ))}

      {/* Overall Completion Rate */}
      <SectionTitle>📊 Overall Completion Rate</SectionTitle>
      <div style={{ maxWidth: '400px' }}>
        <CompletionDisplay rate={completionRate} />
      </div>

      {/* Domain-wise Distribution */}
      <SectionTitle>🧭 Domain-wise Distribution</SectionTitle>
      {deptStats.length === 0 && (
        <GovEmptyState message="No data yet." subMessage="Statistics will appear once issues are reported." />
      )}
      <DeptStatsList stats={deptStats} />

      {/* Top Universities */}
      <SectionTitle>🏆 Top Universities (by challenges resolved)</SectionTitle>
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: GOV.textMuted }}>Loading rankings...</div>
      )}
      {!loading && uniRankings.length === 0 && (
        <GovEmptyState message="No data yet." subMessage="University rankings will appear once funding is completed." />
      )}
      <div style={{ marginTop: '0.75rem' }}>
        <RankingList title="Top Universities" data={uniRankings} color={GOV.primaryLight} unit="" />
      </div>

      {/* Top Industries */}
      <SectionTitle>💰 Top Industries (by amount funded)</SectionTitle>
      {!loading && industryRankings.length === 0 && (
        <GovEmptyState message="No data yet." subMessage="Industry rankings will appear once funding is completed." />
      )}
      <div style={{ marginTop: '0.75rem' }}>
        <RankingList title="Top Industries" data={industryRankings} color={GOV.success} unit="" />
      </div>
    </div>
  );
}

export default AdminDashboard;