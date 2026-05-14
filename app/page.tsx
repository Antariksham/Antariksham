import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { HomePage } from '@/modules/homepage/components/HomePage'

export const metadata: Metadata = {
  title:       siteConfig.seo.defaultTitle,
  description: siteConfig.description,
}

export const revalidate = 300

export default function Page() {
  return <HomePage />
}
