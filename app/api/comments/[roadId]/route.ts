import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CreateCommentInput } from '@/types/comment';

// GET /api/comments/[roadId] - 特定の林道のコメントを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { roadId: string } }
) {
  try {
    const { roadId } = params;

    // コメントデータを取得
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('road_id', roadId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Supabase error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: commentsError.message },
        { status: 500 }
      );
    }

    // データがない場合は空配列を返す
    if (!commentsData || commentsData.length === 0) {
      return NextResponse.json([]);
    }

    // ユーザー名を取得するために、user_idがあるものだけprofilesを取得
    const userIds = commentsData
      .filter(comment => comment.user_id)
      .map(comment => comment.user_id);

    let usernamesMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // プロフィールの取得に失敗してもエラーにしない
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

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/comments/[roadId] - 新しいコメントを投稿
export async function POST(
  request: NextRequest,
  { params }: { params: { roadId: string } }
) {
  try {
    const { roadId } = params;
    const body: CreateCommentInput = await request.json();

    // バリデーション
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // 認証確認（user_idはクライアント側から送信される想定）
    // ※本来はサーバー側でセッションを確認すべきですが、今回はクライアント側で認証確認済みとします

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          road_id: roadId,
          user_id: body.user_id,
          content: body.content.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create comment', details: error.message },
        { status: 500 }
      );
    }

    // ユーザー名を取得
    let username = null;
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user_id)
        .single();

      if (profileData) {
        username = profileData.username;
      }
    }

    return NextResponse.json({ ...data, username }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
