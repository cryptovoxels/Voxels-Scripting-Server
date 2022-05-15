/**
 *  This is an example server using the makeVSSForParcel
 * */
import { makeVSSForParcel } from "./sub";

makeVSSForParcel(670).then((wss) => {
  if (wss) {
    console.log("Websocket started");
  } else {
    console.error("Websocket did not start");
  }
});
