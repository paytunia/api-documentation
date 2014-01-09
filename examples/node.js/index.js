#! /usr/bin/env node

// Node.js cli example

var config = require('./config'),
    express = require('express'),
    app = express(),
    request = require('request'),
    cli = require('cline')(),
    fs = require('fs'),
    open = require('open');

// Known order uuids
var knownUuids = {};

// OAuth2 configuration
var OAuth2 = require('simple-oauth2')({
  clientID: config.appKey,
  clientSecret: config.appSecret,
  site: config.apiBaseUrl,
  tokenPath: '/oauth/token'
});

// Authorization uri definition
var authorization_uri = OAuth2.AuthCode.authorizeURL({
  redirect_uri: config.serverBaseUrl + '/callback',
  scope: 'basic activity trade'
});

// Authorization page redirecting to Bitcoin-Central
app.get('/auth', function (req, res) {
    res.redirect(authorization_uri);
});

// Callback service parsing the authorization token and asking for the access token
var afterAuth;
app.get('/callback', function (req, res) {
  var code = req.query.code;

  OAuth2.AuthCode.getToken({
    code: code,
    redirect_uri: config.serverBaseUrl + '/callback'
  }, saveToken);

  function saveToken(error, resp) {
    if (error) {
      console.error(error.message);
      return res.send(error.message);
    }

    token = resp;

    if (config.tokenFile) {
      fs.writeFileSync(config.tokenFile, JSON.stringify(token));
    }

    res.send('You may close this window.');

    if(afterAuth) afterAuth();

    afterAuth = null;
  }
});

// Refresh tokens
function refreshTokens(cb) {
  OAuth2.AccessToken.create(token).refresh(function(error, result) {
    if (!error) {
      token = result.token;

      if (config.tokenFile) {
        fs.writeFileSync(config.tokenFile, JSON.stringify(token));
      }
    }

    cb(error);
  });
};

// Convert trade orders to string
function tradeOrdersToString(data) {
  output = '';

  data.forEach(function(order) {
    knownUuids[order.uuid] = true;
    output += '\n' + order.uuid + '\t';
    output += order.direction + '\t';
    output += order.amount.toFixed(8) + ' BTC for ';
    output += order.price.toFixed(2) + ' ' + order.currency;
    output += ' (' + order.traded_btc.toFixed(8) + ' BTC traded)'
    output += '\t' + order.state
  });

  return output;
}

// Try to match incomplete uuid to know ones
function matchUuid(uuid) {
  if(uuid.length === 36) {
    return [uuid];
  }

  matches = [];

  for (key in knownUuids) {
    if(key.indexOf(uuid) === 0) {
      matches.push(key);
    }
  }

  return matches;
}

// Register an API command
var token;
function addApiCommand(cmd, path, options, cb) {
  options = options || {};

  cli.command(cmd, cmd.desc, options.args, function (input, args) {
    if(options.restricted && !token) {
      delete cli._nextTick;
      var url = config.serverBaseUrl + '/auth';
      cli.stream.print('opening ' + url + ' in your browser...');
      afterAuth = doRequest;
      return open(url);
    }

    var state;

    function doRequest() {
      delete cli._nextTick;

      options.headers = options.headers || {};

      if(options.restricted) {
        options.headers['Authorization'] = 'Bearer ' + token.access_token;
      }

      var pathStr = path;

      if (typeof path === 'function') {
        pathStr = path(input, args);

        if (!pathStr) {
          return cli.interact('> '); 
        }
      }

      if (typeof options.payload === 'function') {
        options.form = options.payload(input, args);
      }

      cli.stream.print('loading...');

      request(config.apiBaseUrl + pathStr, options, function(error, resp, body) {
        if (error) {
          cli.stream.print(error.message);
          return cli.interact('> ');
        }

        if (resp.statusCode === 401) {
          if (token && !state) {
            refreshTokens(function(error) {
              state = 'refreshed';
              doRequest();
            });
          }
          else if (state == 'refreshed') {
            state = 'authorizing';
            var url = config.serverBaseUrl + '/auth';
            cli.stream.print('opening ' + url + ' in your browser...');
            afterAuth = doRequest;
            return open(url);
          }
          else {
            cli.stream.print('unauthorized');
            return cli.interact('> ');
          }
        }

        if (resp.statusCode === 422) {
          cli.stream.print('unprocessable entity');
          return cli.interact('> ');
        } 

        var data = {};

        try {
          var data = JSON.parse(body);
        } catch(e) {}

        cli.stream.print(cb(data));
        cli.interact('> ');
      });
    }

    doRequest();
  });
}

