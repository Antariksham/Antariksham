import type { LanguageCode } from '@/lib/i18n'

export type MissionStatus =
  | 'active'
  | 'upcoming'
  | 'completed'
  | 'failed'
  | 'in-development'
  | 'cancelled'

export type MissionType =
  | 'crewed'
  | 'robotic'
  | 'flyby'
  | 'orbiter'
  | 'lander'
  | 'rover'
  | 'sample-return'
  | 'telescope'

export interface SpaceAgency {
  id:          string
  name:        string
  slug:        string
  shortName:   string
  country:     string
  logoUrl:     string | null
  description: string | null
  websiteUrl:  string | null
}

/**
 * Enhanced Mission Identity (Phase 1, Feature 1).
 *
 * Stored inside the additive `missions.details` JSONB column under the
 * `identity` key (see migration 20260726140000_mission_details.sql). Every
 * field is a plain string that defaults to `''` when unset, which keeps the
 * form, the normalizers, and validation simple and keeps legacy missions
 * (whose `details` is NULL) fully backward compatible.
 *
 * The canonical `name`, `slug` and `description` remain top-level `missions`
 * columns — these are the *additional* identity attributes that turn a basic
 * record into a comprehensive mission identity panel.
 */
export interface MissionIdentity {
  /** Short display name, e.g. "ISS" for the International Space Station. */
  shortName:  string
  /** Mission acronym, e.g. "JWST", "TESS". */
  acronym:    string
  /** One-line subtitle / tagline shown under the mission name. */
  subtitle:   string
  /** Concise summary (card + hero). Recommended for every mission. */
  summary:    string
  /** Primary mission objective, in one or two sentences. */
  objective:  string
  /** Optional mission motto, e.g. "Dare Mighty Things". */
  motto:      string
  /** Official mission website (validated URL). */
  website:    string
  /** Wikipedia article URL (validated URL). */
  wikipedia:  string
  /** Official press-kit URL (validated URL). */
  pressKit:   string
  /** Optional alternative name / former designation. */
  alias:      string
}

/**
 * Rich Mission Classification (Phase 1, Feature 2).
 *
 * Stored in `missions.details.classification`. The canonical `status`,
 * `mission_type`, `destination` and `agency_id` columns remain the
 * backward-compatible *primary projections* (they still power every existing
 * filter, card and join); this holds the full richness on top:
 *   - `status`       — one of the 15 extended lifecycle stages (a superset of
 *                      the legacy statuses). The base `status` column stores its
 *                      legacy projection so old filters keep working.
 *   - `types`        — multiple mission-type tags (index 0 is the primary, whose
 *                      legacy projection is written to the `mission_type` column).
 *   - `destinations` — multiple destinations (index 0 → the `destination` column).
 *   - `agencies`     — partner / commercial / institution collaborators by role
 *                      (arrays of `space_agencies` ids). The primary agency stays
 *                      in the `agency_id` column.
 */
export interface MissionClassification {
  status:       string
  types:        string[]
  destinations: string[]
  agencies: {
    partners:     string[]
    commercial:   string[]
    institutions: string[]
  }
}

export type CollaboratorRole = 'partner' | 'commercial' | 'institution'

/** A lightweight agency reference resolved for display on the public page. */
export interface AgencyRef {
  id:         string
  name:       string
  shortName:  string
  slug:       string
  country:    string
  logoUrl:    string | null
  websiteUrl: string | null
}

/** A non-primary agency attached to a mission, tagged with its role. */
export interface MissionCollaborator {
  role:   CollaboratorRole
  agency: AgencyRef
}

/**
 * Professional Mission Specifications (Phase 1, Feature 3).
 *
 * Stored in `missions.details.specifications`. Engineering + programmatic facts
 * about the spacecraft and mission. All fields optional strings (defaulting to
 * `''`) except `instruments`, a list of scientific-instrument names. Masses,
 * power, duration etc. are free strings so editors can include units
 * ("2,600 kg", "2.5 kW") — light validation checks they read like measurements.
 *
 * Note: primary / secondary DESTINATION are NOT stored here — they are derived
 * from `classification.destinations` (single source of truth) and only surfaced
 * read-only in the specifications UI.
 */
export interface MissionSpecifications {
  launchVehicle:       string
  spacecraftName:      string
  manufacturer:        string
  launchMass:          string
  dryMass:             string
  payloadMass:         string
  missionDuration:     string
  expectedLifetime:    string
  powerSource:         string
  powerOutput:         string
  communicationSystem: string
  primaryPayload:      string
  secondaryPayload:    string
  budget:              string
  orbitType:           string
  instruments:         string[]
  missionFamily:       string
  program:             string
}

/**
 * Scientific Objectives (Phase 1, Feature 4).
 *
 * Stored in `missions.details.objectives` — the structured expansion of a
 * mission's science goals. The single PRIMARY objective stays in
 * `identity.objective` (Feature 1, the single source of truth); this holds the
 * structured extras. Each list is ordered (editors reorder via drag-and-drop).
 */
export interface MissionObjectives {
  secondary:           string[]
  technologyDemos:     string[]
  scientificQuestions: string[]
  expectedDiscoveries: string[]
  significance:        string
}

export type LaunchSuccess = 'unknown' | 'success' | 'partial' | 'failure'

