import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import PartnerAuth from './pages/PartnerAuth';
import UniversityDashboard from './pages/UniversityDashboard';
import IndustryDashboard from './pages/IndustryDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PartnerNavbar from './components/PartnerNavbar';
import AdminDashboard from './pages/AdminDashboard';
import { ADMIN_EMAILS } from './utils/adminConfig';


function App() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

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
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserStats(snap.data());
      }
      setStatsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const userRole = userStats?.role || null;

  if (loading || (user && statsLoading)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading... 🔄</p>
      </div>
    );
  }



  return (
    <Router>
      {user && userRole === 'citizen' && <Navbar user={user} userStats={userStats} />}
      {user && (userRole === 'university' || userRole === 'industry') && (
        <PartnerNavbar user={user} role={userRole} orgName={userStats?.orgName} />
      )}
      <Routes>
        {/* Public / login routes */}
        <Route path="/login" element={user ? <Home user={user} /> : <Login />} />
        <Route path="/partner-login" element={<PartnerAuth />} />

        {/* Citizen routes — protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['citizen', 'admin']}>
              <Home user={user} />
            </ProtectedRoute>
          }

        />
        <Route
          path="/report"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['citizen', 'admin']}>
              <ReportIssue user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['citizen', 'admin']}>
              <Dashboard user={user} userStats={userStats} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['citizen', 'admin']}>
              <Map />
            </ProtectedRoute>
          }
        />

        {/* University — protected */}
        <Route
          path="/university"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['university', 'admin']}>
              <UniversityDashboard user={user} userStats={userStats} />
            </ProtectedRoute>
          }
        />

        {/* Industry — protected */}
        <Route
          path="/industry"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['industry', 'admin']}>
              <IndustryDashboard user={user} userStats={userStats} />
            </ProtectedRoute>
          }
        />
        {/*email check karega*/}
        <Route
          path="/admin"
          element={
            user && ADMIN_EMAILS.includes(user.email) ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;