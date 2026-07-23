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
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#f0f4ff' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware sets x-pathname on every request
  const pathname = headers().get('x-pathname') || ''
  const isAdmin  = pathname.startsWith('/admin')
  // Language-prefixed routes (/hi/…) render in that language.
  const htmlLang = (pathname === '/hi' || pathname.startsWith('/hi/')) ? 'hi' : 'en'

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      style={{
        '--font-serif': merriweather.style.fontFamily,
        '--font-mono':  dmSans.style.fontFamily,
      } as React.CSSProperties}
    >
      <head>
  {/* Theme — apply saved choice before paint to avoid a flash */}
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
    }}
  />
  {/* KaTeX is self-hosted and code-split into the Learn route (see
      modules/learn/components/LearnArticlePage.tsx) — no global CDN load. */}
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
