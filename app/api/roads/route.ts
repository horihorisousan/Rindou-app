import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CreateRoadInput } from '@/types/road';
import { isInJapan } from '@/lib/japan-bounds';

// GET /api/roads - 全ての林道情報を取得（投稿者のユーザー名も含む）
export async function GET() {
  try {
    // まず林道データを取得
    const { data: roadsData, error: roadsError } = await supabase
      .from('roads')
      .select('*')
      .order('created_at', { ascending: false });

    if (roadsError) {
      console.error('Supabase error fetching roads:', roadsError);
      return NextResponse.json(
        { error: 'Failed to fetch roads', details: roadsError.message },
        { status: 500 }
      );
    }

    // データがない場合は空配列を返す
    if (!roadsData || roadsData.length === 0) {
      return NextResponse.json([]);
    }

    // 各林道のいいね数を取得
    const roadIds = roadsData.map(road => road.id);
    let likesCountMap: Record<string, number> = {};

    if (roadIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('road_id')
        .in('road_id', roadIds);

      if (!likesError && likesData) {
        // いいね数をカウント
        likesCountMap = likesData.reduce((acc, like) => {
          acc[like.road_id] = (acc[like.road_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // ユーザー名を取得するために、user_idがあるものだけprofilesを取得
    const userIds = roadsData
      .filter(road => road.user_id)
      .map(road => road.user_id);

    let usernamesMap: Record<string, string> = {};

    if (userIds.length > 0) {
      console.log('👤 Fetching usernames for user IDs:', userIds);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        // プロフィールの取得に失敗してもエラーにしない
      } else if (profilesData) {
        console.log('✅ Fetched profiles:', profilesData);
        usernamesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile.username;
          return acc;
        }, {} as Record<string, string>);
        console.log('📋 Usernames map:', usernamesMap);
      } else {
        console.log('⚠️ No profiles data returned');
      }
    } else {
      console.log('⚠️ No user IDs found in roads data');
    }

    // データを整形してusernameとlikes_countを含める
    const formattedData = roadsData.map((road: any) => ({
      ...road,
      username: road.user_id ? (usernamesMap[road.user_id] || null) : null,
      likes_count: likesCountMap[road.id] || 0,
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

// POST /api/roads - 新しい林道情報を投稿
export async function POST(request: NextRequest) {
  try {
    const body: CreateRoadInput = await request.json();
    console.log('📥 Received POST request with body:', body);

    // バリデーション
    if (!body.name || !body.condition || body.latitude == null || body.longitude == null) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name, condition, latitude, longitude' },
        { status: 400 }
      );
    }

    if (!['good', 'caution', 'closed'].includes(body.condition)) {
      console.error('❌ Validation failed: Invalid condition:', body.condition);
      return NextResponse.json(
        { error: 'Invalid condition. Must be one of: good, caution, closed' },
        { status: 400 }
      );
    }

    if (body.latitude < -90 || body.latitude > 90) {
      console.error('❌ Validation failed: Invalid latitude:', body.latitude);
      return NextResponse.json(
        { error: 'Invalid latitude. Must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (body.longitude < -180 || body.longitude > 180) {
      console.error('❌ Validation failed: Invalid longitude:', body.longitude);
      return NextResponse.json(
        { error: 'Invalid longitude. Must be between -180 and 180' },
        { status: 400 }
      );
    }

    // 日本国内かチェック
    if (!isInJapan(body.latitude, body.longitude)) {
      console.error('❌ Validation failed: Location is outside Japan');
      return NextResponse.json(
        { error: 'Location must be within Japan' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, inserting into Supabase...');

    const { data, error } = await supabase
      .from('roads')
      .insert([
        {
          name: body.name,
          condition: body.condition,
          description: body.description || null,
          latitude: body.latitude,
          longitude: body.longitude,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return NextResponse.json(
        { error: 'Failed to create road', details: error.message, hint: error.hint },
        { status: 500 }
      );
    }

    console.log('✅ Successfully created road:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
