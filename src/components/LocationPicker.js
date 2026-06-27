import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Internal helper: listens for map clicks and reports them up
function ClickListener({ onSelect }) {
  useMapEvents({
    click: (e) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

/**
 * Reusable click-to-pick-location map.
 *
 * Props:
 * - lat, lng: currently selected coordinates (number | null)
 * - onLocationSelect(lat, lng): called when user clicks the map
 * - height: CSS height of the map box (default "250px")
 * - zoom: initial zoom level (default 13)
 * - center: [lat, lng] to center the map on when nothing is selected yet
 */
function LocationPicker({
  lat,
  lng,
  onLocationSelect,
  height = '250px',
  zoom = 13,
  center = [19.0760, 72.8777] // Mumbai default
}) {
  const mapCenter = lat && lng ? [lat, lng] : center;

  return (
    <div>
      <div style={{
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #d1d5db'
      }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height, width: '100%' }}
        >
          {/* CartoDB Voyager — crisp tiles with road/shop/landmark labels, no API key needed */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          <ClickListener onSelect={onLocationSelect} />
          {lat && lng && <Marker position={[lat, lng]} />}
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.4rem 0 0' }}>
        {lat && lng
          ? `📍 Selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : '👆 Click on the map to pin the exact location'}
      </p>
    </div>
  );
}

export default LocationPicker;