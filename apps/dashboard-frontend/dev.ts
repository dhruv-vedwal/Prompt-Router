#!/usr/bin/env bun
/**
 * Starts the frontend HMR server with process.env.* replaced for the browser
 * bundle (Bun's HTML imports don't reliably inline env without --define).
 */
const apiUrl = process.env.API_URL || "http://localhost:3000";
const routerApiUrl = process.env.ROUTER_API_URL || "http://localhost:4000";

console.log(`🔗 API_URL=${apiUrl}`);
console.log(`🔗 ROUTER_API_URL=${routerApiUrl}`);

const child = Bun.spawn({
  cmd: [
    "bun",
    "--hot",
    "--port",
    "3001",
    "--define",
    `process.env.API_URL=${JSON.stringify(apiUrl)}`,
    "--define",
    `process.env.ROUTER_API_URL=${JSON.stringify(routerApiUrl)}`,
    "--define",
    `process.env.NODE_ENV=${JSON.stringify("development")}`,
    "src/index.ts",
  ],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
  env: process.env,
});

process.exit(await child.exited);
