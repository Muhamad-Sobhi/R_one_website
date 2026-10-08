import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://r-one.app'),
  title: {
    default: 'R/ONE | قطع معمولة للحركة',
    template: '%s | R/ONE',
  },
  description: 'اكتشف قطع R/ONE المصممة والمصنعة بعناية في مصر، مع توصيل لكل المحافظات.',
  applicationName: 'R/ONE',
  keywords: ['R/ONE', 'ملابس', 'أزياء شبابية', 'متجر ملابس', 'توصيل لكل المحافظات'],
  openGraph: {
    title: 'R/ONE | قطع معمولة للحركة',
    description: 'قطع معمولة بعناية، تفصيلة بتفصيلة، لحد بابك.',
    siteName: 'R/ONE',
    locale: 'ar_EG',
    type: 'website',
    images: [{ url: '/logo.png', width: 500, height: 500, alt: 'R/ONE' }],
  },
  twitter: {
    card: 'summary',
    title: 'R/ONE | قطع معمولة للحركة',
    description: 'قطع معمولة بعناية، تفصيلة بتفصيلة، لحد بابك.',
    images: ['/logo.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#101010',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}