// Node.js cli example

var express = require('express'),
    app = express(),
    request = require('request'),
    cli = require('cline')();

// App configuration
var OAuth2 = require('simple-oauth2')({
  clientID: '4de5809067b745f99bdc1d78c6885d8be63b85fb79578e81010e3e12bf758b72',
  clientSecret: '088d1aed6ba7062e51b4d15838ca906b0c67194339cbb1aed2324de0c625928c',
  site: 'http://lvh.me/api',
  tokenPath: '/oauth/token'
});

// Authorization uri definition
var authorization_uri = OAuth2.AuthCode.authorizeURL({
  redirect_uri: 'http://localhost:8000/callback',
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
    redirect_uri: 'http://localhost:8000/callback'
  }, saveToken);

  function saveToken(error, token) {
    if (error) {
      console.error(error.message);
      return res.send(error.message);
    }

    start(token);

    res.send('ok');
  }
});

app.get('/activity', function (req, res) {
  if(!req.session.token) return res.status(401).send({error: 'unauthorized'});

  request('http://lvh.me/api/v1/user/orders', {
    headers: {'Authorization': 'Bearer ' + req.session.token.access_token}
  }, function(error, resp, body) {
    if (error) return res.status(503).send({error: error.message});
    res.send(body);
  });
});

app.get('/', function (req, res) {
  res.send('Bitcoin-Central API example');
});

function start(token) {
  var headers = {
    'Authorization': 'Bearer ' + token.access_token
  };

  cli.command('ticker', 'show ticker', function () {
    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/data/eur/ticker', function(error, resp, body) {
      if (error) return console.error(error.message);

      var data = JSON.parse(body);
      var output = showObject(data);

      cli.stream.print(output);
      cli.interact('> ');
    });
  });

  cli.command('balances', 'show account balances', function () {
    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user', {
      headers: headers
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      var data = JSON.parse(body);
      var output = '';

      output += '\nCurrency\tAccount\t\tBalance\n';
      output += 'BTC\t\tavailable\t' + data.balance_btc + '\n';
      output += 'BTC\t\ttrading\t\t' + data.locked_btc + '\n';
      output += 'EUR\t\tavailable\t' + data.balance_eur + '\n';
      output += 'EUR\t\ttrading\t\t' + data.locked_eur;

      cli.stream.print(output);
      cli.interact('> ');
    });
  });

  cli.command('active', 'show active trade orders', function () {
    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user/orders', {
      headers: headers,
      qs: {
        'types[]': 'LimitOrder',
        active: true
      }
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      var data = JSON.parse(body);
      var output = '';

      data.forEach(function(order) {
        output += '\n' + order.uuid + '\t';
        output += order.direction + '\t';
        output += order.amount.toFixed(8) + ' BTC for ';
        output += order.price.toFixed(2) + ' ' + order.currency;
        output += ' (' + order.traded_btc.toFixed(8) + ' BTC traded)'
        output += '\t' + order.state
      });

      cli.stream.print(output);
      cli.interact('> ');
    });
  });

  cli.command('orders', 'show all trade orders', function () {
    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user/orders', {
      headers: headers,
      qs: {
        'types[]': 'LimitOrder'
      }
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      var data = JSON.parse(body);
      var output = '';

      data.forEach(function(order) {
        output += '\n' + order.uuid + '\t';
        output += order.direction + '\t';
        output += order.amount.toFixed(8) + ' BTC for ';
        output += order.price.toFixed(2) + ' ' + order.currency;
        output += ' (' + order.traded_btc.toFixed(8) + ' BTC traded)'
        output += '\t' + order.state
      });

      cli.stream.print(output);
      cli.interact('> ');
    });
  });

  cli.command('show {uuid}', 'show order by uuid', {uuid: '[0-9a-z\-]+'}, function (input, args) {
    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user/orders/' + args.uuid, {
      headers: headers
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      var data = JSON.parse(body);
      var output = showObject(data);

      cli.stream.print(output);
      cli.interact('> ');
    });
  });

  cli.command('buy {amount} {price}', 'place a buy order', {amount: '[0-9\.]+', price: '[0-9\.]+'}, function (input, args) {
    amount = parseFloat(args.amount);
    price = parseFloat(args.price);
    console.log('Buy ' + amount + ' BTC for ' + price + ' EUR each?')

    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user/orders', {
      headers: headers,
      method: 'POST',
      form: {
        'type': 'LimitOrder',
        currency: 'EUR',
        direction: 'buy',
        amount: amount,
        price: price
      }
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      var data = JSON.parse(body);
      cli.stream.print(data.uuid);
      cli.interact('> ');
    });
  });

  cli.command('sell {amount} {price}', 'place a sell order', {amount: '[0-9\.]+', price: '[0-9\.]+'}, function (input, args) {
    amount = parseFloat(args.amount);
    price = parseFloat(args.price);
    console.log('Sell ' + amount + ' BTC for ' + price + ' EUR each?')

    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user/orders', {
      headers: headers,
      method: 'POST',
      form: {
        'type': 'LimitOrder',
        currency: 'EUR',
        direction: 'sell',
        amount: amount,
        price: price
      }
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      var data = JSON.parse(body);
      cli.stream.print(data.uuid);
      cli.interact('> ');
    });
  });

  cli.command('cancel {uuid}', 'cancel order by uuid', {uuid: '[0-9a-z\-]+'}, function (input, args) {
    delete cli._nextTick;
    cli.stream.print('loading...');

    request('http://lvh.me/api/v1/user/orders/' + args.uuid + '/cancel', {
      headers: headers,
      method: 'DELETE'
    }, function(error, resp, body) {
      if (error) return console.error(error.message);

      if (resp.statusCode === 401) {
        cli.stream.print('Unauthorized. You might need to refresh tokens.');
        return cli.interact('> ');
      }

      cli.stream.print('Order cancelling.');
      cli.interact('> ');
    });
  });

  cli.command('refresh_tokens', 'refresh access tokens', function () {
    delete cli._nextTick;
    cli.stream.print('loading...');

    OAuth2.AccessToken.create(token).refresh(function(error, result) {
      if (error) return console.error(error.message);

      token = result.token;
      headers = {
        'Authorization': 'Bearer ' + token.access_token
      };

      cli.stream.print('Ok.');
      cli.interact('> ');
    });
  });

  cli.interact('> ');

  cli.on('close', function () {
      process.exit();
  });
}

function showObject(data) {
  output = '';

  for(key in data) {
    switch(key) {
      case 'created_at':
      output += '\n' + key + ': ' + new Date(data[key]);
      case 'updated_at':
      output += '\n' + key + ': ' + new Date(data[key]);
      case 'account_operations':
      break;
      default:
      output += '\n' + key + ': ' + data[key];
    }
  }

  return output;
}

app.listen(8000);
console.log('Open http://localhost:8000/auth in your browser to authorize the application.')
