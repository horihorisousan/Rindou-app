'use client';

import { useEffect } from 'react';

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  style?: React.CSSProperties;
}

/**
 * Google AdSense広告バナーコンポーネント
 *
 * 使用方法:
 * 1. Google AdSenseでアカウントを作成し、サイトを登録
 * 2. .env.localファイルに以下を追加:
 *    NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxxxxxxxx
 * 3. 広告ユニットを作成し、dataAdSlotに広告スロットIDを指定
 */
export default function AdBanner({
  dataAdSlot,
  dataAdFormat = 'auto',
  dataFullWidthResponsive = true,
  style = {},
}: AdBannerProps) {
  const adSenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  useEffect(() => {
    if (!adSenseId) {
      console.warn('Google AdSense ID が設定されていません。.env.local に NEXT_PUBLIC_GOOGLE_ADSENSE_ID を設定してください。');
      return;
    }

    try {
      // AdSenseの広告をプッシュ
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [adSenseId]);

  // AdSense IDが設定されていない場合は何も表示しない
  if (!adSenseId) {
    return null;
  }

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: 'block',
        width: '100%',
        ...style
      }}
      data-ad-client={adSenseId}
      data-ad-slot={dataAdSlot}
      data-ad-format={dataAdFormat}
      data-full-width-responsive={dataFullWidthResponsive ? 'true' : 'false'}
    />
  );
}
