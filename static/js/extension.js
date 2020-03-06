(function() {

  const constants = {
    "workMode": {
      "noAccount": "noaccount",
      "wrongToken": "wrongtoken",
      "noWebhook": "nowebhook",
      "allReady": "allready"
    }
  };

  // Used for call "TurnipRaid.stringAutoId" function instead of it's full name.
  var said;
  var saidObj;
  var ui;

  class TurnipExtension extends window.Extension {
    constructor() {
      super('turnip-extension');
      this.addMenuEntry('Turnip Extension');

      this.promise = [];

      this.content = '';
      this.contents = {};

      let prom = Promise.all([
        this.loadResource(`/extensions/${this.id}/static/views/main.html`),
        this.loadResource(`/extensions/${this.id}/static/views/console.html`),
        this.loadResource(`/extensions/${this.id}/static/views/webhook.html`),
        this.loadResource(`/extensions/${this.id}/static/views/setting.html`),
        this.loadResource(`/extensions/${this.id}/static/views/account.html`),
        this.loadResource(`/extensions/${this.id}/static/json/render.json`, `json`),
        ])
      .then(([
        mainPage,
        consolePage,
        webhookPage,
        settingPage,
        accountPage,
        renderSchema
      ]) => {
        return new Promise((resolve, reject) => {
          this.contents.mainPage = new DOMParser().parseFromString(mainPage, "text/html");
          this.contents.consolePage = new DOMParser().parseFromString(consolePage, "text/html");
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
          ui = this.webUi();

          let content = new DOMParser().parseFromString(mainPage, "text/html");
          
          content.getElementById(said(`turnip.content.console`)).innerHTML = this.contents.consolePage.body.innerHTML;
          content.getElementById(said(`turnip.content.webhook`)).innerHTML = this.contents.webhookPage.body.innerHTML;
          content.getElementById(said(`turnip.content.setting`)).innerHTML = this.contents.settingPage.body.innerHTML;
          content.getElementById(said(`turnip.content.account`)).innerHTML = this.contents.accountPage.body.innerHTML;

          this.content = content.body.innerHTML;
          //console.log(`content : ${this.content}`);
          resolve();
        });
      });
      this.promise.push(prom);
    }

    show() {
      Promise.all(this.promise).then(() => {
        this.view.innerHTML = this.content;
        this.getConfig().then((config) => {
          if(!this.config) {
            this.config = config;
            this.setEventFunction();
          }
          else
            this.config = config;
          console.log(JSON.stringify(this.config, null, 2));
          this.pageRender();
        });
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

    getWorkMode() {
      return new Promise((resolve, reject) => {
        //  If config have jwt.
        if(this.config.account.jwt) {
          this.testToken(this.config.account.jwt).then((result) => {
            //  On correct token.
            if(!result)
              resolve(constants.workMode.wrongToken);
            else
              if(!this.config.webhook.length)
                resolve(constants.workMode.noWebhook);
              else
                resolve(constants.workMode.allReady);
            });
        }
        //  If config don't have jwt.
        else
          resolve(constants.workMode.noAccount);
      });
    }

    pageRender() {
      console.log("pageRender() >> ");
      this.getWorkMode().then((workMode) => {
        console.log("Work Mode : "+workMode);
        this.renderNav(workMode);
        this.renderContent(workMode);
        /*
        this.renderContentConsole(workMode);
        this.renderContentWebhook(workMode);
        this.renderContentSetting(workMode);
        this.renderContentAccount(workMode);
        */
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

    renderNav(workMode) {
      console.log("renderNav() >> ");
      switch(workMode) {
        case constants.workMode.noAccount:
          ui.click(`turnip.nav.account`);
          ui.disable(`turnip.nav.console`);
          ui.disable(`turnip.nav.webhook`);
          ui.disable(`turnip.nav.setting`);
          ui.enable(`turnip.nav.account`);
          break;
        case constants.workMode.wrongToken:
          ui.click(`turnip.nav.account`);
          ui.disable(`turnip.nav.console`);
          ui.disable(`turnip.nav.webhook`);
          ui.disable(`turnip.nav.setting`);
          ui.enable(`turnip.nav.account`);
          break;
        case constants.workMode.noWebhook:
          ui.click(`turnip.nav.webhook`);
          ui.disable(`turnip.nav.console`);
          ui.enable(`turnip.nav.webhook`);
          ui.enable(`turnip.nav.setting`);
          ui.enable(`turnip.nav.account`);
          break;
        case constants.workMode.allReady:
          ui.click(`turnip.nav.console`);
          ui.enable(`turnip.nav.console`);
          ui.enable(`turnip.nav.webhook`);
          ui.enable(`turnip.nav.setting`);
          ui.enable(`turnip.nav.account`);
          break;
        default :
          console.error("renderNav() >> error : workMode invalid : "+workMode);
          break;
      }
    }

    renderContent(workMode) {
      console.log("renderContent() >> ");
      let list = Object.assign({}, this.renderSchema).renderList;
      //console.log(`list : ${JSON.stringify(list, null, 2)}`);
      for(let i in list) {
        let elem = list[i];
        //  Show/hide condition.
        if(!elem.hasOwnProperty(`show`) || elem.show.map(a => a.toLowerCase()).includes(workMode)) {
          console.log(`${elem.id} : show`);
          ui.show(elem.id)
        }
        else {
          console.log(`${elem.id} : hide`);
          ui.hide(elem.id);
        }
        //  Value assignment.
        if(elem.hasOwnProperty(`source`)) {
          switch(elem.source.type) {
            case "html":
              saidObj(elem.id).html(eval(elem.source.val));
              break;
            case "val":
              saidObj(elem.id).val(eval(elem.source.val));
              break;
            default:
              console.error(`Render source type undefined : ${elem.source.type}`);
              break;
          }
        }
      }

      this.renderContentWebhook();
    }

    renderContentWebhook() {
      console.log(`renderContentWebhook() >> `);
      // create the editor
      const container = document.getElementById("jsoneditor");
      const options = {};
      const editor = new JSONEditor(container, options);

      // set json
      const initialJson = {
        "Array": [1, 2, 3],
        "Boolean": true,
        "Null": null,
        "Number": 123,
        "Object": {"a": "b", "c": "d"},
        "String": "Hello World"
      };
      editor.set(initialJson);

      // get json
      const updatedJson = editor.get();
    }

    generateToken(token) {
      let url = `/oauth/allow?response_type=code&client_id=local-token&scope=%2Fthings%3Areadwrite&state=asdf&redirect_uri=https%3A%2F%2Fgateway.localhost%2Foauth%2Flocal-token-service&jwt=${token}`;
      return new Promise((resolve, reject) => {
        fetch(url, {method: "GET", redirect: "follow"}).then((res) => {
          console.log(res);
          return res.text();
        }).then((data) => {
          //console.log(data);
          let doc = new DOMParser().parseFromString(data, "text/html");
          resolve(doc.getElementById("token").innerHTML);
        });
      });
    }

    testToken(token) {
      var href = `/things`;
      var opts = {
        method: 'GET',
        headers: {
          "Authorization" : `Bearer ${token}`,
          "Accept": "application/json"
        }
      };
      return new Promise((resolve, reject) => {
        fetch(href, opts).then((res) => {
          console.log(res);
          resolve(res.ok);
        });
      });
    }

    setEventFunction() {
      this.setConsolePageEventFunction();
      this.setWebhookPageEventFunction();
      this.setSettingPageEventFunction();
      this.setAccountPageEventFunction();
    }

    setConsolePageEventFunction() {

    }

    setWebhookPageEventFunction() {

    }

    setSettingPageEventFunction() {

    }

    setAccountPageEventFunction() {
      let showGroup = (group) => {
        //  Pre-set web interface for loading.
        let groupList = [`loading`, `create`, `remove`];
        for(let i in groupList)
          saidObj(`turnip.content.account.${groupList[i]}`).addClass("hide");
        saidObj(`turnip.content.account.${group}`).removeClass("hide");
      };

      //  Add event listener of create button.
      saidObj(`turnip.content.account.create.button.create`).click(() => {
        console.log(`Event [Click] : turnip.content.account.create.button.create`);
        showGroup(`loading`);

        //  Create new user using information from form.
        let email = $(`#${said(`turnip.content.account.create.email`)}`).val();
        let name = $(`#${said(`turnip.content.account.create.name`)}`).val();
        let password = $(`#${said(`turnip.content.account.create.password`)}`).val();

        window.API.addUser(name, email, password)
        .then((res) => {
          console.log(JSON.stringify(res));
          //  Save new config.
          this.config.account.email = email;
          this.config.account.name = name;
          this.config.account.password = password;
          return this.generateToken(res.jwt);
        })
        .then((token) => (!token) ? this.config: this.updateAccount({
          "name": saidObj(`turnip.content.account.create.name`).val(),
          "email": saidObj(`turnip.content.account.create.email`).val(),
          "password": saidObj(`turnip.content.account.create.password`).val(),
          "jwt": (this.config.account.jwt = token)
        }))
        .then((config) => {
          this.config = config;
          this.pageRender();
        })
        .catch((e) => {
          console.error(e);
          this.config = this.getConfig();
          this.pageRender();
        });
      });

      //  Add event listener of update button.
      saidObj(`turnip.content.account.remove.button.update`).click(() => {
        console.log(`Event [Click] : turnip.content.account.remove.button.update`);
        showGroup(`loading`);
        //console.log(`jwt remove html : ${saidObj(`turnip.content.account.remove.jwt`).html()}`);
        //console.log(`jwt remove val : ${saidObj(`turnip.content.account.remove.jwt`).val()}`);
        this.updateAccount({
          "name": saidObj(`turnip.content.account.remove.name`).val(),
          "email": saidObj(`turnip.content.account.remove.email`).val(),
          "jwt": saidObj(`turnip.content.account.remove.jwt`).val()
        })
        .then((config) => {
          console.log(JSON.stringify(config, null, 2));
          this.config = config;
          this.pageRender();
        })
        .catch((e) => {
          console.error(e);
          this.config = this.getConfig();
          this.pageRender();
        });
      });

      //  Add event listener of remove button.
      saidObj(`turnip.content.account.remove.button.remove`).click(() => {
        console.log(`Event [Click] : turnip.content.account.remove.button.remove`);
        showGroup(`loading`);
        window.API.getAllUserInfo()
        .then((userList) => {
          let list = userList.filter((elem) => {
            return elem.name == saidObj(`turnip.content.account.remove.name`).val()
              && elem.email == saidObj(`turnip.content.account.remove.email`).val();
          });
          if(list.length == 1)
            return window.API.deleteUser(list[0].id);
          else if(list.length > 1)
            return console.error(`Wrong user filter in remove button function : ${JSON.stringify(list, null, 2)}`);
          else
            return null;
        })
        .then(() => this.deleteAccount())
        .then(() => this.getConfig())
        .then((config) => {
          console.log(JSON.stringify(config, null, 2));
          this.config = config;
          this.pageRender();
        })
        .catch((e) => {
          console.error(e);
          this.config = this.getConfig();
          this.pageRender();
        });
      });
    }

    getConfig() {
      return new Promise((resolve, reject) => {
        window.API.getJson(`/extensions/${this.id}/api/config`).then((resBody) => {
          //console.log(JSON.stringify(resBody));
          resolve(resBody);
        });
      });
    }

    saveConfig(config) {
      return new Promise((resolve, reject) => {
        (config) ? config : this.config;
        window.API.postJson(`/extensions/${this.id}/api/config`, config).then((resBody) => {
          //console.log(JSON.stringify(resBody));
          resolve(resBody);
        });
      });
    }

    updateAccount(account) {
      return new Promise((resolve, reject) => {
        //  Initial value.
        account = (account) ? account : this.config.account;

        window.API.patchJson(`/extensions/${this.id}/api/config/account`, account)
        .then((resBody) => {
          resolve(resBody);
        });
      });
    }

    deleteAccount() {
      return new Promise((resolve, reject) => {
        window.API.delete(`/extensions/${this.id}/api/config/account`).then((resBody) => {
          //console.log(JSON.stringify(resBody));
          resolve(resBody);
        });
      });
    }
  }

  //  TurnipRaid class used for predict and verify id of html.
  class TurnipRaid {
    constructor(idList) {
      this.idList = (idList) ? idList : [];
      let duplicateList = this.findDuplicate();
      if(duplicateList.length)
        console.error(`Found duplicate id in html : ${JSON.stringify(duplicateList, null, 2)}`);
    }

    findDuplicate(arr) {
      arr = (arr) ? arr : this.idList;
      return arr.filter((item, index) => {
        return arr.indexOf(item) != index;
      });
    }

    regexAutoId(regex, opt) {
      let arr = (opt && opt.array) ? opt.array : this.idList;
      let shortest = (opt && opt.shortest) ? true : false;

      let result = arr.filter((item, index) => item.match(regex));
      if(result.length == 0)
        console.error(`Not found id with regex : ${regex}`);
      else if(result.length > 1 && !shortest)
        console.warn(`Found list of id for regex : ${regex} : ${JSON.stringify(result, null, 2)}`);
      return result.reduce((a, b) => a.length <= b.length ? a : b);
    }

    stringAutoId(str, opt) {
      let arr = (opt && opt.array) ? opt.array : this.idList;
      var delimiter = (opt && delimiter) ? opt.delimiter : '.';
      let shortest = (opt && opt.shortest) ? true : false;

      str = str.split(delimiter).join(`.*`);
      str = `${str}$`;
      let regex = new RegExp(str);
      return this.regexAutoId(regex, opt);
    }

    stringAutoIdObject(str) {
      let id = this.stringAutoId(str);
      return (id) ? $(`#${id}`) : null;
    }
  }

  new TurnipExtension();
})();


