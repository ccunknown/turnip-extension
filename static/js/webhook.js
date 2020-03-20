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
    this.initDisplay();
    //this.setAce();
    //this.setupFunctions();
  }

  setAce() {
    console.log(`renderWebhook() >> `);
    // create the editor

    ace.require("ace/ext/language_tools");

    //var editor = ace.edit("extension-turnip-extension-content-webhook-slider-section-02-form-payload");
    this.editor = ace.edit(this.said("turnip.content.webhook.slider.section-02.form.payload"));
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
        var wordList = [
          "{{timestamp.unix}}",
          "{{timestamp.isoString}}",
          "{{device.id}}",
          "{{device.title}}",
          "{{device.type}}",
          "{{device.description}}",
          "{{device.href}}",
          "{{device.connected}}",
          "{{property.name}}",
          "{{property.origin}}",
          "{{property.type}}",
          "{{property.value}}",
          "{{property.isString}}",
          "{{property.isNumber}}",
          "{{property.isBoolean}}"
        ];

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
    saidObj(`turnip.content.webhook.slider.section-02.form.header.button.add`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.slider.section-02.form.header.button.add`);

      var header = {
        key: saidObj(`turnip.content.webhook.slider.section-02.form.header.key`).val(),
        value: saidObj(`turnip.content.webhook.slider.section-02.form.header.value`).val()
      };

      if(header.key == `` || header.value == ``)
        return ;

      this.addToHeaders(header);

      saidObj(`turnip.content.webhook.slider.section-02.form.header.key`).val(``);
      saidObj(`turnip.content.webhook.slider.section-02.form.header.value`).val(``);
    });

    saidObj(`turnip.content.webhook.slider.section-01.reload`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.slider.section-01.reload`);

      let webhookName = saidObj(`turnip.content.webhook.slider.section-01.title`).html();
      //this.renderConsole(webhookName);
      this.display.console.sync(webhookName);
    });

    saidObj(`turnip.content.webhook.slider.section-01.clear`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.slider.section-01.clear`);

      let webhookName = saidObj(`turnip.content.webhook.slider.section-01.title`).html();
      this.rest.deleteHistory(webhookName)
      .then(() => this.display.console.sync(webhookName));
    });

    saidObj(`turnip.content.webhook.slider.section-02.save`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.slider.section-02.save`);

      let form = this.getForm();
      let mode = form.meta.mode;

      console.log(`Form : ${JSON.stringify(form, null, 2)}`);
      
      delete form[`meta`];

      console.log(`Form : ${JSON.stringify(form, null, 2)}`);

      ((mode == `edit`) ? this.rest.put(form.name, form) : this.rest.post(form))
      .then((webhook) => {
        console.log(webhook);
        this.display.base.sync();
      })
      .catch((err) => {
        console.log(err.body.error.message);
        //console.log(JSON.stringify(JSON.parse(err.body.message)));
      });
    });

    //saidObj(`turnip.content.webhook.slider.section-02.form.headers`).change(this.onHeaderChange);
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
    let headers = saidObj(`turnip.content.webhook.slider.section-02.form.headers`);
    let parentId = `extension-turnip-extension-content-webhook-slider-section-02-form-headers`;
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
    let parentId = `extension-turnip-extension-content-webhook-slider-section-02-form-headers`;
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
    let parentId = `extension-turnip-extension-content-webhook-slider-section-02-form-headers`;
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

    let itemTemplate = saidObj(`turnip.content.webhook.base.template.item`).html();
    let adder = saidObj(`turnip.content.webhook.base.template.adder`).html().replace(/-{{template}}/gi,``);

    return new Promise((resolve, reject) => {
      //  Clear all .turnip-webhook-item
      $(`#${said(`turnip.content.webhook.base.container`)} .turnip-webhook-item`).remove();

      ((webhookList) ? Promise.resolve(webhookList) : this.rest.get())
      .then((webhookArray) => {
        for(let i in webhookArray) {
          let webhook = webhookArray[i];
          let item = `${itemTemplate}`.replace(/{{name}}/gi, `:${webhook.name}:`);
          console.log(`item : ${item}`);
          //extension-turnip-extension-content-webhook-base-container
          saidObj(`turnip.content.webhook.container`).append(item);

          this.turnipRaid.updateIdList(this.parent.idRegex);
          console.log(this.turnipRaid.idList);

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.name`).html(webhook.name);
          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.method`).html(webhook.method.toUpperCase());
          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.method`).addClass(`turnip-badge-http-method-${webhook.method.toLowerCase()}`);
          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.url`).html(webhook.url);
          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.description`).html(webhook.description);

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.console`).click(() => {
            this.display.console.sync(webhook.name);
          });

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.edit`).click(() => {
            this.display.form.sync(webhook.name);
          });

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.remove`).click(() => {
            //  In progress
            if(!confirm(`Confirm to remove '${webhook.name}'.`))
              return ;

            this.rest.delete(webhook.name)
            .then((webhookArray) => this.display.base.sync());
            //saidObj(`turnip.content.webhook.container.items.${webhook.name}`).remove();
          });
        }

        saidObj(`turnip.content.webhook.container`).append(adder);
        this.turnipRaid.updateIdList();
        saidObj(`turnip.content.webhook.container.adder`).click(() => {
          console.log(`Event [Click] : turnip.content.webhook.container.adder`);
          this.display.form.sync();
        });

        resolve();
      })
      .catch((err) => reject(err));
    });
  }

  renderConsole(webhookName) {
    let said = this.said;
    let saidObj = this.saidObj;
    let str = ``;

    return new Promise((resolve, reject) => {
      saidObj(`turnip.content.webhook.slider.section-01.title`).html(webhookName);
      this.rest.getHistory(webhookName)
      .then((recordArray) => {
        for(let i in recordArray) {
          str = (str == ``) ? JSON.stringify(recordArray[i]) : `${str}<br>${JSON.stringify(recordArray[i])}`;
        }
        saidObj(`turnip.content.webhook.slider.section-01.record`).html(str);
        resolve();
      })
      .catch((err) => reject(err));
    });
  }

  renderForm(webhookName) {
    let said = this.said;
    let saidObj = this.saidObj;
    //console.log(`renderForm(${(form && form.meta && form.meta.mode) ? form.meta.mode : ``}) >> `);
    return new Promise((resolve, reject) => {
      ((webhookName) ? this.rest.get(webhookName) : Promise.resolve(JSON.parse(JSON.stringify(this.form.default))))
      .then((form) => {
        console.log(`default : ${JSON.stringify(this.form.default, null, 2)}`);
        console.log(`form : ${JSON.stringify(form, null, 2)}`);

        let meta = {
          mode: (webhookName) ? "edit" : this.form.default.meta.mode,
          name: (webhookName) ? webhookName : this.form.default.meta.name
        };

        saidObj(`turnip.content.webhook.slider.section-02.meta.mode`).val(meta.mode);
        saidObj(`turnip.content.webhook.slider.section-02.meta.name`).val(meta.name);
        saidObj(`turnip.content.webhook.slider.section-02.title`).html(meta.name);
        //  In progress.
        saidObj(`turnip.content.webhook.slider.section-02.form.enable`).prop("checked", form.enable);
        saidObj(`turnip.content.webhook.slider.section-02.form.name`).val(form.name);
        saidObj(`turnip.content.webhook.slider.section-02.form.description`).val(form.description);
        saidObj(`turnip.content.webhook.slider.section-02.form.method`).val(form.method);
        saidObj(`turnip.content.webhook.slider.section-02.form.url`).val(form.url);
        saidObj(`turnip.content.webhook.slider.section-02.form.unverify`).prop("checked", form.unverify);

        //  Disable name input when in edit mode.
        saidObj(`turnip.content.webhook.slider.section-02.form.name`).prop("disabled", (meta.mode == `edit`));
        
        //saidObj(`turnip.content.webhook.slider.section-02.form.headers`);
        let headers = saidObj(`turnip.content.webhook.slider.section-02.form.headers`);
        headers.empty();
        for(var i in form.headers) {
          this.addToHeaders(form.headers[i]);
        }

        if(form.header) {
          saidObj(`turnip.content.webhook.slider.section-02.form.header.key`).val(form.header.key);
          saidObj(`turnip.content.webhook.slider.section-02.form.header.value`).val(form.header.value);
        }
        
        //saidObj(`turnip.content.webhook.slider.section-02.form.payload`);
        if(!this.editor)
          this.setAce();
        this.editor.setValue(form.payload);

        resolve();
      })
      .catch((err) => reject(err));
    });
    
    //form = (form) ? form : JSON.parse(JSON.stringify(this.form.default));
    

    //return Promise.resolve();
  }

  getForm() {
    let saidObj = this.saidObj;
    let form = JSON.parse(JSON.stringify(this.form.default));
    form.meta.mode = saidObj(`turnip.content.webhook.slider.section-02.meta.mode`).val();
    form.meta.name = saidObj(`turnip.content.webhook.slider.section-02.meta.name`).val();
    
    form.name = saidObj(`turnip.content.webhook.slider.section-02.form.name`).val();
    form.description = saidObj(`turnip.content.webhook.slider.section-02.form.description`).val();
    form.enable = saidObj(`turnip.content.webhook.slider.section-02.form.enable`).prop("checked");
    form.method = saidObj(`turnip.content.webhook.slider.section-02.form.method`).val();
    form.url = saidObj(`turnip.content.webhook.slider.section-02.form.url`).val();
    form.unverify = saidObj(`turnip.content.webhook.slider.section-02.form.unverify`).prop("checked");
    form.headers = this.getFormHeaders();
    form.payload = this.editor.getValue();

    return form;
  }

  initDisplay() {
    let said = this.said;
    let saidObj = this.saidObj;

    this.display = {};

    this.display.console = {
      show: () => {
        console.log(`display.console.show()`);
        saidObj(`turnip.content.webhook.slider.section-01`).removeClass('hide');
        saidObj(`turnip.content.webhook.slider.section-02`).addClass('hide');
        saidObj(`turnip.content.webhook.slider`).removeClass('hide');
      },
      loading: () => {
        console.log(`display.console.loading()`);
        saidObj(`turnip.content.webhook.slider.section-01.record`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-01.loading`).removeClass('hide');
      },
      loaded: () => {
        console.log(`display.console.loaded()`);
        saidObj(`turnip.content.webhook.slider.section-01.loading`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-01.record`).removeClass('hide');
      },
      render: (webhookName) => {
        console.log(`display.console.render(${(webhookName) ? webhookName : ``})`);
        return this.renderConsole(webhookName);
      },
      sync: (webhookName) => {
        console.log(`display.console.sync(${(webhookName) ? webhookName : ``})`);
        this.display.console.loading();
        this.display.console.show();
        this.display.console.render(webhookName)
        .then(() => {
          this.display.console.loaded();
        })
        .catch((err) => {
          alert(err);
          this.display.form.loaded();
        });
      }
    };

    this.display.form = {
      show: () => {
        console.log(`display.form.show()`);
        saidObj(`turnip.content.webhook.slider.section-01`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-02`).removeClass('hide');
        saidObj(`turnip.content.webhook.slider`).removeClass('hide');
      },
      loading: () => {
        console.log(`display.form.loading()`);
        saidObj(`turnip.content.webhook.slider.section-02.form`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-02.loading`).removeClass('hide');
      },
      loaded: () => {
        console.log(`display.form.loaded()`);
        saidObj(`turnip.content.webhook.slider.section-02.loading`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-02.form`).removeClass('hide');
      },
      render: (webhookName) => {
        console.log(`display.form.render(${(webhookName) ? webhookName : ``})`);
        return this.renderForm(webhookName);
      },
      sync: (webhookName) => {
        console.log(`display.form.sync(${(webhookName) ? webhookName : ``})`);
        this.display.form.loading();
        this.display.form.show();
        this.display.form.render(webhookName)
        .then(() => {
          this.display.form.loaded();
        })
        .catch((err) => {
          alert(err);
          this.display.form.loaded();
        });
      }
    };

    this.display.base = {
      show: () => {
        console.log(`display.base.show()`);
        saidObj(`turnip.content.webhook.slider`).addClass('hide');
      },
      loading: () => {
        console.log(`display.base.loading()`);
      },
      loaded: () => {
        console.log(`display.base.loaded()`);
      },
      render: () => {
        console.log(`display.base.render()`);
        return this.renderBase();
      },
      sync: () => {
        console.log(`display.base.sync()`);
        this.display.base.loading();
        this.display.base.show();
        this.display.base.render()
        .then(() => {
          this.display.base.loaded();
        })
        .catch((err) => {
          alert(err);
          this.display.form.loaded();
        });
      }
    };
  }

  initRestApiTool() {
    this.rest = {

      getHistory: (name) => {
        console.log(`rest.getHistory(${(name) ? `"${name}"` : ``})`);
        return new Promise((resolve, reject) => {
          this.API.getJson(`/extensions/${this.parent.id}/api/history${(name) ? `/${name}` : ``}`)
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
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },

      get: (name) => {
        console.log(`rest.get(${(name) ? `"${name}"` : ``})`);
        return new Promise((resolve, reject) => {
          this.API.getJson(`/extensions/${this.parent.id}/api/config/webhook${(name) ? `/${name}` : ``}`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },

      post: (webhook) => {
        console.log(`rest.post(${(webhook.name) ? `"${webhook.name}"` : ``})`);
        console.log(`webhook : ${JSON.stringify(webhook, null, 2)}`);
        return new Promise((resolve, reject) => {
          this.API.postJson(`/extensions/${this.parent.id}/api/config/webhook`, webhook)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => {
            console.log(`found error`);
            console.log(JSON.stringify(err));
            reject(err);
          });
        });
      },

      put: (name, webhook) => {
        console.log(`rest.put(${(name) ? `"${name}"` : ``})`);
        return new Promise((resolve, reject) => {
          webhook = (webhook) ? webhook : name;
          name = (webhook) ? name : null;
          this.API.putJson(`/extensions/${this.parent.id}/api/config/webhook${(name) ? `/${name}` : ``}`, webhook)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },

      delete: (name) => {
        console.log(`rest.delete(${(name) ? `"${name}"` : ``})`);
        return new Promise((resolve, reject) => {
          this.API.delete(`/extensions/${this.parent.id}/api/config/webhook${(name) ? `/${name}` : ``}`)
          .then((resBody) => {
            resolve(resBody);
          })
          .catch((err) => reject(err));
        });
      },
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

