'use strict';

const EventEmitter = require('events').EventEmitter;

const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
//const manifest = require('../manifest.json');

class RoutesManager extends APIHandler{
  constructor(extension) {
    super(extension.addonManager, extension.manifest.id);
    this.configManager = extension.configManager;
    this.laborsManager = extension.laborsManager;

    this.eventEmitter = new EventEmitter();
    this.historyService = null;

    this.setRouter();
  }

  setRouter() {
    this.router = [

      /***  Resource : /config  ***/
      {
        "resource": /\/config/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise(async (resolve, reject) => {
              this.configManager.saveConfig(req.body)
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise(async (resolve, reject) => {
              let defaults = this.configManager.getDefaults();
              this.configManager.saveConfig(defaults.config)
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /config/account  ***/
      {
        "resource": /\/config\/account/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.account))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((config) => {
                config.account = req.body;
                return config;
              })
              .then((config) => this.configManager.saveConfig(config))
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.account))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PATCH": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((serverConfig) => Object.assign(serverConfig, {"account": Object.assign(serverConfig.account, req.body)}))
              .then((config) => this.configManager.saveConfig(config))
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.account))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((currConfig) => Object.assign(currConfig, {"account": this.configManager.getDefaults().config.account}))
              .then((config) => this.configManager.saveConfig(config))
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf.account))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /config/webhook/  ***/
      {
        "resource": /\/config\/webhook/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfigWebhook()
              .then((webhook) => resolve(this.makeJsonRespond(JSON.stringify(webhook))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfigWebhook()
              .then((webhook) => {
                let arr = webhook.filter((elem) => (req.body.name != elem.name));
                if(arr.length != webhook.length)
                  throw(new Errors.FoundDuplicateWebhookItem(req.body.name));
                webhook.push(req.body);
                return webhook;
                //return this.configManager.saveConfigWebhook(webhook);
              })
              .then((wh) => this.configManager.saveConfigWebhook(wh))
              .then((w) => resolve(this.makeJsonRespond(JSON.stringify(w))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.saveConfigWebhook(req.body)
              .then((webhook) => resolve(this.makeJsonRespond(JSON.stringify(webhook))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.saveConfigWebhook([])
              .then((webhook) => resolve(this.makeJsonRespond(JSON.stringify(webhook))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /config/webhook/{name}  ***/
      {
        "resource": /\/config\/webhook\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfigWebhook()
              .then((webhookArray) => webhookArray.filter((elem) => (elem.name == req.path.split(`/`).pop())))
              .then((webhookArr) => {
                if(webhookArr.length == 1)
                  return webhookArr[0];
                else if(webhookArr.length > 1)
                  throw(new Errors.FoundMultipleWebhookItem(req.path.split(`/`).pop()));
                else
                  throw(new Errors.ObjectNotFound(req.path.split(`/`).pop()));
              })
              .then((webhook) => resolve(this.makeJsonRespond(JSON.stringify(webhook))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfigWebhook()
              .then((webhookArrayList) => {
                if(req.path.split(`/`).pop() != req.body.name)
                  throw(new Errors.ObjectPathNameMismatch(req.body.name))
                return webhookArrayList;
              })
              .then((webhookArray) => webhookArray.filter((elem) => (elem.name != req.path.split(`/`).pop())))
              .then((webhookArr) => this.configManager.saveConfigWebhook(webhookArr.concat([req.body])))
              .then((webhook) => resolve(this.makeJsonRespond(JSON.stringify(webhook))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfigWebhook()
              .then((webhookArray) => {
                let arr = webhookArray.filter((elem) => elem.name != req.path.split(`/`).pop())
                if(arr.length == webhookArray.length)
                  throw(new Errors.ObjectNotFound(req.path.split(`/`).pop()));
                return this.configManager.saveConfigWebhook(arr);
              })
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /config/history  ***/
      {
        "resource": /\/config\/history/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.history))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise(async (resolve, reject) => {
              this.configManager.getConfig()
              .then((config) => Object.assign(config, {history: req.body}))
              .then((config) => this.configManager.saveConfig(config))
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.history))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PATCH": (req) => {
            return new Promise(async (resolve, reject) => {
              this.configManager.getConfig()
              .then((config) => Object.assign(config, {"history": Object.assign(config.history, req.body)}))
              .then((config) => this.configManager.saveConfig(config))
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.history))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise(async (resolve, reject) => {
              let historyConfig;
              Promise.resolve()
              .then(() => this.configManager.getDefaults())
              .then((defaults) => {
                historyConfig = defaults.config.history;
                return ;
              })
              .then(() => this.configManager.getConfig())
              .then((config) => {
                config.history = historyConfig;
                return config;
              })
              .then((config) => this.configManager.saveConfig(config))
              .then((config) => {
                console.log(`config: ${JSON.stringify(config, null, 2)}`);
                return config;
              })
              .then((config) => resolve(this.makeJsonRespond(JSON.stringify(config.history))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /config/... {path} ...  ***/
      {
        "resource": /\/config\/[^?]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let path = req.path.split(`/`).slice(2).join(`.`);
              console.log(`[${this.constructor.name}]`, `path: ${path}`);
              Promise.resolve()
              .then(() => this.configManager.getConfig(path))
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => this.catchErrorRespond(err));
            })
          },
          "PATCH": (req) => {
            return new Promise((resolve, reject) => {
              let path = req.path.split(`/`).slice(2).join(`.`);
              Promise.resolve()
              .then(() => this.configManager.updateConfig(req.body, path))
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            })
          }
        }
      },

      /***  Resource : /history  ***/
      {
        "resource": /\/history/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`history-service`)
              .then((service) => {
                this.historyService = service.obj;
                return this.historyService.getWebhookRecord();
              })
              .then((list) => resolve(this.makeJsonRespond(JSON.stringify(list))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`history-service`)
              .then((service) => {
                this.historyService = service.obj;
                return this.historyService.clearWebhookRecord();
              })
              .then((list) => resolve(this.makeJsonRespond(JSON.stringify(list))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /history/things  ***/
      {
        "resource": /\/history\/things/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              Promise.resolve()
              .then(() => this.laborsManager.getService(`history-service`))
              .then((service) => service.obj)
              // .then((historyService) => historyService.getThingsHistory({
              //   unique: [ `device` ],
              //   fields: [ `device` ]
              // }))
              .then((historyService) => historyService.getThingsHistory({
                group: [ `device`, `property` ],
                fields: [ `device`, `property` ]
              }))
              .then((ret) => {
                console.log(`ret: ${JSON.stringify(ret)}`);
                return ret;
              })
              .then((arr) => {
                let result = [];
                arr.forEach((e) => {
                  let m;
                  if(m = result.find((c) => c.device == e.device))
                    m.properties[e.property] = {};
                  else
                    result.push({ device: e.device, properties: { [e.property]: {} } });
                });
                return result;
              })
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            })
          }
        }
      },

      /***  Resource : /history/things/{device}  ***/
      {
        "resource": /\/history\/things\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let device = req.path.replace(/\/+$/, ``).split(`/`).pop();
              Promise.resolve()
              .then(() => this.laborsManager.getService(`history-service`))
              .then((service) => service.obj)
              .then((historyService) => historyService.getThingsHistory({
                unique: [ `property` ],
                fields: [ `property` ],
                device: { name: device }
              }))
              .then((ret) => {
                console.log(`ret: ${JSON.stringify(ret)}`);
                return ret;
              })
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            })
          }
        }
      },

      /***  Resource : /history/things/{device}/{property}  ***/
      {
        "resource": /\/history\/things\/[^/]+\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let arr = req.path.replace(/\/+$/, ``).split(`/`);
              let property = arr.pop();
              let device = arr.pop();
              let duration = req.query.duration || 3600;
              Promise.resolve()
              .then(() => this.laborsManager.getService(`history-service`))
              .then((service) => service.obj)
              .then((historyService) => historyService.getThingsHistory({
                // unique: [ `device` ],
                fields: [ [`createdAt`, `timestamp`], `device`, `property`, `value` ],
                duration: duration,
                device: { name: device },
                property: { name: property }
              }))
              .then((ret) => {
                console.log(`ret: ${JSON.stringify(ret)}`);
                return ret;
              })
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            })
          }
        }
      },

      /***  Resource : /history/things/{device}  ***/

      /***  Resource : /history/things/{device}/{property}  ***/

      /***  Resource : /history/webhook  ***/

      /***  Resource : /history/webhook/{webhook}  ***/
      /***  Resource : /history/{webhook}  ***/
      {
        "resource": /\/history\/webhook\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`history-service`)
              .then((service) => {
                this.historyService = service.obj;
                return this.historyService.getWebhookRecord(req.path.split(`/`).pop());
              })
              .then((list) => resolve(this.makeJsonRespond(JSON.stringify(list))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`history-service`)
              .then((service) => {
                this.historyService = service.obj;
                return this.historyService.clearWebhookRecord(req.path.split(`/`).pop());
              })
              .then((list) => {
                console.log(JSON.stringify(list));
                resolve(this.makeJsonRespond(JSON.stringify(list)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /network/resolve  ***/
      {
        "resource": /\/network\/resolve/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              console.log(Object.keys(req));
              console.log(req.query);
              this.laborsManager.getService(`network-service`)
              .then((service) => {
                this.networkService = service.obj;
                return this.networkService.dnsResolve(
                  Array.isArray(req.query.endpoints)
                  ? req.query.endpoints
                  : null
                );
              })
              .then((ret) => {
                // console.log(ret);
                console.log(JSON.stringify(ret, null, 2));
                resolve(this.makeJsonRespond(JSON.stringify(ret)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /network/redis/available  ***/
      {
        "resource": /\/network\/redis\/available/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`network-service`)
              .then((service) => {
                this.networkService = service.obj;
                return this.networkService.isRedisAvailable();
              })
              .then((available) => ({ available: available }))
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /network/redis/status  ***/
      {
        "resource": /\/network\/redis\/status/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`network-service`)
              .then((service) => {
                this.networkService = service.obj;
                return this.networkService.getRedisStatus();
              })
              .then((status) => {
                console.log(`status: ${JSON.stringify(status, null, 2)}`);
                return status;
              })
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /network/redis/install  ***/
      {
        "resource": /\/network\/redis\/install/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`network-service`)
              .then((service) => {
                this.networkService = service.obj;
                return this.networkService.installRedis();
              })
              .then((ret) => ({ install: ret }))
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /network/redis/uninstall  ***/
      {
        "resource": /\/network\/redis\/uninstall/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`network-service`)
              .then((service) => {
                this.networkService = service.obj;
                return this.networkService.uninstallRedis();
              })
              .then((ret) => ({ uninstall: ret }))
              .then((ret) => resolve(this.makeJsonRespond(JSON.stringify(ret))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service  ***/
      {
        "resource": /\/service/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService()
              .then((serviceList) => serviceList.map((service) => {
                return {
                  id: service.id,
                  enable: service.enable,
                  status: service.status,
                  description: (service.description) ? service.description : ``
                };
              }))
              .then((servList) => resolve(this.makeJsonRespond(JSON.stringify(servList))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      }
    ];
  }

  handleRequest(req) {
    console.log("get req : "+JSON.stringify(req));

    try{
      let body = JSON.parse(JSON.stringify(req.body));
    } catch(err) {
      return Promise.resolve(this.catchErrorRespond(new Errors.AcceptOnlyJsonBody()));
    };

    console.log(`[${req.method}] ${req.path} : ${JSON.stringify((req.body) ? req.body : {}, null, 2)}`);

    let arr = this.router.filter((elem) => {
      return (this.pathMatch(req.path, elem.resource) && elem.method.hasOwnProperty(req.method)) ? true : false;
    });
    //console.log(`arr : ${JSON.stringify(arr, null, 2)}`);
    if(!arr.length)
      return Promise.resolve(this.catchErrorRespond(new Errors.Http404()));
    let func = arr[0].method[req.method];
    //return func(req);
    return new Promise((resolve, reject) => {
      func(req)
      .then((result) => {
        let event = `${req.method.toUpperCase()}${arr[0].resource}`;
        console.log(`Emit event : ${event}`);
        this.eventEmitter.emit(event, req);
        resolve(result);
      });
    });
  }

  pathMatch(path, regex) {
    let arr = path.match(regex);
    if(arr && arr[0].length == path.length)
      return true;
    return false;
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
    console.log(`catchErrorRespond() >> `);
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
}

module.exports = RoutesManager;