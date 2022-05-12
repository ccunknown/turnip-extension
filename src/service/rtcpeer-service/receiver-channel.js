'use strict';

const Path = require(`path`);
const { v1: uuid } = require(`uuid`);
const EventEmitter = require('events').EventEmitter;

class ReceiverChannel extends EventEmitter {
  constructor(peerConnection) {
    super();
    this.peerConnection = peerConnection;
    this.channel = null;
  }

  create() {
    console.log(`[${this.constructor.name}]`, `createReceiveChannel() >> `);
    this.peerConnection.addEventListener(
      `datachannel`,
      (event) => this.onChannelRequest(event)
    );
  }

  onChannelRequest(event) {
    console.log(`[${this.constructor.name}]`, `onReceiveChannelRequest() >> `);
    this.channel = event.channel;
    this.setupReceiveChannelListener();
  }

  setupListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    this.channel[func](
      `open`, 
      (event) => this.emit(`open`, event)
    );
    this.channel[func](
      `message`, 
      (event) => this.emit(`message`, event)
    );
    this.channel[func](
      `error`, 
      (event) => this.emit(`error`, event)
    );
    this.channel[func](
      `close`, 
      (event) => this.emit(`close`, event)
    );
  }
}

module.exports = ReceiverChannel;