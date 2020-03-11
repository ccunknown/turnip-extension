'use strict';

const Validator = require('jsonschema').Validator;
const Database = require('./myDatabase');
const {Defaults, Errors} = require('../constants/constants.js');

class ConfigManager {
	constructor(addonManager, manifest) {
		this.addonManager = addonManager;
		this.manifest = manifest;
		this.validator = new Validator();
	}

	getConfig() {
		console.log("getConfig() >> ");
		return new Promise((resolve, reject) => {
			try {
				this.getConfigFromDatabase().then((config) => {
					if(this.isEmptyObject(config))
						resolve(this.initialConfig());
					else
						resolve(config);
				});
			} catch(err) {
				err = (err) ? err : new Errors.ErrorObjectNotReturn();
				reject(err);
			}
		});
	}

	saveConfig(config) {
		console.log("saveConfig() >> ");
		return new Promise((resolve, reject) => {
			try {
				resolve(this.saveConfigToDatabase(config));
			} catch(err) {
				err = (err) ? err : new Errors.ErrorObjectNotReturn();
				reject(err);
			}
		});
	}

	getConfigFromDatabase() {
		console.log("getConfigFromDatabase() >> ");
		return new Promise((resolve, reject) => {
			if(Database) {
				console.log("{Database} found.");
				this.db = new Database(this.manifest.name);
				console.log("{Database} imported.");
				this.db.open().then(() => {
					console.log("opened database.");
					var config = this.db.loadConfig();
					this.db.close();
					resolve(config);
				});
			}
			else {
				console.error(`{Database} not found!!!`);
				reject(new Errors.DatabaseObjectUndefined(Database));
			}
		});
	}

	saveConfigToDatabase(config) {
		console.log("saveConfigToDatabase() >> ");
		return new Promise((resolve, reject) => {
			//	Validate config.
			let validateInfo = this.validate(config);
			if(validateInfo.errors.length)
				reject(new Errors.InvalidConfigSchema(validateInfo.errors));
			//	Save to Database
			else {
				if(Database) {
					console.log("{Database found.}");
					this.db = new Database(this.manifest.name);
					console.log("{Database} imported.");
					this.db.open().then(() => {
						console.log("opened database.");
						this.db.saveConfig(validateInfo.instance);
						this.db.close();
						resolve(validateInfo.instance);
					});
				}
				else{
					console.error(`{Database} not found!!!`);
					reject(new Errors.DatabaseObjectUndefined(Database));
				}
			}
		});
	}

	initialConfig() {
		//console.log("Defaults : "+JSON.stringify(Defaults, null, 2));
		var config = Object.assign({}, Defaults.config);
		return config;
	}

	isEmptyObject(obj) {
		return !Object.keys(obj).length;
	}

	getDefaults() {
		return Object.assign({}, Defaults);
	}

	getSchema() {
		return Object.assign({}, Defaults.schema);
	}

	validate(data, schema) {
		schema = (schema) ? schema : this.getSchema();
		return this.validator.validate(data, schema);
	}

	validateAccount(data) {
		let schema = (schema) ? schema : this.getSchema().account;
		return this.validator.validate(data, schema);
	}
}

module.exports = ConfigManager;