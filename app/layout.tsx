import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { MenuProvider } from '@/lib/menu-context';

export const metadata: Metadata = {
  title: {
    default: '林道マップ - 全国の林道情報を共有するマップ型SNS',
    template: '%s | 林道マップ'
  },
  description: '日本全国の林道情報を地図上で共有できるマップ型SNS。オフロードバイク、四輪駆動車、アドベンチャー好きのための林道コミュニティ。',
  keywords: ['林道', '林道マップ', 'オフロード', 'バイク', '四駆', 'アドベンチャー', '日本', '地図', 'SNS'],
  authors: [{ name: '林道マップ' }],
  creator: '林道マップ',
  publisher: '林道マップ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rindou-kv36naukc-horihorisousans-projects.vercel.app'),
  openGraph: {
    title: '林道マップ - 全国の林道情報を共有するマップ型SNS',
    description: '日本全国の林道情報を地図上で共有できるマップ型SNS。オフロードバイク、四輪駆動車、アドベンチャー好きのための林道コミュニティ。',
    url: 'https://rindou-kv36naukc-horihorisousans-projects.vercel.app',
    siteName: '林道マップ',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '林道マップ - 全国の林道情報を共有するマップ型SNS',
    description: '日本全国の林道情報を地図上で共有できるマップ型SNS。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="google-site-verification" content="sW3APj4yZTv4lvC5C3_p1NeJltoJXSMrtpFsRjLe71E" />
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '林道マップ',
              description: '日本全国の林道情報を地図上で共有できるマップ型SNS',
              url: 'https://rindou-kv36naukc-horihorisousans-projects.vercel.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://rindou-kv36naukc-horihorisousans-projects.vercel.app/?search={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className={notoSansJp.className} style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AuthProvider>
          <MenuProvider>
            <Header />
            <main style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
              <Footer />
            </main>
          </MenuProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
