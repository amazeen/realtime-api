const io = require("socket.io-client");
const socket = io('http://localhost:80');

socket.emit('silo:join', "1")


socket.on('parameter:reading', (data) => {
    console.log(data)
})

socket.on('parameter:threshold-reached', (data) => {
    console.log(data)
})
