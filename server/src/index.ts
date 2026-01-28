import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { setupSocket } from "./socket";

const app = express();
const httpServer = createServer(app);

setupSocket(httpServer);

const PORT = 3001;

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
