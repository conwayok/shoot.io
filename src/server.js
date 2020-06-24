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

let PLAYERS = [];
const PLAYER_KEY_DOWN_EVENT = 'PLAYER_KEY_DOWN';
const PLAYER_KEY_UP_EVENT = 'PLAYER_KEY_UP';
const PLAYER_JOIN_EVENT = 'PLAYER_JOIN';
const PLAYER_DISCONNECT_EVENT = 'PLAYER_DISCONNECT';
const PLAYER_UPDATE_EVENT = 'PLAYER_UPDATE';
const PLAYER_SYNC_EVENT = 'PLAYER_SYNC';

io.on('connection', function (socket) {

  let uid = socket.id;

  console.log('user' + uid + ' connected');

  socket.on(PLAYER_KEY_DOWN_EVENT, function (k) {
    console.log(uid, k);
    socket.broadcast.emit(PLAYER_KEY_DOWN_EVENT, uid, k);
  });

  socket.on(PLAYER_UPDATE_EVENT, function (data) {
    console.log(uid + ' ' + JSON.stringify(data));
    socket.broadcast.emit(PLAYER_UPDATE_EVENT, uid, data);
  });

  // socket.on(PLAYER_KEY_UP_EVENT, function (k) {
  //   console.log(uid, k);
  //   socket.broadcast.emit(PLAYER_KEY_UP_EVENT, uid, k);
  // });

  socket.on(PLAYER_JOIN_EVENT, function (player) {
    console.log('player join ' + JSON.stringify(player));
    socket.emit(PLAYER_SYNC_EVENT, PLAYERS);
    player.id = uid;
    PLAYERS.push(player);
    socket.broadcast.emit(PLAYER_JOIN_EVENT, uid, player);
  });

  socket.on('disconnect', function () {
    console.log('user ' + uid + ' disconnected');

    socket.broadcast.emit(PLAYER_DISCONNECT_EVENT, uid);
  });
});

function removePlayer (uid) {
  PLAYERS = PLAYERS.filter(function (v, i, a) {
    return v.id !== uid;
  });
}