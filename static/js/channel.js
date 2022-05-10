// const { EventEmitter } = require('events');

class TurnipWebRTCChannel extends EventTarget {
  constructor(parent, channelOptions) {
    super();
    this.parent = parent;
    this.turnipApi = parent.turnipApi;
    this.api = parent.api;
    // this.rest = parent.rest;
    this.restCall = parent.turnipApi.restCall.bind(this.turnipApi);

    this.channelOptions = {
      type: channelOptions.type,
      name: channelOptions.name
    }

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
  }

  initDataChannel(options = this.channelOptions) {
    console.log(`[${this.constructor.name}]`, `initDataChannel() >> `);
    this.channel = this.peerConnection.createDataChannel(options.name);
    this.channel.addEventListener(`message`, event => {
      let data = JSON.parse(event.data);
      // console.log(`[${this.constructor.name}]`, `on message`, options.name, data);
      this.dispatchEvent(new CustomEvent(
        `channel-${options.name}`, 
        { detail: data }
      ));
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()

      // Get ice server config from server.
      .then(() => this.getIceServerConfig())
      .then((config) => this.iceConfig = config)

      // Create peer-connection.
      .then(() => this.createPeerConnection(this.iceConfig))

      // Setup data channel.
      .then(() => this.initDataChannel())

      // Create session.
      .then(() => this.createSession(this.channelOptions))
      .then((ret) => {
        this.sessionId = ret.id;
        console.log(`[${this.constructor.name}]`, `session id: ${this.sessionId}`);
      })

      // Get offer.
      .then(() => this.getOffer(this.sessionId))
      .then((offer) => this.offer = offer)
      .then(() => {
        console.log(`[${this.constructor.name}]`, this.offer);
        return this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.offer));
      })

      // Create answer.
      .then(() => this.peerConnection.createAnswer())
      .then((ansDesc) => this.answerDescription = ansDesc)
      .then(() => this.peerConnection.setLocalDescription(this.answerDescription))

      // Set answer to server.
      .then(() => this.addAnswer(
        this.sessionId,
        {
          type: this.answerDescription.type,
          sdp: this.answerDescription.sdp
        }
      ))

      // Get offer candidate.
      .then(() => this.getOfferCandidate(this.sessionId))
      .then((res) => this.offerCandidate = res)
      .then(() => {
        console.log(`[${this.constructor.name}]`, this.offerCandidate);
      })
      .then(() => this.offerCandidate.forEach(e => {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(e));
      }))

      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  createPeerConnection(iceConfig = this.iceConfig) {
    console.log(`[${this.constructor.name}]`, `createPeerConnection() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.peerConnection = new RTCPeerConnection(iceConfig);
        this.peerConnection.onicecandidate = (e) => {
          console.log(`[${this.constructor.name}]`, `candidate`, e.candidate);
          console.log(`[${this.constructor.name}]`, `sessionId`, this.sessionId);
          e.candidate && this.addAnswerCandidate(this.sesstionId, e.candidate.toJSON());
        };
      })
      .then(() => this.peerConnection)
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  createSession(channelOptions, iceConfig) {
    console.log(`[${this.constructor.name}]`, `createSession() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(
        `POST`,
        `/channel/session`, 
        {
          channelOptions: channelOptions,
          iceConfig: iceConfig ? iceConfig : undefined
        }
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  getIceServerConfig() {
    console.log(`[${this.constructor.name}]`, `getIceServerConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(`GET`, `/config/channel/server/config/ice`))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getOffer(id = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(`GET`, `/channel/session/${id}/offer`))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getOfferCandidate(id = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(`GET`, `/channel/session/${id}/offer-candidate`))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  addAnswer(id = this.sessionId, answer) {
    console.log(`[${this.constructor.name}]`, `addAnswer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(
        `POST`,
        `/channel/session/${id}/answer`,
        answer
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  addAnswerCandidate(id = this.sessionId, candidate) {
    console.log(`[${this.constructor.name}]`, `addAnswerCandidate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(
        `POST`,
        `/channel/session/${id}/answer-candidate`, 
        candidate
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }
}