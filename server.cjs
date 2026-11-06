const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn, execFile } = require('node:child_process');

const folder = path.join(__dirname, 'data');
fs.mkdirSync(folder, {recursive:true});
const config = path.join(folder, 'buttons.json');
const secretFile = path.join(folder, 'key');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(24).toString('hex'), {flag:'wx'});
const key = fs.readFileSync(secretFile, 'utf8').trim();
const defaults = [{name:'Notepad',target:'notepad.exe'},{name:'Calculator',target:'calc.exe'},{name:'File Explorer',target:'explorer.exe'}];
let buttons = fs.existsSync(config) ? JSON.parse(fs.readFileSync(config,'utf8')) : defaults;
const buttonId = b => crypto.createHmac('sha256',key).update(JSON.stringify(b)).digest('hex');
const page = fs.readFileSync(path.join(__dirname,'index.html'));
const port = Number(process.env.DECK_PORT || 8050);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('DECK_PORT must be an integer between 1024 and 65535.');
  process.exit(1);
}
const pin = String(crypto.randomInt(100000,1000000));
const tasksFile = path.join(folder,'tasks.json');
let tasks = fs.existsSync(tasksFile) ? JSON.parse(fs.readFileSync(tasksFile,'utf8')) : [];
let attempts = 0, attemptWindow = 0;
const iconCache = new Map();
let bluetooth = null;
let cpuLast;
function cpuUsage() {
  const totals = os.cpus().reduce((sum,cpu) => {
    sum.idle += cpu.times.idle;
    sum.total += Object.values(cpu.times).reduce((a,b) => a+b,0);
    return sum;
  },{idle:0,total:0});
  const delta = cpuLast && totals.total - cpuLast.total;
  const usage = delta > 0 ? Math.round(100 * (1 - (totals.idle-cpuLast.idle)/delta)) : null;
  cpuLast = totals;
  return usage;
}
function helper(file,args=[]) {
  return new Promise((resolve,reject) => {
    execFile('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,file),...args],
      {windowsHide:true,timeout:8500}, (error,output) => error ? reject(error) : resolve(output.trim()));
  });
}
function refreshBluetooth() {
  helper('bluetooth.ps1').then(output => { bluetooth = JSON.parse(output); }).catch(() => { bluetooth = null; });
}
refreshBluetooth();
setInterval(refreshBluetooth, 20000);
function iconFor(target) {
  if (!iconCache.has(target)) {
    iconCache.set(target,helper('icon.ps1',[target]).then(output => Buffer.from(output,'base64')).catch(() => null));
  }
  return iconCache.get(target);
}

function phoneAddress() {
  const candidates = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const address of addresses) {
      if (address.family !== 'IPv4' || address.internal || /^169\.254\./.test(address.address)) continue;
      const virtual = /virtual|vmware|vbox|hyper-v|vethernet|tailscale|zerotier|vpn|loopback|tunnel/i.test(name);
      const physical = /wi-?fi|wlan|wireless|ethernet/i.test(name);
      const privateAddress = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(address.address);
      candidates.push({address:address.address, rank:(virtual ? -10 : 0) + (physical ? 4 : 0) + (privateAddress ? 2 : 0) + (/wi-?fi|wlan|wireless/i.test(name) ? 2 : 0)});
    }
  }
  candidates.sort((a,b) => b.rank-a.rank);
  return candidates.length ? 'http://'+candidates[0].address+':'+port+'/' : '';
}

function open(target) {
  // Pass the target as data to PowerShell, including paths containing quotes.
  const child = spawn('powershell.exe', ['-NoProfile','-NonInteractive','-Command',
    "Start-Process -FilePath $env:HOMELAB_DECK_TARGET -ErrorAction Stop"], {
    env:{...process.env,HOMELAB_DECK_TARGET:target}, windowsHide:true, stdio:'ignore'
  });
  return new Promise((resolve,reject) => {
    child.once('error',reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error('Launch failed')));
  });
}

