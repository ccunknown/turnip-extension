'use strict';

const EventEmitter = require('events').EventEmitter;
const request = require('request');

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

const ReopeningWebSocket = require('../lib/reopening-web-socket');

class wsocketService extends EventEmitter {
  constructor(extension) {

    //EventEmitter.call(this);
    console.log(`wsocketService: constructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    this.things = [];

    this.init();
  }

  init() {
    console.log(`webhookService: init() >> `);
  }

  start() {
    console.log(`wsocketService: start() >> `);
    return new Promise((resolve, reject) => {
      let config;
      this.configManager.getConfig()
      .then((conf) => {
        config = conf;
        return this.getSchemaWithToken(config.account.jwt);
      })
      .then((thingsSchemaString) => JSON.parse(thingsSchemaString))
      .then((thingsSchema) => this.initialThingsSchema(thingsSchema))
      .then(() => this.reopeningWebsocket(config.account.jwt));
    });
  }

  stop() {

  }

  reopeningWebsocket(jwt) {
    if(!this.reopeningWebsocket)
      this.reopeningWebsocket = new ReopeningWebSocket(`ws://localhost:8080/things?jwt=${jwt}`);

    this.reopeningWebsocket.reopen();
    this.ws.addEventListener('message', this.onMessage);
  }

  onMessage(event) {
    const message = JSON.parse(event.data);

    console.log(`onMessage : ${JSON.stringify(message, null, 2)}`);
    if (message.messageType !== 'connected') {
      return;
    }
  }

  initialThingsSchema(thingsSchema) {
    console.log(`wsocketService: initialThingsSchema() >> `);
    return new Promise((resolve, reject) => {
      this.things = [];
      thingsSchema.map((thing, id) => {
        let result = JSON.parse(JSON.stringify(thing));
        let schema = {
          meta: thing,
          id: thing.href.replace(`/things/`, ``),
          connected: false,
          properties: {
            name: null,
            value: null
          }
        };
        this.things.push(schema);
      });
      console.log(`this.things : ${JSON.stringify(this.things, null, 2)}`);
    });
  }

  getSchemaWithToken(jwt) {
    return this.makeRequest({
      url: `http://localhost:8080/things/`,
      method: `GET`,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${jwt}`
      }
    });
  }

  getSchema() {
    return new Promise((resolve, reject) => {
      if(!this.db) {
        console.log("Recreate database object!!!");
        this.db = new Database(this.manifest.name);
      }

      this.db.open().then(async () => {
        var data = await this.db.loadThings();
        this.db.close();
        var result = {};
        for(var i in data)
          result[data[i].id] = JSON.parse(data[i].description);

        resolve(result);
      });
    });
  }

  initialWebsocket() {

  }

  get() {

  }

  makeRequest(option) {
    return new Promise((resolve, reject) => {
      request(option , (err, resp, body) => {
        if(err)
          reject(err);
        resolve(body);
      });
    });
  }
}

//inherits(wsocketService, EventEmitter);
module.exports = wsocketService;