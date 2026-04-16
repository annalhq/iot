'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

import L from 'leaflet';

export default function Map({ data }: { data: any[] }) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  const getMarkerColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'quiet': return '#34d399';
      case 'moderate': return '#fbbf24';
      case 'loud': return '#f97316';
      case 'very loud': return '#ef4444';
      case 'hazardous': return '#7f1d1d';
      default: return '#3b82f6';
    }
  };

  const getMarkerRadius = (analogLevel: number) => {
    return Math.max(15, analogLevel * 2);
  };

  const centerLat = data.length > 0 ? data[0].lat : 28.6139;
  const centerLng = data.length > 0 ? data[0].lng : 77.2090;

  return (
    <MapContainer 
      center={[centerLat, centerLng]} 
      zoom={13} 
      className="w-full h-full rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {data.map((item, idx) => {
        const opacity = Math.max(0.1, 1 - (idx * 0.05));
        
        const jitterLat = item.lat + (Math.random() - 0.5) * 0.001;
        const jitterLng = item.lng + (Math.random() - 0.5) * 0.001;

        if (idx > 10) return null; 

        return (
          <CircleMarker
            key={idx}
            center={[jitterLat, jitterLng]}
            pathOptions={{ 
              fillColor: getMarkerColor(item.noiseLevel), 
              color: getMarkerColor(item.noiseLevel),
              fillOpacity: opacity,
              opacity: opacity * 0.5
            }}
            radius={getMarkerRadius(item.analogLevel)}
          >
            <Popup>
              <div className="font-sans text-slate-800">
                <strong>Level:</strong> {item.noiseLevel}<br/>
                <strong>Analog:</strong> {item.analogLevel}<br/>
                <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
