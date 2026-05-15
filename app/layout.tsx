import type { Metadata, Viewport } from 'next'
import { Crimson_Pro, DM_Mono, Outfit } from 'next/font/google'
import { siteConfig } from '@/config/site'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:  siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.description,
}

export const viewport: Viewport = {
  themeColor:  '#07090c',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{
      '--font-serif': crimsonPro.style.fontFamily,
      '--font-mono':  dmMono.style.fontFamily,
      '--font-sans':  outfit.style.fontFamily,
    } as React.CSSProperties}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
