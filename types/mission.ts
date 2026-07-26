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
 * The full, extensible `missions.details` payload. Each Phase 1 feature owns
 * one namespaced key; only `identity` exists so far. Every key is optional so
 * the model can grow without a schema change or a backward-compat break.
 */
export interface MissionDetails {
  identity?: MissionIdentity
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
  createdAt:     string
  updatedAt:     string
  // i18n — language actually served (falls back to 'en') + every language it
  // can be read in.
  language:           LanguageCode
  availableLanguages: LanguageCode[]
}

export interface MissionTimeline {
  date:        string
  title:       string
  description: string
  completed:   boolean
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
}
