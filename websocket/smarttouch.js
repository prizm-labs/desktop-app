#!/usr/bin/env node
/************************************************************************
 *  Copyright 2010-2011 Worlize Inc.
 *  
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  
 *      http://www.apache.org/licenses/LICENSE-2.0
 *  
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ***********************************************************************/

// https://github.com/theturtle32/WebSocket-Node/blob/master/docs/index.md

var WebSocketServer = require('websocket').server;
var express = require('express');
var _ = require('lodash');

var app = express.createServer();


// app.configure(function() {
//     app.use(express.static(__dirname + "/public"));
//     app.set('views', __dirname);
//     app.set('view engine', 'ejs');
// });
// app.get('/', function(req, res) {
//     res.render('index', { layout: false });
// });
app.listen(8080);

// SmartTouch events received on UDP will be routed to client over local WebSocket

var connections = [];
var canvasCommands = [];

var stServer = new WebSocketServer({
    httpServer: app,
    
    maxReceivedFrameSize: 640000, // - uint - Default: 64KiB
    // The maximum allowed received frame size in bytes. Single frame messages will also be limited to this maximum.

    maxReceivedMessageSize: 1000000, // - uint - Default: 1MiB
    // The maximum allowed aggregate message size (for fragmented messages) in bytes.

    fragmentOutgoingMessages: true, // - Boolean - Default: true
    // Whether or not to fragment outgoing messages. If true, messages will be automatically fragmented into chunks of up to fragmentationThreshold bytes.
    // Firefox 7 alpha has a bug that drops the
    // connection on large fragmented messages

    fragmentationThreshold: 16000, // - uint - Default: 16KiB
    // The maximum size of a frame in bytes before it is automatically fragmented.

    keepalive: true, // - boolean - Default: true
    // If true, the server will automatically send a ping to all clients every keepaliveInterval milliseconds. Each client has an independent keepalive timer, which is reset when any data is received from that client.

    keepaliveInterval: 20000, // - uint - Default: 20000
    // The interval in milliseconds to send keepalive pings to connected clients.

    dropConnectionOnKeepaliveTimeout: true, // - boolean - Default: true
    // If true, the server will consider any connection that has not received any data within the amount of time specified by keepaliveGracePeriod after a keepalive ping has been sent. Ignored if keepalive is false.

    keepaliveGracePeriod: 10000, // - uint - Default: 10000
    // The amount of time to wait after sending a keepalive ping before closing the connection if the connected peer does not respond. Ignored if keepalive or dropConnectionOnKeepaliveTimeout are false. The grace period timer is reset when any data is received from the client.

    assembleFragments: true, // - boolean - Default: true
    // If true, fragmented messages will be automatically assembled and the full message will be emitted via a message event. If false, each frame will be emitted on the WebSocketConnection object via a frame event and the application will be responsible for aggregating multiple fragmented frames. Single-frame messages will emit a message event in addition to the frame event. Most users will want to leave this set to true.

    autoAcceptConnections: false, // - boolean - Default: false
    // If this is true, websocket connections will be accepted regardless of the path and protocol specified by the client. The protocol accepted will be the first that was requested by the client. Clients from any origin will be accepted. This should only be used in the simplest of cases. You should probably leave this set to false; and inspect the request object to make sure it's acceptable before accepting it.

    closeTimeout: 5000, // - uint - Default: 5000
    // The number of milliseconds to wait after sending a close frame for an acknowledgement to come back before giving up and just closing the socket.

    disableNagleAlgorithm: true, // - boolean - Default: true
    // The Nagle Algorithm makes more efficient use of network resources by introducing a small delay before sending small packets so that multiple messages can be batched together before going onto the wire. This however comes at the cost of latency, so the default is to disable it. If you don't need low latency and are streaming lots of small messages, you can change this to 'false';

    ignoreXForwardedFor: false // - Boolean - Default: false
    // Whether or not the X-Forwarded-For header should be respected. It's important to set this to 'true' when accepting connections from untrusted clients, as a malicious client could spoof its IP address by simply setting this header. It's 
});

// UDP SERVER SETUP
var PORT = 33333;
//var HOST = '127.0.0.1';
//var HOST = '10.0.1.15'; // Apple Network Base
//var HOST = '192.168.1.131'; // olaunch

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {

    message = message.toString();
    console.log(remote.address + ':' + remote.port +' - ' + message);
    // I added a server.send but it gave me an infinite loop in the server console

    if (connections.length>0) {
        _.each(connections, function(connection){
            //console.log(connection);

            // wrap message in smarttouch protocol
            var frame = {msg:"parseBundle",data:JSON.parse(message)};

            connection.sendUTF(JSON.stringify(frame));
        });
    } else {
        console.log('No websocket connections for UDP');
    }
    
});

//server.bind(PORT, HOST);
server.bind(PORT);


// Load the TCP Library
net = require('net');
 
var tcpPort = 7777; 
// Keep track of the chat clients
var clients = [];
 
// Start a TCP Server
net.createServer(function (socket) {
 
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
 
  // Put this new client in the list
  clients.push(socket);
 
  // Send a nice welcome message and announce
  console.log(socket.name);
  socket.write("Welcome " + socket.name + "\n");
  //broadcast(socket.name + " joined the chat\n", socket);
 
  // Handle incoming messages from clients.
  socket.on('data', function (data) {
    console.log('ondata',data);
    console.log(data.toString())

    if (connections.length>0) {
        _.each(connections, function(connection){
            //console.log(connection);

            // wrap message in smarttouch protocol
            var frame = {msg:"rfidPresent",data:data.toString()};

            connection.sendUTF(JSON.stringify(frame));
        });
    } else {
        console.log('No websocket connections for TCP');
    }
    
    //broadcast(socket.name + "> " + data, socket);
  });
 
  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    //broadcast(socket.name + " left the chat.\n");
  });
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too
    process.stdout.write(message)
  }
 
}).listen(tcpPort);
 
// Put a friendly message on the terminal of the server.
console.log("Chat server running at port "+tcpPort);



stServer.on('request', function(request) {
    var connection = request.accept('smarttouch-events', request.origin);
    connections.push(connection);

    console.log(connection.remoteAddress + " connected - Protocol Version " + connection.webSocketVersion);
    
    // Send all the existing canvas commands to the new client
    // connection.sendUTF(JSON.stringify({
    //     msg: "initCommands",
    //     data: canvasCommands
    // }));
    
    // Handle closed connections
    connection.on('close', function() {
        console.log(connection.remoteAddress + " disconnected");
        
        var index = connections.indexOf(connection);
        if (index !== -1) {
            // remove the connection from the pool
            connections.splice(index, 1);
        }
    });
    
    // Handle incoming messages
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            try {
                var command = JSON.parse(message.utf8Data);

                // if (command.msg === 'clear') {
                //     canvasCommands = [];
                // }
                // else {
                //     canvasCommands.push(command);
                // }

                // // rebroadcast command to all clients
                // connections.forEach(function(destination) {
                //     destination.sendUTF(message.utf8Data);
                // });
            }
            catch(e) {
                // do nothing if there's an error.
            }
        }
    });
});

console.log("SmartTouch server ready");
