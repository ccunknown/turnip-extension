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
    // this.initButtonFunction();
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
        // return this.renderService(device, property);
        return (device && property) ? this.renderProperty(device, property) : this.renderDevices();
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

  initButtonFunction() {
    console.log(`[${this.constructor.name}]`, `initButtonFunction() >> `);
    let said = this.said;
    let saidObj = this.saidObj;

    saidObj(`turnip.content.history.section-02.title.back`).click(() => {
      console.log(
        `[${this.constructor.name}]`,
        `Event [Click] : turnip.content.setting.section-01.factory-reset.button`
      );
      return this.display.sync();
    });
  }

  initChart() {
    console.log(`[${this.constructor.name}]`, `initChart() >> `);
    let saidObj = this.saidObj;
    let ctx = saidObj(`turnip.content.history.section-02.body.chart`);
    let config = {
      type: `line`,
      data: {
        labels: [`label`],
        datasets: [{
          data: [{
            x: '2011-10-05T14:48:00.000Z',
            y: 50
          }],
          fill: false,
          borderColor: `rgb(75, 192, 192)`,
          tension: 0.1
        }],
        backgroundColor: [`rgba(0, 0, 0, 0.3)`],
        borderWidth: 1
      },
      options: {
        scales: {
          // xAxes: [{
          //   ticks: {
          //       display: false //this will remove only the label
          //   }
          // }],
          x: {
            // min: `2021-11-07 00:00:00`
            min: `2011-10-05T14:48:00.000Z`,
            display: false
            // type: `time`,
            // time: {
            //   unit: `millisecond`
            // }
          }
        }
      }
    };
    this.chart = new Chart(ctx, config);
  }

  updateChart(
    dataset,    /* array like [ {x: ..., y: ...}, {x: ..., y: ...} ] */
    timescale,   /* hour, day, week, month */
    label = `undefined`
  ) {
    let t =
      timescale == `hour`
      ? new Date(new Date() - 60 * 60 * 1000)
      : timescale == `day`
        ? new Date(new Date() - 24 * 60 * 60 * 1000)
        : timescale == `week`
          ? new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
          : timescale == `month`
            ? new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
            : new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
    this.chart.options.scales.x.min = t.toISOString();
    this.chart.data.datasets[0].data = dataset;
    this.chart.data.datasets[0].label = label;
    this.chart.update();
  }

  render(device, property) {
    console.log(`[${this.constructor.name}]`, `render() >> `);
    this.display.sync(device, property);
    this.initButtonFunction();
    this.initChart();
  }

  // renderService(device, property) {
  //   return (device && property) ? this.renderProperty(device, property) : this.renderDevices();
  // }

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
          let deviceId = d.href.replace(/^\/things\//, ``);
          let deviceName = d.title || ``;
          let deviceLabel = d.title ? `${d.title} [id: ${deviceId}]` : `[id: ${deviceId}]`;
          let deviceText = `
            <div class="card bg-dark border-light">

              <div class="card-header" id="extension-turnip-extension-content-history-section-01-heading-${deviceId}">
                <h4 class="mb-0">
                  ${deviceLabel}
                </h4>
              </div>
          
              <div
                id="extension-turnip-extension-content-history-section-01-collapse-${deviceId}"
                class="collapse show"
                aria-labelledby="extension-turnip-extension-content-history-section-01-heading-${deviceId}"
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
            let property = d.properties[p];
            let propertyId = `extension-turnip-extension-content-history-section-01-list-:${deviceId}:-:${p}:`
            let propertiesText = `
              <a
                id="${propertyId}"
                class="ml-4 d-flex justify-content-between align-items-center"
                data-toggle="tooltip"
                data-placement="bottom"
                title="[id: ${p}]"
              >
                ${property.title ? `${property.title}` : `${p}`}
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
              // this.render(device, p);
              this.display.sync(device, p);
            });
          })
        });
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  renderProperty(device, property, timerange = 3600) {
    let timerangeText = `hour`;
    let saidObj = this.saidObj;
    console.log(`[${this.constructor.name}]`, `renderProperty(${device}, ${property}) >> `);

    return new Promise((resolve, reject) => {
      let dataSet = [];
      let prop = null;
      Promise.resolve()

      //  Render Schema
      .then(() => this.api.getThings())
      .then((schema) => {
        console.log(schema);
        return schema;
      })
      .then((schema) => schema.find(e => e.href.match(new RegExp(`\/${device}`))))
      .then((d) => {
        console.log(d);
        return d;
      })
      .then((d) => {
        let p = property.replace(/^prop-/, ``);
        console.log(p);
        if(d && d.properties && d.properties[p]) {
          prop = d.properties[p];
          return JSON.stringify(prop, null, 2);
        }
        else {
          return `{}`;
        }
      })
      .then((p) => {
        console.log(p);
        $(`#extension-turnip-extension-content-history-section-02-body-schema`).val(p);
      })

      // Render Value
      .then(() => this.api.getHistoryThings(device, property, timerange))
      .then((dataArr) => {
        let text = ``;
        dataArr.forEach((e) => {
          let timestamp = new Date(e.timestamp);
          let line = `${timestamp.toISOString()}: ${e.value}`;
          text = `${line}${text.length ? `\n${text}` : text}`;
          dataSet.push({ x: timestamp.toISOString(), y: e.value });
        });
        console.log(text);
        saidObj(`turnip.content.history.section-02.title.label`).html(`${device}: ${property}`);
        $(`#extension-turnip-extension-content-history-section-02-body-value`).val(text);
      })

      // Render Timezone
      .then(() => {
        let timezoneObj = saidObj(`turnip.content.history.section-02.body.timezone`);
        let timezone = (new Date()).toString().match(/GMT.+$/)[0];
        timezoneObj.val(timezone);
      })

      // Render graph
      .then(() => {
        if(prop && typeof prop.value == `number`) {
          this.updateChart(dataSet, timerangeText, `${prop.title} (${prop.unit})`);
          console.log(dataSet);
        }
        else {
          this.updateChart({}, timerangeText, label);
        }
      })

      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }
}