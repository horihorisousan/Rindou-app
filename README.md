# 林道シェア - マップ型SNS

林道情報を共有するためのマップ型SNSアプリケーション。Next.js (App Router)、React Leaflet、Supabaseで構築されています。

## ✨ 主な機能

### 地図機能
- 🗺️ インタラクティブな地図表示（OpenStreetMap）
- 📍 林道位置のマーカー表示
- 🛣️ ルート表示機能（林道の経路を線で表示）
- 📱 現在地の自動取得とズーム
- 🎨 状況別の色分け表示（良好/注意が必要/通行不可）

### ユーザー機能
- 🔐 ユーザー認証（Supabase Auth）
  - 新規登録
  - ログイン/ログアウト
  - ユーザー名設定
- 👤 プロフィールページ
  - いいねした林道の一覧表示
  - プロフィールからマップへの直接ジャンプ

### 投稿機能
- ✍️ 林道情報の投稿
  - 地図上でクリックして位置を選択
  - ルート設定（複数ポイントを指定）
  - 多層的な難易度システム
    - 車種カテゴリ（すべて/四駆/バイク）
    - 詳細難易度（路面状態、必要装備など）
  - 通行可否情報
- 💬 コメント機能
  - 各林道にコメントを投稿
  - 投稿者名の表示
- ❤️ いいね機能
  - 林道にいいねを付ける
  - いいね数の表示
  - いいねした林道の一覧

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 18, TypeScript
- **地図**: React Leaflet 4, Leaflet 1.9
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)

## セットアップ手順

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのダッシュボードで、以下を取得：
   - Project URL
   - Anon/Public Key

### 3. データベーステーブルの作成

Supabaseのダッシュボードで、SQL Editorを開き、以下のSQLを実行：

\`\`\`sql
-- roadsテーブルを作成
CREATE TABLE roads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('good', 'caution', 'closed')),
  description TEXT,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- created_atでのソートを高速化するためのインデックス
CREATE INDEX roads_created_at_idx ON roads(created_at DESC);

-- 位置情報での検索を高速化するための空間インデックス（オプション）
CREATE INDEX roads_location_idx ON roads USING gist (
  ll_to_earth(latitude, longitude)
);

-- Row Level Security (RLS) を有効化（セキュリティのため）
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能なポリシー
CREATE POLICY "Anyone can view roads" ON roads
  FOR SELECT USING (true);

-- 全員が投稿可能なポリシー（後で認証を追加する場合は変更）
CREATE POLICY "Anyone can create roads" ON roads
  FOR INSERT WITH CHECK (true);
\`\`\`

### 4. 環境変数の設定

\`.env.local\`ファイルを編集し、Supabaseの認証情報を設定：

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### 5. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 📄 ページ構成

- \`/\` - メインマップページ（投稿された林道情報を表示）
- \`/login\` - ログインページ
- \`/signup\` - 新規登録ページ
- \`/post\` - 新規投稿ページ（林道情報を投稿）
- \`/profile\` - プロフィールページ（いいねした林道の一覧）

## プロジェクト構造

\`\`\`
/
├── app/
│   ├── layout.tsx          # 共通レイアウト
│   ├── page.tsx            # マップページ
│   ├── post/
│   │   └── page.tsx        # 投稿ページ
│   └── api/
│       └── roads/
│           └── route.ts    # 林道API (GET/POST)
├── components/
│   ├── Header.tsx          # ナビゲーションヘッダー
│   └── Map.tsx             # 地図コンポーネント
├── lib/
│   └── supabase.ts         # Supabaseクライアント
└── types/
    ├── road.ts             # 林道データの型定義
    └── database.ts         # データベース型定義
\`\`\`

## API エンドポイント

### GET /api/roads

全ての林道情報を取得

**レスポンス例:**
\`\`\`json
[
  {
    "id": "uuid",
    "name": "富士山林道",
    "condition": "good",
    "description": "路面良好、通行可能",
    "latitude": 35.3606,
    "longitude": 138.7274,
    "created_at": "2025-10-27T12:00:00Z"
  }
]
\`\`\`

### POST /api/roads

新しい林道情報を投稿

**リクエストボディ:**
\`\`\`json
{
  "name": "富士山林道",
  "condition": "good",
  "description": "路面良好、通行可能",
  "latitude": 35.3606,
  "longitude": 138.7274
}
\`\`\`

## 🚀 デプロイ

### Vercelへのデプロイ（推奨）

詳細な手順は `DEPLOYMENT_GUIDE.md` を参照してください。

**簡単な手順:**
1. GitHubにコードをプッシュ
2. Vercelアカウントを作成（GitHubで認証）
3. プロジェクトをインポート
4. 環境変数を設定
5. デプロイ

**必要な環境変数:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### デプロイ前のチェック

`PRE_DEPLOYMENT_CHECKLIST.md` でチェックリストを確認してください。

## 🔧 今後の実装予定

- [ ] 写真アップロード機能
- [ ] 林道情報の編集・削除機能
- [ ] フィルター・検索機能
- [ ] 天気情報の統合
- [ ] オフラインマップ機能

## ビルド

\`\`\`bash
npm run build
npm start
\`\`\`

## ライセンス

MIT
