import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { getDeptForCategory } from '../utils/departmentMapping';

// University Portal Design System - Official Academic
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

// Professional University Header
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
              <span style={{ fontSize: '2.2rem' }}>🎓</span>
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
                University Portal
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
            Welcome, {user?.email} — Manage community challenges and submit proposals
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
            University Status
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
            {userStats?.verified ? 'Verified Institution' : 'Pending Verification'}
          </div>
          {userStats?.specialization && (
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
              🏛️ {userStats.specialization}
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);

// Professional University Stat Cards
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

// University Section Headers
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

// University Empty State
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

// University Issue Card
const UnivIssueCard = ({ issue, onAccept, onSubmitProposal, onUploadProof, isOpen, onCancel, onOpen }) => {
  const [solution, setSolution] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budget, setBudget] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [teamMembers, setTeamMembers] = useState('');
  const [facultyMentor, setFacultyMentor] = useState('');
  const [mentorDesignation, setMentorDesignation] = useState('');
  const [expectedDeliverables, setExpectedDeliverables] = useState('');
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(null);


  const handleSubmitProposal = async () => {
    if (!solution.trim() || !timeline.trim() || !budget.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setSubmittingProposal(true);
    try {
      await onSubmitProposal(issue.id, {
        solution,
        timeline,
        budget,
        teamMembers,
        facultyMentor,
        mentorDesignation,
        expectedDeliverables,
      });
      setSolution('');
      setTimeline('');
      setBudget('');
      setTeamMembers('');
      setFacultyMentor('');
      setMentorDesignation('');
      setExpectedDeliverables('');
      onCancel();
    } catch (err) {
      console.error('Proposal submit error:', err);
      alert('Proposal submission failed, please try again.');
    }
    setSubmittingProposal(false);
  };

  const handleProofUpload = async () => {
    if (!afterImageFile) {
      alert('Please select an after-photo first.');
      return;
    }
    setUploadingProof(true);
    try {
      await onUploadProof(issue.id, afterImageFile);
      setAfterImageFile(null);
    } catch (err) {
      console.error('Proof upload error:', err);
      alert('Proof upload failed, please try again.');
    }
    setUploadingProof(false);
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
        background: `linear-gradient(135deg, ${UNIV.primary}, ${UNIV.secondary})`
      }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Issue Header with Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{
            background: `${UNIV.accent}15`,
            color: UNIV.accent,
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: `1px solid ${UNIV.accent}30`
          }}>
            🤖 {issue.aiCategory || 'Issue'}
          </span>
          <span style={{
            background: issue.aiSeverity === 'Critical' ? '#ffebee' : issue.aiSeverity === 'High' ? '#fff3e0' : '#e8f5e9',
            color: issue.aiSeverity === 'Critical' ? UNIV.warning : issue.aiSeverity === 'High' ? UNIV.warningLight : UNIV.success,
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: `1px solid ${issue.aiSeverity === 'Critical' ? '#ffcdd2' : issue.aiSeverity === 'High' ? '#ffe0b2' : '#c8e6c9'}`
          }}>
            ⚠️ {issue.aiSeverity}
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
            {issue.status}
          </span>
        </div>

        {/* Issue Description with Location */}
        <div style={{ marginBottom: '1rem' }}>
          {issue.location && (
            <p style={{
              fontSize: '0.85rem',
              color: UNIV.textMuted,
              marginBottom: '0.25rem',
              fontWeight: 500
            }}>
              📍 {issue.location}
            </p>
          )}
          <p style={{
            color: UNIV.textSecondary,
            lineHeight: 1.5,
            fontSize: '0.95rem'
          }}>
            {issue.description || 'No description provided'}
          </p>
        </div>

        {/* Proposal Status Section */}
        {issue.hasProposal ? (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534', margin: 0 }}>
              ✅ Proposal Submitted
            </p>
            {issue.proposal && (
              <p style={{ fontSize: '0.85rem', color: '#65a30d', marginTop: '0.25rem', fontWeight: 500 }}>
                Budget: {issue.proposal.budget} • Timeline: {issue.proposal.timeline}
              </p>
            )}
          </div>
        ) : isOpen ? (
          // Proposal Form
          <div style={{
            marginTop: '1rem',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: UNIV.textPrimary }}>
              Submit Proposal for This Challenge
            </h4>

            <textarea
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px'
              }}
              placeholder="Proposed solution — describe how you will solve this issue..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={3}
            />
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
              placeholder="Team members (comma-separated, e.g. Riya Sharma, Amit Patel)"
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
            />
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
              placeholder="Faculty mentor name"
              value={facultyMentor}
              onChange={(e) => setFacultyMentor(e.target.value)}
            />
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
              placeholder="Mentor designation (e.g. Associate Professor, CSE Dept)"
              value={mentorDesignation}
              onChange={(e) => setMentorDesignation(e.target.value)}
            />
            <textarea
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '60px'
              }}
              placeholder="Expected deliverables — what will be the final output?"
              value={expectedDeliverables}
              onChange={(e) => setExpectedDeliverables(e.target.value)}
              rows={2}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '0.9rem' }}
                type="text"
                placeholder="Timeline (e.g. 3 months)"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
              <input
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '0.9rem' }}
                type="text"
                placeholder="Budget (e.g. Rs. 50,000)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
                onClick={handleSubmitProposal}
                disabled={submittingProposal}
              >
                {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
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
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : issue.status === 'Under University Review' ? (
          // Submit Proposal Button (already accepted, form is closed right now)
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
            onClick={onOpen}
          >
            Submit Proposal
          </button>
        ) : (
          // Accept Button
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
            onClick={() => onAccept(issue.id)}
            disabled={!issue.isVerified}
          >
            Express Interest & Accept
          </button>
        )}

        {/* Resolution Proof Section */}
        {issue.status === 'Funded — In Progress' && (
          <div style={{
            marginTop: '1rem',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', margin: 0, color: '#9a3412' }}>
              📸 Upload proof photo to mark this resolved:
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterImageFile(e.target.files[0])}
              style={{ marginBottom: '0.75rem' }}
            />
            <button
              style={{
                background: `linear-gradient(135deg, ${UNIV.warning}, ${UNIV.warningLight})`,
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
                boxShadow: `0 2px 8px ${UNIV.warning}40`
              }}
              onClick={handleProofUpload}
              disabled={uploadingProof}
            >
              {uploadingProof ? 'Uploading...' : 'Submit Resolution Proof'}
            </button>
          </div>
        )}

        {/* Awaiting Confirmation Status */}
        {issue.status === 'Awaiting Reporter Confirmation' && (
          <div style={{
            background: '#fefce8',
            border: '1px solid #fef3c7',
            borderRadius: '10px',
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <p style={{ color: '#854d0e', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>
              ⏳ Awaiting reporter confirmation — The issue reporter will review your resolution proof within 5 days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// University Available Challenge Card
const UnivAvailableCard = ({ issue, onAccept, isVerified }) => (
  <div style={{
    background: UNIV.cardBg,
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: UNIV.shadow,
    border: `1px solid ${UNIV.primary}20`,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '80px',
      height: '80px',
      background: `${UNIV.success}08`,
      borderRadius: '50%',
      transform: 'translate(35%, -35%)'
    }} />

    <div style={{ position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{
          background: `${UNIV.accent}15`,
          color: UNIV.accent,
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          border: `1px solid ${UNIV.accent}30`
        }}>
          🤖 {issue.aiCategory || 'Issue'}
        </span>
        <span style={{
          background: issue.aiSeverity === 'Critical' ? '#ffebee' : issue.aiSeverity === 'High' ? '#fff3e0' : '#e8f5e9',
          color: issue.aiSeverity === 'Critical' ? UNIV.warning : issue.aiSeverity === 'High' ? UNIV.warningLight : UNIV.success,
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          border: `1px solid ${issue.aiSeverity === 'Critical' ? '#ffcdd2' : issue.aiSeverity === 'High' ? '#ffe0b2' : '#c8e6c9'}`
        }}>
          ⚠️ {issue.aiSeverity}
        </span>
        <span style={{
          background: '#e8f5e9',
          color: UNIV.success,
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          border: '1px solid #c8e6c9'
        }}>
          ✅ Available
        </span>
      </div>

      {issue.location && (
        <p style={{
          fontSize: '0.85rem',
          color: UNIV.textMuted,
          marginBottom: '0.25rem',
          fontWeight: 500
        }}>
          📍 {issue.location}
        </p>
      )}

      <p style={{
        color: UNIV.textSecondary,
        lineHeight: 1.5,
        fontSize: '0.95rem'
      }}>
        {issue.description || 'No description provided'}
      </p>

      {!isVerified && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '10px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{ color: '#92400e', fontSize: '0.85rem', margin: 0 }}>
            ⏳ Your account is pending verification. Contact an admin to get verified before accepting challenges.
          </p>
        </div>
      )}

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
          marginTop: '1rem'
        }}
        onClick={() => onAccept(issue.id)}
        disabled={!isVerified}
      >
        Express Interest & Accept
      </button>
    </div>
  </div>
);


function UniversityDashboard({ user, userStats }) {
  const [availableIssues, setAvailableIssues] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openFormFor, setOpenFormFor] = useState(null);

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
        assignedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Accept challenge error:', err);
      alert('Something went wrong, please try again.');
    }
  };

  const handleSubmitProposal = async (issueId, proposalData) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'proposals'), {
        issueId,
        uniId: user.uid,
        uniEmail: user.email,
        ...proposalData,
        status: 'Pending Funding',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'issues', issueId), { status: 'Proposal Submitted', proposalSubmittedAt: serverTimestamp(), });
    } catch (err) {
      console.error('Proposal submit error:', err);
      alert('Proposal submission failed, please try again.');
    }
    setLoading(false);
  };

  const submitResolutionProof = async (issueId, imageFile) => {
    setLoading(true);
    try {
      const result = await uploadImageToCloudinary(imageFile);
      const afterImageUrl = result?.url || null;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      await updateDoc(doc(db, 'issues', issueId), {
        afterImageUrl,
        status: 'Awaiting Reporter Confirmation',
        reviewDeadline: deadline,
        proofSubmittedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Proof upload error:', err);
      alert('Proof upload failed, please try again.');
    }
    setLoading(false);
  };

  const hasProposal = (issueId) => myProposals.some((p) => p.issueId === issueId);
  const getProposalForIssue = (issueId) => myProposals.find((p) => p.issueId === issueId);

  const matchingIssues = availableIssues.filter(
    (issue) =>
      issue.status !== 'Pending Review' &&
      issue.status !== 'Rejected' &&
      getDeptForCategory(issue.aiCategory) === userStats?.specialization
  );

  const inProgressIssues = myIssues.filter(i => i.status === 'Funded — In Progress' || i.status === 'Awaiting Reporter Confirmation');
  const pendingProposalIssues = myIssues.filter(i => i.status === 'Proposal Submitted');

  return (
    <div className="partner-page" style={{
      background: UNIV.bgGradient,
      minHeight: '100vh',
      paddingTop: '2rem',
      paddingBottom: '2rem',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 'none',
        padding: '0 2rem',
        boxSizing: 'border-box'
      }}>
        {/* Official University Header */}
        <UnivHeader user={user} userStats={userStats} />

        {/* Quick Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <UnivStatCard
            title="Accepted Challenges"
            value={myIssues.length}
            color={UNIV.primary}
            icon="🎯"
            subtitle="Challenges accepted by your university"
          />
          <UnivStatCard
            title="Under Review"
            value={pendingProposalIssues.length}
            color={UNIV.warning}
            icon="⏳"
            subtitle="Proposals awaiting review"
          />
          <UnivStatCard
            title="In Progress"
            value={inProgressIssues.length}
            color={UNIV.success}
            icon="✅"
            subtitle="Funded and active challenges"
          />
        </div>

        {/* My Accepted Challenges Section */}
        <UnivSectionHeader icon="🎯" count={myIssues.length}>
          My Projects
        </UnivSectionHeader>

        {myIssues.length === 0 && (
          <UnivEmptyState
            icon="🎓"
            title="No challenges accepted yet"
            message="Browse available challenges below to get started!"
            subtext="Accept challenges from your department to begin working on community issues."
          />
        )}

        {myIssues.map((issue) => (
          <div key={issue.id} style={{ marginBottom: '1rem' }}>
            <UnivIssueCard
              issue={{
                ...issue,
                id: issue.id,
                hasProposal: hasProposal(issue.id),
                proposal: getProposalForIssue(issue.id)
              }}
              onAccept={handleAccept}
              onSubmitProposal={handleSubmitProposal}
              onUploadProof={submitResolutionProof}
              isOpen={openFormFor === issue.id}
              onCancel={() => setOpenFormFor(null)}
              onOpen={() => setOpenFormFor(issue.id)}
              
            />
          </div>
        ))}

        {/* Available Challenges Section */}
        <UnivSectionHeader icon="🔍" count={matchingIssues.length}>
          Available Challenges
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
            <p style={{ color: UNIV.textSecondary, fontSize: '1rem' }}>Loading available challenges...</p>
          </div>
        )}

        {!loading && matchingIssues.length === 0 && (
          <UnivEmptyState
            icon="✅"
            title="No open challenges match your department"
            message="All challenges in your department have been accepted or completed!"
            subtext="Check back later for new challenges in your area of expertise."
          />
        )}

        {matchingIssues.map((issue) => (
          <div key={issue.id} style={{ marginBottom: '1rem' }}>
            <UnivAvailableCard
              issue={{ ...issue, id: issue.id }}
              onAccept={handleAccept}
              isVerified={userStats?.verified}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default UniversityDashboard;