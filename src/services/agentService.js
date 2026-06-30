// agentService.js
// Autonomous agent: observes issue data, makes decisions, takes actions on its own.
// No Gemini dependency — pure rule-based reasoning so it works reliably in demos.
// Logs every decision+action to the 'agentActions' Firestore collection so the
// UI can show a live "AI Agent Activity" feed.

import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const STALE_HOURS = 24; // High severity + still "Reported" after this long => escalate
const CLUSTER_THRESHOLD = 3; // 3+ similar unresolved issues in same area => cluster alert

// In-session lock — prevents duplicate logging when multiple onSnapshot
// events fire in quick succession before Firestore writes land (race condition).
const processedClusters = new Set();
const processedEscalations = new Set();

// Normalize location string to a comparable "area" key (first chunk before comma)
const areaKeyOf = (location = '') => location.split(',')[0].trim().toLowerCase();

const logAction = async (action) => {
  try {
    await addDoc(collection(db, 'agentActions'), {
      ...action,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Agent log error:', err);
  }
};

/**
 * AGENT BEHAVIOR 1 — Cluster Detection & Auto-Escalation
 * Observes: groups unresolved issues by area + category
 * Decides: if 3+ reports for same problem in same area, it's a real pattern, not noise
 * Acts: marks them as a cluster, bumps severity to High, logs the decision
 */
const runClusterDetection = async (issues) => {
  const unresolved = issues.filter(i => i.status !== 'Resolved');
  const groups = {};

  unresolved.forEach(issue => {
    const key = `${areaKeyOf(issue.location)}__${issue.aiCategory}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(issue);
  });

  for (const key of Object.keys(groups)) {
    const group = groups[key];
    if (group.length >= CLUSTER_THRESHOLD) {
      const alreadyClustered = group.some(i => i.clusterFlagged);
      if (alreadyClustered || processedClusters.has(key)) continue; // agent already acted (or is mid-action) on this cluster
      processedClusters.add(key); // lock immediately, before any awaits, to stop concurrent calls racing in

      for (const issue of group) {
        if (issue.clusterFlagged) continue;
        try {
          await updateDoc(doc(db, 'issues', issue.id), {
            clusterFlagged: true,
            clusterSize: group.length,
            aiSeverity: 'High' // agent decision: pattern of reports = high priority
          });
        } catch (err) {
          console.error('Cluster update error:', err);
        }
      }

      const [area, category] = key.split('__');
      await logAction({
        type: 'CLUSTER_DETECTED',
        icon: '🧩',
        title: `Cluster detected: ${category} in ${area}`,
        description: `Agent found ${group.length} unresolved "${category}" reports in ${area} — auto-escalated severity to High and flagged as a cluster.`,
        affectedIssueIds: group.map(i => i.id)
      });
    }
  }
};

/**
 * AGENT BEHAVIOR 2 — Stale High-Severity Escalation
 * Observes: High severity issues still sitting in "Reported" status
 * Decides: if no one has acted within STALE_HOURS, it needs to be surfaced
 * Acts: tags it as "agentEscalated", logs an alert for admins
 */
const runStaleEscalation = async (issues) => {
  const now = Date.now();

  for (const issue of issues) {
    if (issue.aiSeverity !== 'High') continue;
    if (issue.status !== 'Reported') continue;
    if (issue.agentEscalated) continue; // already acted
    if (processedEscalations.has(issue.id)) continue; // mid-action lock

    const createdMillis = issue.createdAt?.toMillis ? issue.createdAt.toMillis() : null;
    if (!createdMillis) continue;

    const hoursOld = (now - createdMillis) / (1000 * 60 * 60);
    if (hoursOld >= STALE_HOURS) {
      processedEscalations.add(issue.id); // lock immediately, before awaits
      try {
        await updateDoc(doc(db, 'issues', issue.id), {
          agentEscalated: true
        });

        await logAction({
          type: 'STALE_ESCALATION',
          icon: '⏰',
          title: `Stale high-severity issue escalated`,
          description: `"${issue.location}" has been unresolved for ${Math.round(hoursOld)}h with High severity — agent flagged it for urgent admin attention.`,
          affectedIssueIds: [issue.id]
        });
      } catch (err) {
        console.error('Stale escalation error:', err);
      }
    }
  }
};

/**
 * Main entry point — runs the full autonomous agent cycle.
 * Call this on Dashboard mount / periodically. Safe to call repeatedly;
 * each behavior checks flags so it never re-acts on the same issue twice.
 */
export const runAgentCycle = async (issues) => {
  if (!issues || issues.length === 0) return;
  try {
    await runClusterDetection(issues);
    await runStaleEscalation(issues);
  } catch (err) {
    console.error('Agent cycle error:', err);
  }
};