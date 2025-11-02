/**
 * いいね機能の型定義
 */

/**
 * Likeテーブルの行データ型
 */
export interface Like {
  id: string;
  user_id: string;
  road_id: string;
  created_at: string;
}

/**
 * いいねを作成する際の入力型
 */
export interface CreateLikeInput {
  user_id: string;
  road_id: string;
}

/**
 * いいねと関連する林道情報を含む型
 * プロフィールページでユーザーがいいねした林道一覧を表示する際に使用
 */
export interface LikeWithRoad extends Like {
  roads: {
    id: string;
    name: string;
    condition: string;
    description: string | null;
    latitude: number;
    longitude: number;
    created_at: string;
    user_id: string | null;
    username: string | null;
  };
}
