/**
 * Curated SSR fallback for /gallery — twelve iconic, verified images from the
 * NASA Image and Video Library (images-assets.nasa.gov URLs checked at build
 * time). This set IS the "Featured" tab: it renders with zero network on the
 * server (deterministic → hydration-safe) and stays useful if the live API is
 * unreachable. Every other tab and search fetches live via /api/gallery.
 */

import type { GalleryImage } from './nasaImages'

export const FALLBACK_IMAGES: GalleryImage[] = [
  {
    id: 'as11-40-5903',
    title: 'Astronaut Edwin Aldrin walks on lunar surface near leg of Lunar Module',
    thumb: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg',
    date: '1969-07-20', center: 'JSC', credit: 'NASA/JSC',
    description: '',
  },
  {
    id: 'as08-14-2383',
    title: 'Apollo 8 Mission image, Earth over the horizon of the moon',
    thumb: 'https://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~medium.jpg',
    date: '1968-12-24', center: 'JSC', credit: 'NASA/JSC',
    description: '',
  },
  {
    id: 'carina_nebula',
    title: 'James Webb Space Telescope NIRCam Image of the “Cosmic Cliffs” in Carina Nebula',
    thumb: 'https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~medium.jpg',
    date: '2022-07-12', center: 'STScI (Webb)', credit: 'NASA/STScI (Webb)',
    description: '',
  },
  {
    id: 'GSFC_20171208_Archive_e000842',
    title: 'Hubble Goes High Def to Revisit the Iconic \'Pillars of Creation\'',
    thumb: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000842/GSFC_20171208_Archive_e000842~medium.jpg',
    date: '2017-12-08', center: 'GSFC', credit: 'NASA/GSFC',
    description: '',
  },
  {
    id: 'PIA00452',
    title: 'Solar System Portrait - Earth as Pale Blue Dot',
    thumb: 'https://images-assets.nasa.gov/image/PIA00452/PIA00452~thumb.jpg',
    date: '1996-09-12', center: 'JPL', credit: 'NASA/JPL',
    description: '',
  },
  {
    id: 'PIA21617',
    title: 'Cassini "Noodle" Mosaic of Saturn',
    thumb: 'https://images-assets.nasa.gov/image/PIA21617/PIA21617~medium.jpg',
    date: '2017-07-24', center: 'JPL', credit: 'NASA/JPL',
    description: '',
  },
  {
    id: 'GSFC_20171208_Archive_e001651',
    title: 'Hubble Goes to the eXtreme to Assemble Farthest-Ever View of the Universe',
    thumb: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001651/GSFC_20171208_Archive_e001651~medium.jpg',
    date: '2017-12-08', center: 'GSFC', credit: 'NASA/GSFC',
    description: '',
  },
  {
    id: 'iss039e005387',
    title: 'Earth Observations taken by the Expedition 39 Crew',
    thumb: 'https://images-assets.nasa.gov/image/iss039e005387/iss039e005387~medium.jpg',
    date: '2014-03-23', center: 'JSC', credit: 'NASA/JSC',
    description: '',
  },
  {
    id: 'PIA24542',
    title: 'Perseverance\'s Selfie with Ingenuity',
    thumb: 'https://images-assets.nasa.gov/image/PIA24542/PIA24542~medium.jpg',
    date: '2021-04-07', center: 'JPL', credit: 'NASA/JPL',
    description: '',
  },
  {
    id: 'NHQ202211160028',
    title: 'Artemis I Launch',
    thumb: 'https://images-assets.nasa.gov/image/NHQ202211160028/NHQ202211160028~medium.jpg',
    date: '2022-11-16', center: 'HQ', credit: 'NASA/HQ',
    description: '',
  },
  {
    id: 'PIA25433',
    title: 'The Eagle Nebula Observed by WISE',
    thumb: 'https://images-assets.nasa.gov/image/PIA25433/PIA25433~medium.jpg',
    date: '2022-11-11', center: 'JPL', credit: 'NASA/JPL',
    description: '',
  },
  {
    id: 'GSFC_20171208_Archive_e000273',
    title: 'NASA\'s Hubble Captures the Beating Heart of the Crab Nebula',
    thumb: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000273/GSFC_20171208_Archive_e000273~small.jpg',
    date: '2017-12-08', center: 'GSFC', credit: 'NASA/GSFC',
    description: '',
  },
]
