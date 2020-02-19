'use strict';

const Database = require('./myDatabase');
const Default = require('./default.js');

class configManager {
	constructor(addonManager, manifest) {
		this.addonManager = addonManager;
		this.manifest = manifest;
	}

	getConfig() {
		console.log("getConfig() >> ");
		return new Promise(async (resolve, reject) => {
			let config = await this.getConfigFromDatabase();
			if(this.isEmptyObject(config)) {
				config = this.initialConfig();
			}
			resolve(config);
		});
	}

	saveConfig(config) {
		console.log("saveConfig() >> ");
		return this.saveConfigToDatabase(config);
	}

	getConfigFromDatabase() {
		console.log("getConfigFromDatabase() >> ");
		return new Promise((resolve, reject) => {
			if(Database){
				console.log("{Database found.}");
				this.db = new Database(this.manifest.name);
				console.log("{Database} imported.");
				this.db.open().then(() => {
					console.log("opened database.");
					var config = this.db.loadConfig();
					this.db.close();
					resolve(config);
				});
			}
			else{
				console.log(`{Database} not found!!!`);
				reject(false);
			}
		});
	}

	saveConfigToDatabase(config) {
		console.log("saveConfigToDatabase() >> ");
		return new Promise((resolve, reject) => {
			if(Database){
				console.log("{Database found.}");
				this.db = new Database(this.manifest.name);
				console.log("{Database} imported.");
				this.db.open().then(() => {
					console.log("opened database.");
					this.db.saveConfig(config);
					this.db.close();
					resolve();
				});
			}
			else{
				console.log(`{Database} not found!!!`);
				reject(false);
			}
		});
	}

	initialConfig() {
		console.log("Default : "+JSON.stringify(Default, null, 2));
		var config = Object.assign({}, Default.config);
		return config;
	}

	isEmptyObject(obj) {
		return !Object.keys(obj).length;
	}
}

module.exports = configManager;
