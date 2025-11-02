-- ================================================================
-- 多層的な難易度システムの追加
-- ================================================================
-- このSQLをSupabaseのSQL Editorで実行してください
--
-- 実行手順:
-- 1. Supabaseダッシュボード (https://app.supabase.com/) にアクセス
-- 2. プロジェクトを選択
-- 3. 左サイドバーの「SQL Editor」をクリック
-- 4. このスクリプト全体をコピー&ペースト
-- 5. 「Run」ボタンをクリックして実行
-- ================================================================

-- ================================================================
-- 1. 新しいカラムの追加
-- ================================================================

-- 車種カテゴリ（VehicleType[]を格納）
-- 例: ["4WD", "BIKE"] または ["ALL"]
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS difficulty_vehicle text[];

-- 詳細難易度（DifficultyDetail[]を格納）
-- 例: ["DIRT_4WD_REQUIRED", "MUD_TERRAIN_REQUIRED"]（4WD向け）
-- 例: ["DIRT_NORMAL", "SANDY_MUDDY"]（バイク向け）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS difficulty_detail text[];

-- 通行可否フラグ（デフォルトtrue: 通行可能）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS is_passable boolean DEFAULT true;

-- 状態に関する詳細メモ（通行止め情報など）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS condition_notes text;

-- ================================================================
-- 2. インデックスの作成（検索パフォーマンス向上）
-- ================================================================

-- difficulty_vehicleでの検索を高速化（GINインデックス）
CREATE INDEX IF NOT EXISTS roads_difficulty_vehicle_idx ON public.roads USING gin(difficulty_vehicle);

-- difficulty_detailでの検索を高速化（GINインデックス）
CREATE INDEX IF NOT EXISTS roads_difficulty_detail_idx ON public.roads USING gin(difficulty_detail);

-- is_passableでの検索を高速化
CREATE INDEX IF NOT EXISTS roads_is_passable_idx ON public.roads(is_passable);

-- ================================================================
-- 3. 制約の追加（データ整合性の確保）
-- ================================================================

-- difficulty_vehicleに許可される値を制限
ALTER TABLE public.roads
ADD CONSTRAINT check_difficulty_vehicle CHECK (
  difficulty_vehicle IS NULL OR
  difficulty_vehicle <@ ARRAY['ALL', '4WD', 'BIKE']::text[]
);

-- difficulty_detailに許可される値を制限
-- 4WD向け: FLAT, DIRT_2WD_OK, DIRT_4WD_REQUIRED, MUD_TERRAIN_REQUIRED, DIFFERENTIAL_LOCK_REQUIRED, ROCK_SECTION
-- BIKE向け: FLAT_EASY, DIRT_NORMAL, SANDY_MUDDY, TECHNICAL
ALTER TABLE public.roads
ADD CONSTRAINT check_difficulty_detail CHECK (
  difficulty_detail IS NULL OR
  difficulty_detail <@ ARRAY[
    'FLAT', 'DIRT_2WD_OK', 'DIRT_4WD_REQUIRED', 'MUD_TERRAIN_REQUIRED', 'DIFFERENTIAL_LOCK_REQUIRED', 'ROCK_SECTION',
    'FLAT_EASY', 'DIRT_NORMAL', 'SANDY_MUDDY', 'TECHNICAL'
  ]::text[]
);

-- ================================================================
-- 4. 既存データの移行（オプション）
-- ================================================================
-- 既存のconditionフィールドを新しいシステムにマッピング
-- ※ 必要に応じて有効化してください

-- UPDATE public.roads
-- SET
--   difficulty_vehicle = ARRAY['ALL']::text[],
--   difficulty_detail = CASE
--     WHEN condition = 'good' THEN ARRAY['FLAT']::text[]
--     WHEN condition = 'caution' THEN ARRAY['DIRT_2WD_OK']::text[]
--     WHEN condition = 'closed' THEN ARRAY[]::text[]
--   END,
--   is_passable = CASE
--     WHEN condition = 'closed' THEN false
--     ELSE true
--   END
-- WHERE difficulty_vehicle IS NULL;

-- ================================================================
-- 5. スキーマキャッシュのリロード（変更を即座にAPIに反映）
-- ================================================================
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- セットアップ完了！
-- ================================================================
-- 使用例:
--
-- 1. 四駆向けの林道（荒れたダート、MTタイヤ推奨）
-- INSERT INTO public.roads (
--   name, latitude, longitude, user_id,
--   difficulty_vehicle, difficulty_detail, is_passable, condition_notes
-- ) VALUES (
--   '富士山林道', 35.3606, 138.7274, 'user-uuid',
--   ARRAY['4WD'], ARRAY['DIRT_4WD_REQUIRED', 'MUD_TERRAIN_REQUIRED'], true, '雨天時は注意'
-- );
--
-- 2. バイク向けの林道（初心者向け、標準的）
-- INSERT INTO public.roads (
--   name, latitude, longitude, user_id,
--   difficulty_vehicle, difficulty_detail, is_passable, condition_notes
-- ) VALUES (
--   '奥多摩林道', 35.7989, 139.0634, 'user-uuid',
--   ARRAY['BIKE'], ARRAY['FLAT_EASY', 'DIRT_NORMAL'], true, NULL
-- );
--
-- 3. 通行止めの林道
-- INSERT INTO public.roads (
--   name, latitude, longitude, user_id,
--   difficulty_vehicle, difficulty_detail, is_passable, condition_notes
-- ) VALUES (
--   '閉鎖中林道', 36.5, 138.0, 'user-uuid',
--   ARRAY['ALL'], ARRAY[], false, '2024年11月より通行止め。土砂崩れのため。'
-- );
-- ================================================================
