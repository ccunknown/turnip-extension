'use strict';

const request = require('request');
const fetch = require('node-fetch');
const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
const manifest = require('../manifest.json');
const configManager = require('./configManager');
const router = require('./router');

class TurnipExtension {
	constructor(addonManager) {
		this.addonManager = addonManager;
		this.configManager = new configManager(this.addonManager, manifest);
		this.router = new router(this.addonManager, this.configManager);

		addonManager.addAPIHandler(this.router);
	}
}


module.exports = TurnipExtension;
