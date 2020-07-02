const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.use(express.static(path.join(__dirname, 'client')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/mp.html');
});

app.get('/ai', function (req, res) {
  res.sendFile(__dirname + '/client/mp_ai.html');
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});

const MAP_WIDTH = 1280 * 2;
const MAP_HEIGHT = 720 * 2;

let PLAYERS = {};
const PLAYER_JOIN_EVENT = 'PLAYER_JOIN';
const PLAYER_DISCONNECT_EVENT = 'PLAYER_DISCONNECT';
const PLAYER_UPDATE_EVENT = 'PLAYER_UPDATE';
const PLAYER_SHOOT_EVENT = 'PLAYER_SHOOT';
const PLAYER_DIE_EVENT = 'PLAYER_DIE';
const PLAYER_SPAWN_EVENT = 'PLAYER_SPAWN';
const HEART_SPAWN_EVENT = 'HEART_SPAWN';
const HEART_CONSUME_EVENT = 'HEART_CONSUME';
const XP_CONSUME_EVENT = 'XP_CONSUME';
const XP_SPAWN_EVENT = 'XP_SPAWN';
const XP_SPAWN_STATIC_EVENT = 'XP_SPAWN_STATIC';
const XP_SET_POS_EVENT = 'XP_SET_POS';
const KILL_EVENT = 'KILL';

let HEARTS = {};
let XPS = {};

io.on('connection', function (socket) {

  let uid = socket.id;

  console.log('user' + uid + ' connected');

  socket.on(PLAYER_JOIN_EVENT, function (player) {
    console.log('player join ' + JSON.stringify(player));
    console.log('PLAYERS' + JSON.stringify(PLAYERS));

    // only sync if is not first player
    if (Object.keys(PLAYERS).length > 0 && PLAYERS.constructor === Object) {

      // sync players
      for (const [playerId, playerData] of Object.entries(PLAYERS)) {
        socket.emit(PLAYER_JOIN_EVENT, playerId, playerData);
      }

      // sync hearts
      for (const [heartId, heartPos] of Object.entries(HEARTS)) {
        socket.emit(HEART_SPAWN_EVENT, heartId, heartPos);
      }

      // sync xp
      let xps = {};
      for (const [xpId, xpData] of Object.entries(XPS)) {
        if (xpData.hasOwnProperty('stopX') && xpData.hasOwnProperty('stopY'))
          xps[xpId] = { x: xpData.stopX, y: xpData.stopY };
      }
      socket.emit(XP_SPAWN_STATIC_EVENT, xps);

      // socket.emit(PLAYER_SYNC_EVENT, PLAYERS);
      socket.broadcast.emit(PLAYER_JOIN_EVENT, uid, player);

    } else {
      // start random  spawning
      startSpawnHeart();
      startSpawnXp();
    }

    PLAYERS[uid] = player;
    console.log(JSON.stringify(PLAYERS));
  });

  socket.on(PLAYER_UPDATE_EVENT, function (data) {
    // console.log(JSON.stringify(data));
    let player = PLAYERS[uid];
    if (player !== undefined) {
      if (data.hasOwnProperty('x')) player.x = data.x;
      if (data.hasOwnProperty('y')) player.y = data.y;
      if (data.hasOwnProperty('rotation')) player.rotation = data.rotation;
      if (data.hasOwnProperty('hp')) player.hp = data.hp;
      if (data.hasOwnProperty('xp')) player.xp = data.xp;
      if (data.hasOwnProperty('totalXp')) player.totalXp = data.totalXp;
      if (data.hasOwnProperty('level')) player.level = data.level;
      if (data.hasOwnProperty('bulletType')) player.bulletType = data.bulletType;
      if (data.hasOwnProperty('scale')) player.scale = data.scale;
    }
    socket.broadcast.emit(PLAYER_UPDATE_EVENT, uid, data);
  });

  socket.on(PLAYER_SHOOT_EVENT, function (target) {
    socket.broadcast.emit(PLAYER_SHOOT_EVENT, uid, target);
  });

  socket.on(PLAYER_DIE_EVENT, function () {
    let player = PLAYERS[uid];
    if (player !== undefined) {
      player.isDead = true;
      spawnXp(player.x, player.y, player.totalXp);
      socket.broadcast.emit(PLAYER_DIE_EVENT, uid);
    }
  });

  socket.on(PLAYER_SPAWN_EVENT, function (pos) {
    PLAYERS[uid].isDead = false;
    socket.broadcast.emit(PLAYER_SPAWN_EVENT, uid, pos);
  });

  socket.on(HEART_CONSUME_EVENT, function (heartId) {
    delete HEARTS[heartId];
    socket.broadcast.emit(HEART_CONSUME_EVENT, heartId);
  });

  socket.on(XP_CONSUME_EVENT, function (xpId) {
    delete XPS[xpId];
    socket.broadcast.emit(XP_CONSUME_EVENT, xpId);
  });

  socket.on(XP_SET_POS_EVENT, function (xpId, pos) {
    let xp = XPS[xpId];
    if (xp !== undefined) {
      xp.stopX = pos.x;
      xp.stopY = pos.y;
    }
  });

  socket.on(KILL_EVENT, function (message) {
    socket.broadcast.emit(KILL_EVENT, message);
  });

  socket.on('disconnect', function () {
    console.log('user ' + uid + ' disconnected');
    delete PLAYERS[uid];
    console.log(JSON.stringify(PLAYERS));
    socket.broadcast.emit(PLAYER_DISCONNECT_EVENT, uid);

    if (Object.keys(PLAYERS).length === 0 && PLAYERS.constructor === Object) {
      resetServer();
    }
  });
});

