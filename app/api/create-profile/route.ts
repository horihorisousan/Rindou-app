import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json();

    if (!userId || !username) {
      return NextResponse.json(
        { error: 'ユーザーIDとユーザー名が必要です' },
        { status: 400 }
      );
    }

    // ユーザー名の形式チェック
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'ユーザー名は3〜20文字の英数字とアンダースコアのみ使用できます' },
        { status: 400 }
      );
    }

    // プロフィールを作成
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          username: username,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      
      // 重複エラーのチェック
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'このユーザー名は既に使用されています' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'プロフィールの作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
