import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { registerSocketHandlers } from "./socket/handlers";

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return ["http://localhost:5173"];
  }
  if (value.trim() === "*") {
    return ["*"];
  }
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins(process.env.CLIENT_ORIGIN);
const allowAllOrigins = allowedOrigins.includes("*");

export const setupSocket = (httpServer: HttpServer): void => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (allowAllOrigins || !origin) {
          callback(null, true);
          return;
        }
        callback(null, allowedOrigins.includes(origin));
      },
      methods: ["GET", "POST"],
    },
  });

  io.engine.on("connection_error", (err) => {
    console.log("Socket connection error", err.code, err.message);
  });

  io.on("connection", (socket) => {
    console.log("User connected");
    registerSocketHandlers(io, socket);
  });
};
