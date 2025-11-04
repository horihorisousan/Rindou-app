import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/roads/[roadId] - 特定の林道を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const { roadId } = await params;

    const { data, error } = await supabase
      .from('roads')
      .select('*')
      .eq('id', roadId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch road', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Road not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/roads/[roadId] - 林道情報を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const { roadId } = await params;
    const body = await request.json();

    // 認証確認は簡易的にuser_idで行う
    // 本来はサーバー側でセッションを確認すべき
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // まず、現在の林道情報を取得して、投稿者が一致するか確認
    const { data: currentRoad, error: fetchError } = await supabase
      .from('roads')
      .select('user_id')
      .eq('id', roadId)
      .single();

    if (fetchError || !currentRoad) {
      return NextResponse.json(
        { error: 'Road not found' },
        { status: 404 }
      );
    }

    // 投稿者が一致するか確認
    if (currentRoad.user_id !== body.user_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      );
    }

    // 更新データを準備
    const updateData: any = {
      name: body.name,
      condition: body.condition,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
    };

    // オプショナルフィールド
    if (body.route !== undefined) {
      updateData.route = body.route;
    }
    if (body.passable !== undefined) {
      updateData.passable = body.passable;
    }
    if (body.vehicle_types !== undefined) {
      updateData.vehicle_types = body.vehicle_types;
    }
    if (body.difficulty_details !== undefined) {
      updateData.difficulty_details = body.difficulty_details;
    }
    if (body.condition_notes !== undefined) {
      updateData.condition_notes = body.condition_notes;
    }

    // データベースを更新
    const { data, error } = await supabase
      .from('roads')
      .update(updateData)
      .eq('id', roadId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update road', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/roads/[roadId] - 林道を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const { roadId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // まず、現在の林道情報を取得して、投稿者が一致するか確認
    const { data: currentRoad, error: fetchError } = await supabase
      .from('roads')
      .select('user_id')
      .eq('id', roadId)
      .single();

    if (fetchError || !currentRoad) {
      return NextResponse.json(
        { error: 'Road not found' },
        { status: 404 }
      );
    }

    // 投稿者が一致するか確認
    if (currentRoad.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      );
    }

    // 削除
    const { error } = await supabase
      .from('roads')
      .delete()
      .eq('id', roadId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete road', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
