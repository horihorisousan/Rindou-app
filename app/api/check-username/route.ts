import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'ユーザー名が指定されていません' },
      { status: 400 }
    );
  }

  // ユーザー名の形式チェック
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return NextResponse.json(
      { available: false, error: 'ユーザー名は3〜20文字の英数字とアンダースコアのみ使用できます' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);

      // テーブルが存在しない場合のエラー
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'データベースのセットアップが必要です。supabase-setup.sqlを実行してください。' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `データベースエラー: ${error.message}` },
        { status: 500 }
      );
    }

    // データが存在しない場合は利用可能
    return NextResponse.json({ available: !data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
