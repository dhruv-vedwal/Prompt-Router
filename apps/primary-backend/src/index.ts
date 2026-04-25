import { app } from "./app";
import { cors } from '@elysiajs/cors'
import logger from "./lib/logger";


app.use(cors({
    origin: true,
    credentials: true,
})).listen(3000, () => {
    logger.info("🚀 Server is running on http://localhost:3000");
});