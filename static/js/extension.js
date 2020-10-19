(function() {

  // Used for call "TurnipRaid.stringAutoId" function instead of it's full name.
  var said;
  var saidObj;
  var ui;

  class TurnipExtension extends window.Extension {
    constructor() {
      super('turnip-extension');
      this.addMenuEntry('Turnip Extension');
      this.idRegex = /^extension-turnip-extension/;

      this.promise = [];

      this.content = '';
      this.contents = {};

      this.constants = {
        "workMode": {
          "noAccount": "noaccount",
          "wrongToken": "wrongtoken",
          "noWebhook": "nowebhook",
          "allReady": "allready"
        },
        "scriptAddrPrefix": `/extensions/${this.id}/`
      };

      //  Load script.
      let scriptArr = [
        "static/js/jquery.min.js",
        "static/js/popper.min.js",
        "static/js/bootstrap.js",
        "static/js/password-generator.min.js",
        "static/ace-builds/src-min-noconflict/ace.js",
        "static/ace-builds/src-min-noconflict/ext-language_tools.js",
        "static/js/mode-text_mustache.js",
        "static/js/mode-json_mustache.js",

        "static/js/turnip-api.js",
        "static/js/turnipRaid.js",
        "static/js/webhook.js",
        "static/js/setting.js",
        "static/js/account.js",
      ];

      //for(let i in scriptArr)
      //  this.loadScriptSync(`${scriptAddrPrefix}${scriptArr[i]}`);

      //  Load resource.
      let prom = Promise.all([
        this.loadResource(`/extensions/${this.id}/static/views/main.html`),
        this.loadResource(`/extensions/${this.id}/static/views/webhook.html`),
        this.loadResource(`/extensions/${this.id}/static/views/setting.html`),
        this.loadResource(`/extensions/${this.id}/static/views/account.html`),
        this.loadResource(`/extensions/${this.id}/static/json/render.json`, `json`),
        this.loadScript(scriptArr)
        ])
      .then(([
        mainPage,
        webhookPage,
        settingPage,
        accountPage,
        renderSchema
      ]) => {
        return new Promise((resolve, reject) => {
          this.contents.mainPage = new DOMParser().parseFromString(mainPage, "text/html");
          this.contents.webhookPage = new DOMParser().parseFromString(webhookPage, "text/html");
          this.contents.settingPage = new DOMParser().parseFromString(settingPage, "text/html");
          this.contents.accountPage = new DOMParser().parseFromString(accountPage, "text/html");
          this.renderSchema = renderSchema;
          console.log(`render schema : ${JSON.stringify(this.renderSchema, null, 2)}`);
          let idList = [];
          for(let i in this.contents)
            idList = [...idList, ...this.idOfText(this.contents[i])];
          console.log(`id list : ${JSON.stringify(idList, null, 2)}`);

          //  Set up html element id shortcut as said.
          this.turnipRaid = new TurnipRaid(idList);
          said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
          saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

          //  Set rest and api.
          this.turnipApi = new TurnipApi(this);
          this.api = this.turnipApi.api;
          this.rest = this.turnipApi.rest;

          ui = this.webUi();

          let content = new DOMParser().parseFromString(mainPage, "text/html");
          
          content.getElementById(said(`turnip.content.webhook`)).innerHTML = this.contents.webhookPage.body.innerHTML;
          content.getElementById(said(`turnip.content.setting`)).innerHTML = this.contents.settingPage.body.innerHTML;
          content.getElementById(said(`turnip.content.account`)).innerHTML = this.contents.accountPage.body.innerHTML;

          this.content = content.body.innerHTML;
          //console.log(`content : ${this.content}`);

          //  Initial components.
          this.webhook = new TurnipExtensionWebhook(this, this.turnipRaid);
          this.setting = new TurnipExtensionSetting(this, this.turnipRaid);
          this.account = new TurnipExtensionAccount(this, this.turnipRaid);

          resolve();
        });
      });
      this.promise.push(prom);
    }

    show() {
      Promise.all(this.promise).then(() => {
        this.view.innerHTML = this.content;
        this.api.getConfig().then((config) => {
          if(!this.config) {
            this.config = config;
          }
          else
            this.config = config;
          console.log(JSON.stringify(this.config, null, 2));
          this.pageRender();
        });
      });
    }

    /*
    loadScriptSync (src) {
      var s = document.createElement('script');
      s.src = src;
      s.type = "text/javascript";
      s.async = false;
      document.getElementsByTagName('head')[0].appendChild(s);
    }
    */

    loadScript(scriptList) {
      return new Promise(async(resolve, reject) => {
        for(let i in scriptList)
          await this.loadScriptSync(`${this.constants.scriptAddrPrefix}${scriptList[i]}`);
        resolve();
      });
    }

    loadScriptSync(src) {
      return new Promise((resolve, reject) => {
        var s = document.createElement('script');
        s.src = src;
        s.type = "text/javascript";
        s.async = false;

        s.addEventListener("load", () => {
          console.log(`loadScriptSync("${src}"") : finish`);
          resolve();
        });

        s.addEventListener("error", (err) => {
          console.log(`loadScriptSync("${src}"") : error`);
          reject(err);
        });

        console.log(`loadScriptSync("${src}"") : start`);
        document.getElementsByTagName('head')[0].appendChild(s);
      });
    }

    loadResource(url, type) {
      return new Promise((resolve, reject) => {
        fetch(url).then((res) => {
          resolve((type == "json") ? res.json() : res.text());
        }).catch((e) => {
          console.error(`Failed to fetch "${url}" : ${e}`);
        });
      });
    }

    idOfText(content) {
      return $(`*`, content).map(function() {
        if(this.id)
          return this.id;
      }).get();
    }

    pageRender(config) {
      console.log("pageRender() >> ");

      return new Promise((resolve, reject) => {
        ((config) ? Promise.resolve(config) : this.api.getConfig())
        .then((conf) => (config = conf))
        .then(() => this.renderNav(config))
        .then(() => this.renderContent(config))
        .then(() => this.turnipRaid.updateIdList(this.idRegex))
        .then(() => resolve())
        .catch((err) => {
          alert(err);
          reject(err);
        });
      });
    }

    webUi() {
      return {
        show: (id) => saidObj(id).removeClass("hide"),
        hide: (id) => saidObj(id).addClass("hide"),
        enable: (id) => saidObj(id).removeClass("disabled"),
        disable: (id) => saidObj(id).addClass("disabled"),
        click: (id) => saidObj(id).click()
      }
    }

    renderNav(param) {
      //  'param' can be {workmode} or {config}.
      console.log("renderNav() >> ");
      return new Promise((resolve, reject) => {
        ((param) ? Promise.resolve(param) : this.api.getWorkMode())
        .then((input) => (input.account) ? this.api.getWorkMode(input.account) : input)
        .then((workmode) => {
          console.log(`renderNav() : workmode : ${workmode}`);
          switch(workmode) {
            case this.constants.workMode.noAccount:
              ui.click(`turnip.nav.account`);
              ui.disable(`turnip.nav.webhook`);
              ui.disable(`turnip.nav.setting`);
              ui.enable(`turnip.nav.account`);
              break;
            case this.constants.workMode.wrongToken:
              ui.click(`turnip.nav.account`);
              ui.disable(`turnip.nav.webhook`);
              ui.disable(`turnip.nav.setting`);
              ui.enable(`turnip.nav.account`);
              break;
            case this.constants.workMode.allReady:
              ui.click(`turnip.nav.webhook`);
              ui.enable(`turnip.nav.webhook`);
              ui.enable(`turnip.nav.setting`);
              ui.enable(`turnip.nav.account`);
              break;
            default :
              console.error("renderNav() >> error : workMode invalid : "+workmode);
              break;
          }
          resolve(workmode);
        })
        .catch((err) => {
          alert(err);
          reject(err);
        });
      });
    }

    renderContent(config) {
      console.log("renderContent() >> ");

      return new Promise((resolve, reject) => {
        ((config) ? Promise.resolve(config) : this.api.getConfig())
        .then((conf) => {
          config = conf;
          return config;
        })
        .then(() => this.webhook.render(config))
        .then(() => this.setting.render(config))
        .then(() => this.account.render(config))
        .then(() => resolve(config))
        .catch((err) => {
          alert(err);
          reject(err);
        });
      });
    }
  }

  new TurnipExtension();
})();
