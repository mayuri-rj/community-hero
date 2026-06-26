import React, { useState, useEffect } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { analyzeIssueImage } from '../services/geminiService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import LocationPicker from '../components/LocationPicker';
import { awardPointsForReport } from '../services/gamificationService';

function ReportIssue({ user }) {
  const routerLocation = useRouterLocation();

  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiCategory, setAiCategory] = useState('');
  const [aiSeverity, setAiSeverity] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pinned coordinates (from map click, current-location button, or Map page handoff)
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locatingMe, setLocatingMe] = useState(false);

  // If user came from Map page "Report issue here", pick up the coordinates it passed along
  useEffect(() => {
    if (routerLocation.state?.lat && routerLocation.state?.lng) {
      setLat(routerLocation.state.lat);
      setLng(routerLocation.state.lng);
    }
  }, [routerLocation.state]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setLoading(true);
      const result = await analyzeIssueImage(file);
      setAiCategory(result.category);
      setAiSeverity(result.severity);
      setAiDescription(result.description);
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocatingMe(false);
      },
      (err) => {
        console.log('Location not available:', err);
        alert('Could not get your current location. Please pin it on the map instead.');
        setLocatingMe(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!location || !image) {
      alert('Please fill location and upload an image!');
      return;
    }

    setSubmitting(true);

    // Use the pinned location if available, otherwise fall back to Mumbai default
    let finalLat = lat ?? 19.0760;
    let finalLng = lng ?? 72.8777;

    try {
      // image cloudinary pe upload karo
      const imageUrl = await uploadImageToCloudinary(image);

      // firestore mein save karo
      await addDoc(collection(db, 'issues'), {
        name: user.displayName || 'Anonymous',
        reporterUid: user.uid,
        location,
        description,
        imageUrl,
        aiCategory: aiCategory || 'Other',
        aiSeverity: aiSeverity || 'Medium',
        aiDescription,
        status: 'Reported',
        upvotes: 0,
        lat: finalLat,
        lng: finalLng,
        createdAt: serverTimestamp()
      });

      // Gamification: reporter ko points milte hain har successful report pe
      await awardPointsForReport(user.uid);

      setSubmitted(true);
      // form reset
      setLocation('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      setAiCategory('');
      setAiSeverity('');
      setLat(null);
      setLng(null);

    } catch (error) {
      console.error('Submit error:', error);
      alert('Something went wrong. Please try again!');
    }

    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '4rem' }}>🎉</div>
        <h2 style={{ color: '#16a34a' }}>Issue Reported Successfully!</h2>
        <p style={{ color: '#6b7280' }}>Thank you for making your community better!</p>
        <button
          onClick={() => setSubmitted(false)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.8rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ color: '#1e40af', marginBottom: '1.5rem' }}>🚨 Report an Issue</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '0.7rem 1rem',
          borderRadius: '8px',
          color: '#166534',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="you"
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            />
          )}
          Reporting as <strong>{user?.displayName || 'Anonymous'}</strong> · +10 points on submit 🎯
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#374151' }}>Location</label>
          <input
            type="text"
            placeholder="Enter location (e.g. MG Road, Mumbai)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem',
              marginTop: '0.3rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', color: '#374151' }}>Pin Exact Location</label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locatingMe}
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '0.3rem 0.7rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: locatingMe ? 'not-allowed' : 'pointer'
              }}
            >
              {locatingMe ? '📡 Locating...' : '📍 Use my current location'}
            </button>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <LocationPicker
              lat={lat}
              lng={lng}
              onLocationSelect={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#374151' }}>Description</label>
          <textarea
            placeholder="Describe the issue briefly"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.7rem',
              marginTop: '0.3rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#374151' }}>Upload Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'block', marginTop: '0.3rem' }}
          />
          {loading && (
            <p style={{ color: '#2563eb', marginTop: '0.5rem' }}>
              🤖 AI is analyzing your image...
            </p>
          )}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              style={{
                width: '100%',
                marginTop: '0.5rem',
                borderRadius: '8px',
                maxHeight: '200px',
                objectFit: 'cover'
              }}
            />
          )}
        </div>

        {aiCategory && (
          <div style={{
            backgroundColor: '#eff6ff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <p><strong>🤖 AI Detected:</strong> {aiCategory}</p>
            <p><strong>⚠️ Severity:</strong> {aiSeverity}</p>
            {aiDescription && <p><strong>📝 AI Note:</strong> {aiDescription}</p>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            backgroundColor: submitting ? '#93c5fd' : '#2563eb',
            color: 'white',
            padding: '0.8rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Issue 🚀'}
        </button>

      </div>
    </div>
  );
}

export default ReportIssue;