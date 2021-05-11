/**
 *
 *
 *
 *
 */
const amqp = require("amqplib/callback_api");
const io = require("socket.io")(process.env.PORT || 80, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(socket);

  socket.on("silo:join", (silo) => {
    socket.join(silo);
  });

  socket.on("silo:leave", (silo) => {
    socket.leave(silo);
  });
});

amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
  if (error0) {
    console.log(error0);
    //throw error0;
  }

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }
    const queue = "hello";

    channel.assertQueue(queue, {
      durable: false,
    });

    channel.consume(
      queue,
      (msg) => {
        const { type, data } = JSON.parse(msg.content);

        try {
          switch (type) {
            case "reading:new":
              io.to(data.silo).emit("parameter:reading", {
                type,
                value: data.value,
                active: data.active,
              });

              break;
            case "reading:threshold-reached":
              io.to(msg.data.silo).emit("parameter:threshold-reached", {
                type,
                value: data.value,
              });

              break;
            default:
              console.log("unknown message: " + type);
          }
          console.log(" [x] Received %s", msg.content.toString());
        } catch (err) {
          console.log(err);
        }
      },
      {
        noAck: true,
      }
    );
  });
});
