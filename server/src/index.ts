import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { setupSocket } from "./socket";

const app = express();
const httpServer = createServer(app);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

setupSocket(httpServer);

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
