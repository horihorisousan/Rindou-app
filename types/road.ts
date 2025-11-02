// 後方互換性のために既存の型を保持
export type RoadCondition = 'good' | 'caution' | 'closed';

export interface Coordinate {
  lat: number;
  lng: number;
}

// ============================================
// 新しい多層的な難易度システム
// ============================================

/**
 * 車種カテゴリ
 * - ALL: すべての車両（フラットな林道など）
 * - 4WD: 四輪駆動車
 * - BIKE: バイク/二輪車
 */
export type VehicleType = 'ALL' | '4WD' | 'BIKE';

/**
 * 四駆（4WD）向けの難易度
 */
export type FourWDDifficulty =
  | 'FLAT'                        // フラットなダート。2WDでも通行可能
  | 'DIRT_2WD_OK'                 // 多少のダート。2WDでも通行可能
  | 'DIRT_4WD_REQUIRED'           // 荒れたダート。4WD必要。A/Tタイヤで可
  | 'MUD_TERRAIN_REQUIRED'        // 深い轍・泥濘。MTタイヤ推奨
  | 'DIFFERENTIAL_LOCK_REQUIRED'  // デフロック推奨・必要
  | 'ROCK_SECTION';               // 岩場・大きな段差。上級者向け

/**
 * バイク（二輪）向けの難易度
 */
export type BikeDifficulty =
  | 'FLAT_EASY'      // フラットなダート。初心者向け
  | 'DIRT_NORMAL'    // 多少のダート・砂利。標準的なオフロードタイヤで可
  | 'SANDY_MUDDY'    // 砂・泥濘が多い。難易度上昇
  | 'TECHNICAL';     // 急坂・ガレ場・タイトなコーナー。高い操作技術必要

/**
 * 詳細難易度（4WDまたはBIKE）
 */
export type DifficultyDetail = FourWDDifficulty | BikeDifficulty;

/**
 * 難易度ラベルのマッピング（日本語表示用）
 */
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  ALL: 'すべての車両',
  '4WD': '四駆（4WD）',
  BIKE: 'バイク（二輪）',
};

export const FOURWD_DIFFICULTY_LABELS: Record<FourWDDifficulty, { short: string; full: string }> = {
  FLAT: { short: 'フラット', full: 'フラットなダート（2WD可）' },
  DIRT_2WD_OK: { short: 'ダート（2WD可）', full: '多少のダート（2WD可）' },
  DIRT_4WD_REQUIRED: { short: '4WD必要', full: '荒れたダート（4WD必要、A/Tタイヤ）' },
  MUD_TERRAIN_REQUIRED: { short: 'MTタイヤ推奨', full: '深い轍・泥濘（MTタイヤ推奨）' },
  DIFFERENTIAL_LOCK_REQUIRED: { short: 'デフロック推奨', full: 'デフロック推奨・必要' },
  ROCK_SECTION: { short: 'ロックセクション', full: '岩場・大きな段差（上級者向け）' },
};

export const BIKE_DIFFICULTY_LABELS: Record<BikeDifficulty, { short: string; full: string }> = {
  FLAT_EASY: { short: '初心者向け', full: 'フラットなダート（初心者向け）' },
  DIRT_NORMAL: { short: '標準', full: '多少のダート・砂利（標準的）' },
  SANDY_MUDDY: { short: '砂・泥濘', full: '砂・泥濘が多い（難易度上昇）' },
  TECHNICAL: { short: 'テクニカル', full: '急坂・ガレ場（高い操作技術必要）' },
};

export interface Road {
  id: string;
  name: string;
  // 後方互換性のため既存のconditionを保持
  condition: RoadCondition;
  description: string | null;
  latitude: number;
  longitude: number;
  route?: Coordinate[] | null;
  user_id: string | null;
  username: string | null;
  created_at: string;

  // 新しい多層的な難易度フィールド
  difficulty_vehicle?: VehicleType[] | null;      // 通行可能な車種カテゴリ
  difficulty_detail?: DifficultyDetail[] | null;  // 詳細な難易度情報
  is_passable?: boolean | null;                   // 通行可否（デフォルトtrue）
  condition_notes?: string | null;                // 通行止め情報など詳細メモ

  // いいね機能関連
  likes_count?: number;                           // この林道の総いいね数
}

export interface CreateRoadInput {
  name: string;
  // 既存フィールド（後方互換性）
  condition: RoadCondition;
  description?: string;
  latitude: number;
  longitude: number;
  route?: Coordinate[];

  // 新しい難易度フィールド
  difficulty_vehicle?: VehicleType[];
  difficulty_detail?: DifficultyDetail[];
  is_passable?: boolean;
  condition_notes?: string;
}