let telemetry = {host:os.hostname(), history:[]};
let previous, pending;
function windowsStatus(action) {
  return new Promise((resolve,reject) => {
    execFile('powershell.exe', ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'status.ps1'),action],
      {windowsHide:true,timeout:8500}, (error, output) => error ? reject(error) : resolve(output));
  });
}
function refreshStatus() {
  if (pending) return pending;
  pending = windowsStatus('status').then(output => {
    const sample = JSON.parse(output);
    const at = Date.now();
    let down = 0, up = 0;
    if (previous) {
      const elapsed = (at - previous.at) / 1000;
      down = Math.max(0, sample.rx - previous.rx) * 8 / elapsed / 1e6;
      up = Math.max(0, sample.tx - previous.tx) * 8 / elapsed / 1e6;
    }
    previous = {at,rx:sample.rx,tx:sample.tx};
    telemetry = {host:os.hostname(),music:sample.music,battery:sample.battery,charging:sample.charging,
      down,up,internet:sample.internet,gpu:sample.gpu,cpu:cpuUsage(),ram:Math.round(100*(1-os.freemem()/os.totalmem())),history:telemetry.history.concat(down).slice(-24)};
  }).catch(error => {
    console.error('Status unavailable:',error.message);
    telemetry = {host:os.hostname(),history:[]};
    previous = undefined;
  }).finally(() => { pending = undefined; });
  return pending;
}
refreshStatus();
setInterval(refreshStatus, 4000);
const server = http.createServer(async (req,res) => {
  function send(status, data, type = 'application/json; charset=utf-8') {
    res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
  }
  const remote = req.socket.remoteAddress;
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  const local = loopback && ['127.0.0.1:'+port, 'localhost:'+port].includes(req.headers.host);
  const route = req.url;
  if (req.method === 'GET' && route === '/') return send(200,page,'text/html; charset=utf-8');
  if (req.method === 'GET' && route === '/setup' && local && req.headers['x-deck-ui'] === '1') {
    res.setHeader('Set-Cookie','deck_session='+key+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000');
    return send(200,{pin});
  }
  const pairing = req.method === 'POST' && route === '/pair';
  const authenticated = req.headers['x-deck-key'] === key || (req.headers.cookie || '').split(/;\s*/).includes('deck_session='+key);
  if (!authenticated && !pairing) return send(403,{error:'Pair this device to connect.'});
  if (req.method === 'POST' && req.headers['x-deck-ui'] !== '1' && req.headers['x-deck-key'] !== key)
    return send(403,{error:'Open the dashboard to send commands.'});
  if (req.method === 'GET' && route.startsWith('/icon/')) {
    const item = buttons.find(b => buttonId(b) === route.slice(6));
    const png = item && await iconFor(item.target);
    if (png) return send(200,png,'image/png');
    return send(404,{error:'Icon unavailable.'});
  }
  if (req.method === 'GET' && route === '/tasks') return send(200,{tasks});
  if (req.method === 'GET' && route === '/status') return send(200,{...telemetry,bluetooth,ip:req.socket.localAddress,phoneUrl:local ? phoneAddress() : null});
  if (req.method === 'GET' && route === '/buttons') return send(200,{buttons:buttons.map(b=>({id:buttonId(b),name:b.name,target:local ? b.target : ''})),local});
  if (req.method !== 'POST') return send(404,{error:'Unknown action.'});
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) { send(413,{error:'Text is too long.'}); return; }
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (pairing) {
      if (Date.now() - attemptWindow > 60000) { attempts = 0; attemptWindow = Date.now(); }
      if (++attempts > 10) return send(429,{error:'Too many attempts. Try again in a minute.'});
      if (data.pin !== pin) return send(403,{error:'Check the six-digit code on your PC.'});
      res.setHeader('Set-Cookie','deck_session='+key+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000');
    } else if (route === '/tasks') {
      let next;
      if (data.action === 'add' && typeof data.text === 'string' && data.text.trim() && data.text.length <= 120 && tasks.length < 100) {
        next = tasks.concat({id:crypto.randomUUID(),text:data.text.trim(),done:false});
      } else if (data.action === 'toggle' && typeof data.done === 'boolean' && tasks.some(task => task.id === data.id)) {
        next = tasks.map(task => task.id === data.id ? {...task,done:data.done} : task);
      } else if (data.action === 'delete' && tasks.some(task => task.id === data.id)) {
        next = tasks.filter(task => task.id !== data.id);
      } else return send(400,{error:'Task could not be updated.'});
      fs.writeFileSync(tasksFile+'.tmp',JSON.stringify(next),'utf8');
      fs.renameSync(tasksFile+'.tmp',tasksFile);
      tasks = next;
      return send(200,{tasks});
    } else if (route === '/media' && ['previous','playpause','next'].includes(data.action)) {
      await windowsStatus(data.action);
      await refreshStatus();
    } else if (route === '/launch') {
      const button = buttons.find(b => buttonId(b) === data.id);
      if (!button) return send(404,{error:'Button was removed. Reload the page.'});
      await open(button.target);
    } else if (route === '/configure' && local) {
      const list = data.buttons;
      if (!Array.isArray(list) || list.length > 100 || list.some(b => !b || typeof b.name !== 'string' || !b.name.trim() || b.name.length > 60 || typeof b.target !== 'string' || !b.target.trim() || b.target.length > 600))
        return send(400,{error:'Each button needs a name and a Windows app or file path.'});
      const next = list.map(b=>({name:b.name.trim(),target:b.target.trim()}));
      fs.writeFileSync(config+'.tmp',JSON.stringify(next,null,2),'utf8');
      fs.renameSync(config+'.tmp',config);
      buttons = next;
    } else return send(404,{error:'Action unavailable.'});
    return send(200,{ok:true});
  } catch (error) {
    console.error(error.message);
    return send(500,{error:'Windows could not complete this action.'});
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? 'Port '+port+' is already in use. Stop the other instance or set DECK_PORT.'
    : error.message);
  process.exit(1);
});
server.listen(port,'0.0.0.0', () => {
  console.log('On this PC: http://127.0.0.1:'+port+'/');
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const address of addresses) if (address.family === 'IPv4' && !address.internal)
      console.log(name+': http://'+address.address+':'+port+'/');
  }
  const phone = phoneAddress();
  if (phone) console.log('On your phone: '+phone);
  console.log('Pairing code: '+pin);
  if (process.argv.includes('--open')) {
    open('http://127.0.0.1:'+port+'/').catch(() => {
      console.error('Could not open your browser. Use the PC address above.');
    });
  }
});


