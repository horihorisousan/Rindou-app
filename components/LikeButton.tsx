'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface LikeButtonProps {
  roadId: string;
  initialLikesCount: number;
  userHasLiked: boolean;
  userId: string | null;
}

/**
 * いいねボタンコンポーネント
 *
 * ユーザーが林道に「いいね」を付けたり削除したりできる機能を提供します。
 * - 認証済みユーザーのみがいいねできます
 * - いいねの状態はSupabaseのlikesテーブルで管理されます
 * - リアルタイムでいいね数が更新されます
 */
export default function LikeButton({
  roadId,
  initialLikesCount,
  userHasLiked: initialUserHasLiked,
  userId,
}: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [userHasLiked, setUserHasLiked] = useState(initialUserHasLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // propsが変更されたら状態を更新
    setLikesCount(initialLikesCount);
    setUserHasLiked(initialUserHasLiked);
  }, [initialLikesCount, initialUserHasLiked]);

  /**
   * いいねをトグル（追加/削除）する
   */
  const handleToggleLike = async () => {
    if (!userId) {
      setError('いいねするにはログインが必要です');
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    // 楽観的UI更新: すぐに状態を変更して、ユーザーにフィードバックを提供
    const previousLikesCount = likesCount;
    const previousUserHasLiked = userHasLiked;

    setUserHasLiked(!userHasLiked);
    setLikesCount(userHasLiked ? likesCount - 1 : likesCount + 1);

    try {
      if (userHasLiked) {
        // いいねを削除
        const { error: deleteError } = await supabaseBrowser
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('road_id', roadId);

        if (deleteError) {
          console.error('Error deleting like:', deleteError);
          throw new Error('いいねの削除に失敗しました');
        }
      } else {
        // いいねを追加
        const { error: insertError } = await supabaseBrowser
          .from('likes')
          .insert({
            user_id: userId,
            road_id: roadId,
          });

        if (insertError) {
          console.error('Error inserting like:', insertError);
          // 既にいいね済みの場合は無視
          if (insertError.code === '23505') {
            // UNIQUE制約違反
            setUserHasLiked(true);
            return;
          }
          throw new Error('いいねの追加に失敗しました');
        }
      }
    } catch (err) {
      // エラーが発生したら状態を元に戻す
      console.error('Error toggling like:', err);
      setUserHasLiked(previousUserHasLiked);
      setLikesCount(previousLikesCount);
      const errorMessage = err instanceof Error ? err.message : 'いいねの操作に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <button
        onClick={handleToggleLike}
        disabled={loading || !userId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          color: userHasLiked ? '#fff' : '#2d5016',
          backgroundColor: userHasLiked ? '#2d5016' : '#f0f0f0',
          border: userHasLiked ? 'none' : '2px solid #2d5016',
          borderRadius: '8px',
          cursor: !userId ? 'not-allowed' : (loading ? 'wait' : 'pointer'),
          transition: 'all 0.2s ease',
          opacity: (!userId || loading) ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (userId && !loading) {
            if (userHasLiked) {
              e.currentTarget.style.backgroundColor = '#3d6920';
            } else {
              e.currentTarget.style.backgroundColor = '#e5e5e5';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (userId && !loading) {
            if (userHasLiked) {
              e.currentTarget.style.backgroundColor = '#2d5016';
            } else {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }
          }
        }}
        title={!userId ? 'ログインが必要です' : (userHasLiked ? 'いいねを解除' : 'いいね')}
      >
        <span style={{
          fontSize: '18px',
          transition: 'transform 0.2s ease',
          display: 'inline-block',
        }}>
          {userHasLiked ? '❤️' : '🤍'}
        </span>
        <span>
          {userHasLiked ? 'いいね済み' : 'いいね'}
          {likesCount > 0 && ` (${likesCount})`}
        </span>
      </button>
      {error && (
        <div style={{
          padding: '6px 8px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#c33',
        }}>
          {error}
        </div>
      )}
      {!userId && (
        <p style={{
          margin: '0',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center',
        }}>
          ログインしていいねしよう
        </p>
      )}
    </div>
  );
}
