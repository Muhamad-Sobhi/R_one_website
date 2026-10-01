import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'R/ONE | قطع معمولة للحركة',
  description: 'اكتشف قطع R/ONE المصممة والمصنعة بعناية في القاهرة.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}