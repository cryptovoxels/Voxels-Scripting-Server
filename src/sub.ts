require("dotenv").config();
import * as express from "express";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { loadParcel, tryParse } from "./helpers";

import { version } from "../package.json";
import { log, expressLog } from "./helpers";
import * as url from "url";

// Virtual machine to run the scripts in.
import Context from "./context";
const NODE_PORT = process.env.NODE_PORT
  ? parseInt(process.env.NODE_PORT, 10)
  : 3000;

const app = express();

/** @internal */
export const clients = new Set<WebSocket>();
const server = http.createServer(app);
const context = new Context(clients);

app.get("/", (req: any, res: express.Response) => {
  let html = `<html>
  <head>
  <title>VSS ${version}</title></head>
  <body>
  <h2>Server v ${version} running!</h2>
  <p>Currently ${clients.size} users are connected</p>
  </body></html>`;

  res.send(html);
});

const runParcelScript = async (context: Context, id: string | number) => {
  let parcelScript = await loadParcel(id);

  try {
    context.current.run(parcelScript);
  } catch (e) {
    log.error("Error thrown at load", e);
    return null;
  }
};

/** @internal */
export const makeVSSForParcel = async (id: string | number) => {
  await context.init();
  await runParcelScript(context, id);
  const wss = startWebSocket(context, id);
  return wss;
};

const startWebSocket = (context: Context, id: string | number) => {
  const wss = new WebSocketServer({ server });
  server.listen(NODE_PORT, function listening() {
    log.info(`Listening on ${NODE_PORT}`);
    expressLog.info(`-----------------------------`);
    expressLog.info(`The server started`);
    const addressInfo = server.address();
    const address =
      typeof addressInfo == "string" ? addressInfo : addressInfo?.address;
    if (process.env.NODE_ENV == "production") {
      expressLog.info(`Server running at 'https://${address}/'`);
      expressLog.info(`Websocket running at 'wss://${address}/'`);
    } else {
      expressLog.info(`Server running at 'http://${address}:${NODE_PORT}/'`);
      expressLog.info(`Set the url as 'ws://${address}:${NODE_PORT}/'`);
    }
    expressLog.info(`-----------------------------`);
  });

  wss.on("listening", function () {
    log.info(`Websocket started on port ${NODE_PORT}`);
  });

  wss.on(
    "connection",
    function connection(ws: WebSocket & { token?: string }, req) {
      const reqUrl = req.url || "";
      // grab user token from the url
      const queryObject = url.parse(reqUrl, true).query as { token?: string };
      clients.add(ws);
      console.log("New connection");
      const token = queryObject.token;
      ws.token = token;

      let data = { type: "load" };
      let code = `self.onmessage(${JSON.stringify({ data })})`;

      try {
        context.current.run(code);
      } catch {
        log.error("failed to self.onmessage load");
      }
      ws.on("close", (e) => {
        log.info("Websocket closing, client is removed from active list.");

        clients.delete(ws);

        if (clients.size === 0) {
          log.info("No clients connected.");
        }
      });

      ws.on("message", async function incoming(message) {
        const msg = message.toString();

        let data = tryParse(msg);
        if (!data) {
          log.info("Received message but received data isn't JSON parsable");
        }

        if (data.type === "script-updated") {
          // script was updated, we should restart the context.
          log.info("Script updated, context restarting");
          context.generateContext().then(() => {
            runParcelScript(context, id);
          });
          return;
        }

        if (!context.hasParcelLoaded) {
          log.warning(
            "Received " +
              data.type +
              " but no parcel has been generated in the context yet"
          );
          return;
        }

        if (!data.player) {
          // Data has to contain a player object
          data["player"] = {};
        }

        // set the token of the player
        data.player._token = ws.token;
        if (!data.player.wallet) {
          // User is not logged in, use the token as wallet
          data.player.wallet = ws.token;
        }
        if (data.type == "join") {
          log.info("Player with wallet " + data.player.wallet + " just joined");
        }

        let code = `self.onmessage(${JSON.stringify({ data })})`;
        try {
          context.current.run(code);
        } catch (e) {
          log.error(e);
          log.error("Error thrown on message: " + data.type);
        }
      });

      ws.send(JSON.stringify({ type: "hello" }));
    }
  );

  setInterval(() => {
    const heap = process.memoryUsage().heapUsed / 1024 / 1024;
    expressLog.info(`Memory used: ${heap} MB`);
  }, 5000);

  return wss;
};

/** @internal */
export { app as expressApp };
