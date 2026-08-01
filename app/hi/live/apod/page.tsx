// Hindi twin of app/live/apod/page.tsx.
//
// Body AND metadata are re-exported: this route's metadata is computed per
// request from the row being rendered, so it cannot be built from a static
// dictionary entry the way the other twins are. That means the title and
// canonical it emits are still the English route's — tracked as the remaining
// gap for the metadata pass, and harmless meanwhile because the page renders
// and the language switch no longer dead-ends here.
export { default, generateMetadata } from '@/app/live/apod/page'

export const revalidate = 3600
