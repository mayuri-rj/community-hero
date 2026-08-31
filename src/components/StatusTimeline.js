import React from 'react';

function formatDate(ts) {
  if (!ts) return null;
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusTimeline({ issue }) {
  const steps = [
    { label: 'Reported', icon: '📝', ts: issue.createdAt },
    { label: 'Assigned to University', icon: '🎓', ts: issue.assignedAt },
    { label: 'Proposal Submitted', icon: '📄', ts: issue.proposalSubmittedAt },
    { label: 'Funded', icon: '💰', ts: issue.fundedAt },
    { label: 'Resolution Proof Submitted', icon: '📸', ts: issue.proofSubmittedAt },
    { label: 'Resolved', icon: '✅', ts: issue.resolvedAt },
  ];

  //const reachedSteps = steps.filter((s) => s.ts);

  return (
    <div style={{ marginTop: '1rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.9rem' }}>🧭 Status Timeline</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, i) => {
          const done = !!step.ts;
          const isLast = i === steps.length - 1;
          return (
            <div key={step.label} style={{ display: 'flex', gap: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: done ? '#16a34a' : '#e5e7eb',
                  color: done ? '#fff' : '#9ca3af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', flexShrink: 0,
                }}>
                  {done ? '✓' : ''}
                </div>
                {!isLast && (
                  <div style={{ width: '2px', flex: 1, minHeight: '24px', background: done ? '#16a34a' : '#e5e7eb' }} />
                )}
              </div>
              <div style={{ paddingBottom: '1.2rem' }}>
                <p style={{ margin: 0, fontWeight: done ? 700 : 400, color: done ? '#111827' : '#9ca3af', fontSize: '0.88rem' }}>
                  {step.icon} {step.label}
                </p>
                {done && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(step.ts)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatusTimeline;