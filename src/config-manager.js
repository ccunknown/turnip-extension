'use strict';

const Validator = require('jsonschema').Validator;
const EventEmitter = require('events').EventEmitter;
const Database = require('./lib/my-database');
const {Defaults, Errors} = require('../constants/constants.js');

const util = require('util');

class ConfigManager {
  constructor(extension) {
    this.addonManager = extension.addonManager;
    this.manifest = extension.manifest;
    this.validator = new Validator();
    this.event = new EventEmitter();
  }

  getConfig() {
    console.log(`ConfigManager: getConfig() >> `);
    return new Promise((resolve, reject) => {
      try {
        this.getConfigFromDatabase().then((config) => {
          if(this.isEmptyObject(config))
            config = this.initialConfig();
          let validateInfo = this.validate(config);
          if(validateInfo.errors.length) {
            console.warn(`Invalid config!!!`);
            console.warn(JSON.stringify(validateInfo.errors, null, 2));
          }
          else
            console.log(`Valid config.`);
          resolve(config);
        });
      } catch(err) {
        console.log(`getConfig error.`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      }
    });
  }

  getConfigWebhook() {
    console.log("getConfigWebhook() >> ");
    return new Promise((resolve, reject) => {
      try {
        this.getConfig()
        .then((conf) => resolve(conf.webhook))
      } catch(err) {
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      }
    });
  }

  saveConfigWebhook(webhook) {
    console.log("saveConfigWebhook() >> ");
    return new Promise((resolve, reject) => {
      this.getConfig()
      .then((serverConfig) => Object.assign(serverConfig, {"webhook": webhook}))
      .then((config) => this.saveConfig(config))
      .then((conf) => resolve(conf.webhook))
      .catch((err) => {
        //console.log(`saveConfigWebhook() : found error : ${err}`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      });
    });
  }

  saveConfig(config) {
    console.log(`ConfigManager: saveConfig() >> `);
    return new Promise((resolve, reject) => {
      this.saveConfigToDatabase(config)
      .then((conf) => resolve(conf))
      .catch((err) => {
        //console.log(`saveConfig() : found error : ${err}`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      });
    });
  }

  updateConfig(update, path) {
    console.log(`ConfigManager: updateConfig() >> `);
    return new Promise((resolve, reject) => {
      this.getConfig()
      .then((config) => {
        let res = this.updateJsonElement(config, path, update);
        if(res)
          return JSON.parse(JSON.stringify(config));
        else
          throw(new Errors.PathNotFound(path));
      })
      .then((conf) => this.saveConfigToDatabase(conf))
      .then(() => resolve(update))
      .catch((err) => {
        console.log(`updateConfig error.`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      });
    });
  }

  addToConfig(newElem, path) {
    console.log(`ConfigManager: addToConfig() >> `);
    return new Promise((resolve, reject) => {
      this.getConfig()
      .then((config) => {
        let err = this.addJsonElement(config, path, newElem)
        if(err)
          throw(err);
        else
          return config;
      })
      .then((conf) => this.saveConfigToDatabase(conf))
      .then(() => resolve(newElem))
      .catch((err) => {
        console.log(`add config element error.`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      });
    });
  }

  deleteConfig(path) {
    console.log(`ConfigManager: deleteConfig() >> `);
    return new Promise((resolve, reject) => {
      if(path) {
        this.getConfig()
        .then((config) => {
          let err = this.deleteJsonElement(config, path)
          console.log(`config: ${JSON.stringify(config, null ,2)}`);
          if(err)
            throw(err);
          else
            return config
        })
        .then((conf) => this.saveConfigToDatabase(conf))
        .then(() => resolve({}))
        .catch((err) => {
          console.log(`add config element error.`);
          err = (err) ? err : new Errors.ErrorObjectNotReturn();
          reject(err);
        });
      }
      else {
        this.deleteConfigFromDatabase()
        .then(() => this.getConfig())
        .then((conf) => resolve(conf))
        .catch((err) => {
          err = (err) ? err : new Errors.ErrorObjectNotReturn();
          reject(err);
        });
      }
    });
  }

  getConfigFromDatabase() {
    console.log("getConfigFromDatabase() >> ");
    return new Promise((resolve, reject) => {
      if(Database) {
        //console.log("{Database} found.");
        this.db = new Database(this.manifest.name);
        //console.log("{Database} imported.");
        this.db.open()
        .then(() => {
          //console.log("opened database.");
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
      //  Validate config.
      let validateInfo = this.validate(config);
      if(validateInfo.errors.length)
        throw(new Errors.InvalidConfigSchema(validateInfo.errors));
      //  Save to Database
      else {
        if(Database) {
          //console.log("{Database found.}");
          this.db = new Database(this.manifest.name);
          //console.log("{Database} imported.");
          this.db.open()
          .then(() => {
            //console.log("opened database.");
            this.db.saveConfig(validateInfo.instance);
            this.db.close();
            resolve(validateInfo.instance);
          });
        }
        else {
          console.error(`{Database} not found!!!`);
          reject(new Errors.DatabaseObjectUndefined(Database));
        }
      }
    });
  }

  deleteConfigFromDatabase() {
    console.log("deleteConfigFromDatabase() >> ");
    return new Promise((resolve, reject) => {
      if(Database) {
        this.db = new Database(this.manifest.name);
        this.db.open()
        .then(() => {
          this.db.saveConfig({});
          this.db.close();
          resolve({});
        });
      }
      else {
        console.error(`{Database} not found!!!`);
        reject(new Errors.DatabaseObjectUndefined(Database));
      }
    });
  }

  initialConfig() {
    let config = JSON.parse(JSON.stringify(Defaults.config));
    return config;
  }

  isEmptyObject(obj) {
    return !Object.keys(obj).length;
  }

  getDefaults() {
    return JSON.parse(JSON.stringify(Defaults));
  }

  getSchema() {
    return JSON.parse(JSON.stringify(Defaults.schema));
  }

  validate(data, schema) {
    schema = (schema) ? schema : this.getSchema();
    return this.validator.validate(data, schema);
  }

  validateAccount(data) {
    let schema = (schema) ? schema : this.getSchema().account;
    return this.validator.validate(data, schema);
  }

  updateJsonElement(src, path, data) {
    if(path && path.length) {
      let indexArr = path.split(`.`);
      let index = indexArr.shift();
      return (src.hasOwnProperty(index)) ? this.updateJsonElement(src[index], indexArr.join(`.`), data) : false;
    }
    else {
      for(let i in data)
        src[i] = data[i];
      return true;
    }
  }

  addJsonElement(src, path, data) {
    let indexArr = path.split(`.`);
    let arrLen = indexArr.length;
    let index = indexArr.shift();

    if(arrLen == 0)
      return new Errors.PathInvalid(path);
    else if(arrLen == 1) {
      if(src.hasOwnProperty(index))
        return new Errors.FoundDuplicate(index);
      else {
        src[index] = {};
        for(let i in data)
          src[index][i] = data[i];
        return ;
      }
    }
    else {
      if(src.hasOwnProperty(index))
        return this.addJsonElement(src[index], indexArr.join(`.`), data);
      else
        return new Errors.PathInvalid(path);
    }
  }

  deleteJsonElement(src, path) {
    let indexArr = path.split(`.`);
    let arrLen = indexArr.length;
    let index = indexArr.shift();

    if(arrLen == 0)
      return new Errors.PathInvalid(path);
    else if(arrLen == 1) {
      if(src.hasOwnProperty(index))
        delete src[index];
      else {
        return new Errors.ObjectNotFound(index);
      }
    }
    else {
      if(src.hasOwnProperty(index))
        return this.deleteJsonElement(src[index], indexArr.join(`.`));
      else
        return new Errors.PathInvalid(path);
    }
  }
}

module.exports = ConfigManager;