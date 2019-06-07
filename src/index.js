import { addonBuilder, serveHTTP, publishToCentral, getRouter } from 'stremio-addon-sdk'
import pkg from '../package.json'
import ZooqleClient from './ZooqleClient'
import convertTorrentsToStreams from './convertTorrentsToStreams'

import { config } from 'internal'

const STATIC_DIR = 'static'
const USER_AGENT = 'stremio-zooqle'
const ID_PROPERTY = 'tt'

function atob(str) { return Buffer.from(str, 'base64').toString('binary') }

const ID = 'stremio_zooqle_plus'
const ENDPOINT = 'https://stremio-zooqle.now.sh'
const PROXY = false
const CACHE = '1'
const EMAIL = ''
const USERNAME = config.username || atob('Ym9vYmx5Ym9v')
const PASSWORD = config.password || atob('Ym9vYmx5Ym9vMTAxIQ==')

const MANIFEST = {
  name: 'Zooqle+',
  id: ID,
  version: pkg.version,
  description: '\
Watch movies and series indexed by Zooqle from RARBG, KAT, YTS, MegaTorrents and other torrent trackers\
',
  types: ['movie', 'series'],
  idPrefixes: [ ID_PROPERTY ],
  resources: [ 'stream' ],
  // The docs mention `contactEmail`, but the template uses `email`
  email: EMAIL,
  contactEmail: EMAIL,
  logo: `${ENDPOINT}/logo-white.png`,
  icon: `${ENDPOINT}/logo-white.png`,
  background: `${ENDPOINT}/bg.jpg`,
  catalogs: []
}

const builder = new addonBuilder(MANIFEST)

async function findStreams(args) {
  let imdbId = args.id

  if (!imdbId) {
    reject(Error('No IMDB ID in stream request'))
    return
  }

  let torrents

  if (args.type === 'movie') {
    torrents = await client.getMovieTorrents(imdbId)
  } else {
    const season = imdbId.split(':')[1]
    const episode = imdbId.split(':')[2]
    imdbId = imdbId.split(':')[0]
    torrents = await client.getShowTorrents(imdbId, season, episode)
  }

  return convertTorrentsToStreams(torrents)

}

builder.defineStreamHandler(args => {
  return new Promise(async (resolve, reject) => {
    findStreams(args).then(streams => {
      if ((streams || []).length)
        resolve({ streams, cacheMaxAge: 172800 }) // two days
      else
        reject({ streams: [], cacheMaxAge: 3600 }) // one hour
    }).catch(err => {
      /* eslint-disable no-console */
      console.error(
        // eslint-disable-next-line prefer-template
        (new Date().toLocaleString()) +
        ' An error has occurred while processing the following request:'
      )
      console.error(args)
      console.error(err)
      /* eslint-enable no-console */
      reject(err)
    })

  })

})

let client = new ZooqleClient({
  userName: USERNAME,
  password: PASSWORD,
  userAgent: USER_AGENT,
  proxy: PROXY,
  cache: CACHE,
})

module.exports = getRouter(builder.getInterface())
