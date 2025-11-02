# 多層的難易度システム実装ガイド

## 概要

林道情報共有アプリ「Rindou app」に、四駆（4WD）とバイク（二輪）向けの多層的な難易度システムを実装しました。

## 実装内容

### 1. TypeScript型定義 (`types/road.ts`)

#### 車種カテゴリ

```typescript
export type VehicleType = 'ALL' | '4WD' | 'BIKE';
```

- **ALL**: すべての車両（フラットな林道など）
- **4WD**: 四輪駆動車
- **BIKE**: バイク/二輪車

#### 四駆（4WD）向け難易度

```typescript
export type FourWDDifficulty =
  | 'FLAT'                        // フラットなダート（2WD可）
  | 'DIRT_2WD_OK'                 // 多少のダート（2WD可）
  | 'DIRT_4WD_REQUIRED'           // 荒れたダート（4WD必要、A/Tタイヤ）
  | 'MUD_TERRAIN_REQUIRED'        // 深い轍・泥濘（MTタイヤ推奨）
  | 'DIFFERENTIAL_LOCK_REQUIRED'  // デフロック推奨・必要
  | 'ROCK_SECTION';               // 岩場・大きな段差（上級者向け）
```

#### バイク（二輪）向け難易度

```typescript
export type BikeDifficulty =
  | 'FLAT_EASY'      // フラットなダート（初心者向け）
  | 'DIRT_NORMAL'    // 多少のダート・砂利（標準的）
  | 'SANDY_MUDDY'    // 砂・泥濘が多い（難易度上昇）
  | 'TECHNICAL';     // 急坂・ガレ場（高い操作技術必要）
```

#### Roadインターフェース拡張

```typescript
export interface Road {
  // ... 既存フィールド ...

  // 新規フィールド
  difficulty_vehicle?: VehicleType[] | null;      // 通行可能な車種カテゴリ
  difficulty_detail?: DifficultyDetail[] | null;  // 詳細な難易度情報
  is_passable?: boolean | null;                   // 通行可否
  condition_notes?: string | null;                // 詳細メモ
}
```

### 2. Supabaseスキーマ更新 (`supabase-add-difficulty-system.sql`)

#### 新規カラム

```sql
-- 車種カテゴリ（text[]型）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS difficulty_vehicle text[];

-- 詳細難易度（text[]型）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS difficulty_detail text[];

-- 通行可否（boolean型、デフォルトtrue）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS is_passable boolean DEFAULT true;

-- 詳細メモ（text型）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS condition_notes text;
```

#### インデックス

```sql
-- 検索パフォーマンス向上のためのGINインデックス
CREATE INDEX IF NOT EXISTS roads_difficulty_vehicle_idx
  ON public.roads USING gin(difficulty_vehicle);

CREATE INDEX IF NOT EXISTS roads_difficulty_detail_idx
  ON public.roads USING gin(difficulty_detail);

CREATE INDEX IF NOT EXISTS roads_is_passable_idx
  ON public.roads(is_passable);
```

#### 制約

```sql
-- difficulty_vehicleの値を制限
ALTER TABLE public.roads
ADD CONSTRAINT check_difficulty_vehicle CHECK (
  difficulty_vehicle IS NULL OR
  difficulty_vehicle <@ ARRAY['ALL', '4WD', 'BIKE']::text[]
);

-- difficulty_detailの値を制限
ALTER TABLE public.roads
ADD CONSTRAINT check_difficulty_detail CHECK (
  difficulty_detail IS NULL OR
  difficulty_detail <@ ARRAY[
    'FLAT', 'DIRT_2WD_OK', 'DIRT_4WD_REQUIRED',
    'MUD_TERRAIN_REQUIRED', 'DIFFERENTIAL_LOCK_REQUIRED', 'ROCK_SECTION',
    'FLAT_EASY', 'DIRT_NORMAL', 'SANDY_MUDDY', 'TECHNICAL'
  ]::text[]
);
```

### 3. UIコンポーネント (`components/DifficultySelector.tsx`)

#### 主な機能

1. **通行可否の選択**
   - チェックボックスで通行不可を選択可能

2. **車種カテゴリの選択**
   - 「すべての車両」「四駆」「バイク」から選択（複数選択可）
   - 「すべての車両」を選択すると他の選択は解除

3. **動的な難易度選択**
   - 四駆を選択 → 四駆向けの6つの難易度が表示
   - バイクを選択 → バイク向けの4つの難易度が表示
   - 複数選択可能

4. **詳細メモ入力**
   - 通行止めの理由や路面状況の詳細を記入

#### UI/UXの特徴

- **視覚的フィードバック**: 選択した項目は緑色のボーダーと背景色で強調
- **説明付き選択肢**: 各難易度に短い名称と詳細説明を表示
- **バリデーション**: 適切な選択がされているかチェック
- **レスポンシブ**: モバイルでも使いやすいデザイン

### 4. 投稿ページ更新 (`app/post/page.tsx`)

#### 追加されたstate

