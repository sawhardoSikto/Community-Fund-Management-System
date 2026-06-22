import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'ঊষাণ',
    template: '%s | ঊষাণ',
  },
  description: 'ঊষাণ কমিউনিটি ফান্ড ম্যানেজমেন্ট সিস্টেম',
  icons: {
    icon: '/ushaan.png',
    shortcut: '/ushaan.png',
    apple: '/ushaan.png',
  },
}
export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className={`${inter.className} bg-slate-950 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="w-full border-t border-white/5 bg-slate-950/80 backdrop-blur-md py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} ঊষাণ। সর্বস্বত্ব সংরক্ষিত।</p>
            <p>
              Developed by{' '}
              <a
                href="https://siktobiswas.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 font-semibold transition-colors hover:underline"
              >
                Sikto Biswas
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}