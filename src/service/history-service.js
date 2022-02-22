'use strict';

const Path = require(`path`);
const Queue = require(`bull`);
const { Sequelize, DataTypes } = require(`sequelize`);
const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

class historyService extends EventEmitter {
  constructor(extension, config) {

    super(extension.addonManager, extension.manifest.id);
    console.log(`[${this.constructor.name}]`, `constructor() >> `);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;
    this.laborsManager = this.extension.laborsManager;

    this.history = {};
    this.config = config.history;
    this.thingsUpdateQueue = new Queue(`thingsUpdateQueue`);

    this.thingsDbPath = Path.join(
      this.addonManager.getUserProfile().dataDir,
      this.extension.manifest.id,
      this.config.things.database.sqlite.fname
    );

    this.model = {};

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    this.setArrayComparator();
    this.initConfigHandler();
    this.initSequelize();
  }

  initConfigHandler() {
    console.log(`[${this.constructor.name}]`, `initConfigHandler() >> `);
    this.configManager.on(`CONFIG_SAVE`, (config) => this.config = config.history);
  }

  initSequelize() {
    console.log(`[${this.constructor.name}]`, `initSequelize() >> `);
    this.sequelize = new Sequelize({
      dialect: `sqlite`,
      storage: this.thingsDbPath
    });
    this.model.thingUpdateRecord = this.sequelize.define(`ThingsHistory`, {
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        // defaultValue: Sequelize.literal(`CURRENT_TIMESTAMP`),
        defaultValue: DataTypes.NOW,
      },
      device: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      property: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    })
    return ;
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.initThingsUpdateQueueProcess())
      .then(() => this.initThingsHandler())
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  stop() {

  }

  initThingsHandler() {
    console.log(`[${this.constructor.name}]`, `initThingsHandler() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.laborsManager.getService(`wsocket-service`))
      .then((wsocketServiceSchema) => wsocketServiceSchema.obj)
      .then((wsocketService) => {
        wsocketService.on(`UPDATE`, (service, message) => {
          console.log(`[${this.constructor.name}]`, JSON.stringify(message));
          this.thingsUpdateQueue.add(
            `thing-update`,
            message
          ),
          {
            timeout: this.config.things.job.timeout
          }
        });
        resolve();
      })
      .catch((err) => reject(err));
    })
  }

  initThingsUpdateQueueProcess() {
    console.log(`[${this.constructor.name}]`, `initThingsUpdateQueueProcess() >> `);
    this.thingsUpdateQueue.process(
      `thing-update`,
      1, // processor concurency
      (job, done) => {
        console.log(`[${this.constructor.name}]`, `JOB Process thingsUpdateQueue() >> `);
        console.log(`[${this.constructor.name}]`, `job id[${job.id}]`);
        Promise.resolve()
        .then(() => this.thingsUpdateQueueProcess(job.data))
        .then((ret) => done(res))
        .catch((err) => done(err));
      }
    );
    return ;
  }

  thingsUpdateQueueProcess(data) {
    console.log(`[${this.constructor.name}]`, `thingsUpdateQueueProcess() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        console.log(
          `[${this.constructor.name}]`,
          `insert: ${data.id} [${data.property.name}] ${data.property.value}`
        );
        return this.model.thingUpdateRecord.create({
          device: data.id,
          property: data.property.name,
          value: data.property.value
        });
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  pushWebhookRecord(webhookName, record) {
    // console.log(`historyService: pushWebhookRecord(${webhookName}, [record]) >> `);
    if(!this.history.hasOwnProperty(webhookName)) {
      this.history[webhookName] = [];
    }
    this.history[webhookName].push(record);
    this.history[webhookName] = this.history[webhookName].sort(this.arrayCompare.reqTimestamp);
    //this.history[webhookName].map((h) => console.log(h.timestamp.req.unix));
    while(this.history[webhookName].length > this.config.webhook.limit)
      this.history[webhookName].pop();
    //console.log(JSON.stringify(this.history[webhookName]));
  }

  setArrayComparator() {
    this.arrayCompare = {
      reqTimestamp: (a, b) => {
        let ta = a.timestamp.req.unix;
        let tb = b.timestamp.req.unix;
        let result = (tb > ta) ? 1 : -1;
        //console.log(`tb/ta : ${tb}/${ta} : ${result}`);
        return result;
      }
    };
  }

  getWebhookRecord(webhookName) {
    let result = (webhookName) ? this.history[webhookName] : this.history;
    result = (result) ? result : [];
    return result;
  }

  clearWebhookRecord(webhookName) {
    console.log(`[${this.constructor.name}]`, `clearWebhookRecord(${webhookName}) >> `);
    if(webhookName)
      this.history[webhookName] = [];
    else
      this.history = [];
    return (webhookName) ? this.history[webhookName] : this.history;
  }

  setLimit(num) {
    this.config.webhook.limit = num;
    Promise.resolve()
    .then(() => this.configManager.updateConfig(this.config, `history`))
    .catch((err) => console.error(err));
    // this.clearRecord();
  }

  getLimit(num) {
    this.config.webhook.limit = num;
    // this.clearRecord();
  }
}

//inherits(historyService, EventEmitter);
module.exports = historyService;