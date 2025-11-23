import type { Metadata, Viewport } from 'next'; // 👈 Viewport가 여기 추가되어야 함
import { Inter } from 'next/font/google'; // 👈 Inter 폰트 가져오기
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pomofomo',
  description: 'Focus on your work with Pomofomo',
  manifest: '/manifest.webmanifest',
  icons: {
    apple: '/icon.png', // 👈 (주의) 확장자 .png까지 적어주는 게 안전합니다
  },
};

// 📱 모바일 뷰포트 설정 (상단바 색상 등)
export const viewport: Viewport = {
  themeColor: '#f43f5e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
