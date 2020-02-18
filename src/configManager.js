'use strict';

const Database = require('./myDatabase');

class configManager {
	constructor(addonManager, manifest) {
		this.addonManager = addonManager;
		this.manifest = manifest;
	}

	getConfig() {
		console.log("getConfig() >> ");
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
}

module.exports = configManager;
