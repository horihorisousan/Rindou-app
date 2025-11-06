'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Coordinate, VehicleType, DifficultyDetail, Road } from '@/types/road';
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

export default function EditRoadPage() {
  const router = useRouter();
  const params = useParams();
  const roadId = params.roadId as string;
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
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

  // 認証チェック: 未ログインの場合はログインページにリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // 既存の林道データを読み込み
  useEffect(() => {
    if (user && roadId) {
      fetchRoadData();
    }
  }, [user, roadId]);

  const fetchRoadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/roads/${roadId}`);

      if (!response.ok) {
        throw new Error('林道情報の取得に失敗しました');
      }

      const road: Road = await response.json();

      // 投稿者チェック
      if (road.user_id !== user?.id) {
        setError('この林道は編集できません（投稿者のみ編集可能）');
        setTimeout(() => router.push('/profile'), 2000);
        return;
      }

      // データを state にセット
      setName(road.name);
      setDescription(road.description || '');
      setPosition([road.latitude, road.longitude]);

      if (road.route && road.route.length > 1) {
        setRoute(road.route);
        setRouteMode(true);
      }

      // 難易度情報
      setSelectedVehicles(road.difficulty_vehicle || []);
      setSelectedDifficulties(road.difficulty_detail || []);
      setIsPassable(road.is_passable !== false);
    } catch (err) {
      console.error('Error fetching road:', err);
      setError(err instanceof Error ? err.message : '林道情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
      if (!description.trim()) {
        setError('通行不可の場合は、詳細欄に理由を記入してください');
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
        condition: 'good' as const, // 固定値（後方互換性のため）
        description: description || null,
        latitude: routeMode ? route[0].lat : position![0],
        longitude: routeMode ? route[0].lng : position![1],
        route: routeMode && route.length > 1 ? route : null,
        // 新しい難易度フィールド
        difficulty_vehicle: selectedVehicles,
        difficulty_detail: selectedDifficulties,
        is_passable: isPassable,
      };

      console.log('Updating road data:', roadData);

      // クライアント側で直接Supabaseに更新（RLSを通過するため認証済みセッションを使用）
      const { data, error: updateError } = await supabaseBrowser
        .from('roads')
        .update(roadData)
        .eq('id', roadId)
        .eq('user_id', user.id) // 自分の投稿のみ更新可能
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message || '更新に失敗しました');
      }

      console.log('Success! Updated road:', data);

      // Success - redirect to profile page
      router.push('/profile');
    } catch (err) {
      console.error('Error updating road:', err);
      const errorMessage = err instanceof Error ? err.message : '更新に失敗しました';
      console.error('Full error:', errorMessage);
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当にこの林道を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setSubmitting(true);

      // クライアント側で直接Supabaseから削除（RLSを通過するため認証済みセッションを使用）
      const { error: deleteError } = await supabaseBrowser
        .from('roads')
        .delete()
        .eq('id', roadId)
        .eq('user_id', user?.id); // 自分の投稿のみ削除可能

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(deleteError.message || '削除に失敗しました');
      }

      console.log('Success! Deleted road');

      // Success - redirect to profile page
      router.push('/profile');
    } catch (err) {
      console.error('Error deleting road:', err);
      const errorMessage = err instanceof Error ? err.message : '削除に失敗しました';
      alert(errorMessage);
      setSubmitting(false);
    }
  };

  // 認証チェック中またはデータ読み込み中の表示
  if (authLoading || loading) {
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
      padding: 'clamp(1rem, 3vw, 2rem)'
    }}>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#2d5016'
      }}>
        林道情報を編集
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
            onVehiclesChange={setSelectedVehicles}
            onDifficultiesChange={setSelectedDifficulties}
            onPassableChange={setIsPassable}
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
            詳細 {!isPassable && <span style={{ color: '#c33' }}>*</span>}
          </label>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
            {!isPassable
              ? '通行止めの理由や期間を記入してください'
              : '林道の状況、注意点、路面の詳細などを記入してください'}
          </p>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              !isPassable
                ? '例: 2024年11月より通行止め。土砂崩れのため。'
                : '例: 雨天時は泥濘が深くなります。夏季は草木が茂り見通しが悪くなります。'
            }
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
                if (!routeMode) {
                  // ルートモードに切り替える場合、現在のpositionをルートの最初の点にする
                  if (position) {
                    setRoute([{ lat: position[0], lng: position[1] }]);
                  }
                } else {
                  // ルートモードを解除する場合、ルートの最初の点をpositionにする
                  if (route.length > 0) {
                    setPosition([route[0].lat, route[0].lng]);
                  }
                  setRoute([]);
                }
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

        {/* ボタン群 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
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
            {submitting ? '更新中...' : '更新する'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#c33',
              backgroundColor: 'white',
              border: '2px solid #c33',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#c33';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#c33';
              }
            }}
          >
            削除
          </button>
        </div>
      </form>
    </div>
  );
}
