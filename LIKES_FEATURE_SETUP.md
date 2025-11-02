# いいね機能のセットアップ手順

このドキュメントでは、いいね機能を動作させるために必要なデータベースのセットアップ手順を説明します。

## 前提条件

- Supabaseプロジェクトが作成されていること
- Supabaseダッシュボードにアクセスできること

## セットアップ手順

### ステップ1: Supabaseダッシュボードにアクセス

1. ブラウザで Supabase ダッシュボード (https://app.supabase.com) を開く
2. あなたのプロジェクトを選択

### ステップ2: SQL Editorを開く

1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック

### ステップ3: SQLスクリプトを実行

1. ターミナルで以下のコマンドを実行して、SQLスクリプトの内容を表示:

```bash
cat supabase-add-likes-table.sql
```

2. 表示された内容をすべてコピー

3. Supabase SQL Editorに貼り付け

4. 右下の「Run」ボタンをクリック

### ステップ4: 実行結果の確認

成功すると、以下のメッセージが表示されます：

```
Success. No rows returned
```

### ステップ5: テーブルが作成されたことを確認

1. 左サイドバーから「Table Editor」をクリック
2. `likes` テーブルが表示されることを確認

テーブルには以下のカラムがあるはずです：
- `id` (uuid, Primary Key)
- `user_id` (uuid)
- `road_id` (uuid)
- `created_at` (timestamptz)

### ステップ6: アプリケーションを再起動

```bash
# 開発サーバーを停止 (Ctrl+C)
# 再起動
npm run dev
```

## トラブルシューティング

### エラー: "relation 'likes' does not exist"

このエラーは、`likes`テーブルがまだ作成されていないことを意味します。

**解決方法:**
- 上記のステップ1〜5を再度実行してください

### エラー: "permission denied for table likes"

このエラーは、RLS (Row Level Security) ポリシーが正しく設定されていないことを意味します。

**解決方法:**
1. Supabase SQL Editorで以下のクエリを実行して、RLSが有効になっているか確認:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'likes';
```

2. RLSが無効の場合、以下を実行:

```sql
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
```

3. ポリシーが正しく設定されているか確認:

```sql
SELECT * FROM pg_policies WHERE tablename = 'likes';
```

### エラー: "duplicate key value violates unique constraint"

このエラーは、既に同じ林道にいいねしようとしていることを意味します（正常な動作）。

**解決方法:**
- これは正常な動作です。すでにいいね済みの林道に再度いいねすることはできません

### プロフィールページでエラーが表示される

**症状:**
```
Error fetching liked roads: {}
```

**解決方法:**

1. まず、`likes`テーブルが作成されているか確認:

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'likes';
```

結果が0行の場合、テーブルが作成されていません。ステップ1〜5を実行してください。

2. RLSポリシーが正しく設定されているか確認:

```sql
SELECT * FROM pg_policies WHERE tablename = 'likes';
```

3つのポリシーが表示されるはずです：
- `Anyone can view likes` (SELECT)
- `Authenticated users can add their own likes` (INSERT)
- `Authenticated users can delete their own likes` (DELETE)

## 動作確認

セットアップが完了したら、以下を確認してください：

1. ✅ ログインできる
2. ✅ 林道のポップアップにいいねボタンが表示される
3. ✅ いいねボタンをクリックすると状態が変わる
4. ✅ プロフィールページにアクセスできる (`/profile`)
5. ✅ プロフィールページでいいねした林道が表示される

## サポート

問題が解決しない場合は、以下の情報を含めて報告してください：

1. エラーメッセージ全文
2. ブラウザのコンソールに表示されるエラー (F12キーで開発者ツールを開く)
3. Supabase SQL Editorで実行した結果
