'use strict';

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
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

    this.init();
  }

  init() {
    console.log(`webhookService: init() >> `);
  }

  start() {
    console.log(`webhookService: start() >> `);
    return Promise.resolve();
  }

  stop() {

  }
}

//inherits(webhookService, EventEmitter);
module.exports = webhookService;