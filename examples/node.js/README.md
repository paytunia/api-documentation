## bcjs

This is an example of how to use the Bicoin-Central API using Node.js, including handling OAuth2 callbacks and refresh tokens.

### Configuration

To use, you must register an application on Bitcoin-Central with redirection URI set to `http://localhost:8000/callback`.

Configuration is stored in `config.js`. You must set `appKey` and `appSecret` to your application's key and secret.

### Installation

1. install node.js
2. download this package
3. run `npm install`
4. run `npm link`
5. launch the app using `bcjs`
6. type `help` for a list of commands
