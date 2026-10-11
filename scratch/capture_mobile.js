const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpDir = path.join(os.tmpdir(), 'edge-mob-cdp-' + Date.now());

async function run() {
  const browser = spawn(edge, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9228',
    '--user-data-dir=' + tmpDir,
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const pages = await new Promise(res => {
    http.get('http://127.0.0.1:9228/json', r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => res(JSON.parse(body)));
    });
  });

  const page = pages.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.onopen = res);

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 1500));
  await send('Runtime.evaluate', {
    expression: "document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));"
  });
  await new Promise(r => setTimeout(r, 500));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_mobile_hero_perfect.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved shot_mobile_hero_perfect.png');
  ws.close();
  browser.kill();
  process.exit(0);
}
run();
