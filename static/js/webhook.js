class TurnipExtensionWebhook {
  constructor(parent, turnipRaid) {
    this.parent = parent;
    this.turnipRaid = turnipRaid;
    this.said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
    this.saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

    this.form = {};
    this.form.default = {
      meta: {
        mode: "new",
        name: "New Webhook"
      },
      name: "",
      description: "",
      enable: true,
      method: "POST",
      url: "",
      unverify: false,
      headers: [],
      payload: ""
    };

    this.init();
  }

  init() {
    this.initRestApiTool();
    //this.setAce();
    //this.setupFunctions();
  }

  setAce() {
    console.log(`renderWebhook() >> `);
    // create the editor

    ace.require("ace/ext/language_tools");

    //var editor = ace.edit("extension-turnip-extension-content-webhook-section-02-form-payload");
    this.editor = ace.edit(this.said("turnip.content.webhook.form.payload"));
    var session = this.editor.getSession();
    //session.setMode(`ace/mode/json`);
    //session.setMode(`ace/mode/json_mustache`);
    session.setMode(`ace/mode/text_mustache`);

    console.log(`onSet`);
    console.log(session.$mode.$highlightRules);

    //  Define autocomplete word and algorithm.
    //  Try to use 'snippet' if possible !!!
    var staticWordCompleter = {
      getCompletions: function(editor, session, pos, prefix, callback) {
        var wordList = ["{{test}}", "{{timeStamp}}", "{{id}}"];

        let line = session.getLine(pos.row);
        let p = line;

        if(pos.column > 2)
          p = `${line}`.substring(pos.column-3, pos.column);

        callback(null, wordList.map(function(word) {
          return {
            caption: word,
            value: (p.startsWith('{{')) ? word.substring(2) : word,
            meta: `static`
          };
        }));
      }
    };

    this.editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: false,
      enableLiveAutocompletion: true
    });

    this.editor.completers = [staticWordCompleter];
    this.setupFunctions();
  }

  setupFunctions() {
    let saidObj = this.saidObj;
    //  Add event listener of create button.
    saidObj(`turnip.content.webhook.form.header.button.add`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.form.header.button.add`);

      var header = {
        key: saidObj(`turnip.content.webhook.form.header.key`).val(),
        value: saidObj(`turnip.content.webhook.form.header.value`).val()
      };

      if(header.key == `` || header.value == ``)
        return ;

      this.addToHeaders(header);

      saidObj(`turnip.content.webhook.form.header.key`).val(``);
      saidObj(`turnip.content.webhook.form.header.value`).val(``);
    });

    saidObj(`turnip.content.webhook.form.save`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.form.save`);

      let form = this.getForm();
      let mode = form.meta.mode;

      console.log(`Form : ${JSON.stringify(form, null, 2)}`);
      
      delete form[`meta`];

      console.log(`Form : ${JSON.stringify(form, null, 2)}`);

      ((mode == `edit`) ? this.rest.put(form.name, form) : this.rest.post(form))
      .then((webhook) => {
        this.renderForm();
        this.renderBase();
        this.goToBase();
      });
    });

    //saidObj(`turnip.content.webhook.form.headers`).change(this.onHeaderChange);
  }

  render() {
    this.renderBase();
    this.renderForm();
  }

  onHeaderChange() {
    console.log(`onHeaderChange() >> `);
    let headers = this.getFormHeaders();
    let mode = `ace/mode/text_mustache`;
    for(let i in headers) {
      if(headers[i].key.toLowerCase() == `content-type`) {
        if(headers[i].value.toLowerCase() == `application/json`)
          mode = `ace/mode/json_mustache`;
      }
    }
    this.editor.getSession().setMode(mode);
  }

  addToHeaders(header) {
    let saidObj = this.saidObj;
    let headers = saidObj(`turnip.content.webhook.form.headers`);
    let parentId = `extension-turnip-extension-content-webhook-section-02-form-headers`;
    let rkey = `${parentId}-${header.key}`;
    let h = `
    <div class="header-item">
      <span class="header-item-key">${header.key}</span>
      <span class="header-item-value">${header.value}</span>
      <span class="" id="${rkey}"><i class="fa fas fa-times"></i></span>
    </div>
    `;
    this.removeFromHeaders(header.key);
    headers.append(h);
    $(`#${rkey}`).click(() => {
      this.removeFromHeaders(header.key);
    });
    this.onHeaderChange();
  }

  getFormHeaders() {
    let parentId = `extension-turnip-extension-content-webhook-section-02-form-headers`;
    let item = $(`#${parentId} > .header-item`);
    let key = $(`#${parentId} > .header-item > .header-item-key`);
    let value = $(`#${parentId} > .header-item > .header-item-value`);
    let result = [];

    console.log(item);
    console.log(key);
    console.log(value);

    for(let i = 0;i < item.length;i++) {
      result.push({
        key: key[i].innerHTML,
        value: value[i].innerHTML
      });
    }

    return result;
  }

  removeFromHeaders(key) {
    let parentId = `extension-turnip-extension-content-webhook-section-02-form-headers`;
    let child1 = $(`#${parentId} > .header-item`);
    let child2 = $(`#${parentId} > .header-item > .header-item-key`);
    console.log(child1);
    console.log(child2);
    for(let i = 0;i < child2.length;i++) {
      if(child2[i].innerHTML == key) {
        child1[i].remove();
      }
    }
    this.onHeaderChange();
  }

  renderBase(webhookList) {
    console.log(`renderBase() >> `);
    let saidObj = this.saidObj;
    let said = this.said;

    let itemTemplate = saidObj(`turnip.content.webhook.section-01.template.item`).html();
    let adder = saidObj(`turnip.content.webhook.section-01.template.adder`).html().replace(/-{{template}}/gi,``);

    //  Clear all .turnip-webhook-item
    $(`#${said(`turnip.content.webhook.section-01.container`)} .turnip-webhook-item`).remove();

    ((webhookList) ? Promise.resolve(webhookList) : this.rest.get()).then((webhookArray) => {
      for(let i in webhookArray) {
        let webhook = webhookArray[i];
        let item = `${itemTemplate}`.replace(/{{name}}/gi, `:${webhook.name}:`);
        console.log(`item : ${item}`);
        //extension-turnip-extension-content-webhook-section-01-container
        saidObj(`turnip.content.webhook.container`).append(item);

        this.turnipRaid.updateIdList(this.parent.idRegex);
        console.log(this.turnipRaid.idList);

        saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.name`).html(webhook.name);
        saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.url`).html(webhook.url);
        saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.description`).html(webhook.description);

        saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.edit`).click(() => {
          this.rest.get(webhook.name)
          .then((array) => {
            if(array.length != 1)
              throw(new Error(`Found multiple webhook as name as '${webhook.name} : ${JSON.stringify(array)}'`));

            let w = Object.assign(JSON.parse(JSON.stringify(this.form.default)), array[0]);
            w.meta.mode = "edit";
            w.meta.name = webhook.name;
            
            this.goToForm();
            this.renderForm(w);
          })
          .catch((e) => {
            console.error(e);
          });
        });

        saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.remove`).click(() => {
          //  In progress
          if(!confirm(`Confirm to remove '${webhook.name}'.`))
            return ;

          this.rest.delete(webhook.name)
          .then((webhookArray) => this.renderBase());
          //saidObj(`turnip.content.webhook.container.items.${webhook.name}`).remove();
        });
      }

      saidObj(`turnip.content.webhook.container`).append(adder);
      this.turnipRaid.updateIdList();
      saidObj(`turnip.content.webhook.container.adder`).click(() => {
        console.log(`Event [Click] : turnip.content.webhook.container.adder`);
        this.renderForm();
      })
    });
  }

  renderForm(form) {
    console.log(`renderForm(${(form && form.meta && form.meta.mode) ? form.meta.mode : ``}) >> `);
    form = (form) ? form : JSON.parse(JSON.stringify(this.form.default));
    console.log(`default : ${JSON.stringify(this.form.default, null, 2)}`);
    console.log(`form : ${JSON.stringify(form, null, 2)}`);
    let saidObj = this.saidObj;

    saidObj(`turnip.content.webhook.form.meta.mode`).val(form.meta.mode);
    saidObj(`turnip.content.webhook.form.meta.name`).val(form.meta.name);
    saidObj(`turnip.content.webhook.form.title`).html(form.meta.name);
    //  In progress.
    saidObj(`turnip.content.webhook.form.enable`).prop("checked", form.enable);
    saidObj(`turnip.content.webhook.form.name`).val(form.name);
    saidObj(`turnip.content.webhook.form.description`).val(form.description);
    saidObj(`turnip.content.webhook.form.method`).val(form.method);
    saidObj(`turnip.content.webhook.form.url`).val(form.url);
    saidObj(`turnip.content.webhook.form.unverify`).prop("checked", form.unverify);

    //  Disable name input when in edit mode.
    saidObj(`turnip.content.webhook.form.name`).prop("disabled", (form.meta.mode == `edit`));
    
    //saidObj(`turnip.content.webhook.form.headers`);
    let headers = saidObj(`turnip.content.webhook.form.headers`);
    headers.empty();
    for(var i in form.headers) {
      this.addToHeaders(form.headers[i]);
    }

    if(form.header) {
      saidObj(`turnip.content.webhook.form.header.key`).val(form.header.key);
      saidObj(`turnip.content.webhook.form.header.value`).val(form.header.value);
    }
    
    //saidObj(`turnip.content.webhook.form.payload`);
    if(!this.editor)
      this.setAce();
    this.editor.setValue(form.payload);
  }

  getForm() {
    let saidObj = this.saidObj;
    let form = JSON.parse(JSON.stringify(this.form.default));
    form.meta.mode = saidObj(`turnip.content.webhook.form.meta.mode`).val();
    form.meta.name = saidObj(`turnip.content.webhook.form.meta.name`).val();
    
    form.name = saidObj(`turnip.content.webhook.form.name`).val();
    form.description = saidObj(`turnip.content.webhook.form.description`).val();
    form.enable = saidObj(`turnip.content.webhook.form.enable`).prop("checked");
    form.method = saidObj(`turnip.content.webhook.form.method`).val();
    form.url = saidObj(`turnip.content.webhook.form.url`).val();
    form.unverify = saidObj(`turnip.content.webhook.form.unverify`).prop("checked");
    form.headers = this.getFormHeaders();
    form.payload = this.editor.getValue();

    return form;
  }

  goToForm() {
    this.saidObj(`turnip.content.webhook.section-02`).removeClass('hide');
  }

  goToBase() {
    this.saidObj(`turnip.content.webhook.section-02`).addClass('hide');
  }

  initRestApiTool() {
    this.rest = {

      get: (name) => {
        return new Promise((resolve, reject) => {
          window.API.getJson(`/extensions/${this.parent.id}/api/config/webhook${(name) ? `/${name}` : ``}`).then((resBody) => {
            resolve(resBody);
          });
        });
      },

      post: (webhook) => {
        return new Promise((resolve, reject) => {
          window.API.postJson(`/extensions/${this.parent.id}/api/config/webhook`, webhook).then((resBody) => {
            resolve(resBody);
          });
        });
      },

      put: (name, webhook) => {
        return new Promise((resolve, reject) => {
          webhook = (webhook) ? webhook : name;
          name = (webhook) ? name : null;
          window.API.putJson(`/extensions/${this.parent.id}/api/config/webhook${(name) ? `/${name}` : ``}`, webhook).then((resBody) => {
            resolve(resBody);
          });
        });
      },

      delete: (name) => {
        return new Promise((resolve, reject) => {
          window.API.delete(`/extensions/${this.parent.id}/api/config/webhook${(name) ? `/${name}` : ``}`).then((resBody) => {
            resolve(resBody);
          });
        });
      }
    };
  }
}


