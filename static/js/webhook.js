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
        ref: {
          id: null,
          name: null
        }
      },
      title: "New Webhook",
      name: "",
      description: "",
      method: "POST",
      url: "",
      headers: [],
      header: {
        key: "",
        value: ""
      },
      payload: ""
    };

    this.init();
  }

  init() {
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
        key: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-key`).val(),
        value: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-value`).val()
      };

      if(header.key == `` || header.value == ``)
        return ;

      this.addToHeaders(header);

      key: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-key`).val(``);
      value: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-value`).val(``);
    });

    saidObj(`turnip.content.webhook.form.save`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.form.save`);

      let form = this.getForm();
      console.log(`Form : ${JSON.stringify(form, null, 2)}`);
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

    let itemTemplate = `
      <div class="card turnip-webhook-item" id="extension-turnip-extension-content-webhook-section-01-items-{{name}}">
        <div class="card-header bg-dark d-flex justify-content-between">
          <div class="text-truncate" id="extension-turnip-extension-content-webhook-section-01-items-{{name}}-name">very longgggggggggggggggg title</div>
          <div class="turnip-card-header-btn-box">
            <button class="btn btn-warning" id="extension-turnip-extension-content-webhook-section-01-items-{{name}}-button-edit">
              <i class="fas fa-edit fa-lg"></i>
            </button>
            <button class="btn btn-danger" id="extension-turnip-extension-content-webhook-section-01-items-{{name}}-button-remove">
              <i class="fas fa-trash fa-lg"></i>
            </button>
          </div>
        </div>
        <div class="card-body bg-secondary">
          <h5 class="card-title text-truncate" id="extension-turnip-extension-content-webhook-section-01-items-{{name}}-url">Special title treatment</h5>
          <p class="card-text" id="extension-turnip-extension-content-webhook-section-01-items-{{name}}-description">With supporting text below as a natural lead-in to additional content.</p>
        </div>
      </div>
    `;

    ((webhookList) ? Promise.resolve(webhookList) : this.getConfigWebhook()).then((webhookArray) => {
      for(let i in webhookArray) {
        let webhook = webhookArray[i];
        let item = `${itemTemplate}`.replace(/{{name}}/, webhook.name);
        //extension-turnip-extension-content-webhook-section-01-container
        saidObj(`turnip.content.webhook.container`).prepend(item);
        saidObj(`turnip.content.webhook.container.items.${webhook.name}.name`).html(webhook.name);
        saidObj(`turnip.content.webhook.container.items.${webhook.name}.url`).html(webhook.url);
        saidObj(`turnip.content.webhook.container.items.${webhook.name}.description`).html(webhook.description);

        saidObj(`turnip.content.webhook.container.items.${webhook.name}.button.remove`).click(() => {
          //  In progress
          saidObj(`turnip.content.webhook.container.items.${webhook.name}`).remove();
        });
      }
    });
  }

  renderForm(form) {
    form = (form) ? form : this.form.default;
    let saidObj = this.saidObj;

    saidObj(`turnip.content.webhook.form.meta.mode`).val(form.meta.mode);
    saidObj(`turnip.content.webhook.form.meta.ref.index`).val(form.meta.ref.index);
    saidObj(`turnip.content.webhook.form.meta.ref.name`).val(form.meta.ref.name);
    saidObj(`turnip.content.webhook.form.title`).html(form.title);
    saidObj(`turnip.content.webhook.form.name`).val(form.name);
    saidObj(`turnip.content.webhook.form.description`).html(form.description);
    saidObj(`turnip.content.webhook.form.method`).val(form.method);
    saidObj(`turnip.content.webhook.form.url`).val(form.url);
    
    //saidObj(`turnip.content.webhook.form.headers`);
    let headers = saidObj(`turnip.content.webhook.form.headers`);
    headers.empty();
    for(var i in form.headers) {
      this.addToHeaders(form.headers[i]);
    }

    saidObj(`turnip.content.webhook.form.header.key`).val(form.header.key);
    saidObj(`turnip.content.webhook.form.header.value`).val(form.header.value);
    
    //saidObj(`turnip.content.webhook.form.payload`);
    if(!this.editor)
      this.setAce();
    this.editor.setValue(form.payload);
  }

  getForm() {
    let saidObj = this.saidObj;
    let form = Object.assign({}, this.form.default);
    form.meta.mode = saidObj(`turnip.content.webhook.form.meta.mode`).val();
    form.meta.ref.index = saidObj(`turnip.content.webhook.form.meta.ref.index`).val();
    form.meta.ref.index = saidObj(`turnip.content.webhook.form.meta.ref.name`).val();
    
    form.title = saidObj(`turnip.content.webhook.form.title`).html();
    form.name = saidObj(`turnip.content.webhook.form.name`).val();
    form.description = saidObj(`turnip.content.webhook.form.description`).html();
    form.method = saidObj(`turnip.content.webhook.form.method`).val();
    form.url = saidObj(`turnip.content.webhook.form.url`).val();

    form.headers = this.getFormHeaders();

    form.payload = this.editor.getValue();

    return form;
  }

  getConfigWebhook() {
    return new Promise((resolve, reject) => {
      window.API.getJson(`/extensions/${this.parent.id}/api/config/webhook`).then((resBody) => {
        //console.log(JSON.stringify(resBody));
        resolve(resBody);
      });
    });
  }
}


