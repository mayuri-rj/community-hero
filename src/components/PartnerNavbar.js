import React from 'react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

function PartnerNavbar({ user, role, orgName }) {
    const handleLogout = async () => {
        await signOut(auth);
    };

    const portalLabel = role === 'university' ? '🎓 University Portal' : '🏭 Industry Portal';

    return (
        <nav style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 2px 12px rgba(37, 99, 235, 0.3)'
        }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
                {portalLabel}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>
                    {orgName || user?.email}
                </span>
                <button
                    onClick={handleLogout}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default PartnerNavbar;