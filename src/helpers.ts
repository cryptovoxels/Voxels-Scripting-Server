import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import { named } from "./logger";
import { version } from "../package.json";
/** @internal */
export const log = named(`VSS [${version}]`);
/** @internal */
export const expressLog = named(`Express`);
/** @internal */
export const tryParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};
/** @internal */
export const fetchLatestScriptingJS = () => {
  return new Promise(async (resolve, reject) => {
    log.info("Fetching latest scripting bundle");
    let p;
    try {
      p = await fetch(`https://www.cryptovoxels.com/scripting-host.js`);
    } catch (e: any) {
      reject();
      throw new Error(e.toString());
    }
    let r;
    try {
      r = await p?.text();
    } catch (er: any) {
      reject();
      throw new Error(er.toString());
    }

    const res = () => resolve(true);

    if (!fs.existsSync("cache")) {
      fs.mkdirSync("cache");
    }

    try {
      log.info("Creating cache: " + r.length);
      fs.writeFile("cache/scripting-host.js", r, res);
    } catch (e) {
      log.error(e);
      reject();
    }
  });
};
/** @internal */
export const getScriptingBundle = async () => {
  const readBundle = () => {
    let bundle;
    try {
      bundle = fs.readFileSync("./cache/scripting-host.js").toString();
    } catch {}
    return bundle;
  };
  let file = readBundle();
  if (!file) {
    log.info("No cache found");
    await fetchLatestScriptingJS();
    file = readBundle();
  }

  if (!file) {
    throw new Error("Could not fetch scripting bundle");
  }
  return file;
};
