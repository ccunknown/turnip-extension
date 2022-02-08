'use strict';

const EventEmitter = require('events').EventEmitter;
const request = require('request');

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

//const ReopeningWebSocket = require('../lib/reopening-web-socket');
const Websocket = require('../lib/websocket');

class wsocketService extends EventEmitter {
  constructor(extension, config) {

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
    console.log(`wsocketService: init() >> `);
  }

  start() {
    console.log(`wsocketService: start() >> `);
    return new Promise((resolve, reject) => {
      this.initialThingsSchema()
      .then(() => this.configManager.getConfig())
      .then((config) => {
        this.reopeningWebsocket(config.account.jwt);
        resolve();
      });
    });
  }

  stop() {

  }

  reopeningWebsocket(jwt) {
    console.log(`wsocketService: openWebsocket() >> `);
    if(!this.websocket) {
      this.websocket = new Websocket(`ws://localhost:8080/things?jwt=${jwt}`);
      this.websocket.create();
    }
    else {
      this.websocket.drop();
    }

    this.websocket.connect();

    this.websocket.removeAllListeners();
    this.websocket.on('WEBSOCKET_MESSAGE', (ws, message) => this.onMessage(message));
  }

  onMessage(event) {
    //const message = JSON.parse(event.data);
    if(event && event.type && event.type == `utf8` && event.utf8Data) {
      let message = JSON.parse(event.utf8Data);
      //console.log(`wsocketService: onMessage : ${JSON.stringify(message)}`);
      
      let updateThing = (thing) => {
        //console.log(`t : ${JSON.stringify(thing, null, 2)}`);
        switch(message.messageType) {
          case `connected`:
            thing.connected = message.data;
            thing.property.name = `connected`;
            thing.property.origin = `connected`;
            thing.property.value = message.data;
            break;
          case `propertyStatus`:
            for(let i in message.data) {
              thing.property.name = `prop-${i}`;
              thing.property.origin = `${i}`;
              thing.property.value = message.data[i];
            }
            break;
          default :
            console.error(`Message type '${message.messageType}' undefined.`);
            break;
        }
        if(thing.property.name) {
          //console.log(`update : ${JSON.stringify(thing)}`);
          this.emit('UPDATE', this, thing);
        }
      };

      let t = this.get(message.id);
      if (!t) {
        this.initialThingsSchema()
        .then(() => {
          t = this.get(message.id);
          if(!t) {
            console.error(`Not found thing with id '${message.id}'.`);
            return ;
          }
          updateThing(t);
        });
      }
      else
        updateThing(t);
    }
    else
      console.log(`Unhandle websocket message : ${event}`);
    return ;
  }

  initialThingsSchema() {
    console.log(`wsocketService: initialThingsSchema() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.getConfig()
      .then((config) => this.getSchemaWithToken(config.account.jwt))
      .then((thingsSchemaString) => JSON.parse(thingsSchemaString))
      .then((thingsSchema) => this.buildThingsSchema(thingsSchema))
      .then(() => resolve());
    });
  }

  buildThingsSchema(thingsSchema) {
    console.log(`wsocketService: initialThingsSchema() >> `);
    return new Promise((resolve, reject) => {
      this.things = [];
      thingsSchema.map((thing, id) => {
        let result = JSON.parse(JSON.stringify(thing));
        let schema = {
          meta: thing,
          id: thing.href.replace(`/things/`, ``),
          connected: false,
          property: {
            name: null,
            origin: null,
            value: null
          }
        };
        this.things.push(schema);
        //console.log(`schema build id : ${schema.id}`);
        //console.log(`schema build title : ${schema.meta.title}`);
      });
      //console.log(`this.things : ${JSON.stringify(this.things)}`);
      resolve();
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

  get(id) {
    let arr = this.things.filter((elem) => id == elem.id);
    if(arr.length == 1)
      return JSON.parse(JSON.stringify(arr[0]));
    else if(arr.length == 0) {
      console.error(`Not found thing with id '${id}'.`);
      return null;
    }
    else {
      console.error(`Found multiple things with id '${id}'.`);
      return JSON.parse(JSON.stringify(arr[0]));
    }
  }

  makeRequest(option) {
    return new Promise((resolve, reject) => {
      request(option , (err, resp, body) => {
        if(err)
          reject(err);
        console.log(`body: ${body}`);
        resolve(body);
      });
    });
  }
}

//inherits(wsocketService, EventEmitter);
module.exports = wsocketService;