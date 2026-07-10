import type { Metadata, Viewport } from 'next'
import { Merriweather, DM_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import { siteConfig } from '@/config/site'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'
import '@/styles/responsive.css'

// CosmosDaily fonts. Merriweather = article reading prose (serif);
// DM Sans = labels / eyebrows / meta. The UI + headings use a Segoe UI
// system stack defined in styles/globals.css (--font-sans), so no webfont
// is downloaded for the body/UI type.
const merriweather = Merriweather({
  subsets: ['latin'],
  weight:  ['300', '400', '700'],
  style:   ['normal', 'italic'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight:  ['300', '400', '500', '600', '700'],
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
  themeColor:  '#0a0a0f',
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
        '--font-serif': merriweather.style.fontFamily,
        '--font-mono':  dmSans.style.fontFamily,
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
