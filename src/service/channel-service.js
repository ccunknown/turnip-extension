'use strict';

const Path = require(`path`);
const EventEmitter = require('events').EventEmitter;
const { v1: uuid } = require(`uuid`);
const {
  RTCPeerConnection,
  RTCIceCandidate,
} = require(`wrtc`);

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

class channelService extends EventEmitter {
  constructor(extension, config) {
    super(extension.addonManager, extension.manifest.id);
    console.log(`[${this.constructor.name}]`, `constructor() >> `);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;
    this.laborsManager = this.extension.laborsManager;

    this.config = config.channel;

    this.sessions = [];

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    this.initConfigHandler();
  }

  initConfigHandler() {
    console.log(`[${this.constructor.name}]`, `initConfigHandler() >> `);
    this.configManager.on(`CONFIG_SAVE`, (config) => this.config = config.channel);
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
  }

  send(channelName, message) {
    console.log(`[${this.constructor.name}]`, `send() >> `);
    this.sessions.forEach(session => {
      if(session.channel && session.channel.readyState == `open` && session.channel.label == channelName) {
        console.log(`[${this.constructor.name}]`, `message >> `, message);
        session.channel.send(message);
      }
    });
  }

  createSession(channelOptions, config = this.config.ice) {
    console.log(`[${this.constructor.name}]`, `create() >> `);
    return new Promise((resolve ,reject) => {
      let session = null;
      Promise.resolve()
      .then(() => this.createBlankSession())
      .then((s) => session = s)
      .then(() => this.createPeerConnection(session.id, config))
      .then(() => this.createChannel(session.id, channelOptions))
      .then(() => this.createOffer(session.id))
      .then((ret) => resolve(session))
      .catch((err) => reject(err));
    })
  }

  getSession(id) {
    console.log(`[${this.constructor.name}]`, `getSession(${id || ``}) >> `);
    return this.sessions.find(e => e.id == id);
  }

  createBlankSession() {
    console.log(`[${this.constructor.name}]`, `createSession() >> `);
    const session = {
      id: uuid(),
      peerConnection: null,
      offer: null,
      answer: null,
      offerCandidate: [],
      answerCandidate: [],
      channel: null,
      metric: {
        createDate: (new Date()).toISOString(),
        failCount: 0,
        successCount: 0
      }
    };
    console.log(`[${this.constructor.name}]`, JSON.stringify(session, null, 2));
    this.sessions.push(session);
    return session;
  }

  deleteSession(session) {
    console.log(`[${this.constructor.name}]`, `deleteSession(${id || ``}) >> `);
    if(id) {
      session = typeof session == `object` ? session : this.getSession(session);
      if(session) {
        if(session.peerConnection) {
          session.peerConnection.close();
          session.peerConnection.removeEventListener(
            `datachannel`, 
            (event) => this.onDataChannelRequest(session, event)
          );
        }
        if(session.channel) { 
          session.channel.removeEventListener(
            `open`, 
            (event) => this.onChannelOpen(session, event)
          );
          session.channel.removeEventListener(
            `close`, 
            (event) => this.deleteSession(session.id)
          );
        }
        this.sessions = this.sessions.filter(e => e.id != sessionId);
      }
    }
    else {
      this.sessions.forEach((session) => this.deleteSession(session))
    }
  }

  createPeerConnection(session, config = this.config.ice) {
    console.log(`[${this.constructor.name}]`, `createPeerConnection() >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    if(session) {
      session.peerConnection = new RTCPeerConnection(config);
      session.peerConnection.onicecandidate = (e) => {
        if(e && e.type && e.candidate) {
          console.log(
            `[${this.constructor.name}]`,
            `<type: ${e.type}>`,
            `\n\taddress: ${e.candidate.address}`,
            `\n\tport: ${e.candidate.port}`,
            `\n\tprotocol: ${e.candidate.protocol}`
          );

          const candidate = new RTCIceCandidate(e.candidate);
          session.offerCandidate.push(candidate);
        }
        else {
          console.log(`[${this.constructor.name}]`, session.id);
        }
      }
      return session.peerConnection;
    }
    else {
      throw new Error(`Session with id "${id}" not found!`);
    }
  }

  createChannel(session, options) {
    console.log(`[${this.constructor.name}]`, `createChannel() >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    if(options.type == `data` && options.name) {
      return this.createDataChannel(session, options.name);
    }
  }

  createDataChannel(session, name) {
    console.log(`[${this.constructor.name}]`, `createDataChannel(${name || ``}) >> `);
    session = typeof session == `object` ? session : this.getSession(session);

    session.peerConnection.addEventListener(
      `datachannel`,
      (event) => this.onChannelRequest(session, event)
    );

    session.channel = session.peerConnection.createDataChannel(`${name}`);

    session.channel.addEventListener(
      `open`,
      (event) => this.onChannelOpen(session, event)
    );
    session.channel.addEventListener(
      `close`,
      (event) => this.deleteSession(session.id)
    );

    return session.channel;
  }

  onChannelRequest(session, event) {
    console.log(`[${this.constructor.name}]`, `on channel request`);
    session.channel = event.channel;
  }

  onChannelOpen(session, event) {
    console.log(`[${this.constructor.name}]`, `on channel open`);
  }

  createOffer(session) {
    console.log(`[${this.constructor.name}]`, `createOffer() >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => session.peerConnection.createOffer())
      .then((offer) => {
        console.log(`[${this.constructor.name}]`, `offer`, offer);
        session.offer = offer;
        return session.peerConnection.setLocalDescription(offer);
      })
      .then(() => resolve(session.offer))
      .catch((err) => reject(err));
    })
  }

  getOffer(session) {
    console.log(`[${this.constructor.name}]`, `getOffer(${session.id || session}) >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    console.log(`[${this.constructor.name}]`, session.offer);
    return {
      type: session.offer.type,
      sdp: session.offer.sdp
    };
  }

  getOfferCandidate(session) {
    console.log(`[${this.constructor.name}]`, `getOfferCandidate() >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    return session ? session.offerCandidate : null;
  }

  addAnswer(session, answer) {
    console.log(`[${this.constructor.name}]`, `addAnswer() >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        session &&
        session.peerConnection.setRemoteDescription(answer) &&
        (session.answer = answer)
      })
      .then((ret) => resolve({ result: true && ret }))
      .catch((err) => reject(err));
    });
  }

  addAnswerCandidate(session, answerCandidate) {
    console.log(`[${this.constructor.name}]`, `addAnswerCandidate() >> `);
    session = typeof session == `object` ? session : this.getSession(session);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        const candidate = new RTCIceCandidate(answerCandidate);
        session.peerConnection.addIceCandidate(candidate);
        session.answerCandidate.push(answerCandidate);
      })
      .then(() => resolve({ result: true }))
      .catch((err) => reject(err));
    })
  }
}

module.exports = channelService;