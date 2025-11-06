import Link from 'next/link';

export const metadata = {
  title: 'プライバシーポリシー | 林道マップ',
  description: '林道マップのプライバシーポリシーページ',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem',
      backgroundColor: 'white',
      minHeight: 'calc(100vh - 64px)',
      lineHeight: '1.8'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        color: '#2d5016',
        borderBottom: '2px solid #2d5016',
        paddingBottom: '0.5rem'
      }}>
        プライバシーポリシー
      </h1>

      <p style={{ marginBottom: '1.5rem' }}>
        当サイト（林道マップ）は、以下のとおり個人情報保護方針を定め、個人情報保護の仕組みを構築し、全ユーザーに個人情報保護の重要性の認識と取組みを徹底させることにより、個人情報の保護を推進致します。
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          1. 個人情報の定義
        </h2>
        <p>
          本ポリシーにおいて「個人情報」とは、生存する個人に関する情報であり、氏名、メールアドレス、その他の記述等により特定の個人を識別できる情報を指します。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          2. 個人情報の取得と利用目的
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          当サイトでは、ユーザーが以下のサービスを利用する際に、個人情報（氏名、メールアドレス、ユーザーIDなど）をご登録いただく場合がございます。これらの個人情報は、以下の目的で利用させていただきます。
        </p>
        <ul style={{
          marginLeft: '2rem',
          listStyleType: 'disc'
        }}>
          <li style={{ marginBottom: '0.5rem' }}>質問に対する回答や必要な情報を電子メールなどでご連絡するため</li>
          <li style={{ marginBottom: '0.5rem' }}>ユーザーに合わせたサービスを適切に提供するため</li>
          <li style={{ marginBottom: '0.5rem' }}>利用規約に違反したユーザーを特定し、ご利用をお断りするため</li>
          <li style={{ marginBottom: '0.5rem' }}>当サイトのサービスに関する改善、新サービス開発の参考とするため</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          3. 個人情報の第三者への開示・提供の禁止
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          当サイトは、お客さまよりお預かりした個人情報を適切に管理し、次のいずれかに該当する場合を除き、個人情報を第三者に開示いたしません。
        </p>
        <ul style={{
          marginLeft: '2rem',
          listStyleType: 'disc'
        }}>
          <li style={{ marginBottom: '0.5rem' }}>お客さまの同意がある場合</li>
          <li style={{ marginBottom: '0.5rem' }}>お客さまが希望されるサービスを行なうために当サイトが業務を委託する業者に対して開示する場合</li>
          <li style={{ marginBottom: '0.5rem' }}>法令に基づき開示することが必要である場合</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          4. Google AdSenseについて（広告配信）
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          当サイトでは、第三者配信の広告サービス「Google AdSense」を利用しています。
        </p>
        <p style={{ marginBottom: '1rem' }}>
          Googleなどの第三者広告配信事業者は、Cookie（クッキー）を使用することで、ユーザーが当サイトや他のサイトに過去にアクセスした情報に基づいて、適切な広告をユーザーに表示します。
        </p>
        <p style={{ marginBottom: '1rem' }}>
          このCookieには、ユーザー名やメールアドレスなど個人を特定できる情報は含まれておりません。
        </p>
        <p style={{ marginBottom: '1rem' }}>
          ユーザーは、<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#2d5016', textDecoration: 'underline' }}>広告設定</a>から、パーソナライズ広告を無効にすることができます。また、<a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#2d5016', textDecoration: 'underline' }}>About Ads</a>のページにアクセスして、パーソナライズ広告に使用される第三者配信事業者のCookieを無効にすることができます。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          5. アクセス解析ツールについて
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          当サイトでは、Googleによるアクセス解析ツール「Google Analytics」を利用しています。
        </p>
        <p style={{ marginBottom: '1rem' }}>
          Google Analyticsはトラフィックデータの収集のためにCookieを使用しています。
        </p>
        <p style={{ marginBottom: '1rem' }}>
          トラフィックデータは匿名で収集されており、個人を特定するものではありません。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          6. 免責事項
        </h2>
        <p>
          当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について、当サイトは一切の責任を負いません。また、当サイトのコンテンツ・情報について、できる限り正確な情報を提供するように努めておりますが、正確性や安全性を保証するものではありません。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          7. 著作権について
        </h2>
        <p>
          当サイトで掲載している文章、画像、動画などの著作権は、原則として当サイトに帰属します。これらの情報を無断転載することを禁止します。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#2d5016'
        }}>
          8. お問い合わせ窓口
        </h2>
        <p>
          本ポリシーに関するお問い合わせ、または個人情報の開示・訂正・削除のご希望は、
          <Link href="/contact" style={{ color: '#2d5016', textDecoration: 'underline' }}>
            お問い合わせページ
          </Link>
          よりご連絡ください。
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <p style={{
          fontSize: '0.9rem',
          color: '#666',
          marginTop: '3rem'
        }}>
          策定日：2025年11月7日
        </p>
      </section>

      <div style={{
        marginTop: '3rem',
        textAlign: 'center'
      }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#2d5016',
            color: 'white',
            textDecoration: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '4px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
