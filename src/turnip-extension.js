'use strict';

const request = require('request');
const fetch = require('node-fetch');
const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
const manifest = require('../manifest.json');

const configManager = require('./config-manager');
const laborsManager = require('./labors-manager');
const routesManager = require('./routes-manager');

class TurnipExtension {
	constructor(addonManager) {
		this.addonManager = addonManager;
		this.manifest = manifest;
		this.configManager = new configManager(this);
		this.laborsManager = new laborsManager(this);
		this.routesManager = new routesManager(this);

		addonManager.addAPIHandler(this.routesManager);
	}
}


module.exports = TurnipExtension;
