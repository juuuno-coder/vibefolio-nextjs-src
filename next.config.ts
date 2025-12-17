import type { NextConfig } from "next";
// Restart Trigger 2025-12-18 (Green Theme Update)


const nextConfig: NextConfig = {
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7일 캐시
  },
  
  // 실험적 기능
  experimental: {
    optimizePackageImports: ['lucide-react', '@fortawesome/react-fontawesome', 'dayjs'],
  },
  
  // 헤더 설정 (캐싱)
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 리다이렉트 (불필요한 중복 페이지 정리)
  async redirects() {
    return [
      {
        source: '/mypage/likes',
        destination: '/mypage',
        permanent: true,
      },
      {
        source: '/mypage/bookmarks',
        destination: '/mypage',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
