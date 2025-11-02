import type { Metadata } from 'next';
import Header from '@/components/Header';
import { Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: '林道シェア',
  description: '林道情報を共有するマップ型SNS',
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
      <body className={notoSansJp.className} style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f5f5'
      }}>
        <AuthProvider>
          <Header />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
