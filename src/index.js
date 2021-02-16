const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { getUser, getUsersInRoom, addUser, removeUser } = require('./utils/users');

const port = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {    
    //to all connected clients
    // console.log('New Websocket connection');
    // socket.emit('message',generateMessage('Welcome')); //single
    // socket.broadcast.emit('message', generateMessage('A new user has joined')); 

    //for users in room only
    socket.on('join', (options, callback)=>{
        const { error, user } = addUser({ id:socket.id, ...options });
        
        if(error){
            return callback(error);
        }
        
        socket.join(user.room);
        
        socket.emit('message',generateMessage(user.room,`Welcome ${user.username}`)); //single
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username,`${user.username} has joined the room`));
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        }); 
        callback();
    });
    
    socket.on('messageSent',(data, callback)=>{
        const user = getUser(socket.id);

        const filter = new Filter();

        if(filter.isProfane(data)){
            return callback('Profanity is not allowed!');
        }

        io.to(user.room).emit('message',generateMessage(user.username,data));      //broadcast
        callback();
    });

    socket.on('sendLocation',(position,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`));
        callback();
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has left`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users: getUsersInRoom(user.room)
            });
        }       
    });
    
});

server.listen(port,()=>{
    console.log('Server Started on port: '+port)
});