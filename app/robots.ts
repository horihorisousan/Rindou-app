import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://rindou-kv36naukc-horihorisousans-projects.vercel.app/sitemap.xml',
  };
}
