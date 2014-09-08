var io = require('socket.io-client');

socket = io.connect('https://paymium.com/public', {
  resource: 'ws/socket.io'
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
