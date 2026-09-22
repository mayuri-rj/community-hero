import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateCSRCertificate } from '../services/csrPdfService';




// Reuse University Portal Design System - Official Academic
const UNIV = {
  primary: '#1a237e',
  primaryLight: '#283593',
  primaryDark: '#0d1b5e',
  secondary: '#3949ab',
  accent: '#5c6bc0',
  gold: '#ffd54f',
  success: '#2e7d32',
  successLight: '#388e3c',
  warning: '#e65100',
  warningLight: '#f57c00',
  info: '#01579b',
  bgGradient: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
  cardBg: '#ffffff',
  surface: '#ffffff',
  textPrimary: '#1a237e',
  textSecondary: '#37474f',
  textMuted: '#546e7a',
  border: '#c5cae9',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  shadowHover: '0 8px 40px rgba(0, 0, 0, 0.15)',
  goldGradient: 'linear-gradient(135deg, #ffd54f, #ffb300)',
};

// Professional University Header (reused for Industry Portal)
const UnivHeader = ({ user, userStats }) => (
  <header style={{
    background: `linear-gradient(135deg, ${UNIV.primary} 0%, ${UNIV.primaryLight} 50%, ${UNIV.secondary} 100%)`,
    borderRadius: '20px',
    padding: '3rem 2.5rem',
    marginBottom: '3rem',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,213,79,0.1) 0%, transparent 40%)',
      pointerEvents: 'none'
    }} />

    <div style={{ position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <span style={{ fontSize: '2.2rem' }}>🏭</span>
            </div>
            <div>
              <h1 style={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: 900,
                margin: 0,
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                letterSpacing: '-1px',
                textTransform: 'uppercase'
              }}>
                Industry Portal
              </h1>
              <div style={{
                width: '80px',
                height: '4px',
                background: UNIV.goldGradient,
                marginTop: '0.75rem',
                borderRadius: '2px'
              }} />
            </div>
          </div>
          <h2 style={{
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '1.3rem',
            fontWeight: 600,
            margin: '1rem 0 0',
            lineHeight: 1.4,
            maxWidth: '600px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Department of Higher & Technical Education
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '1rem',
            marginTop: '0.75rem',
            lineHeight: 1.6,
            maxWidth: '700px',
            fontStyle: 'italic'
          }}>
            Welcome, {userStats?.orgName || user?.email} — Review and fund student proposals
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          minWidth: '180px'
        }}>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '0.5rem'
          }}>
            Industry Status
          </div>
          <div style={{
            color: userStats?.verified ? '#81c784' : '#ffb74d',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: userStats?.verified ? '#81c784' : '#ffb74d',
              borderRadius: '50%',
              boxShadow: `0 0 10px ${userStats?.verified ? '#81c784' : '#ffb74d'}`
            }} />
            {userStats?.verified ? 'Verified Industry' : 'Pending Verification'}
          </div>
          {userStats?.orgName && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              marginTop: '0.75rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              🏭 {userStats.orgName}
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);

