'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { RoadCondition, Coordinate, VehicleType, DifficultyDetail } from '@/types/road';
import { useAuth } from '@/lib/auth-context';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { isInJapan, JAPAN_CENTER, JAPAN_DEFAULT_ZOOM } from '@/lib/japan-bounds';
import DifficultySelector from '@/components/DifficultySelector';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '300px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px'
    }}>
      <p style={{ color: '#666' }}>マップを読み込み中...</p>
    </div>
  ),
});

export default function PostPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [condition, setCondition] = useState<RoadCondition | ''>('good'); // 後方互換性のためデフォルト値
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<Coordinate[]>([]);
  const [routeMode, setRouteMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新しい難易度システムのstate
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyDetail[]>([]);
  const [isPassable, setIsPassable] = useState<boolean>(true);
  const [conditionNotes, setConditionNotes] = useState<string>('');

  // 認証チェック: 未ログインの場合はログインページにリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleMapClick = (lat: number, lng: number) => {
    // 日本国内かチェック
    if (!isInJapan(lat, lng)) {
      setError('日本国内の位置のみ選択できます');
      return;
    }

    if (routeMode) {
      // ルートモード: 座標を配列に追加
      const newCoord: Coordinate = { lat, lng };
      setRoute(prevRoute => [...prevRoute, newCoord]);

      // 最初の座標はpositionにも設定（始点として）
      if (route.length === 0) {
        setPosition([lat, lng]);
      }
    } else {
      // 単一位置モード: 座標を1つだけ保存
      setPosition([lat, lng]);
      setRoute([]);
    }

    setError(null); // エラーをクリア
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (routeMode) {
      if (route.length < 2) {
        setError('ルートモードでは少なくとも2点を選択してください（始点と終点）');
        return;
      }
      // ルートの全ての点が日本国内かチェック
      for (const coord of route) {
        if (!isInJapan(coord.lat, coord.lng)) {
          setError('日本国内の位置のみ投稿できます');
          return;
        }
      }
    } else {
      if (!position) {
        setError('地図上で位置を選択してください');
        return;
      }
      // 日本国内かチェック
      if (!isInJapan(position[0], position[1])) {
        setError('日本国内の位置のみ投稿できます');
        return;
      }
    }

    // 新しい難易度システムのバリデーション
    if (isPassable) {
      if (selectedVehicles.length === 0) {
        setError('通行可能な車種を選択してください');
        return;
      }
      if (!selectedVehicles.includes('ALL') && selectedDifficulties.length === 0) {
        setError('詳細な難易度を選択してください');
        return;
      }
    } else {
      if (!conditionNotes.trim()) {
        setError('通行不可の場合は、詳細メモに理由を記入してください');
        return;
      }
    }

    if (!user) {
      setError('ログインが必要です');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const roadData = {
        name,
        condition: condition || 'good', // 後方互換性のため
        description: description || null,
        latitude: routeMode ? route[0].lat : position![0],
        longitude: routeMode ? route[0].lng : position![1],
        route: routeMode && route.length > 1 ? route : null,
        user_id: user.id,
        // 新しい難易度フィールド
        difficulty_vehicle: selectedVehicles,
        difficulty_detail: selectedDifficulties,
        is_passable: isPassable,
        condition_notes: conditionNotes || null,
      };

      console.log('Submitting road data:', roadData);

      // クライアント側で直接Supabaseに保存
      const { data, error: insertError } = await supabaseBrowser
        .from('roads')
        .insert(roadData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message || '投稿に失敗しました');
      }

      console.log('Success! Created road:', data);

      // Success - redirect to map page
      router.push('/');
    } catch (err) {
      console.error('Error submitting road:', err);
      const errorMessage = err instanceof Error ? err.message : '投稿に失敗しました';
      console.error('Full error:', errorMessage);
      setError(errorMessage);
      setSubmitting(false);
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
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#2d5016'
      }}>
        林道情報を投稿
      </h2>

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {/* 林道名 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="roadName"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#333'
            }}
          >
            林道名 <span style={{ color: '#c33' }}>*</span>
          </label>
          <input
            type="text"
            id="roadName"
            name="roadName"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 富士山林道"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 新しい多層的難易度システム */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#2d5016',
            marginBottom: '1rem'
          }}>
            通行情報・難易度設定
          </h3>
          <DifficultySelector
            selectedVehicles={selectedVehicles}
            selectedDifficulties={selectedDifficulties}
            isPassable={isPassable}
            conditionNotes={conditionNotes}
            onVehiclesChange={setSelectedVehicles}
            onDifficultiesChange={setSelectedDifficulties}
            onPassableChange={setIsPassable}
            onNotesChange={setConditionNotes}
          />
        </div>

        {/* 詳細 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="description"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#333'
            }}
          >
            詳細
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="林道の状況や注意点を記入してください"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* 位置情報 */}
        <div style={{ marginBottom: '2rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#333'
            }}
          >
            位置情報 <span style={{ color: '#c33' }}>*</span>
          </label>

          {/* ルートモード切り替えボタン */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setRouteMode(!routeMode);
                setRoute([]);
                setPosition(null);
              }}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: routeMode ? 'white' : '#2d5016',
                backgroundColor: routeMode ? '#2d5016' : 'white',
                border: '2px solid #2d5016',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {routeMode ? 'ルートモード ON' : 'ルートモード OFF'}
            </button>
            {routeMode && route.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRoute([]);
                  setPosition(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ルートをクリア
              </button>
            )}
          </div>

          <p style={{
            fontSize: '0.9rem',
            color: '#666',
            marginBottom: '0.5rem'
          }}>
            {routeMode
              ? '地図をクリックして林道のルート（始点→経由点→終点）を順に選択してください'
              : '地図をクリックして林道の位置を選択してください'
            }
          </p>

          {routeMode && route.length > 0 && (
            <p style={{
              fontSize: '0.9rem',
              color: '#2d5016',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              選択された座標数: {route.length}点
              {route.length >= 2 && ` (始点、${route.length - 2}個の経由点、終点)`}
            </p>
          )}

          {!routeMode && position && (
            <p style={{
              fontSize: '0.9rem',
              color: '#2d5016',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              選択された位置: 緯度 {position[0].toFixed(5)}, 経度 {position[1].toFixed(5)}
            </p>
          )}

          <div
            style={{
              width: '100%',
              height: '400px',
              border: (routeMode && route.length > 0) || (!routeMode && position) ? '2px solid #2d5016' : '2px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <Map
              roads={[]}
              center={position || JAPAN_CENTER}
              zoom={position ? 10 : JAPAN_DEFAULT_ZOOM}
              onMapClick={handleMapClick}
              selectedPosition={!routeMode ? position : null}
              selectedRoute={routeMode ? route : null}
              routeMode={routeMode}
            />
          </div>
        </div>

        {/* 投稿ボタン */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'white',
            backgroundColor: submitting ? '#999' : '#2d5016',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!submitting) e.currentTarget.style.backgroundColor = '#3d6920';
          }}
          onMouseLeave={(e) => {
            if (!submitting) e.currentTarget.style.backgroundColor = '#2d5016';
          }}
        >
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </form>
    </div>
  );
}
