import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ensureUserDoc } from './services/gamificationService';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import Login from './pages/Login';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';


function App() {
  const [user, setUser] = useState(null);
   const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        ensureUserDoc(currentUser);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserStats(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserStats(snap.data());
      }
    });
    return () => unsubscribe();
  }, [user]);


  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading... 🔄</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Navbar user={user} userStats={userStats} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportIssue user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} userStats={userStats} />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </Router>
  );
}

export default App;