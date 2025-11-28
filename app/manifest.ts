import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pomofomo - 뽀모도로 타이머',
    short_name: 'Pomofomo',
    description: '뽀모도로를 안 하면 포모가 온다!',
    start_url: '/',
    display: 'standalone', // 주소창 없는 앱 모드
    background_color: '#ffffff',
    theme_color: '#f43f5e', // 우리가 쓰는 Rose-500 색상
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: '64x64',
        type: 'image/x-icon',
      },
    ],
  };
}