// Professional University Stat Cards (reused)
const UnivStatCard = ({ title, value, color, icon, subtitle }) => (
  <div style={{
    background: UNIV.cardBg,
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: UNIV.shadow,
    border: `2px solid ${color}20`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '120px',
      height: '120px',
      background: `${color}08`,
      borderRadius: '50%',
      transform: 'translate(35%, -35%)'
    }} />

    <div style={{ position: 'relative', zIndex: 2 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{
            color: color,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '0.5rem',
            fontFamily: 'Monaco, monospace'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: UNIV.textPrimary,
            lineHeight: 1,
            marginBottom: '0.25rem'
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{
              color: UNIV.textMuted,
              fontSize: '0.8rem',
              marginTop: '0.5rem',
              fontWeight: 500,
              lineHeight: 1.3
            }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{
          fontSize: '2.5rem',
          opacity: 0.12,
          filter: 'grayscale(100%)',
          transition: 'all 0.3s ease'
        }}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

// University Section Headers (reused)
const UnivSectionHeader = ({ children, icon, count }) => (
  <div style={{
    margin: '3rem 0 1.5rem',
    paddingBottom: '1rem',
    borderBottom: `3px solid ${UNIV.primary}`,
    position: 'relative'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.5rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        background: `linear-gradient(135deg, ${UNIV.primary}, ${UNIV.primaryLight})`,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: `0 4px 12px ${UNIV.primary}40`
      }}>
        {icon}
      </div>
      <h2 style={{
        fontSize: '1.4rem',
        fontWeight: 800,
        color: UNIV.textPrimary,
        margin: 0,
        letterSpacing: '-0.5px'
      }}>
        {children}
      </h2>
      {count !== undefined && (
        <div style={{
          background: `linear-gradient(135deg, ${UNIV.primary}, ${UNIV.secondary})`,
          color: 'white',
          fontSize: '0.9rem',
          fontWeight: 700,
          padding: '0.25rem 0.8rem',
          borderRadius: '999px',
          marginLeft: 'auto',
          boxShadow: `0 2px 8px ${UNIV.primary}40`
        }}>
          {count}
        </div>
      )}
    </div>
  </div>
);

// University Empty State (reused)
const UnivEmptyState = ({ icon, title, message, subtext }) => (
  <div style={{
    background: UNIV.cardBg,
    borderRadius: '16px',
    padding: '4rem 2rem',
    textAlign: 'center',
    boxShadow: UNIV.shadow,
    border: `2px dashed ${UNIV.border}`,
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: `linear-gradient(90deg, ${UNIV.bgGradient})`,
      opacity: 0.6
    }} />
    <div style={{ position: 'relative', zIndex: 2 }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '1.5rem',
        opacity: 0.4,
        filter: 'grayscale(100%)'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: UNIV.textPrimary,
        margin: '0 0 0.75rem',
        letterSpacing: '-0.5px'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '1.1rem',
        color: UNIV.textSecondary,
        margin: '0 0 0.5rem',
        maxWidth: '400px',
        margin: '0 auto 0.5rem'
      }}>
        {message}
      </p>
      {subtext && (
        <p style={{
          fontSize: '0.95rem',
          color: UNIV.textMuted,
          margin: 0,
          fontStyle: 'italic'
        }}>
          {subtext}
        </p>
      )}
    </div>
  </div>
);

// University Issue Card (reused for Proposal Card)
const UnivProposalCard = ({ proposal, onFund, onOpenFund, openFormFor, isVerified }) => {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFund = async () => {
    if (!amount.trim()) {
      alert('Please enter an amount.');
      return;
    }
    if (!isVerified) {
      alert('Your account is pending verification.');
      return;
    }

    try {
      await onFund(proposal, amount);
      setAmount('');
      onOpenFund(null);
    } catch (err) {
      console.error('Funding error:', err);
      alert('Funding submission failed, please try again.');
    }
  };

  return (
    <div style={{
      background: UNIV.cardBg,
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: UNIV.shadow,
      border: `1px solid ${UNIV.border}40`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: `linear-gradient(135deg, ${UNIV.success}, ${UNIV.successLight})`
      }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Proposal Info */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{
            background: `${UNIV.success}15`,
            color: UNIV.success,
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: `1px solid ${UNIV.success}30`
          }}>
            📄 {proposal.status || 'Pending Funding'}
          </span>
          <span style={{
            background: `${UNIV.primary}10`,
            color: UNIV.primary,
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: `1px solid ${UNIV.primary}20`
          }}>
            🎓 University Proposal
          </span>
        </div>

        {/* Proposal Details */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.95rem', color: UNIV.textSecondary, lineHeight: 1.5, margin: '0 0 0.4rem', fontWeight: 500 }}>
            <strong style={{ color: UNIV.textPrimary }}>Solution:</strong> {proposal.solution || 'No description'}
          </p>
          <p style={{ fontSize: '0.9rem', color: UNIV.textMuted, margin: '0 0 0.4rem' }}>
            <strong style={{ color: UNIV.textSecondary }}>Timeline:</strong> {proposal.timeline || 'Not specified'}
          </p>
          <p style={{ fontSize: '0.9rem', color: UNIV.textMuted, margin: '0 0 0.4rem' }}>
            <strong style={{ color: UNIV.textSecondary }}>Budget:</strong> {proposal.budget || 'Not specified'}
          </p>
          <p style={{ fontSize: '0.85rem', color: UNIV.textMuted, margin: '0 0 0.4rem' }}>
            <strong style={{ color: UNIV.textSecondary }}>Submitted by:</strong> {proposal.uniEmail || 'Unknown'}
          </p>
          {proposal.teamMembers && (
            <p style={{ fontSize: '0.85rem', color: UNIV.textMuted, margin: '0 0 0.4rem' }}>
              <strong style={{ color: UNIV.textSecondary }}>Team:</strong> {proposal.teamMembers}
            </p>
          )}
          {proposal.facultyMentor && (
            <p style={{ fontSize: '0.85rem', color: UNIV.textMuted, margin: '0 0 0.4rem' }}>
              <strong style={{ color: UNIV.textSecondary }}>Faculty Mentor:</strong> {proposal.facultyMentor}
              {proposal.mentorDesignation ? ` (${proposal.mentorDesignation})` : ''}
            </p>
          )}
          {proposal.expectedDeliverables && (
            <p style={{ fontSize: '0.85rem', color: UNIV.textMuted, margin: 0 }}>
              <strong style={{ color: UNIV.textSecondary }}>Expected Deliverables:</strong> {proposal.expectedDeliverables}
            </p>
          )}
        </div>

        {/* Fund Button / Form */}
        {openFormFor === proposal.id ? (
          <div style={{
            marginTop: '1rem',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: UNIV.textPrimary }}>
              💰 Confirm Funding Amount
            </h4>
            <input
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                boxSizing: 'border-box'
              }}
              type="text"
              placeholder="Funding amount (e.g. Rs. 75,000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                style={{
                  background: `linear-gradient(135deg, ${UNIV.success}, ${UNIV.successLight})`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: `0 2px 8px ${UNIV.success}40`
                }}
                onClick={handleFund}
                disabled={submitting}
              >
                {submitting ? 'Funding...' : 'Confirm Funding'}
              </button>
              <button
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
                onClick={() => onOpenFund(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            style={{
              background: `linear-gradient(135deg, ${UNIV.primary}, ${UNIV.primaryLight})`,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 1.5rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: `0 2px 8px ${UNIV.primary}40`,
              transition: 'all 0.3s ease',
              marginTop: '0.6rem'
            }}
            onClick={() => onOpenFund(proposal.id)}
            disabled={!isVerified}
          >
            💰 Fund This Proposal
          </button>
        )}
      </div>
    </div>
  );
};


function IndustryDashboard({ user, userStats }) {
  const [proposals, setProposals] = useState([]);
  const [myFundings, setMyFundings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [openFormFor, setOpenFormFor] = useState(null);


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

  const handleFund = async (proposal, fundAmount) => {
    if (!fundAmount || !fundAmount.trim()) {
      alert('Please enter an amount.');
      return;
    }
    if (!userStats?.verified) {
      alert('Your account is pending verification.');
      return;
    }

    try {
      const fundingData = {
        propId: proposal.id,
        proposalSummary: (proposal.solution || 'Untitled proposal').slice(0, 60),
        issueId: proposal.issueId,
        company: user.uid,
        companyEmail: user.email,
        amount: fundAmount,
        status: 'Funded',
        createdAt: serverTimestamp(),
      };
      const fundingRef = await addDoc(collection(db, 'fundings'), fundingData);

      await addDoc(collection(db, 'notifications'), {
        toUid: proposal.uniId,
        message: `💰 Your proposal has been funded (Rs. ${fundAmount}) by ${user.email}!`,
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

    } catch (err) {
      console.error('Funding error:', err);
      alert('Funding submission failed, please try again.');
    }
  };

  return (
    <div style={{
      background: UNIV.bgGradient,
      minHeight: '100vh',
      paddingTop: '2rem',
      paddingBottom: '2rem',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        padding: '0 2rem',
        boxSizing: 'border-box'
      }}>
        {/* Official Industry Header */}
        <UnivHeader user={user} userStats={userStats} />

        {/* Quick Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <UnivStatCard
            title="My Fundings"
            value={myFundings.length}
            color={UNIV.success}
            icon="💰"
            subtitle="Proposals you have funded"
          />
          <UnivStatCard
            title="Pending Proposals"
            value={proposals.length}
            color={UNIV.warning}
            icon="📄"
            subtitle="Awaiting your funding decision"
          />
          <UnivStatCard
            title="Verification"
            value={userStats?.verified ? '✅' : '⏳'}
            color={userStats?.verified ? UNIV.success : UNIV.warning}
            icon="🏭"
            subtitle={userStats?.verified ? 'Verified Industry' : 'Pending Verification'}
          />
        </div>

        {/* Verification Warning */}
        {!userStats?.verified && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            boxShadow: UNIV.shadow
          }}>
            <p style={{ color: '#92400e', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
              ⏳ Pending Verification — Your account is pending verification. Contact an admin to get verified before funding proposals.
            </p>
          </div>
        )}

        {/* My Fundings Section */}
        <UnivSectionHeader icon="💰" count={myFundings.length}>
          My Fundings
        </UnivSectionHeader>

        {myFundings.length === 0 && (
          <UnivEmptyState
            icon="💰"
            title="No fundings yet"
            message="You haven't funded any proposals yet."
            subtext="Browse pending proposals below to start funding student ideas."
          />
        )}

        {myFundings.map((f) => (
          <div key={f.id} style={{ marginBottom: '1rem' }}>
            <div style={{
              background: UNIV.cardBg,
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: UNIV.shadow,
              border: `1px solid ${UNIV.success}30`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: `linear-gradient(135deg, ${UNIV.success}, ${UNIV.successLight})`
              }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: UNIV.textPrimary, margin: '0 0 0.25rem' }}>
                      Rs. {f.amount}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: UNIV.textMuted, margin: 0 }}>
                      Funded to: {f.proposalSummary ? `${f.proposalSummary}...` : `Proposal #${f.propId?.slice(-6) || 'Unknown'}`}
                    </p>
                  </div>
                  <span style={{
                    background: `${UNIV.success}15`,
                    color: UNIV.success,
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: `1px solid ${UNIV.success}30`
                  }}>
                    ✅ {f.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Proposals Seeking Funding Section */}
        <UnivSectionHeader icon="📄" count={proposals.length}>
          Proposals Seeking Funding
        </UnivSectionHeader>

        {loading && (
          <div style={{
            background: UNIV.cardBg,
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: UNIV.shadow
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: `4px solid ${UNIV.bgGradient}`,
              borderTop: `4px solid ${UNIV.primary}`,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: UNIV.textSecondary, fontSize: '1rem' }}>Loading proposals...</p>
          </div>
        )}

        {!loading && proposals.length === 0 && (
          <UnivEmptyState
            icon="📄"
            title="No proposals available"
            message="All proposals have been funded or processed."
            subtext="Check back later for new student proposals."
          />
        )}

        {!loading && proposals.map((p) => (
          <div key={p.id} style={{ marginBottom: '1rem' }}>
            <UnivProposalCard
              proposal={{ ...p, id: p.id }}
              onFund={handleFund}
              onOpenFund={openFundForm}
              openFormFor={openFormFor}
              isVerified={userStats?.verified}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndustryDashboard;