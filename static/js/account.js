class TurnipExtensionAccount {
  constructor(parent, turnipRaid) {
    this.parent = parent;
    this.constants = parent.constants;
    this.turnipRaid = turnipRaid;
    this.said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
    this.saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

    this.init();
  }

  init() {
    console.log(`TurnipExtensionAccount: init() >> `);

    this.initRestApiTool();
    //this.initButtonFunction();
    this.initDisplay();
  }

  initRestApiTool() {
    console.log(`TurnipExtensionAccount: initRestApiTool() >> `);
    this.rest = this.parent.rest;
    this.api = this.parent.api;
  }

  initButtonFunction() {
    console.log(`TurnipExtensionAccount: initButtonFunction() >> `);
    let said = this.said;
    let saidObj = this.saidObj;

    this.turnipRaid.updateIdList(this.parent.idRegex);

    //saidObj(`extension-turnip-extension-content-account-section-01-content-button-create`).click(() => {
    saidObj(`turnip.content.account.section-01.content.button.create`).click(() => {
      console.log(`Event [Click] : turnip.content.account.section-01.content.button.create`);

      let account = {};

      //  Create new user using information from form.
      let email = $(`#${said(`turnip.content.account.section-01.content.email`)}`).val();
      let name = $(`#${said(`turnip.content.account.section-01.content.name`)}`).val();
      let password = $(`#${said(`turnip.content.account.section-01.content.password`)}`).val();

      window.API.addUser(name, email, password)
      .then((res) => {
        console.log(JSON.stringify(res));
        //  Save new config.
        account.email = email;
        account.name = name;
        account.password = password;
        return this.api.generateToken(res.jwt);
      })
      .then((token) => (!token) ? account: this.api.putConfigAccount({
        "name": saidObj(`turnip.content.account.section-01.content.name`).val(),
        "email": saidObj(`turnip.content.account.section-01.content.email`).val(),
        "password": saidObj(`turnip.content.account.section-01.content.password`).val(),
        "jwt": token
      }))
      .then((configAccount) => {
        console.log(`configAccount : ${JSON.stringify(configAccount, null, 2)}`);
        this.display.sync(configAccount);
      })
      .catch((e) => {
        console.error(e);
        this.display.sync();
      });
    });

    saidObj(`turnip.content.account.section-01.content.button.update`).click(() => {
      console.log(`Event [Click] : turnip.content.account.section-01.content.button.update`);
      this.api.patchConfigAccount({
        "name": saidObj(`turnip.content.account.section-01.content.name`).val(),
        "email": saidObj(`turnip.content.account.section-01.content.email`).val(),
        "jwt": saidObj(`turnip.content.account.section-01.content.jwt`).val()
      })
      .then((configAccount) => {
        console.log(JSON.stringify(configAccount, null, 2));
        this.display.sync(configAccount);
      })
      .catch((e) => {
        console.error(e);
        this.display.sync();
      });
    });

    saidObj(`turnip.content.account.section-01.content.button.remove`).click(() => {
      console.log(`Event [Click] : turnip.content.account.section-01.content.button.remove`);
      this.display.loading();
      this.api.getConfigAccount()
      .then((configAccount) => this.api.deleteAccount(configAccount))
      .then(() => this.api.deleteConfigAccount())
      .then((configAccount) => {
        return this.display.render(configAccount);
      })
      .then(() => this.display.loaded())
      .catch((err) => {
        alert(err);
        this.display.loaded();
      });
    });
  }

  initDisplay() {
    console.log(`TurnipExtensionAccount: initDisplay() >> `);
    let said = this.said;
    let saidObj = this.saidObj;

    this.display = {};

    this.display = {
      loading: () => {
        console.log(`display.account.loading()`);
        saidObj(`turnip.content.account.section-01.content`).addClass('hide');
        saidObj(`turnip.content.account.section-01.loading`).removeClass('hide');
      },
      loaded: () => {
        console.log(`display.account.loaded()`);
        saidObj(`turnip.content.account.section-01.loading`).addClass('hide');
        saidObj(`turnip.content.account.section-01.content`).removeClass('hide');
      },
      render: (config) => {
        console.log(`display.account.render()`);
        return this.renderAccount(config);
      },
      sync: (config) => {
        console.log(`display.account.sync()`);
        this.display.loading();
        this.display.render(config)
        .then(() => {
          this.display.loaded();
        })
        .catch((err) => {
          alert(err);
          this.display.loaded();
        });
      }
    };
  }

  render() {
    console.log(`TurnipExtensionAccount: render() >> `);
    this.display.sync();
    this.initButtonFunction();
  }

  renderAccount(configAccount) {
    console.log(`TurnipExtensionAccount: render() >> `);
    let said = this.said;
    let saidObj = this.saidObj;
    return new Promise((resolve, reject) => {
      let account;
      let workmode;
      ((configAccount) ? Promise.resolve(configAccount) : this.api.getConfigAccount())
      .then((configAccount) => {
        account = configAccount;
        return this.api.getWorkMode(account);
      })
      .then((workMode) => {
        workmode = workMode;

        saidObj(`turnip.content.account.section-01.content.form.email`).val(account.email);
        saidObj(`turnip.content.account.section-01.content.form.name`).val(account.name);
        saidObj(`turnip.content.account.section-01.content.form.password`).val(generatePassword(32, false));
        (account.jwt) ? saidObj(`turnip.content.account.section-01.content.form.jwt`).val(account.jwt) : saidObj(`turnip.content.account.section-01.content.form.jwt`).val(``);
        
        switch(workmode) {
          case this.constants.workMode.allReady:
            //  Caution.
            saidObj(`turnip.content.account.section-01.content.caution.create`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.caution.remove`).removeClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.caution.wrong`).addClass(`hide`);

            //  Form.
            saidObj(`turnip.content.account.section-01.content.form.password.group`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.form.jwt.group`).removeClass(`hide`);

            //  Button.
            saidObj(`turnip.content.account.section-01.content.button.create`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.button.update`).removeClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.button.remove`).removeClass(`hide`);
            break;
          case this.constants.workMode.wrongToken:
            //  Caution.
            saidObj(`turnip.content.account.section-01.content.caution.create`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.caution.remove`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.caution.wrong`).removeClass(`hide`);

            //  Form.
            saidObj(`turnip.content.account.section-01.content.form.password.group`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.form.jwt.group`).removeClass(`hide`);

            //  Button.
            saidObj(`turnip.content.account.section-01.content.button.create`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.button.update`).removeClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.button.remove`).removeClass(`hide`);
            break;
          case this.constants.workMode.noAccount:
            //  Caution.
            saidObj(`turnip.content.account.section-01.content.caution.create`).removeClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.caution.remove`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.caution.wrong`).addClass(`hide`);

            //  Form.
            saidObj(`turnip.content.account.section-01.content.form.password.group`).removeClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.form.jwt.group`).addClass(`hide`);

            //  Button.
            saidObj(`turnip.content.account.section-01.content.button.create`).removeClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.button.update`).addClass(`hide`);
            saidObj(`turnip.content.account.section-01.content.button.remove`).addClass(`hide`);
            break;
          default:
            console.error(`workMode : '${workmode}' undefined!!!`);
            break;
        }

        this.parent.renderNav(workmode);

        resolve();
      })
      .catch((err) => reject(err));
    });
  }
}