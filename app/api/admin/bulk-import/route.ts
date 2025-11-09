import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface RoadToImport {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Verify user with token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者チェック
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const { roads }: { roads: RoadToImport[] } = await request.json();

    if (!roads || roads.length === 0) {
      return NextResponse.json({ error: '投稿する林道がありません' }, { status: 400 });
    }

    // 各林道をデータベースに挿入
    const insertedRoads = [];
    const errors = [];

    for (const road of roads) {
      const { data, error } = await supabase
        .from('roads')
        .insert({
          name: road.name,
          description: road.description,
          latitude: road.latitude,
          longitude: road.longitude,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting road:', error);
        errors.push({ road: road.name, error: error.message });
      } else {
        insertedRoads.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedRoads.length,
      errors: errors.length,
      details: errors,
    });

  } catch (error) {
    console.error('Error bulk importing roads:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
