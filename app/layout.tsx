import type { Metadata, Viewport } from 'next'
import { Merriweather, DM_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { siteConfig } from '@/config/site'
import { langFromPathname } from '@/lib/i18n'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NavProgress } from '@/components/layout/NavProgress'
import '@/styles/globals.css'
import '@/styles/responsive.css'

// Site fonts. Merriweather = article reading prose (serif);
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
  // Social defaults for anything that does not go through
  // modules/seo/pageMetadata.ts — the error and not-found shells, essentially.
  // Next replaces `openGraph` and `twitter` per segment rather than merging
  // them, so what is here is a floor, not a base every page builds on.
  //
  // Deliberately absent: `openGraph.url` (it used to be hardcoded to the site
  // root, so every page that set no openGraph of its own advertised itself as
  // the homepage) and `twitter.title`/`twitter.description` (pinning them here
  // blocked Next's per-page inheritance, which is why every shared article
  // showed the generic site title on X). The card image is not named here
  // either: app/opengraph-image.tsx supplies it by file convention.
  openGraph: {
    type:        'website',
    siteName:    siteConfig.name,
    locale:      siteConfig.locale,
    title:       siteConfig.seo.defaultTitle,
    description: siteConfig.description,
  },
  twitter: {
    card:    siteConfig.seo.twitterCard,
    site:    siteConfig.twitter,
    creator: siteConfig.twitter,
  },
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
  // Language-prefixed routes (/hi/…) render in that language. Shared with the
  // nav's language switch, so the two can't disagree about what /hi means.
  const htmlLang = langFromPathname(pathname)

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
        {/* Site-wide "your click is loading" cue for route transitions.
            Suspense is required because NavProgress reads useSearchParams(). */}
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
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
