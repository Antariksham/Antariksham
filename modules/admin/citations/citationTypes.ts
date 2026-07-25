/**
 * Reference & Citation Management — data model (Phase 2, Feature 7).
 * ─────────────────────────────────────────────────────────────────
 * Pure, DOM-free description of a citation: the supported source types, the
 * structured fields, the citation styles, and the per-type field schema the
 * editor form renders. The formatters (formatCitation.ts) and validation build
 * on this.
 */

export type CitationType =
  | 'journal' | 'book' | 'nasa' | 'esa' | 'isro' | 'arxiv'
  | 'doi' | 'website' | 'research-paper' | 'conference' | 'video' | 'dataset'

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'ieee' | 'custom'

/** A single structured citation. All fields optional except an id + type. */
export interface Citation {
  id:        string          // stable local id (also the reuse key base)
  type:      CitationType
  title:     string
  authors:   string[]        // "Last, First M." each, or a single org name
  year:      string
  container: string          // journal / book / site / conference / publisher-of-record
  publisher: string
  volume:    string
  issue:     string
  pages:     string
  url:       string
  doi:       string
  accessed:  string          // ISO date a website was accessed
  edition:   string
  custom:    string          // raw pre-formatted string (style = 'custom')
}

export const CITATION_TYPES: { value: CitationType; label: string }[] = [
  { value: 'journal',         label: 'Journal Article' },
  { value: 'book',            label: 'Book' },
  { value: 'research-paper',  label: 'Research Paper' },
  { value: 'conference',      label: 'Conference Paper' },
  { value: 'arxiv',           label: 'arXiv Preprint' },
  { value: 'doi',             label: 'DOI Resource' },
  { value: 'website',         label: 'Website' },
  { value: 'video',           label: 'Video' },
  { value: 'dataset',         label: 'Dataset' },
  { value: 'nasa',            label: 'NASA' },
  { value: 'esa',             label: 'ESA' },
  { value: 'isro',            label: 'ISRO' },
]

export const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'apa',     label: 'APA' },
  { value: 'mla',     label: 'MLA' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'ieee',    label: 'IEEE' },
  { value: 'custom',  label: 'Custom' },
]

export type FieldKey = keyof Omit<Citation, 'id' | 'type'>

export const FIELD_LABELS: Record<FieldKey, string> = {
  title:     'Title',
  authors:   'Authors',
  year:      'Year',
  container: 'Publication / Source',
  publisher: 'Publisher',
  volume:    'Volume',
  issue:     'Issue',
  pages:     'Pages',
  url:       'URL',
  doi:       'DOI',
  accessed:  'Accessed date',
  edition:   'Edition',
  custom:    'Custom citation text',
}

// Which fields each type surfaces in the editor form (title + authors + year
// are near-universal; the rest are type-specific).
export const TYPE_FIELDS: Record<CitationType, FieldKey[]> = {
  journal:         ['title', 'authors', 'year', 'container', 'volume', 'issue', 'pages', 'doi', 'url'],
  'research-paper':['title', 'authors', 'year', 'container', 'pages', 'doi', 'url'],
  conference:      ['title', 'authors', 'year', 'container', 'pages', 'doi', 'url'],
  book:            ['title', 'authors', 'year', 'publisher', 'edition', 'url'],
  arxiv:           ['title', 'authors', 'year', 'doi', 'url'],
  doi:             ['title', 'authors', 'year', 'container', 'doi', 'url'],
  website:         ['title', 'authors', 'year', 'container', 'url', 'accessed'],
  video:           ['title', 'authors', 'year', 'container', 'url'],
  dataset:         ['title', 'authors', 'year', 'publisher', 'doi', 'url'],
  nasa:            ['title', 'authors', 'year', 'container', 'url', 'accessed'],
  esa:             ['title', 'authors', 'year', 'container', 'url', 'accessed'],
  isro:            ['title', 'authors', 'year', 'container', 'url', 'accessed'],
}

// The default publishing organisation for the space-agency types.
export const AGENCY_ORG: Partial<Record<CitationType, string>> = {
  nasa: 'NASA', esa: 'European Space Agency', isro: 'ISRO',
}

/** A fresh, empty citation of the given type. */
export function emptyCitation(type: CitationType = 'journal'): Citation {
  return {
    id: '', type, title: '', authors: [], year: '', container: AGENCY_ORG[type] ?? '',
    publisher: '', volume: '', issue: '', pages: '', url: '', doi: '', accessed: '',
    edition: '', custom: '',
  }
}
