'use strict';

const {APIHandler, APIResponse} = require('gateway-addon');
const manifest = require('../manifest.json');

class TurnipExtension extends APIHandler{
	constructor(addonManager) {
		super(addonManager, manifest.id);
		addonManager.addAPIHandler(this);
	}

	async handleRequest(req) {
		return new APIResponse({
			status: 200,
			contentType: 'application/json',
			content: JSON.stringify(req)
		});
	}
}


module.exports = TurnipExtension;