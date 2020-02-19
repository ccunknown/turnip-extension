(function() {

  const constants = {
    "workMode": {
      "noAccount": "noaccount",
      "wrongToken": "wrongtoken",
      "noWebhook": "nowebhook",
      "allReady": "allready"
    },
    "prefix": {
      "elementId": {
        "addonType": "extension",
        "addonName": "turnip-extension"
      }
    }
  };

  class TurnipExtension extends window.Extension {
    constructor() {
      super('turnip-extension');
      this.addMenuEntry('Turnip Extension');

      this.promise = [];

      this.content = '';

      let contentPromise = fetch(`/extensions/${this.id}/static/views/content.html`)
        .then((res) => res.text())
        .then((text) => {
          this.content = text;
        })
        .catch((e) => console.error('Failed to fetch content:', e));

      this.promise.push(contentPromise);
    }

    getConfig() {
      return new Promise((resolve, reject) => {
        window.API.getJson(`/extensions/${this.id}/api/config`).then((resBody) => {
          //console.log(JSON.stringify(resBody));
          resolve(resBody);
        });
      });
    }

    saveConfig() {
      return new Promise((resolve, reject) => {
        window.API.postJson(`/extensions/${this.id}/api/config`, this.config).then((resBody) => {
          //console.log(JSON.stringify(resBody));
          resolve(resBody);
        });
      });
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

    buildContentPrefix(page, section) {
      let addonType = constants.prefix.elementId.addonType;
      let addonName = constants.prefix.elementId.addonName;

      return `${addonType}-${addonName}-content-${page}-${section}`;
    }

    buildNavPrefix(page) {
      let addonType = constants.prefix.elementId.addonType;
      let addonName = constants.prefix.elementId.addonName;

      return `${addonType}-${addonName}-nav-${page}`;
    }

    pageRender() {
      console.log("pageRender() >> ");
      this.getWorkMode().then((workMode) => {
        this.renderNoAccount();
      });
    }

    renderNoAccount() {
      console.log("renderNoAccount() >> ");
      let cPrefix = this.buildContentPrefix("account", "section-01");

      let id = {
        "nav": {
          "console": `${this.buildNavPrefix("console")}`,
          "webhook": `${this.buildNavPrefix("webhook")}`,
          "setting": `${this.buildNavPrefix("setting")}`,
          "account": `${this.buildNavPrefix("account")}`,
        },
        "content": {
          "account": {
            "loading": `${cPrefix}-loading`,
            "create": `${cPrefix}-create`,
            "remove": `${cPrefix}-remove`
          }
        }
      };

      console.log("id : "+JSON.stringify(id, null, 2));

      //  Disable Nav.
      $(`#${id.nav.account}`).click();
      $(`#${id.nav.console}`).addClass("disabled");
      $(`#${id.nav.webhook}`).addClass("disabled");
      $(`#${id.nav.setting}`).addClass("disabled");
      $(`#${id.nav.account}`).removeClass("disabled");

      //  Hide section's element.
      $(`#${id.content.account.loading}`).addClass("hide");
      $(`#${id.content.account.create}`).removeClass("hide");
      $(`#${id.content.account.remove}`).addClass("hide");

      //  Initial value.
      $(`#${id.content.account.create}-form-email`).val(this.config.account.email);
      $(`#${id.content.account.create}-form-name`).val(this.config.account.name);
      if(this.config.account.password)
        $(`#${id.content.account.create}-form-password`).val(this.config.account.password);
      else
        $(`#${id.content.account.create}-form-password`).val(generatePassword(32, false));

      //  Add event listener of create button.
      $(`#${id.content.account.create}-button-create`).click(() => {
        
        //  Section change from create to loading.
        $(`#${id.content.account.loading}`).removeClass("hide");
        $(`#${id.content.account.create}`).addClass("hide");
        $(`#${id.content.account.remove}`).addClass("hide");

        //  Create new user using information from form.
        let email = $(`#${id.content.account.create}-form-email`).val();
        let name = $(`#${id.content.account.create}-form-name`).val();
        let password = $(`#${id.content.account.create}-form-password`).val();

        window.API.addUser(name, email, password).then((res) => {
          console.log(JSON.stringify(res));
          if(res.hasOwnProperty("jwt")) {
            //  Save new config.
            this.config.account.email = email;
            this.config.account.name = name;
            this.config.account.password = password;

            return this.generateToken(res.jwt);
          }
          else {
            alert("User creation fail.");
            //  Section change from loading to create.
            $(`#${id.content.account.loading}`).addClass("hide");
            $(`#${id.content.account.create}`).removeClass("hide");
            $(`#${id.content.account.remove}`).addClass("hide");

            return null;
          }
        }).then((res) => {
          if(!res)
            return ;
          console.log("addAccount : "+JSON.stringify(res, null, 2));
        });
      });
    }

    generateToken(token) {
      let url = `/oauth/allow?response_type=code&client_id=local-token&scope=%2Fthings%3Areadwrite&state=asdf&redirect_uri=https%3A%2F%2Fgateway.localhost%2Foauth%2Flocal-token-service&jwt=${token}`;
      return new Promise((resolve, reject) => {
        fetch(url).then((res) => {
          console.log(JSON.stringify(res));
        });
      });
    }

    testToken(token) {
      var href = `/things`;
      var opts = {
        method: 'GET',
        headers: {
          "Authorization" : `Bearer ${token}`
        }
      };
      return new Promise((resolve, reject) => {
        fetch(href, opts).then((res) => {
          console.log("testToken : "+JSON.stringify(res, null, 2));
        });
      });
    }

    show() {
      this.view.innerHTML = this.content;

      Promise.all(this.promise).then(() => {
        this.getConfig().then((config) => {
          this.config = config;
          console.log(JSON.stringify(this.config, null, 2));
          this.pageRender();
        });
      });
    }
  }

  new TurnipExtension();
})();

