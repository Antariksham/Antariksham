// ── Launch types ──────────────────────────────────────────────

export type LaunchStatus =
  | 'Go'           // confirmed, on schedule
  | 'TBD'          // to be determined
  | 'Success'      // completed successfully
  | 'Failure'      // launch failed
  | 'Hold'         // on hold
  | 'InFlight'     // currently in flight
  | 'PartialFailure'

export interface LaunchAgency {
  id:        number
  name:      string
  shortName: string | null
  countryCode: string | null
  logoUrl:   string | null
}

export interface LaunchRocket {
  id:          number
  name:        string
  family:      string | null
  variant:     string | null
  imageUrl:    string | null
}

export interface LaunchPad {
  id:        number
  name:      string
  location:  string
  countryCode: string | null
  latitude:  number | null
  longitude: number | null
}

export interface Launch {
  id:           string
  name:         string
  slug:         string | null
  status:       LaunchStatus
  statusName:   string
  net:          string | null   // NET = No Earlier Than (ISO datetime)
  windowStart:  string | null
  windowEnd:    string | null
  probability:  number | null   // 0–100
  rocket:       LaunchRocket | null
  agency:       LaunchAgency | null
  pad:          LaunchPad | null
  missionName:  string | null
  missionDesc:  string | null
  missionType:  string | null
  imageUrl:     string | null
  livestreamUrl: string | null
  isUpcoming:   boolean
}

export interface LaunchesResponse {
  upcoming: Launch[]
  recent:   Launch[]
  total:    number
}
