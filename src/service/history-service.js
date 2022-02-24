'use strict';

const Path = require(`path`);
const Queue = require(`bull`);
const { Sequelize, DataTypes, Op } = require(`sequelize`);
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
    this.thingsHistoryQueue = new Queue(`thingsHistoryQueue`);

    this.thingsDbPath = Path.join(
      this.addonManager.getUserProfile().dataDir,
      this.extension.manifest.id,
      this.config.things.database.sqlite.fname
    );
    this.model = {};
    this.handler = {};

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
    this.model.thingRecord = this.sequelize.define(`ThingsHistory`, {
      // timestamp: {
      //   type: DataTypes.DATE,
      //   allowNull: false,
      //   // defaultValue: Sequelize.literal(`CURRENT_TIMESTAMP`),
      //   defaultValue: DataTypes.NOW,
      // },
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
      .then(() => this.initThingsQueueProcess())
      .then(() => this.initThingsUpdateHandler())
      .then(() => this.initThingsCleanupHandler())
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  stop() {

  }

  initThingsUpdateHandler() {
    console.log(`[${this.constructor.name}]`, `initThingsUpdateHandler() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.laborsManager.getService(`wsocket-service`))
      .then((wsocketServiceSchema) => wsocketServiceSchema.obj)
      .then((wsocketService) => wsocketService.on(
        `UPDATE`, 
        this.onWsocketMessage().bind(this)
      ))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  onWsocketMessage() {
  // get onWsocketMessage() {
    return (service, message) => {
      console.log(`[${this.constructor.name}]`, `${service.constructor.name} event`);
      console.log(`[${this.constructor.name}]`, JSON.stringify(message));
      this.thingsHistoryQueue.add(
        `thing`,
        {
          cmd: `update`,
          payload: message
        }
      ),
      {
        timeout: this.config.things.job.timeout
      }
    };
  }

  initThingsCleanupHandler() {
    console.log(`[${this.constructor.name}]`, `initThingsCleanupHandler() >> `);
    this.handler.cleanup = setInterval(
      this.onCleanupPeriod().bind(this), 
      this.config.things.database.record.cleanup.interval * 1000
    );
  }

  onCleanupPeriod() {
  // get onCleanupPeriod() {
    return () => {
      console.log(`[${this.constructor.name}]`, `onCleanupPeriod`);
      this.thingsHistoryQueue.add(
        `thing`,
        {
          cmd: `interval-cleanup`,
          payload: {
            duration: this.config.things.database.record.duration
          }
        }
      )
    }
  }

  getThingsHistory(options) {
    console.log(`[${this.constructor.name}]`, `getThingsHistory() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.thingsHistoryQueue.add(
        `thing`,
        {
          cmd: `query`,
          payload: options
        }
      ))
      .then((job) => job.finished())
      .then((ret) => {
        console.log(`[${this.constructor.name}]`, `job finished`);
        console.log(`[${this.constructor.name}]`, ret);
        return ret;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  initThingsQueueProcess() {
    console.log(`[${this.constructor.name}]`, `initThingsQueueProcess() >> `);
    this.thingsHistoryQueue.process(
      `thing`,
      1, // processor concurency
      (job, done) => {
        console.log(`[${this.constructor.name}]`, `JOB Process thingsHistoryQueue() >> `);
        console.log(`[${this.constructor.name}]`, `job id[${job.id}]`);
        console.log(`[${this.constructor.name}]`, `job cmd: ${job.data.cmd}`);
        console.log(`[${this.constructor.name}]`, `payload: ${JSON.stringify(job.data.payload)}`);
        Promise.resolve()
        .then(() => {
          if(job.data.cmd == `update`) 
            return this.thingsUpdate(job.data.payload);
          else if(job.data.cmd == `interval-cleanup`)
            return this.thingsCleanup(job.data.payload);
          else if(job.data.cmd == `query`) {
            return this.thingsQuery(job.data.payload);
          }
          else
            throw new Error(`Command "${job.data.cmd}" is not support.`);
        })
        .then((ret) => {
          console.log(
            `[${this.constructor.name}]`,
            `${job.data.cmd}:`,
            `${JSON.stringify(ret, null, 2)}`
          );
          return ret;
        })
        .then((ret) => done(null, ret))
        .catch((err) => {
          console.error(err);
          done(err)
        });
      }
    );
  }

  thingsUpdate(data) {
    console.log(`[${this.constructor.name}]`, `thingsUpdate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.sequelize.sync())
      .then(() => console.log(
        `[${this.constructor.name}]`,
        `insert: ${data.id} [${data.property.name}] ${data.property.value}`
      ))
      .then(() => this.model.thingRecord.create({
        device: data.id,
        property: data.property.name,
        value: data.property.value
      }))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  thingsCleanup(data) {
    console.log(`[${this.constructor.name}]`, `thingsCleanup() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.sequelize.sync())
      .then(() => this.model.thingRecord.destroy({
        where: {
          createdAt: {
            // [Op.lt]: new Date(new Date() - this.config.things.database.record.duration * 1000)
            [Op.lt]: new Date(new Date() - data.duration * 1000)
          }
        }
      }))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  thingsQuery(options) {
    console.log(`[${this.constructor.name}]`, `thingsQuery() >> `);
    return new Promise((resolve, reject) => {
      let fields = (
        (options && options.fields)
        ? options.fields
        : [
            `device`,
            `property`,
            `value`,
            [ `createdAt`, `timestamp` ]
          ]
      );
      fields = fields.map((e) => {
        let f = Array.isArray(e) ? e[0] : e;
        let fa = Array.isArray(e) ? e[1] : e;
        if(options && options.unique && options.unique.includes(e))
          return [ Sequelize.fn(`DISTINCT`, Sequelize.col(f)), fa ];
        else
          return [ f, fa ];
      })
      Promise.resolve()
      .then(() => this.sequelize.sync())
      .then(() => {
        let query = {
          attributes: fields,
          where: {}
        };
        if(options && options.group) {
          query.group = options.group;
        }
        if(options && options.duration) {
          query.where.createdAt = {
            [Op.gt]: new Date(new Date() - (options && options.duration * 1000 || 0))
          };
        }
        if(options && options.device && options.device.name) {
          query.where.device = {
            [Op.like]: options.device.name
          };
        }
        if(options && options.property && options.property.name) {
          query.where.property = {
            [Op.like]: options.property.name
          }
        }
        return query;
      })
      .then((query) => this.model.thingRecord.findAll(query))
      .then((ret) => resolve (ret))
      .catch((err) => reject(err));
    })
  }

  // thingsProcess(data) {
  //   console.log(`[${this.constructor.name}]`, `thingsProcess() >> `);
  //   return new Promise((resolve, reject) => {
  //     let result;
  //     Promise.resolve()
  //     .then(() => this.sequelize.sync())
  //     .then(() => 
  //       data.cmd == `update`
  //       ? this.thingsUpdate(data.payload)
  //       : data.cmd == `cleanup`
  //         ? this.thingsCleanup(data.payload)
  //         : new Error(`Command ${data.cmd} is not support.`)
  //     )
  //     .then(() => {
  //       console.log(
  //         `[${this.constructor.name}]`,
  //         `insert: ${data.payload.id} [${data.payload.property.name}] ${data.payload.property.value}`
  //       );
  //       return this.model.thingRecord.create({
  //         device: data.payload.id,
  //         property: data.payload.property.name,
  //         value: data.payload.property.value
  //       });
  //     })
  //     .then((ret) => result = ret)
  //     // .then(() => this.sequelize.sync())
  //     .then(() => result)
  //     .then((ret) => resolve(ret))
  //     .catch((err) => reject(err));
  //   });
  // }

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