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
}

//inherits(historyService, EventEmitter);
module.exports = historyService;