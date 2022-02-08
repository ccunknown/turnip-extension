'use strict';

const EventEmitter = require(`events`).EventEmitter;
const DNS = require(`dns`);
// const redis = require(`redis`);
const { exec } = require(`child_process`);
const { Default, Error } = require(`../../constants/constants`);

class NetworkService extends EventEmitter {
  constructor(extension, config) {
    super(extension.addonManager, extension.manifest.id);
    console.log(this.constructor.name, `constructor() >> `);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;
    this.laborsManager = this.extension.laborsManager;
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.initRedis())
      .then(() => resolve())
      .catch((err) => reject(err));
    })
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return Promise.resolve();
  }

  initRedis() {
    console.log(`[${this.constructor.name}]`, `initRedis() >> `);
    return new Promise((resolve, reject) => {
      let config;
      Promise.resolve()
      .then(() => this.configManager.getConfig(`network.redis`))
      .then((conf) => config = conf)
      .then(() => this.isInternetAvailable())
      .then((internet) => {
        if(internet)
          return this.isRedisAvailable();
        else
          throw new Error(`Internet unavailable!`);
      })
      .then((redis) => {
        if(redis)
          return true;
        else if(config.install)
          return this.installRedis();
        else {
          console.warning(
            `[${this.costructor.name}]`, 
            `Please set "network.redis.install" to true to enable redis installation.`
          );
          return false;
        }
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  isInternetAvailable(endpoint) {
    console.log(`[${this.constructor.name}]`, `isInternetAvailable() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        endpoint = endpoint || this.configManager.getConfig(`network.check.endpoint`);
        return Promise.resolve(endpoint);
      })
      .then(() => console.log(this.constructor.name, endpoint))
      .then(() => this.dnsResolve(endpoint))
      .then((ret) => {
        console.log(`ret: ${JSON.stringify(ret, null, 2)}`);
        let result = true;
        ret.forEach(e => e.hasOwnProperty(`error`) ? result = false : {});
        console.log(`[${this.constructor.name}]`, `result: ${result}`);
        return result;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  isRedisAvailable() {
    console.log(`[${this.constructor.name}]`, `isRedisAvailable() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.configManager.getConfig(`network.redis`))
      .then((config) => {
        console.log(
          `[${this.constructor.name}]`, 
          `redis config: ${JSON.stringify(config, null, 2)}`
        );
        return config;
        })
      // .then((config) => this.testRedisConnection())
      .then(() => this.getRedisStatus())
      .then((ret) => {
        // ret && console.log(JSON.stringify(ret, null, 2));
        return ret ? true : false;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  installRedis() {
    console.log(`[${this.constructor.name}]`, `installRedis() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.configManager.updateConfig(true, `network.redis.install`))
      .then(() => exec(`sudo apt-get install redis -y`, (err, stdout, stderr) => {
        if(err) {
          console.error(`Redis install problem!`);
          console.error(`[${this.constructor.name}]`, err);
          resolve(false);
        }
        else {
          console.log(`[${this.constructor.name}]`, stdout);
          resolve(true);
        }
      }))
      .catch((err) => reject(err));
    });
  }

  uninstallRedis() {
    console.log(`[${this.constructor.name}]`, `installRedis() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.configManager.updateConfig(false, `network.redis.install`))
      .then(() => exec(
        `sudo apt-get --purge remove redis redis-server redis-tools -y`, 
        (err, stdout, stderr) => {
          if(err) {
            console.error(`Redis uninstall problem!`);
            console.error(`[${this.constructor.name}]`, err);
            resolve(false);
          }
          else {
            console.log(`[${this.constructor.name}]`, stdout);
            resolve(true);
          }
        }
      ))
      .catch((err) => reject(err));
    });
  }

  getRedisStatus() {
    console.log(`[${this.constructor.name}]`, `getRedisStatus() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => exec(`redis-cli info`, (err, stdout, stderr) => {
        if(err) {
          console.error(`Redis not install`);
          // return null;
          resolve(null);
        }
        else {
          // console.log(`stdout: ${stdout}`);
          let ret = {};
          stdout.split(/\r?\n/)
          .filter(e => !e.startsWith(`#`))
          .filter(e => e.length)
          .forEach(e => {
            let tmparr = e.split(`:`);
            // console.log(`tmparr:${tmparr}`);
            if(tmparr.length > 1)
              ret[tmparr[0]] = tmparr.slice(1, tmparr.length).join(`:`);
          });
          // return ret;
          resolve(ret);
        }
      }))
      // .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  testRedisConnection() {
    console.log(`[${this.constructor.name}]`, `testRedisConnection() >> `);
    return new Promise((resolve, reject) => {
      let client, config;
      Promise.resolve()
      .then(() => this.configManager.getConfig(`network.redis`))
      .then((conf) => config = conf)
      .then(() => {
        let rep = config.endpoint
        let des = `redis${rep.secure ? `s` : ``}://${rep.username ? `${rep.username}:${rep.password}@` : ``}${rep.host}:${rep.port}`;
        console.log(`[${this.constructor.name}]`, `redis endpoint: ${des}`);
        client = redis.createClient(des);
        client.on(`error`, (err) => reject(err));
        return client.connect()
      })
      .then(() => {
        client.set(`turnip-test`, Date.now(), (err) => {
          if(err)
            throw err;
          else
            resolve(true);
        });
      })
      // .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  dnsResolve(host) {
    console.log(`[${this.constructor.name}]`, `dnsResolve() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => host
        ? host
        : Promise.resolve(
          this.configManager.getConfig()
        ).then((conf) => conf.network.check.endpoint))
      .then((endpoint) => {
        if(Array.isArray(endpoint)) {
          const arr = [];
          endpoint.forEach((elem) => arr.push(this.dnsResolve(elem)));
          resolve(Promise.all(arr));
        }
        else {
          DNS.resolve(`${endpoint}`, `A`, (err, address) => {
            let result = { endpoint: endpoint };
            err ? result.error = err : result.address = address;
            err && console.error(err);
            resolve(result);
          })
        }
      })
      .catch((err) => reject(err));
    });
  }
}

module.exports = NetworkService;