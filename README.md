![Paytuna logo](https://bitcoin-central.net/paytunia.png)

This document describes the API calls available as part of the Paytunia v1 API.

The API is shared by both [Bitcoin-Central.net](https://bitcoin-central.net) and [Paytunia.com](https://paytunia.com). Both apps run against the same database, therefore using the API against one of them is equivalent to using the API against the other.

## Table of contents

- [**General API description**](#general-api-description)
<p></p> 
  - [Authentication](#authentication)
  - [Base URL](#base-url)
  - [Formats and required HTTP request headers](#formats-and-required-http-request-headers)
  - [Rate-limiting](#rate-limiting)
  - [Pagination](#pagination)
    - [HTTP response header](#http-response-header)
    - [Controlling pagination](#controlling-pagination)
  - [Localization](#localization)
  - [Error handling](#error-handling)
  - [Successful calls](#successful-calls)

<p></p>

- [**API Calls**](#api-calls)
<p></p>
  - [Account operations](#account-operations)
     - [Get the detail of an account operation (A)](#get-the-details-of-an-account-operation-a)
     - [Get a list of account operations (A,P)](#get-a-list-of-account-operations-a-p)
<p></p> 
  - [Send money](#send-money)
     - [Send Bitcoins (A)](#send-bitcoins-a)
     - [Send money to an e-mail address (A)](#send-money-to-an-e-mail-address-a)  
<p></p>
  - [Quotes](#quotes)
     - [Create a quote (A)](#create-a-quote-a)
     - [View a quote (A)](#view-a-quote-a)
     - [List quotes (A,P)](#list-quotes)
     - [Pay a quote (A)](#pay-a-quote-a)
     - [Execute a quote (A)](#execute-a-quote-a)
<p></p>
  - [Invoices](#invoices)
     - [View an invoice (A)](#view-an-invoice-a)
     - [View an invoice (Public)](#view-an-invoice-public)
     - [List invoices (A,P)](#list-invoices-ap)
     - [Create an invoice (A)](#create-an-invoice-a)
     - [Payment buttons and creation through signed GET request](#payment-buttons-and-creation-through-signed-get-request)
     - [Payment callbacks](#payment-callbacks)
<p></p>
  - [Trading](#trading)
     - [Place an order (A)](#place-an-order-a)
     - [Cancel an order (A)](#cancel-an-order-a)
     - [View trades for an order (A)](#view-trades-for-an-order-a)
     - [View an order (A)](#view-an-order-a)
     - [List active orders (A,P)](#list-active-orders-ap)
     - [List all orders (A,P)](#list-all-orders-ap)
     - [Read the ticker](#read-the-ticker)     
<p></p>
  - [Coupons](#coupons)
     - [Create a coupon (A)](#create-a-coupon-a)
     - [View a coupon](#view-a-coupon)
     - [Redeem a coupon (A)](#redeem-a-coupon-a)

<p></p>

 - [**Appendix**](#appendix)
    - [Codes and types tables](#codes-and-types-tables)
       - [Currencies](#currencies)
       - [Operation types](#operation-types)
       
       - [States](#states)
          - [Transfer (Bitcoin transfer, Wire transfers) statuses](#transfer-bitcoin-transfer-wire-transfer-statuses)
          - [Coupon statuses](#coupon-statuses)
          - [E-mail transfer statuses](#e-mail-transfer-statuses)
          - [Invoice statuses](#invoice-statuses)
          - [Trade order statuses](#trade-order-statuses)


# General API description

## Authentication

Calls that require authentication are marked with "A" in the call description title.

Authentication and authorization may be done with :

 - HTTP Basic
 - [OAuth2](http://oauth.net/2/)

OAuth2 is useful when it is not desirable for client apps to handle the user's credentials directly or when it is necessary to have access to an account with limited privileges.

Each API call description mentions the OAuth2 scope required to use it.

The available OAuth2 scopes are : 

| Scope    | Description                                                                        |
|----------|------------------------------------------------------------------------------------|
| read     | Read transaction history, balances and profile information                         |
| withdraw | Perform API calls that result in money being sent or withdrawn from the account    |
| trade    | Manage trade orders (create, read, cancel)                                         |
| merchant | Manage invoices, read merchant dashboard and data                                  |
| devices  | Manage devices                                                                     |

## Base URL

The base URL for all calls is `https://bitcoin-central.net`. A complete URL would look like this `https://bitcoin-central.net/api/v1/quotes/3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d`.

## Formats and required HTTP request headers

The API will only answer with JSON or empty responses. It expects parameters to be passed in JSON with the correct `Content-Type: application/json` being set.

## Rate-limiting

API calls are rate-limited by IP to 5000 calls per day. Information about the status of the limit can be found in the `X-RateLimit-Limit` and `X-RateLimit-Remaining` HTTP headers.

**Example response with rate-limit headers**

    HTTP/1.1 200  
    Content-Type: application/json; charset=utf-8
    X-Ratelimit-Limit: 5000
    X-Ratelimit-Remaining: 4982
    Date: Wed, 30 Jan 2013 12:08:58 GMT


## Pagination

Some API calls returning collections may be paginated. In this case the call description title mentions it.

Calls that return paginated data are marked with "P" in the call description title.

### HTTP response header

Calls that return paginated collections will add a `Pagination` HTT header to the response. It will contain a pagination meta-data JSON object.

**Pagination header example**

    {
      // Whether the current page is the first of the collection
      "first_page": true,

      // Total amount of available pages
      "total_pages": 1,

      // Previous page number
      "previous_page": null,

      // Total number of items in the collection
      "total": 1,

      // Next page number
      "next_page": null,

      // Whether the current page is the last available one
      "last_page": true,

      // Record collection offset
      "offset": 0
    }

### Controlling pagination

Optional pagination parameters may be passed in the request URI in order to control the way the collection gets paginated. If parameters are incorrect a HTTP 400 Bad request status is returned along with an empty body.

| Parameter  | Default |	Acceptable values              |
|-----------|---------|--------------------------------|
| page      | 1       | Positive integer >0            |
| per_page  | 20      | Positive integer >=5 and <=100 |

## Localization

The relevant results and error messages will be localized to the language associated to the user, currently English and French are supported.

## Error handling

Whenever an error is encountered, the answer to a JSON API call will have :

 * An HTTP 422 status (Unprocessable entity) or HTTP 400 (Bad request),
 * A JSON array of localized error messages as body

## Successful calls

If the API call was successful, the platform will answer with :

 * An HTTP 200 status (OK) or HTTP 201 (Created),
 * A JSON representation of the entity being created or updated if relevant



# API Calls

## Account operations

An account operation is any ledger operation that changes the account's balance.

These calls require the `read` OAuth2 scope.

### Get the details of an account operation (A)
   
This call will return the details of a single account operation, the response contains : the UUID identifying the operation, the amount of this particular operation, its currency, its creation timestamp, its state (if relevant), a string indicating the type of the operation and the account balance that this operation led to (the sum of all transactions in the same currency including this one but not the ones that came after it).

**Request path :** `/api/v1/account_operations/{uuid}`

**Request method :** `GET`

**Request parameters**

| Name | Type | Description                   |
|------|------|-------------------------------|
| uuid | UUID | UUID of the account operation |

**Response**

A JSON object with the following attributes is returned :

| Name       | Type     | Description                                       |
|------------|----------|---------------------------------------------------|
| uuid       | UUID     | UUID of the account operation                     |
| amount     | Decimal  | Amount of the operation (1)                       |
| currency   | String   | Currency of the operation (2)                     |
| created_at | Datetime | Timestamp of operation creation                   |
| state      | String   | Operation state if relevant, `null` otherwise (3) |
| type       | String   | Operation type (4)                                |

 1. Credits are expressed as positive amounts, debits are expressed as negative amounts
 2. See currencies table
 3. See states table
 4. See operation types table
 
**Example request :** `GET /api/v1/account_operations/3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d`

**Example response :**
     
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
      "amount" : 50.0,
      "currency" : "EUR",
      "created_at" : "2013-01-14T16:28:57Z",
      "state" : null,
      "type" : "wire_deposit",
      "balance" : 550.0
    }
   
### Get a list of account operations (A,P)
   
This call will return a paginated list of account operations relative to the authenticated account.

**Request path :** `/api/v1/account_operations`

**Request method :** `GET`

**Request parameters**

_None_

**Response**

A JSON array of account operations is returned. The structure collection elements is detailed at "Get the details of an account operation".
 
**Example request :** `GET /api/v1/account_operations`

**Example response :**
    
	[ 
      {
        "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
        "amount" : 50.0,
        "currency" : "EUR",
        "created_at" : "2013-01-14T16:28:57Z",
        "state" : null,
        "type" : "wire_deposit",
        "balance" : 550.0
      },
      {
        "uuid" : "b3c08962-4dc3-9ffc-4dc3-3a7bc1b2ff4d",
        "amount" : 500.0,
        "currency" : "EUR",
        "created_at" : "2013-01-10T12:45:50Z",
        "state" : null,
        "type" : "wire_deposit",
        "balance" : 500.0
      }      
    ]

## Send money

These calls require the `withdraw` OAuth2 scope.

### Send Bitcoins (A)

This call will perform a Bitcoin transaction.

**Request path :** `/api/v1/transfers/send_bitcoins`

**Request method :** `POST`

**Request parameters**

| Name    | Type    | Description                 |
|---------|---------|-----------------------------|
| amount  | Decimal | Amount to send              |
| address | String  | Recipient's Bitcoin address |

**Response**

An `UUID` is returned after the request is queued for execution. It enables the client to make subsequent status check requests.
 
**Example request :** `POST /api/v1/transfers/send_bitcoins`

    {
      "amount" : 10.0,
      "address" : "1KfNzSKFAmpC4kNYaGLqj8LGPHxGmRG2nZ"
    }

**Example response :**
    
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d"     
    }

### Send money to an e-mail address (A)

This call will move money to the account identified with the given e-mail address. If no such account is found an e-mail gets sent inviting its recipient to create an account, or sign-in to one to retrieve the sent funds. If the amount isn't claimed after a week the funds are returned to the sender.

**Request path :** `/api/v1/transfers/send_to_email`

**Request method :** `POST`

**Request parameters**

| Name     | Type    | Description                               |
|----------|---------|-------------------------------------------|
| amount   | Decimal | Amount to send                            |
| currency | String  | Currency in which the amount is expressed |
| address  | String  | Recipient's e-mail address                |

**Response**

An `UUID` is returned after the request is queued for execution. It enables the client to make subsequent status check requests.
 
**Example request :** `POST /api/v1/transfers/send_bitcoins`

    {
      "amount" : 10.0,
      "currency" : "EUR",
      "address" : "david@bitcoin-central.net"
    }

**Example response :**
    
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d"     
    }

## Quotes

Quotes are a mechanism for clients to send funds or exchange them to other currencies. They provide clients with a guaranteed fixed-rate at which the system will convert their funds before crediting them to their account or send them out.

The canonical use of a quote is to pay in currency to a Bitcoin invoice, materialized as a QR code :

 1. User scans Bitcoin QR code
 2. Client app extracts requested Bitcoin amount
 3. Client app requests a quote for this Bitcoin amount to the API and provides the currency in which debit upon quote payment
 4. A guaranteed rate is returned by the API
 5. Client app shows price expressed in the user's currency
 6. After user confirmation the client app instructs the API to pay the quote to a specific Bitcoin address
 7. The merchant receives the payment in Bitcoin and the user is debited in his native currency
 
These calls require the `trade` OAuth2 scope, the [Pay a quote](#pay-a-quote-a) action requires the `withdraw` scope.

### Create a quote (A)

This call will create a quote. When doing so clients must specify a currency (the other currency is always assumed to be "BTC") an amount they are requesting and a direction. Combining these parameters in various ways will have the system address a wide array of use cases. 

For example a client can request :

 1. How much BTC would need to be sold to get exactly 10 EUR
 2. How much BTC could be bought with 10 EUR
 3. How much EUR would the sale of 1 BTC get
 4. How much EUR would be required to buy 1 BTC

To obtain the relevant quote a client would pass the following parameters :

| Case | Currency | direction | requested\_btc\_amount | requested\_currency\_amount |
|------|----------|-----------|------------------------|-----------------------------|
| 1    | EUR      | sell      | N/A                    | 10                          |
| 2    | EUR      | buy       | N/A                    | 10                          |
| 3    | EUR      | sell      | 1                      | N/A                         |
| 4    | EUR      | buy       | 1                      | N/A                         |

**Request path :** `/api/v1/quotes`

**Request method :** `POST`

**Request parameters**

| Name                        | Type    | Description                                                            |
|-----------------------------|---------|------------------------------------------------------------------------|
| requested\_currency\_amount | Decimal | Constrain on the currency amount (1)                                   |
| requested\_btc\_amount      | Decimal | Constrain on the Bitcoin amount  (1)                                   |
| direction                   | String  | Whether the quote should apply to a sale or a purchase of Bitcoins (2) |
| currency                    | String  | Currency in which the requested_amount is expressed                    |

 1. Exactly one of the currencies must be constrained, the other parameter may be omitted
 2. Acceptable values are `buy` and `sell`

**Response**

A JSON object with the following parameters is returned. If the current market depth or volatility does not allow for a quote to be given an error will be returned.

| Name                        | Type     | Description                                           |
|-----------------------------|----------|-------------------------------------------------------|
| uuid                        | UUID     | Quote identifier                                      |
| requested\_currency\_amount | Decimal  | The instructed currency amount or `null`              |
| requested\_btc\_amount      | Decimal  | The instructed Bitcoin amount or `null`               |
| direction                   | String   | The direction you provided                            |
| currency_amount             | Decimal  | The quoted currency amount or `null`                  | 
| btc_amount                  | Decimal  | The quoted Bitcoin amount or `null`                   | 
| rate                        | Decimal  | The quoted exchange rate                              |
| valid_until                 | Datetime | The timestamp at which this quote will be invalidated |
| created_at                  | Datetime | The creation date timestamp                           |
| executed                    | Boolean  | Whether this quote has already been settled or paid   |   


**Example request :** `POST /api/v1/quotes`

This demonstrates how to obtain a quote as described in the example use case #1.

    {
      "requested_amount" : 10.0,
      "currency" : "EUR",
      "direction" : "sell"
    }

**Example response :**
    
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
      "currency" : "EUR",
      "direction" : "sell",
      "rate" : 10.65
      "currency_amount" : null,
      "btc_amount" : 0.93896714
      "requested_currency_amount" : 10,
      "requested_btc_amount" : null,
      "valid_until" : "2013-01-10T13:00:50Z",
      "created_at" : "2013-01-10T12:45:50Z",
      "executed" : false
    }

### View a quote (A)

This call will return a JSON object representing a quote

**Request path :** `/api/v1/quotes/{uuid}`

**Request method :** `GET`

**Request parameters**

| Name | Type | Description      |
|------|------|------------------|
| uuid | UUID | Quote identifier |


**Response**

A JSON object with the following parameters is returned.

| Name                        | Type     | Description                                           |
|-----------------------------|----------|-------------------------------------------------------|
| uuid                        | UUID     | Quote identifier                                      |
| requested\_currency\_amount | Decimal  | The instructed currency amount or `null`              |
| requested\_btc\_amount      | Decimal  | The instructed Bitcoin amount or `null`               |
| direction                   | String   | The direction you provided                            |
| currency_amount             | Decimal  | The quoted currency amount or `null`                  | 
| btc_amount                  | Decimal  | The quoted Bitcoin amount or `null`                   | 
| rate                        | Decimal  | The quoted exchange rate                              |
| valid_until                 | Datetime | The timestamp at which this quote will be invalidated |
| created_at                  | Datetime | The creation date timestamp                           |
| executed                    | Boolean  | Whether this quote has already been settled or paid   |   


**Example request :** `GET /api/v1/quotes/3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d`

**Example response :**
    
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
      "currency" : "EUR",
      "direction" : "sell",
      "rate" : 10.65
      "currency_amount" : null,
      "btc_amount" : 0.93896714
      "requested_currency_amount" : 10,
      "requested_btc_amount" : null,
      "valid_until" : "2013-01-10T13:00:50Z",
      "created_at" : "2013-01-10T12:45:50Z",
      "executed" : false
    }

### List quotes (A,P)

This call will return a paginated list of quotes for the client account.

**Request path :** `/api/v1/quotes`

**Request method :** `GET`

**Request parameters**

N/A

**Response**

A JSON array of quote objects is returned.

**Example request :** `GET /api/v1/quotes`

**Example response :**
    
	[
   	  {
        "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
        "currency" : "EUR",
        "direction" : "sell",
        "rate" : 10.65
        "currency_amount" : null,
        "btc_amount" : 0.93896714
        "requested_currency_amount" : 10,
        "requested_btc_amount" : null,
        "valid_until" : "2013-01-10T13:00:50Z",
        "created_at" : "2013-01-10T12:45:50Z",
        "executed" : true
      },
      {
        "uuid" : "4dc33a7bc1b2-9b7e-3a7b-9ffc-b3c08962ff4d",
        "currency" : "EUR",
        "direction" : "sell",
        "rate" : 10.65
        "currency_amount" : null,
        "btc_amount" : 0.93896714
        "requested_currency_amount" : 10,
        "requested_btc_amount" : null,
        "valid_until" : "2013-01-10T13:00:50Z",
        "created_at" : "2013-01-10T12:45:50Z",
        "executed" : true
      }
    ]

### Pay a quote (A)

This action applies to quotes for buying BTC. It will perform the exchange creating a user account debit of the calculated `currency_amount` or instructed `requested_currency_amount` and send out the calculated `btc_amount` or instructed `requested_btc_amount` to the Bitcoin address in the `address` field.

**Request path :** `/api/v1/quotes/{uuid}/pay`

**Request method :** `POST`

**Request parameters**

| Name    | Type   | Description           |
|---------|--------|-----------------------|
| uuid    | UUID   | Quote identifier      |
| address | String | Valid Bitcoin address |


**Response**

A quote JSON object is returned.

**Example request :** `GET /api/v1/quotes/3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d/pay`

**Example response :**
    
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
      "currency" : "EUR",
      "direction" : "sell",
      "rate" : 10.65
      "currency_amount" : null,
      "btc_amount" : 0.93896714
      "requested_currency_amount" : 10,
      "requested_btc_amount" : null,
      "valid_until" : "2013-01-10T13:00:50Z",
      "created_at" : "2013-01-10T12:45:50Z",
      "executed" : true
    }

### Execute a quote (A)

This action applies to quotes for buying BTC. It will perform the exchange creating user account debit and credit operations depending on the quote requested.

**Request path :** `/api/v1/quotes/{uuid}/execute`

**Request method :** `POST`

**Request parameters**

| Name    | Type   | Description           |
|---------|--------|-----------------------|
| uuid    | UUID   | Quote identifier      |


**Response**

A quote JSON object is returned.

**Example request :** `POST /api/v1/quotes/3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d/execute`

**Example response :**
    
    {
      "uuid" : "3a7bc1b2-9b7e-4dc3-9ffc-b3c08962ff4d",
      "currency" : "EUR",
      "direction" : "sell",
      "rate" : 10.65
      "currency_amount" : null,
      "btc_amount" : 0.93896714
      "requested_currency_amount" : 10,
      "requested_btc_amount" : null,
      "valid_until" : "2013-01-10T13:00:50Z",
      "created_at" : "2013-01-10T12:45:50Z",
      "executed" : true
    }

## Invoices

Invoices are requests for payment. They can be expressed in any arbitrary currency. They all get a unique Bitcoin payment address assigned and a Bitcoin amount calculated from the requested currency amount.

Payment can be made by sending the `btc_amount` amount of Bitcoins to the `payment_address` address or directly in the requested currency from another account. The invoice payment will trigger a `POST`to the `callback_url`.

These calls require the `merchant` OAuth2 scope.

### View an invoice (A)

This call will return a JSON object representing an invoice

**Request path :** `/api/v1/invoices/{uuid}`

**Request method :** `GET`

**Request parameters**

| Name | Type | Description      |
|------|------|------------------|
| uuid | UUID | Quote identifier |


**Response**

A JSON object with the following parameters is returned.

| Name                      | Type     | Description                                                     |
|---------------------------|----------|-----------------------------------------------------------------|
| uuid                      | UUID     | Invoice identifier                                              |
| state                     | String   | Invoice state _(see appendix)_                                  | 
| payment\_address          | String   | Bitcoin payment address                                         | 
| payment\_bitcoin_\uri     | String   | Payment URI, should be used to generate QR codes                |
| amount                    | Decimal  | Requested amount to be credited upon payment                    | 
| btc_amount                | Decimal  | Payable amount expressed in BTC                                 |
| amount\_to\_pay           | Decimal  | Amount left to pay                                              |
| btc\_amount\_to\_pay      | Decimal  | Bitcoin amount amount left to pay                               |
| currency                  | String   | Currency in which the amount is expressed                       |
| merchant\_reference       | String   | Merchant reference                                              |
| merchant\_memo            | String   | Merchant memo                                                   |
| callback\_url             | String   | URL to which a callback should be made when the invoice is paid |
| item\_url                 | String   | Order-related URL                                               |
| paid\_at                  | Datetime | Payment timestamp                                               |
| created\_at               | Datetime | Creation timestamp                                              |
| updated\_at               | Datetime | Update timestamp                                                |
| expires\_at               | Datetime | Expiration timestamp                                            |
| settled                   | Boolean  | Has this invoice already been credited ?                        |
| notification\_email\_sent | Boolean  | Has the notification e-mail already been sent ?                 |
| public\_url               | String   | The URL at which this invoice is publicly visible and payable   |


**Example request :** `GET /api/v1/invoices/70c7936b-f8ce-443a-8338-3762de0a1e92`

**Example response :**
    
    {
      "uuid": "70c7936b-f8ce-443a-8338-3762de0a1e92",    
      "amount": 10.0, 
      "amount_to_pay": 10.0,
      "btc_amount": 1.021732,
      "btc_amount_to_pay": 1.021732, 
      "notification_email_sent": false, 
      "callback_url": null, 
      "created_at": "2013-01-21T10:20:07Z", 
      "currency": "EUR", 
      "expires_at": "2013-01-21T10:40:07Z", 
      "item_url": null, 
      "merchant_memo": null, 
      "merchant_reference": null, 
      "paid_at": null, 
      "payment_address": "1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz", 
      "payment_bitcoin_uri" : "bitcoin:1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz?amount=100.0&label=&x-pay-curamt=100.0&x-pay-cur=BTC&x-pay-id=7653453d-6372-4ffa-bc56-1e3182ef7f35",       
      "settled": false, 
      "state": "pending", 
      "updated_at": "2013-01-21T10:20:07Z",
      "public_url": "https://paytunia.com/invoices/70c7936b-f8ce-443a-8338-3762de0a1e92"
    }

### View an invoice (Public)

It is the same call as the above one, except this call will return a subset of the JSON object representing an invoice. 

**Request path :** `/api/v1/invoices/{uuid}`

**Request method :** `GET`

**Request parameters**

| Name | Type | Description      |
|------|------|------------------|
| uuid | UUID | Quote identifier |


**Response**

A JSON object with the following parameters is returned.

| Name                | Type     | Description                                                     |
|---------------------|----------|-----------------------------------------------------------------|
| uuid                | UUID     | Invoice identifier                                              |
| state               | String   | Invoice state _(see appendix)_                                  | 
| payment\_address    | String   | Bitcoin payment address                                         |                    
| amount              | Decimal  | Requested amount to be credited upon payment                    | 
| btc_amount          | Decimal  | Payable amount expressed in BTC                                 |
| currency            | String   | Currency in which the amount is expressed                       |
| merchant\_reference | String   | Merchant reference                                              |
| merchant\_memo      | String   | Merchant memo                                                   |
| item\_url           | String   | Order-related URL                                               |
| paid\_at            | Datetime | Payment timestamp                                               |
| created\_at         | Datetime | Creation timestamp                                              |
| updated\_at         | Datetime | Update timestamp                                                |
| expires\_at         | Datetime | Expiration timestamp                                            |


**Example request :** `GET /api/v1/invoices/70c7936b-f8ce-443a-8338-3762de0a1e92`

**Example response :**
    
    {
      "uuid": "70c7936b-f8ce-443a-8338-3762de0a1e92",    
      "amount": 10.0, 
      "btc_amount": 1.021732, 
      "callback_fired": false, 
      "callback_url": null, 
      "created_at": "2013-01-21T10:20:07Z", 
      "currency": "EUR", 
      "expires_at": "2013-01-21T10:40:07Z", 
      "item_url": null, 
      "merchant_memo": null, 
      "merchant_reference": null, 
      "paid_at": null, 
      "payment_address": "1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz",
      "payment_bitcoin_uri" : "bitcoin:1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz?amount=100.0&label=&x-pay-curamt=100.0&x-pay-cur=BTC&x-pay-id=7653453d-6372-4ffa-bc56-1e3182ef7f35", 
      "settled": false, 
      "state": "pending", 
      "updated_at": "2013-01-21T10:20:07Z"
    }

### List invoices (A,P)

This call will return a paginated list of invoices for the client account.

**Request path :** `/api/v1/invoices`

**Request method :** `GET`

**Request parameters**

N/A

**Response**

A JSON array of invoice objects is returned.

**Example request :** `GET /api/v1/quotes`

**Example response :**
    
	[
      {
        "uuid": "8338936b-f8ce-443a-70c7-3762de0a1e92",    
        "amount": 10.0, 
        "btc_amount": 1.021732, 
        "callback_fired": false, 
        "callback_url": null, 
        "created_at": "2013-01-21T10:20:07Z", 
        "currency": "EUR", 
        "expires_at": "2013-01-21T10:40:07Z", 
        "item_url": null, 
        "merchant_memo": null, 
        "merchant_reference": null, 
        "paid_at": null, 
        "payment_address": "1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz", 
        "settled": false, 
        "state": "pending", 
        "updated_at": "2013-01-21T10:20:07Z"
      },
      {
        "uuid": "70c7936b-f8ce-443a-8338-3762de0a1e92",    
        "amount": 10.0, 
        "btc_amount": 1.021732, 
        "callback_fired": false, 
        "callback_url": null, 
        "created_at": "2013-01-21T10:20:07Z", 
        "currency": "EUR", 
        "expires_at": "2013-01-21T10:40:07Z", 
        "item_url": null, 
        "merchant_memo": null, 
        "merchant_reference": null, 
        "paid_at": null, 
        "payment_address": "1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz", 
        "settled": false, 
        "state": "pending", 
        "updated_at": "2013-01-21T10:20:07Z"
      }
    ]

### Create an invoice (A)

This call creates an invoice

**Request path :** `/api/v1/invoices`

**Request method :** `POST`

**Request parameters**

| Name                | Type    | Description                                                                  |
|---------------------|---------|------------------------------------------------------------------------------|
| amount              | Decimal | Requested amount to be credited upon payment                                 |
| currency            | String  | Currency in which the amount is expressed                                    |
| merchant\_reference | String  | Merchant reference _(optional)_                                              |
| merchant\_memo      | String  | Merchant memo _(optional)_                                                   |
| callback\_url       | String  | URL to which a callback should be made when the invoice is paid _(optional)_ |
| item\_url           | String  | Order-related URL _(optional)_                                               |

**Response**

An invoice JSON object is returned.

**Example request :** `POST /api/v1/invoices`

    {
      "amount" : 10.0, 
      "currency" : "EUR"
    }

**Example response :**
    
    {
      "uuid": "70c7936b-f8ce-443a-8338-3762de0a1e92",    
      "amount": 10.0, 
      "btc_amount": 1.021732, 
      "callback_fired": false, 
      "callback_url": null, 
      "created_at": "2013-01-21T10:20:07Z", 
      "currency": "EUR", 
      "expires_at": "2013-01-21T10:40:07Z", 
      "item_url": null, 
      "merchant_memo": null, 
      "merchant_reference": null, 
      "paid_at": null, 
      "payment_address": "1JnjJNhdKSgvMKr6xMbqVEudB3eACsGJSz", 
      "settled": false, 
      "state": "pending", 
      "updated_at": "2013-01-21T10:20:07Z"
    }

### Payment buttons and creation through signed GET request

This approach can be used when it is not desirable to create invoices before presenting them to the user, to create payment buttons, or when the previous flow is not practical.

The approach will let a merchant securely redirect a customer to a the payment page that will generate an invoice on the fly for this particular request.

The URL includes :

 - The merchant's account number,
 - A `query` parameter describing the payment,
 - A unique token used to make these invoice creations non-replayable,
 - A signature string created by hashing a shared secret along with the invoice data
 
The current value of the shared secret for each account is available on the account details page.
 
All parameters are passed in the query-string.

**Request path :** `/api/v1/invoices/create_unauthenticated`

**Request method :** `GET`

**Request parameters**

| Name      | Value                                                         |
|-----------|---------------------------------------------------------------|
| merchant  | Merchant account number                                       |
| token     | A globally unique token, a random UUID is recommended         |
| query     | The invoice parameters                                        |
| signature | The SHA256 hash of `merchant + shared_secret + token + query` |

**Building the query parameter**

The `query` parameter is created by building a string with parameters separated with the pipe character "|". Optional parameters may use a blank value.

The parameters should be concatenated according to the following model :

    AMOUNT_IN_CENTS|CURRENCY|MERCHANT_REFERENCE|MERCHANT_MEMO|CALLBACK_URL|ITEM_URL
    
For example, to create a payment for 12.58 EUR with the "123456" reference and `https://example.com/callback` callback URL the query should look like this :

    1258|EUR|123456||https://example.com/callback|


#### Full example

A merchant wishes to display a link redirecting to a Paytunia payment page, his shared secret is `792fae4f81c12764c4e4f570920fbe89`, he wishes to create an invoice for 10 EUR with the reference "SALE-42" and a "Hello world" merchant memo, his account number is "PY-123456". The URLs are `https://example.com/callback` and `https://merchant.com/orders/SALE-42`

First, the `query` parameter must be constructed, it should look like :
 
    1000|EUR|SALE-42|Hello world|https://example.com/callback|https://merchant.com/orders/SALE-42
    
Then a unique token should be generated, a random UUID is perfect, we'll use `46113b61-1590-447a-9bab-ceb4a5586aa9`

The signature should then be generated by hashing the following string with SHA256 :

    # Hashed string
    PY-123456792fae4f81c12764c4e4f570920fbe8946113b61-1590-447a-9bab-ceb4a5586aa91000|EUR|SALE-42|Hello world|https://example.com/callback|https://merchant.com/orders/SALE-42
    
    # Signature generated in command-line
    $ echo -n "PY-123456792fae4f81c12764c4e4f570920fbe8946113b61-1590-447a-9bab-ceb4a5586aa91000|EUR|SALE-42|Hello world|https://example.com/callback|https://merchant.com/orders/SALE-42" | sha256sum
    
    -> 8e26068a13cbf81dac5ddca203897bbafc5a227411b36771cebcf7aad693d0ab

Finally, the full URL can be generated by appending the URL-encoded parameters as following :

    https://bitcoin-central.net/api/v1/invoices/create_unauthenticated?merchant=PY-123456&token=46113b61-1590-447a-9bab-ceb4a5586aa9&signature=8e26068a13cbf81dac5ddca203897bbafc5a227411b36771cebcf7aad693d0ab&query=PY-123456792fae4f81c12764c4e4f570920fbe8946113b61-1590-447a-9bab-ceb4a5586aa91000%7CEUR%7CSALE-42%7CHello+world%7Chttps%3A%2F%2Fexample.com%2Fcallback%7Chttps%3A%2F%2Fmerchant.com%2Forders%2FSALE-42

### Payment callbacks

When a payment is received for an invoice the backend will perform an HTTP POST to the URL given as `callback_url`. The content-type for the request will be `application/x-www-form-urlencoded`.

The parameters sent are the exact same as the ones returned by a [view invoice](#view-an-invoice-a).

The callback is not guaranteed to be fired and may be fired multiple times, the receiver must take it into account when designing a proper handling logic.

#### Signature headers

A `X-Paytunia-Signature` header is added to all callback requests. Its purpose is to authenticate the call from the backend to the callback URL, this signature **must** be properly checked by the receiving server in order to ensure that the request is legitimate and hasn't been tampered with.

The signature is computed by concatenating the raw request body with the client's shared secret and applying a SHA256 hash function to it.

**Example signed callback request :**

In this example the client secret is `792fae4f81c12764c4e4f570920fbe89`.

    POST / HTTP/1.1
    Accept: */*
    User-Agent: Ruby
    Content-Type: application/x-www-form-urlencoded
    X-Paytunia-Signature: ab9c3b33631e40d2880b2c4cf5bdf894bf42d6ea115dd2de71277e4382aaaeab
    Connection: close
    Host: lvh.me:3000
    Content-Length: 642

    uuid=cbfb237f-dd9e-47bd-b18b-73b2f4ccdb51&state=paid&btc_amount=100.0&payment_address=1FXWhKPChEcUnSEoFQ3DGzxKe44MDbat0.42903373550437307&payment_bitcoin_uri=bitcoin%3A1FXWhKPChEcUnSEoFQ3DGzxKe44MDbatz%3Famount%3D0.0%26label%3D%26x-pay-cur%3DBTC%26x-pay-id%3Dcbfb237f-dd9e-47bd-b18b-73b2f4ccdb51&callback_url=http%3A%2F%2Flvh.me%3A3000%2F&paid_at=2013-02-08+12%3A22%3A39+UTC&created_at=2013-02-08+12%3A22%3A39+UTC&updated_at=2013-02-08+12%3A22%3A39+UTC&merchant_reference&merchant_memo&item_url&notification_email_sent=true&currency=BTC&amount=100.0&settled=false&expires_at=2013-02-08+12%3A42%3A39+UTC&amount_to_pay=0.0&btc_amount_to_pay=0.0
    
In Ruby this signature can be easily checked by doing `Digest::SHA2.hexdigest(data + secret)` where `data` is the raw request body and `secret` is the client's shared secret.

## Trading

These calls require the `trade` OAuth2 scope.

### Place an order (A)

This call will place a trade order and queue it for execution.

**Request path :** `/api/v1/trade_orders`

**Request method :** `POST`

**Request parameters**

| Name     | Type    | Description                                      |
|----------|---------|--------------------------------------------------|
| amount   | Decimal | Amount of Bitcoins to trade                      |
| currency | String  | Currency to trade against                        |
| price    | Decimal | Price _(may be omitted to place a market order)_ |
| type     | String  | Must be `buy` (bid) or `sell` (ask)              |

**Response**

An trade order JSON object is returned with the following parameters

| Name              | Type     | Description                       |
|-------------------|----------|-----------------------------------|
| uuid              | UUID     | Trade order identifier            |
| amount            | Decimal  | Remaining Bitcoin amount to trade |
| instructed_amount | Decimal  | Amount of Bitcoins to trade       |
| currency          | String   | Currency to trade against         |
| price             | Decimal  | Price _(null for a market order)_ |
| type              | String   | Either `buy` or `sell`            |
| created_at        | Datetime | Creation timestamp                |
| updated_at        | Datetime | Update timestamp                  |

**Example request :** `POST /api/v1/trade_orders`

    {
      "amount" : 10.0, 
      "type" : "buy",
      "currency" : "EUR"
    }

**Example response :**
    
    {
      "amount": 10.0, 
      "type": "buy", 
      "created_at": "2013-01-21T22:07:15Z", 
      "instructed_amount": 10.0, 
      "price": null, 
      "state": "pending_execution", 
      "updated_at": "2013-01-21T22:07:15Z", 
      "uuid": "8b3c3446-9c5d-48a8-8044-08622cd4607b"
    }

### Cancel an order (A)

This call will enqueue a cancel order job to remove it from the order book.

**Request path :** `/api/v1/trade_orders/{uuid}`

**Request method :** `DELETE`

**Request parameters**

| Name | Type | Description            |
|------|------|------------------------|
| uuid | UUID | Trade order identifier |

**Example request :** `DELETE /api/v1/trade_orders/8b3c3446-9c5d-48a8-8044-08622cd4607b`

**Example response :**

N/A

### View trades for an order (A)

This call will return a collection of trades that were executed for a particular order.

**Request path :** `/api/v1/trade_orders/{uuid}/trades`

**Request method :** `GET`

**Request parameters**

| Name | Type | Description            |
|------|------|------------------------|
| uuid | UUID | Trade order identifier |

**Response**

An array of trade JSON objects is returned.

| Name            | Type     | Description                                      |
|-----------------|----------|--------------------------------------------------|
| uuid            | UUID     | Trade identifier                                 |
| traded_currency | Decimal  | Amount traded, expressed in `currency`           |
| traded_btc      | Decimal  | Amount of Bitcoins traded                        |
| currency        | String   | Currency in which `traded_currency` is expressed |
| price           | Decimal  | Price at which the exchange was made             |
| created_at      | Datetime | Creation timestamp                               |



**Example request :** `GET /api/v1/trade_orders/8b32ddf1-1675-4ed3-b1bb-b4efc4ecd98c/trades`

**Example response :**

    [
      {
        "created_at": "2013-01-22T08:19:41Z", 
        "currency": "EUR", 
        "price": 5.0, 
        "traded_btc": 980.0, 
        "traded_currency": 4940.0, 
        "uuid": "1c86abf0-170a-4101-84d1-cdad913c95dd"
      },
      {
        "created_at": "2013-01-22T08:19:41Z", 
        "currency": "EUR", 
        "price": 6.0, 
        "traded_btc": 10.0, 
        "traded_currency": 60.0, 
        "uuid": "170aabf0-1c86-4101-84d1-cdad913c95dd"
      }      
    ]

### View an order (A)

This call will return a trade order JSON object. 

**Request path :** `/api/v1/trade_orders/{uuid}`

**Request method :** `GET`

**Request parameters**

| Name | Type | Description      |
|------|------|------------------|
| uuid | UUID | Order identifier |

**Response**

A JSON object with the following parameters is returned.

| Name              | Type     | Description                       |
|-------------------|----------|-----------------------------------|
| uuid              | UUID     | Trade order identifier            |
| amount            | Decimal  | Remaining Bitcoin amount to trade |
| instructed_amount | Decimal  | Amount of Bitcoins to trade       |
| currency          | String   | Currency to trade against         |
| price             | Decimal  | Price _(null for a market order)_ |
| type              | String   | Either `buy` or `sell`            |
| created_at        | Datetime | Creation timestamp                |
| updated_at        | Datetime | Update timestamp                  |

**Example request :** `GET /api/v1/trade_orders/8b32ddf1-1675-4ed3-b1bb-b4efc4ecd98c`

**Example response :**
    
    {
      "amount": 10.0, 
      "type": "buy", 
      "created_at": "2013-01-22T08:19:37Z", 
      "instructed_amount": 1000.0, 
      "price": 11.0, 
      "state": "active", 
      "updated_at": "2013-01-22T08:19:41Z", 
      "uuid": "8b32ddf1-1675-4ed3-b1bb-b4efc4ecd98c"
    }

### List active orders (A,P)

This call will return a paginated list of the client's executable trade orders (`pending_execution`, `active` or `insufficient_funds` states).

**Request path :** `/api/v1/trade_orders/active`

**Request method :** `GET`

**Request parameters**

N/A

**Example request :** `GET /api/v1/trade_orders/active`

**Example response :**

    [  
      {
        "amount": 10.0, 
        "type": "buy", 
        "created_at": "2013-01-21T22:15:38Z", 
        "instructed_amount": 10.0, 
        "price": null, 
        "state": "pending_execution", 
        "updated_at": "2013-01-21T22:15:38Z", 
        "uuid": "52823408-972f-4551-acc5-e7d3f032c6d5"
      }
    ]

### List all orders (A,P)

This call will return a paginated list of the client's trade orders.

**Request path :** `/api/v1/trade_orders`

**Request method :** `GET`

**Request parameters**

N/A

**Example request :** `GET /api/v1/trade_orders`

**Example response :**

    [  
      {
        "amount": 10.0, 
        "type": "buy", 
        "created_at": "2013-01-21T22:15:38Z", 
        "instructed_amount": 10.0, 
        "price": null, 
        "state": "pending_execution", 
        "updated_at": "2013-01-21T22:15:38Z", 
        "uuid": "52823408-972f-4551-acc5-e7d3f032c6d5"
      }, 
      {
        "amount": 10.0, 
        "type": "buy", 
        "created_at": "2013-01-21T22:15:40Z", 
        "instructed_amount": 10.0, 
        "price": null, 
        "state": "canceled", 
        "updated_at": "2013-01-21T22:15:40Z", 
        "uuid": "6e3ea778-9ef7-4e4f-9910-85e735f7b42a"
      }
    ]

### Read the ticker

This call will return the ticker.

**Request path :** `/api/v1/ticker`

**Request method :** `GET`

**Request parameters**

N/A

**Example request :** `GET /api/v1/ticker`

**Example response :**

    {
      "ask": 20.4, 
      "at": 1361056527, 
      "bid": 20.1, 
      "currency": "eur", 
      "high": 20.74, 
      "low": 20.2, 
      "midpoint": 20.25, 
      "price": 20.2, 
      "variation": -1.4634, 
      "volume": 148.80193218
    }


## Coupons

Coupons are a way to easily move money between accounts, they are debited from the issuer's account upon creation and may be redeemed at anytime against any account (including the issuer).

They are materialized by a unique redemption code. This code should be kept private as anyone having knowledge of it can redeem the funds.

Creating a coupon requires the `withdraw` OAuth2 scope, other actions require the `read` scope.

### Create a coupon (A)

This call issues a coupon

**Request path :** `/api/v1/coupons`

**Request method :** `POST`

**Request parameters**

| Name                | Type    | Description                               |
|---------------------|---------|-------------------------------------------|
| amount              | Decimal | Currency value for the issued coupon      |
| currency            | String  | Currency in which the amount is expressed |

**Response**

A coupon code is returned

**Example request :** `POST /api/v1/coupons`

    {
      "amount" : 12.0, 
      "currency" : "EUR"
    }

**Example response :**
    
    {
      "code": "BP-EUR-9660407B43799CCED320"
    }

### View a coupon

This call will return a JSON object representing a coupon

**Request path :** `/api/v1/coupons/{code}`

**Request method :** `GET`

**Request parameters**

| Name | Type   | Description      |
|------|--------|------------------|
| code | String | Coupon code      |


**Response**

A JSON object with the following parameters is returned.

| Name                  | Type     | Description                               |
|-----------------------|----------|-------------------------------------------|
| uuid                  | UUID     | Coupon account operation identifier       |
| code                  | String   | Coupon code                               |
| state                 | String   | Coupon state _(see appendix)_             | 
| amount                | Decimal  | Coupon value                              | 
| currency              | String   | Currency in which the amount is expressed |
| created\_at           | Datetime | Creation timestamp                        |


**Example request :** `GET /api/v1/coupons/BP-EUR-9660407B43799CCED320`

**Example response :**
    
    {
      "amount": -12.0, 
      "code": "BP-EUR-9660407B43799CCED320", 
      "created_at": "2013-01-30T11:52:36Z", 
      "currency": "EUR", 
      "state": "pending", 
      "uuid": "c21adaf6-f5a2-4d93-a762-a63b89b52265"
    }

### Redeem a coupon (A)

This call will a redeem a coupon to the client's account. It returns an `UUID`, this identifier can be used to request details about the account operation created for the client's account by the redemption of the coupon (credit of the coupon value).

This call may be used to void a coupon by redeeming it against the account that issued it.

**Request path :** `/api/v1/coupons/redeem`

**Request method :** `POST`

**Request parameters**

| Name | Type   | Description      |
|------|--------|------------------|
| code | String | Coupon code      |

**Response**

A JSON object with the following parameters is returned.

| Name                  | Type     | Description                               |
|-----------------------|----------|-------------------------------------------|
| uuid                  | UUID     | Redemption account operation identifier   |

**Example request :** `POST /api/v1/coupons`

    {
      "code": "BP-EUR-9660407B43799CCED320"
    }

**Example response :**
    
    {
      "uuid": "3e0004cd-158c-40d6-b8f9-f4b672e86308"
    }

# Appendix

## Codes and types tables

### Currencies

The following currencies are available :

| Symbol | Currency       |
|--------|----------------|
| BTC    | Bitcoin        |
| EUR    | Euro           |
| GBP    | Pound Sterling |
| USD    | US Dollar      |


### Operation types

| Type                        | Description                                             |
|-----------------------------|---------------------------------------------------------|
| fee                         | Trading fee                                             |
| coupon                      | Issue of a redeemable code                              |
| bitcoin_transfer            | Bitcoin withdrawal                                      |
| wire_transfer               | Wire transfer withdrawal                                |
| email_transfer              | Transfer of funds to an e-mail address                  |
| coupon_redemption           | Redemption of a redeemable code                         |
| email\_transfer\_redemption | Redemption of an e-mail transfer                        |
| charge                      | Generic charge                                          |
| bank_charge                 | Bank charge                                             |
| invoice_credit              | Payment of an invoice you issued (credits your account) |
| invoice_payment             | Payment for an invoice (debits your account)            |
| wire_deposit                | Deposit by bank wire                                    |
| trade                       | Trade                                                   |
| reversal                    | Reversal                                                |

### States

#### Transfer (Bitcoin transfer, Wire transfer) statuses

The state of a transfer lets you check whether it has been sent out to the underlying network (banking network or Bitcoin network).

| State     | Description                           |
|-----------|---------------------------------------|
| pending   | The transfer hasn't been sent out yet |
| processed | The transfer has been sent out        |

#### Coupon statuses

| State    | Description                             |
|----------|-----------------------------------------|
| pending  | The coupon is valid and may be redeemed |
| redeemed | The coupon has already been redeemed    |
| canceled | The coupon was redeemed to the issuer   |

#### E-mail transfer statuses

| State                | Description                                                              |
|----------------------|--------------------------------------------------------------------------|
| pending_collection   | The recipient hasn't claimed the e-mail transfer amount yet              |
| canceled             | The e-mail transfer was canceled                                         |
| expired              | The transfer has expired                                                 |
| unreachable_receiver | An error occurred while sending the e-mail notification to its recipient |
| processed            | The recipient has collected the sent amount                              |

#### Invoice statuses

| State          | Description                                     |
|----------------|-------------------------------------------------|
| pending        | The invoice is pending payment                  |
| partially_paid | The invoice has a partially confirmed payment   |       
| confirming     | A full or over-payment is confirming            |
| paid           | The invoice has a confirmed payment             |
| overpaid       | The invoice has a confirmed over-payment        |
| error          | The payment could not be converted as requested |

#### Trade order statuses

| State              | Description                                                                    |
|--------------------|--------------------------------------------------------------------------------|
| pending_execution  | The order has been queued for execution                                        |
| active             | The order has been executed but not filled it is visible in the order book (1) |
| filled             | The order has been filled                                                      |
| canceled           | The order has been canceled                                                    |
| insufficient_funds | The order cannot execute further due to lack of funds (2)                      |

 1. The amount shown in the order book is the amount that is actually executable given your balance, not necessarily the instructed amount
 2. Order execution resumes as soon as more funds are available

# Left TODO

## Websockets

 * Document the socket.io API
 
## Misc

 * Get an estimate (unsaved quote)
 * Add a `/me` API call
 * Add a call for account balances