setInterval(serverCleaner, 3000);

function serverCleaner () {
  if (io.engine.clientsCount === 0 &&
    Object.keys(PLAYERS).length > 0 &&
    PLAYERS.constructor === Object)
    resetServer();
}

function resetServer () {
  console.log('resetServer ' + Date.now());
  // if no players left, clear game state
  clearInterval(spawnHeartInterval);
  clearInterval(spawnXpInterval);
  PLAYERS = {};
  HEARTS = {};
  XPS = {};
}

let spawnHeartInterval = null;
let spawnXpInterval = null;

function startSpawnHeart () {
  console.log('startSpawnHeart');
  spawnHeartInterval = setInterval(spawnHeart, 3000);
}

function spawnHeart () {
  let spawnPos = getRandomPos(
    50,
    50,
    MAP_WIDTH - 50,
    MAP_HEIGHT - 50
  );
  let id = getRandomId();
  console.log('spawnHeart ' + id + ' ' + JSON.stringify(spawnPos));
  HEARTS[id] = spawnPos;
  io.sockets.emit(HEART_SPAWN_EVENT, id, spawnPos);
}

function startSpawnXp () {
  console.log('startSpawnXp');
  spawnXpInterval = setInterval(spawnXpStatic, 3000);
}

function spawnXpStatic () {
  let spawnPos = getRandomPos(
    50,
    50,
    MAP_WIDTH - 50,
    MAP_HEIGHT - 50
  );
  let id = getRandomId();
  console.log('spawnXpStatic ' + id + ' ' + JSON.stringify(spawnPos));
  XPS[id] = { stopX: spawnPos.x, stopY: spawnPos.y };
  let xp = [{ id: id, x: spawnPos.x, y: spawnPos.y }];
  io.sockets.emit(XP_SPAWN_STATIC_EVENT, xp);
}

function spawnXp (spawnX, spawnY, amount) {
  let xps = {};
  for (let i = 0; i < amount; ++i) {
    let xpId = getRandomId();
    let randomFlyTarget = getRandomPos(0, 0, 2560, 1440);
    let xpData = {
      x: spawnX,
      y: spawnY,
      target: randomFlyTarget,
      range: getRandomInt(50, 150)
    };
    xps[xpId] = xpData;
    XPS[xpId] = xpData;
  }
  io.emit(XP_SPAWN_EVENT, xps);
}

function getRandomInt (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min
  )) + min; //The maximum is exclusive and the minimum is inclusive
}

function getRandomPos (minX, minY, maxX, maxY) {
  let xPos = getRandomInt(minX, maxX);
  let yPos = getRandomInt(minY, maxY);
  return { x: xPos, y: yPos };
}

function getRandomId () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
}