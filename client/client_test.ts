import {WebSocket} from 'ws';
import { tryParse } from '../src/helpers';

const ws = new WebSocket(`ws://localhost:3750/?token=dwdwdwdw`);

const sendJoin = ()=>{
    const data = {type:'join',uuid:'dwwdw',player:{wallet:'dwdwdwdw'}}
    ws.send(JSON.stringify(data));
}
const sendClick = ()=>{
    const data = {
        type:'click',
        event:{},
        uuid:'336dd90b-ee60-4f48-af16-583705eecdd2',
        player:{wallet:'dwdwdwdw'}
        
    }
    ws.send(JSON.stringify(data));
}
const sendPlayerEnter = ()=>{
    const data = {type:'playerenter',uuid:'dwwdw',player:{wallet:'dwdwdwdw'}}
    ws.send(JSON.stringify(data));
}

const sendPlayYoutube = ()=>{
    const data = {type:'click',uuid:'35f6dbfd-d255-4706-9635-cfa2d2c9a366',player:{wallet:'dwdwdwdw'}}
    ws.send(JSON.stringify(data));
}

const sendScriptUpdated = ()=>{
  const data = {type:'script-updated'}
  ws.send(JSON.stringify(data));
}

ws.on('open', function open() {
    console.log('Client connected')
    setTimeout(()=>{
      sendScriptUpdated()
    },3000)
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('message', function message(data) {
  console.log(data.toString());
  let  d = tryParse(data.toString())
  if(!d){
      console.log('cant parse')
    return
  }
  if(d.type=='hello'){
    sendJoin();
    sendPlayerEnter()
    sendClick()
    sendPlayYoutube() // This should cause the scripting bundle to re-broadcast a play event which we catch below
  }

  if(d.type=='play'){
      console.log('play youtube')
  }
});