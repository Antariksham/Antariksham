import type { Metadata, Viewport } from 'next'
import { Crimson_Pro, DM_Mono, Outfit } from 'next/font/google'
import { headers } from 'next/headers'
import { siteConfig } from '@/config/site'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'
import '@/styles/responsive.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight:  ['300', '400', '600'],
  style:   ['normal', 'italic'],
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight:  ['300', '400'],
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight:  ['300', '400', '500', '600'],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware sets x-pathname on every request
  const pathname = headers().get('x-pathname') || ''
  const isAdmin  = pathname.startsWith('/admin')

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{
        '--font-serif': crimsonPro.style.fontFamily,
        '--font-mono':  dmMono.style.fontFamily,
        '--font-sans':  outfit.style.fontFamily,
      } as React.CSSProperties}
    >
      <head>
  {/* KaTeX — CSS must load before JS for fonts/symbols to render */}
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"
  />
  <script
    defer
    src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"
  />
</head>
      <body>
        {isAdmin ? (
          // Admin — no Navbar or Footer, AdminLayout handles its own chrome
          <>{children}</>
        ) : (
          // Public — full site chrome
          <>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  )
}
