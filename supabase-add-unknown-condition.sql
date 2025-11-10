-- roadsテーブルのconditionカラムに'unknown'（不明）を追加
-- このSQLをSupabaseのSQL Editorで実行してください
--
-- 実行手順:
-- 1. Supabaseダッシュボード (https://app.supabase.com/) にアクセス
-- 2. プロジェクトを選択
-- 3. 左サイドバーの「SQL Editor」をクリック
-- 4. このスクリプト全体をコピー&ペースト
-- 5. 「Run」ボタンをクリックして実行

-- CHECK制約を削除
ALTER TABLE public.roads
DROP CONSTRAINT IF EXISTS roads_condition_check;

-- 新しいCHECK制約を追加（5段階評価 + unknown）
ALTER TABLE public.roads
ADD CONSTRAINT roads_condition_check
CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'very_poor', 'unknown'));

-- 変更を即座にAPIに反映
NOTIFY pgrst, 'reload schema';
