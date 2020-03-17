const WebSocketClient = require('websocket').client;
const WebSocketConnection = require('websocket').connection;

const EventEmitter = require('events').EventEmitter;
const util = require('util');



// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//
//								Constructor Section								//
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//

function websocket(url) {

	EventEmitter.call(this);

	this.url = url;

	this.socket = null;
	this.connection = null;
	this.closeReasonCode = null;

	this.status = 9000;

	this.emit('WEBSOCKET_UNAVAILABLE', this);
}

util.inherits(websocket, EventEmitter);


websocket.STATUS_IDLE = 9000;

websocket.STATUS_CONNECTION_CLOSING = 1000;
websocket.STATUS_CONNECTION_CLOSED = 1001;
websocket.STATUS_CONNECTION_CLOSED_WITH_CAUSE = 1002;

websocket.STATUS_CONNECTING = 2000;
websocket.STATUS_CONNECT_SUCCESS = 2001;
websocket.STATUS_CONNECT_FAIL = 2002;

websocket.STATUS_CONNECTION_ERROR = 3001;


websocket.statusName = {
	9000: "STATUS_IDLE",

	1000: "STATUS_CONNECTION_CLOSING",
	1001: "STATUS_CONNECTION_CLOSED",
	1002: "STATUS_CONNECTION_CLOSED_WITH_CAUSE",

	2000: "STATUS_CONNECTING",
	2001: "STATUS_CONNECT_SUCCESS",
	2002: "STATUS_CONNECT_FAIL",
	
	3001: "STATUS_CONNECTION_ERROR"
};



// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//
//							Get Informations Section							//
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//
websocket.prototype.getStatus = function() {
	if(!websocket.statusName.hasOwnProperty(this.status)) {
		console.error("Websocket status code ["+this.status+"] unknow!!!");
		return null;
	}
	return websocket.statusName[this.status];
}



// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//
//							WebSocket Operations Section						//
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//

websocket.prototype.create = function() {
	var client = new WebSocketClient();
	var parent = this;

	client.on('connectFailed', (error) => {
		this.status = websocket.STATUS_CONNECT_FAIL;
		this.emit('WEBSOCKET_CONNECT_FAIL', this, error);
	});

	client.on('connect', async (connection) => {
		this.connection = connection;

		connection.on('close', (code, description) => {
			this.status = websocket.STATUS_CONNECTION_CLOSED;
			this.closeReasonCode = code;

			this.emit('WEBSOCKET_CONNECTION_CLOSED', this, code, description);
		});

		connection.on('error', (error) => {
			this.status = websocket.STATUS_CONNECTION_ERROR;
			this.emit('WEBSOCKET_CONNECTION_ERROR', this, error);
		});

		connection.on('message', async (message) => {
			this.emit('WEBSOCKET_MESSAGE', this, message);
		});

		this.status = websocket.STATUS_CONNECT_SUCCESS;
		this.emit('WEBSOCKET_CONNECT_SUCCESS', this);
		//parent.console.log("respond : \n"+JSON.stringify(properties, null, 2));
	});

	this.websocket = client;
	this.emit('WEBSOCKET_IDLE', this);
}

websocket.prototype.connect = function() {
	this.status = websocket.STATUS_CONNECTING;
	this.emit('WEBSOCKET_CONNECTING', this);
	this.websocket.connect(this.url, null);
}

websocket.prototype.drop = function() {
	this.status = websocket.STATUS_CONNECTION_CLOSING;
	this.emit('WEBSOCKET_CLOSING', this);
	if(this.connection)
		this.connection.drop(this.connection.CLOSE_REASON_NORMAL, null, false);
}



// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//
//								Module Export Section							//
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====//

module.exports = websocket;
