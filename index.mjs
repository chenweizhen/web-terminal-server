import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);

const express = require('express');
const expressWs = require('express-ws');

const TERMINAL_PORT = 4000;

const app = express();

expressWs(app);

// 设置允许跨域访问该服务.
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// =================终端============================

// const { Buffer } = require('node:buffer');
// const os = require('node:os');
// const USE_BINARY = os.platform() !== 'win32'; // linux系统

const pty = require('node-pty');

const logs = {};
const terminals = {};

// string message buffering
function buffer(socket, timeout) {
  let s = '';
  let sender = null;
  return (data) => {
    s += data;
    if (!sender) {
      sender = setTimeout(() => {
        socket.send(s);
        s = '';
        sender = null;
      }, timeout);
    }
  };
}

// // binary message buffering
// function bufferUtf8(socket, timeout) {
//   let buffer = [];
//   let sender = null;
//   let length = 0;
//   return (data) => {
//     buffer.push(data);
//     length += data.length;
//     if (!sender) {
//       console.log('buffer', buffer, length);
//       sender = setTimeout(() => {
//         socket.send(Buffer.concat(buffer, length));
//         buffer = [];
//         sender = null;
//         length = 0;
//       }, timeout);
//     }
//   };
// }

// =================终端 Begin============================
// 定义通信接口
app.post('/terminals', (req, res) => {
  const env = Object.assign({}, process.env);
  const cols = Number.parseInt(req.query.cols);
  const rows = Number.parseInt(req.query.rows);
  const terms = Object.values(terminals);
  let closedTerm;
  for (const term_ of terms) {
    if (term_.state === 'closed') {
      closedTerm = term_;
      break;
    }
  }

  const term =
    closedTerm ||
    pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
      cols: cols || 80,
      cwd: env.PWD,
      encoding: 'utf8',
      env,
      name: 'xterm-256color',
      rows: rows || 24,
    });
  term.state = 'opening';

  console.log(`Created terminal with PID: ${term.pid}`);
  terminals[term.pid] = term;
  logs[term.pid] = '';
  term.onData((data) => {
    logs[term.pid] += data;
  });
  res.send(term.pid.toString());
  res.end();
});

// resize时，发送的接口，调用resize方法
app.post('/terminals/:pid/size', (req, res) => {
  const cols = Number.parseInt(req.query.cols);
  const pid = Number.parseInt(req.params.pid);
  const rows = Number.parseInt(req.query.rows);
  const term = terminals[pid];

  term.resize(cols, rows);
  console.log(`Resized terminal ${pid} to ${cols} cols and ${rows} rows.`);
  res.end();
});

// 建立websocket
app.ws('/terminals/:pid', (ws, req) => {
  const term = terminals[Number.parseInt(req.params.pid)];
  console.log(`Connected to terminal ${term.pid}`);
  ws.send(logs[term.pid]);

  const send = buffer(ws, 5); // USE_BINARY ? bufferUtf8(ws, 5) : buffer(ws, 5);

  term.on('data', (data) => {
    try {
      send(data);
    } catch {
      // The WebSocket is not open, ignore
    }
  });

  ws.on('message', (data) => {
    term.write(data);
  });

  ws.on('close', () => {
    8;
    if (term) {
      term.removeAllListeners('data');
      term.bound = true;
      term.state = 'closed';
    }
    console.log(`---------Closed terminal ${term.pid}---------`);
  });
});
// =================终端 End============================

app.listen(TERMINAL_PORT);

console.log(`start listen port:${TERMINAL_PORT}`);