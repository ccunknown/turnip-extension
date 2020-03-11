class TurnipExtensionWebhook {
  constructor(parent, turnipRaid) {
    this.parent = parent;
    this.turnipRaid = turnipRaid;
    this.said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
    this.saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

    this.form = {
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
      headers: {},
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
    session.setMode(`ace/mode/json_mustache`);

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
    saidObj(`turnip.content.webhook.form.button.add`).click(() => {
      console.log(`Event [Click] : turnip.content.webhook.form.button.add`);

      var header = {
        key: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-key`).val(),
        value: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-value`).val()
      };

      this.addToHeaders(header);

      key: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-key`).val(``);
      value: saidObj(`extension-turnip-extension-content-webhook-section-02-form-header-value`).val(``);
    });
  }

  render() {
    this.renderBase();
    this.renderForm();
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
  }

  removeFromHeaders(key) {
    let parentId = `extension-turnip-extension-content-webhook-section-02-form-headers`;
    let child1 = $(`#${parentId} > .header-item`);
    let child2 = $(`#${parentId} > .header-item > .header-item-key`);
    console.log(child1);
    console.log(child2);
    for(let i = 0;i < child2.length;i++) {
      if(child2[i].innerHTML == key)
          child1[i].remove();
    }
  }

  renderBase(form) {
    form = (form) ? form : this.form;
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

  renderForm() {
  }
}


