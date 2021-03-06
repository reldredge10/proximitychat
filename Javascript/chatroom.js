﻿var user = {};
            var usersCount, messagesList, messageBox, sendButton, socket, id;

            window.onload = start;

            function start(){
                socket = io.connect(window.location.host);

                /*confirm that user has joined*/
                socket.emit('reconnect', function(joined, key){
                    if(joined){
                        user.name = "user";
                        user.key = key;
                    } else {
                        alert("bumped out");
                        window.location="/";
                    }
                });

                /*set variables listed above*/
                usersCount = 0;
                messagesList = document.getElementById("messages");
                messageBox = document.getElementById("m");
                sendButton = document.getElementById("f");

                /*setup basic function listeners*/
                socket.on('user connected', addUser);
                socket.on('user disconnected', removeUser);
                socket.on('message to clients', receiveChatMessage);
                socket.on('decline message', declineAlert);
                socket.on('request location', sendLocation);
                socket.on('out of range', outOfRange);
                socket.on('in range', inRange);

                /*start watchPosition*/
                id = navigator.geolocation.watchPosition(sendLocation, showError);
            };

            function addUser (user){
                ++usersCount;
            }

            function removeUser (user){
                --usersCount;
            }

            function receiveChatMessage (data){
                var newMsg = document.createElement('li');
                newMsg.appendChild(document.createTextNode(data.msg));
                messagesList.appendChild(newMsg);
            }

            function sendChatMessage(){
                alert("sending");
                socket.emit('message to server', user.key, messageBox.value);
                messageBox.value = "";
            }

            function declineAlert(msg){
                alert(msg);
            }

            function outOfRange(){
                var newMsg = document.createElement('li');
                newMsg.appendChild(document.createTextNode("Out of Range"));
                messagesList.appendChild(newMsg);
            }

            function inRange(){
                var newMsg = document.createElement('li');
                newMsg.appendChild(document.createTextNode("In Range"));
                messagesList.appendChild(newMsg);
            }


            function sendLocation(position){
                var data = {lat : position.coords.latitude, lng : position.coords.longitude };
                socket.emit('send location', user.key, data);
            }

            function showError(error) {
                alert("there was an error");
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        alert("User denied the request for Geolocation.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        alert("The request to get user location timed out.");
                        break;
                    case error.UNKNOWN_ERROR:
                        alert("An unknown error occurred.");
                        break;
                }
            }