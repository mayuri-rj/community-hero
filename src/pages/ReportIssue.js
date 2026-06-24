import React, { useState } from 'react';
import { analyzeIssueImage } from '../services/geminiService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function ReportIssue() {
  const [name, setName] = useState('');
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

  const handleSubmit = async () => {
    if (!name || !location || !image) {
      alert('Please fill name, location and upload an image!');
      return;
    }

    setSubmitting(true);

    // get current location
    let lat = 19.0760;
    let lng = 72.8777;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch (err) {
      console.log('Location not available, using default');
    }

    try {
      // image cloudinary pe upload karo
      const imageUrl = await uploadImageToCloudinary(image);

      // firestore mein save karo
      await addDoc(collection(db, 'issues'), {
        name,
        location,
        description,
        imageUrl,
        aiCategory: aiCategory || 'Other',
        aiSeverity: aiSeverity || 'Medium',
        aiDescription,
        status: 'Reported',
        upvotes: 0,
        lat,
        lng,
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
      // form reset
      setName('');
      setLocation('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      setAiCategory('');
      setAiSeverity('');

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

        <div>
          <label style={{ fontWeight: 'bold', color: '#374151' }}>Your Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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