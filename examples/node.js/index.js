// Node.js cli example

// Configuration
var config = {
  appKey: '4de5809067b745f99bdc1d78c6885d8be63b85fb79578e81010e3e12bf758b72',
  appSecret: '088d1aed6ba7062e51b4d15838ca906b0c67194339cbb1aed2324de0c625928c',

  apiBaseUrl: 'http://lvh.me/api',

  serverBaseUrl: 'http://localhost:8000',
  serverPort: 8000
};

var express = require('express'),
    app = express(),
    request = require('request'),
    cli = require('cline')(),
    open = require('open');

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

    res.send('ok');
  }
});

// Convert trade orders to string
function tradeOrdersToString(data) {
  output = '';

  data.forEach(function(order) {
    output += '\n' + order.uuid + '\t';
    output += order.direction + '\t';
    output += order.amount.toFixed(8) + ' BTC for ';
    output += order.price.toFixed(2) + ' ' + order.currency;
    output += ' (' + order.traded_btc.toFixed(8) + ' BTC traded)'
    output += '\t' + order.state
  });

  return output;
}

// Register an API command
var token;
function addApiCommand(cmd, path, options, cb) {
  options = options || {};

  cli.command(cmd, cmd.desc, options.args, function (input, args) {
    if(options.restricted && !token) {
      var url = config.serverBaseUrl + '/auth';
      cli.stream.print('opening ' + url + ' in your browser...');
      open(url);
      return;
    }

    delete cli._nextTick;
    cli.stream.print('loading...');

    options.headers = options.headers || {};

    if(options.restricted) {
      options.headers['Authorization'] = 'Bearer ' + token.access_token;
    }

    var pathStr = path;

    if (typeof path === 'function') {
      pathStr = path(input, args);
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
        cli.stream.print('unauthorized, use refresh_tokens to refresh access tokens');
        return cli.interact('> ');
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

// Order command
addApiCommand('show {uuid}', function(input, args) {return '/v1/user/orders/' + args.uuid;}, {
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
  return data.uuid;
});

// Cancel command
addApiCommand('cancel {uuid}', function(input, args) {return '/v1/user/orders/' + args.uuid + '/cancel';}, {
  desc: 'cancel a trade order',
  restricted: true,
  method: 'DELETE',
  args: {
    uuid: '[0-9a-z\-]+'
  }
}, function(data) {
  return 'cancel requested';
});

// Refresh tokens command
cli.command('refresh_tokens', 'refresh access tokens', function () {
  if (!token) {
    cli.stream.print('no tokens yet');
    return cli.interact('> ');
  }

  delete cli._nextTick;
  cli.stream.print('loading...');

  OAuth2.AccessToken.create(token).refresh(function(error, result) {
    if (error) {
      cli.stream.print(error.message);
      return cli.interact('> ');
    }

    token = result.token;

    cli.stream.print('refreshed');
    cli.interact('> ');
  });
});

app.listen(config.serverPort);
cli.interact('> ');

cli.on('close', function () {
    process.exit();
});
