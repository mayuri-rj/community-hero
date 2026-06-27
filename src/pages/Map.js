import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A distinct icon for the "pending pin" so it's visually different from reported issues
const pendingIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  className: 'pending-pin-marker'
});

// Listens for clicks on the map and reports the lat/lng up to the parent
function ClickToPin({ onPick }) {
  useMapEvents({
    click: (e) => {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function Map() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [pendingPin, setPendingPin] = useState(null); // { lat, lng } | null

  useEffect(() => {
    // onSnapshot keeps the map's markers live — new reports from other users
    // appear automatically without needing a page refresh.
    const unsubscribe = onSnapshot(
      collection(db, 'issues'),
      (snapshot) => {
        const issuesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setIssues(issuesList);
      },
      (error) => {
        console.error('Error listening to issues:', error);
      }
    );

    // cleanup: detach the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleReportHere = () => {
    if (!pendingPin) return;
    navigate('/report', { state: { lat: pendingPin.lat, lng: pendingPin.lng } });
  };

  return (
    <div>
      <div style={{ padding: '1rem 2rem' }}>
        <h1 style={{ color: '#1e40af' }}>🗺️ Issues Map</h1>
        <p style={{ color: '#6b7280' }}>
          See all reported issues in your area — click anywhere on the map to report a new one there
        </p>
      </div>
      <MapContainer
        center={[19.0760, 72.8777]}
        zoom={12}
        style={{ height: '70vh', width: '100%' }}
      >
        {/* CartoDB Voyager — crisp tiles with road/shop/landmark labels, no API key needed */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ClickToPin onPick={(lat, lng) => setPendingPin({ lat, lng })} />

        {/* Existing reported issues */}
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

        {/* Temporary pin for a location the user just clicked */}
        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={pendingIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem' }}>
                  📍 {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
                </p>
                <button
                  onClick={handleReportHere}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                >
                  🚨 Report issue here
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default Map;