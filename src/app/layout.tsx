import type { Metadata } from 'next';
import { Fira_Sans } from 'next/font/google';
import './globals.css';
import Toast from '@/ui/toast/Toast';

const fira_sans = Fira_Sans({
  variable: '--font-fira-sans',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'My Flow - Create your flows here',
  description: 'Create your flows here. Share your flows, or collaborate on your flows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${fira_sans.variable} h-full antialiased`}>
      <body suppressHydrationWarning className='min-h-full'>
        {children}
        <Toast />
      </body>
    </html>
  );
}
