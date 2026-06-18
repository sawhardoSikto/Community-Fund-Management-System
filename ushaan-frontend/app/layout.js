import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ঊষাণ',
  icons: {
    icon: '/ushaan.png',
  },
}
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