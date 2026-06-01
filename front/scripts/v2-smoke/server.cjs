const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const defaultSmokePort = 5179 + Math.floor(Math.random() * 1000);
const baseURL = process.env.V2_SMOKE_BASE_URL || `http://127.0.0.1:${defaultSmokePort}`;
const smokeUrl = new URL(baseURL);
const smokePort = smokeUrl.port || (smokeUrl.protocol === 'https:' ? '443' : '80');
const viteBin = path.join(__dirname, '..', '..', 'node_modules', 'vite', 'bin', 'vite.js');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const requestUrl = (url) => new Promise((resolve) => {
  const request = http.get(url, (response) => {
    response.resume();
    resolve(response.statusCode >= 200 && response.statusCode < 500);
  });
  request.setTimeout(1000, () => {
    request.destroy();
    resolve(false);
  });
  request.on('error', () => resolve(false));
});

const waitForServer = async (url, timeoutMs = 30000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await requestUrl(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Vite server did not become ready at ${url}`);
};

const ensureServer = async () => {
  if (await requestUrl(baseURL)) return null;
  if (!fs.existsSync(viteBin)) {
    throw new Error(`Vite binary not found at ${viteBin}. Run npm install in front/.`);
  }

  const server = spawn(process.execPath, [viteBin, '--host', smokeUrl.hostname, '--port', smokePort], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'ignore',
    windowsHide: true,
  });
  server.unref();

  await waitForServer(baseURL);
  return server;
};

module.exports = {
  baseURL,
  edgePath,
  ensureServer,
};
