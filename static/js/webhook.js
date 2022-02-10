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

  setAce(target, options) {
    console.log(`setAce(${target}) >> `);
    // create the editor

    options = (options) ? options : {
      enableBasicAutocompletion: true,
      enableSnippets: false,
      enableLiveAutocompletion: true
    };

    ace.require("ace/ext/language_tools");

    //var editor = ace.edit("extension-turnip-extension-content-webhook-slider-section-02-form-payload");
    let editor = ace.edit(this.said(`${target}`));
    var session = editor.getSession();
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
          "{{{timestamp.unix}}}",
          "{{{timestamp.isoString}}}",
          "{{{meta.}}}",
          "{{{device.id}}}",
          "{{{device.title}}}",
          "{{{device.type}}}",
          "{{{device.description}}}",
          "{{{device.href}}}",
          "{{{device.connected}}}",
          "{{{property.id}}}",
          "{{{property.originId}}}",
          "{{{property.title}}}",
          "{{{property.unit}}}",
          "{{{property.readOnly}}}",
          "{{{property.type}}}",
          "{{{property.value}}}",
          "{{{property.isString}}}",
          "{{{property.isNumber}}}",
          "{{{property.isBoolean}}}"
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

    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: false,
      enableLiveAutocompletion: true
    });

    editor.completers = [staticWordCompleter];
    this.setupFunctions();

    return editor;
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
      //this.renderHistory(webhookName);
      this.display.history.sync(webhookName);
    });

    saidObj(`turnip.content.webhook.slider.section-01.clear`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.slider.section-01.clear`);

      let webhookName = saidObj(`turnip.content.webhook.slider.section-01.title`).html();
      this.api.deleteHistory(webhookName)
      .then(() => {
        console.log(`After deleteHistory`);
        this.display.history.sync(webhookName);
      })
      .catch((err) => {
        console.log(err);
      });
    });

    saidObj(`turnip.content.webhook.slider.section-02.save`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.slider.section-02.save`);

      let form = this.getForm();
      let mode = form.meta.mode;

      console.log(`Form : ${JSON.stringify(form, null, 2)}`);
      
      delete form[`meta`];

      console.log(`Form : ${JSON.stringify(form, null, 2)}`);

      ((mode == `edit`) ? this.api.putConfigWebhook(form.name, form) : this.api.postConfigWebhook(form))
      .then((webhook) => {
        console.log(webhook);
        this.display.base.sync();
      })
      .catch((err) => {
        console.error(`turnip.content.webhook.slider.section-02.save`);
        this.onError(err);
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
    this.webhookEditor.getSession().setMode(mode);
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
      <span class="header-item-remove" id="${rkey}"><i class="fa fas fa-times"></i></span>
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

  transformToHtmlString(str) {
    let result = str;
    result = result.replace(/</g, `&lt;`);
    result = result.replace(/>/g, `&gt;`);

    return result;
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

      ((webhookList) ? Promise.resolve(webhookList) : this.api.getConfigWebhook())
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

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.history`).click(() => {
            this.display.history.sync(webhook.name);
          });

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.edit`).click(() => {
            this.display.form.sync(webhook.name);
          });

          saidObj(`turnip.content.webhook.container.item.:${webhook.name}:.button.remove`).click(() => {
            //  In progress
            if(!confirm(`Confirm to remove '${webhook.name}'.`))
              return ;

            this.api.deleteConfigWebhook(webhook.name)
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

  renderHistory(webhookName) {
    console.log(`renderHistory(${webhookName}) >> `);
    let said = this.said;
    let saidObj = this.saidObj;
    
    return new Promise((resolve, reject) => {
      saidObj(`turnip.content.webhook.slider.section-01.title`).html(webhookName);
      this.api.getHistory(webhookName)
      .then((recordArray) => {
        let itemTemplate = saidObj(`turnip.content.webhook.slider.section-01.template`).html();
        saidObj(`turnip.content.webhook.slider.section-01.record`).html(``);

        for(let i in recordArray) {
          let item = itemTemplate.replace(/{{index}}/g, `${i}`);
          let elem = recordArray[i];
          saidObj(`turnip.content.webhook.slider.section-01.record`).append(item);
          this.turnipRaid.updateIdList(this.parent.idRegex);
          console.log(this.turnipRaid.idList);
          
          let metaElem = this.transformToHtmlString(JSON.stringify(elem));
          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-meta`).html(metaElem);
          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-timestamp-req`).html(elem.timestamp.req.isoString);
          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-timestamp-timediff`).html(`${elem.timestamp.res.unix - elem.timestamp.req.unix} ms`);
          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-req.method`).html(elem.request.method.toUpperCase());
          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-req.method`).addClass(`turnip-badge-http-method-${elem.request.method.toLowerCase()}`);
          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-req.url`).html(elem.request.url);

          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-req-show`).click(() => {
            console.log(`Event [Click] : turnip.content.webhook.slider.section-01.history.item-${i}-req-show`);
            //let data = saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-meta`).html();
            let data = JSON.stringify(elem);
            let json = JSON.parse(data);
            let result = json.request;
            result.timestamp = json.timestamp.req;
            this.renderModal(result);
            saidObj(`turnip.content.webhook.slider.section-01.modal`).modal('show');
          });

          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.code`).html(`${elem.respond.code}`.toUpperCase());
          (typeof elem.respond.code == `string`) ? saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.code`).addClass(`badge-danger`) : 
          (elem.respond.code < 200) ? saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.code`).addClass(`badge-warning`) : 
          (elem.respond.code == 200) ? saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.code`).addClass(`badge-success`) : 
          (elem.respond.code < 300) ? saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.code`).addClass(`badge-info`) : 
          (elem.respond.code < 600) ? saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.code`).addClass(`badge-danger`) : 
          {};
          console.log(`code : ${elem.respond.code}`);

          if(elem.respond.hasOwnProperty(`body`))
            saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.body`).html(this.transformToHtmlString(elem.respond.body));
          else
            saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res.body`).html(``);

          saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-res-show`).click(() => {
            console.log(`Event [Click] : turnip.content.webhook.slider.section-01.history.item-${i}-res-show`);
            //let data = saidObj(`turnip.content.webhook.slider.section-01.history.item-${i}-meta`).html();
            let data = JSON.stringify(elem);
            let json = JSON.parse(data);
            let result = json.respond;
            result.timestamp = json.timestamp.res;
            this.renderModal(result);
            saidObj(`turnip.content.webhook.slider.section-01.modal`).modal('show');
            // $('#myModal').appendTo("body").modal('show');
          });
        }
        //saidObj(`turnip.content.webhook.slider.section-01.record`).html(str);
        resolve();
      })
      .catch((err) => reject(err));
    });
  }

  renderModal(schema) {
    console.log(`renderModal() >> `);
    console.log(`data : ${JSON.stringify(schema, null, 2)}`);

    let said = this.said;
    let saidObj = this.saidObj;

    let workspace = `turnip.content.webhook.slider.section-01.modal`;
    
    //  Timestamp section.
    if(schema.timestamp && schema.timestamp.unix && schema.timestamp.isoString) {
      saidObj(`${workspace}.timestamp`).val(`${schema.timestamp.isoString} : ${schema.timestamp.unix}`);
      saidObj(`${workspace}.timestamp.group`).removeClass(`hide`);
    }
    else
      saidObj(`${workspace}.timestamp.group`).addClass(`hide`);

    //  Url/Method section.
    if(schema.url && schema.method) {
      saidObj(`${workspace}.method`).html(schema.method);
      saidObj(`${workspace}.url`).val(schema.url);
      saidObj(`${workspace}.url.group`).removeClass(`hide`);
    }
    else
      saidObj(`${workspace}.url.group`).addClass(`hide`);

    //  Code section.
    if(schema.code) {
      saidObj(`${workspace}.code`).val(schema.code);
      saidObj(`${workspace}.code.group`).removeClass(`hide`);
    }
    else
      saidObj(`${workspace}.code.group`).addClass(`hide`);

    //  Header section.
    if(schema.headers) {
      saidObj(`${workspace}.headers`).empty();
      for(let i in schema.headers) {
        let h = `
          <div class="header-item">
            <span class="header-item-key">${i}</span>
            <span class="header-item-value">${schema.headers[i]}</span>
          </div>
        `;
        saidObj(`${workspace}.headers`).append(h);
      }
      saidObj(`${workspace}.headers.group`).removeClass(`hide`);
    }
    else
      saidObj(`${workspace}.headers.group`).addClass(`hide`);

    //  Payload section.
    if(schema.body || typeof schema.code == `string`) {
      let payload = (schema.body) ? schema.body : JSON.stringify(schema, null, 2);
      let editor = this.setAce(`${workspace}.payload`, {
        enableBasicAutocompletion: false,
        enableSnippets: false,
        enableLiveAutocompletion: false
      });
      editor.setValue(payload);
      (schema.headers && schema.headers[`content-type`] && schema.headers[`content-type`].startsWith(`application/json`)) ? editor.getSession().setMode(`ace/mode/json`) : {};
      (typeof schema.code == `string`) ? editor.getSession().setMode(`ace/mode/json`) : {};
      editor.setReadOnly(true);
      saidObj(`${workspace}.payload.group`).removeClass(`hide`);
    }
    else
      saidObj(`${workspace}.payload.group`).addClass(`hide`);
  }

  renderForm(webhookName) {
    let said = this.said;
    let saidObj = this.saidObj;
    //console.log(`renderForm(${(form && form.meta && form.meta.mode) ? form.meta.mode : ``}) >> `);
    return new Promise((resolve, reject) => {
      ((webhookName) ? this.api.getConfigWebhook(webhookName) : Promise.resolve(JSON.parse(JSON.stringify(this.form.default))))
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
        if(!this.webhookEditor)
          this.webhookEditor = this.setAce(`turnip.content.webhook.slider.section-02.form.payload`);
        this.webhookEditor.setValue(form.payload);

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
    form.payload = this.webhookEditor.getValue();

    return form;
  }

  onError(err) {
    let errName = err.body.error.name;
    let errMessage = err.body.error.message;

    console.log(err);
    console.log(errMessage);

    if(errName == `InvalidConfigSchema`) {
      let errList = JSON.parse(errMessage);
      let errStr = ``;
      errList.map((e) => {
        let tmp = `"${e.property.split(`.`).pop()}" ${e.message}`;
        errStr = `${errStr}${tmp}\n`;
      });
      alert(`Error : ${errStr}`);
    }
    else {
      alert(`Error : ${errMessage}`);
    }
  }

  initDisplay() {
    let said = this.said;
    let saidObj = this.saidObj;

    this.display = {};

    this.display.history = {
      show: () => {
        console.log(`display.history.show()`);
        saidObj(`turnip.content.webhook.slider.section-01`).removeClass('hide');
        saidObj(`turnip.content.webhook.slider.section-02`).addClass('hide');
        saidObj(`turnip.content.webhook.slider`).removeClass('hide');
      },
      loading: () => {
        console.log(`display.history.loading()`);
        saidObj(`turnip.content.webhook.slider.section-01.record`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-01.loading`).removeClass('hide');
      },
      loaded: () => {
        console.log(`display.history.loaded()`);
        saidObj(`turnip.content.webhook.slider.section-01.loading`).addClass('hide');
        saidObj(`turnip.content.webhook.slider.section-01.record`).removeClass('hide');
      },
      render: (webhookName) => {
        console.log(`display.history.render(${(webhookName) ? webhookName : ``})`);
        return this.renderHistory(webhookName);
      },
      sync: (webhookName) => {
        console.log(`display.histor.sync(${(webhookName) ? webhookName : ``})`);
        this.display.history.loading();
        this.display.history.show();
        this.display.history.render(webhookName)
        .then(() => {
          this.display.history.loaded();
        })
        .catch((err) => {
          alert(err);
          this.display.history.loaded();
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
    this.rest = this.parent.rest;
    this.api = this.parent.api;
  }
}

