'use strict';

const EventEmitter = require('events').EventEmitter;

const Session = require(`./session`);

class rtcpeerService extends EventEmitter {
  constructor(extension, config) {
    super(extension.addonManager, extension.manifest.id);
    console.log(`[${this.constructor.name}]`, `constructor() >> `);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;
    this.laborsManager = this.extension.laborsManager;

    this.config = config.rtcpeer;

    this.sessions = [];

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    this.initConfigHandler();
  }

  initConfigHandler() {
    console.log(`[${this.constructor.name}]`, `initConfigHandler() >> `);
    this.configManager.on(`CONFIG_SAVE`, (config) => this.config = config.rtcpeer);
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
  }

  shout(message, type) {
    message = message.type == `string` ? message : JSON.stringify(message);
    this.sessions.forEach(session => {
      if(
        session.channel && 
        session.channel.sender && 
        session.channel.sender.readyState == `open`
      ) {
        // console.log(`[${this.constructor.name}]`, `message >> `, message);
        // session.channel.sender.send(message);
        this.send(session, message, type);
      }
    });
  }

  send(session, message, type) {
    session = (typeof session == `string`) ? this.getSession(session) : session;
    message = type
    ? JSON.stringify({
        type: type,
        message: message
      })
    : message;
    // console.log(message);
    session.send(message);
  }

  createSession(channelOptions, iceConfig = this.config.server.config.ice) {
    console.log(`[${this.constructor.name}]`, `createSession() >> `);
    return new Promise((resolve, reject) => {
      let session = null;
      Promise.resolve()
      .then(() => session = new Session(iceConfig, { config: this.config.session }))
      .then(() => session.createPeerConnection())
      .then(() => session.createChannel())
      .then(() => session.createOffer())
      .then(() => this.setSessionHandler(session))
      .then(() => this.sessions.push(session))
      .then((ret) => resolve(session))
      .catch((err) => reject(err));
    });
  }

  setSessionHandler(session) {
    let sessionEvent = {};
    sessionEvent = {
      destroy: (sessionId) => {
        Object.keys(sessionEvent).forEach((event) => session.removeListener(event, sessionEvent[event]));
        this.sessions = this.sessions.filter(e => e.id != sessionId);
        console.log(`Sessions:`, JSON.stringify(this.sessions.map(e => e.id), null, 2));
      }
    };
    Object.keys(sessionEvent).forEach((event) => session.on(event, sessionEvent[event]));
  }

  getSession(id) {
    console.log(`[${this.constructor.name}]`, `getSession(${id || ``}) >> `);
    return this.sessions.find(e => e.id == id);
  }

  deleteSession(session) {
    console.log(`[${this.constructor.name}]`, `deleteSession(${session ? session.id || session : ``}) >> `);
    session.destroy();
    this.sessions = this.sessions.filter(e => e.id != session.id);
  }

  getOffer(session) {
    console.log(
      `[${this.constructor.name}]`, 
      `getOffer(${typeof session == `string` ? session : session.id}) >> `
    );
    session = typeof session == `object` ? session : this.getSession(session);
    return session.getOffer();
  }

  getOfferCandidate(session) {
    console.log(
      `[${this.constructor.name}]`, 
      `getOfferCandidate(${typeof session == `string` ? session : session.id}) >> `
    );
    session = typeof session == `object` ? session : this.getSession(session);
    return session.getOfferCandidate();
  }

  addAnswer(session, answer) {
    console.log(
      `[${this.constructor.name}]`, 
      `addAnswer(${typeof session == `string` ? session : session.id}) >> `
    );
    session = typeof session == `object` ? session : this.getSession(session);
    return session.addAnswer(answer);
  }

  addAnswerCandidate(session, answerCandidate) {
    console.log(
      `[${this.constructor.name}]`, 
      `addAnswerCandidate(${typeof session == `string` ? session : session.id}) >> `
    );
    session = typeof session == `object` ? session : this.getSession(session);
    return session.addAnswerCandidate(answerCandidate);
  }
}

module.exports = rtcpeerService;