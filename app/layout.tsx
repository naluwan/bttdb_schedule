import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/providers/toaster-provider';
import ProtectedProvider from '@/components/providers/protected-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Back To The Day Before 排班系統',
  description: '排班、打卡系統',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedProvider>
      <html lang='zh-tw' className='hide-scrollbar'>
        <body className={inter.className}>
          <ToastProvider />
          {children}
        </body>
      </html>
    </ProtectedProvider>
  );
};

export default RootLayout;
