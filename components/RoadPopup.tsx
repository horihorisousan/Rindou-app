'use client';

import { useState, useEffect } from 'react';
import type { Road } from '@/types/road';
import type { Comment } from '@/types/comment';
import { supabaseBrowser } from '@/lib/supabase-browser';
import LikeButton from '@/components/LikeButton';

interface RoadPopupProps {
  road: Road;
  userId: string | null;
  getMarkerColor: (condition: string) => string;
  getConditionLabel: (condition: string) => string;
  userHasLiked?: boolean;
}

export default function RoadPopup({ road, userId, getMarkerColor, getConditionLabel, userHasLiked = false }: RoadPopupProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [road.id]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      // コメントデータを取得
      const { data: commentsData, error: commentsError } = await supabaseBrowser
        .from('comments')
        .select('*')
        .eq('road_id', road.id)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Supabase error fetching comments:', commentsError);
        throw new Error('Failed to fetch comments');
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // ユーザー名を取得
      const userIds = commentsData
        .filter(comment => comment.user_id)
        .map(comment => comment.user_id);

      let usernamesMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabaseBrowser
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profilesData) {
          usernamesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.username;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // データを整形してusernameを含める
      const formattedData = commentsData.map((comment: any) => ({
        ...comment,
        username: comment.user_id ? (usernamesMap[comment.user_id] || null) : null,
      }));

      setComments(formattedData);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('コメントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError('コメントするにはログインが必要です');
      return;
    }

    if (!newComment.trim()) {
      setError('コメントを入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting comment:', {
        road_id: road.id,
        user_id: userId,
        content: newComment.trim(),
      });

      // クライアント側で直接Supabaseに保存
      const { data: commentData, error: insertError } = await supabaseBrowser
        .from('comments')
        .insert({
          road_id: road.id,
          user_id: userId,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message || 'コメントの投稿に失敗しました');
      }

      console.log('Success! Created comment:', commentData);

      // ユーザー名を取得
      let username = null;
      if (commentData.user_id) {
        const { data: profileData } = await supabaseBrowser
          .from('profiles')
          .select('username')
          .eq('id', commentData.user_id)
          .single();

        if (profileData) {
          username = profileData.username;
        }
      }

      // コメントリストに追加
      setComments([...comments, { ...commentData, username }]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      const errorMessage = err instanceof Error ? err.message : 'コメントの投稿に失敗しました';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minWidth: '280px', maxWidth: '350px' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
        {road.name}
      </h3>
      <p style={{
        margin: '4px 0',
        padding: '4px 8px',
        backgroundColor: getMarkerColor(road.condition),
        color: 'white',
        borderRadius: '4px',
        display: 'inline-block',
        fontSize: '14px'
      }}>
        {getConditionLabel(road.condition)}
      </p>
      {road.description && (
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>
          {road.description}
        </p>
      )}
      <div style={{ margin: '8px 0 0 0' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
          投稿日: {new Date(road.created_at).toLocaleDateString('ja-JP')}
        </p>
        {road.username && (
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
            投稿者: {road.username}
          </p>
        )}
      </div>

      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #eee',
        display: 'flex',
        gap: '8px'
      }}>
        <a
          href={`https://www.google.com/maps?q=${road.latitude},${road.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'white',
            backgroundColor: '#4285f4',
            border: 'none',
            borderRadius: '4px',
            textDecoration: 'none',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#357ae8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
        >
          Google Maps
        </a>
        <a
          href={`https://maps.apple.com/?ll=${road.latitude},${road.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'white',
            backgroundColor: '#000000',
            border: 'none',
            borderRadius: '4px',
            textDecoration: 'none',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000'}
        >
          Apple Maps
        </a>
      </div>

      {/* いいねボタンセクション */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #eee'
      }}>
        <LikeButton
          roadId={road.id}
          initialLikesCount={road.likes_count || 0}
          userHasLiked={userHasLiked}
          userId={userId}
        />
      </div>

      {/* コメントセクション */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #eee'
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          コメント ({comments.length})
        </h4>

        {/* コメント一覧 */}
        {loading ? (
          <p style={{ fontSize: '12px', color: '#999' }}>読み込み中...</p>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#999', margin: '8px 0' }}>
            まだコメントはありません
          </p>
        ) : (
          <div style={{
            maxHeight: '130px',
            overflowY: 'auto',
            marginBottom: '12px',
            padding: '4px'
          }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#2d5016' }}>
                    {comment.username || '匿名ユーザー'}
                  </span>
                  <span style={{ color: '#999', fontSize: '11px' }}>
                    {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p style={{ margin: '0', color: '#333', lineHeight: '1.4' }}>
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* コメント投稿フォーム */}
        {userId ? (
          <form onSubmit={handleSubmitComment} style={{ marginTop: '12px' }}>
            {error && (
              <div style={{
                padding: '6px 8px',
                marginBottom: '8px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#c33'
              }}>
                {error}
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              rows={3}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: '8px'
              }}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: submitting || !newComment.trim() ? '#ccc' : '#2d5016',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!submitting && newComment.trim()) {
                  e.currentTarget.style.backgroundColor = '#3d6920';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && newComment.trim()) {
                  e.currentTarget.style.backgroundColor = '#2d5016';
                }
              }}
            >
              {submitting ? '投稿中...' : 'コメントする'}
            </button>
          </form>
        ) : (
          <p style={{
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px'
          }}>
            コメントするにはログインしてください
          </p>
        )}
      </div>
    </div>
  );
}
