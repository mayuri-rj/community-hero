import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ensureUserDoc } from '../services/gamificationService';
import { doc, updateDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DEPARTMENTS } from '../utils/departmentMapping';
import { setSignupInProgress } from '../utils/signupFlag';

// ---- Design tokens ----
const NAVY = '#152A54';
const NAVY_LIGHT = '#28407A';
const ACCENT = '#B9762E';
const BG = '#EEF1F6';
const SURFACE = '#FFFFFF';
const BORDER = '#DCE1EA';
const TEXT = '#1A2233';
const TEXT_MUTED = '#5B6472';
const ERROR_COLOR = '#B3261E';
const ERROR_BG = '#FBEAE9';

const HEADLINE_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const styles = {
    page: {
        minHeight: '100vh',
        background: BG,
        fontFamily: BODY_FONT,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
    },
    card: {
        width: '100%',
        maxWidth: '440px',
        background: SURFACE,
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(21,42,84,0.08), 0 8px 24px rgba(21,42,84,0.08)',
        border: `1px solid ${BORDER}`,
    },
    banner: {
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
        padding: '1.75rem 1.75rem 1.5rem',
        textAlign: 'center',
    },
    bannerTitle: {
        fontFamily: HEADLINE_FONT,
        color: '#FFFFFF',
        fontSize: '1.5rem',
        margin: 0,
        letterSpacing: '0.2px',
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: '0.8rem',
        marginTop: '0.35rem',
    },
    body: {
        padding: '1.75rem',
    },
    tabRow: {
        display: 'flex',
        background: BG,
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '1.5rem',
        border: `1px solid ${BORDER}`,
    },
    tabButton: (active) => ({
        flex: 1,
        padding: '0.6rem 0.5rem',
        background: active ? NAVY : 'transparent',
        color: active ? '#FFFFFF' : TEXT_MUTED,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.92rem',
        fontWeight: active ? 600 : 500,
        transition: 'background 0.15s ease, color 0.15s ease',
    }),
    field: {
        marginBottom: '1.1rem',
    },
    label: {
        display: 'block',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: TEXT,
        marginBottom: '0.4rem',
    },
    input: {
        width: '100%',
        padding: '0.65rem 0.75rem',
        fontSize: '0.95rem',
        color: TEXT,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: '7px',
        boxSizing: 'border-box',
        outline: 'none',
    },
    select: {
        width: '100%',
        padding: '0.65rem 0.75rem',
        fontSize: '0.95rem',
        color: TEXT,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: '7px',
        boxSizing: 'border-box',
        outline: 'none',
    },
    errorBox: {
        background: ERROR_BG,
        color: ERROR_COLOR,
        border: `1px solid ${ERROR_COLOR}33`,
        borderRadius: '7px',
        padding: '0.6rem 0.75rem',
        fontSize: '0.85rem',
        marginBottom: '1rem',
    },
    submitButton: (disabled) => ({
        width: '100%',
        padding: '0.75rem',
        background: disabled ? '#8B95A8' : NAVY,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '7px',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        marginTop: '0.25rem',
    }),
    switchRow: {
        textAlign: 'center',
        marginTop: '1.25rem',
        fontSize: '0.87rem',
        color: TEXT_MUTED,
    },
    switchLink: {
        color: ACCENT,
        cursor: 'pointer',
        fontWeight: 600,
    },
};

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
    const [expertise, setExpertise] = useState('');
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
                    expertise: role === 'university' ? expertise : null,
                    partnerType: role === 'industry' ? partnerType : null,
                });
                await addDoc(collection(db, 'notifications'), {
                    toUid: 'admin-broadcast',
                    message: `🆕 New ${role === 'university' ? 'university' : (partnerType || 'industry')} partner signed up: ${orgName} — verification pending.`,
                    read: false,
                    createdAt: serverTimestamp(),
                });
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            // App.js ka onAuthStateChanged khud navigate handle karega userRole ke hisaab se
            navigate('/');
        } catch (err) {
            console.log('SIGNUP ERROR:', err.message, err.code);
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
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Banner */}
                <div style={styles.banner}>
                    <h2 style={styles.bannerTitle}>Partner Portal</h2>
                    <div style={styles.bannerSubtitle}>
                        Community Seva &middot; University &amp; Industry Collaboration
                    </div>
                </div>

                <div style={styles.body}>
                    {/* Role tabs */}
                    <div style={styles.tabRow}>
                        <button
                            type="button"
                            onClick={() => setRole('university')}
                            style={styles.tabButton(role === 'university')}
                        >
                            🎓 University
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('industry')}
                            style={styles.tabButton(role === 'industry')}
                        >
                            🏭 Industry &amp; Funders
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === 'signup' && (
                            <div style={styles.field}>
                                <label style={styles.label}>
                                    {role === 'university' ? 'College / Department Name' : 'Organization Name'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={role === 'university' ? 'e.g. XYZ College of Engineering' : 'e.g. Acme Foundation'}
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        )}

                        {mode === 'signup' && role === 'university' && (
                            <div style={styles.field}>
                                <label style={styles.label}>Area of Specialization</label>
                                <select
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    required
                                    style={styles.select}
                                >
                                    {DEPARTMENTS.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {mode === 'signup' && role === 'university' && (
                            <div style={styles.field}>
                                <label style={styles.label}>Areas of Expertise</label>
                                <input
                                    type="text"
                                    placeholder="e.g. water management, irrigation, solar energy, IoT"
                                    value={expertise}
                                    onChange={(e) => setExpertise(e.target.value)}
                                    style={styles.input}
                                />
                            </div>
                        )}

                        {mode === 'signup' && role === 'industry' && (
                            <div style={styles.field}>
                                <label style={styles.label}>Partner Type</label>
                                <select
                                    value={partnerType}
                                    onChange={(e) => setPartnerType(e.target.value)}
                                    required
                                    style={styles.select}
                                >
                                    <option value="Industry">Industry</option>
                                    <option value="Startup">Startup</option>
                                    <option value="MSME">MSME</option>
                                    <option value="CSR Organization">CSR Organization</option>
                                    <option value="Research Institution">Research Institution</option>
                                    <option value="Innovation Hub">Innovation Hub</option>
                                    <option value="NGO">NGO</option>
                                </select>
                            </div>
                        )}

                        <div style={styles.field}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                placeholder="you@organization.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={styles.input}
                            />
                        </div>

                        {error && <div style={styles.errorBox}>{error}</div>}

                        <button
                            type="submit"
                            disabled={submitting}
                            style={styles.submitButton(submitting)}
                        >
                            {submitting ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Log In'}
                        </button>
                    </form>

                    <div style={styles.switchRow}>
                        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <span
                            style={styles.switchLink}
                            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                        >
                            {mode === 'signup' ? 'Log In' : 'Sign Up'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PartnerAuth;