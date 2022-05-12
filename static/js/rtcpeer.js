// const { EventEmitter } = require('events');

class TurnipRTCPeer extends EventTarget {
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

    this.channel = {};

    // this.channel = {
    //   receiver: null,
    //   sender: null
    // };

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
  }

  // initDataChannel(options = this.channelOptions) {
  //   console.log(`[${this.constructor.name}]`, `initDataChannel() >> `);
  //   this.channel = this.peerConnection.createDataChannel(options.name);
  //   this.channel.addEventListener(`message`, event => {
  //     let data = JSON.parse(event.data);
  //     // console.log(`[${this.constructor.name}]`, `on message`, options.name, data);
  //     this.dispatchEvent(new CustomEvent(
  //       `channel-${options.name}`, 
  //       { detail: data }
  //     ));
  //   });
  // }

  /*
    Create sender channel function.
  */
  createSendChannel() {
    console.log(`[${this.constructor.name}]`, `createSendChannel() >> `);
    this.channel.sender = this.peerConnection.createDataChannel(`server-to-client`);
    this.channel.sender.addEventListener(`open`, (event) => this.onSendChannelOpen(event));
    this.channel.sender.addEventListener(`close`, (event) => this.onSendChannelClose(event));
  }

  setupSendChannelListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    this.channel.sender[func](`open`, (event) => this.onSendChannelOpen(event));
    this.channel.sender[func](`close`, (event) => this.onSendChannelClose(event));
  }

  onSendChannelOpen(event) {
    console.log(
      `[${this.constructor.name}]`, 
      `"client-to-server" channel open`
    );
  }

  onSendChannelClose(event) {
    console.log(
      `[${this.constructor.name}]`, 
      `"client-to-server" channel close`
    );
  }

  /*
    Create receiver channel function.
  */
  createReceiveChannel() {
    console.log(`[${this.constructor.name}]`, `createReceiveChannel() >> `);
    this.peerConnection.addEventListener(
      `datachannel`,
      (event) => this.onReceiveChannelRequest(event)
    );
  }

  onReceiveChannelRequest(event) {
    console.log(`[${this.constructor.name}]`, `onReceiveChannelRequest() >> `);
    this.channel.receiver = event.channel;
    this.setupReceiveChannelListener();
  }

  setupReceiveChannelListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    this.channel.receiver[func](`open`, (event) => this.onReceiveChannelOpen(event));
    this.channel.receiver[func](`message`, (event) => this.onReceiveChannelMessage(event));
    this.channel.receiver[func](`error`, (event) => this.onReceiveChannelError(event));
    this.channel.receiver[func](`close`, (event) => this.onReceiveChannelClose(event));
  }

  onReceiveChannelOpen(event) {
    console.log(
      `[${this.constructor.name}]`, 
      `"server-to-client" channel open`
    );
  }

  onReceiveChannelMessage(event) {
    let data = JSON.parse(event.data);
    console.log(`[${this.constructor.name}]`, `on message`, data);
    this.dispatchEvent(new CustomEvent(
      data.type, 
      { detail: JSON.parse(data.message) }
    ));
    // this.channel.sender.send(`test`);
  }

  onReceiveChannelError(event) {
    console.log(
      `[${this.constructor.name}]`, 
      `"server-to-client" channel error:`,
      event
    );
  }

  onReceiveChannelClose(event) {
    console.log(
      `[${this.constructor.name}]`, 
      `"client-to-server" channel of session[${session.id}] is close`
    );
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
      // .then(() => this.initDataChannel())

      // Create session.
      .then(() => this.createSession(this.channelOptions))
      .then((ret) => {
        this.sessionId = ret.id;
        console.log(`[${this.constructor.name}]`, `session id: ${this.sessionId}`);
      })

      .then(() => this.createReceiveChannel())
      .then(() => this.createSendChannel())

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
        `/rtcpeer/session`, 
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
      .then(() => this.restCall(
        `GET`, 
        `/config/rtcpeer/server/config/ice`
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getOffer(id = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(
        `GET`, 
        `/rtcpeer/session/${id}/offer`
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getOfferCandidate(id = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.restCall(
        `GET`, 
        `/rtcpeer/session/${id}/offer-candidate`
      ))
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
        `/rtcpeer/session/${id}/answer`,
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
        `/rtcpeer/session/${id}/answer-candidate`, 
        candidate
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }
}