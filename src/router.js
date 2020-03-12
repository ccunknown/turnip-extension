'use strict';

const request = require('request');
const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
const manifest = require('../manifest.json');

class Router extends APIHandler{
  constructor(addonManager, configManager) {
    super(addonManager, manifest.id);
    this.configManager = configManager;
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
          "PATCH": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((serverConfig) => Object.assign(serverConfig, {"account": Object.assign(serverConfig.account, req.body)}))
              .then((config) => this.configManager.saveConfig(config))
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((currConfig) => Object.assign(currConfig, {"account": this.configManager.getDefaults().config.account}))
              .then((config) => this.configManager.saveConfig(config))
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
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
                return this.configManager.saveConfigWebhook(webhook);
              })
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
          //  In progress.
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfigWebhook()
              .then((webhookArray) => webhookArray.filter((elem) => (elem.name == req.path.split(`/`).pop())))
              .then((webhook) => resolve(this.makeJsonRespond(JSON.stringify(webhook))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          //  In progress.
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
    console.log(`arr : ${JSON.stringify(arr, null, 2)}`);
    if(!arr.length)
      return Promise.resolve(this.catchErrorRespond(new Errors.Http404()));
    var func = arr[0].method[req.method];
    return func(req);
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

module.exports = Router;
