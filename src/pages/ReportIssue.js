import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { awardPointsForReport, checkAndNotifyBadge } from '../services/gamificationService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 15, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function ReportIssue({ user }) {
  const [location, setLocation] = useState('');
  const [searchCoords, setSearchCoords] = useState(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiCategory, setAiCategory] = useState('');
  const [aiSeverity, setAiSeverity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [markerPos, setMarkerPos] = useState(null);
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const searchTimeout = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Progress calculation
  const completedSteps = [location, description, image, markerPos, aiCategory].filter(Boolean).length;
  const progressPercent = (completedSteps / 5) * 100;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (location.length < 3) return;
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Jharkhand, India')}&format=json&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          // Jharkhand boundary check
          if (lat < 21.5 || lat > 25.5 || lng < 83 || lng > 88) {
            setSearchCoords(null);
            alert('That location seems to be outside Jharkhand. Please search for a place within Jharkhand.');
          } else {
            setSearchCoords({ lat, lng });
          }
        }
      } catch (err) {
        console.error('Location search error:', err);
      }
      setSearching(false);
    }, 800);
  }, [location]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    // sirf jpg, png, mp4 allow karo
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG images or MP4 videos are allowed.');
      return;
    }

    // max 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert('File is too large. Please upload a file under 10MB.');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleLocationSelect = (lat, lng) => {
    if (lat < 21.5 || lat > 25.5 || lng < 83 || lng > 88) {
      alert('Please select a location within Jharkhand.');
      return;
    }
    setMarkerPos({ lat, lng });
  };

  const handleSubmit = async () => {
    if (description.trim().length < 15) {
      alert('Please write a proper description (at least 15 characters) explaining the issue.');
      return;
    }
    if (!location || !image) {
      alert('Please fill location and upload an image!');
      return;
    }
    if (!markerPos) {
      alert('Please click on the map to mark the exact location!');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadImageToCloudinary(image);
      const imageUrl = result?.url || null;
      const mediaType = result?.type || 'image';
      await addDoc(collection(db, 'issues'), {
        name: user.displayName, reporterUid: user.uid, photoURL: user.photoURL,
        location, description, imageUrl, mediaType,
        aiCategory: aiCategory || 'Other', aiSeverity: aiSeverity || 'Medium',
        aiDescription, status: 'Pending Review', pendingReview: true,
        rejectedCount: 0, upvotes: 0,
        lat: markerPos.lat, lng: markerPos.lng,
        assignedTo: null, createdAt: serverTimestamp()
      });
      await awardPointsForReport(user.uid);
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        await checkAndNotifyBadge(user.uid, data.reportsCount || 0, data.points || 0);
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Something went wrong. Please try again!');
    }
    setSubmitting(false);
  };

  // ─── SUCCESS SCREEN ───
  if (submitted) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
        padding: '2rem',
      }}>
        <style>{`
          @keyframes popIn {
            0% { transform: scale(0.3); opacity: 0; }
            60% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .success-icon { animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
          .success-text { animation: fadeUp 0.6s ease both 0.3s; }
          .success-btn {
            animation: fadeUp 0.6s ease both 0.5s;
            transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          .success-btn:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 12px 28px rgba(29,78,216,0.3);
          }
        `}</style>
        <div style={{
          backgroundColor: 'white', borderRadius: '28px', padding: '3.5rem 3rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)', textAlign: 'center',
          maxWidth: '480px', width: '100%', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)',
          }} />
          <div className="success-icon" style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
          <div className="success-text">
            <h2 style={{ color: '#15803d', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.5px' }}>
              Issue Reported!
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
              Thank you for making your community better!
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '50px', padding: '0.5rem 1.2rem', marginBottom: '2rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>🌟</span>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.95rem' }}>+10 points earned!</span>
            </div>
          </div>
          <button className="success-btn" onClick={() => {
            setSubmitted(false); setLocation(''); setDescription(''); setImage(null);
            setImagePreview(null); setAiCategory(''); setAiSeverity('');
            setMarkerPos(null); setSearchCoords(null);
          }} style={{
            backgroundColor: '#1d4ed8', color: 'white', padding: '1rem 2.5rem',
            border: 'none', borderRadius: '50px', fontSize: '1rem',
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(29,78,216,0.25)',
          }}>
            🚀 Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN FORM ───
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      paddingBottom: '3rem',
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }

        .page-header { animation: fadeInUp 0.5s ease both; }
        .form-section { animation: fadeInUp 0.5s ease both; }

        .input-field {
          width: 100%; padding: 0.85rem 1rem;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 0.95rem; box-sizing: border-box;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          background: #fff; color: #1e293b; font-family: inherit;
        }
        .input-field:focus {
          border-color: #3b82f6; outline: none;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
        }
        .input-field:hover:not(:focus) { border-color: #cbd5e1; }
        .input-field::placeholder { color: #94a3b8; }

        .label {
          font-weight: 700; color: #1e293b; font-size: 0.9rem;
          margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;
        }
        .label-hint {
          font-weight: 400; color: #94a3b8; font-size: 0.82rem;
        }

        .section-card {
          background: white; border-radius: 20px;
          border: 1px solid #e2e8f0; padding: 1.8rem;
          transition: box-shadow 0.3s ease;
        }
        .section-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.04); }

        .submit-btn {
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative; overflow: hidden;
        }
        .submit-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .submit-btn:hover::before { transform: translateX(100%); }
        .submit-btn:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 12px 32px rgba(29,78,216,0.35);
        }
        .submit-btn:active { transform: translateY(0) scale(0.98); }

        .location-btn {
          transition: all 0.25s ease;
        }
        .location-btn:hover {
          background-color: #dbeafe !important;
          border-color: #93c5fd !important;
          transform: translateY(-1px);
        }
        .location-btn:active { transform: translateY(0); }

        .mic-btn {
          transition: all 0.2s ease;
        }
        .mic-btn:hover { transform: scale(1.1); }

        .upload-zone {
          transition: all 0.3s ease;
          position: relative;
        }
        .upload-zone:hover {
          border-color: #93c5fd !important;
          background-color: #eff6ff !important;
        }
        .upload-zone.drag-over {
          border-color: #3b82f6 !important;
          background-color: #dbeafe !important;
          transform: scale(1.01);
        }

        .ai-result { animation: slideDown 0.4s ease both; }

        .progress-bar-track {
          height: 6px; background: #e2e8f0; border-radius: 6px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%; border-radius: 6px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
        }

        .step-dot {
          width: 8px; height: 8px; border-radius: 50%;
          transition: all 0.3s ease;
        }

        @media (min-width: 900px) {
          .form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
          .form-full { grid-column: 1 / -1; }
        }
        @media (max-width: 899px) {
          .form-layout { display: flex; flex-direction: column; gap: 1.2rem; }
        }
      `}</style>

      {/* ───── Page Header ───── */}
      <div className="page-header" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #0891b2 100%)',
        padding: '2.5rem 2rem 3rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px', pointerEvents: 'none',
        }} />
        <div style={{
          maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h1 style={{
              color: 'white', fontSize: '2rem', fontWeight: 800,
              margin: 0, letterSpacing: '-0.5px',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
            }}>
              🚨 Report an Issue
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.3rem 0 0', fontSize: '0.95rem' }}>
              Help your community by reporting local problems
            </p>
          </div>

          {/* Reporter badge */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px', padding: '0.7rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '0.8rem',
          }}>
            {user?.photoURL && (
              <img src={user.photoURL} alt="profile"
                style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }} />
            )}
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
                {user?.displayName}
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                +10 points for reporting 🌟
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Progress Bar ───── */}
      <div style={{
        maxWidth: '960px', margin: '-1.2rem auto 0', padding: '0 2rem',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '1.2rem 1.5rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                Form Progress
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6' }}>
                {completedSteps}/5
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Location', 'Description', 'Photo', 'Pin', 'Category'].map((label, i) => {
              const done = [location, description, image, markerPos, aiCategory][i];
              return (
                <div key={i} title={label} className="step-dot" style={{
                  backgroundColor: done ? '#3b82f6' : '#e2e8f0',
                  boxShadow: done ? '0 0 0 3px rgba(59,130,246,0.2)' : 'none',
                }} />
              );
            })}
          </div>
        </div>
      </div>

      {/* ───── Form Body ───── */}
      <div style={{ maxWidth: '960px', margin: '1.5rem auto 0', padding: '0 2rem' }}>
        <div className="form-layout">

          {/* ── LEFT / LOCATION COLUMN ── */}
          <div className="form-section section-card" style={{ animationDelay: '0.1s' }}>
            <h3 style={{
              margin: '0 0 1.2rem', fontSize: '1.05rem', fontWeight: 700,
              color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem',
              }}>📍</span>
              Location & Map
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Search Location</label>
                <input
                  type="text"
                  placeholder="Type area name (e.g. Ranchi, MG Road)..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                />
                {searching && (
                  <p style={{ color: '#3b82f6', fontSize: '0.8rem', margin: '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    Searching location...
                  </p>
                )}
                {searchCoords && !searching && (
                  <p style={{ color: '#16a34a', fontSize: '0.8rem', margin: '0.4rem 0 0' }}>
                    ✅ Found! Click on map to mark exact spot
                  </p>
                )}
              </div>

              <button type="button" className="location-btn" onClick={() => {
                if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const lat = pos.coords.latitude, lng = pos.coords.longitude;

                    // Jharkhand boundary check
                    if (lat < 21.5 || lat > 25.5 || lng < 83 || lng > 88) {
                      alert('Your current location is outside Jharkhand. Please pin manually within Jharkhand.');
                      return;
                    }

                    setMarkerPos({ lat, lng });
                    setSearchCoords({ lat, lng });
                  },
                  () => alert('Could not get your location. Please pin manually.')
                );
              }} style={{
                backgroundColor: '#f0f9ff', color: '#2563eb',
                border: '1.5px solid #bfdbfe', padding: '0.7rem 1rem',
                borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                fontSize: '0.88rem', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}>
                📍 Use My Current Location
              </button>

              <div>
                <label className="label">
                  Mark on Map
                  <span className="label-hint">(click to pin)</span>
                </label>
                <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                  <MapContainer
                    center={[23.3441, 85.3096]}
                    zoom={10}
                    style={{ height: '340px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      maxZoom={19}
                    />
                    <FlyToLocation coords={searchCoords} />
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                    {markerPos && <Marker position={[markerPos.lat, markerPos.lng]} />}
                  </MapContainer>
                </div>
                {markerPos && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '8px', padding: '0.4rem 0.8rem', marginTop: '0.5rem',
                    fontSize: '0.82rem', color: '#16a34a', fontWeight: 600,
                  }}>
                    📌 {markerPos.lat.toFixed(4)}, {markerPos.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT / DETAILS COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Description */}
            <div className="form-section section-card" style={{ animationDelay: '0.2s' }}>
              <h3 style={{
                margin: '0 0 1.2rem', fontSize: '1.05rem', fontWeight: 700,
                color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                }}>✏️</span>
                Issue Details
              </h3>

              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <label className="label">Description</label>
                <textarea
                  placeholder="Describe the issue in detail — what's wrong, where exactly, how long it's been there..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="input-field"
                  style={{ resize: 'vertical', paddingRight: '3.2rem', lineHeight: 1.6 }}
                />
                <button
                  type="button" onClick={toggleListening}
                  className="mic-btn"
                  title={isListening ? 'Listening… click to stop' : 'Click to speak'}
                  style={{
                    position: 'absolute', right: '0.7rem', bottom: '0.7rem',
                    background: isListening ? '#dc2626' : '#2563eb',
                    color: '#fff', border: 'none', borderRadius: '50%',
                    width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem',
                    animation: isListening ? 'pulse 1s infinite' : 'none',
                    boxShadow: isListening ? '0 0 0 4px rgba(220,38,38,0.2)' : '0 2px 8px rgba(37,99,235,0.3)',
                  }}
                >🎤</button>
              </div>
              {isListening && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.82rem', color: '#dc2626', fontWeight: 600,
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: '#dc2626', animation: 'pulse 1s infinite',
                    display: 'inline-block',
                  }} />
                  Listening... speak now
                </div>
              )}

              {/* Category & Severity side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label className="label">🏷️ Category</label>
                  <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value)}
                    className="input-field" style={{ cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    <option value="Pothole">🕳️ Pothole</option>
                    <option value="Garbage/Waste">🗑️ Garbage/Waste</option>
                    <option value="Broken Streetlight">💡 Broken Streetlight</option>
                    <option value="Water Leakage">💧 Water Leakage</option>
                    <option value="Damaged Road">🛣️ Damaged Road</option>
                    <option value="Encroachment">🚧 Encroachment</option>
                    <option value="Healthcare Issue">🏥 Healthcare Issue</option>
                    <option value="Education Issue">📚 Education Issue</option>
                    <option value="Agriculture/Rural Issue">🌾 Agriculture</option>
                    <option value="Digital Accessibility Issue">♿ Accessibility</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">⚠️ Severity</label>
                  <select value={aiSeverity} onChange={(e) => setAiSeverity(e.target.value)}
                    className="input-field" style={{ cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Upload */}
            <div className="form-section section-card" style={{ animationDelay: '0.3s' }}>
              <h3 style={{
                margin: '0 0 1.2rem', fontSize: '1.05rem', fontWeight: 700,
                color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                }}>📸</span>
                Evidence
              </h3>

              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageChange(e); }}
                style={{
                  border: `2px dashed ${dragOver ? '#3b82f6' : '#bfdbfe'}`,
                  borderRadius: '16px', padding: imagePreview ? '0.8rem' : '2rem 1.5rem',
                  textAlign: 'center', cursor: 'pointer',
                  backgroundColor: dragOver ? '#dbeafe' : '#fafbff',
                }}
              >
                <input type="file" accept="image/*,video/*" onChange={handleImageChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="preview" style={{
                      width: '100%', borderRadius: '12px', maxHeight: '220px', objectFit: 'cover',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: '0.5rem', right: '0.5rem',
                      backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                      borderRadius: '8px', padding: '0.3rem 0.8rem', fontSize: '0.75rem',
                      backdropFilter: 'blur(4px)',
                    }}>
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.8rem', marginBottom: '0.8rem',
                    }}>📷</div>
                    <p style={{ color: '#1e40af', fontWeight: 700, margin: '0 0 0.3rem', fontSize: '0.95rem' }}>
                      Drop file here or click to upload
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                      JPG, PNG, WebP, MP4 • Max 10MB
                    </p>
                  </div>
                )}
              </div>

              {loading && (
                <div style={{
                  backgroundColor: '#eff6ff', borderRadius: '12px',
                  padding: '0.8rem 1rem', marginTop: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  border: '1px solid #bfdbfe',
                }}>
                  <span style={{
                    display: 'inline-block', width: '18px', height: '18px',
                    border: '2.5px solid #bfdbfe', borderTopColor: '#3b82f6',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                  }} />
                  <p style={{ color: '#1d4ed8', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                    AI is analyzing your image...
                  </p>
                </div>
              )}
            </div>

            {/* AI Result */}
            {aiCategory && aiSeverity && (
              <div className="ai-result section-card" style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid #86efac',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  marginBottom: '0.8rem',
                }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    backgroundColor: '#dcfce7',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}>🤖</span>
                  <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>
                    AI Analysis Complete
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: '#dcfce7', color: '#15803d',
                    padding: '0.35rem 0.9rem', borderRadius: '20px',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>📌 {aiCategory}</span>
                  <span style={{
                    backgroundColor: '#fef3c7', color: '#92400e',
                    padding: '0.35rem 0.9rem', borderRadius: '20px',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>⚠️ {aiSeverity}</span>
                </div>
                {aiDescription && (
                  <p style={{ color: '#374151', fontSize: '0.88rem', margin: '0.6rem 0 0', lineHeight: 1.6 }}>
                    {aiDescription}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── FULL-WIDTH SUBMIT ── */}
          <div className="form-full" style={{ marginTop: '0.5rem' }}>
            <button onClick={handleSubmit} disabled={submitting} className="submit-btn" style={{
              width: '100%',
              backgroundColor: submitting ? '#93c5fd' : '#1d4ed8',
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8, #0891b2)',
              color: 'white', padding: '1.1rem',
              border: 'none', borderRadius: '16px',
              fontSize: '1.05rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 24px rgba(29,78,216,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: submitting ? 0.7 : 1,
              letterSpacing: '0.3px',
            }}>
              {submitting ? (
                <>
                  <span style={{
                    display: 'inline-block', width: '20px', height: '20px',
                    border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  Submitting...
                </>
              ) : '🚀 Submit Issue Report'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ReportIssue;