'use strict';

const Path = require(`path`);
const { v1: uuid } = require(`uuid`);
const EventEmitter = require('events').EventEmitter;
const Config = require(`./default`);

class ChannelPair extends EventEmitter {
  constructor(peerConnection, config = {}) {
    super();
    this.peerConnection = peerConnection;
    this.sender = null;
    this.receiver = null;

    this.config = Config.channel;

    this.callRespondStack = [];

    this.overWriteConfig(this.config, config);
    this.init();
  }

  init() {
    this.createReceiver();
    this.createSender();
  }

  overWriteConfig(dest, src) {
    for(let i in src)
      dest[i] = src[i];
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

  /*
    Call respond
  */
  callRespond(message) {
    let payload = {
      messageId: uuid(),
      type: `call-respond`,
      message: message
    };
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.sender.send(JSON.stringify(payload)))
      .then(() => this.waitForRespond(payload.messageId))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  waitForRespond(messageId) {
    return new Promise((resolve, reject) => {
      let timeout = null;
      let onMessage = (payload) => {
        // console.log(`[${this.constructor.name}]`, `[${typeof payload}]`, payload);
        let ret = JSON.parse(payload.data);
        if(ret && ret.messageId) {
          messageId && resolve(ret.message);
          clearTimeout(timeout);
        }
      };
      this.on(`receiver-message`, (payload) => onMessage(payload))
      timeout = setTimeout(
        () => {
          this.removeListener(`receiver-message`, (payload) => onMessage(payload));
          reject(new Error(`Call-respond timeout.`));
        }, 
        this.config.callrespond.timeout
      );
    });
  }
}

module.exports = ChannelPair;