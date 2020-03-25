'use strict';

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

class historyService extends EventEmitter {
  constructor(extension, config) {

    //EventEmitter.call(this);
    console.log(`historyService: constructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    this.history = {};
    this.limit = config.history.limit;

    this.init();
  }

  init() {
    console.log(`historyService: init() >> `);
    this.setArrayComparator();
  }

  start() {
    console.log(`historyService: start() >> `);
    return Promise.resolve();
  }

  stop() {

  }

  pushRecord(webhookName, record) {
    console.log(`historyService: pushRecord(${webhookName}, [record]) >> `);
    if(!this.history.hasOwnProperty(webhookName)) {
      this.history[webhookName] = [];
    }
    this.history[webhookName].push(record);
    this.history[webhookName] = this.history[webhookName].sort(this.arrayCompare.reqTimestamp);
    //this.history[webhookName].map((h) => console.log(h.timestamp.req.unix));
    while(this.history[webhookName].length > this.limit)
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

  getRecord(webhookName) {
    let result = (webhookName) ? this.history[webhookName] : this.history;
    result = (result) ? result : [];
    return result;
  }

  clearRecord(webhookName) {
    console.log(`historyService: clearRecord(${webhookName}) >> `);
    if(webhookName)
      this.history[webhookName] = [];
    else
      this.history = [];
    return (webhookName) ? this.history[webhookName] : this.history;
  }

  setLimit(num) {
    this.limit = num;
    this.clearRecord();
  }

  getLimit(num) {
    this.limit = num;
    this.clearRecord();
  }
}

//inherits(historyService, EventEmitter);
module.exports = historyService;