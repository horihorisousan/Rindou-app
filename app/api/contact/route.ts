import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
      return NextResponse.json(
        { error: 'サーバー設定エラー: SUPABASE_URL' },
        { status: 500 }
      );
    }
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
      return NextResponse.json(
        { error: 'サーバー設定エラー: SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    console.log('Environment variables loaded successfully');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key exists:', !!supabaseServiceKey);

    const { name, email, subject, message } = await request.json();

    // バリデーション
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '全ての項目を入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // Supabaseクライアントの作成（Service Role Keyを使用してRLSをバイパス）
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 認証情報の取得（Cookieからセッションを取得）
    let userId = null;
    try {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();

      // Supabaseのセッションクッキーを探す
      const sessionCookie = allCookies.find(cookie =>
        cookie.name.includes('supabase') && cookie.name.includes('auth-token')
      );

      if (sessionCookie) {
        // 別のクライアントインスタンスでユーザー情報を取得
        const authClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error: authError } = await authClient.auth.getUser(sessionCookie.value);
        if (!authError && user) {
          userId = user.id;
        }
      }
    } catch (error) {
      // 認証エラーは無視（ログインしていない場合も問い合わせ可能）
      console.log('Not authenticated, proceeding without user_id');
    }

    // お問い合わせデータをcontactsテーブルに挿入
    console.log('Attempting to insert contact with user_id:', userId);
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          name,
          email,
          subject,
          message,
          user_id: userId,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `お問い合わせの送信に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Contact inserted successfully:', data);

    return NextResponse.json(
      {
        message: 'お問い合わせを受け付けました',
        data
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
