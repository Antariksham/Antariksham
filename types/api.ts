export interface ApiResponse<T> {
  data:    T | null
  error:   string | null
  success: boolean
}

export interface NASAApod {
  date:          string
  title:         string
  explanation:   string
  url:           string
  hdurl:         string | null
  mediaType:     string
  copyright:     string | null
  serviceVersion:string
}

export interface ISSPosition {
  latitude:  number
  longitude: number
  altitude:  number
  velocity:  number
  timestamp: number
}

export interface ISSCrew {
  name:  string
  craft: string
}

export interface DeepSpaceProbe {
  id:                  string
  name:                string
  agency:              string
  launchDate:          string
  distanceFromEarth:   number
  distanceFromSun:     number
  velocity:            number
  signalDelay:         number
  missionPhase:        string
  targetBody:          string | null
  communicationStatus: 'nominal' | 'degraded' | 'lost'
  lastUpdated:         string
}

export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  perPage:    number
  totalPages: number
}
