'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface RoadFeature {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
  status: 'pending' | 'approved' | 'skipped';
  editedName?: string;
  editedDescription?: string;
}

const PREFECTURES = [
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県',
];

export default function AdminImportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [roads, setRoads] = useState<RoadFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingRoad, setEditingRoad] = useState<RoadFeature | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user.email))) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  const fetchRoads = async () => {
    if (!selectedPrefecture) return;

    setLoading(true);
    setError(null);
    setRoads([]);

    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        throw new Error('セッションが見つかりません');
      }

      const response = await fetch('/api/admin/fetch-roads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prefecture: selectedPrefecture }),
      });

      if (!response.ok) {
        throw new Error('林道データの取得に失敗しました');
      }

      const data = await response.json();
      setRoads(data.roads.map((r: any) => ({ ...r, status: 'pending' })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRoadStatus = (id: string, status: 'pending' | 'approved' | 'skipped') => {
    setRoads(roads.map(r => r.id === id ? { ...r, status } : r));
  };

  const openEditModal = (road: RoadFeature) => {
    setEditingRoad({
      ...road,
      editedName: road.editedName || road.name,
      editedDescription: road.editedDescription || generateDescription(road.tags),
    });
  };

  const saveEdit = () => {
    if (!editingRoad) return;
    setRoads(roads.map(r => r.id === editingRoad.id ? {
      ...r,
      editedName: editingRoad.editedName,
      editedDescription: editingRoad.editedDescription,
      status: 'approved',
    } : r));
    setEditingRoad(null);
  };

  const generateDescription = (tags: Record<string, string>) => {
    const parts = [];
    if (tags.surface) parts.push(`路面: ${tags.surface}`);
    if (tags.tracktype) parts.push(`種別: ${tags.tracktype}`);
    if (tags.width) parts.push(`幅: ${tags.width}`);
    return parts.join(', ') || '詳細情報なし';
  };

  const bulkImport = async () => {
    const approvedRoads = roads
      .filter(r => r.status === 'approved')
      .map(r => ({
        name: r.editedName || r.name,
        description: r.editedDescription || generateDescription(r.tags),
        latitude: r.latitude,
        longitude: r.longitude,
      }));

    if (approvedRoads.length === 0) {
      setError('承認された林道がありません');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        throw new Error('セッションが見つかりません');
      }

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roads: approvedRoads }),
      });

      if (!response.ok) {
        throw new Error('一括投稿に失敗しました');
      }

      const data = await response.json();
      setSuccess(`${data.inserted}件の林道を投稿しました`);
      setRoads([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>;
  }

  if (!user || !isAdmin(user.email)) {
    return null;
  }

  const approvedCount = roads.filter(r => r.status === 'approved').length;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    }}>
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '1.5rem',
        color: '#2d5016',
      }}>
        林道一括インポート（管理者専用）
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
      }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          都道府県を選択:
        </label>
        <select
          value={selectedPrefecture}
          onChange={(e) => setSelectedPrefecture(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <option value="">-- 選択してください --</option>
          {PREFECTURES.map(pref => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>

        <button
          onClick={fetchRoads}
          disabled={!selectedPrefecture || loading}
          style={{
            backgroundColor: selectedPrefecture && !loading ? '#2d5016' : '#ccc',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedPrefecture && !loading ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          {loading ? '取得中...' : 'OpenStreetMapから林道を取得'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#efe',
          color: '#3c3',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {success}
        </div>
      )}

      {roads.length > 0 && (
        <>
          <div style={{
            backgroundColor: '#f0f8ff',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ margin: 0 }}>
              取得件数: {roads.length}件 | 承認済み: {approvedCount}件
            </p>
            <button
              onClick={bulkImport}
              disabled={approvedCount === 0 || importing}
              style={{
                backgroundColor: approvedCount > 0 && !importing ? '#4CAF50' : '#ccc',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: approvedCount > 0 && !importing ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {importing ? '投稿中...' : `承認した${approvedCount}件を一括投稿`}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {roads.map(road => (
              <div
                key={road.id}
                style={{
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: road.status === 'approved' ? '2px solid #4CAF50' : road.status === 'skipped' ? '2px solid #ccc' : '1px solid #ddd',
                  opacity: road.status === 'skipped' ? 0.5 : 1,
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  {road.editedName || road.name}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  緯度: {road.latitude.toFixed(5)}, 経度: {road.longitude.toFixed(5)}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                  {road.editedDescription || generateDescription(road.tags)}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {road.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateRoadStatus(road.id, 'approved')}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        ✓ 承認
                      </button>
                      <button
                        onClick={() => openEditModal(road)}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        ✎ 編集
                      </button>
                      <button
                        onClick={() => updateRoadStatus(road.id, 'skipped')}
                        style={{
                          backgroundColor: '#ccc',
                          color: '#666',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        ✗ スキップ
                      </button>
                    </>
                  )}
                  {road.status === 'approved' && (
                    <button
                      onClick={() => updateRoadStatus(road.id, 'pending')}
                      style={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      取り消し
                    </button>
                  )}
                  {road.status === 'skipped' && (
                    <button
                      onClick={() => updateRoadStatus(road.id, 'pending')}
                      style={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      取り消し
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 編集モーダル */}
      {editingRoad && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingRoad(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>林道情報を編集</h2>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              林道名:
            </label>
            <input
              type="text"
              value={editingRoad.editedName || ''}
              onChange={(e) => setEditingRoad({ ...editingRoad, editedName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '1rem',
              }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              説明:
            </label>
            <textarea
              value={editingRoad.editedDescription || ''}
              onChange={(e) => setEditingRoad({ ...editingRoad, editedDescription: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingRoad(null)}
                style={{
                  backgroundColor: '#ccc',
                  color: '#666',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                style={{
                  backgroundColor: '#2d5016',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                保存して承認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
