import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'RWM — Team Retrospectives',
  description: 'Real-time collaborative retrospective tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <LanguageProvider>
          {children}
          <div className="fixed bottom-2 left-3 text-[11px] select-none pointer-events-none" style={{ color: 'var(--text-subtle)' }}>
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </div>
          <div className="fixed bottom-2 right-3 z-50">
            <LanguageToggle />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
