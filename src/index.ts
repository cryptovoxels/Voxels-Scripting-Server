import { makeVSSForParcel, expressApp } from "./sub";

export const makeVSS = makeVSSForParcel;
export const app = expressApp;

const vss = { makeVSS, app };
export default vss;
