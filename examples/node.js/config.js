var path = require('path');

module.exports = {
  appKey: '4de5809067b745f99bdc1d78c6885d8be63b85fb79578e81010e3e12bf758b72',
  appSecret: '088d1aed6ba7062e51b4d15838ca906b0c67194339cbb1aed2324de0c625928c',

  apiBaseUrl: 'http://lvh.me/api',

  serverBaseUrl: 'http://localhost:8000',
  serverPort: 8000,

  tokenFile: path.resolve(__dirname, 'tokens')
};
