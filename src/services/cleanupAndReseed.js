// cleanupAndReseed.js
// TEMPORARY — run once via a button click to fix the duplicate demo data mess.
// Deletes ONLY issues matching our known demo locations (safe — won't touch
// the original "Sewri" issue or anything else real), clears all agent logs,
// then re-seeds exactly 10 clean demo issues.

import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// Same locations used in seedDemoData — used here to identify demo docs safely
const DEMO_LOCATIONS = [
  'Sewri near Joggers Park, Mumbai',
  'Bhiwandi Main Road, Maharashtra',
  'Andheri West, Mumbai',
  'Dadar Market Area, Mumbai',
  'Borivali National Park Road, Mumbai',
  'Thane Station East, Maharashtra',
  'Vashi Sector 17, Navi Mumbai',
  'Kalyan West, Maharashtra'
];

const demoIssues = [
  { location: 'Sewri near Joggers Park, Mumbai', description: 'Large pothole causing traffic near the park entrance.', aiCategory: 'Pothole', aiSeverity: 'Medium', status: 'Reported', latitude: 18.9928, longitude: 72.8567 },
  { location: 'Sewri near Joggers Park, Mumbai', description: 'Second pothole formed after the rain, 50m from the first.', aiCategory: 'Pothole', aiSeverity: 'Medium', status: 'Reported', latitude: 18.9930, longitude: 72.8570 },
  { location: 'Sewri near Joggers Park, Mumbai', description: 'Pothole near the bus stop, getting worse every day.', aiCategory: 'Pothole', aiSeverity: 'Medium', status: 'Reported', latitude: 18.9925, longitude: 72.8565 },
  { location: 'Bhiwandi Main Road, Maharashtra', description: 'Streetlight not working for the past two weeks.', aiCategory: 'Street Light', aiSeverity: 'Low', status: 'In Progress', latitude: 19.2813, longitude: 73.0483 },
  { location: 'Andheri West, Mumbai', description: 'Garbage not collected for 4 days, overflowing bins.', aiCategory: 'Garbage', aiSeverity: 'High', status: 'Reported', latitude: 19.1364, longitude: 72.8296 },
  { location: 'Dadar Market Area, Mumbai', description: 'Open drain near the market, safety hazard for pedestrians.', aiCategory: 'Drainage', aiSeverity: 'High', status: 'In Progress', latitude: 19.0178, longitude: 72.8478 },
  { location: 'Borivali National Park Road, Mumbai', description: 'Broken footpath tiles, tripping hazard for elderly walkers.', aiCategory: 'Footpath', aiSeverity: 'Medium', status: 'Resolved', latitude: 19.2307, longitude: 72.8567 },
  { location: 'Thane Station East, Maharashtra', description: 'Water leakage from a damaged pipe flooding the street.', aiCategory: 'Water Leakage', aiSeverity: 'High', status: 'Resolved', latitude: 19.1869, longitude: 72.9750 },
  { location: 'Vashi Sector 17, Navi Mumbai', description: 'Traffic signal malfunctioning at a busy intersection.', aiCategory: 'Traffic Signal', aiSeverity: 'Medium', status: 'Reported', latitude: 19.0771, longitude: 72.9986 },
  { location: 'Kalyan West, Maharashtra', description: 'Illegal dumping ground forming near residential area.', aiCategory: 'Garbage', aiSeverity: 'Low', status: 'In Progress', latitude: 19.2433, longitude: 73.1305 }
];

export const cleanupAndReseed = async (currentUser) => {
  if (!currentUser) {
    console.error('Pass the logged-in user to cleanupAndReseed(user)');
    return;
  }

  console.log('Step 1: Deleting all demo-location issues (keeping anything else untouched)...');
  const issuesSnap = await getDocs(collection(db, 'issues'));
  let deletedIssues = 0;
  for (const docSnap of issuesSnap.docs) {
    const data = docSnap.data();
    if (DEMO_LOCATIONS.includes(data.location)) {
      await deleteDoc(doc(db, 'issues', docSnap.id));
      deletedIssues++;
    }
  }
  console.log(`Deleted ${deletedIssues} demo issues (original/real issues untouched).`);

  console.log('Step 2: Clearing all agent action logs...');
  const actionsSnap = await getDocs(collection(db, 'agentActions'));
  for (const docSnap of actionsSnap.docs) {
    await deleteDoc(doc(db, 'agentActions', docSnap.id));
  }
  console.log(`Deleted ${actionsSnap.size} agent action logs.`);

  console.log('Step 3: Re-seeding exactly 10 clean demo issues...');
  for (const issue of demoIssues) {
    await addDoc(collection(db, 'issues'), {
      ...issue,
      upvotes: Math.floor(Math.random() * 12),
      upvoters: [],
      witnessCount: Math.floor(Math.random() * 5),
      witnesses: [],
      reporterUid: currentUser.uid,
      name: currentUser.displayName || 'Demo Reporter',
      imageUrl: null,
      createdAt: serverTimestamp()
    });
  }

  console.log('✅ Cleanup + reseed complete! Refresh the page to see the agent react.');
};