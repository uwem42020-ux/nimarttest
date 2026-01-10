// app/robots.ts - Robots.txt Generator
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/auth/callback',
          '/test-simple',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/callback',
        ],
      },
    ],
    sitemap: 'https://nimart.ng/sitemap.xml',
  }
}
