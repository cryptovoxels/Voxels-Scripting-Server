# Voxels Scripting Server.
A package to allow people to create their own persistent scripting server.
This module exports two objects:

- Method `makeVSSForParcel()`; This function returns a promise containing the WebSocketServer when it has successfully started.
- Object `expressApp` which is the express `app` object. See the express npm module documentation.


## How to run your own server

1. run `npm i`

2. Edit server.ts. Replace `670` with the parcel ID or Space ID you want to create a scripting server for.

3. run `npm run test:server`;
This will run the server.

These steps are to create a very simple server in 3 simple steps;

Else, you can also just have your own server and call `makeVSSForParcel(...)`

