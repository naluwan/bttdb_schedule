import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/providers/toaster-provider';
import ProtectedProvider from '@/components/providers/protected-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EZY Schedule 排班系統',
  description: '簡易、快速排班系統、所有員工只需排好休假，就能一鍵補齊所有剩餘班別',
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
