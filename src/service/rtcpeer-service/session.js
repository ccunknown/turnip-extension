'use strict';

const { v1: uuid } = require(`uuid`);
const EventEmitter = require('events').EventEmitter;
const {
  RTCPeerConnection,
  RTCIceCandidate,
} = require(`wrtc`);

const ChannelPair = require(`./channel-pair`);

class Session extends EventEmitter {
  constructor(iceConfig, options = {}) {
    super();
    this.iceConfig = iceConfig;
    this.state = `uninitialize`;
    const defaultOption = {
      id: uuid ? uuid() : null,
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

    this.initParam(this, defaultOption);
    this.initParam(this, options);
  }

  initParam(dest, src) {
    for(let i in src)
      dest[i] = src[i];
  }

  createPeerConnection(iceConfig = this.iceConfig) {
    console.log(`[${this.constructor.name}]`, `createPeerConnection() >> `);
    console.log(
      `[${this.constructor.name}]`, 
      `iceConfig`, 
      JSON.stringify(iceConfig, null, 2)
    );
    this.peerConnection = new RTCPeerConnection(iceConfig);
    this.peerConnection.onicecandidate = (e) => {
      if(e && e.type && e.candidate) {
        console.log(
          `[${this.constructor.name}]`,
          `session[${this.id}]`,
          `\n\t<type: ${e.type}>`,
          `\n\taddress: ${e.candidate.address}`,
          `\n\tport: ${e.candidate.port}`,
          `\n\tprotocol: ${e.candidate.protocol}`
        );

        const candidate = new RTCIceCandidate(e.candidate);
        this.offerCandidate.push(candidate);
      }
      else {
        console.log(`[${this.constructor.name}]`, this.id, e);
      }
    }
    return this.peerConnection;
  }

  createChannel(peerConnection = this.peerConnection) {
    console.log(`[${this.constructor.name}]`, `createChannel() >> `);
    this.channel = new ChannelPair(peerConnection);

    this.channel.on(`message`, (event) => this.onMessage(event))
  }

  onMessage(event) {
    console.log(`[${this.constructor.name}]`, `onMessage() >> `);
    console.log(event.data);
  }

  send(message) {
    this.channel.sender.send(message);
  }

  createOffer() {
    console.log(`[${this.constructor.name}]`, `createOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.peerConnection.createOffer())
      .then((offer) => {
        console.log(`[${this.constructor.name}]`, `offer`, offer);
        this.offer = offer;
        return this.peerConnection.setLocalDescription(offer);
      })
      .then(() => resolve(this.offer))
      .catch((err) => reject(err));
    })
  }

  getOffer() {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    // console.log(`[${this.constructor.name}]`, this.offer);
    return {
      type: this.offer.type,
      sdp: this.offer.sdp
    };
  }

  getOfferCandidate() {
    console.log(`[${this.constructor.name}]`, `getOfferCandidate() >> `);
    return this.offerCandidate;
  }

  addAnswer(answer) {
    console.log(`[${this.constructor.name}]`, `addAnswer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.peerConnection.setRemoteDescription(answer))
      .then(() => this.answer = answer)
      .then((ret) => resolve({ result: true && ret }))
      .catch((err) => reject(err));
    });
  }

  addAnswerCandidate(answerCandidate) {
    console.log(`[${this.constructor.name}]`, `addAnswerCandidate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        const candidate = new RTCIceCandidate(answerCandidate);
        this.peerConnection.addIceCandidate(candidate);
        this.answerCandidate.push(answerCandidate);
      })
      .then(() => resolve({ result: true }))
      .catch((err) => reject(err));
    })
  }

  destroy() {
    this.channel.sender && 
    this.channel.sender.setupSendChannelListener(false);
    this.channel.receiver && 
    this.channel.receiver.setupReceiveChannelListener(false);
    this.peerConnection.close();
  }
}

module.exports = Session;