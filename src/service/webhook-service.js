'use strict';

const EventEmitter = require('events').EventEmitter;
const request = require('request');
const mustache = require('mustache');

const {Defaults, Errors} = require('../../constants/constants');

class webhookService extends EventEmitter {
  constructor(extension, config) {

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
      .then(() => this.initRequestHandler())
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
          let tmp = [];
          this.webhookList.map((webhook) => {
            tmp.push(`${webhook.name}`);
          });
          console.log(`webhookService: webhookList : ${tmp}`);
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

  initRequestHandler() {
    this.routesManager.eventEmitter.on(`PUT/\\/config/`, (req) => this.onRouterProcess(req));
    this.routesManager.eventEmitter.on(`DELETE/\\/config/[^\\/]+/`, (req) => this.onRouterProcess(req));

    this.routesManager.eventEmitter.on(`PUT/\\/config\\/webhook\\/[^\\/]+/`, (req) => this.onRouterProcess(req));
    this.routesManager.eventEmitter.on(`DELETE/\\/config\\/webhook\\/[^\\/]+/`, (req) => this.onRouterProcess(req));

    this.routesManager.eventEmitter.on(`POST/\\/config\\/webhook/`, (req) => this.onRouterProcess(req));
    this.routesManager.eventEmitter.on(`PUT/\\/config\\/webhook/`, (req) => this.onRouterProcess(req));
    this.routesManager.eventEmitter.on(`DELETE/\\/config\\/webhook/`, (req) => this.onRouterProcess(req));
  }

  onRouterProcess(req) {
    console.log(`webhookService: onRouterProcess(${req.method}: ${req.path}) >> `);
    this.initWebhookList();
  }

  dataImprove(data) {
    let propMeta = (data.property.name == 'connected') ? {} :  data.meta.properties[data.property.origin];
    let type = (data.property.name == 'connected') ? `string` :  data.meta.properties[data.property.origin].type;

    let result = {
      timestamp: {
        unix: Date.now(),
        isoString: new Date().toISOString()
      },
      meta: data.meta,
      device: {
        id: data.id,
        title: data.meta.title,
        type: data.meta.type,
        description: data.meta.description,
        href: data.meta.href,
        connected: data.connected
      },
      property: {
        id: data.property.name,
        originId: data.property.origin,
        title: propMeta.title,
        unit: propMeta.unit,
        readOnly: propMeta.readOnly,
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
    // console.log(`webhookService: onThingUpdate() >> `);
    // console.log(JSON.stringify(data, null, 2));
    this.webhookList.map((webhook) => {
      if(!webhook.enable)
        return ;

      let option = {
        url: webhook.url,
        method: webhook.method,
        headers: {},
        insecure: webhook.unverify,
        rejectUnauthorized: !webhook.unverify,
        strictSSL: !webhook.unverify,
        body: webhook.payload
      };

      for(let i in webhook.headers) {
        option.headers[webhook.headers[i].key] = webhook.headers[i].value;
      }

      let optionStr = mustache.render(JSON.stringify(option), data);
      // console.log(`data : ${JSON.stringify(data, null, 2)}`);
      // console.log(`option : ${JSON.stringify(option, null, 2)}`);
      // console.log(`optionStr : ${JSON.stringify(optionStr, null, 2)}`);
      let req = JSON.parse(optionStr);
      
      let timestamp = {};
      timestamp.req = {};
      timestamp.res = {};
      timestamp.req.unix = Date.now();
      timestamp.req.isoString = new Date(timestamp.req.unix).toISOString();

      this.makeRequest(req)
      .then((res) => {
        timestamp.res.unix = Date.now();
        timestamp.res.isoString = new Date(timestamp.res.unix).toISOString();
        let record = {
          timestamp: timestamp,
          request: req,
          respond: res
        };
        //console.log(`record req : ${JSON.stringify(record.request, null, 2)}`);
        this.historyService.pushRecord(webhook.name, record);
        //console.log(JSON.stringify(result));
        //console.log(res);
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