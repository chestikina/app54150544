import openSocket from "socket.io-client";

class Socket {
    constructor() {
        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onConnectionError = this.onConnectionError.bind(this);
        this.call = this.call.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.connect = this.connect.bind(this);
        this.getSocket = this.getSocket.bind(this);
    }

    onConnect(callback) {
        this.socket.on('connect', callback);
    }

    onDisconnect(callback) {
        this.socket.on('disconnect', callback);
    }

    onConnectionError(callback) {
        this.socket.on('connect_error', callback);
    }

    call(method, params, callback) {
        this.socket.emit(method, params, callback);
    }

    subscribe(event, callback) {
        this.socket.on(event, callback);
    }

    unsubscribe(...events) {
        for (const event of events) {
            this.socket.removeAllListeners(event);
        }
    }

    connect(url, query) {
        if (this.socket) {
            this.socket.connect();
        } else {
            this.socket = openSocket.connect(url, {
                path: '/socket.io',
                query,
                transports: ['websocket', 'polling', 'flashsocket'],
                reconnection: false,
                pingTimeout: 60000
            });
        }
    }

    getSocket() {
        return this.socket;
    }
}

export default Socket;