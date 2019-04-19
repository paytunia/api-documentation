# WebSocket API

* [Public socket](#public-socket)
  * [Subscribing](#subscribing)
  * [NodeJS example](#nodejs-example)   
  * [Public Data](#public-data)
    * [publicData.ticker](#publicdataticker)
    * [publicData.trades](#publicdatatrades)
    * [publicData.bids](#publicdatabids)
    * [publicData.asks](#publicdataasks)
* [User socket](#user-socket)
  * [Subscribing](#subscribing-1)
  * [NodeJS example](#nodejs-example-1)   
  * [User Data](#user-data)
    * [userData.balance_eur](#userdatabalance_eur)
    * [userData.locked_eur](#userdatalocked_eur)
    * [userData.balance_btc](#userdatabalance_btc)
    * [userData.locked_btc](#userdatalocked_btc)
    * [userData.orders](#userdataorders)

Websockets are implemented using **socket.io v1.3**.

## Public socket

### Subscribing

You must connect your socket.io client to `paymium.com/public`, setting the path
option to `/ws/socket.io`. When new data is available, a `stream` event is
triggered.

### NodeJS example

```javascript
var io = require('socket.io-client');

var socket = io.connect('paymium.com/public', {
  path: '/ws/socket.io'
});

console.log('CONNECTING');

socket.on('connect', function() {
  console.log('CONNECTED');
  console.log('WAITING FOR DATA...');
});

socket.on('disconnect', function() {
  console.log('DISCONNECTED');
});

socket.on('stream', function(publicData) {
  console.log('GOT DATA:');
  console.log(publicData);
});
```

### Public data

The `stream` event will emit an object when new data is available. The object
will have properties **only for the data that changed**.

#### publicData.ticker

If the ticker changed, `publicData.ticker` will contains the new ticker
information.

Example:

```javascript
{
  ticker: {
    high: 275,
    low: 275,
    volume: 0.10909089,
    bid: 205,
    ask: 275,
    midpoint: 240,
    vwap: 275,
    at: 1446464202,
    price: 275,
    open: 270,
    variation: 1.8519,
    currency: 'EUR',
    trade_id: '460aff60-8fff-4fb0-8be5-2f8dc67758c2',
    size: 0.03636363
  }
}
```

#### publicData.trades

If new trades are executed, `publicData.trades` will be an array containing the
new trades.

Example:

```javascript
{
  trades: [
    {
      price: 275,
      traded_btc: 0.03636363,
      timestamp: 1446464202000,
      currency: 'EUR'
    }
  ]
}
```

#### publicData.bids

If buy orders have changed (created, changed, or deleted), `publicData.bids`
will be an array containing the modified orders. Orders are aggregated by price.
If `amount` is `0`, there are no more orders at this price.

Example:

```javascript
{
  bids: [
    {
      timestamp: 1424208720,
      amount: 17.43992373,
      price: 265,
      currency: 'EUR',
      category: 'buy'
    }
  ]
}
```

#### publicData.asks

If sell orders have changed (created, changed, or deleted), `publicData.asks`
will be an array containing the modified orders. Orders are aggregated by price.
If `amount` is `0`, there are no more orders at this price.

Example:

```javascript
{
  asks: [
    {
      timestamp: 1424208720,
      amount: 17.43992373,
      price: 275,
      currency: 'EUR',
      category: 'sell'
    }
  ]
}
```

## User socket

### Subscribing

You must connect your socket.io client to `https://www.paymium.com/user`, setting the path
option to `/ws/socket.io`.

You must emit a `channel` event with the user channel id. This channel id is
available in the user's json (`/api/v1/user`).

When new data is available, a `stream` event is triggered.

### NodeJS example
```javascript
var io = require('socket.io-client');

var socket = io.connect('https://www.paymium.com/user', {
  path: '/ws/socket.io'
});

console.log('CONNECTING');

socket.on('connect', function() {
  console.log('CONNECTED');
  console.log('WAITING FOR DATA...');
});

// Replace USER_CHANNEL_ID with the channel id of the user
socket.emit('channel', 'USER_CHANNEL_ID');

socket.on('disconnect', function() {
  console.log('DISCONNECTED');
});

socket.on('stream', function(userData) {
  console.log('GOT DATA:');
  console.log(userData);
});
```

### User data

The `stream` event will emit an object when new data is available. The object
will have properties **only for the data that changed**.

#### userData.balance_eur

If the available EUR balance changed, `userData.balance_eur` will contain the
new balance.

```javascript
{
  balance_eur: 410.04
}
```

#### userData.locked_eur

If the locked EUR balance changed, `userData.locked_eur` will contain the
new balance.

```javascript
{
  locked_eur: 20.24
}
```

#### userData.balance_btc

If the available BTC balance changed, `userData.balance_btc` will contain the
new balance.

```javascript
{
  balance_btc: 53.29811458
}
```

#### userData.locked_btc

If the locked BTC balance changed, `userData.locked_btc` will contain the
new balance.

```javascript
{
  locked_btc: 0
}
```

#### userData.orders

If user orders have changed (created, filled, cancelled, etc...),
`userData.orders` will be an array containing the modified orders. You can check
the state of the orders to handle them properly.

Example:

```javascript
{
  orders: [
    {
      uuid: '89d4b612-5e6a-4154-94f3-120d03f4e891',
      amount: null,
      currency_amount: 10,
      state: 'pending_execution',
      btc_fee: 0,
      currency_fee: 0,
      updated_at: '2015-11-02T11:36:41.000Z',
      created_at: '2015-11-02T11:36:41.000Z',
      currency: 'EUR',
      comment: null,
      type: 'MarketOrder',
      traded_btc: 0,
      traded_currency: 0,
      direction: 'buy',
      price: null,
      account_operations: []
    }
  ]
}
```
