require("dotenv").config();
import * as express from "express";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getScriptingBundle, tryParse } from "./helpers";
import fetch from "node-fetch";
import { version } from "../package.json";
import { log, expressLog } from "./helpers";
import * as url from "url";

// Virtual machine to run the scripts in.
import * as vm from "vm2";
const NODE_PORT = process.env.NODE_PORT
  ? parseInt(process.env.NODE_PORT, 10)
  : 3000;

const app = express();

const fetchJson = (url: string, ...args: any) =>
  fetch(url, args).then((r: any) => r.json());
const postMessageCallback = function (message: string) {
  let msg = tryParse(message);

  if (msg) {
    let m = JSON.stringify(msg);

    clients.forEach((c: WebSocket) => {
      c.send(m);
    });
  }
};

const sandbox = {
  console,
  fetch,
  fetchJson,
  postMessage: postMessageCallback,
  importScripts: () => {},
};

export const clients = new Set<WebSocket>();
const server = http.createServer(app);
app.get("/", (req: any, res: any) => {
  let status = `Version: ${version}`;

  res.set("Content-Type", "text/plain");
  res.send(status);
});

export const makeVSSForParcel = async (id: string | number) => {
  const bundle = await getScriptingBundle();

  let context = new vm.VM({ allowAsync: true, timeout: 1000, sandbox });

  const loadParcel = async (parcelId: string | number) => {
    log.info(`Loading scripts of parcel# ${parcelId}`);

    const isSpace = typeof parcelId == "string";
    const type = isSpace ? "spaces" : "parcels";

    const url = `https://untrusted.cryptovoxels.com/grid/${type}/${parcelId}/scripts.js`;

    let f = await fetch(url);
    let r = await f.text();

    try {
      context.run(r);
    } catch (e) {
      log.error("Error thrown at load", e);
      return null;
    }

    log.info(`loading finished for parcel#${parcelId}`);
    return r;
  };

  try {
    context.run(`self = global;`);
  } catch (err) {
    console.error("Failed to set global.", err);
  }

  try {
    context.run(bundle);
  } catch (err) {
    console.error("Failed to run template.", err);
  }

  await loadParcel(id);

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
    // log.info(`Listening on ${NODE_PORT}`);
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
        context.run(code);
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
          context.run(code);
        } catch (e) {
          log.error(e);
          log.error("Error thrown on message: " + data.type);
        }
      });

      ws.send(JSON.stringify({ type: "hello" }));
    }
  );
  return wss;
};

export { app as expressApp };
