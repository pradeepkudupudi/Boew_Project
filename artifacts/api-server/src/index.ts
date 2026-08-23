import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort) || 5000;

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, `BOEW API Server listening on 0.0.0.0:${port}`);
  console.log(`[API Server] Running on http://localhost:${port} and network http://0.0.0.0:${port}`);
});
