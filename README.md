![Paymium logo](https://raw.githubusercontent.com/Paymium/api-documentation/master/logo.png)


**NEW: Our sandbox environment is now available, visit [sandbox.paymium.com](https://sandbox.paymium.com) (you may have to add a security exception for the SSL certificate to validate).**

The Paymium API allows developers to extend the capabilities of the Paymium platform, from reading the latest ticker to automating trades with bots.

**IMPORTANT NOTE**: Your API client must support [SNI](http://en.wikipedia.org/wiki/Server_Name_Indication) in order to not receive certificate name mismatch warnings.

Is is possible to, among other things:

* Access public data (ticker, asks, bids, trades, etc...)
* Authenticate users with their permission using OAuth2 *
* Access authenticated user balances, trades, and other data *
* Automate trading *

_* Authenticating users is only available to developers that have a fully verified and approved Paymium account. On the other hand, public data is available to everyone_

## Table of contents

* [**General information**](#general-information)
  * [Formats and required HTTP request headers](#formats-and-required-http-request-headers)
  * [Localization](#localization)
  * [Error handling](#error-handling)
  * [Successful calls](#sucessful-calls)
  * [Rate-limiting](#rate-limiting)

* [**Authentication**](#authentication)
  * [Permissions](#permissions)
  * [OAuth2 authentication](#oauth2-authentication)
  * [Token authentication](#token-authentication)

* [**Public data**](#public-data)
  * [Ticker](#ticker)
  * [Latest trades](#latest-trades)
  * [Market depth](#market-depth)
  * [Bitcoin-Charts endpoints](#bitcoin-charts-endpoints)
  * [WebSocket](#websocket)
  * [FIX streaming API](#fix-streaming-api)

* [**User data**](#user-data)
  * [User info](#user-info)
  * [User activity](#user-activity)
  * [Order details](#order-details)
  * [Trading](#trading)
  * [Withdrawing](#withdrawing)
  * [Sending money](#sending-money)
  * [Requesting money by e-mail](#requesting-money-by-e-mail)
  * [Canceling orders](#canceling-orders)
  * [Bitcoin addresses](#bitcoin-addresses)

* [**Merchant API**](#merchant-api)
  * [Payment creation](#payment-creation)
  * [Payment callbacks](#payment-callbacks)
  * [Get payment information](#get-payment-information)
  * [E-commerce frameworks plugins](#e-commerce-frameworks-plugins)

* [**Appendix**](#appendix)
  * [Currencies](#currencies)
  * [Order types](#order-types)
  * [Order properties](#order-properties)
  * [Order states](#order-states)
  * [Payment states](#payment-states)
  * [Account operation properties](#account-operation-properties)
  * [Ruby example](#ruby-example)

## General information

### Formats and required HTTP request headers

The API will only answer with JSON or empty responses. It expects parameters to be passed in JSON with the correct `Content-Type: application/json` being set.

## Localization

The relevant results and error messages will be localized to the language associated to the user, currently English and French are supported.

## Datetime formats

Datetime values will be returned as regular JSON format and Unix timestamps, the timestamps are suffixed with `_int`.

## Error handling

Whenever an error is encountered, the answer to a JSON API call will have:

 * An HTTP 422 status (Unprocessable entity) or HTTP 400 (Bad request)
 * A JSON array of localized error messages in the `errors` attribute of the response body

##### Example:

```json
{
  "errors": [
    "Operations account operations amount is greater than your available balance (1781.96 EUR)"
    "Amount can't be greater than your limit (1781.96 EUR)"
  ]
}
```

## Successful calls

If the API call was successful, the platform will answer with:

 * An HTTP 200 status (OK) or HTTP 201 (Created),
 * A JSON representation of the entity being created or updated if relevant

### Rate-limiting

API calls are rate-limited by IP to 86400 calls per day (one per second on average). Information about the status of the limit can be found in the `X-RateLimit-Limit` and `X-RateLimit-Remaining` HTTP headers.

**Example response with rate-limit headers**

    HTTP/1.1 200  
    Content-Type: application/json; charset=utf-8
    X-Ratelimit-Limit: 5000
    X-Ratelimit-Remaining: 4982
    Date: Wed, 30 Jan 2013 12:08:58 GMT

## Authentication

### Permissions

Before you request authorization to access a user's account, you must decide which permissions, or scopes you would like to access.

The following scopes are available:

| name           | description                                                                               |
|----------------|-------------------------------------------------------------------------------------------|
| basic          | Read account number, language, and balances (default)                                     |
| activity       | Read trade orders, deposits, withdrawals, and other operations                            |
| trade          | Create and cancel trade orders                                                            |
| withdraw       | Request EUR and BTC withdrawals (requires email confirmation from users upon withdrawing) |
| deposit        | List bitcoin deposit addresses and create a new one if needed                             |
| merchant       | Create and manage an account's invoices                                                   |

### Token authentication

This authentication mechanism is the recommended method if you need to access your own account data and is also referred to as **HMAC authentication**, if you need to access other users accounts on their behalf you'll need to use the OAuth2 authentication method.

##### Generating a token

For this authentication method you need to generate a token/secret pair that you will use to make requests against our API. In order to do so visit the "API tokens" menu in your account profile and click on "Create token". You will be presented with the following screen that will enable you to select the desired access permissions for this token. For security reasons you will need to confirm your access credentials.

![Create an API token](https://raw.githubusercontent.com/Paymium/api-documentation/master/create-api-token.png)

Once your token is created you'll be presented **once** with the matching secret key, this secret key is only displayed once, you need to record it carefully. If the secret key is lost the token becomes useless.

##### Making requests

Once you have an API token and its matching secret key you can use them to make requests against our API. In order to do so you must include three HTTP headers that will authenticate your request.

```bash
$ curl "https://paymium.com/api/v1/user"               \
     --header "Api-Key: <YOUR API TOKEN>"              \
     --header "Api-Signature: <THE REQUEST SIGNATURE>" \
     --header "Api-Nonce: <AN UPDATED NONCE>"          \
```

 * The **API key** is the token that is displayed when listing your currently active tokens,
 * The **API signature** is a HMAC-SHA256 hash of the nonce concatenated with the full URL and body of the HTTP request, encoded using your API secret key,
 * The **nonce** is a positive integer number that must increase with every request you make

### OAuth2 authentication

This authentication mechanism is best suited to cases where a developer publishes an app that requires access its users Paymium accounts.

Many programming languages already have libraries to develop clients that connect to OAuth2 APIs, hence the following steps may not be necessary. For instance, if you are a Ruby developer, you can use [this example to get started](#ruby-example).

The process can be summarized as follows:

1. Send the user to your application's authorization URL
2. Receive the authorization code if the user accepted the request
3. Get an access token and a refresh token from the authorization code
4. Refresh the access token when needed

##### Requesting user authorization

To get user's permission to use his/her account, you must send him/her to your application's redirect URI. You can see this URI by visiting your application's page: [https://paymium.com/page/developers/apps](https://paymium.com/page/developers/apps).

By default, the `basic` scope will be requested.

If your application requires specific access scopes, you must append a scope GET parameter to the authorization URI:

    https://paymium.com/...&scope=basic+activity+trade

The user will then be prompted to authorize your application with the specified scopes.

##### Receiving the authorization code

If you specified the test redirection URI `https://paymium.com/page/oauth/test`, the user will be presented the autorization code upon accepting your request which can be used by the application to fetch access tokens.

Otherwise the code or error will be sent to the redirection URI so that your application can retrieve it (in this case `https://example.com/callback`):

    https://example.com/callback?code=AUTHORIZATION_CODE

Or if the request was denied by the user:

    https://example.com/callback?error=access_denied&error_description=The+resource+owner+or+authorization+server+denied+the+request.

The authorization code is valid 5 minutes.

##### Fetching an access token and a refresh token

Once your application received the authorization code, it can request an access token and a refresh token:

```bash
$ curl "https://paymium.com/api/oauth/token"                    \
    -d "client_id=APPLICATION_KEY"                              \
    -d "client_secret=APPLICATION_SECRET"                       \
    -d "grant_type=authorization_code"                          \
    -d "redirect_uri=REDIRECT_URI"                              \
    -d "code=AUTHORIZATION_CODE"
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_token": "REFRESH_TOKEN",
  "scope": "basic"
}
```

An access token can be used to authorize user requests for the approved scopes and is valid 30 minutes.

##### Refreshing the access token

Since an access token is only valid 30 minutes, your application may need to fetch a new access token using the refresh token:

```bash
$ curl "https://paymium.com/api/oauth/token"                    \
    -d "client_id=APPLICATION_KEY"                              \
    -d "client_secret=APPLICATION_SECRET"                       \
    -d "grant_type=refresh_token"                               \
    -d "redirect_uri=REDIRECT_URI"                              \
    -d "refresh_token=REFRESH_TOKEN"
```

```json
{
  "access_token": "NEW_ACCESS_TOKEN",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_token": "NEW_REFRESH_TOKEN",
  "scope": "basic"
}
```

After refreshing the access token, the previous tokens (access and refresh) are no longer valid.

## Public data

Public data (ticker, asks, bids, trades) can be accessed without registering an application.

### Ticker

##### Description

Read the latest ticker data.

##### Endpoint

| method | path                    | authorization |
|--------|-------------------------|---------------|
| GET    | /api/v1/data/eur/ticker | not required  |

##### Example

```bash
$ curl "https://paymium.com/api/v1/data/eur/ticker"
```

```json
{
  "high": 720.0,
  "low": 640.0001,
  "volume": 198.16844745,
  "bid": 676.01,
  "ask": 679.9999999,
  "midpoint": 678.00499995,
  "at": 1389092410,
  "price": 680.0,
  "vwap": 679.87459,
  "variation": -5.5556,
  "currency": "EUR"
}
```

##### Properties

| name         | description                                  | example value             |
|--------------|----------------------------------------------|---------------------------|
| currency     | currency                                     | "EUR"                     |
| at           | timestamp                                    | 1389092410                |
| price        | price of latest trade                        | 680.0                     |
| bid          | bid price                                    | 676.01                    |
| ask          | ask price                                    | 679.9999999               |
| midpoint     | midpoint price                               | 678.00499995              |
| volume       | 24h volume                                   | 198.16844745              |
| variation    | 24h variation (percentage)                   | -5.5556                   |
| high         | 24h high price                               | 720.0                     |
| low          | 24h low price                                | 640.0001                  |
| vwap         | 24h volume-weighted average price            | 679.87459                 |

### Latest trades

##### Description

Read the latest executed trades.

##### Endpoint

| method | path                    | authorization |
|--------|-------------------------|---------------|
| GET    | /api/v1/data/eur/trades | not required  |

##### Example

```bash
$ curl "https://paymium.com/api/v1/data/eur/trades"
```

```json
[
  {
    "uuid": "59f9c458-cb22-48d6-9103-0b6e54130e29",
    "traded_btc": 0.153,
    "traded_currency": 102.51,
    "created_at": "2014-01-07T11:30:59Z",
    "currency": "EUR",
    "price": 670.0,
    "created_at_int": 1389094259
  },
  {
    "uuid": "4787c80b-bc90-48d4-87ee-b23fbff2fbb7",
    "traded_btc": 0.06,
    "traded_currency": 40.2,
    "created_at": "2014-01-07T11:31:00Z",
    "currency": "EUR",
    "price": 670.0,
    "created_at_int": 1389094260
  },
  {
    "uuid": "67838a4d-cd2e-47d1-9b3c-0ff7a6d2ea89",
    "traded_btc": 0.4,
    "traded_currency": 268.0,
    "created_at": "2014-01-07T11:31:00Z",
    "currency": "EUR",
    "price": 670.0,
    "created_at_int": 1389094260
  }
]
```

##### Properties

The response is an array of trades.

##### Trade properties

| name            | description                                  | example value                          |
|-----------------|----------------------------------------------|----------------------------------------|
| uuid            | unique ID of trade                           | "59f9c458-cb22-48d6-9103-0b6e54130e29" |
| currency        | currency                                     | "EUR"                                  |
| created_at      | date created                                 | "2014-01-07T11:30:59Z"                 |
| created_at_int  | timestamp                                    | 1389094259                             |
| price           | price per BTC                                | 670.0                                  |
| traded_btc      | amount of BTC traded                         | 0.153                                  |
| traded_currency | amount of currency traded                    | 102.51                                 |

### Market depth

##### Description

Read the market depth. Bids and asks are grouped by price.

##### Endpoint

| method | path                    | authorization |
|--------|-------------------------|---------------|
| GET    | /api/v1/data/eur/depth  | not required  |

##### Example

```bash
$ curl "https://paymium.com/api/v1/data/eur/depth"
```

```json
{
  "bids": [
    {
      "timestamp": 1389087724,
      "amount": 0.89744,
      "price": 665.0,
      "currency": "EUR"
    },
    {
      "timestamp": 1389082088,
      "amount": 0.06,
      "price": 666.0,
      "currency": "EUR"
    }
  ],
  "asks": [
    {
      "timestamp": 1389094178,
      "amount": 0.57709999,
      "price": 679.99,
      "currency": "EUR"
    },
    {
      "timestamp": 1389092448,
      "amount": 0.20684181,
      "price": 680.0,
      "currency": "EUR"
    }
  ]
}
```

##### Properties

| name            | description                                  |
|-----------------|----------------------------------------------|
| bids            | an array of bids                             |
| asks            | an array of asks                             |

##### Bids / asks properties

| name            | description                                  | example value                          |
|-----------------|----------------------------------------------|----------------------------------------|
| currency        | currency                                     | "EUR"                                  |
| timestamp       | timestamp                                    | 1389087724                             |
| price           | price                                        | 665.0                                  |
| amount          | amount at price                              | 0.06                                   |


### Bitcoin-Charts endpoints

Two API endpoints dedicated to [Bitcoin-Charts](http://bitcoincharts.com) are publicly accessible, they are accessible at:

 * `https://paymium.com/api/v1/bitcoin_charts/eur/trades`, and
 * `https://paymium.com/api/v1/bitcoin_charts/eur/depth`

The data they return is formatted according to the [Bitcoin Charts exchange API specification](http://bitcoincharts.com/about/exchanges/).

### WebSocket

A [socket.io](http://socket.io) endpoint is available to receive public data. This allows you to receive new data without having to poll the server.

The socket.io socket will emit a `stream` event when new data is available. The received JSON data contains one or more of the properties listed below, depending on what was updated.

#### Socket.io configuration

Socket.io must connect to `paymium.com/<public or user>` and the `path` option must be set to `/ws/socket.io`.

#### Message descriptions

The Websocket messages are documented separately: [documentation](https://github.com/Paymium/api-documentation/blob/master/WEBSOCKETS.md).

#### Node.js example

Assuming you have node.js installed, you can install the socket.io client library by running `npm install socket.io-client`.

The code below shows how to connect to the Paymium socket, and outputs any received data to the console.

The example is available in the `examples/public_socket.js` directory of this repository.

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

socket.on('stream', function(data) {
  console.log('GOT DATA:');
  console.log(data);
});
```

### FIX streaming API

The FIX API is documented separately: [documentation](https://github.com/Paymium/api-documentation/blob/master/FIX-4.4.md).


## User data

Before you can access your own data or other users data, you must register an application on Paymium:

1. Verify your account and log in
2. Visit [https://paymium.com/page/developers/apps](https://paymium.com/page/developers/apps)
3. Create an application (set redirect URI to `https://paymium.com/page/oauth/test` when testing)

### User info

##### Description

Read the latest user info.

##### Endpoint

| method | path                    | authorization         |
|--------|-------------------------|-----------------------|
| GET    | /api/v1/user            | oauth2 (scope: basic) |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user"                        \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "name": "BC-U123456",
  "locale": "en",
  "balance_btc": 25.78866278,
  "locked_btc": 1.0,
  "balance_eur": 1893.96,
  "locked_eur": 300.00743886
}
```

##### Properties

| name         | description                                  | example value             |
|--------------|----------------------------------------------|---------------------------|
| name         | account number / name                        | "BC-U123456"              |
| locale       | locale code                                  | "en"                      |
| balance_eur  | available EUR balance                        | 1893.96                   |
| locked_eur   | EUR balance locked in trading                | 300.00743886              |
| balance_btc  | available BTC balance                        | 25.78866278               |
| locked_btc   | BTC balance locked in trading                | 1.0                       |

### User activity

##### Description

Read user activity.

##### Endpoint

| method | path                    | authorization            |
|--------|-------------------------|--------------------------|
| GET    | /api/v1/user/orders     | oauth2 (scope: activity) |

##### Parameters

| name         | description                                  | example value             |
|--------------|----------------------------------------------|---------------------------|
| offset       | pagination offset (optional)                 | 20                        |
| limit        | pagination limit (optional)                  | 20                        |
| types[]      | filter by types (optional)                   | LimitOrder                |
| active       | only show active orders (optional)           | true                      |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/orders?offset=20"                \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

```json
[
  {
    "uuid": "968f4580-e26c-4ad8-8bcd-874d23d55296",
    "amount": 1.0,
    "state": "executed",
    "btc_fee": 0.0,
    "currency_fee": 0.0,
    "updated_at": "2013-10-24T10:34:37.000Z",
    "created_at": "2013-10-22T19:12:02.000Z",
    "currency": "BTC",
    "type": "Transfer",
    "account_operations": [
      {
        "uuid": "94b42d0f-9c2d-43f3-978b-aba28533d1f9",
        "name": "bitcoin_transfer",
        "amount": -1.0,
        "currency": "BTC",
        "created_at": "2013-10-22T19:12:02.000Z",
        "created_at_int": 1382469122,
        "is_trading_account": false
      }
    ]
  },
  {
    "uuid": "1953cd1b-3903-4812-9590-42c3ebcc08c2",
    "amount": 49.38727114,
    "state": "executed",
    "btc_fee": 0.0,
    "currency_fee": 0.0,
    "updated_at": "2013-10-22T14:30:06.000Z",
    "created_at": "2013-10-22T14:30:06.000Z",
    "currency": "BTC",
    "type": "AdminOrder",
    "account_operations": [
      {
        "uuid": "a940393b-4d2f-4a5a-8a0a-3470d7419bad",
        "name": "account_operation",
        "amount": 49.38727114,
        "currency": "BTC",
        "created_at": "2013-10-22T14:30:06.000Z",
        "created_at_int": 1382452206,
        "is_trading_account": false
      }
    ]
  }
]
```

##### Properties

The response is an array of orders. See [order properties](#order-properties).

### Order details

##### Description

Read details from a specific order.

##### Endpoint

| method | path                       | authorization            |
|--------|----------------------------|--------------------------|
| GET    | /api/v1/user/orders/{UUID} | oauth2 (scope: activity) |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/orders/968f4580-e26c-4ad8-8bcd-874d23d55296"         \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "uuid": "968f4580-e26c-4ad8-8bcd-874d23d55296",
  "amount": 1.0,
  "state": "executed",
  "btc_fee": 0.0,
  "currency_fee": 0.0,
  "updated_at": "2013-10-24T10:34:37.000Z",
  "created_at": "2013-10-22T19:12:02.000Z",
  "currency": "BTC",
  "type": "Transfer",
  "account_operations": [
    {
      "uuid": "94b42d0f-9c2d-43f3-978b-aba28533d1f9",
      "name": "bitcoin_transfer",
      "amount": -1.0,
      "currency": "BTC",
      "created_at": "2013-10-22T19:12:02.000Z",
      "created_at_int": 1382469122,
      "is_trading_account": false
    }
  ]
}
```

##### Properties

See [order properties](#order-properties).

### Trading

##### Description

Create trade orders.

Limit and market orders are supported, the `price` parameter must be omitted for market orders.

Either one of `amount` or `currency_amount` must be specified. When the `amount` is specified, the
engine will buy or sell this amount of Bitcoins. When the `currency_amount` is specified, the engine
will buy as much Bitcoins as possible for `currency_amount` or sell as much Bitcoins as necessary to
obtain `currency_amount`.


##### Endpoint

| method | path                       | authorization            |
|--------|----------------------------|--------------------------|
| POST   | /api/v1/user/orders        | oauth2 (scope: trade)    |

##### Payload

| name               | description                                                   | example value |
|--------------------|---------------------------------------------------------------|---------------|
| type               | must be "LimitOrder" or "MarketOrder"                         | "LimitOrder"  |
| currency           | must be "EUR"                                                 | "EUR"         |
| direction          | trade direction, must be "buy" or "sell"                      | "buy"         |
| price              | price per BTC, must be omitted for market orders              | 300.0         |
| amount             | BTC amount to trade (only if no currency_amount is specified) | 1.0           |
| currency_amount    | Currency amount to trade (only if no amount is specified)     | 1.0           |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/orders"                     \
     --header "Authorization: Bearer ACCESS_TOKEN"                  \
     -d "type=LimitOrder"                                           \
     -d "currency=EUR"                                              \
     -d "direction=buy"                                             \
     -d "price=300.0"                                               \
     -d "amount=1.0"
```

Would return:

```json
{
  "uuid": "4924ee0f-f60e-40b4-b63e-61637ef253ac",
  "amount": 1.0,
  "state": "pending_execution",
  "btc_fee": 0.0,
  "currency_fee": 0.0,
  "updated_at": "2013-11-21T15:27:04.000Z",
  "created_at": "2013-11-21T15:27:04.000Z",
  "currency": "EUR",
  "type": "LimitOrder",
  "traded_btc": 0.0,
  "traded_currency": 0.0,
  "direction": "buy",
  "price": 300.0,
  "account_operations": [
    {
      "uuid": "63e1d9c4-dff2-42bc-910b-c5b585b625cc",
      "name": "lock",
      "amount": -300.0,
      "currency": "EUR",
      "created_at": "2013-11-21T15:27:04.000Z",
      "created_at_int": 1385047624,
      "is_trading_account": false
    },
    {
      "uuid": "c9d3e824-b29a-4630-8396-3864a0704336",
      "name": "lock",
      "amount": 300.0,
      "currency": "EUR",
      "created_at": "2013-11-21T15:27:04.000Z",
      "created_at_int": 1385047624,
      "is_trading_account": true
    }
  ]
}
```

##### Properties

See [order properties](#order-properties).

### Withdrawing

Request BTC or fiat withdrawals. A confirmation is sent by email to the user before it can be executed.

##### Endpoint

| method | path                       | authorization            |
|--------|----------------------------|--------------------------|
| POST   | /api/v1/user/orders        | oauth2 (scope: withdraw) |

##### Payload

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| type               | must be "Transfer"                      | "Transfer"                             |
| currency           | currency code                           | "BTC"                                  |
| amount             | amount to transfer                      | 0.5                                    |
| address            | BTC address if withdrawing BTC          | "1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn"   |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/orders"                     \
     --header "Authorization: Bearer ACCESS_TOKEN"                  \
     -d "type=Transfer"                                             \
     -d "currency=BTC"                                              \
     -d "amount=0.5"                                                \
     -d "address=1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn"
```

Would return:

```json
{
  "uuid": "9229fd6e-0aad-45d6-8090-a400f37a0129",
  "amount": 0.5,
  "state": "pending",
  "btc_fee": 0.0,
  "currency_fee": 0.0,
  "updated_at": "2014-01-09T10:22:00.858Z",
  "created_at": "2014-01-09T10:22:00.858Z",
  "currency": "BTC",
  "type": "Transfer",
  "account_operations": [
    {
      "uuid": "4c4f4682-354f-46d1-a916-72d88d5584e3",
      "name": "bitcoin_transfer",
      "amount": -0.5,
      "currency": "BTC",
      "created_at": "2014-01-09T10:22:02.171Z",
      "created_at_int": 1389262922,
      "is_trading_account": false
    }
  ]
}
```

##### Properties

See [order properties](#order-properties).

### Sending money

##### Description

Initiate a money transfer to an e-mail address.

The transfer is immediately executed if the user have a valid account. Otherwise, an e-mail is sent with a registration invitation.

This transfer expire after 1 month if it is not collected. In this case, the order is cancelled and the sender re-credited.

#### Endpoint

| method | path                       | authorization            |
|--------|----------------------------|--------------------------|
| POST   | /api/v1/user/orders        | oauth2 (scope: send)     |

##### Payload

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| type               | must be "EmailTransfer"                 | "EmailTransfer"                        |
| currency           | currency code                           | "BTC"                                  |
| amount             | amount to transfer                      | 0.5                                    |
| email              | an e-mail address                       | "user@example.com"                     |
| comment            | a small note explaining the transfer    | "Hi, refund for that thing"            |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/orders"                     \
     --header "Authorization: Bearer ACCESS_TOKEN"                  \
     -d "type=EmailTransfer"                                        \
     -d "currency=BTC"                                              \
     -d "amount=0.5"                                                \
     -d "email=user@example.com"                                    \
     -d "comment=Hi, refund for that thing"
```

Would return:

```json
{
  "uuid": "9229fd6e-0aad-45d6-8090-a400f37a0129",
  "amount": 0.5,
  "state": "pending",
  "btc_fee": 0.0,
  "currency_fee": 0.0,
  "updated_at": "2014-01-09T10:22:00.858Z",
  "created_at": "2014-01-09T10:22:00.858Z",
  "currency": "BTC",
  "type": "EmailTransfer",
  "account_operations": [
    {
      "uuid": "4c4f4682-354f-46d1-a916-72d88d5584e3",
      "name": "email_transfer",
      "amount": -0.5,
      "currency": "BTC",
      "created_at": "2014-01-09T10:22:02.171Z",
      "created_at_int": 1389262922,
      "is_trading_account": false
    }
  ]
}
```

### Requesting money by e-mail

##### Description

This functionality allows one to create a payment request that is sent by e-mail to the designated recipient, when the link contained in the e-mail is clicked,
the recipient is presented with a Bitcoin address to which he is instructed to direct his payment.

Once the Bitcoin payment is confirmed, the payee is credited in the originally requested currency.

#### Endpoint

| method | path                          | authorization           |
|--------|-------------------------------|-------------------------|
| POST   | /api/v1/user/payment_requests | oauth2 (scope: receive) |

##### Payload

| name          | description                             | example value               |
|-------------- |-----------------------------------------|-----------------------------|
| type          | must be "PaymentRequest"                | "PaymentRequest"            |
| currency      | currency code                           | "BTC"                       |
| amount        | amount to transfer                      | 0.5                         |
| email         | an e-mail address                       | "user@example.com"          |
| payment_split | Percentage of the payment the _merchant_ will get in `currency` expressed as a two-decimal places float between 0 and 1 (required) | 1.0 |
| comment       | a small note explaining the transfer    | "Hi, refund for that thing" |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/payment_requests" \
     --header "Authorization: Bearer ACCESS_TOKEN"        \
     -d "type=PaymentRequest"                             \
     -d "currency=BTC"                                    \
     -d "amount=0.5"                                      \
     -d "email=user@example.com"                          \
     -d "payment_split=1"                                 \
     -d "comment=Hi, refund for that thing"
```

If successful, responds `HTTP/1.1 204 No Content`.

### Canceling orders

##### Description

Cancel an order. Only active trade orders and email tranfers may be canceled.

##### Endpoint

| method | path                              | authorization            |
|--------|-----------------------------------|--------------------------|
| DELETE | /api/v1/user/orders/{UUID}/cancel | oauth2 (scope: trading)  |

##### Example

```bash
$ curl "https://paymium.com/api/v1/user/orders/968f4580-e26c-4ad8-8bcd-874d23d55296"         \
     -X DELETE --header "Authorization: Bearer ACCESS_TOKEN"
```
### Bitcoin addresses

##### Description

List and create bitcoin deposit addresses

##### Endpoint

| method | path                                | authorization            |
|--------|-------------------------------------|--------------------------|
| GET    | /api/v1/user/addresses              | oauth2 (scope: deposit)  |
| GET    | /api/v1/user/addresses/:btc_address | oauth2 (scope: deposit)  |
| POST   | /api/v1/user/addresses              | oauth2 (scope: deposit)  |

##### Exampleis

Retrieve your Bitcoin deposit addresses along with their expiration timestamp.

```bash
$ curl "https://paymium.com/api/v1/user/addresses"         \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

```json
[
  {
    "address": "1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn",
    "valid_until": 1402579836
  }
]
```

Retrieve details for a single address.

```bash
$ curl "https://paymium.com/api/v1/user/addresses/1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn"         \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "address": "1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn",
  "valid_until": 1402579836
}
```

Create a new Bitcoin deposit address unless another one is already active.

```bash
$ curl -X POST "https://bitcoin-central.net/api/v1/user/addresses" \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "address": "1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn",
  "valid_until": 1402579836
}
```

## Merchant API

The Merchant API enables merchants to securely sell goods and services and get paid in Bitcoin. The API makes it possible for the merchant to completely eliminate the risk of market fluctuations when requesting to receive fiat currency in their account. It is also possible to keep a part of the payment in Bitcoin without having it converted at a guaranteed rate.

The API allows developers to integrate Bitcoin payments very tightly into their platforms, pre-packaged plugins are also available for a growing list of popular e-commerce frameworks.

For merchants that have very simple needs payment buttons are also available, these buttons remove the integration completely by allowing merchants to simply include a code snippet on a static HTML page, or on a blog to receive fixed-amount payments.

### Payment creation

##### Authentication

_The "merchant token" authentication mechanism has been removed please use an [API token](#token-authentication) or an [OAuth2 token](#oauth2-authentication) instead with the "merchant" scope._

##### Description

A payment is created by a merchant platform when the customer chooses Bitcoin as his desired checkout option.

The merchant platform can then :
* display the payment Bitcoin address on his own web interface,
* include the Paymium web interface url in an iframe in order to display a payment pop-up as an overlay,
* redirect the buyer to the payement's URL (see below), in this case the payment is displayed on a separate screen

To display the payment request to the user, the `https://paymium.com/invoice/{UUID}` can be used, this is used by the e-commerce framework plugins.

Once the payment request is displayed, the customer has 15 minutes to send the appropriate amount.

Paymium notifies the merchant of the completion of his payment via the associated callback (for which an URL may be provided when creating the payment request), once one Bitcoin confirmation for the payment is received the funds are credited to the merchant's account, a callback notification is then made.


##### Endpoint

| method | path |
|--------|------|
| POST   | /api/v1/merchant/create_payment |


##### Parameters

| name         | description                                  | example value             |
|--------------|----------------------------------------------|--------------------|
| amount              | Amount requested for the payment (required) | 20  |
| payment_split       | Percentage of the payment the _merchant_ will get in `currency` expressed as a two-decimal places float between 0 and 1 (required) | 1.0 |
| currency            | Currency in which the merchant wishes to be credited and in which the `amount` is expressed (required) | EUR |
| callback_url        | Merchant callback URL, it is called when the state of the payment changes (optional)        | http://myonlineshop/payments/order-987978/callback |
| redirect_url        | URL to which the customer should be redirected at upon payment (optional) | http://myonlineshop/payments/order-987978/success  |
| merchant_reference  | Arbitrary merchant data associated to the payment (optional) | order-987978 |

##### Response

See [Payment properties](#returned-json-object-properties)

### Payment callbacks

When a payment is created or updated, and if a callback URL was provided, a notification is made.

When the notification is made a `POST` request is made to the callback URL, it contains the JSON representation of the payment (see the [payment properties](#get-payment-information)).

The merchant should ensure the callback is legitimate by requesting confirmation from the Paymium API for the invoice data.

**Note :** The callback notifications are not guaranteed to be unique, it must have idempotent results on the merchant side if the payment has not actually changed.


### Get payment information

This endpoint returns the payment request as a JSON object given a payment UUID


##### Endpoint

| Method | Path                                |
|--------|-------------------------------------|
| GET    | /api/v1/merchant/get_payment/{UUID} |


##### Returned JSON object properties

| Name               | Description                                                           |
|--------------------|-----------------------------------------------------------------------|
| uuid               | Payment UUID                                                          |
| currency           | Currency in which the `currency_amount` is expressed                  |
| payment_split      | Percentage of the payment the merchant will get in `currency`         |
| state              | See [payment states](#payment-states)                                 |
| callback_url       | Merchant notification URL                                             |
| redirect_url       | Redirection url to which the customer is redirected on success        |
| merchant_name      | Name of the merchant that is displayed to the customer                |
| expires_at         | Expiration timestamp                                                  |
| merchant_reference | Reference string associated to the payment                            |
| amount             | Amount associated to the payment                                      |
| btc_amount         | BTC amount to pay                                                     |
| payment_address    | Payment address                                                       |
| created_at         | Creation timestamp                                                    |
| updated_at         | Last update timestamp                                                 |
| account_operations | Account operations made against the merchant account                  |


**Example**
```json
{
    "account_operations": [
        {
            "amount": 25.0,
            "created_at": "2014-05-15T10:19:21.000Z",
            "created_at_int": 1400149161,
            "currency": "EUR",
            "is_trading_account": false,
            "name": "merchant_currency_payment",
            "uuid": "afca953b-dfa6-40b6-b856-c04d548baefb"
        }
    ],
    "amount": 25.0,
    "btc_amount": 0.079945,
    "callback_url": "http://mysite.com/wc-api/WC_Paymium/",
    "cancel_url": "http://mysite.com/commande/panier/",
    "comment": null,
    "created_at": 1400147834,
    "currency": "EUR",
    "expires_at": 1400148734,
    "merchant_name": "Demo SAS",
    "merchant_reference": "888",
    "payment_address": "1NHRnMn1831D84owh7powxtAbqfzA9aaL5",
    "payment_split": 1.0,
    "redirect_url": "http://mysite.com/order/checkout/order-received/888?key=wc_order_53784&order=888",
    "state": "paid",
    "updated_at": 1400149161,
    "uuid": "f8e7c539-7b7b-4b63-9ccf-5fc2ca91bf0b"
}
```

### E-commerce frameworks plugins

The currently available plugins are available

| Framework      | Plugin URL                             |
|----------------|----------------------------------------|
| PrestaShop 1.6 | https://github.com/Paymium/prestashop  |
| WooCommerce    | https://github.com/Paymium/woocommerce |

## Appendix

### Currencies

The following currencies are available:

| symbol | currency |
|--------|----------|
| EUR    | Euro     |
| BTC    | Bitcoin  |

### Order types

Orders can have the following types:

| type           | description                        |
|----------------|------------------------------------|
| WireDeposit    | wire (fiat) deposit                |
| BitcoinDeposit | BTC deposit                        |
| LimitOrder     | limit trade order                  |
| Transfer       | BTC or fiat transfer or withdraw   |
| EmailTransfer  | BTC or fiat transfer by e-mail     |
| AdminOrder     | special order executed by an admin |

### Order properties

All order types share generic properties.

Each type may have additional properties as described below.

##### Generic order properties

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| uuid               | unique id                               | "968f4580-e26c-4ad8-8bcd-874d23d55296" |
| type               | order type                              | "Transfer"                             |
| currency           | currency                                | "BTC"                                  |
| created_at         | date created                            | "2013-10-24T10:34:37.000Z"             |
| updated_at         | date updated                            | "2013-10-22T19:12:02.000Z"             |
| amount             | currency amount                         | 1.0                                    |
| state              | order state                             | "executed"                             |
| currency_fee       | currency fee collected                  | 0.0                                    |
| btc_fee            | BTC fee collected                       | 0.0                                    |
| comment            | optional comment                        |                                        |
| account_operations | an array of account operations executed |                                        |

##### Market order specific properties

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| direction          | trade direction ("buy" or "sell")       | "buy"                                  |
| price              | price per BTC                           | 620.0                                  |
| traded_currency    | currency exchanged                      | 310.0                                  |
| traded_btc         | BTC echanged                            | 0.5                                    |

##### EmailTransfer specific properties

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| email_address      | email address of the receiver           | "user@example.com"                     |


### Order states

| name               | description                                                                      |
|--------------------|----------------------------------------------------------------------------------|
| pending_execution  | order is queued and pending execution                                            |
| pending            | order is pending, such as an unconfirmed withdrawal                              |
| processing         | order is processing                                                              |
| authorized         | order has been authorized, such as a confirmed withdrawal                        |
| active             | order is active, such as a trade order in the order book                         |
| filled             | order has been completely filled                                                 |
| executed           | order has been executed                                                          |
| canceled           | order has been canceled                                                          |

### Email Transfer states

| Name               | Description                                                                            |
|--------------------|----------------------------------------------------------------------------------------|
| pending            | Email Transfer is pending the email confirmation                                       |
| pending_collection | Email Transfer queued and pending for the receiver registration and profile completion |
| executed           | Email Transfer has been executed                                                       |
| expired            | Email Transfer has expired                                                             |
| canceled           | Email Transfer has been canceled                                                       |

### Payment states

| Name           | Description                                                                        |
|----------------|------------------------------------------------------------------------------------|
| pending_payment| Waiting for payment                                                                |
| processing     | The correct amount has been received, waiting for a Bitcoin network confirmation   |
| paid           | Payment completed, the requested amount has been credited to the merchant account  |
| error          | An error has occurred, the merchant must get in touch with the support             |
| expired        | Payment expired, no Bitcoins were received                                         |

### Account operation properties

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| uuid               | unique id                               | "a940393b-4d2f-4a5a-8a0a-3470d7419bad" |
| currency           | currency                                | "BTC"                                  |
| name               | name of operation                       | "account_operation"                    |
| created_at         | date created                            | "2013-10-22T14:30:06.000Z"             |
| created_at_int     | timestamp                               | 1382452206                             |
| amount             | currency amount                         | 49.38727114                            |
| address            | bitcoin address if any                  | "1FPDBXNqSkZMsw1kSkkajcj8berxDQkUoc"   |
| tx_hash            | bitcoin transaction hash if any         | "86e6e72aa559428524e035cd6b2997004..." |
| is_trading_account | whether the trading account is targeted | false                                  |

### Ruby example

This example uses the OAuth2 Ruby gem.

The [`AutoRefreshToken`](https://gist.github.com/davout/edb4db0315dc417fa78d) class encapsulates this logic, it is available as a [Gist](https://gist.github.com/davout/edb4db0315dc417fa78d).

```ruby
require 'oauth2'

client = OAuth2::Client.new('6fcf1c32f6e14cd773a7a6640832bdbf83a5b2b8d4382e839c6aff83a8f1bb3b', '55554ecad5627f0465034c4a116e59a38d9c3ab272487a18404078ccc0b64798', site: 'https://paymium.com', authorize_url: '/api/oauth/authorize', token_url: '/api/oauth/token')

client.auth_code.authorize_url(redirect_uri: 'https://paymium.com/page/oauth/test', scope: 'basic activity trade withdraw')
 => "https://staging.paymium.com/api/oauth/authorize?response_type=code&client_id=71a28131e16a0d6756a41aa391f1aa28b2f5a2ed4a6b911cf2bf640c8a0cc2cd&redirect_uri=https%3A%2F%2Fstaging.paymium.com%2Fpage%2Foauth%2Ftest&scope=basic+activity+trade+withdraw"

# Visit this URL in your browser, approve the request and copy the authorization code

authorization_code = '9b55e27c840f59d927284fdc438ee3d8fac94b00e24d331162ddff76c1a6bcc0'

token = client.auth_code.get_token(authorization_code, redirect_uri: 'https://paymium.com/page/oauth/test')

token.get('/api/v1/user').body
=> {"name":"BC-U123456","locale":"en","balance_btc":117.56672217,"locked_btc":0.0,"balance_eur":0.0,"locked_eur":0.00995186}
```
