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
