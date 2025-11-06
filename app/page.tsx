'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Road } from '@/types/road';
import { useAuth } from '@/lib/auth-context';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { JAPAN_CENTER, JAPAN_DEFAULT_ZOOM, USER_LOCATION_ZOOM, isInJapan } from '@/lib/japan-bounds';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0'
    }}>
      <p style={{ color: '#666' }}>マップを読み込み中...</p>
    </div>
  ),
});

function MapPageContent() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAPAN_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(JAPAN_DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userLikedRoadIds, setUserLikedRoadIds] = useState<Set<string>>(new Set());
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInitializedLocation = useRef(false);

  // 認証チェック: 未ログインの場合はログインページにリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchRoads();
      fetchUserLikes();
    }
  }, [user]);

  // URLパラメータから林道IDを読み取り、該当する林道にズーム
  useEffect(() => {
    const roadId = searchParams.get('roadId');
    if (roadId && roads.length > 0) {
      const targetRoad = roads.find(road => road.id === roadId);
      if (targetRoad) {
        setMapCenter([targetRoad.latitude, targetRoad.longitude]);
        setMapZoom(15);
        setSelectedRoadId(roadId);
        // 位置情報の初期化フラグを設定（現在地取得をスキップ）
        hasInitializedLocation.current = true;
        // URLからroadIdパラメータを削除（履歴を汚さないため）
        router.replace('/', { scroll: false });
      }
    }
  }, [searchParams, roads, router]);

  // ユーザーの位置情報を取得してマップにズーム
  useEffect(() => {
    // roadIdが指定されている場合は位置情報取得をスキップ
    const roadId = searchParams.get('roadId');

    if (roadId) {
      // roadIdが指定されている場合は、このフックの実行自体をスキップ
      return;
    }

    if (user && !hasInitializedLocation.current) {
      hasInitializedLocation.current = true;

      if ('geolocation' in navigator) {
        // まず低精度で素早く位置を取得してから、高精度で再取得
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log('User location obtained:', lat, lng);

            // 日本国内かチェック
            if (isInJapan(lat, lng)) {
              console.log('User is in Japan, zooming to user location');
              setUserLocation([lat, lng]);
              setMapCenter([lat, lng]);
              setMapZoom(USER_LOCATION_ZOOM);
            } else {
              console.log('User is outside Japan, staying at default Japan center');
              // 日本国外の場合は日本の中心に留まる
            }
          },
          (error) => {
            // エラーの種類に応じた詳細なログ
            switch (error.code) {
              case error.PERMISSION_DENIED:
                console.log('位置情報の利用が拒否されました');
                break;
              case error.POSITION_UNAVAILABLE:
                console.log('位置情報が取得できませんでした');
                break;
              case error.TIMEOUT:
                console.log('位置情報の取得がタイムアウトしました');
                break;
              default:
                console.log('位置情報の取得に失敗しました:', error.message);
            }
            console.log('デフォルトの日本中心位置を使用します');

            // 位置情報取得に失敗した場合は日本の中心に留まる（何もしない）
          },
          {
            enableHighAccuracy: false, // localhostでは低精度モードで高速化
            timeout: 10000, // タイムアウトを10秒に延長
            maximumAge: 300000 // 5分以内のキャッシュを許可
          }
        );
      } else {
        console.log('Geolocation not supported, staying at default Japan center');
        // Geolocationがサポートされていない場合は日本の中心に留まる（何もしない）
      }
    }
  }, [user, searchParams]);

  const fetchRoads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roads');

      if (!response.ok) {
        throw new Error('Failed to fetch roads');
      }

      const data = await response.json();
      setRoads(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching roads:', err);
      setError('林道情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabaseBrowser
        .from('likes')
        .select('road_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user likes:', error);
        return;
      }

      if (data) {
        const likedRoadIds = new Set(data.map(like => like.road_id));
        setUserLikedRoadIds(likedRoadIds);
      }
    } catch (err) {
      console.error('Error fetching user likes:', err);
    }
  };

  // 認証チェック中の表示
  if (authLoading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>読み込み中...</p>
      </div>
    );
  }

  // 未ログインの場合は何も表示しない（リダイレクト中）
  if (!user) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)', // ヘッダーの高さを引いた全画面
      position: 'relative'
    }}>
      {error && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33',
          maxWidth: '500px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {error}
        </div>
      )}

      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        {loading ? (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            読み込み中...
          </div>
        ) : (
          <Map
            roads={roads}
            center={mapCenter}
            zoom={mapZoom}
            userId={user?.id || null}
            userLocation={userLocation}
            userLikedRoadIds={userLikedRoadIds}
            selectedRoadId={selectedRoadId}
          />
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>読み込み中...</p>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}
