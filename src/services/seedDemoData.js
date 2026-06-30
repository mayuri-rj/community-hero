// seedDemoData.js
// TEMPORARY file — run once to seed realistic demo issues, then delete this
// file (or remove the button that calls it) before final submission.

import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const demoIssues = [
  // --- 3 issues in same area + category => triggers Cluster Detection Agent ---
  {
    location: 'Sewri near Joggers Park, Mumbai',
    description: 'Large pothole causing traffic near the park entrance.',
    aiCategory: 'Pothole',
    aiSeverity: 'Medium',
    status: 'Reported',
    latitude: 18.9928,
    longitude: 72.8567
  },
  {
    location: 'Sewri near Joggers Park, Mumbai',
    description: 'Second pothole formed after the rain, 50m from the first.',
    aiCategory: 'Pothole',
    aiSeverity: 'Medium',
    status: 'Reported',
    latitude: 18.9930,
    longitude: 72.8570
  },
  {
    location: 'Sewri near Joggers Park, Mumbai',
    description: 'Pothole near the bus stop, getting worse every day.',
    aiCategory: 'Pothole',
    aiSeverity: 'Medium',
    status: 'Reported',
    latitude: 18.9925,
    longitude: 72.8565
  },

  // --- Other categories / areas / statuses for variety ---
  {
    location: 'Bhiwandi Main Road, Maharashtra',
    description: 'Streetlight not working for the past two weeks.',
    aiCategory: 'Street Light',
    aiSeverity: 'Low',
    status: 'In Progress',
    latitude: 19.2813,
    longitude: 73.0483
  },
  {
    location: 'Andheri West, Mumbai',
    description: 'Garbage not collected for 4 days, overflowing bins.',
    aiCategory: 'Garbage',
    aiSeverity: 'High',
    status: 'Reported',
    latitude: 19.1364,
    longitude: 72.8296
  },
  {
    location: 'Dadar Market Area, Mumbai',
    description: 'Open drain near the market, safety hazard for pedestrians.',
    aiCategory: 'Drainage',
    aiSeverity: 'High',
    status: 'In Progress',
    latitude: 19.0178,
    longitude: 72.8478
  },
  {
    location: 'Borivali National Park Road, Mumbai',
    description: 'Broken footpath tiles, tripping hazard for elderly walkers.',
    aiCategory: 'Footpath',
    aiSeverity: 'Medium',
    status: 'Resolved',
    latitude: 19.2307,
    longitude: 72.8567
  },
  {
    location: 'Thane Station East, Maharashtra',
    description: 'Water leakage from a damaged pipe flooding the street.',
    aiCategory: 'Water Leakage',
    aiSeverity: 'High',
    status: 'Resolved',
    latitude: 19.1869,
    longitude: 72.9750
  },
  {
    location: 'Vashi Sector 17, Navi Mumbai',
    description: 'Traffic signal malfunctioning at a busy intersection.',
    aiCategory: 'Traffic Signal',
    aiSeverity: 'Medium',
    status: 'Reported',
    latitude: 19.0771,
    longitude: 72.9986
  },
  {
    location: 'Kalyan West, Maharashtra',
    description: 'Illegal dumping ground forming near residential area.',
    aiCategory: 'Garbage',
    aiSeverity: 'Low',
    status: 'In Progress',
    latitude: 19.2433,
    longitude: 73.1305
  }
];

/**
 * Seeds demo issues into Firestore. Pass the currently logged-in user
 * so reports have a valid reporterUid/name (keeps gamification/upvote
 * logic from breaking on null checks).
 */
export const seedDemoData = async (currentUser) => {
  if (!currentUser) {
    console.error('Pass the logged-in user to seedDemoData(user)');
    return;
  }

  for (const issue of demoIssues) {
    try {
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
      console.log('Seeded:', issue.location);
    } catch (err) {
      console.error('Seed error for', issue.location, err);
    }
  }
  console.log('✅ Demo data seeding complete!');
};