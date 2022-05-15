# Self-hosted Voxels.com Scripting Server.
A package to allow people to create their own persistent scripting server.
This module exports two objects:

- Method `makeVSS()`; This function returns a promise containing the WebSocketServer when it has successfully started.
- Object `expressApp` which is the express `app` object. See the express npm module documentation.


## How to run your own server

1. Run `npm i`

2. Import `makeVSS` and enter a few lines of code:
Using `import`
```js
import {makeVSS} from 'voxels-scripting-server'

makeVSS(670).then((wss) => {
  if (wss) {
    console.log("Websocket started");
  } else {
    console.error("Websocket did not start");
  }
});
```

Using require:
```js
const vss =require("voxels-scripting-server");

vss.default.makeVSS(670).then((wss) => {
  if (wss) {
    console.log("Websocket started");
  } else {
    console.error("Websocket did not start");
  }
});
```

There is a demo on repl.it:
https://replit.com/@Benjythebee/testCryptovoxelsserver#index.js

3. In the examples above, replace `670` with the parcel id or space id you want to create a server for.

4. Once your server setup, go to your parcel page on Voxels.com and set `Hosted script` to true;

5. Then set the host address to `wss://[The Address of server]/`, Hit  save.


# Development

1. Clone the repo

2. `npm run test:server` will run a quick test server in `client/server` using the source code.
3. `npm run test:client` will run a quick test client in `client/client_test.ts`.

## Contributing

1. Create a branch and do your changes

1. Make sure your code is formatted using `npm run format`

2. Also make sure your code builds using `npm run build`

4. Create a Pull request at https://github.com/cryptovoxels/Voxels-Scripting-Server .


## todo:

1. Introduce ability to interconnect parcels.
2. Better tests

Any ideas are welcomed