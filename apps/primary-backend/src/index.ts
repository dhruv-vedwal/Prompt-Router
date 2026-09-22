import { app } from "./app";
import { cors } from '@elysiajs/cors'
import logger from "./lib/logger";
import { corsOrigins, listenPort, requireJwtSecret } from "./lib/env";

requireJwtSecret();

const port = listenPort(3000);

app.use(cors({
    origin: corsOrigins(),
    credentials: true,
})).listen(port, () => {
    logger.info(`🚀 Server is running on http://localhost:${port}`);
});
