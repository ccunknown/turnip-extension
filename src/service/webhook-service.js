'use strict';

const EventEmitter = require('events').EventEmitter;
const request = require('request');
const mustache = require('mustache');

const {Defaults, Errors} = require('../../constants/constants');

class webhookService extends EventEmitter {
  constructor(extension) {

    //EventEmitter.call(this);
    console.log(`webhookService: constructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;
    this.laborsManager = this.extension.laborsManager;

    this.webhookList = [];
    this.service = {};

    //this.init();
  }

  start() {
    console.log(`webhookService: start() >> `);
    return this.init();
  }

  stop() {

  }

  init() {
    console.log(`webhookService: init() >> `);
    return new Promise((resolve, reject) => {
      this.initDependencies()
      .then(() => this.initWebhookList())
      .then(() => this.initMessageHandler())
      .then(() => resolve());
    });
  }

  initDependencies() {
    console.log(`webhookService: initDependencies() >> `);
    return new Promise((resolve, reject) => {
      Promise.all([
        this.laborsManager.getService(`wsocket-service`), 
        this.laborsManager.getService(`history-service`)
      ])
      .then((arr) => {
        this.wsocketService = arr[0].obj;
        this.historyService = arr[1].obj;
        resolve();
      });
    });
  }

  initWebhookList(list) {
    console.log(`webhookService: initWebhookList() >> `);
    return new Promise((resolve, reject) => {
      if(list) {
        this.webhookList = list;
        resolve(this.webhookList);
      }
      else {
        this.configManager.getConfigWebhook()
        .then((webhookList) => {
          this.webhookList = JSON.parse(JSON.stringify(webhookList));
          resolve(this.webhookList);
        });
      }
    });
  }

  initMessageHandler() {
    console.log(`webhookService: initMessageHandler() >> `);
    return new Promise((resolve, reject) => {
      resolve(this.wsocketService.on(`UPDATE`, (wsocket, data) => this.onThingUpdate(this.dataImprove(data))));
    });
  }

  dataImprove(data) {
    let type = (data.property.name == 'connected') ? `string` :  data.meta.properties[data.property.origin].type;
    let result = {
      timestamp: {
        unix: Date.now(),
        isoString: new Date().toISOString()
      },
      device: {
        id: data.id,
        title: data.meta.title,
        type: data.meta.type,
        description: data.meta.description,
        href: data.meta.href,
        connected: data.connected
      },
      property: {
        name: data.property.name,
        origin: data.property.origin,
        type: type,
        value: data.property.value,
        isString: type.toLowerCase() == `string`,
        isNumber: type.toLowerCase() == `number`,
        isBoolean: type.toLowerCase() == `boolean`
      }
    };
    return result;
  }

  onThingUpdate(data) {
    console.log(`webhookService: onThingUpdate() >> `);
    //console.log(JSON.stringify(data));
    this.webhookList.map((webhook) => {
      if(!webhook.enable)
        return ;
      let option = {
        url: webhook.url,
        method: webhook.method,
        headers: webhook.headers,
        body: webhook.payload
      };
      let optionStr = mustache.render(JSON.stringify(option), data);
      let result = JSON.parse(optionStr);
      
      this.makeRequest(result)
      .then((resp) => {
        let record = {
          request: option,
          respond: resp
        };
        this.historyService.pushRecord(webhook.name, record);
        //console.log(JSON.stringify(result));
        //console.log(resp);
      });
    });
  }

  makeRequest(option) {
    return new Promise((resolve, reject) => {
      request(option , (err, resp, body) => {
        if(err) {
          //reject(err);
          //console.error(err);
          resolve(err);
        }
        else {
          resolve({
            code: resp.statusCode,
            headers: resp.headers,
            body: body
          });
        }
      });
    });
  }
}

//inherits(webhookService, EventEmitter);
module.exports = webhookService;