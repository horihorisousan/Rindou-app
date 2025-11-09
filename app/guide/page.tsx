import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用ガイド',
  description: '林道マップの使い方、林道投稿方法、安全な林道走行のための情報をご紹介します。',
};

export default function GuidePage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem',
      lineHeight: '1.8'
    }}>
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '1.5rem',
        color: '#2d5016',
        borderBottom: '3px solid #2d5016',
        paddingBottom: '0.5rem'
      }}>
        林道マップ 利用ガイド
      </h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#2d5016', marginBottom: '1rem' }}>
          林道マップとは
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          林道マップは、日本全国の林道情報を地図上で共有できるコミュニティプラットフォームです。
          オフロードバイク、四輪駆動車、アドベンチャー好きの方々が、
          林道の位置、状態、走行記録を共有し、安全で楽しい林道体験をサポートします。
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#2d5016', marginBottom: '1rem' }}>
          基本的な使い方
        </h2>

        <h3 style={{ fontSize: '1.2rem', color: '#4a7023', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
          1. アカウント登録
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          新規登録ページからメールアドレスとパスワードを入力してアカウントを作成します。
          ユーザー名を設定することで、投稿者として他のユーザーと交流できます。
        </p>

        <h3 style={{ fontSize: '1.2rem', color: '#4a7023', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
          2. 林道を探す
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          ホーム画面のマップ上には、他のユーザーが投稿した林道がマーカーで表示されています。
          マーカーをクリックすると、その林道の詳細情報（名前、説明、画像、コメント）を確認できます。
        </p>

        <h3 style={{ fontSize: '1.2rem', color: '#4a7023', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
          3. 林道を投稿する
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          「投稿」ページから新しい林道情報を追加できます。以下の情報を入力してください：
        </p>
        <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
          <li>林道名</li>
          <li>位置情報（地図上でピンを配置）</li>
          <li>説明（路面状態、難易度、見どころなど）</li>
          <li>写真（任意）</li>
        </ul>

        <h3 style={{ fontSize: '1.2rem', color: '#4a7023', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
          4. いいね & コメント
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          気に入った林道には「いいね」を押して保存できます。
          プロフィールページから、いいねした林道の一覧を確認できます。
          また、各林道にコメントを残すことで、最新の路面状況や注意事項を共有できます。
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#2d5016', marginBottom: '1rem' }}>
          林道走行の基本ルール
        </h2>

        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#856404', marginBottom: '1rem' }}>
            ⚠️ 安全第一
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: '#856404' }}>
            <li>適切な装備と車両点検を行う</li>
            <li>天候や路面状況を事前に確認する</li>
            <li>単独走行は避け、複数台で走行する</li>
            <li>連絡手段を確保する（携帯電話、衛星電話など）</li>
            <li>日没前に下山する計画を立てる</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #28a745',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#155724', marginBottom: '1rem' }}>
            🌲 自然保護
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: '#155724' }}>
            <li>ゴミは必ず持ち帰る</li>
            <li>植生を傷つけない</li>
            <li>野生動物に配慮する</li>
            <li>指定された道以外は走行しない</li>
            <li>騒音に配慮する</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #17a2b8',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#0c5460', marginBottom: '1rem' }}>
            📋 法令遵守
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: '#0c5460' }}>
            <li>通行止めや私有地への進入禁止を守る</li>
            <li>地元の規制やルールを確認・遵守する</li>
            <li>森林法、自然公園法などの関連法規を理解する</li>
            <li>林業作業中は作業者の指示に従う</li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#2d5016', marginBottom: '1rem' }}>
          よくある質問
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#4a7023', marginBottom: '0.5rem' }}>
            Q. 投稿した林道情報は編集できますか？
          </h3>
          <p style={{ marginLeft: '1rem', color: '#666' }}>
            A. はい、自分が投稿した林道情報は編集・削除が可能です。
            マップ上のマーカーをクリックして詳細を表示し、「編集」ボタンから変更できます。
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#4a7023', marginBottom: '0.5rem' }}>
            Q. 位置情報が取得できない場合は？
          </h3>
          <p style={{ marginLeft: '1rem', color: '#666' }}>
            A. ブラウザの位置情報利用許可を確認してください。
            許可しない場合でも、地図上で手動でピンを配置することで林道を投稿できます。
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#4a7023', marginBottom: '0.5rem' }}>
            Q. 不適切な投稿を見つけた場合は？
          </h3>
          <p style={{ marginLeft: '1rem', color: '#666' }}>
            A. お問い合わせフォームから運営チームにご報告ください。
            内容を確認の上、適切に対応いたします。
          </p>
        </div>
      </section>

      <section style={{
        backgroundColor: '#f8f9fa',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ fontSize: '1.5rem', color: '#2d5016', marginBottom: '1rem' }}>
          お問い合わせ
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          ご不明な点やご要望がございましたら、お気軽にお問い合わせください。
        </p>
        <a
          href="/contact"
          style={{
            display: 'inline-block',
            backgroundColor: '#2d5016',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
        >
          お問い合わせフォームへ
        </a>
      </section>
    </div>
  );
}
