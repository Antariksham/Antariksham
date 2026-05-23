export const apiConfig = {
  nasa: {
    baseUrl:   'https://api.nasa.gov',
    apod:      'https://api.nasa.gov/planetary/apod',
    marsRover: 'https://api.nasa.gov/mars-photos/api/v1/rovers',
    neo:       'https://api.nasa.gov/neo/rest/v1',
    images:    'https://images-api.nasa.gov',
  },

  iss: {
    // open-notify.org is down — using wheretheiss.at instead
    position: 'https://api.wheretheiss.at/v1/satellites/25544',
    crew:     'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json',
  },

  launchLibrary: {
    baseUrl:  'https://ll.thespacedevs.com/2.2.0',
    upcoming: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming',
    previous: 'https://ll.thespacedevs.com/2.2.0/launch/previous',
  },

  deepSpace: {
    baseUrl: 'https://eyes.nasa.gov/api',
  },

  cache: {
    iss:       30,
    launches:  300,
    apod:      3600,
    missions:  600,
    deepSpace: 3600,
  },
} as const
