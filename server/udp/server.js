var PORT = 33333;
//var HOST = '127.0.0.1';
var HOST = '10.0.1.15';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {

    console.log(remote.address + ':' + remote.port +' - ' + message);
    // I added a server.send but it gave me an infinite loop in the server console

});

server.bind(PORT, HOST);