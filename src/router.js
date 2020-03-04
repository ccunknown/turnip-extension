'use strict';

const request = require('request');
const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
const manifest = require('../manifest.json');

class Router extends APIHandler{
	constructor(addonManager, configManager) {
		super(addonManager, manifest.id);
		this.configManager = configManager;
	}

	handleRequest(req) {
		console.log("get req : "+JSON.stringify(req));

		try{
			let body = JSON.parse(JSON.stringify(req.body));
		} catch(err) {
			return Promise.resolve(new Errors.AcceptOnlyJsonBody());
		};

		console.log(`[${req.method}] ${req.path} : ${JSON.stringify((req.body) ? req.body : {}, null, 2)}`);
		if(this.reqVerify(req, 'GET', '/config')) {
			return new Promise((resolve, reject) => {
				this.configManager.getConfig()
				.then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
				.catch((err) => resolve(this.catchErrorRespond(err)));
			});
		}
		else if(this.reqVerify(req, 'PUT', `/config`)) {
			return new Promise(async (resolve, reject) => {
				this.configManager.saveConfig(req.body)
				.then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
				.catch((err) => resolve(this.catchErrorRespond(err)));
			});
		}
		else if(this.reqVerify(req, 'DELETE', `/config`)) {
			return new Promise(async (resolve, reject) => {
				let defaults = this.configManager.getDefaults();
				this.configManager.saveConfig(defaults.config)
				.then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
				.catch((err) => resolve(this.catchErrorRespond(err)));
			});
		}
		else if(this.reqVerify(req, 'PATCH', `/config/account`)) {
			return new Promise((resolve, reject) => {
				this.configManager.getConfig()
				.then((serverConfig) => Object.assign(serverConfig, {"account": Object.assign(serverConfig.account, req.body)}))
				.then((config) => this.configManager.saveConfig(config))
				.then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
				.catch((err) => resolve(this.catchErrorRespond(err)));
			});
		}
		else if(this.reqVerify(req, 'DELETE', `/config/account`)) {
			return new Promise((resolve, reject) => {
				this.configManager.getConfig()
				.then((currConfig) => Object.assign(currConfig, {"account": this.configManager.getDefaults().config.account}))
				.then((config) => this.configManager.saveConfig(config))
				.then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
				.catch((err) => resolve(this.catchErrorRespond(err)));
			});
		}
		else {
			return Promise.resolve((new Errors.Http404()).getHttpResponse());
		}
	}

	login(email, password) {
		return new Promise((resolve, reject) => {
			let option = {
				"url": "http://localhost:8080/login",
				"method": "POST",
				"headers": {
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

	getThingsSchema(jwt) {
		return new Promise((resolve, reject) => {
			if(!jwt)
				return;
			let option = {
				"url": "http://localhost:8080/things/",
				"method": "GET",
				"headers": {
					"Authorization": `Bearer ${config.account.jwt}`,
					"Accept": "application/json",
					"Content-Type": "application/json"
				}
			};
			
			this.makeRequest(option).then((res) => {
				//console.log("res : "+JSON.stringify(JSON.parse(res.body)));
				resolve(JSON.parse(res.body));
			});
		});
	}

	reqVerify(req, method, path) {
		return (req.method === method && req.path === path);
	}

	makeJsonRespond(data) {
		return new APIResponse({
			status: 200,
			contentType: 'application/json',
			content: data
		});
	}

	catchErrorRespond(err) {
		return new Promise((resolve, reject) => {
			err = (err) ? err : new Errors.ErrorObjectNotReturn();
			console.error(err);
			let res = err.getHttpResponse();
			res.contentType = "application/json";
			res.content = JSON.stringify({
				"error": {
					"name": err.name,
					"message": res.content
				}
			});
			resolve(new APIResponse(res));
		});
	}

	makeRequest(option) {
		return new Promise((resolve, reject) => {
			request(option , (err, res, body) => {
				if (err) {
					console.error(err);
					resolve(null);
				}
				else {
					//console.log("response : "+JSON.stringify(res));
					//console.log("body : "+body);
					resolve(res);
				}
			});
		});
	}
}


module.exports = Router;
