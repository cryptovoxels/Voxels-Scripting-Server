import { fetchLatestScriptingJS, log, tryParse } from "./helpers";
import { WebSocket } from "ws";
// Virtual machine to run the scripts in.
import * as vm from "vm2";
import fetch from "node-fetch";

const fetchJson = (url: string, ...args: any) =>
  fetch(url, args).then((r: any) => r.json());

const sandbox = (clients: Set<WebSocket>) => {
  return {
    console,
    fetch,
    fetchJson,
    postMessage: (message: string) => {
      let msg = tryParse(message);

      if (msg) {
        let m = JSON.stringify(msg);

        clients.forEach((c) => {
          c.send(m);
        });
      }
    },
    importScripts: () => {},
  };
};

/* @internal */
export default class Context {
  private _current: vm.VM;
  private bundle: string = undefined!;
  private clients: Set<WebSocket>;
  constructor(clients: Set<WebSocket>) {
    this._current = undefined!;
    this.clients = clients;
  }

  get current() {
    return this._current;
  }

  init = async () => {
    this.bundle = await fetchLatestScriptingJS();
    await this.generateContext();
  };

  generateContext = async () => {
    if (this._current) {
      log.info("Clean context");
      this.cleanContext();
    }
    let context = new vm.VM({
      allowAsync: true,
      timeout: 1000,
      sandbox: sandbox(this.clients),
    });

    try {
      context.run(`self = global;`);
    } catch (err) {
      console.error("Failed to set global.", err);
    }

    try {
      context.run(this.bundle);
    } catch (err) {
      console.error("Failed to run template.", err);
    }
    this._current = context;
  };

  get hasParcelLoaded() {
    try {
      this._current.run(`parcel;`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * This Method attempts at cleaning the context to avoid the risk of memory leaks.
   */
  private cleanContext = () => {
    if (this._current) {
      try {
        this._current.run(`
                if(parcel){
                    parcel.getFeatures().forEach((f)=>parcel.removeFeature(f,false));
                    parcel.parcel = [];
                    self = null;
                }`);
      } catch {}
      this._current.setGlobals({
        parcel: null,
        __loadFeatures: null,
        console: null,
        fetch: null,
        fetchJson: null,
        postMessage: null,
        self: null,
      });
      this._current = undefined!;
    }
  };
}
