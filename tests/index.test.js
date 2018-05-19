/* eslint-disable no-console */

import { get } from 'http'
import { Client as AddonClient } from 'stremio-addons'


jest.mock('../src/ZooqleClient')

// Prevent the addon from printing
// eslint-disable-next-line no-unused-vars
let log = console.log
console.log = () => {}
console.error = () => {}

function reset() {
  jest.resetModules()

  delete process.env.STREMIO_ZOOQLE_ID
  delete process.env.STREMIO_ZOOQLE_ENDPOINT
  delete process.env.STREMIO_ZOOQLE_PORT
  delete process.env.STREMIO_ZOOQLE_PROXY
  delete process.env.STREMIO_ZOOQLE_CACHE
  delete process.env.STREMIO_ZOOQLE_EMAIL
  delete process.env.NODE_ENV

  process.env.STREMIO_ZOOQLE_USERNAME = 'foo'
  process.env.STREMIO_ZOOQLE_PASSWORD = 'bar'
}

function initAddon() {
  return {
    start() {
      // eslint-disable-next-line global-require
      this.server = require('../src/index').default

      // In case an error occurs before the server starts (e.g. port is in use),
      // it silently fails and the tests stall
      return new Promise((resolve, reject) => {
        this.server.once('listening', () => resolve(this))
        this.server.once('error', (err) => {
          reject(err)
          this.stop()
        })
      })
    },

    stop() {
      if (!this.server) {
        return Promise.resolve(this)
      }

      let stopPromise = new Promise((resolve) => {
        this.server.once('close', () => resolve(this))
      })
      this.server.close()
      return stopPromise
    },
  }
}

describe('Addon', () => {
  let addonClient
  let addon

  beforeAll(() => {
    addonClient = new AddonClient()
    addonClient.add('http://localhost')
  })

  beforeEach(() => {
    reset()
    addon = initAddon()
  })

  afterEach(() => {
    return addon.stop()
  })

  test('When a port is not specified, starts a web server on port 80', async () => {
    await addon.start()
    expect(addon.server.address().port).toBe(80)
  })

  test('When a port is specified, starts a web server on it', async () => {
    process.env.STREMIO_ZOOQLE_PORT = '9028'
    await addon.start()
    expect(addon.server.address().port).toBe(9028)
  })

  test('stream.find is implemented', async (done) => {
    await addon.start()

    addonClient.stream.find({}, (err) => {
      err ? done.fail(err) : done()
    })
  })

  test('The main page is accessible', async () => {
    await addon.start()
    let res = await new Promise((resolve) => {
      get('http://localhost', resolve)
    })
    expect(res.statusCode).toBe(200)
  })

  test('The static files are accessible', async () => {
    await addon.start()
    let staticFiles = [
      'logo.png',
      'logo-white.png',
      'screenshot_movie.jpg',
      'bg.jpg',
    ]
    let promises = staticFiles.map((file) => {
      return new Promise((resolve) => {
        get(`http://localhost/${file}`, resolve)
      })
    })
    let responses = await Promise.all(promises)

    responses.forEach((res) => {
      // Requests to non-existent files return the landing page,
      // so we check that the response is not HTML
      let contentType = res.headers['content-type'].split(';')[0]
      expect(contentType).not.toBe('text/html')
      expect(res.statusCode).toBe(200)
    })
  })
})