// Ticker command
addApiCommand('ticker', '/v1/data/eur/ticker', {
  desc: 'show ticker'
}, function(data) {
  return JSON.stringify(data, true, '\t');
});

// Balances command
addApiCommand('balances', '/v1/user', {
  desc: 'show account balances',
  restricted: true
}, function(data) {
  var output = '';

  output += '\nCurrency\tAccount\t\tBalance\n';
  output += 'BTC\t\tavailable\t' + data.balance_btc + '\n';
  output += 'BTC\t\ttrading\t\t' + data.locked_btc + '\n';
  output += 'EUR\t\tavailable\t' + data.balance_eur + '\n';
  output += 'EUR\t\ttrading\t\t' + data.locked_eur;

  return output;
});

// Active command
addApiCommand('active', '/v1/user/orders', {
  desc: 'show active trade orders',
  restricted: true,
  qs: {
    'types[]': 'LimitOrder',
    active: true
  }
}, function(data) {
  return tradeOrdersToString(data);
});

// Orders command
addApiCommand('orders', '/v1/user/orders', {
  desc: 'show all tade orders',
  restricted: true,
  qs: {
    'types[]': 'LimitOrder'
  }
}, function(data) {
  return tradeOrdersToString(data);
});

// Show command
addApiCommand('show {uuid}', function(input, args) {
  var uuids = matchUuid(args.uuid);

  if(uuids.length === 0) {
    cli.stream.print('no matching uuid');
  }
  else if(uuids.length === 1) {
    return '/v1/user/orders/' + uuids[0];
  }
  else {
    cli.stream.print('multiple matching uuids: ' + uuids);
  }
}, {
  desc: 'show all orders',
  restricted: true,
  args: {
    uuid: '[0-9a-z\-]+'
  }
}, function(data) {
  return JSON.stringify(data, true, '\t');
});

// Buy command
addApiCommand('buy {amount} {price}', '/v1/user/orders', {
  desc: 'place a buy order',
  restricted: true,
  method: 'POST',
  args: {
    amount: '[0-9\.]+',
    price: '[0-9\.]+'
  },
  payload: function(input, args) {
    return {
      'type': 'LimitOrder',
      currency: 'EUR',
      direction: 'buy',
      amount: args.amount,
      price: args.price
    }
  }
}, function(data) {
  knownUuids[data.uuid] = true;
  return data.uuid;
});

// Sell command
addApiCommand('sell {amount} {price}', '/v1/user/orders', {
  desc: 'place a sell order',
  restricted: true,
  method: 'POST',
  args: {
    amount: '[0-9\.]+',
    price: '[0-9\.]+'
  },
  payload: function(input, args) {
    return {
      'type': 'LimitOrder',
      currency: 'EUR',
      direction: 'sell',
      amount: args.amount,
      price: args.price
    }
  }
}, function(data) {
  knownUuids[data.uuid] = true;
  return data.uuid;
});

// Cancel command
addApiCommand('cancel {uuid}', function(input, args) {
  var uuids = matchUuid(args.uuid);

  if(uuids.length === 0) {
    cli.stream.print('no matching uuid');
  }
  else if(uuids.length === 1) {
    return '/v1/user/orders/' + uuids[0] + '/cancel';
  }
  else {
    cli.stream.print('multiple matching uuids: ' + uuids);
  }
}, {
  desc: 'cancel a trade order',
  restricted: true,
  method: 'DELETE',
  args: {
    uuid: '[0-9a-z\-]+'
  }
}, function(data) {
  return 'cancel requested';
});

if (config.tokenFile && fs.existsSync(config.tokenFile)) { 
  token = JSON.parse(fs.readFileSync(config.tokenFile));
}

console.log('Welcome to Bitcoin-Central JS. Type `help` for help.');

app.listen(config.serverPort);
cli.interact('> ');

cli.on('close', function () {
    process.exit();
});
