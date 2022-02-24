class TurnipExtensionHistory {
  constructor(parent, turnipRaid) {
    this.parent = parent;
    this.turnipRaid = turnipRaid;
    this.said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
    this.saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);

    this.initRestApiTool();
    this.initDisplay();
  }

  initRestApiTool() {
    this.rest = this.parent.rest;
    this.api = this.parent.api;
  }

  initDisplay() {
    let said = this.said;
    let saidObj = this.saidObj;

    this.display = {
      loading: () => {
        console.log(`[${this.constructor.name}]`, `display.loading() >> `);
        saidObj(`turnip.content.history.section-01`).addClass('hide');
        saidObj(`turnip.content.history.section-02`).addClass('hide');
        saidObj(`turnip.content.history.section-loading`).removeClass('hide');
      },
      loaded: (sec) => {
        console.log(`[${this.constructor.name}]`, `display.loaded() >> `);
        sec = `${sec}`;
        while(sec.length < 2)
          sec = `0${sec}`;
        saidObj(`turnip.content.history.section-loading`).addClass('hide');
        saidObj(`turnip.content.history.section-01`).addClass('hide');
        saidObj(`turnip.content.history.section-02`).addClass('hide');
        saidObj(`turnip.content.history.section-${sec}`).removeClass('hide');
      },
      render: (device, property) => {
        console.log(`[${this.constructor.name}]`, `display.render() >> `);
        return this.renderService(device, property);
      },
      sync: (device, property) => {
        console.log(`[${this.constructor.name}]`, `display.sync() >> `);
        this.display.loading();
        this.display.render(device, property)
        .then(() => {
          this.display.loaded((device && property) ? 2 : 1);
        })
        .catch((err) => {
          alert(err);
          this.display.loaded((device && property) ? 2 : 1);
        });
      }
    }
  }

  render(device, property) {
    console.log(`[${this.constructor.name}]`, `render() >> `);
    this.display.sync(device, property);
    // this.initButtonFunction();
  }

  renderService(device, property) {
    return (device && property) ? this.renderProperty(device, property) : this.renderDevices();
  }

  renderDevices() {
    let saidObj = this.saidObj;
    return new Promise((resolve, reject) => {
      let thingsSchema;
      let recordThings;
      Promise.resolve()
      // get schema
      .then(() => this.api.getThings())
      .then((schema) => thingsSchema = schema)
      // add property prefix
      .then(() => {
        thingsSchema.map((e) => {
          let properties = {};
          Object.keys(e.properties).forEach((p) => properties[`prop-${p}`] = e.properties[p]);
          e.properties = properties;
          return e;
        })
      })
      // get record things
      .then(() => this.api.getHistoryThings())
      .then((things) => recordThings = things)
      // put record things into thingsSchema
      .then(() => {
        recordThings.forEach((rthing) => {
          if(!thingsSchema.find((thing) => thing.href.replace(/^\/things\//, ``) == rthing.device))
            thingsSchema.push({
              href: `/things/${rthings.device}`,
              properties: rthings.properties
            });
        });
        console.log(`[${this.constructor.name}]`, thingsSchema);
      })
      // make html
      .then(() => {
        let text = ``;
        thingsSchema.forEach((d) => {
          let device = d.href.replace(/^\/things\//, ``);
          let deviceText = `
            <div class="card bg-dark border-light">

              <div class="card-header" id="extension-turnip-extension-content-history-section-01-heading-${device}">
                <h4 class="mb-0">
                  ${device}
                </h4>
              </div>
          
              <div
                id="extension-turnip-extension-content-history-section-01-collapse-${device}"
                class="collapse show"
                aria-labelledby="extension-turnip-extension-content-history-section-01-heading-${device}"
                data-parent="#extension-turnip-extension-content-history-section-01-accordion"
              >
                <div class="card-body">
                  <!-- Property List -->
                  {{property}}
                </div>
              </div>

            </div>
          `;
          let propertyText = ``;
          Object.keys(d.properties).forEach((p) => {
            let propertyId = `extension-turnip-extension-content-history-section-01-list-:${device}:-:${p}:`
            let propertiesText = `
              <a
                id="${propertyId}"
                class="ml-4 d-flex justify-content-between align-items-center"
              >
                ${p}
                <span class="badge badge-primary badge-pill">view</span>
              </a>
            `;
            propertyText = `${propertyText}${propertiesText}`;
          });
          deviceText = deviceText.replace(`{{property}}`, propertyText);
          text = `${text}${deviceText}`;
        });
        return text;
      })
      // render
      .then((text) => {
        saidObj(`turnip.content.history.section-01.accordion`).empty();
        saidObj(`turnip.content.history.section-01.accordion`).html(text);
        this.turnipRaid.updateIdList(this.parent.idRegex);
        thingsSchema.forEach((d) => {
          let device = d.href.replace(/^\/things\//, ``);
          Object.keys(d.properties).forEach((p) => {
            saidObj(`turnip.content.history.section-01.list.:${device}:.:${p}:`).click(() => {
              this.render(device, p);
            });
          })
        });
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  renderProperty(device, property) {
    let saidObj = this.saidObj;
    console.log(`[${this.constructor.name}]`, `renderProperty(${device}, ${property}) >> `);

    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.api.getHistoryThings(device, property, 3600))
      .then((dataArr) => {
        let text = ``;
        dataArr.forEach((e) => {
          let line = `${e.timestamp} [${e.device}: ${e.property}] ${e.value}`;
          // text = `${line}${text.length ? `&#13;&#10;${text}` : text}`;
          text = `${line}${text.length ? `\n${text}` : text}`;
        });
        console.log(text);
        saidObj(`turnip.content.history.section-02.title`).html(`${device}: ${property}`);
        // saidObj(`turnip.content.history.section-02.textarea`).val(text);
        $(`#extension-turnip-extension-content-history-section-02-textarea`).val(text);
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }
}