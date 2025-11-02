-- ============================================
-- Likesテーブルの作成とRLSポリシーの設定
-- ============================================
-- このSQLスクリプトは、ユーザーが林道に「いいね」を付ける機能を実装するための
-- データベーススキーマとセキュリティポリシーを定義します。

-- 1. likesテーブルの作成
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  road_id UUID NOT NULL REFERENCES public.roads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 一人のユーザーが同じ林道に複数回「いいね」できないようにする
  UNIQUE(user_id, road_id)
);

-- 2. インデックスの作成（パフォーマンス最適化）
-- user_idでの検索を高速化（プロフィールページでユーザーのいいね一覧を取得する際に使用）
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- road_idでの検索を高速化（特定の林道のいいね数を取得する際に使用）
CREATE INDEX IF NOT EXISTS idx_likes_road_id ON public.likes(road_id);

-- 3. Row Level Security (RLS) の有効化
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシーの設定

-- 4-1. SELECT: すべてのユーザー（未認証含む）がいいねを閲覧可能
CREATE POLICY "Anyone can view likes"
ON public.likes
FOR SELECT
TO public
USING (true);

-- 4-2. INSERT: 認証済みユーザーのみが自分のいいねを追加可能
CREATE POLICY "Authenticated users can add their own likes"
ON public.likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4-3. DELETE: 認証済みユーザーのみが自分のいいねを削除可能
CREATE POLICY "Authenticated users can delete their own likes"
ON public.likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. 関数の作成: 林道の総いいね数を取得する
-- この関数は、特定の林道のいいね数を効率的に取得するために使用されます。
CREATE OR REPLACE FUNCTION public.get_road_likes_count(road_id_param UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.likes
  WHERE road_id = road_id_param;
$$;

-- 6. 関数の作成: ユーザーが特定の林道に「いいね」しているかチェック
-- この関数は、現在のユーザーが特定の林道に既に「いいね」しているか確認するために使用されます。
CREATE OR REPLACE FUNCTION public.check_user_liked_road(road_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.likes
    WHERE road_id = road_id_param AND user_id = user_id_param
  );
$$;

-- 7. コメント（メタデータ）の追加
COMMENT ON TABLE public.likes IS 'ユーザーが林道に「いいね」したことを記録するテーブル';
COMMENT ON COLUMN public.likes.id IS 'いいねの一意識別子';
COMMENT ON COLUMN public.likes.user_id IS 'いいねしたユーザーのID（auth.usersテーブルへの外部キー）';
COMMENT ON COLUMN public.likes.road_id IS 'いいねされた林道のID（roadsテーブルへの外部キー）';
COMMENT ON COLUMN public.likes.created_at IS 'いいねが作成された日時';

-- ============================================
-- 実行後の確認方法
-- ============================================
-- 1. テーブルが正しく作成されたか確認:
--    SELECT * FROM information_schema.tables WHERE table_name = 'likes';
--
-- 2. RLSが有効になっているか確認:
--    SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'likes';
--
-- 3. ポリシーが正しく設定されているか確認:
--    SELECT * FROM pg_policies WHERE tablename = 'likes';
