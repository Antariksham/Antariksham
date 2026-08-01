'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { langFromPathname } from '@/lib/i18n'

/**
 * Keeps `<html lang>` honest across client-side navigation.
 *
 * The root layout sets it from `headers()`, which is right for the first paint
 * — the server-rendered value is what crawlers and the initial screen-reader
 * announcement see, so it has to stay. But the App Router does not re-render a
 * shared layout on client-side navigation, so that value then sticks: going
 * from `/` to `/hi` in the browser left `lang="en"` on a page of Devanagari,
 * which tells a screen reader to read Hindi with an English voice and tells
 * the browser to hyphenate it by English rules.
 *
 * Renders nothing — it only writes the attribute the layout already produced,
 * so there is no hydration mismatch to suppress.
 */
export function HtmlLangSync() {
  const pathname = usePathname() ?? ''

  useEffect(() => {
    const lang = langFromPathname(pathname)
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang
  }, [pathname])

  return null
}
