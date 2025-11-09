'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
}

export default function MapPreview({ latitude, longitude, name }: MapPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // マップ初期化
    const map = L.map(mapContainer.current).setView([latitude, longitude], 13);

    // OpenStreetMapタイル
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // カスタムアイコン
    const icon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // マーカー追加
    L.marker([latitude, longitude], { icon })
      .addTo(map)
      .bindPopup(`<b>${name}</b><br>緯度: ${latitude.toFixed(5)}<br>経度: ${longitude.toFixed(5)}`)
      .openPopup();

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [latitude, longitude, name]);

  return (
    <div
      ref={mapContainer}
      style={{
        height: '300px',
        width: '100%',
        borderRadius: '4px',
        marginBottom: '1rem',
      }}
    />
  );
}
