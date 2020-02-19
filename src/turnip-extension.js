'use strict';

const {APIHandler, APIResponse} = require('gateway-addon');
const manifest = require('../manifest.json');
const configManager = require('./configManager');
const request = require('request');

class TurnipExtension extends APIHandler{
	constructor(addonManager) {
		super(addonManager, manifest.id);

		this.configManager = new configManager(addonManager, manifest);

		this.init();

		addonManager.addAPIHandler(this);
	}

	async init() {
		this.config = await this.configManager.getConfig();
		console.log(JSON.stringify(this.config, null, 2));
	}

	async handleRequest(req) {
		console.log("get req : "+JSON.stringify(req));
		if(this.reqVerify(req, 'GET', '/config')) {
			return new APIResponse({
				status: 200,
				contentType: 'application/json',
				content: JSON.stringify(this.config)
			});
		}
		else if(this.reqVerify(req, 'POST', '/config')) {
			return new Promise((resolve, reject) => {
				//console.log("req : "+req);
				//console.log("type of req : "+(typeof req));
				let config = req.body;
				this.login(config.account.email, config.account.password).then((res) => {
					console.log("login respond : "+JSON.stringify(res));
				});
			});
		}
		else {
			return new APIResponse({
				status: 404
			});
		}
	}

	login(email, password) {
		return new Promise((resolve, reject) => {
			let option = {
				//"url": "http://localhost:8080/login",
				"method": "POST",
				"header": {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				"body": JSON.stringify({
					"email": email,
					"password": password
				})
			};
			console.log("option : "+JSON.stringify(option));
			//resolve(this.makeRequest(option));
			fetch("http://localhost:8080/login", option).then((res) => {
				if (!res.ok) {
					throw new Error(res.status);
					resolve({});
				}
				resolve(res.json());
			});
		});
	}

	generateToken(token) {

	}

	reqVerify(req, method, path) {
		if(req.method === method && req.path === path)
			return true;
		return false;
	}

	makeRequest(option) {
		return new Promise((resolve, reject) => {
			request(option , (err, res, body) => {
				if (err) {
					console.error(err);
					resolve(null);
				}
				else {
					console.log("respond : "+res);
					console.log("body : "+body);
					resolve(res);
				}
			});
		});
	}
}


module.exports = TurnipExtension;
