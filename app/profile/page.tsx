'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { LikeWithRoad } from '@/types/like';
import type { Road } from '@/types/road';

/**
 * プロフィールページ
 *
 * ログイン中のユーザーの情報と、いいねした林道の一覧を表示します。
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, username, loading: authLoading } = useAuth();
  const [likedRoads, setLikedRoads] = useState<LikeWithRoad[]>([]);
  const [postedRoads, setPostedRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 認証チェックが完了し、ユーザーがログインしていない場合はログインページへリダイレクト
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchLikedRoads();
      fetchPostedRoads();
    }
  }, [user]);

  /**
   * ユーザーがいいねした林道を取得する
   */
  const fetchLikedRoads = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. likesテーブルから、現在のユーザーがいいねした林道のIDと作成日を取得
      const { data: likesData, error: likesError } = await supabaseBrowser
        .from('likes')
        .select('id, user_id, road_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        console.error('Error details:', JSON.stringify(likesError, null, 2));
        throw new Error(`いいね情報の取得に失敗しました: ${likesError.message || JSON.stringify(likesError)}`);
      }

      if (!likesData || likesData.length === 0) {
        setLikedRoads([]);
        return;
      }

      // 2. いいねした林道のIDリストを取得
      const roadIds = likesData.map(like => like.road_id);

      // 3. roadsテーブルから林道情報を取得
      const { data: roadsData, error: roadsError } = await supabaseBrowser
        .from('roads')
        .select('id, name, condition, description, latitude, longitude, created_at, user_id')
        .in('id', roadIds);

      if (roadsError) {
        console.error('Error fetching roads:', roadsError);
        console.error('Error details:', JSON.stringify(roadsError, null, 2));
        throw new Error(`林道情報の取得に失敗しました: ${roadsError.message || JSON.stringify(roadsError)}`);
      }

      // 4. ユーザー名を取得（roadsにuser_idがある場合のみ）
      const userIds = roadsData?.filter(road => road.user_id).map(road => road.user_id) || [];
      let usernamesMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabaseBrowser
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          usernamesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.username;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // 5. いいねデータと林道データをマージ
      const roadsMap = new Map(roadsData?.map(road => [road.id, road]) || []);

      const formattedData: LikeWithRoad[] = likesData
        .map(like => {
          const road = roadsMap.get(like.road_id);
          if (!road) return null;

          return {
            id: like.id,
            user_id: like.user_id,
            road_id: like.road_id,
            created_at: like.created_at,
            roads: {
              ...road,
              username: road.user_id ? (usernamesMap[road.user_id] || null) : null,
            },
          };
        })
        .filter((item): item is LikeWithRoad => item !== null);

      setLikedRoads(formattedData);
    } catch (err) {
      console.error('Error fetching liked roads:', err);
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ユーザーが投稿した林道を取得する
   */
  const fetchPostedRoads = async () => {
    if (!user) return;

    try {
      const { data: roadsData, error: roadsError } = await supabaseBrowser
        .from('roads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (roadsError) {
        console.error('Error fetching posted roads:', roadsError);
        throw new Error(`投稿した林道情報の取得に失敗しました: ${roadsError.message}`);
      }

      setPostedRoads(roadsData || []);
    } catch (err) {
      console.error('Error fetching posted roads:', err);
    }
  };

  /**
   * いいねを削除する
   */
  const handleRemoveLike = async (roadId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabaseBrowser
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('road_id', roadId);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        throw new Error('いいねの削除に失敗しました');
      }

      // UIから削除
      setLikedRoads(likedRoads.filter(like => like.road_id !== roadId));
    } catch (err) {
      console.error('Error removing like:', err);
      const errorMessage = err instanceof Error ? err.message : 'いいねの削除に失敗しました';
      alert(errorMessage);
    }
  };

  /**
   * 投稿した林道を削除する（コメントも自動削除）
   */
  const handleDeleteRoad = async (roadId: string, roadName: string) => {
    if (!user) return;

    // 確認ダイアログ
    if (!confirm(`「${roadName}」を削除してもよろしいですか？\n\nこの操作は取り消せません。\n投稿に付随するコメントやいいねも全て削除されます。`)) {
      return;
    }

    try {
      // クライアント側で直接Supabaseから削除（RLSを通過するため認証済みセッションを使用）
      // commentsテーブルはON DELETE CASCADEなので自動的に削除される
      const { error: deleteError } = await supabaseBrowser
        .from('roads')
        .delete()
        .eq('id', roadId)
        .eq('user_id', user.id); // 自分の投稿のみ削除可能

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(deleteError.message || '削除に失敗しました');
      }

      console.log('Success! Deleted road:', roadId);

      // UIから削除
      setPostedRoads(postedRoads.filter(road => road.id !== roadId));

      // 成功メッセージ
      alert('林道を削除しました');
    } catch (err) {
      console.error('Error deleting road:', err);
      const errorMessage = err instanceof Error ? err.message : '削除に失敗しました';
      alert(errorMessage);
    }
  };

  // ローディング中
  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合（リダイレクト前）
  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: 'clamp(1rem, 3vw, 1.5rem)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2d5016',
          }}>
            プロフィール
          </h1>
          <p style={{
            margin: '0',
            fontSize: '16px',
            color: '#666',
          }}>
            ユーザー名: <strong>{username || 'ユーザー'}</strong>
          </p>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: '#999',
          }}>
            メール: {user.email}
          </p>
        </div>

        {/* 投稿した林道セクション */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#2d5016',
          }}>
            投稿した林道 ({postedRoads.length})
          </h2>

          {postedRoads.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#999',
            }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                まだ林道を投稿していません
              </p>
              <button
                onClick={() => router.push('/post')}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#2d5016',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d6920'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d5016'}
              >
                林道を投稿する
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {postedRoads.map((road) => (
                <div
                  key={road.id}
                  style={{
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#333',
                    }}>
                      {road.name}
                    </h3>
                  </div>

                  {road.description && (
                    <p style={{
                      margin: '8px 0',
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.5',
                    }}>
                      {road.description}
                    </p>
                  )}

                  <div style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#999',
                  }}>
                    <p style={{ margin: 0 }}>
                      投稿日: {new Date(road.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '12px',
                  }}>
                    <Link
                      href={`/?roadId=${road.id}`}
                      style={{
                        padding: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: '#2d5016',
                        border: 'none',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        transition: 'background-color 0.2s',
                        display: 'block',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d6920'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d5016'}
                    >
                      マップで見る
                    </Link>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                    }}>
                      <Link
                        href={`/edit/${road.id}`}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#2d5016',
                          backgroundColor: 'white',
                          border: '1px solid #2d5016',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'block',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2d5016';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#2d5016';
                        }}
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDeleteRoad(road.id, road.name)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#c33',
                          backgroundColor: 'white',
                          border: '1px solid #c33',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#c33';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#c33';
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* いいねした林道セクション */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#2d5016',
          }}>
            いいねした林道 ({likedRoads.length})
          </h2>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#c33',
            }}>
              {error}
            </div>
          )}

          {likedRoads.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#999',
            }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                まだいいねした林道はありません
              </p>
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#2d5016',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d6920'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d5016'}
              >
                地図を見る
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {likedRoads.map((like) => (
                <div
                  key={like.id}
                  style={{
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#333',
                    }}>
                      {like.roads?.name || '不明な林道'}
                    </h3>
                  </div>

                  {like.roads?.description && (
                    <p style={{
                      margin: '8px 0',
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.5',
                    }}>
                      {like.roads.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#999',
                  }}>
                    <p style={{ margin: 0 }}>
                      投稿者: {like.roads?.username || '匿名'}
                    </p>
                    <span>•</span>
                    <p style={{ margin: 0 }}>
                      いいね日: {new Date(like.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                  }}>
                    <Link
                      href={`/?roadId=${like.road_id}`}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: '#2d5016',
                        border: 'none',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        transition: 'background-color 0.2s',
                        display: 'block',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d6920'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d5016'}
                    >
                      マップで見る
                    </Link>
                    <button
                      onClick={() => handleRemoveLike(like.road_id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#c33',
                        backgroundColor: 'white',
                        border: '1px solid #c33',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c33';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#c33';
                      }}
                    >
                      いいね解除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ホームに戻るボタン */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2d5016',
              backgroundColor: 'white',
              border: '2px solid #2d5016',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2d5016';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#2d5016';
            }}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
