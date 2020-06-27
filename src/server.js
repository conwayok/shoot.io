const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/mp.html');
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});

const PLAYERS = {};
const PLAYER_JOIN_EVENT = 'PLAYER_JOIN';
const PLAYER_DISCONNECT_EVENT = 'PLAYER_DISCONNECT';
const PLAYER_UPDATE_EVENT = 'PLAYER_UPDATE';
const PLAYER_SYNC_EVENT = 'PLAYER_SYNC';
const PLAYER_SHOOT_EVENT = 'PLAYER_SHOOT';

io.on('connection', function (socket) {

  let uid = socket.id;

  console.log('user' + uid + ' connected');

  socket.on(PLAYER_JOIN_EVENT, function (player) {
    console.log('player join ' + JSON.stringify(player));
    console.log('PLAYERS' + JSON.stringify(PLAYERS));

    // only sync if is not first player
    if (Object.keys(PLAYERS).length > 0 && PLAYERS.constructor === Object) {
      socket.emit(PLAYER_SYNC_EVENT, PLAYERS);
      socket.broadcast.emit(PLAYER_JOIN_EVENT, uid, player);
    }

    PLAYERS[uid] = player;
    console.log();
  });

  socket.on(PLAYER_UPDATE_EVENT, function (data) {
    socket.broadcast.emit(PLAYER_UPDATE_EVENT, uid, data);

    let player = PLAYERS[uid];

    if (data.hasOwnProperty('x')) player.x = data.x;
    if (data.hasOwnProperty('y')) player.y = data.y;
    if (data.hasOwnProperty('rotation')) player.rotation = data.rotation;

    // todo: update player data in PLAYERS variable
  });

  socket.on(PLAYER_SHOOT_EVENT, function (target) {
    socket.broadcast.emit(PLAYER_SHOOT_EVENT, uid, target);
  });

  socket.on('disconnect', function () {
    console.log('user ' + uid + ' disconnected');
    // removePlayer(uid);
    delete PLAYERS[uid];
    console.log(JSON.stringify(PLAYERS));
    socket.broadcast.emit(PLAYER_DISCONNECT_EVENT, uid);
  });
});
