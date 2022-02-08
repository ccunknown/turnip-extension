'use strict';

const Config = require(`../config/config`);
const fetch = require('node-fetch');
const EventEmitter = require('events').EventEmitter;
const request = require('request');
// const AbortController = globalThis.AbortController || await import('abort-controller');
// const AbortController = globalThis.AbortController;
const mustache = require('mustache');
const Queue = require(`bull`);

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
    this.requestQueue = new Queue(`requestQueue`);
    // this.historyQueue = new Queue(`historyQueue`);

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
      .then(() => this.initJobConfig())
      .then(() => this.initWebhookList())
      .then(() => this.initMessageHandler())
      .then(() => this.initRequestHandler())
      .then(() => this.initRequestQueueProcess())
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

  initJobConfig() {
    console.log(this.constructor.name, `: initJobConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.configManager.getConfigJob())
      .then((jobConfig) => this.jobConfig = jobConfig)
      .then(() => resolve(this.jobConfig))
      .catch((err) => reject(err));
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
    return ;
  }

  initRequestQueueProcess() {
    console.log(`[${this.constructor.name}]`, `initRequestQueueProcess() >> `);
    this.requestQueue.process(
      `webhook`,
      this.jobConfig.process.concurrency,
      // Config.job.process.concurrency,
      // Number(process.env[`JOB_PROCESS_CONCURRENCY`]), 
      // 5,
      (job, done) => {
        console.log(`JOB Process requestQueue() >> `);
        console.log(`job id[${job.id}]`);
        Promise.resolve()
        .then(() => this.requestQueueProcess(job.data.webhookName, job.data.options))
        .then((res) => done(res))
        .catch((err) => done(err));
      }
    );
    return ;
  }

  requestQueueProcess(webhookName, reqOptions) {
    return new Promise((resolve, reject) => {
      let timeout;
      let timestamp = {
        req: {},
        res: {}
      };
      let record = {};
      Promise.resolve()
      .then(() => {
        timestamp.req.unix = Date.now();
        timestamp.req.isoString = new Date(timestamp.req.unix).toISOString();
        timeout = setTimeout(() => {
          throw new Error(`Job process timeout!`);
        }, Config.job.process.timeout);
        // }, Number(process.env[`JOB_PROCESS_TIMEOUT`]));
        // }, 10000);
      })
      .then(() => {
        console.log(`[${this.constructor.name}]`, `pre-call makeRequest()`);
        return this.makeRequest(reqOptions);
      })
      .then((res) => {
        clearTimeout(timeout);
        timestamp.res.unix = Date.now();
        timestamp.res.isoString = new Date(timestamp.req.unix).toISOString();
        record = {
          timestamp: timestamp,
          request: reqOptions,
          respond: res
        };
        return record;
      })
      .then((record) => this.historyService.pushRecord(webhookName, record))
      .then(() => resolve(record))
      .catch((err) => reject(err));
    });
  }

  initHistoryQueueProcess() {

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
    console.log(`[${this.constructor.name}]`, `onThingUpdate() >> `);
    this.webhookList.map((webhook) => {
      if(!webhook.enable)
        return ;

      let option = {
        url: webhook.url,
        method: webhook.method,
        headers: {},
        insecure: webhook.unverify,
        // insecureHTTPParser: webhook.unverify,
        rejectUnauthorized: !webhook.unverify,
        strictSSL: !webhook.unverify,
        body: webhook.payload
      };

      for(let i in webhook.headers) {
        option.headers[webhook.headers[i].key] = webhook.headers[i].value;
      }

      let optionStr = mustache.render(JSON.stringify(option), data);

      //  Add to queue.
      try {
        console.log(`[${this.constructor.name}]`, `pre-add`);
        this.requestQueue.add(
          `webhook`, 
          {
            webhookName: webhook.name,
            options: JSON.parse(optionStr)
          },
          {
            // timeout: Number(process.env[`JOB_QUEUE_TIMEOUT`])
            timeout: Config.job.queue.timeout
          }
        );
        console.log(`[${this.constructor.name}]`, `post-add`);
      } catch(err) {
        console.error(err);
      }
    });
  }

  makeRequest(options) {
    console.log(`[${this.constructor.name}]`, `makeRequest() >> `);
    // console.log(`options: ${JSON.stringify(options, null, 2)}`);
    return new Promise((resolve, reject) => {
      let controller;
      let timeout;
      let response = {};
      Promise.resolve()
      .then(() => {
        console.log(`options: ${JSON.stringify(options, null, 2)}`);
        // controller = new AbortController();
        // timeout = setTimeout(() => {
        //   controller.abort();
        // }, Number(process.env[`JOB_REQUEST_TIMEOUT`]));
        // options.signal = controller.signal;
        // console.log(`options 2: ${JSON.stringify(options, null, 2)}`);
        return ;
      })
      .then(() => {
        console.log(`[${this.constructor.name}]`, `pre-fetch`);
        return fetch(`${options.url}`, options);
      })
      .then((res) => {
        response.code = res.status;
        response.headers = res.headers;
        return res.text();
      })
      .then((body) => {
        response.body = body;
        return response;
      })
      .then((res) => {
        clearTimeout(timeout);
        console.log(`res: ${JSON.stringify(res, null, 2)}`);
        console.log(`[${this.constructor.name}]`, `pre-resolve`);
        resolve(res);
      })
      .catch((err) => reject(err));
    });
  }

  // makeRequest(option) {
  //   return new Promise((resolve, reject) => {
  //     request(option , (err, resp, body) => {
  //       if(err) {
  //         //reject(err);
  //         //console.error(err);
  //         resolve(err);
  //       }
  //       else {
  //         resolve({
  //           code: resp.statusCode,
  //           headers: resp.headers,
  //           body: body
  //         });
  //       }
  //     });
  //   });
  // }
}

//inherits(webhookService, EventEmitter);
module.exports = webhookService;