![Paymium logo](https://raw.githubusercontent.com/Paymium/api-documentation/master/logo.png)

### NEW : Java example connector now avaible [here](https://github.com/Paymium/fix-connector-example)

### NEW : Python example connector now avaible in the `contrib/` directory, kindly provided by one of our users

The Paymium FIX API allows developers to subscribe to real-time market updates using the Financial Information eXchange protocol in its 4.4 version. This API is currently in beta-testing phase.

Do not hesitate to contact the support for any issues or suggestions. We're also available on IRC at Freenode on the #paymium channel, ring davout for assistance.

## Currently supported
 - Subscription to the real-time depth

## On the roadmap
 - Ability to place orders and receive execution reports
 
# Using the FIX API

## Obtaining access
The API is not publicly available, you must request access to it through a support ticket. You will receive further instructions on how to establish a connection to our FIX acceptor.

## Managing the session
Once connected, your client is expected to issue a `Logon` message containing `PAYMIUM` as the `TARGET_COMP_ID`, a non-blank `Username` (553) field. Encryption is not supported, the `EncryptMethod` (98) field must be set to `0`.

The acceptor will then reply with a `Logon` message. From there on, `Heartbeat` messages are expected at regular intervals.

The acceptor will correctly handle `TestRequest` messages by replying with a matching `Heartbeat`. It will also handle a `ResendRequest` by resending the requested message range.

## Obtaining market data

Clients may issue a `MarketDataRequest` to subscribe to the depth feed. Typically it will allow a client to receive a snapshot of the current state of the order book once, followed by real-time incremental updates whenever the data changes. See the example session.


# Example FIX session
This session shows the message exchange between a client and the Paymium acceptor for the purpose of receiving market data updates.

Messages sent by the client are indicated by a `>>>` while received messages are prepended with a `<<<`. Separator bytes are replaces with pipe characters for clarity.

````
# The client connects and sends a Logon message, immediately followed by a Heartbeat (not really necessary at this point)
>>> 8=FIX.4.4|9=75|35=A|49=DAVID_SND|56=PAYMIUM|34=1|52=20141027-17:10:37|98=0|108=30|553=DVE|10=192|
>>> 8=FIX.4.4|9=55|35=0|49=DAVID_SND|56=PAYMIUM|34=2|52=20141027-17:10:37|10=219|

# The acceptor replies with a Logon
<<< 8=FIX.4.4|9=75|35=A|49=PAYMIUM|56=DAVID_SND|34=1|52=20141027-17:10:37|98=0|108=30|553=DVE|10=192|

# The client then sends a MarketDataRequest asking for the bids, asks, trades, open, close and VWAP of the EUR/XBT instrument
# The entry types are currently ignored, only bids and asks are returned, the instrument symbol value must however be correctly set to 'EUR/XBT'
>>> 8=FIX.4.4|9=138|35=V|49=DAVID_SND|56=PAYMIUM|34=3|52=20141027-17:10:40|262=X|263=2|264=0|265=1|267=6|269=0|269=1|269=2|269=4|269=5|269=9|146=1|55=EUR/XBT|10=188|

# The acceptor starts by returning a MarketDataSnapshot message (shortened for clarity)
<<< 8=FIX.4.4|9=13159|35=W|49=PAYMIUM|56=DAVID_SND|34=2|52=20141027-17:10:40|262=X|55=EUR/XBT|268=477|269=0|270=0.0001|271=65300.0|269=0|270=0.001|271=1000.0|269=0|270=0.01|271=100.0|269=0|270=0.1|271=1010.0|269=0|270=1.0|271=101.002308|269=0|270=2.94|271=1.0|269=0|270=5.0|271=0.01|270=1000000.0|271=0.2|10=171|

# The client regularly sends out Hearbeats
>>> 8=FIX.4.4|9=55|35=0|49=DAVID_SND|56=PAYMIUM|34=4|52=20141027-17:10:52|10=218|

# Whenever new data is available it is sent to the client by the acceptor
<<< 8=FIX.4.4|9=104|35=X|49=PAYMIUM|56=DAVID_SND|34=6|52=20141027-17:12:18|262=X|268=1|279=1|269=0|270=288.999|15=EUR|271=0|10=124|
<<< 8=FIX.4.4|9=104|35=X|49=PAYMIUM|56=DAVID_SND|34=7|52=20141027-17:12:19|262=X|268=1|279=1|269=0|270=288.999|15=EUR|271=0|10=126|
<<< 8=FIX.4.4|9=111|35=X|49=PAYMIUM|56=DAVID_SND|34=8|52=20141027-17:12:20|262=X|268=1|279=1|269=1|270=288.999|15=EUR|271=0.011361|10=208|
````
