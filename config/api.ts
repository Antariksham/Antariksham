export const apiConfig = {
  nasa: {
    baseUrl:  'https://api.nasa.gov',
    apod:     'https://api.nasa.gov/planetary/apod',
    marsRover:'https://api.nasa.gov/mars-photos/api/v1/rovers',
    neo:      'https://api.nasa.gov/neo/rest/v1',
    images:   'https://images-api.nasa.gov',
  },

  iss: {
    position: 'http://api.open-notify.org/iss-now.json',
    crew:     'http://api.open-notify.org/astros.json',
  },

  launchLibrary: {
    baseUrl:  'https://ll.thespacedevs.com/2.2.0',
    upcoming: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming',
    previous: 'https://ll.thespacedevs.com/2.2.0/launch/previous',
  },

  cache: {
    iss:       30,
    launches:  300,
    apod:      3600,
    missions:  600,
    deepSpace: 3600,
  },
} as const
