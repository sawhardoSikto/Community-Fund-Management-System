import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ঊষাণ - Community Fund Management',
  description: 'ঊষাণ Community Fund Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}