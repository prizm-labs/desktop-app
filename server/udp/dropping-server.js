/*
 *  Node.js UDP echo server
 *
 *  This demonstration shows a basic echo server that has randomly drops responses.
 *  The drop factor is `threshold` 0.9 = 90% chance of succes, 10% dropped packets
 * 
 *  Additionally each response is delayed by 2-3 seconds.
 * 
 *  Listens on port 3007 by default. Pass in a desired port as cmdline argument.
 */

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var threshold = 0.99;

var localPort = null;

server.on("listening", function() {
  var address = server.address();
  console.log("Listening on " + address.address);
});

server.on("message", function(message, rinfo) {
  console.log("Recieved message from: " + rinfo.address + ":" + rinfo.port);
  

  // if local address, cache port number

  if (rinfo.address == '127.0.0.1') {
    localPort = rinfo.port;
    console.log('cached localPort',localPort);
    server.send(message, 0, message.length, localPort, '127.0.0.1', function(err, bytes) {
      console.log(err, bytes); 
    });
  }

  // route message from smartscreen to browser
  if (localPort !== null && rinfo.address !== '127.0.0.1'){
    console.log('message received from smarttouch server: \n', message);
    console.log('routing message to '+ '127.0.0.1' + ":" + localPort);
    server.send(message, 0, message.length, localPort, '127.0.0.1', function(err, bytes) {
      console.log(err, bytes); 
    });
  }
  
});

// server.on("message", function(message, rinfo) {
//   var delay = 2000+Math.random()*1000;
//   // Echo the message back to the client.
//   var dropped = Math.random();
//   if(dropped > threshold) {
//     console.log("Recieved message from: " + rinfo.address + ", DROPPED");
//     return;
//   }
//   console.log("Recieved message from: " + rinfo.address + ":" + rinfo.port);
//   setTimeout(function() {
//     server.send(message, 0, message.length, rinfo.port, rinfo.address, function(err, bytes) {
//       console.log(err, bytes); 
//     });
//   }, delay);
// });

server.on("close", function() {
  console.log("Socket closed");
});

var port = process.argv[2];
server.bind(port ? parseInt(port) : 33333);