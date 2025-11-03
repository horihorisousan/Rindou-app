'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Road, Coordinate } from '@/types/road';
import { useEffect, useState, useRef } from 'react';
import RoadPopup from './RoadPopup';
import { JAPAN_BOUNDS } from '@/lib/japan-bounds';

interface MapProps {
  roads: Road[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPosition?: [number, number] | null;
  selectedRoute?: Coordinate[] | null;
  userId?: string | null;
  onRouteUpdate?: (route: Coordinate[]) => void;
  routeMode?: boolean;
  userLocation?: [number, number] | null;
  userLikedRoadIds?: Set<string>;
  selectedRoadId?: string | null;
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function FlyToUserLocation({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (userLocation && !hasFlown.current && map) {
      hasFlown.current = true;

      // マップが完全にレンダリングされるまで十分な時間待つ
      const timer = setTimeout(() => {
        try {
          // マップの状態をチェック
          if (map && map.getContainer && map.getContainer()) {
            map.flyTo(userLocation, 13, {
              duration: 2.0, // 2秒間のアニメーション
              easeLinearity: 0.25
            });
          }
        } catch (error) {
          console.log('Map animation error (ignored):', error);
          // エラーが発生した場合は、通常のsetViewにフォールバック
          try {
            map.setView(userLocation, 13);
          } catch (fallbackError) {
            console.log('Map setView error (ignored):', fallbackError);
          }
        }
      }, 1000); // 500ms → 1000msに延長

      return () => clearTimeout(timer);
    }
  }, [userLocation, map]);

  return null;
}

export default function Map({ roads, center = [35.6762, 139.6503], zoom = 10, onMapClick, selectedPosition, selectedRoute, userId, onRouteUpdate, routeMode = false, userLocation, userLikedRoadIds = new Set(), selectedRoadId = null }: MapProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const iconInitialized = useRef(false);

  useEffect(() => {
    setIsClient(true);

    // Initialize Leaflet icons only once on client side
    if (typeof window !== 'undefined' && !iconInitialized.current) {
      try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        iconInitialized.current = true;
      } catch (error) {
        console.error('Error initializing Leaflet icons:', error);
      }
    }

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const getMarkerColor = (condition: string) => {
    switch (condition) {
      case 'good':
        return '#22c55e'; // green
      case 'caution':
        return '#f59e0b'; // orange
      case 'closed':
        return '#ef4444'; // red
      default:
        return '#3b82f6'; // blue
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'good':
        return '良好';
      case 'caution':
        return '注意が必要';
      case 'closed':
        return '通行不可';
      default:
        return condition;
    }
  };

  const createCustomIcon = (color: string) => {
    if (typeof window === 'undefined') return undefined;

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 24],
    });
  };

  // Wait for client-side hydration and mount
  if (!isClient || !isMounted) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#666' }}>マップを読み込み中...</p>
      </div>
    );
  }

  // 日本の境界を設定
  const maxBounds: [[number, number], [number, number]] = [
    [JAPAN_BOUNDS.south - 2, JAPAN_BOUNDS.west - 2], // 南西
    [JAPAN_BOUNDS.north + 2, JAPAN_BOUNDS.east + 2], // 北東
  ];

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
        maxBounds={maxBounds}
        maxBoundsViscosity={1.0}
        minZoom={5}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onMapClick && <MapClickHandler onClick={onMapClick} />}
      <FlyToUserLocation userLocation={userLocation || null} />

      {selectedPosition && !routeMode && (
        <Marker position={selectedPosition} icon={createCustomIcon('#3b82f6')}>
          <Popup>選択された位置</Popup>
        </Marker>
      )}

      {selectedRoute && selectedRoute.length > 0 && (
        <>
          {selectedRoute.map((coord, index) => (
            <Marker
              key={`route-point-${index}`}
              position={[coord.lat, coord.lng]}
              icon={createCustomIcon(index === 0 ? '#22c55e' : index === selectedRoute.length - 1 ? '#ef4444' : '#3b82f6')}
            >
              <Popup>
                {index === 0 ? '始点' : index === selectedRoute.length - 1 ? '終点' : `経由点 ${index}`}
              </Popup>
            </Marker>
          ))}
          {selectedRoute.length > 1 && (
            <Polyline
              positions={selectedRoute.map(coord => [coord.lat, coord.lng])}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
            />
          )}
        </>
      )}

      {roads.map((road) => {
        const position: [number, number] = [road.latitude, road.longitude];
        const hasRoute = road.route && road.route.length > 1;

        return (
          <div key={road.id}>
            {hasRoute && (
              <Polyline
                positions={road.route!.map(coord => [coord.lat, coord.lng])}
                color={getMarkerColor(road.condition)}
                weight={4}
                opacity={0.7}
              >
                <Popup maxWidth={400}>
                  <RoadPopup
                    road={road}
                    userId={userId || null}
                    getMarkerColor={getMarkerColor}
                    getConditionLabel={getConditionLabel}
                    userHasLiked={userLikedRoadIds.has(road.id)}
                  />
                </Popup>
              </Polyline>
            )}
            <Marker
              position={position}
              icon={createCustomIcon(getMarkerColor(road.condition))}
              eventHandlers={{
                add: (e) => {
                  // 選択された林道の場合、自動的にポップアップを開く
                  if (selectedRoadId === road.id) {
                    setTimeout(() => {
                      e.target.openPopup();
                    }, 500);
                  }
                },
                click: (e) => {
                  // マーカーがクリックされた時、マップの位置を調整
                  const map = e.target._map;
                  if (map) {
                    // マップのコンテナサイズを取得
                    const mapSize = map.getSize();

                    // マーカーの位置を画面最下部に配置
                    const targetPoint = map.project(position, map.getZoom());
                    const offsetY = mapSize.y / 2; // 画面最下部
                    const targetLatLng = map.unproject(targetPoint.subtract([0, offsetY]), map.getZoom());

                    // スムーズにアニメーション
                    map.flyTo(targetLatLng, map.getZoom(), {
                      duration: 0.5,
                      easeLinearity: 0.25
                    });
                  }
                },
                popupclose: (e) => {
                  // ポップアップが閉じられた時、マーカーを画面中央に戻す
                  const map = e.target._map;
                  if (map) {
                    // マーカーの実際の位置を画面中央に戻す
                    map.flyTo(position, map.getZoom(), {
                      duration: 0.5,
                      easeLinearity: 0.25
                    });
                  }
                }
              }}
            >
              <Popup maxWidth={400}>
                <RoadPopup
                  road={road}
                  userId={userId || null}
                  getMarkerColor={getMarkerColor}
                  getConditionLabel={getConditionLabel}
                  userHasLiked={userLikedRoadIds.has(road.id)}
                />
              </Popup>
            </Marker>
          </div>
        );
      })}
      </MapContainer>
    </div>
  );
}
