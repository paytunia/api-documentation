var path = require('path');

module.exports = {
  appKey: '33be5e031fbe0f72827609503a2f7d100d62d7e6f31375bb7ba54a9abc2475c0',
  appSecret: 'd0c9527d343c43de642d57acb5303b6b5e036a329341b799431dd7cb7f740e50',

  scopes: 'basic activity trade withdraw',

  apiBaseUrl: 'https://paymium.com/api',

  serverBaseUrl: 'http://localhost:8000',
  serverPort: 8000,

  tokenFile: path.resolve(__dirname, 'tokens')
};
