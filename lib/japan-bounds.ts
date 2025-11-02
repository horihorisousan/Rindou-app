// 日本の緯度経度の範囲
export const JAPAN_BOUNDS = {
  north: 45.5,  // 北海道北端
  south: 24.0,  // 沖縄南端
  west: 122.5,  // 与那国島
  east: 146.0,  // 北方領土・小笠原諸島
};

// 緯度経度が日本の範囲内かチェックする関数
// より精密なチェックで、韓国・中国などを除外
export function isInJapan(latitude: number, longitude: number): boolean {
  // 基本的な範囲チェック
  if (latitude < JAPAN_BOUNDS.south || latitude > JAPAN_BOUNDS.north) {
    return false;
  }
  if (longitude < JAPAN_BOUNDS.west || longitude > JAPAN_BOUNDS.east) {
    return false;
  }

  // 西側の離島（与那国島など）: 経度122.5～125度、緯度24～28度
  if (longitude >= 122.5 && longitude < 125) {
    return latitude >= 24 && latitude <= 28;
  }

  // 沖縄エリア: 経度125～132度、緯度24～29度
  if (longitude >= 125 && longitude < 132) {
    return latitude >= 24 && latitude <= 29;
  }

  // 九州・本州・四国エリア: 経度129～142度、緯度30～42度
  if (longitude >= 129 && longitude < 142) {
    return latitude >= 30 && latitude <= 42;
  }

  // 北海道エリア: 経度139～146度、緯度41～46度
  if (longitude >= 139 && longitude <= 146) {
    return latitude >= 41 && latitude <= 46;
  }

  return false;
}

// 日本の中心座標（東京周辺）
export const JAPAN_CENTER: [number, number] = [36.5, 138.0];

// 茨城県道218号線周辺（水戸市周辺）
// 位置情報取得権限が拒否された場合のデフォルト位置
export const IBARAKI_ROUTE_218_CENTER: [number, number] = [36.3418, 140.4468];

// デフォルトのズームレベル
export const JAPAN_DEFAULT_ZOOM = 6;

// ユーザー位置にズームする際のズームレベル
export const USER_LOCATION_ZOOM = 13;
