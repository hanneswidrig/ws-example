import { readFileSync } from "node:fs";
import { createServer } from "node:https";

import Koa from "koa";
import cors from "@koa/cors";
import Router from "@koa/router";
import { WebSocketServer } from "ws";

const app = new Koa();
const router = new Router();

const httpsServer = createServer(
	{
		key: readFileSync("./ssl/key.pem"),
		cert: readFileSync("./ssl/cert.pem"),
	},
	app.callback()
);

const wss = new WebSocketServer({ server: httpsServer });

app.use(router.routes()).use(router.allowedMethods()).use(cors());

router.use(async (ctx, next) => {
	await next();
	const rt = ctx.response.get("X-Response-Time");
	console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

router.use(async (ctx, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	ctx.set("X-Response-Time", `${ms}ms`);
});

router.get("/", (ctx) => {
	ctx.body = { hello: "world" };
});

wss.on("connection", (ws) => {
	console.log("ws:connected");

	ws.on("message", (data) => {
		ws.send(`${data.toString().split("").reverse().join()}`);
	});

	ws.on("close", () => {
		console.log("ws:close");
	});
});

httpsServer.listen(3000, () => {
	return console.log(`server running at https://localhost:3000/`);
});
