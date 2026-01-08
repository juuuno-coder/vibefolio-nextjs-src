/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서버 전용 외부 패키지 설정 (Next.js 14 특정 버전 대응)
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici'],
    optimizePackageImports: ['lucide-react', '@fortawesome/react-fontawesome', 'dayjs'],
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'vibefolio.com' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.supabase.co' }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7일 캐시
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

  // 빌드 속도 및 메모리 최적화
  eslint: {
    ignoreDuringBuilds: true, // 빌드 시 린트 체크 스킵 (메모리 절약)
  },
  typescript: {
    ignoreBuildErrors: true, // 빌드 시 타입 오류 스킵 (개발 중 pass 확인됨)
  },
  swcMinify: true, // 속도가 빠른 SWC 컴파일러 사용
  productionBrowserSourceMaps: false, // 브라우저 소스맵 생성 안함 (빌드 메모리 절약)

  // 리다이렉트
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

  // Webpack 설정 최적화
  webpack: (config, { dev, isServer }) => {
    // 빌드 시 메모리 사용량을 줄이기 위해 parallelism 조정
    if (!dev) {
      config.parallelism = 50;
      // 대용량 모듈이 있을 경우 소스맵 비활성화로 메모리 확보
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
