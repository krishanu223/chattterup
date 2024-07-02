// No need to change pre-written code.
// Make necessary imports here.
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { chatModel } from './message.schema.js';
import path from 'path';
import ejsLayouts from "express-ejs-layouts";
export const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

app.set("view engine", "ejs");
app.set("views", path.resolve("views"));
app.use(express.static('public'));
app.get("/", (req, res) => {
    res.render('client')
})



var usercount = 0;
let disconnected = 0;
var userarray = [];
var disconteduser = []
const clients = {};
io.on("connection", (socket) => {
    console.log("Connection made.");
    usercount++;
    socket.on("join", async(data) => {
        clients[socket.id] = data.username;
        // Emit a welcome message to the user who joined
        socket.emit("welcomemes", { text: data.username })
            //socket.emit("message", { text: `Welcome, ${data.username}!` });
        console.log(data.username, "joined the room")
        console.log("Total user connected", usercount)
            // Broadcast a message to all other users in the same room

        userarray.push(data.username)
        socket.emit("newuser", userarray);
        socket.broadcast.emit("newuser", userarray)
        socket.broadcast.emit("messageforjoinuser", {
            text: `${data.username} has joined the room.`
        });
        ////////////////////////////////////// getting previous message from db/////////////////////////

        chatModel.find().sort({ timestamp: 1 })

        .then(messages => {
                console.log('username:', messages.username);
                socket.emit('previousMessages', messages, );

            }).catch(err => {
                console.log(err);
            })
            // Join the room
    });

    socket.on("sendMessage", async(data) => {

        // write your code here
        const newChat = new chatModel({
            username: data.Username,
            message: data.message,
            timestamp: new Date()
        });
        newChat.save();


        // Broadcast the received message to all users in the same room
        io.emit("message", {
            username: data.Username,
            text: data.message
        });
    });
    /////////////////////////////////////////////typing status////////////////////////////////////

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data.user);
        console.log("typing...")
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
        console.log("stop")

    });


    ///////////////////////////////////////////the end////////////////////////////////////////////
    socket.on("disconnect", () => {
        console.log("Connection disconnected.");
        usercount--;
        disconnected++;
        const name = clients[socket.id];
        delete clients[socket.id];
        console.log(`${name} has disconnected`);
        disconteduser.push(name);
        const newArray = userarray.filter(item => item !== name);
        console.log(newArray)
        userarray = [];
        userarray = newArray;
        socket.broadcast.emit('user disconnected', { user: name, disconnecteduser: disconnected, userarray, disconteduser });
        console.log(disconteduser)

    });
});

export { server }