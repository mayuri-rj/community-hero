import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// ---- Points awarded for each action ----
export const POINTS = {
  REPORT_ISSUE: 10,
  RECEIVE_UPVOTE: 2,
  ISSUE_RESOLVED: 20
};

// ---- Badge thresholds ----
const REPORT_BADGES = [
  { threshold: 5, name: 'Civic Champion', emoji: '🏆' },
  { threshold: 3, name: 'Community Guardian', emoji: '🦸' },
  { threshold: 1, name: 'Newcomer', emoji: '🌱' }
];

const POINTS_BADGES = [
  { threshold: 100, name: 'Gold Hero', emoji: '🥇' },
  { threshold: 50, name: 'Silver Hero', emoji: '🥈' },
  { threshold: 20, name: 'Bronze Hero', emoji: '🥉' }
];

/**
 * Given a user's total report count and total points, returns the list of
 * badges they currently qualify for (highest tier only, not every tier passed).
 */
export const getBadgesForUser = (reportsCount = 0, points = 0) => {
  const badges = [];

  const reportBadge = REPORT_BADGES.find(b => reportsCount >= b.threshold);
  if (reportBadge) badges.push(reportBadge);

  const pointsBadge = POINTS_BADGES.find(b => points >= b.threshold);
  if (pointsBadge) badges.push(pointsBadge);

  return badges;
};

/**
 * Ensures a user document exists in the 'users' collection.
 * Call this right after login (or before first write) so every
 * authenticated user has a gamification profile.
 *
 * Uses setDoc with merge:true instead of getDoc+setDoc — this is safer
 * because it can't race with another write, and it will never wipe out
 * existing points/reportsCount if the doc already exists.
 */
export const ensureUserDoc = async (user, role = 'citizen', extraData = {}) => {
  console.log('ensureUserDoc CALLED with:', user?.uid, role, extraData);
  if (!user) {
    console.log('ensureUserDoc: NO USER, returning early');
    return;
  }
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  console.log('ensureUserDoc: document exists?', snapshot.exists());

  if (!snapshot.exists()) {
    console.log('ensureUserDoc: creating new document now...');
    await setDoc(userRef, {
      displayName: user.displayName || 'Anonymous',
      name: user.displayName || 'Anonymous',
      photoURL: user.photoURL || null,
      points: 0,
      reportsCount: 0,
      role: role,
      verified: role !== 'citizen' ? false : true,
      ...extraData,
    });
    console.log('ensureUserDoc: DOCUMENT CREATED SUCCESSFULLY');
  } else {
    console.log('ensureUserDoc: document already exists, going to update branch');
    const updates = {
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || null,
    };

    // BACKFILL: agar purane user doc mein role field hi nahi hai, add karo
    const data = snapshot.data();
    if (!data.role) {
      updates.role = 'citizen'; // purane citizen users ka default
    }

    await updateDoc(userRef, updates);
  }
};

/**
 * Internal helper: guarantees the user doc exists before we try to
 * increment fields on it. This makes the award* functions self-healing —
 * if ensureUserDoc somehow didn't run at login, this catches it instead
 * of throwing "No document to update" and breaking the calling flow.
 */
const ensureUserDocExists = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      points: 0,
      reportsCount: 0,
      displayName: 'Anonymous',
      photoURL: null,
      role: 'citizen'
    }, { merge: true });
  }
  return userRef;
};

/**
 * Call this right after a new issue is successfully added to Firestore.
 * Increments the reporter's points and reportsCount.
 *
 * Wrapped in try/catch internally — gamification failing should NEVER
 * break the actual issue-reporting flow, since the issue is already saved.
 */
export const awardPointsForReport = async (uid) => {
  if (!uid) return;
  try {
    const userRef = await ensureUserDocExists(uid);
    await updateDoc(userRef, {
      points: increment(POINTS.REPORT_ISSUE),
      reportsCount: increment(1)
    });
  } catch (error) {
    console.error('Gamification error (awardPointsForReport):', error);
  }
};

export const checkAndNotifyBadge = async (uid, reportsCount, points) => {
  try {
    const newBadges = getBadgesForUser(reportsCount, points);
    const oldBadges = getBadgesForUser(reportsCount - 1, points - POINTS.REPORT_ISSUE);

    const earnedNew = newBadges.filter(b => !oldBadges.includes(b));

    if (earnedNew.length > 0) {
      const { db } = await import('../firebase/config');
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

      await addDoc(collection(db, 'notifications'), {
        toUid: uid,
        message: `🏆 You earned a new badge: ${earnedNew[0].emoji} ${earnedNew[0].name}!`,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.error('Badge notification error:', err);
  }
};

/**
 * Call this when an issue receives an upvote, passing the ORIGINAL
 * REPORTER's uid (not the upvoter) so points go to the right person.
 */
export const awardPointsForUpvote = async (reporterUid) => {
  if (!reporterUid) return;
  try {
    const userRef = await ensureUserDocExists(reporterUid);
    await updateDoc(userRef, {
      points: increment(POINTS.RECEIVE_UPVOTE)
    });
  } catch (error) {
    console.error('Gamification error (awardPointsForUpvote):', error);
  }
};

/**
 * Call this when an issue's status changes to 'Resolved', passing the
 * original reporter's uid.
 */
export const awardPointsForResolved = async (reporterUid) => {
  if (!reporterUid) return;
  try {
    const userRef = await ensureUserDocExists(reporterUid);
    await updateDoc(userRef, {
      points: increment(POINTS.ISSUE_RESOLVED)
    });
  } catch (error) {
    console.error('Gamification error (awardPointsForResolved):', error);
  }
};