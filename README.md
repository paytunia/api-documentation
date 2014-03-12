![Bitcoin-Central logo](https://raw2.github.com/Paymium/api-documentation/master/logo.png)

The Bitcoin-Central API allows developers to extend the capabilities of Bitcoin-Central, from reading the latest ticker to automating trades with bots.

Is is possible to, among other things:

* Access public data (ticker, asks, bids, trades, etc...)
* Authenticate users with their permission using OAuth2 *
* Access authenticated user balances, trades, and other data *
* Automate trading *

_* Authenticating users is only available to developers that have a fully verified and approved Bitcoin-Central account. On the other hand, public data is available to everyone_

## Table of contents

* [**General information**](#general-information)
  * [Formats and required HTTP request headers](#formats-and-required-http-request-headers)
  * [Localization](#localization)
  * [Error handling](#error-handling)
  * [Successful calls](#sucessful-calls)
  * [Rate-limiting](#rate-limiting)

* [**Public data**](#public-data)
  * [Ticker](#ticker)
  * [Latest trades](#latest-trades)
  * [Market depth](#market-depth)
  * [Bitcoin-Charts endpoints](#bitcoin-charts-endpoints)

* [**User data**](#user-data)
  * [Authentication](#authentication)
  * [User info](#user-info)
  * [User activity](#user-activity)
  * [Order details](#order-details)
  * [Trading](#trading)
  * [Withdrawing](#withdrawing)
  * [Canceling orders](#canceling-orders)

* [**Appendix**](#appendix)
  * [Currencies](#currencies)
  * [Order types](#order-types)
  * [Order properties](#order-properties)
  * [Order states](#order-states)
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
$ curl "https://bitcoin-central.net/api/v1/data/eur/ticker"
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
$ curl "https://bitcoin-central.net/api/v1/data/eur/trades"
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
$ curl "https://bitcoin-central.net/api/v1/data/eur/depth"
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

 * `https://bitcoin-central.net/api/v1/bitcoin_charts/eur/trades`, and
 * `https://bitcoin-central.net/api/v1/bitcoin_charts/eur/depth`

The data they return is formatted according to the [Bitcoin Charts exchange API specification](http://bitcoincharts.com/about/exchanges/).

## User data

Before you can access your own data or other users data, you must register an application on Bitcoin-Central:

1. Verify your account and log in
2. Visit [https://bitcoin-central.net/page/developers/apps](https://bitcoin-central.net/page/developers/apps)
3. Create an application (set redirect URI to `https://bitcoin-central.net/page/oauth/test` when testing)

### Authentication

To access and manipulate user data, you must first request permission from the user.

Authorizations are granted using the standard [OAuth2](http://oauth.net/2/) Authorization Code Grant.

Many programming languages already have libraries to develop clients that connect to OAuth2 APIs, hence the following steps may not be necessary. For instance, if you are a Ruby developer, you can use [this example to get started](#ruby-example).

The process of authenticating a user can be summarized as follows:

1. Send the user to your application's authorization URL
2. Receive the authorization code if the user accepted the request
3. Get an access token and a refresh token from the authorization code
4. Refresh the access token when needed

##### Scopes

Before you request authorization to access a user's account, you must decide which scopes you would like to access.

The following scopes are available:

| name           | description                                                                               |
|----------------|-------------------------------------------------------------------------------------------|
| basic         | Read account number, language, and balances (default)                                      |
| activity       | Read trade orders, deposits, withdrawals, and other operations                            |
| trade          | Create and cancel trade orders                                                            |
| withdraw       | Request EUR and BTC withdrawals (requires email confirmation from users upon withdrawing) |

##### Requesting user authorization

To get user's permission to use his/her account, you must send him/her to your application's redirect URI. You can see this URI by visiting your application's page: [https://bitcoin-central.net/page/developers/apps](https://bitcoin-central.net/page/developers/apps).

By default, the `basic` scope will be requested.

If your application requires specific access scopes, you must append a scope GET parameter to the authorization URI:

    https://bitcoin-central.net/...&scope=basic+activity+trade

The user will then be prompted to authorize your application with the specified scopes.

##### Receiving the authorization code

If you specified the test redirection URI `https://bitcoin-central.net/page/oauth/test`, the user will be presented the autorization code upon accepting your request which can be used by the application to fetch access tokens.

Otherwise the code or error will be sent to the redirection URI so that your application can retrieve it (in this case `https://example.com/callback`):

    https://example.com/callback?code=AUTHORIZATION_CODE

Or if the request was denied by the user:

    https://example.com/callback?error=access_denied&error_description=The+resource+owner+or+authorization+server+denied+the+request.

The authorization code is valid 5 minutes.

##### Fetching an access token and a refresh token

Once your application received the authorization code, it can request an access token and a refresh token:

```bash
$ curl "https://bitcoin-central.net/api/oauth/token"            \
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
$ curl "https://bitcoin-central.net/api/oauth/token"            \
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

### User info

##### Description

Read the latest user info.

##### Endpoint

| method | path                    | authorization         |
|--------|-------------------------|-----------------------|
| GET    | /api/v1/user            | oauth2 (scope: basic) |

##### Example

```bash
$ curl "https://bitcoin-central.net/api/v1/user"                \
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
$ curl "https://bitcoin-central.net/api/v1/user/orders?offset=20"        \
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
$ curl "https://bitcoin-central.net/api/v1/user/orders/968f4580-e26c-4ad8-8bcd-874d23d55296" \
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
$ curl "https://bitcoin-central.net/api/v1/user/orders"             \
     --header "Authorization: Bearer ACCESS_TOKEN"                  \
     -d "type=LimitOrder"                                           \
     -d "currency=EUR"                                              \
     -d "direction=buy"                                             \
     -d "price=300.0"                                               \
     -d "amount=1.0"
```

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
$ curl "https://bitcoin-central.net/api/v1/user/orders"             \
     --header "Authorization: Bearer ACCESS_TOKEN"                  \
     -d "type=Transfer"                                             \
     -d "currency=BTC"                                              \
     -d "amount=0.5"                                                \
     -d "address=1PzU1ERAnHJmtU8J3qq3wwJhyLepwUYzHn"
```

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

### Canceling orders

##### Description

Cancel an order. Only active trade orders may be canceled.

##### Endpoint

| method | path                              | authorization            |
|--------|-----------------------------------|--------------------------|
| DELETE | /api/v1/user/orders/{UUID}/cancel | oauth2 (scope: trading)  |

##### Example

```bash
$ curl "https://bitcoin-central.net/api/v1/user/orders/968f4580-e26c-4ad8-8bcd-874d23d55296" \
     --header "Authorization: Bearer ACCESS_TOKEN"
```

### Web sockets

Web sockets are available to get real-time notifications and will be documented in the future.

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

### Account operation properties

| name               | description                             | example value                          |
|--------------------|-----------------------------------------|----------------------------------------|
| uuid               | unique id                               | "a940393b-4d2f-4a5a-8a0a-3470d7419bad" |
| currency           | currency                                | "BTC"                                  |
| name               | name of operation                       | "account_operation"                    |
| created_at         | date created                            | "2013-10-22T14:30:06.000Z"             |
| created_at_int     | timestamp                               | 1382452206                             |
| amount             | currency amount                         | 49.38727114                            |
| is_trading_account | whether the trading account is targeted | false                                  |

### Ruby example

This example uses the OAuth2 Ruby gem.

```ruby
require 'oauth2'

client = OAuth2::Client.new('6fcf1c32f6e14cd773a7a6640832bdbf83a5b2b8d4382e839c6aff83a8f1bb3b', '55554ecad5627f0465034c4a116e59a38d9c3ab272487a18404078ccc0b64798', site: 'https://bitcoin-central.net', authorize_url: '/api/oauth/authorize', token_url: '/api/oauth/token')
 
client.auth_code.authorize_url(redirect_uri: 'https://bitcoin-central.net/page/oauth/test', scope: 'basic activity trade withdraw')
 => "https://staging.bitcoin-central.net/api/oauth/authorize?response_type=code&client_id=71a28131e16a0d6756a41aa391f1aa28b2f5a2ed4a6b911cf2bf640c8a0cc2cd&redirect_uri=https%3A%2F%2Fstaging.bitcoin-central.net%2Fpage%2Foauth%2Ftest&scope=basic+activity+trade+withdraw" 

# Visit this URL in your browser, approve the request and copy the authorization code

authorization_code = '9b55e27c840f59d927284fdc438ee3d8fac94b00e24d331162ddff76c1a6bcc0'

token = client.auth_code.get_token(authorization_code, redirect_uri: 'https://bitcoin-central.net/page/oauth/test')

token.get('/api/v1/user').body
=> {"name":"BC-U123456","locale":"en","balance_btc":117.56672217,"locked_btc":0.0,"balance_eur":0.0,"locked_eur":0.00995186}
```
