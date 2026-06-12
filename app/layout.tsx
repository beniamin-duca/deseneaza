import type { Metadata, Viewport } from 'next'
import { Fredoka, Quicksand, Baloo_2, Nunito } from 'next/font/google'
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

const baloo = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Plaiu — Desenează online, gratuit, pentru copii',
  description:
    'Plaiu — locul unde copiii desenează și colorează gratuit. Pagini libere, povești, sărbători. Fără cont, fără reclame agresive.',
  keywords: ['desene copii', 'colorat online', 'desenat gratuit', 'pagini de colorat', 'copii', 'Plaiu'],
  authors: [{ name: 'Plaiu' }],
  openGraph: {
    title: 'Plaiu — Desenează online, gratuit, pentru copii',
    description:
      'Locul unde copiii desenează și colorează gratuit. Fără cont, fără reclame agresive.',
    locale: 'ro_RO',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7CB342',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" className={`${fredoka.variable} ${quicksand.variable} ${baloo.variable} ${nunito.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
