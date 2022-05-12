'use strict';

const Path = require(`path`);
const { v1: uuid } = require(`uuid`);
const EventEmitter = require('events').EventEmitter;

class ChannelPair extends EventEmitter {
  constructor(peerConnection) {
    super();
    this.peerConnection = peerConnection;
    this.sender = null;
    this.receiver = null;

    this.init();
  }

  init() {
    this.createReceiver();
    this.createSender();
  }

  /*
    Sender
  */
  createSender() {
    console.log(`[${this.constructor.name}]`, `createSender() >> `);
    this.sender = this.peerConnection.createDataChannel(`server-to-client`);
    this.setupSenderListener();
  }

  setupSenderListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    this.sender[func](
      `open`, 
      (event) => this.emit(`sender-open`, event));
    this.sender[func](
      `close`, 
      (event) => this.emit(`sender-close`, event));
  }

  /*
    Receiver
  */
  createReceiver() {
    console.log(`[${this.constructor.name}]`, `createReceiver() >> `);
    this.peerConnection.addEventListener(
      `datachannel`,
      (event) => this.onReceiverRequest(event)
    );
  }

  onReceiverRequest(event) {
    console.log(`[${this.constructor.name}]`, `onReceiverRequest() >> `);
    this.receiver = event.channel;
    this.setupReceiverListener();
  }

  setupReceiverListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    this.receiver[func](
      `open`, 
      (event) => this.emit(`receiver-open`, event)
    );
    this.receiver[func](
      `message`, 
      (event) => this.emit(`receiver-message`, event)
    );
    this.receiver[func](
      `error`, 
      (event) => this.emit(`receiver-error`, event)
    );
    this.receiver[func](
      `close`, 
      (event) => this.emit(`receiver-close`, event)
    );
  }
}

module.exports = ChannelPair;