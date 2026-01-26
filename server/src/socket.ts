import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { registerSocketHandlers } from "./socket/handlers";

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

export const setupSocket = (httpServer: HttpServer): void => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ["GET", "POST"],
    },
  });


  io.on("connection", (socket) => {
    console.log("User connected");
    registerSocketHandlers(io, socket);
  });
};
