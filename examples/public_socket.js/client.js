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
