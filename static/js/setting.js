class TurnipExtensionSetting {
  constructor(parent, turnipRaid) {
    this.parent = parent;
    this.turnipRaid = turnipRaid;
    this.said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
    this.saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

    this.init();
  }

  init() {
    console.log(`TurnipExtensionSetting: init() >> `);

    this.config = {};
    this.config.history = null;

    this.initRestApiTool();
    this.initButtonFunction();
    this.initDisplay();
  }

  render() {
    console.log(`TurnipExtensionSetting: render() >> `);
    this.display.sync();
  }

  renderService() {
    let said = this.said;
    let saidObj = this.saidObj;

    return new Promise((resolve, reject) => {
      //  Render service list.
      this.rest.getService()
      .then((serviceList) => {
        saidObj(`turnip.content.setting.section-01.service.container`).empty();
        let template = saidObj(`turnip.content.setting.section-01.service.items.template`).html();
        serviceList.map((service) => {
          let temp = template.replace(/{{id}}/g,`${service.id}`);
          saidObj(`turnip.content.setting.section-01.service.container`).append(temp);
        });
        this.turnipRaid.updateIdList(this.parent.idRegex);
        serviceList.map((service) => {
          saidObj(`turnip.content.setting.section-01.service.item.${service.id}.id`).html(`${service.id}`);
          if(service.enable) {
            saidObj(`turnip.content.setting.section-01.service.item.${service.id}.enable`).html(`enable`);
            saidObj(`turnip.content.setting.section-01.service.item.${service.id}.enable`).addClass(`badge-success`);
          }
          else {
            saidObj(`turnip.content.setting.section-01.service.item.${service.id}.enable`).html(`disable`);
            saidObj(`turnip.content.setting.section-01.service.item.${service.id}.enable`).addClass(`badge-danger`);
          }
          saidObj(`turnip.content.setting.section-01.service.item.${service.id}.description`).html(`${service.description}`);
        });
        return this.rest.getConfigHistory();
        //resolve();
      })
      .then((configHistory) => {
        this.config.history = configHistory;
        saidObj(`turnip.content.setting.section-01.history.limit.input`).val(configHistory.limit);
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  initButtonFunction() {
    let said = this.said;
    let saidObj = this.saidObj;

    saidObj(`turnip.content.setting.section-01.factory-reset.button`).click(() => {
      console.log(`Event [Click] : turnip.content.setting.section-01.factory-reset.button`);

    });

    saidObj(`turnip.content.setting.section-01.account-reset.button`).click(() => {
      console.log(`Event [Click] : turnip.content.setting.section-01.account-reset.button`);

    });

    saidObj(`turnip.content.setting.section-01.webhook-reset.button`).click(() => {
      console.log(`Event [Click] : turnip.content.setting.section-01.webhook-reset.button`);
      this.display.loading();
      this.rest.deleteConfigWebhook()
      .then(() => {
        this.display.sync();
      })
      .catch((err) => {
        console.error(err);
      });
    });

    saidObj(`turnip.content.setting.section-01.history-reset.button`).click(() => {
      console.log(`Event [Click] : turnip.content.setting.section-01.history-reset.button`);
      this.display.loading();
      this.rest.deleteHistory()
      .then(() => {
        this.display.sync();
      })
      .catch((err) => {
        console.error(err);
      });
    });

    saidObj(`turnip.content.setting.section-01.history-limit.set.button`).click(() => {
      console.log(`Event [Click] : turnip.content.setting.section-01.history-limit.set.button`);
      this.config.history.limit = saidObj(`turnip.content.setting.section-01.history-limit.input`);
      this.display.loading();
      this.rest.putConfigHistory(this.config.history)
      .then(() => {
        this.display.sync();
      })
      .catch((err) => {
        console.error(err);
      });
    });
  }

  initDisplay() {
    let said = this.said;
    let saidObj = this.saidObj;

    this.display = {
      loading: () => {
        console.log(`display.loading()`);
        saidObj(`turnip.content.setting.section-01.container`).addClass('hide');
        saidObj(`turnip.content.setting.section-01.loading`).removeClass('hide');
      },
      loaded: () => {
        console.log(`display.loaded()`);
        saidObj(`turnip.content.setting.section-01.loading`).addClass('hide');
        saidObj(`turnip.content.setting.section-01.container`).removeClass('hide');
      },
      render: () => {
        console.log(`display.render()`);
        return this.renderService();
      },
      sync: (webhookName) => {
        console.log(`display.sync(${(webhookName) ? webhookName : ``})`);
        this.display.loading();
        this.display.render(webhookName)
        .then(() => {
          this.display.loaded();
        })
        .catch((err) => {
          alert(err);
          this.display.loaded();
        });
      }
    }
  }

  initRestApiTool() {
    this.rest = {
      deleteConfig: () => {
        console.log(`rest.deleteConfig()`);
        return new Promise((resolve, reject) => {
          this.API.delete(`/extensions/${this.parent.id}/api/config`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
      deleteConfigAccount: () => {
        console.log(`rest.deleteConfigAccount()`);
        return new Promise((resolve, reject) => {
          this.API.delete(`/extensions/${this.parent.id}/api/config/account`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
      deleteConfigWebhook: () => {
        console.log(`rest.deleteConfigWebhook()`);
        return new Promise((resolve, reject) => {
          this.API.delete(`/extensions/${this.parent.id}/api/config/webhook`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
      deleteHistory: (name) => {
        console.log(`rest.deleteHistory(${(name) ? `"${name}"` : ``})`);
        return new Promise((resolve, reject) => {
          this.API.delete(`/extensions/${this.parent.id}/api/history${(name) ? `/${name}` : ``}`)
          .then((resBody) => {
            console.log(`deleteHistory result : ${resBody}`);
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
      getService: (name) => {
        console.log(`rest.getService(${(name) ? `"${name}"` : ``})`);
        return new Promise((resolve, reject) => {
          this.API.getJson(`/extensions/${this.parent.id}/api/service${(name) ? `/${name}` : ``}`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
      getConfigHistory: () => {
        console.log(`rest.getConfigHistory()`);
        return new Promise((resolve, reject) => {
          this.API.getJson(`/extensions/${this.parent.id}/api/config/history`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
      putConfigHistory: (historyConfig) => {
        console.log(`rest.getConfigHistory()`);
        return new Promise((resolve, reject) => {
          this.API.putJson(`/extensions/${this.parent.id}/api/config/history`, historyConfig)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      }
    };

    this.API = {
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
}
