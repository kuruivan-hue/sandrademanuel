const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tmpDir = path.join(os.tmpdir(), 'edge-cdp-shots-' + Date.now());

async function run() {
  const browser = spawn(edge, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + tmpDir,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  // Get pages
  const pages = await new Promise(res => {
    http.get('http://127.0.0.1:9222/json', r => {
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

  // Set desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to page
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 1500));

  // Ensure all reveal elements are fully visible for clean snapshot
  await send('Runtime.evaluate', {
    expression: `
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture Hero
  const heroShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_1_hero.png', Buffer.from(heroShot.data, 'base64'));
  console.log('Saved shot_1_hero.png');

  // Scroll to Editorial & Capture
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('trayectoria').scrollIntoView({ behavior: 'instant' });
    `
  });
  await new Promise(r => setTimeout(r, 500));
  const editShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_2_editorial.png', Buffer.from(editShot.data, 'base64'));
  console.log('Saved shot_2_editorial.png');

  // Scroll to Gallery & Capture
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('galeria').scrollIntoView({ behavior: 'instant' });
    `
  });
  await new Promise(r => setTimeout(r, 500));
  const galShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_3_gallery.png', Buffer.from(galShot.data, 'base64'));
  console.log('Saved shot_3_gallery.png');

  // Scroll to Services & Capture
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('servicios').scrollIntoView({ behavior: 'instant' });
    `
  });
  await new Promise(r => setTimeout(r, 500));
  const srvShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_4_services.png', Buffer.from(srvShot.data, 'base64'));
  console.log('Saved shot_4_services.png');

  // Scroll to Closing & Capture
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('contacto').scrollIntoView({ behavior: 'instant' });
    `
  });
  await new Promise(r => setTimeout(r, 500));
  const closeShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_5_closing.png', Buffer.from(closeShot.data, 'base64'));
  console.log('Saved shot_5_closing.png');

  // Test Mobile view (390x844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
  await new Promise(r => setTimeout(r, 500));
  const mobHeroShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('shot_6_mobile_hero.png', Buffer.from(mobHeroShot.data, 'base64'));
  console.log('Saved shot_6_mobile_hero.png');

  ws.close();
  browser.kill();
  console.log('All sections captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
