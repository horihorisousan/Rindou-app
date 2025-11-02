-- ================================================================
-- Supabase プロフィールテーブルセットアップスクリプト
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

-- 既存のポリシーを削除（再実行時のエラーを防ぐ）
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 既存のテーブルを削除する場合は以下のコメントを外してください（注意: データが削除されます）
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ================================================================
-- 1. public.profiles テーブルの作成
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  -- ユーザーID（auth.usersテーブルへの外部キー、主キー）
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- ユーザー名（一意、必須）
  username TEXT UNIQUE NOT NULL,

  -- 作成日時
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 更新日時（自動更新）
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ================================================================
-- 2. セキュリティ設定: Row Level Security (RLS) を有効化
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 3. RLSポリシーの作成
-- ================================================================

-- SELECT (読み取り) ポリシー: 全員が全てのプロフィールを読み取り可能
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- INSERT (新規作成) ポリシー: ログインユーザーが自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE (更新) ポリシー: ログインユーザーが自分のプロフィールのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ================================================================
-- 4. パフォーマンス最適化: インデックスの作成
-- ================================================================
-- usernameカラムにインデックスを作成（検索・重複チェックを高速化）
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- ================================================================
-- 5. 自動更新機能: updated_atカラムの自動更新
-- ================================================================
-- トリガー関数の作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの削除（再実行時のエラーを防ぐ）
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- トリガーの作成
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 6. スキーマキャッシュのリロード（変更を即座にAPIに反映）
-- ================================================================
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- セットアップ完了！
-- ================================================================
-- 以下のクエリで正しくテーブルが作成されたか確認できます:
-- SELECT * FROM public.profiles;
