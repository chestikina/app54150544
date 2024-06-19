import openSocket from "socket.io-client";

class Socket {
    constructor(query) {
        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onConnectionError = this.onConnectionError.bind(this);
        this.getSocket = this.getSocket.bind(this);
        this.socket = openSocket.connect('https://clicker-battle.ru', {
            secure: true,
            path: '/app/socket.io',
            query,
            transports: ['websocket', 'polling', 'flashsocket'],
            reconnection: false
        });
    }

    onConnect(callback) {
        this.socket.on('connect', async function (object) {
            callback(object);
        });
    }

    onDisconnect(callback) {
        this.socket.on('disconnect', async function (object) {
            callback(object);
        });
    }

    onConnectionError(callback) {
        this.socket.on('connect_error', async function (object) {
            callback(object);
        });
    }

    getSocket() {
        return this.socket;
    }
}

export default Socket;