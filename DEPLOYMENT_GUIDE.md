# 林道シェアアプリ デプロイガイド

このガイドでは、林道シェアアプリをVercelにデプロイする手順を説明します。

## 📋 目次

1. [デプロイ前の準備](#デプロイ前の準備)
2. [Gitリポジトリのセットアップ](#gitリポジトリのセットアップ)
3. [Vercelへのデプロイ](#vercelへのデプロイ)
4. [環境変数の設定](#環境変数の設定)
5. [デプロイ後の確認](#デプロイ後の確認)
6. [カスタムドメインの設定](#カスタムドメインの設定-オプション)
7. [トラブルシューティング](#トラブルシューティング)

---

## デプロイ前の準備

### ステップ1: 必要なファイルの確認

以下のファイルが存在することを確認してください：

```bash
# 確認コマンド
ls -la | grep -E "(package.json|next.config|tsconfig)"
```

必要なファイル：
- ✅ `package.json` - 依存関係の定義
- ✅ `next.config.mjs` - Next.jsの設定
- ✅ `tsconfig.json` - TypeScriptの設定
- ✅ `.env.local.example` - 環境変数の例

### ステップ2: .gitignoreの確認

`.gitignore`ファイルに以下が含まれていることを確認：

```gitignore
# 既に存在するはず
.env.local
.env*.local
node_modules/
.next/
```

### ステップ3: ビルドの確認

本番ビルドが成功することを確認：

```bash
npm run build
```

エラーが出る場合は修正してからデプロイしてください。

---

## Gitリポジトリのセットアップ

### オプション1: GitHubを使う場合（推奨）

1. **GitHubアカウントを作成**（未作成の場合）
   - https://github.com にアクセス
   - 「Sign up」をクリック

2. **新しいリポジトリを作成**
   - GitHubで「New repository」をクリック
   - リポジトリ名: `rindou-app`（または任意の名前）
   - Public/Privateを選択
   - 「Create repository」をクリック

3. **ローカルのコードをプッシュ**

```bash
# Gitの初期化（まだの場合）
git init

# すべてのファイルをステージング
git add .

# コミット
git commit -m "Initial commit - 林道シェアアプリ"

# GitHubリポジトリを追加（<username>と<repository>を自分のものに変更）
git remote add origin https://github.com/<username>/<repository>.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

### オプション2: GitHubを使わない場合

Vercelは直接ファイルをアップロードすることもできますが、GitHubとの連携を強く推奨します（自動デプロイ、ロールバック、プレビューなどの機能が使えます）。

---

## Vercelへのデプロイ

### ステップ1: Vercelアカウントの作成

1. https://vercel.com にアクセス
2. 「Sign Up」をクリック
3. **「Continue with GitHub」を選択**（GitHubアカウントで認証）

### ステップ2: プロジェクトのインポート

1. Vercelダッシュボードで **「Add New...」→「Project」** をクリック

2. **「Import Git Repository」** セクションで自分のリポジトリを選択
   - リポジトリが表示されない場合は「Adjust GitHub App Permissions」をクリック

3. **「Import」** をクリック

### ステップ3: プロジェクト設定

**Configure Project** 画面で以下を設定：

- **Project Name**: `rindou-app`（または任意の名前）
- **Framework Preset**: `Next.js`（自動検出されるはず）
- **Root Directory**: `./`（変更不要）
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）

### ステップ4: 環境変数の設定

**Environment Variables** セクションで以下を追加：

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: あなたのSupabaseプロジェクトURL
   - 例: `https://xxxxxxxxxxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: あなたのSupabase Anon Key
   - 例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**環境変数の取得方法:**
```bash
# ローカルの.env.localファイルから確認
cat .env.local
```

または、Supabaseダッシュボードから：
1. https://app.supabase.com にアクセス
2. プロジェクトを選択
3. Settings → API → Project URL と anon public key をコピー

### ステップ5: デプロイ開始

1. **「Deploy」** ボタンをクリック

2. デプロイが開始されます（通常2-3分）
   - ビルドログがリアルタイムで表示されます
   - エラーが出た場合はログを確認

3. デプロイ成功！
   - 緑色の「Success」メッセージが表示されます
   - デプロイされたURLが表示されます（例: `https://rindou-app.vercel.app`）

---

## 環境変数の設定

### 本番環境とプレビュー環境

Vercelでは以下の環境を設定できます：

- **Production**: 本番環境（mainブランチ）
- **Preview**: プレビュー環境（PRやブランチ）
- **Development**: 開発環境（ローカル）

通常は **Production** のみチェックすればOKです。

### 環境変数の追加・編集

デプロイ後に環境変数を追加・変更する場合：

1. Vercelダッシュボードでプロジェクトを選択
2. **Settings** タブをクリック
3. **Environment Variables** をクリック
4. 新しい変数を追加または既存の変数を編集
5. **Save** をクリック
6. **再デプロイが必要**: Deploymentsタブから最新のデプロイを「Redeploy」

---

## デプロイ後の確認

### ステップ1: アプリケーションの動作確認

デプロイされたURL（例: `https://rindou-app.vercel.app`）にアクセスして、以下を確認：

- ✅ ログインページが表示される
- ✅ ログインできる
- ✅ マップが表示される
- ✅ 林道の投稿ができる
- ✅ いいね機能が動作する
- ✅ プロフィールページが表示される

### ステップ2: Supabaseの設定確認

Supabaseで本番URLを許可リストに追加：

1. https://app.supabase.com にアクセス
2. プロジェクトを選択
3. **Settings** → **Authentication** → **URL Configuration**
4. **Site URL** を本番URLに設定: `https://rindou-app.vercel.app`
5. **Redirect URLs** に追加:
   - `https://rindou-app.vercel.app/**`
   - `https://rindou-app.vercel.app/login`

### ステップ3: パフォーマンスの確認

Vercelダッシュボードで以下を確認：

- **Speed Insights**: ページの読み込み速度
- **Analytics**: アクセス統計（Pro プラン以上）
- **Logs**: エラーログとリクエストログ

---

## カスタムドメインの設定（オプション）

独自ドメイン（例: `rindou-app.com`）を使いたい場合：

### ステップ1: ドメインの購入

ドメイン登録サービスでドメインを購入：
- お名前.com
- ムームードメイン
- Google Domains
- Cloudflare
など

### ステップ2: Vercelでドメインを追加

1. Vercelダッシュボードでプロジェクトを選択
2. **Settings** → **Domains**
3. ドメイン名を入力（例: `rindou-app.com`）
4. **Add** をクリック

### ステップ3: DNSレコードの設定

Vercelが表示する指示に従って、ドメイン登録サービスでDNSレコードを設定：

**Aレコード:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAMEレコード（www用）:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### ステップ4: SSL証明書の自動発行

- Vercelが自動的にSSL証明書を発行（Let's Encrypt）
- 通常は数分で完了
- HTTPS対応が自動的に有効になります

### ステップ5: Supabaseの設定を更新

カスタムドメインをSupabaseに登録：

1. Supabase Settings → Authentication → URL Configuration
2. Site URL を更新: `https://rindou-app.com`
3. Redirect URLs に追加: `https://rindou-app.com/**`

---

## 自動デプロイの設定

GitHubと連携している場合、コードをプッシュすると自動的にデプロイされます：

### mainブランチ → 本番環境
```bash
git add .
git commit -m "新機能を追加"
git push origin main
```
→ 自動的に本番環境（https://rindou-app.vercel.app）にデプロイ

### 他のブランチ → プレビュー環境
```bash
git checkout -b feature/new-feature
git add .
git commit -m "新機能のテスト"
git push origin feature/new-feature
```
→ 自動的にプレビュー環境（一時的なURL）にデプロイ

---

## トラブルシューティング

### エラー: "Build failed"

**原因**: TypeScriptエラーやビルドエラー

**解決方法:**
1. ローカルでビルドを確認:
   ```bash
   npm run build
   ```
2. エラーを修正してコミット＆プッシュ

### エラー: "Environment variable not found"

**原因**: 環境変数が設定されていない

**解決方法:**
1. Vercel Settings → Environment Variables
2. 必要な変数を追加
3. プロジェクトを再デプロイ

### エラー: "Supabaseに接続できない"

**原因**: SupabaseのURL/Keyが間違っている、またはRLSポリシーの問題

**解決方法:**
1. 環境変数を再確認
2. Supabaseダッシュボードで正しいURL/Keyをコピー
3. Vercelの環境変数を更新
4. プロジェクトを再デプロイ

### エラー: "ログインできない"

**原因**: SupabaseのRedirect URLsが設定されていない

**解決方法:**
1. Supabase Settings → Authentication → URL Configuration
2. Site URL と Redirect URLs を設定
3. 本番URLを追加: `https://your-app.vercel.app/**`

### パフォーマンスが遅い

**原因**: データベースクエリの最適化が必要

**解決方法:**
1. Supabaseダッシュボードでクエリパフォーマンスを確認
2. インデックスを追加
3. 不要なデータの取得を削減

---

## 便利なコマンド

### Vercel CLI（コマンドラインからのデプロイ）

Vercel CLIをインストール:
```bash
npm install -g vercel
```

ログイン:
```bash
vercel login
```

デプロイ:
```bash
vercel
```

本番デプロイ:
```bash
vercel --prod
```

---

## まとめ

### デプロイの流れ
1. ✅ コードをGitHubにプッシュ
2. ✅ Vercelでリポジトリをインポート
3. ✅ 環境変数を設定
4. ✅ デプロイ実行
5. ✅ Supabaseの設定を更新
6. ✅ 動作確認

### 継続的なメンテナンス
- コードをプッシュすると自動デプロイ
- Vercelダッシュボードでログとパフォーマンスを監視
- 問題があればロールバック機能で前のバージョンに戻す

おめでとうございます！これで林道シェアアプリが本番環境で動作します🎉
