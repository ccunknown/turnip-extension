const servicePrefix = "./service/";

class laborsManager {
  constructor(extension) {
    this.extension = extension;
    this.addonManager = extension.addonManager;
    this.configManager = extension.configManager;
    this.routesManager = extension.routesManager;

    this.serviceList = [];
    this.init();
  }

  init() {
    console.log(`laborsManager: init() >> `);
    return new Promise((resolve, reject) => {
      this.loadService()
      .then(() => {
        //console.log(`service list : `);
        //console.log(this.serviceList);
        resolve(this.startService());
      });
    });
  }

  loadService() {
    console.log(`laborsManager: loadService() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.getConfig()
      .then((config) => {
        let serviceList = config.service;
        for(let i in serviceList) {
          let service = serviceList[i];
          let serviceClass = require(`${servicePrefix}${service.id}`);
          service.obj = new serviceClass(this.extension, config);
          console.log(`service : ${service.id}`);
          this.serviceList.push(service);
        }
        resolve();
      });
      /*
      this.getConfigService()
      .then((serviceList) => {
        //console.log(`service list : ${JSON.stringify(serviceList, null, 2)}`);
        for(let i in serviceList) {
          let service = serviceList[i];
          let serviceClass = require(`${servicePrefix}${service.id}`);
          service.obj = new serviceClass(this.extension);
          console.log(`service : ${service.id}`);
          this.serviceList.push(service);
        }
        resolve();
      });
      */
    });
  }

  startService(serviceId) {
    console.log(`laborsManager: startService(${(serviceId) ? serviceId : ``})`);
    return new Promise(async (resolve, reject) => {
      if(serviceId) {
        this.getService(serviceId)
        .then((service) => service.obj.start())
        .then(() => resolve());
      }
      else {
        let list = [];
        for(var i in this.serviceList) {
          let service = this.serviceList[i];
          if(service.enable)
            await this.startService(this.serviceList[i].id);
        }
        resolve();
      }
    });
  }

  getConfigService() {
    console.log(`laborsManager: getConfigService() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.getConfig()
      .then((config) => {
        resolve(config.service);
      });
    });
  }

  getService(serviceId) {
    console.log(`laborsManager: getService(${serviceId}) >> `);
    return new Promise((resolve, reject) => {
      if(!serviceId)
        resolve(this.serviceList);
      let arr = this.serviceList.filter((service) => (service.id == serviceId));
      if(arr.length == 1) {
        console.log(arr[0].id);
        resolve(arr[0]);
      }
      else if(arr.length == 0)
        resolve(null);
      else
        reject(new Errors.FoundDuplicateServiceId(serviceId));
    });
  }
}

module.exports = laborsManager;