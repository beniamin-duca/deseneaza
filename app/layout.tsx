import type { Metadata, Viewport } from 'next'
import { Fredoka, Quicksand } from 'next/font/google'
import './globals.css'

const fredoka = Fredoka({ 
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
})

const quicksand = Quicksand({ 
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Riza - Deseneaza si Coloreaza',
  description: 'Aplicatie de desenat pentru copii. Deseneaza, coloreaza si distreaza-te!',
  keywords: ['desenat', 'copii', 'colorat', 'aplicatie', 'creativ', 'arta'],
  authors: [{ name: 'Riza' }],
  openGraph: {
    title: 'Riza - Deseneaza si Coloreaza',
    description: 'Aplicatie de desenat pentru copii. Deseneaza, coloreaza si distreaza-te!',
    locale: 'ro_RO',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B6B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" className={`${fredoka.variable} ${quicksand.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
