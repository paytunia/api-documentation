var path = require('path');

module.exports = {
  appKey: 'YOUR_APP_KEY',
  appSecret: 'YOUR_APP_CODE',

  scopes: 'basic activity trade withdraw',

  apiBaseUrl: 'https://bitcoin-central.net/api',

  serverBaseUrl: 'http://localhost:8000',
  serverPort: 8000,

  tokenFile: path.resolve(__dirname, 'tokens')
};
