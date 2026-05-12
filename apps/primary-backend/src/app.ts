import { Elysia } from "elysia";
import { app as authApp } from "./modules/auth";
import { app as apiKeyApp } from "./modules/apiKeys";
import { app as modelsApp } from "./modules/models";
import { app as paymentsApp } from "./modules/payments";
import { app as statsApp } from "./modules/stats";
import { app as usageApp } from "./modules/usage";
import { app as playgroundApp } from "./modules/playground";

export const app = new Elysia()
  .use(authApp)
  .use(apiKeyApp)
  .use(modelsApp)
  .use(paymentsApp)
  .use(statsApp)
  .use(usageApp)
  .use(playgroundApp)
  
export type App = typeof app