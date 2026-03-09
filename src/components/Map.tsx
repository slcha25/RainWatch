import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Complaint, Recommendation } from '../services/api';
import React, { useEffect } from 'react';

// Fix for default marker icons in Leaflet with React
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const ComplaintIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const RecommendationIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  complaints: Complaint[];
  recommendations: Recommendation[];
  center: [number, number];
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export default function RainMap({ complaints, recommendations, center }: MapProps) {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-black/5 shadow-sm relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        
        {/* Heatmap Simulation Overlay (Predicted Runoff Zones) */}
        {complaints.map((c) => (
          <Circle
            key={`heat-${c.id}`}
            center={[c.lat, c.lng]}
            radius={300}
            pathOptions={{ fillColor: '#f97316', fillOpacity: 0.1, color: 'transparent' }}
          />
        ))}

        {/* Complaint Markers */}
        {complaints.map((c) => (
          <Marker key={`comp-${c.id}`} position={[c.lat, c.lng]} icon={ComplaintIcon}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-red-600">{c.type}</h3>
                <p className="text-sm text-gray-600">{c.address}</p>
                <p className="text-xs mt-1 italic">"{c.description}"</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Recommendation Markers */}
        {recommendations.map((r) => (
          <Marker key={`rec-${r.id}`} position={[r.lat, r.lng]} icon={RecommendationIcon}>
            <Popup>
              <div className="p-1 w-48">
                <h3 className="font-bold text-green-600">{r.zone_name} Recommendation</h3>
                <p className="text-sm font-medium">{r.type}</p>
                <p className="text-xs text-gray-500 mt-1">{r.reason}</p>
                <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block">
                  Priority: {r.priority}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg z-[1000] border border-black/5 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Citizen Report</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]"></div>
          <span>Smart Barrel Site</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/30"></div>
          <span>Predicted Runoff Zone</span>
        </div>
      </div>
    </div>
  );
}
