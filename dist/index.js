"use strict";

var _stremioAddonSdk = require("stremio-addon-sdk");

var _package = _interopRequireDefault(require("../package.json"));

var _ZooqleClient = _interopRequireDefault(require("./ZooqleClient"));

var _convertTorrentsToStreams = _interopRequireDefault(require("./convertTorrentsToStreams"));

var _internal = require("internal");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const STATIC_DIR = 'static';
const USER_AGENT = 'stremio-zooqle';
const ID_PROPERTY = 'tt';

function atob(str) {
  return Buffer.from(str, 'base64').toString('binary');
}

const ID = 'stremio_zooqle_plus';
const ENDPOINT = 'https://stremio-zooqle.now.sh';
const PROXY = false;
const CACHE = '1';
const EMAIL = '';
const USERNAME = _internal.config.username || atob('Ym9vYmx5Ym9v');
const PASSWORD = _internal.config.password || atob('Ym9vYmx5Ym9vMTAxIQ==');
const MANIFEST = {
  name: 'Zooqle+',
  id: ID,
  version: _package.default.version,
  description: '\
Watch movies and series indexed by Zooqle from RARBG, KAT, YTS, MegaTorrents and other torrent trackers\
',
  types: ['movie', 'series'],
  idPrefixes: [ID_PROPERTY],
  resources: ['stream'],
  // The docs mention `contactEmail`, but the template uses `email`
  email: EMAIL,
  contactEmail: EMAIL,
  logo: `${ENDPOINT}/logo-white.png`,
  icon: `${ENDPOINT}/logo-white.png`,
  background: `${ENDPOINT}/bg.jpg`,
  catalogs: []
};
const builder = new _stremioAddonSdk.addonBuilder(MANIFEST);

function findStreams(_x) {
  return _findStreams.apply(this, arguments);
}

function _findStreams() {
  _findStreams = _asyncToGenerator(function* (args) {
    let imdbId = args.id;

    if (!imdbId) {
      reject(Error('No IMDB ID in stream request'));
      return;
    }

    let torrents;

    if (args.type === 'movie') {
      torrents = yield client.getMovieTorrents(imdbId);
    } else {
      const season = imdbId.split(':')[1];
      const episode = imdbId.split(':')[2];
      imdbId = imdbId.split(':')[0];
      torrents = yield client.getShowTorrents(imdbId, season, episode);
    }

    return (0, _convertTorrentsToStreams.default)(torrents);
  });
  return _findStreams.apply(this, arguments);
}

builder.defineStreamHandler(args => {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (resolve, reject) {
      findStreams(args).then(streams => {
        if ((streams || []).length) resolve({
          streams,
          cacheMaxAge: 172800
        }); // two days
        else reject({
            streams: [],
            cacheMaxAge: 3600
          }); // one hour
      }).catch(err => {
        /* eslint-disable no-console */
        console.error( // eslint-disable-next-line prefer-template
        new Date().toLocaleString() + ' An error has occurred while processing the following request:');
        console.error(args);
        console.error(err);
        /* eslint-enable no-console */

        reject(err);
      });
    });

    return function (_x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }());
});
let client = new _ZooqleClient.default({
  userName: USERNAME,
  password: PASSWORD,
  userAgent: USER_AGENT,
  proxy: PROXY,
  cache: CACHE
});
module.exports = (0, _stremioAddonSdk.getRouter)(builder.getInterface());
//# sourceMappingURL=index.js.map
