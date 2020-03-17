'use strict';

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

class historyService extends EventEmitter {
  constructor(extension) {

    //EventEmitter.call(this);
    console.log(`historyService: constructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    this.limit = 50;

    this.history = {};

    this.init();
  }

  init() {
    console.log(`historyService: init() >> `);
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
    while(this.history[webhookName].length > this.limit)
      this.history[webhookName].shift();
    console.log(JSON.stringify(this.history[webhookName]));
  }

  getRecord(webhookName) {
    return (webhookName) ? this.history[webhookName] : this.history;
  }

  clearRecord(webhookName) {
    if(webhookName)
      this.history[webhookName] = [];
    else
      this.history = [];
    return ;
  }

  setLimit(num) {
    this.limit = num;
  }
}

//inherits(historyService, EventEmitter);
module.exports = historyService;