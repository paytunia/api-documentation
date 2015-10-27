#! /usr/bin/env node

// Node.js cli example

var config = require('./config'),
    express = require('express'),
    app = express(),
    request = require('request'),
    cli = require('cline')(),
    fs = require('fs'),
    open = require('open'),
    easycrypto = require('easycrypto').getInstance(),
    babar = require('babar');

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
  scope: config.scopes
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

  function saveToken(error, tokens) {
    if (error) {
      console.error(error.message);
      return res.send(error.message);
    }

    res.send('You may close this window.');

    cli.password('choose a password: ', '*', function(pwd) {
      var data = easycrypto.encrypt(JSON.stringify(tokens), pwd);
      fs.writeFileSync(config.tokenFile, data, {encoding: 'utf8'});

      access_token = tokens.access_token;
      expires = new Date(new Date().getTime() + 1000 * tokens.expires_in);

      if(afterAuth) afterAuth();
      afterAuth = null;
    });
  }
});

// Refresh tokens
function refreshTokens(cb) {
  function doIt() {
    cli.password('enter password: ', '*', function(pwd) {
      try {
        var tokens = JSON.parse(easycrypto.decrypt(fs.readFileSync(config.tokenFile, {
          encoding: 'utf8'
        }), pwd));
      }
      catch(e) {
        return doIt();
      }

      OAuth2.AccessToken.create(tokens).refresh(function(error, result) {
        if (!error) {
          var tokens = result.token;
          var data = easycrypto.encrypt(JSON.stringify(tokens), pwd);
          fs.writeFileSync(config.tokenFile, data, {encoding: 'utf8'});
          access_token = tokens.access_token;
          expires = new Date(new Date().getTime() + 1000 * tokens.expires_in)
        }

        if(cb) cb(error);
      });
    });
  }

  doIt();
};

// Convert trade orders to string
function tradeOrdersToString(data) {
  output = '';

  data.forEach(function(order) {
    knownUuids[order.uuid] = true;
    output += order.uuid + '\t';
    output += order.direction + '\t';
    output += order.amount.toFixed(8) + ' BTC for ';
    output += order.price.toFixed(2) + ' ' + order.currency;
    output += ' (' + order.traded_btc.toFixed(8) + ' BTC traded)'
    output += '\t' + order.state + '\n'
  });

  return output;
}

// Try to match incomplete uuid to know ones
function matchUuid(uuid) {
  if(uuid.length === 36) {
    return [uuid];
  }

  var matches = [];

  for (key in knownUuids) {
    if(key.indexOf(uuid) === 0) {
      matches.push(key);
    }
  }

  return matches;
}

// Register an API command
var access_token;
var expires;

function addApiCommand(cmd, path, options, cb) {
  options = options || {};

  cli.command(cmd, cmd.desc, options.args, function (input, args) {
    if(options.restricted && !access_token) {
      delete cli._nextTick;

      if (fs.existsSync(config.tokenFile)) {
        return refreshTokens(doRequest);
      }
      else {
        var url = config.serverBaseUrl + '/auth';
        cli.stream.print('opening ' + url + ' in your browser...');
        afterAuth = doRequest;
        return open(url);
      }
    }

    var state;

    function doRequest() {
      delete cli._nextTick;

      if (options.confirm) {
        delete cli._nextTick;
        cli.confirm(options.confirm(input, args) + ' (y/n) ', function(ok) {
          if (ok) {
            runRequest();
          }
          else {
            cli.interact('> ');
          }
        });
      }
      else {
        runRequest();
      }

      function runRequest() {
        options.headers = options.headers || {};

        if(options.restricted) {
          options.headers['Authorization'] = 'Bearer ' + access_token;
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

        request(config.apiBaseUrl + pathStr, options, function(error, resp, body) {
          if (error) {
            cli.stream.print(error.message);
            return cli.interact('> ');
          }

          if (resp.statusCode === 401) {
            if (access_token && !state) {
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
              open(url);
            }
            else {
              cli.stream.print('unauthorized');
              cli.interact('> ');
            }

            return;
          }

          if (resp.statusCode === 422) {
            cli.stream.print(JSON.parse(body).errors);
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

// Depth command
addApiCommand('depth', '/v1/data/eur/depth', {
  desc: 'show market depth',
}, function(data) {
  var bids = data.bids.slice(0).sort(function(a, b) {return b.price - a.price;});
  var asks = data.asks.slice(0).sort(function(a, b) {return a.price - b.price;});

  var mid = .5 * (bids[0].price + asks[0].price);
  var min = Math.floor(mid * .2);
  var max = Math.ceil(mid * 1.8);

  bids = bids.filter(function(i) {return i.price >= min;});
  asks = asks.filter(function(i) {return i.price <= max;});

  var points = [];



  for (var i = 0, c = 0; i < bids.length; i++) {
    var p = bids[i];
    c += p.amount;
    points.unshift([p.price, c]);
  };

  for (var i = 0, c = 0; i < asks.length; i++) {
    var p = asks[i];
    c += p.amount;
    points.push([p.price, c]);
  };

  return babar(points, {
    width: process.stdout.columns,
    height: process.stdout.rows - 1
  });
});

// Balances command
addApiCommand('balances', '/v1/user', {
  desc: 'show account balances',
  restricted: true
}, function(data) {
  var output = '';

  output += 'Currency\tAccount\t\tBalance\n';
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
  confirm: function(input, args) {
    return "buy " + args.amount + " BTC for " + args.price + " EUR each?";
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
  confirm: function(input, args) {
    return "sell " + args.amount + " BTC for " + args.price + " EUR each?";
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

// Withdraw EUR command
addApiCommand('withdraw_eur {amount}', '/v1/user/orders', {
  desc: 'withdraw eur',
  restricted: true,
  method: 'POST',
  args: {
    amount: '[0-9\.]+'
  },
  confirm: function(input, args) {
    return "withdraw " + args.amount + " EUR?";
  },
  payload: function(input, args) {
    return {
      'type': 'Transfer',
      currency: 'EUR',
      amount: args.amount
    }
  }
}, function(data) {
  knownUuids[data.uuid] = true;
  return data.uuid;
});

// Withdraw BTC command
addApiCommand('withdraw_btc {amount} {address}', '/v1/user/orders', {
  desc: 'withdraw eur',
  restricted: true,
  method: 'POST',
  args: {
    amount: '[0-9\.]+',
    address: '[13][1-9A-HJ-NP-Za-km-z]{26,33}'
  },
  confirm: function(input, args) {
    return "withdraw " + args.amount + " BTC to " + args.address + " ?";
  },
  payload: function(input, args) {
    return {
      'type': 'Transfer',
      currency: 'BTC',
      amount: args.amount,
      address: args.address
    }
  }
}, function(data) {
  knownUuids[data.uuid] = true;
  return data.uuid;
});

// TTL command
cli.command('ttl', 'show access token time to live', function () {
  if (access_token) {
    var time =  expires.getTime() - new Date().getTime();
    cli.stream.print(Math.ceil(time / 1000 / 60) + ' min');
  }
  else {
    cli.stream.print('no access token');
  }
});

console.log('Welcome to Bitcoin-Central JS. Type `help` for help.');

app.listen(config.serverPort);
cli.interact('> ');

cli.on('close', function () {
  process.exit();
});
