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
    let onSenderOpen = (event) => this.emit(`sender-open`, event);
    let onSenderClose = (event) => this.emit(`sender-close`, event);
    this.sender[func](`open`, onSenderOpen);
    this.sender[func](`close`, onSenderClose);
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
    let onReceiverOpen = (event) => this.emit(`receiver-open`, event);
    let onReceiverMessage = (event) => this.emit(`receiver-message`, event);
    let onReceiverError = (event) => this.emit(`receiver-error`, event);
    let onReceiverClose = (event) => this.emit(`receiver-close`, event);
    this.receiver[func](`open`, onReceiverOpen);
    this.receiver[func](`message`, onReceiverMessage);
    this.receiver[func](`error`, onReceiverError);
    this.receiver[func](`close`, onReceiverClose);
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
          this.removeListener(`receiver-message`, onMessage);
        }
      };
      this.on(`receiver-message`, onMessage);
      // this.addEventListener(`receiver-message`, (payload) => onMessage(payload));
      timeout = setTimeout(
        () => {
          this.removeListener(`receiver-message`, onMessage);
          reject(new Error(`Call-respond timeout.`));
        }, 
        this.config.callrespond.timeout
      );
    });
  }
}

module.exports = ChannelPair;