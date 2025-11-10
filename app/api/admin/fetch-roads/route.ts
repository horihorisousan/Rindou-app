import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 都道府県の境界ボックス（簡易版）
const PREFECTURE_BOUNDS: Record<string, { south: number; west: number; north: number; east: number }> = {
  '茨城県': { south: 35.7, west: 139.7, north: 36.9, east: 140.9 },
  '栃木県': { south: 36.2, west: 139.3, north: 37.0, east: 140.3 },
  '群馬県': { south: 36.0, west: 138.4, north: 36.7, east: 139.5 },
  '埼玉県': { south: 35.7, west: 138.7, north: 36.3, east: 139.9 },
  '千葉県': { south: 34.9, west: 139.7, north: 35.9, east: 140.9 },
  '東京都': { south: 35.5, west: 138.9, north: 35.9, east: 139.9 },
  '神奈川県': { south: 35.1, west: 138.9, north: 35.6, east: 139.8 },
  '新潟県': { south: 36.7, west: 137.6, north: 38.6, east: 139.9 },
  '富山県': { south: 36.3, west: 136.8, north: 36.9, east: 137.7 },
  '石川県': { south: 36.0, west: 136.2, north: 37.9, east: 137.4 },
  '福井県': { south: 35.3, west: 135.4, north: 36.4, east: 136.9 },
  '山梨県': { south: 35.1, west: 138.2, north: 36.0, east: 139.2 },
  '長野県': { south: 35.1, west: 137.3, north: 37.1, east: 138.9 },
  '岐阜県': { south: 35.3, west: 136.5, north: 36.3, east: 137.9 },
  '静岡県': { south: 34.6, west: 137.5, north: 35.4, east: 139.2 },
  '愛知県': { south: 34.6, west: 136.7, north: 35.4, east: 137.8 },
};

interface Coordinate {
  lat: number;
  lng: number;
}

interface RoadFeature {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
  route?: Coordinate[];
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

    const { prefecture, city } = await request.json();

    if (!prefecture || !PREFECTURE_BOUNDS[prefecture]) {
      return NextResponse.json({ error: '都道府県を指定してください' }, { status: 400 });
    }

    const bounds = PREFECTURE_BOUNDS[prefecture];

    // Overpass API クエリ
    // highway=track (林道) または highway=service + surface=unpaved を取得
    let overpassQuery: string;

    if (city && city.trim()) {
      // 市区町村が指定された場合はエリアベースのクエリを使用
      overpassQuery = `
        [out:json][timeout:25];
        area["name"="${prefecture}"]["admin_level"~"^(3|4)$"]->.prefecture;
        (
          area["name"="${city.trim()}"](area.prefecture);
          area["name"="${city.trim()}市"](area.prefecture);
          area["name"="${city.trim()}町"](area.prefecture);
          area["name"="${city.trim()}村"](area.prefecture);
        )->.city;
        (
          way["highway"="track"](area.city);
          way["highway"="service"]["surface"="unpaved"](area.city);
        );
        out geom;
      `;
    } else {
      // 都道府県のみの場合は境界ボックスを使用
      overpassQuery = `
        [out:json][timeout:25];
        (
          way["highway"="track"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["highway"="service"]["surface"="unpaved"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out geom;
      `;
    }

    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'OpenStreetMapからデータ取得に失敗しました' }, { status: 500 });
    }

    const data = await response.json();

    const roads: RoadFeature[] = data.elements
      .filter((el: any) => el.geometry && el.geometry.length > 0 && (el.tags?.name || el.tags?.ref)) // ジオメトリと名前があるもののみ
      .map((el: any) => {
        // wayの座標配列を取得
        const route: Coordinate[] = el.geometry.map((node: any) => ({
          lat: node.lat,
          lng: node.lon,
        }));

        // 中心点を計算（経路の中央の座標）
        const midIndex = Math.floor(route.length / 2);
        const centerPoint = route[midIndex];

        return {
          id: el.id.toString(),
          name: el.tags?.name || el.tags?.ref || `林道 ${el.id}`,
          latitude: centerPoint.lat,
          longitude: centerPoint.lng,
          tags: el.tags || {},
          route: route,
        };
      })
      .slice(0, 100); // 最大100件に制限

    return NextResponse.json({ roads, count: roads.length });

  } catch (error) {
    console.error('Error fetching roads from OSM:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
