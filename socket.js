const io = require("socket.io")();
const fs = require("fs");
const socketApi = {
    io: io
};

const rooms = {};

// établissement de la connexion
io.on('connection', (socket) => {
    console.log(`Connecté au client ${socket.id}`);

    socket.on('disconnect', function () {
        console.log('Got disconnect!');
        if (rooms[socket.game]) {
            rooms[socket.game].players = rooms[socket.game]?.players?.filter((el) => { return el.socket !== socket.id });
            if (rooms[socket.game]?.length === 0) {
                delete rooms[socket.game];
            }
            console.log(rooms[socket.game]);
            console.log(socket.game);
            io.sockets.in(socket.game).emit('left', rooms[socket.game]?.players);
        }
    });


    socket.on('create', function (game) {
        console.log(`${game.pseudo} created ${game.game}`);
        rooms[game.game] = { started: 0, players: [{ socket: socket.id, pseudo: game.pseudo, isOwner: 1 }] };
        socket.join(game.game);
        socket.game = game.game;
        io.sockets.in(game.game).emit('joined', rooms[game.game]?.players);
    });

    socket.on('join', function (game) {
        console.log(io.sockets.adapter.rooms);
        if (io.sockets.adapter.rooms.has(game.game)) {
            console.log(`${game.pseudo} joined ${game.game}`);
            rooms[game.game]?.players.push({ socket: socket.id, pseudo: game.pseudo, isOwner: 0 });

            socket.join(game.game);
            console.log(rooms);
            socket.game = game.game;
            io.sockets.in(game.game).emit('joined', rooms[game.game]?.players);
        } else {
            console.log('room not exists');
        }

    });

    socket.on('start', function ({ pseudo, code }) {

        if (
            rooms[code]?.players.find(el => { return el.pseudo === pseudo && el.isOwner === 1 })
            &&
            rooms[socket.game]?.players.length >= 3
        ) {

            console.log(`${pseudo} started ${code}`);
            let players = shuffle(rooms[code]?.players);
            let words = randwords();
            console.log(words);
            players[0].team = 0;
            players[0].lead = true;
            players[1].team = 1;
            players[1].lead = true;

            for (let i = 2; i < players.length; ++i) {
                players[i].team = i % 2;
                players[i].lead = false;
            }


            words = [...words]; // set to array
            io.sockets.in(code).emit('started', { words, players });
        }
    });
});


const randwords = () => {
    let set = new Set();
    let data = fs.readFileSync('words.txt');
    data += '';
    let lines = data.split('\n');
    while (set.size < 25) {
        set.add(lines[Math.floor(Math.random() * lines.length)]);
    }

    return set;
};

const shuffle = (array) => {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


module.exports = socketApi;