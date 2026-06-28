import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { awardPointsForReport } from '../services/gamificationService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fly map to searched location
function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 15, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// Component to handle map click
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
  const searchTimeout = useRef(null);

  // Auto search location on typing
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (location.length < 3) return;

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          setSearchCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch (err) {
        console.error('Location search error:', err);
      }
      setSearching(false);
    }, 800);
  }, [location]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setMarkerPos({ lat, lng });
  };

  const handleSubmit = async () => {
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
        name: user.displayName,
        reporterUid: user.uid,
        photoURL: user.photoURL,
        location,
        description,
        imageUrl,
        mediaType,
        aiCategory: aiCategory || 'Other',
        aiSeverity: aiSeverity || 'Medium',
        aiDescription,
        status: 'Reported',
        upvotes: 0,
        lat: markerPos.lat,
        lng: markerPos.lng,
        createdAt: serverTimestamp()
      });
      await awardPointsForReport(user.uid);
      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Something went wrong. Please try again!');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: '#16a34a', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Issue Reported Successfully!
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          Thank you for making your community better! You earned <strong>+10 points</strong> 🌟
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setLocation('');
            setDescription('');
            setImage(null);
            setImagePreview(null);
            setAiCategory('');
            setAiSeverity('');
            setMarkerPos(null);
            setSearchCoords(null);
          }}
          style={{
            backgroundColor: '#1d4ed8', color: 'white',
            padding: '0.9rem 2.5rem', border: 'none',
            borderRadius: '50px', fontSize: '1rem',
            fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '2rem auto', padding: '0 1rem' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-card { animation: fadeIn 0.4s ease; }
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: border-color 0.2s;
          background: white;
        }
        .input-field:focus {
          border-color: #1d4ed8;
          outline: none;
          box-shadow: 0 0 0 3px rgba(29,78,216,0.1);
        }
        .label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
          margin-bottom: 0.4rem;
          display: block;
        }
        .submit-btn {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(29,78,216,0.3);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#1e3a8a', fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.3rem' }}>
          🚨 Report an Issue
        </h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
          Help your community by reporting local problems
        </p>
      </div>

      {/* Reporter banner */}
      <div style={{
        backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: '12px', padding: '0.8rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.8rem',
        marginBottom: '1.5rem'
      }}>
        {user?.photoURL && (
          <img src={user.photoURL} alt="profile"
            style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
        )}
        <div>
          <p style={{ margin: 0, fontWeight: '600', color: '#1e40af', fontSize: '0.9rem' }}>
            Reporting as {user?.displayName}
          </p>
          <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.8rem' }}>
            +10 points for reporting 🌟
          </p>
        </div>
      </div>

      <div className="form-card" style={{
        backgroundColor: 'white', borderRadius: '16px',
        border: '1px solid #e2e8f0', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.2rem'
      }}>

        {/* Location */}
        <div>
          <label className="label">📍 Location</label>
          <input
            type="text"
            placeholder="Type area name (e.g. Kalyan, MG Road Mumbai)..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field"
          />
          {searching && (
            <p style={{ color: '#3b82f6', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>
              🔍 Searching location...
            </p>
          )}
          {searchCoords && !searching && (
            <p style={{ color: '#16a34a', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>
              ✅ Location found! Now click on map to mark exact spot
            </p>
          )}
        </div>

        {/* Map */}
        <div>
          <label className="label">🗺️ Mark Exact Location <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>(click on map)</span></label>
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
            <MapContainer
              center={[19.0760, 72.8777]}
              zoom={10}
              style={{ height: '280px', width: '100%' }}
            >
              {/* CartoDB Voyager — crisp tiles with road/shop/landmark labels, no API key needed */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains="abcd"
                maxZoom={20}
              />
              <FlyToLocation coords={searchCoords} />
              <LocationPicker onLocationSelect={handleLocationSelect} />
              {markerPos && (
                <Marker position={[markerPos.lat, markerPos.lng]} />
              )}
            </MapContainer>
          </div>
          {markerPos && (
            <p style={{ color: '#16a34a', fontSize: '0.8rem', margin: '0.4rem 0 0' }}>
              📌 Location marked! ({markerPos.lat.toFixed(4)}, {markerPos.lng.toFixed(4)})
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="label">📝 Description</label>
          <textarea
            placeholder="Describe the issue briefly..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">🏷️ Issue Category</label>
          <select
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          >
            <option value="">Select category...</option>
            <option value="Pothole">🕳️ Pothole</option>
            <option value="Garbage/Waste">🗑️ Garbage/Waste</option>
            <option value="Broken Streetlight">💡 Broken Streetlight</option>
            <option value="Water Leakage">💧 Water Leakage</option>
            <option value="Damaged Road">🛣️ Damaged Road</option>
            <option value="Encroachment">🚧 Encroachment</option>
            <option value="Other">❓ Other</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="label">⚠️ Severity</label>
          <select
            value={aiSeverity}
            onChange={(e) => setAiSeverity(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          >
            <option value="">Select severity...</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="label">📸 Upload Photo or Video</label>
          <div style={{
            border: '2px dashed #bfdbfe', borderRadius: '12px',
            padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
            backgroundColor: '#f8faff', position: 'relative'
          }}>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImageChange}
              style={{
                position: 'absolute', inset: 0,
                opacity: 0, cursor: 'pointer', width: '100%'
              }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="preview"
                style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
            ) : (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                <p style={{ color: '#3b82f6', fontWeight: '600', margin: '0 0 0.2rem' }}>
                  Click to upload photo or video
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
                  JPG, PNG, WebP, MP4 supported
                </p>
              </div>
            )}
          </div>
          {loading && (
            <div style={{
              backgroundColor: '#eff6ff', borderRadius: '10px',
              padding: '0.8rem 1rem', marginTop: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <span>🤖</span>
              <p style={{ color: '#1d4ed8', margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                AI is analyzing your image...
              </p>
            </div>
          )}
        </div>

        {/* AI Result */}
        {aiCategory && (
          <div style={{
            backgroundColor: '#f0fdf4', borderRadius: '12px',
            border: '1px solid #86efac', padding: '1rem'
          }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: '700', color: '#15803d' }}>
              🤖 AI Analysis Complete
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#dcfce7', color: '#15803d',
                padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600'
              }}>
                📌 {aiCategory}
              </span>
              <span style={{
                backgroundColor: '#fef3c7', color: '#92400e',
                padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600'
              }}>
                ⚠️ {aiSeverity} Severity
              </span>
            </div>
            {aiDescription && (
              <p style={{ color: '#374151', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                {aiDescription}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="submit-btn"
          style={{
            backgroundColor: submitting ? '#93c5fd' : '#1d4ed8',
            color: 'white', padding: '1rem',
            border: 'none', borderRadius: '50px',
            fontSize: '1rem', fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(29,78,216,0.3)'
          }}
        >
          {submitting ? '⏳ Submitting...' : '🚀 Submit Issue'}
        </button>
      </div>
    </div>
  );
}

export default ReportIssue;