var express    = require('express');        // call express
var app        = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
http.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.get('/',function(req,res){
    res.send("Welcome to my socket");
});

var onlineUsers = {};
var candidateList = [];

io.on('connection', function (client) {
    
    console.log('one user connected : ' + client.id);
    
    client.on('disconnect', function() {
        delete onlineUsers[client.id];
    });

    // login
    
    client.on('login', function (fullName) {
        onlineUsers[client.id] = fullName;
        client.emit('login', client.id);
    });

    //user press call
    
    client.on('call', function (toId) {
        console.log(onlineUsers);
        if (toId != client.id && onlineUsers[toId]) {
            io.to(toId).emit('call', {'fullName': onlineUsers[client.id], 'fromId': client.id});
        }
    });

    client.on('callReceive', function (toId){
        io.to(toId).emit('createOffer', {'fromId': client.id});
    });

    //user press reject

    client.on('callReject', function (){
        client.broadcast.emit('callReject');
    });

    //user press accept

    client.on('callAccept', function (){
        candidateList.forEach(element => {
            io.to(element['toId']).emit('candidate', element);
        });
        client.broadcast.emit('callAccept');
    });

    client.on('callEnd', function (){
        client.broadcast.emit('callEnd');
    });

    // Peer Establishment
    
    client.on('offer', function (details) {
        userId = details['fromId'];
        details['fromId'] = client.id;
        io.to(userId).emit('offer', details);
        console.log('offer: ' + JSON.stringify(details));
    });

    client.on('answer', function (details) {
        userId = details['fromId'];
        details['fromId'] = client.id;
        io.to(userId).emit('answer', details);
        console.log('answer: ' + JSON.stringify(details));
    });

    client.on('candidate', function (details) {
        details['toId'] = details['fromId'];
        details['fromId'] = client.id;
        candidateList.push(details);
        console.log('candidate: ' + JSON.stringify(details));
    });

    // when the client emits 'new message', this listens and executes

});
