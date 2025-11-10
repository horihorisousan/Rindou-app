import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 都道府県の境界ボックス（全47都道府県）
const PREFECTURE_BOUNDS: Record<string, { south: number; west: number; north: number; east: number }> = {
  '北海道': { south: 41.4, west: 139.4, north: 45.5, east: 145.8 },
  '青森県': { south: 40.2, west: 139.5, north: 41.6, east: 141.7 },
  '岩手県': { south: 38.9, west: 140.8, north: 40.4, east: 142.1 },
  '宮城県': { south: 37.8, west: 140.3, north: 38.9, east: 141.7 },
  '秋田県': { south: 39.1, west: 139.6, north: 40.7, east: 141.0 },
  '山形県': { south: 37.7, west: 139.5, north: 39.0, east: 140.7 },
  '福島県': { south: 36.8, west: 139.3, north: 38.0, east: 141.1 },
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
  '三重県': { south: 33.7, west: 135.8, north: 35.0, east: 136.9 },
  '滋賀県': { south: 34.8, west: 135.8, north: 35.7, east: 136.5 },
  '京都府': { south: 34.8, west: 134.9, north: 35.8, east: 135.9 },
  '大阪府': { south: 34.3, west: 135.1, north: 35.0, east: 135.7 },
  '兵庫県': { south: 34.3, west: 134.3, north: 35.7, east: 135.5 },
  '奈良県': { south: 33.9, west: 135.7, north: 34.8, east: 136.2 },
  '和歌山県': { south: 33.4, west: 135.1, north: 34.4, east: 136.0 },
  '鳥取県': { south: 35.1, west: 133.2, north: 35.7, east: 134.5 },
  '島根県': { south: 34.3, west: 131.8, north: 36.0, east: 133.5 },
  '岡山県': { south: 34.3, west: 133.2, north: 35.4, east: 134.5 },
  '広島県': { south: 34.0, west: 132.0, north: 35.1, east: 133.5 },
  '山口県': { south: 33.7, west: 130.8, north: 34.7, east: 132.5 },
  '徳島県': { south: 33.6, west: 133.5, north: 34.3, east: 134.8 },
  '香川県': { south: 34.0, west: 133.4, north: 34.5, east: 134.5 },
  '愛媛県': { south: 32.9, west: 132.4, north: 34.3, east: 133.4 },
  '高知県': { south: 32.7, west: 132.5, north: 33.9, east: 134.3 },
  '福岡県': { south: 33.0, west: 130.1, north: 34.0, east: 131.3 },
  '佐賀県': { south: 33.0, west: 129.8, north: 33.6, east: 130.5 },
  '長崎県': { south: 32.6, west: 128.7, north: 34.7, east: 130.4 },
  '熊本県': { south: 32.0, west: 130.3, north: 33.3, east: 131.3 },
  '大分県': { south: 32.8, west: 130.8, north: 33.7, east: 132.0 },
  '宮崎県': { south: 31.4, west: 130.7, north: 32.9, east: 131.9 },
  '鹿児島県': { south: 28.0, west: 128.3, north: 32.2, east: 131.5 },
  '沖縄県': { south: 24.0, west: 122.9, north: 28.0, east: 132.0 },
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
  hasLongSegments?: boolean;
  maxSegmentDistance?: number;
  totalDistance?: number;
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

    // 既存の林道名を取得（重複チェック用）
    const { data: existingRoads, error: roadsError } = await supabase
      .from('roads')
      .select('name');

    if (roadsError) {
      console.error('Error fetching existing roads:', roadsError);
    }

    const existingRoadNames = new Set(
      existingRoads?.map(road => road.name.trim().toLowerCase()) || []
    );

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

    // まず、ジオメトリと名前があるものをフィルタリング
    const validElements = data.elements.filter(
      (el: any) => el.geometry && el.geometry.length > 0 && (el.tags?.name || el.tags?.ref)
    );

    // 名前でグループ化
    const groupedByName = new Map<string, any[]>();

    for (const el of validElements) {
      const name = el.tags?.name || el.tags?.ref || `林道 ${el.id}`;
      if (!groupedByName.has(name)) {
        groupedByName.set(name, []);
      }
      groupedByName.get(name)!.push(el);
    }

    // 2点間の距離を計算（簡易版：度数での距離）
    const distance = (p1: Coordinate, p2: Coordinate): number => {
      const latDiff = p1.lat - p2.lat;
      const lngDiff = p1.lng - p2.lng;
      return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    };

    // Haversine公式で2点間の実距離（メートル）を計算
    const haversineDistance = (p1: Coordinate, p2: Coordinate): number => {
      const R = 6371000; // 地球の半径（メートル）
      const lat1 = p1.lat * Math.PI / 180;
      const lat2 = p2.lat * Math.PI / 180;
      const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
      const deltaLng = (p2.lng - p1.lng) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // メートル単位の距離
    };

    // ルート全体の長さを計算
    const calculateTotalDistance = (route: Coordinate[]): number => {
      let totalDistance = 0;
      for (let i = 0; i < route.length - 1; i++) {
        totalDistance += haversineDistance(route[i], route[i + 1]);
      }
      return totalDistance;
    };

    // ルート内に100m以上の直線セグメントがあるかチェック
    const checkLongSegments = (route: Coordinate[]): { hasLongSegments: boolean; maxDistance: number } => {
      let maxDistance = 0;
      let hasLongSegments = false;

      for (let i = 0; i < route.length - 1; i++) {
        const dist = haversineDistance(route[i], route[i + 1]);
        if (dist > maxDistance) {
          maxDistance = dist;
        }
        if (dist > 100) { // 100m以上
          hasLongSegments = true;
        }
      }

      return { hasLongSegments, maxDistance };
    };

    // wayセグメントを正しい順序で接続
    const connectWays = (elements: any[]): Coordinate[] => {
      if (elements.length === 0) return [];
      if (elements.length === 1) {
        return elements[0].geometry.map((node: any) => ({
          lat: node.lat,
          lng: node.lon,
        }));
      }

      // 各wayを座標配列に変換
      const ways: Coordinate[][] = elements.map((el: any) =>
        el.geometry.map((node: any) => ({
          lat: node.lat,
          lng: node.lon,
        }))
      );

      const connected: Coordinate[][] = [ways[0]];
      const remaining = ways.slice(1);

      // 全てのwayを接続するまで繰り返す
      while (remaining.length > 0) {
        const current = connected[connected.length - 1];
        const currentEnd = current[current.length - 1];
        const currentStart = current[0];

        let bestIndex = -1;
        let bestDistance = Infinity;
        let shouldReverse = false;
        let connectToStart = false;

        // 現在のwayの終点または始点に最も近いwayを探す
        for (let i = 0; i < remaining.length; i++) {
          const candidate = remaining[i];
          const candStart = candidate[0];
          const candEnd = candidate[candidate.length - 1];

          // 4つの接続パターンをチェック
          // 1. 現在の終点 → 候補の始点
          const dist1 = distance(currentEnd, candStart);
          if (dist1 < bestDistance) {
            bestDistance = dist1;
            bestIndex = i;
            shouldReverse = false;
            connectToStart = false;
          }

          // 2. 現在の終点 → 候補の終点（候補を反転）
          const dist2 = distance(currentEnd, candEnd);
          if (dist2 < bestDistance) {
            bestDistance = dist2;
            bestIndex = i;
            shouldReverse = true;
            connectToStart = false;
          }

          // 3. 現在の始点 → 候補の終点（候補を先頭に追加）
          const dist3 = distance(currentStart, candEnd);
          if (dist3 < bestDistance) {
            bestDistance = dist3;
            bestIndex = i;
            shouldReverse = false;
            connectToStart = true;
          }

          // 4. 現在の始点 → 候補の始点（候補を反転して先頭に追加）
          const dist4 = distance(currentStart, candStart);
          if (dist4 < bestDistance) {
            bestDistance = dist4;
            bestIndex = i;
            shouldReverse = true;
            connectToStart = true;
          }
        }

        if (bestIndex === -1) break; // 接続できるwayがない場合

        let nextWay = remaining[bestIndex];
        if (shouldReverse) {
          nextWay = [...nextWay].reverse();
        }

        if (connectToStart) {
          connected.unshift(nextWay);
        } else {
          connected.push(nextWay);
        }

        remaining.splice(bestIndex, 1);
      }

      // 接続された全ての座標を結合
      return connected.flat();
    };

    // グループ化された林道を1つにまとめる（既存の林道と100m以下の短い道は除外）
    const roads: RoadFeature[] = Array.from(groupedByName.entries())
      .filter(([name, _]) => {
        // 既存の林道名と重複していないかチェック
        return !existingRoadNames.has(name.trim().toLowerCase());
      })
      .map(([name, elements]) => {
      // wayを正しい順序で接続
      const allRoutes = connectWays(elements);

      // tagsをマージ（最初の値を優先）
      let mergedTags: Record<string, string> = {};
      for (const el of elements) {
        mergedTags = { ...el.tags, ...mergedTags };
      }

      // 起点（ルートの最初の座標）を使用
      const startPoint = allRoutes[0];

      // 複数のIDを結合（デバッグ用）
      const combinedId = elements.map((el: any) => el.id).join('-');

      // ルートの長いセグメントをチェック
      const { hasLongSegments, maxDistance } = checkLongSegments(allRoutes);

      // ルート全体の長さを計算
      const totalDistance = calculateTotalDistance(allRoutes);

      return {
        id: combinedId,
        name: name,
        latitude: startPoint.lat,
        longitude: startPoint.lng,
        tags: mergedTags,
        route: allRoutes,
        hasLongSegments,
        maxSegmentDistance: Math.round(maxDistance),
        totalDistance: Math.round(totalDistance),
      };
    })
    .filter(road => road.totalDistance > 100) // 100m以下の短い道を除外
    .slice(0, 100); // 最大100件に制限

    return NextResponse.json({ roads, count: roads.length });

  } catch (error) {
    console.error('Error fetching roads from OSM:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
