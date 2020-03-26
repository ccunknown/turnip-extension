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
      this.api.getService()
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
        return this.api.getConfigHistory();
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
      this.api.deleteConfigWebhook()
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
      this.api.deleteHistory()
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
      this.api.putConfigHistory(this.config.history)
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
    this.rest = this.parent.rest;
    this.api = this.parent.api;
  }
}