/**
 * Improved Launch Information (Phase 1, Feature 6).
 *
 * Stored in `missions.details.launch`. The launch DATE reuses the base
 * `missions.launch_date` column (single source of truth — it powers card
 * sorting and the meta row), so it is NOT stored here. `windowStart`/`windowEnd`
 * are `datetime-local` strings ("YYYY-MM-DDTHH:MM"), which sort lexicographically
 * — used for the logical date-ordering validation. Press kit is shared from
 * `identity.pressKit`.
 */
export interface MissionLaunch {
  time:          string   // launch time, free text (may include a zone)
  windowStart:   string   // datetime-local
  windowEnd:     string   // datetime-local
  site:          string
  pad:           string
  provider:      string
  rocket:        string
  country:       string
  missionNumber: string
  success:       LaunchSuccess
  livestreamUrl: string
  countdown:     boolean   // show a live countdown on the public page
}

/**
 * A single media asset with newsroom-grade metadata (Phase 1, Feature 7).
 * `url` is the asset; the rest is optional attribution/licensing.
 */
export interface MediaItem {
  url:          string
  alt:          string
  caption:      string
  credit:       string
  photographer: string
  agency:       string
  sourceUrl:    string
  copyright:    string
  license:      string
}

/**
 * Enhanced Media Management (Phase 1, Feature 7).
 *
 * Stored in `missions.details.media`. The HERO image mirrors the base
 * `featured_image` column (single source of truth for cards + the hero), so
 * `media.hero.url` and `featured_image` stay in sync. Single slots are one
 * `MediaItem`; list slots are arrays. `videos`/`documents` reuse `MediaItem`
 * (the `url` points at the video/document; `caption` is its title).
 */
export interface MissionMedia {
  hero:         MediaItem
  patch:        MediaItem
  logo:         MediaItem
  agencyLogo:   MediaItem
  banner:       MediaItem
  gallery:      MediaItem[]
  infographics: MediaItem[]
  animations:   MediaItem[]
  videos:       MediaItem[]
  documents:    MediaItem[]
}

/**
 * The full, extensible `missions.details` payload. Each Phase 1 feature owns
 * one namespaced key. Every key is optional so the model can grow without a
 * schema change or a backward-compat break.
 */
export interface MissionDetails {
  identity?:       MissionIdentity
  classification?: MissionClassification
  specifications?: MissionSpecifications
  objectives?:     MissionObjectives
  launch?:         MissionLaunch
  media?:          MissionMedia
}

export interface Mission {
  id:            string
  name:          string
  slug:          string
  agencyId:      string
  agency:        SpaceAgency | null
  description:   string
  status:        MissionStatus
  launchDate:    string | null
  missionType:   MissionType
  featuredImage: string | null
  destination:   string | null
  timeline:      MissionTimeline[]
  featured:      boolean
  /** Enhanced identity attributes (Feature 1). Always present, defaults to
   *  empty strings for legacy missions with no `details.identity`. */
  identity:      MissionIdentity
  /** Effective rich classification (Feature 2). Always present — falls back to
   *  the base status/type/destination columns for legacy missions. */
  classification: MissionClassification
  /** Resolved non-primary agencies grouped by role (Feature 2). */
  collaborators:  MissionCollaborator[]
  /** Professional specifications (Feature 3). Always present; empty for legacy. */
  specifications: MissionSpecifications
  /** Structured scientific objectives (Feature 4). Always present; empty for legacy. */
  objectives:     MissionObjectives
  /** Launch information (Feature 6). Always present; empty for legacy. */
  launch:         MissionLaunch
  /** Enhanced media (Feature 7). Always present; hero mirrors featuredImage. */
  media:          MissionMedia
  createdAt:     string
  updatedAt:     string
  // i18n — language actually served (falls back to 'en') + every language it
  // can be read in.
  language:           LanguageCode
  availableLanguages: LanguageCode[]
}

export type TimelineStatus = 'completed' | 'in-progress' | 'upcoming' | 'delayed' | 'cancelled'
export type TimelineImportance = 'critical' | 'major' | 'normal' | 'minor'

/**
 * A mission timeline milestone. The original four fields (date, title,
 * description, completed) are unchanged and always present, so existing
 * timelines keep working; every Feature-5 field is optional and additive.
 * `completed` is kept in sync with `status === 'completed'` for backward compat.
 * `description` is the SHORT description; `detailedDescription` is the long form.
 */
export interface MissionTimeline {
  date:        string
  title:       string
  description: string
  completed:   boolean
  // ── Advanced timeline (Feature 5) — all optional/additive ──
  /** Stable id for reorder keys + duplicate (generated if absent). */
  id?:                  string
  detailedDescription?: string
  time?:                string   // HH:MM
  timezone?:            string   // e.g. "UTC", "UTC-5"
  status?:              TimelineStatus
  location?:            string
  importance?:          TimelineImportance
  eventType?:           string   // a suggested type or a custom value
  sourceUrl?:           string
  image?:               string
  videoUrl?:            string
  notes?:               string
}

export interface MissionCard {
  id:            string
  name:          string
  slug:          string
  agency:        Pick<SpaceAgency, 'name' | 'shortName'> | null
  status:        MissionStatus
  launchDate:    string | null
  missionType:   MissionType
  featuredImage: string | null
  destination:   string | null
  description:   string
  /** Language this card's text rendered in — see ArticleCard.language. */
  language:      LanguageCode
}
