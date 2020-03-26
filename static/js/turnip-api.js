class TurnipApi {
  constructor(parent) {
    this.parent = parent;
    this.apiPrefix = `/extensions/${this.parent.id}/api`;

    this.init();
  }

  init() {
    this.initRest();
    this.initApi();
  }

  initRest() {
    this.rest = {
      getJson(url) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'GET',
            headers: window.API.headers()
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      postJson(url, data) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'POST',
            headers: window.API.headers('application/json'),
            body: JSON.stringify(data)
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      putJson(url, data) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'PUT',
            headers: window.API.headers('application/json'),
            body: JSON.stringify(data)
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      patchJson(url, data) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'PATCH',
            headers: window.API.headers('application/json'),
            body: JSON.stringify(data)
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      delete(url) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'DELETE',
            headers: window.API.headers()
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      }
    };
  }

  initApi() {
    this.api = {

      /***  Resource : /config  ***/
      getConfig: () => {
        console.log(`rest.getConfig()`);
        return this.restCall(`get`, `/config`);
      },
      putConfig: (config) => {
        console.log(`rest.putConfig()`);
        return this.restCall(`put`, `/config`, config);
      },
      deleteConfig: () => {
        console.log(`rest.deleteConfig()`);
        return this.restCall(`delete`, `/config`);
      },

      /***  Resource : /config/account  ***/
      getConfigAccount: () => {
        console.log(`rest.getConfigAccount()`);
        return this.restCall(`get`, `/config/account`);
      },
      putConfigAccount: (account) => {
        console.log(`rest.putConfigAccount()`);
        return this.restCall(`put`, `/config/account`, account);
      },
      patchConfigAccount: (account) => {
        console.log(`rest.patchConfigAccount()`);
        return this.restCall(`patch`, `/config/account`, account);
      },
      deleteConfigAccount: () => {
        console.log(`rest.deleteConfigAccount()`);
        return this.restCall(`delete`, `/config/account`);
      },

      /***  Resource : /config/webhook  ***/
      getConfigWebhook: (name) => {
        console.log(`rest.getConfigWebhook()`);
        return this.restCall(`get`, `/config/webhook${(name) ? `/${name}` : ``}`);
      },
      postConfigWebhook: (webhook) => {
        console.log(`rest.postConfigWebhook()`);
        return this.restCall(`post`, `/config/webhook`, webhook);
      },
      putConfigWebhook: (name, webhook) => {
        console.log(`rest.putConfigWebhook()`);
        webhook = (webhook) ? webhook : name;
        name = (webhook) ? name : null;
        return this.restCall(`put`, `/config/webhook${(name) ? `/${name}` : ``}`, webhook);
      },
      deleteConfigWebhook: (name) => {
        console.log(`rest.deleteConfigWebhook()`);
        return this.restCall(`delete`, `/config/webhook${(name) ? `/${name}` : ``}`);
      },

      /***  Resource : /config/history  ***/
      getConfigHistory: () => {
        console.log(`rest.getConfigHistory()`);
        return this.restCall(`get`, `/config/history`);
      },
      putConfigHistory: (historyConfig) => {
        console.log(`rest.putConfigHistory()`);
        return this.restCall(`put`, `/config/history`, historyConfig);
      },
      deleteConfigHistory: (name) => {
        console.log(`rest.deleteConfigHistory()`);
        return this.restCall(`delete`, `/config/history`);
      },

      /***  Resource : /config/service  ***/
      getConfigService: () => {
        console.log(`rest.getConfigService()`);
        return this.restCall(`get`, `/config/service`);
      },

      /***  Resource : /history  ***/
      getHistory: (name) => {
        console.log(`rest.getHistory()`);
        return this.restCall(`get`, `/history${(name) ? `/${name}` : ``}`);
      },
      deleteHistory: (name) => {
        console.log(`rest.deleteHistory()`);
        return this.restCall(`delete`, `/history${(name) ? `/${name}` : ``}`);
      },

      /***  Resource : /history  ***/
      getService: (name) => {
        console.log(`rest.getService()`);
        return this.restCall(`get`, `/service${(name) ? `/${name}` : ``}`);
      },

    };
  }

  restCall(method, path, body) {
    return new Promise((resolve, reject) => {
      method = method.toLowerCase();
      let func;
      switch(method) {
        case `get`:
          func = this.rest.getJson;
          break;
        case `post`:
          func = this.rest.postJson;
          break;
        case `put`:
          func = this.rest.putJson;
          break;
        case `patch`:
          func = this.rest.patchJson;
          break;
        case `delete`:
          func = this.rest.delete;
          break;
      }
      func(`${this.apiPrefix}${path}`, body)
      .then((resBody) => resolve(resBody))
      .catch((err) => reject(err));
    });
  }
}