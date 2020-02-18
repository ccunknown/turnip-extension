'use strict';

const {APIHandler, APIResponse} = require('gateway-addon');
const manifest = require('../manifest.json');
const configManager = require('./configManager');

class TurnipExtension extends APIHandler{
	constructor(addonManager) {
		super(addonManager, manifest.id);

		this.configManager = new configManager(addonManager, manifest);

		addonManager.addAPIHandler(this);

		this.init();
	}

	async init() {
		let config = await this.configManager.getConfig();
		console.log(config);
	}

	async handleRequest(req) {
		if (this.reqVerify(req, 'GET', '/all')) {
			return new APIResponse({
				status: 200,
				contentType: 'application/json',
				content: JSON.stringify(req)
			});
		}
	}
}


module.exports = TurnipExtension;