```typescript
const [selectedVehicles, setSelectedVehicles] = useState<VehicleType[]>([]);
const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyDetail[]>([]);
const [isPassable, setIsPassable] = useState<boolean>(true);
const [conditionNotes, setConditionNotes] = useState<string>('');
```

#### バリデーション

1. 通行可能な場合:
   - 車種カテゴリが選択されているか
   - 「すべての車両」以外を選択した場合、詳細難易度が選択されているか

2. 通行不可の場合:
   - 詳細メモに理由が記入されているか

#### 送信データ

```typescript
const roadData = {
  // ... 既存フィールド ...
  difficulty_vehicle: selectedVehicles,
  difficulty_detail: selectedDifficulties,
  is_passable: isPassable,
  condition_notes: conditionNotes || null,
};
```

## セットアップ手順

### 1. Supabaseの更新

```bash
# Supabaseダッシュボードにアクセス
# SQL Editorで以下のファイルを実行
supabase-add-difficulty-system.sql
```

### 2. アプリケーションのテスト

```bash
# 開発サーバーが起動していることを確認
npm run dev

# ブラウザで以下にアクセス
http://localhost:3002/post
```

### 3. 投稿テスト

#### ケース1: 四駆向けの林道

1. 林道名を入力
2. 「四駆（4WD）」を選択
3. 該当する難易度を選択（例: 「4WD必要」「MTタイヤ推奨」）
4. 詳細メモを記入（例: 「雨天時は注意」）
5. 地図上で位置を選択
6. 投稿

#### ケース2: バイク向けの林道

1. 林道名を入力
2. 「バイク（二輪）」を選択
3. 該当する難易度を選択（例: 「初心者向け」「標準」）
4. 詳細メモを記入
5. 地図上で位置を選択
6. 投稿

#### ケース3: 通行止めの林道

1. 林道名を入力
2. 「この林道は通行不可」をチェック
3. 詳細メモに通行止めの理由を記入（例: 「2024年11月より通行止め。土砂崩れのため。」）
4. 地図上で位置を選択
5. 投稿

## データ例

### 四駆向けの林道

```sql
INSERT INTO public.roads (
  name, latitude, longitude, user_id,
  difficulty_vehicle, difficulty_detail, is_passable, condition_notes
) VALUES (
  '富士山林道', 35.3606, 138.7274, 'user-uuid',
  ARRAY['4WD'],
  ARRAY['DIRT_4WD_REQUIRED', 'MUD_TERRAIN_REQUIRED'],
  true,
  '雨天時は泥濘が深くなります。MTタイヤ推奨。'
);
```

### バイク向けの林道

```sql
INSERT INTO public.roads (
  name, latitude, longitude, user_id,
  difficulty_vehicle, difficulty_detail, is_passable, condition_notes
) VALUES (
  '奥多摩林道', 35.7989, 139.0634, 'user-uuid',
  ARRAY['BIKE'],
  ARRAY['FLAT_EASY', 'DIRT_NORMAL'],
  true,
  '初心者にもおすすめ。景色が素晴らしい。'
);
```

### 通行止めの林道

```sql
INSERT INTO public.roads (
  name, latitude, longitude, user_id,
  difficulty_vehicle, difficulty_detail, is_passable, condition_notes
) VALUES (
  '閉鎖中林道', 36.5, 138.0, 'user-uuid',
  ARRAY['ALL'],
  ARRAY[],
  false,
  '2024年11月より通行止め。土砂崩れのため。復旧時期未定。'
);
```

## 後方互換性

- 既存の`condition`フィールドは保持（`good`/`caution`/`closed`）
- 新しいシステムと並行して動作
- 段階的に移行可能

## 今後の拡張案

1. **マップ表示の改善**
   - 車種・難易度に応じたマーカーの色分け
   - フィルタリング機能（例: 四駆のみ表示）

2. **検索機能**
   - 車種・難易度での検索
   - 通行可能な林道のみ表示

3. **統計情報**
   - 難易度別の林道数
   - 人気の林道ランキング

4. **ユーザープロフィール**
   - 所有車両の登録
   - パーソナライズされた林道提案

## トラブルシューティング

### コンパイルエラーが出る場合

```bash
# 依存関係を再インストール
npm install

# 開発サーバーを再起動
npm run dev
```

### Supabaseエラーが出る場合

1. SQLマイグレーションが正しく実行されたか確認
2. RLSポリシーが正しく設定されているか確認
3. `NOTIFY pgrst, 'reload schema';` でスキーマをリロード

### 投稿時にエラーが出る場合

1. コンソールログでデータを確認
2. Supabaseダッシュボードでテーブル構造を確認
3. 制約条件に違反していないか確認

## まとめ

多層的難易度システムにより、四駆ユーザーとバイクユーザーがそれぞれに適した詳細な情報を共有できるようになりました。

**主な利点:**
- 車種に応じた適切な情報提供
- 複数の難易度を同時に表現可能
- 通行止め情報の詳細な記録
- 後方互換性を保ちつつ段階的に移行可能
