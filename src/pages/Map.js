import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Map() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'issues'));
      const issuesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIssues(issuesList);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  return (
    <div>
      <div style={{ padding: '1rem 2rem' }}>
        <h1 style={{ color: '#1e40af' }}>🗺️ Issues Map</h1>
        <p style={{ color: '#6b7280' }}>See all reported issues in your area</p>
      </div>
      <MapContainer
        center={[19.0760, 72.8777]}
        zoom={12}
        style={{ height: '70vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {issues.map(issue => (
          issue.lat && issue.lng && (
            <Marker key={issue.id} position={[issue.lat, issue.lng]}>
              <Popup>
                <strong>{issue.aiCategory}</strong><br />
                📍 {issue.location}<br />
                ⚠️ {issue.aiSeverity}<br />
                👤 {issue.name}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;