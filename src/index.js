require('dotenv').config()

const amqp = require("amqplib")

const socketioPort = process.env.PORT || 80
const rabbitMqUrl  = process.env.RABBITMQ_URL || ''

const rabbitMqExchange = 'parameters'
const rabbitMqTimeout = 5

const initRabbitMq = async () => {

    try{
        
        const connection = await amqp.connect(rabbitMqUrl)
        const channel = await connection.createChannel()

        channel.assertExchange(rabbitMqExchange, 'fanout', { durable: false })
        const {queue} = channel.assertQueue('', { durable: false, exclusive: true })

        channel.bindQueue(queue, rabbitMqExchange, '')
        channel.consume(queue, onMessageReceived, { noAck: true })  
    }
    catch(err) {
        console.log(err)
        console.warn('Error connecting to rabbitmq service, retrying in %s seconds', rabbitMqTimeout)
        setTimeout(initRabbitMq, rabbitMqTimeout * 1000)
    }
}

const onMessageReceived = async(msg) => {
    
    try {
        const { type, data } = JSON.parse(msg.content)

        switch (type) {
            case "parameter:reading":
                sendMessage(data.silo, type, {type: data.type, value: data.value, active: data.active})
                break;

            case "parameter:threshold-reached":
                sendMessage(data.silo, type, {type: data.type, value: data.value})
                break;

            default:
                console.log("unknown message: " + type);
        }
    } 
    catch (err) {
      console.log(err);
    }
}

const sendMessage = async(room, type, data) => {
    io.to(room).emit(type, data)
}

const io = require("socket.io")(socketioPort, {
    cors: {
        origin: "*",
    }
})

io.on("connection", (socket) => {

    socket.on("silo:join", (silo) => {
        try {
            socket.join(silo)
        }
        catch(err) {}
    })

    socket.on("silo:leave", (silo) => {
        try {
            socket.leave(silo)
        }
        catch(err) {}
    })
})

initRabbitMq()
console.log('listening on port ' + socketioPort)
