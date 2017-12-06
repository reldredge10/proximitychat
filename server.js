﻿var fs = require('fs'),
url = require('url'),
http = require('http'),
path = require('path'),
mime = require('mime');



var app = require('express')();
var httpServer = http.createServer(function(request, response){
    var pathname = url.parse(request.url).pathname;
    if (pathname == "/") pathname = "index.html";
    var filename = path.join(process.cwd(), 'public', pathname);

    path.exists(filename, function(exists){
        if(!exists){
            response.writeHead(404, {"Content-Type" : "text/plain" });
            response.write("404 Not Found");
            response.end();
            return;
        }

        response.writeHead(200, { 'Content-Type': mime.lookup(filename) });
        fs.createReadStream(filename, {
            'flags': 'r',
            'encoding': 'binary',
            'mode': 0666,
            'bufferSize': 4 * 1024
        }).addListener("data", function(chunk) {
            response.write(chunk, 'binary');
        }).addListener("close", function() {
            response.end();
        });
    });
});


var io = require('socket.io')(http);
var websocket = io.listen(http);

var inRange = true;
var connectedUsers = {};


/*sets up a listener for a particular event
when the event is received, the function is called*/

/*fired when client connects to server*/
websocket.sockets.on('connection', function(socket){
    console.log('a user connected');

    /*extra setup for client connecting*/
    socket.on("join", function(user, sendKey){
        user.key = Date.now();
        connectedUsers[user.key] = user;
        sendKey(user.key);
        socket.set('userkey', user.key);
        /*now broadcast the client connecting to all other clients*/
        socket.broadcast.emit('user connected', user);
    });

    /*fired when client disconnects from server*/
    socket.on('disconnect', function(){
        socket.get('userkey', function(err, key){
            var user = connectedUsers[key];
            /*is user in connectedUsers?*/
            if(user){
                delete connectedUsers[key];
                socket.broadcast.emit("user disconnected", key);
                console.log('user disconnected');
            }
        });
    });

    /*fired when server receives message from client*/
    socket.on('message to server', function(msg){
        socket.get('userkey', function(err, key){
            /*test 1: is user listed in connectedUsers?*/
            var user = connectedUsers[key];
            if(user){
                /*test 2: is everyone within range of each other?*/
                if(inRange){
                    console.log('message: ' + msg);
                    var data = { key: key, sender: user.name, message: msg };
                    io.emit('message to clients', data);
                } else {
                    socket.emit('decline message', "sorry, but you are not close enough to recipient(s)");
                }
            } else {
                socket.emit('decline message', "sorry, but you are not connected to the group");
            }
        });
    });

    socket.on('send location', function(data){
        console.log(data.lat + ", " + data.lng)});
});

/*check the locations of each connected user in real time*/
/*when changes from in range to out of range, send event "out of range" to all clients*/
    /*also set boolean to false*/
/*when changes from out of range to in range, send event "in range" to all clients*/
    /*also set boolean to true*/

http.listen(process.env.PORT || 3000, "0.0.0.0");