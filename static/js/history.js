class TurnipExtensionHistory {
  constructor(parent, turnipRaid) {
    this.parent = parent;
    this.turnipRaid = turnipRaid;
    this.said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
    this.saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

    this.default = {
      timescale: `5 minute`,
      templateDir: `${this.parent.id}/static/views/templates/history`,
      template: {
        device: `card-device.html`,
        property: `card-device-property.html`
      }
    }

    this.current = {
      schema: null,
      device: null,
      property: null,
      timescale: this.default.timescale,
      data: []
    };

    this.sec1 = {
      current: {
        thingsSchema: null,
        devices: [],
        deviceTextArray: []
      },
      template: {
        device: ``,
        property: ``
      }
    }

    this.chartCleanInterval = null;

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    this.initRestApiTool();
    this.initDisplay();
    // this.initTemplate();
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
        // console.log(`[${this.constructor.name}]`, `display.loading() >> `);
        saidObj(`turnip.content.history.section-01`).addClass('hide');
        saidObj(`turnip.content.history.section-02`).addClass('hide');
        saidObj(`turnip.content.history.section-loading`).removeClass('hide');
      },
      loaded: (sec) => {
        // console.log(`[${this.constructor.name}]`, `display.loaded() >> `);
        sec = `${sec}`;
        while(sec.length < 2)
          sec = `0${sec}`;
        saidObj(`turnip.content.history.section-loading`).addClass('hide');
        saidObj(`turnip.content.history.section-01`).addClass('hide');
        saidObj(`turnip.content.history.section-02`).addClass('hide');
        saidObj(`turnip.content.history.section-${sec}`).removeClass('hide');
      },
      render: (device, property) => {
        // console.log(`[${this.constructor.name}]`, `display.render() >> `);
        return (device && property)
          ? this.renderProperty(device, property, this.default.timescale)
          : this.renderDevices();
      },
      sync: (device, property) => {
        // console.log(`[${this.constructor.name}]`, `display.sync() >> `);
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

    let searchBoxId = saidObj(`turnip.content.history.section-01.search.box`)[0].id;
    $(`#${searchBoxId}`).keyup((event) => {
      console.log(
        `[${this.constructor.name}]`, 
        `Event [Change] : turnip.content.history.section-01.search.box`
      );
      console.log(event);
      // console.log(saidObj(`turnip.content.history.section-01.search.box`)[0].id)
      this.applyHighlight(undefined, event.target.value);
      this.applyFilter(event.target.value);
    });

    saidObj(`turnip.content.history.section-02.title.back`).click(() => {
      console.log(
        `[${this.constructor.name}]`,
        `Event [Click] : turnip.content.setting.section-01.factory-reset.button`
      );
      return this.display.sync();
    });

    saidObj(`turnip.content.history.section-02.title.reload`).click(() => {
      console.log(
        `[${this.constructor.name}]`,
        `Event [Click] : turnip.content.setting.section-01.factory-reset.reload`
      );
      return this.display.sync(this.current.device, this.current.property);
    });

    // Download JSON button
    saidObj(`turnip.content.history.section-02.title.download.json`).click(() => {
      console.log(
        `[${this.constructor.name}]`,
        `Event [Click] : turnip.content.history.section-02.title.download.json`
      );
      return new Promise((resolve, reject) => {
        // console.log(`[${this.constructor.name}]`, `current timescale: ${this.current.timescale}`);
        Promise.resolve()
        .then(() => this.api.getHistoryThings(
          this.current.device, 
          this.current.property, 
          this.scaleToDuration(this.current.timescale)
        ))
        .then((data) => {
          let content = JSON.stringify(data, null, 2);
          let meta = data.metadata;
          let fname = `${meta.device}-${meta.property}-${meta.from}.json`;
          let file = new File([content], {
            type: "text/plain;charset=utf-8"
          });
          // saveAs(blob, fname);
          return this.download(file, fname);
        })
        .then(() => resolve())
        .catch((err) => reject(err));
      });
    });

    // Download CSV button
    saidObj(`turnip.content.history.section-02.title.download.csv`).click(() => {
      console.log(
        `[${this.constructor.name}]`,
        `Event [Click] : turnip.content.history.section-02.title.download.json`
      );
      return new Promise((resolve, reject) => {
        // console.log(`[${this.constructor.name}]`, `current timescale: ${this.current.timescale}`);
        let fname;
        Promise.resolve()
        .then(() => this.api.getHistoryThings(
          this.current.device, 
          this.current.property, 
          this.scaleToDuration(this.current.timescale)
        ))
        .then((data) => {
          const rows = [];

          // Create file name
          fname = `${data.metadata.device}-${data.metadata.property}-${data.metadata.from}.csv`;

          // Metadata rows
          for(let i in data.metadata) {
            rows.push([i, data.metadata[i]]);
          }
          rows.push([]);

          // Header row
          rows.push([`timestamp`, `value`]);

          // Data rows
          data.array.forEach((e) => rows.push([e.timestamp, e.value]));

          // Join rows
          return rows.map(e => e.join(`,`)).join(`\n`);
        })
        .then((content) => {
          let file = new File([content], {
            type: "text/plain;charset=utf-8"
          });
          // saveAs(blob, fname);
          return this.download(file, fname);
        })
        .then(() => resolve())
        .catch((err) => reject(err));
      });
    });

    // Clear timerange select button focus.
    let clearTimerangeButton = () => {
      let buttonGroup = saidObj(`turnip.content.history.section-02.body.timeselector`)[0];
      buttonGroup.childNodes.forEach((subGroup) => {
        subGroup.id && document.getElementById(subGroup.id).childNodes.forEach((e) => {
          e.id && saidObj(e.id).removeClass(`focus`);
        });
      })
    };

    // Choose timerange select button focus.
    let focusTimerangeButton = (id) => {
      clearTimerangeButton();
      saidObj(id).addClass(`focus`);
    };

    // Time select button group.
    let timerangeButtonGroup = saidObj(`turnip.content.history.section-02.body.timeselector`)[0];
    timerangeButtonGroup.childNodes.forEach((subGroup) => {
      subGroup.id && document.getElementById(subGroup.id).childNodes.forEach((e) => {
        if(e.id) {
          let arr = e.id.split(`-`);
          let amount = arr.pop();
          let scale = arr.pop();
          // console.log(amount, scale);
          // On click.
          saidObj(e.id).click(() => {
            focusTimerangeButton(e.id);
            this.setupData([]);
            this.current.timescale = `${amount} ${scale}`;
            // console.log(`[${this.constructor.name}]`, `time scale -> ${this.current.timescale}`);
            this.renderData();
          });
        };
      });
    });
  }

  download(file, fname = `untitled`) {
    console.log(`[${this.constructor.name}]`, `download(${fname}) >> `);
    const link = document.createElement(`a`);
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = fname;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  initChart() {
    console.log(`[${this.constructor.name}]`, `initChart() >> `);
    let saidObj = this.saidObj;
    let ctx = saidObj(`turnip.content.history.section-02.body.chart`);
    this.chart = new TurnipExtensionHistoryChart(ctx);
    return this.chart.init();
  }

  initValuePanel() {
    console.log(`[${this.constructor.name}]`, `initValuePanel() >> `);
    let saidObj = this.saidObj;
    let ctxHeader = saidObj(`turnip.content.history.section-02.body.value.headertag`);
    let ctxList = saidObj(`turnip.content.history.section-02.body.value.list`);
    let ctxTextArea = saidObj(`turnip.content.history.section-02.body.value.textarea`);
    this.valuePanel = new TurnipExtensionHistoryTextUI(ctxHeader, ctxList, ctxTextArea);
    return this.valuePanel.init();
  }

  scaleToDuration(timescale = this.current.timescale) {
    let prefix = parseInt(timescale.match(/^\d+/)) || 1;
    let suffix = timescale.match(/[^ ]+$/)[0];
    switch(suffix) {
      case `minute`: return prefix * 60;
      case `hour`: return prefix * 60 * 60;
      case `day`: return prefix * 60 * 60 * 24;
      case `week`: return prefix * 60 * 60 * 24 * 7;
      case `month`: return prefix * 60 * 60 * 24 * 30;
      default : 
        let last = (new Date()).getTime();
        let begin = (new Date(timescale)).getTime();
        return Math.floor((last - begin) / 1000);
    };
  }

  /*
    data = { x: timestamp, y: <number, string, boolean> }
  */
  addData(data) {
    console.log(`[${this.constructor.name}]`, `addData({x: ${data.x}, y: ${data.y}}) >> `);
    this.current.data.push({ x: data.x, y: data.y });
    this.chart.pushData({ x: data.x, y: data.y });
    this.valuePanel.pushData({ x: data.x, y: data.y });
  }

  /*
    arr = [ { x: timestamp, y: <number, string, boolean> } ]
  */
  setupData(arr) {
    console.log(`[${this.constructor.name}]`, `setupData() >> `);
    // this.setupTextData(arr);
    this.setupValuePanelData(arr);
    this.setupChartData(arr);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.generatePropertyLabel())
      .then((label) => this.chart.setLabel(label))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  setupChartData(arr) {
    let data = [...arr];
    this.chart.setData(data);
    this.chart.setTimescale(this.current.timescale);
  }

  setupValuePanelData(arr) {
    let data = [...arr];
    this.valuePanel.setData(data);
    this.valuePanel.setTimescale(this.current.timescale);
  }

  onChannelMessage(event) {
    console.log(`[${this.constructor.name}]`, `onChannelMessage`, event.detail);
    let data = event.detail;

    if(data.device == this.current.device && data.property == this.current.property) {
      this.addData({
        x: new Date(data.createdAt),
        y: data.value
      });
    }
  }

  render(device, property) {
    console.log(`[${this.constructor.name}]`, `render() >> `);
    this.display.sync(device, property);
    this.initButtonFunction();
    // this.initChart();
    let channelOptions = {
      name: `rtSensorData`,
      type: `data`
    }
    Promise.resolve()
    .then(() => this.initChart())
    .then(() => this.initValuePanel())
    .then(() => this.rtcpeer = new TurnipRTCPeer(this.parent, channelOptions))
    .then(() => this.rtcpeer.start())
    // .then(() => this.rtcpeer.addEventListener(
    //   `channel-${channelOptions.name}`, 
    //   (event) => this.onChannelMessage(event)
    // ))
    .then(() => this.rtcpeer.addEventListener(
      `rtSensorData`, 
      (event) => this.onChannelMessage(event)
    ))
    .catch((err) => console.error(err));
  }

  renderDevices() {
    let saidObj = this.saidObj;
    return new Promise((resolve, reject) => {
      let thingsSchema;
      let recordThings;
      let template = {
        device: null,
        property: null
      };

      Promise.resolve()

      // get schema
      .then(() => this.api.getThings())
      .then((schema) => {
        thingsSchema = schema;
        this.sec1.current.thingsSchema = schema;
      })

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
      .then(() => this.getTemplate(this.default.template.device))
      .then((ret) => this.sec1.template.device = ret)
      .then(() => this.getTemplate(this.default.template.property))
      .then((ret) => this.sec1.template.property = ret)
      .then(() => this.renderDeviceCards())

      // render
      .then((text) => {
        // saidObj(`turnip.content.history.section-01.accordion`).empty();
        // saidObj(`turnip.content.history.section-01.accordion`).html(
        //   this.applyFilter(text).join()
        // );
        // saidObj(`turnip.content.history.section-01.accordion`).html(text);
        // thingsSchema.forEach((d) => {
        //   let device = d.href.replace(/^\/things\//, ``);
        //   Object.keys(d.properties).forEach((p) => {
        //     // Add click event
        //     saidObj(`turnip.content.history.section-01.list.:${device}:.:${p}:`).click(() => {
        //       this.display.sync(device, p);
        //     });
        //   })
        // });
      })

      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  renderDeviceCards(options = { filter: ``, highlight: `` }) {
    let text = this.sec1.current.thingsSchema.map(
      (deviceSchema) => this.renderDeviceCard(deviceSchema, options)
    ).join(`\n`);
    this.saidObj(`turnip.content.history.section-01.accordion`).empty();
    this.saidObj(`turnip.content.history.section-01.accordion`).html(text);
    this.turnipRaid.updateIdList(this.parent.idRegex);
    this.initialPropertyButton();
    // this.applyFilter(options.filter);
    return text;
  }

  initialPropertyButton() {
    this.sec1.current.thingsSchema.forEach((d) => {
      let device = d.href.replace(/^\/things\//, ``);
      Object.keys(d.properties).forEach((p) => {
        // Add click event
        this.saidObj(`turnip.content.history.section-01.list.:${device}:.:${p}:`).click(() => {
          this.display.sync(device, p);
        });
      })
    });
  }

  renderDeviceCard(deviceSchema, options = { highlight: `` }) {
    // let d  = deviceSchema;
    console.log(`[${this.constructor.name}]`, `renderDeviceCard() >> `);
    let deviceId = deviceSchema.href.replace(/^\/things\//, ``);
    let deviceName = deviceSchema.title || ``;
    let deviceLabel = 
      deviceSchema.title
      ? `${deviceSchema.title} [id: ${deviceId}]`
      : `[id: ${deviceId}]`;

    let propertiesText = ``;
    Object.keys(deviceSchema.properties).forEach((propertyId) => {
      let propertySchema = deviceSchema.properties[propertyId];
      let domId = `extension-turnip-extension-content-history-section-01-list-:${deviceId}:-:${propertyId}:`
      let propertyTitle = propertySchema.title ? `${propertySchema.title}` : `${propertyId}`;
      let propertyText = `${this.sec1.template.property}`
        .replaceAll(`{{domId}}`, domId)
        .replaceAll(`{{propertyId}}`, propertyId)
        .replaceAll(`{{propertyTitle}}`, propertyTitle);
      propertiesText = `${propertiesText}${propertyText}`;
    });

    let deviceText = `${this.sec1.template.device}`
      .replaceAll(`{{deviceId}}`, deviceId)
      .replaceAll(`{{deviceLabel}}`, deviceLabel)
      .replaceAll(`{{properties}}`, propertiesText);

    return deviceText;
  }

  renderProperty(
    device = this.current.device, 
    property = this.current.property
  ) {

    // Set current device & current property
    this.current.device = device;
    this.current.property = property;

    let saidObj = this.saidObj;
    console.log(`[${this.constructor.name}]`, `renderProperty(${device}, ${property}) >> `);

    return new Promise((resolve, reject) => {
      Promise.resolve()

      // Set header label
      .then(() => {
        this
        .saidObj(`turnip.content.history.section-02.title.label`)
        .html(`${this.current.device}: ${this.current.property}`);
      })

      // Get schema.
      .then(() => this.getPropertySchema(device, property))
      .then((propSchema) => {
        return JSON.stringify(propSchema ? propSchema : {}, null, 2)
      })
      .then((p) => {
        // console.log(p);
        $(`#extension-turnip-extension-content-history-section-02-body-schema`).val(p);
      })

      // Render Timezone
      .then(() => {
        let timezoneObj = saidObj(`turnip.content.history.section-02.body.timezone`);
        let timezone = (new Date()).toString().match(/GMT.+$/)[0];
        timezoneObj.val(timezone);
      })

      // Render Data
      // .then(() => this.renderData())
      .then(() => {
        let min5 = saidObj(`turnip.content.history.section-02.body.timeselector.minute.5`)[0];
        min5.click();
      })

      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  renderData(
    device = this.current.device,
    property = this.current.property,
    timescale = this.current.timescale
  ) {
    console.log(`[${this.constructor.name}]`, `renderData() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()

      // Get data from server.
      .then(() => this.api.getHistoryThings(device, property, this.scaleToDuration(timescale)))
      .then((data) => {
        console.log(`[${this.constructor.name}]`, `data:`, data);
        return data.array;
      })
      .then((dataArr) => {
        // console.log(`dataArr: `, dataArr);
        this.current.data = [];
        dataArr.forEach((e) => {
          let etimestamp = new Date(e.timestamp);
          this.current.data.push({ x: etimestamp, y: e.value });
        });
      })

      // Render Data
      .then(() => {
        this.setupData(this.current.data);
        // console.log(this.current.data);
      })

      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  generatePropertyLabel(device = this.current.device, property = this.current.property) {
    // console.log(`[${this.constructor.name}]`, `generatePropertyLable(${device}, ${property}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.getPropertySchema(device, property))
      .then((propSchema) => propSchema ? `${propSchema.title} ${propSchema.unit ? `${propSchema.unit}` : ``}` : ``)
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getPropertySchema(
    device = this.current.device, 
    property = this.current.property,
    opt = { renew: false, update: true }
  ) {
    // console.log(`[${this.constructor.name}]`, `getPropertySchema(${device}, ${property}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.getSchema(opt))
      .then((schema) => schema.find(e => e.href.match(new RegExp(`\/${device}`))))
      .then((d) => {
        // console.log(d);
        return d;
      })
      .then((d) => {
        let p = property.replace(/^prop-/, ``);
        // console.log(p);
        return (d && d.properties && d.properties[p]) ? d.properties[p] : null;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  getSchema(opt = { renew: false, update: true }) {
    console.log(`[${this.constructor.name}]`, `getSchema() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        if(opt.renew || !this.current.schema) {
          console.log(`renew schema`);
          return this.api.getThings();
        }
        else {
          console.log(`use existing schema`);
          return this.current.schema;
        }
      })
      .then((schema) => {
        // console.log(schema);
        opt.update && (this.current.schema = schema);
        return schema;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }

  getTemplate(resource) {
    console.log(`[${this.constructor.name}]`, `getTemplate(${resource}) >> `);
    let subpath = [
      ...this.default.templateDir.split(`/`).filter(e => e.length),
      ...resource.split(`/`).filter(e => e.length)
    ].join(`/`);
    console.log(`subpath: `, subpath);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.parent.loadResource(subpath))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  // applyFilter(filter, highlight = false) {
  //   const regex = new RegExp(`(>[^<]*)(${filter})([^<>]*<)`, "g");
  //   return this.sec1.current.deviceTextArray
  //   .filter(e => !filter.length || e.match(regex))
  //   .map(e => highlight ? this.applyHighlight(e, filter) : e);
  // }

  applyFilter(filter) {
    // if(!filter)
    //   return ;
    const regex = new RegExp(`(>[^<]*)(${filter})([^<>]*<)`, "g");
    this.saidObj(`turnip.content.history.section-01.accordion`)[0]
    .childNodes.forEach(deviceCard => {
      if(!deviceCard.id)
        return ;
      // let card = document.getElementById(deviceCard.id);
      let card = this.saidObj(deviceCard.id);
      filter
      ? card[0].innerHTML.match(regex) ? card.removeClass(`hide`) : card.addClass(`hide`)
      : card.removeClass(`hide`);
    })
    
  }

  applyHighlight(context = this.renderDeviceCards(), text) {
    let content =
      text
      ? `${context}`.replaceAll(
          new RegExp(`(>[^<]*)(${text})([^<>]*<)`, "g"), 
          `$1<span style="background-color: yellow; color: black">${text}</span>$3`
        )
      : context;
    // this.saidObj(`turnip.content.history.section-01.accordion`).empty();
    this.saidObj(`turnip.content.history.section-01.accordion`).html(content);
    this.turnipRaid.updateIdList(this.parent.idRegex);
    this.initialPropertyButton();
    // return content;
  }

  toIsoString(date, gmt = false) {
    let tzo = -date.getTimezoneOffset();
    let dif = tzo >= 0 ? '+' : '-';
    let pad = (num) => (num < 10 ? '0' : '') + num;

    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      (gmt ? `${dif}${pad(Math.floor(Math.abs(tzo) / 60))}:${pad(Math.abs(tzo) % 60)}` : ``);
  }
}