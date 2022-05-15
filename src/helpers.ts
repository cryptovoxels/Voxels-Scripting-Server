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
export const fetchLatestScriptingJS = async () => {

    log.info("Fetching latest scripting bundle");
    let p;
    try {
      p = await fetch(`https://www.cryptovoxels.com/scripting-host.js`);
    } catch (e: any) {
      throw new Error(e.toString());
    }
    let r;
    try {
      r = await p?.text();
    } catch (er: any) {
      throw new Error(er.toString());
    }

    return r
  
};
