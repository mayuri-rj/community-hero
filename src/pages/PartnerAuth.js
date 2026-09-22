import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ensureUserDoc } from '../services/gamificationService';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DEPARTMENTS } from '../utils/departmentMapping';
import { setSignupInProgress } from '../utils/signupFlag';



function PartnerAuth() {
    const navigate = useNavigate();
    const [role, setRole] = useState('university'); // 'university' | 'industry'
    const [mode, setMode] = useState('signup'); // 'signup' | 'login'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState(''); // dept name OR company name
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [specialization, setSpecialization] = useState(DEPARTMENTS[0]);
    const [partnerType, setPartnerType] = useState('Industry');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSignupInProgress(true); 
        setError('');
        setSubmitting(true);


        try {
            let userCredential;
            if (mode === 'signup') {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await userCredential.user.getIdToken(true); // force refresh auth token
                await ensureUserDoc(userCredential.user, role, {
                    orgName: orgName,
                    specialization: role === 'university' ? specialization : null,
                    partnerType: role === 'industry' ? partnerType : null,
                });
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            // App.js ka onAuthStateChanged khud navigate handle karega userRole ke hisaab se
            navigate('/');
        } catch (err) {
            console.log('SIGNUP ERROR:', err.message, err.code);
            // Firebase ke technical error code ko friendly message mein badlo
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect email or password.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setSubmitting(false);
            setSignupInProgress(false);
        }

    };

    return (
        <div style={{ maxWidth: '420px', margin: '3rem auto', padding: '2rem' }}>
            <h2 style={{ textAlign: 'center' }}>Partner Portal</h2>

            {/* Role tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    type="button"
                    onClick={() => setRole('university')}
                    style={{
                        flex: 1, padding: '0.6rem',
                        background: role === 'university' ? '#2563eb' : '#e5e7eb',
                        color: role === 'university' ? '#fff' : '#111',
                        border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}
                >
                    🎓 University
                </button>
                {mode === 'signup' && role === 'industry' && (
                    <select
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.8rem' }}
                    >
                        <option value="Industry">Industry</option>
                        <option value="Startup">Startup</option>
                        <option value="MSME">MSME</option>
                        <option value="NGO">NGO</option>
                        <option value="Research Institution">Research Institution</option>
                    </select>
                )}
                <button
                    type="button"
                    onClick={() => setRole('industry')}
                    style={{
                        flex: 1, padding: '0.6rem',
                        background: role === 'industry' ? '#2563eb' : '#e5e7eb',
                        color: role === 'industry' ? '#fff' : '#111',
                        border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}
                >
                    🏭 Industry
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                    <input
                        type="text"
                        placeholder={role === 'university' ? 'College / Department Name' : 'Company Name'}
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.8rem' }}
                    />
                )}
                {mode === 'signup' && role === 'university' && (
                    <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.8rem' }}
                    >
                        {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem', marginBottom: '0.8rem' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '0.6rem', marginBottom: '0.8rem' }}
                />

                {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px' }}
                >
                    {submitting ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Log In'}
                </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <span
                    style={{ color: '#2563eb', cursor: 'pointer' }}
                    onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                >
                    {mode === 'signup' ? 'Log In' : 'Sign Up'}
                </span>
            </p>
        </div>
    );
}

export default PartnerAuth;