/**
 *  This is an example server using the makeVSSForParcel
 * */
import vss from "../src/index";

vss.makeVSS(670).then((wss) => {
  if (wss) {
    console.log("Websocket started");
  } else {
    console.error("Websocket did not start");
  }
});
