class TurnipExtensionHistoryTextUI {
  constructor(ctxHeader, ctxList, ctxTextArea) {
    this.ctx = {
      header: ctxHeader,
      listui: ctxList,
      textarea: ctxTextArea
    };
    this.default = {
      timescale: `hour`
    };
    this.current = {
      timescale: this.default.timescale,
      data: [],
      dataCleaner: {
        interval: 5000,
        worker: null
      }
    };
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.initComponent())
      .then(() => this.initButton())
      .then(() => this.initDataCleaner())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initComponent(ctx = this.ctx) {
    console.log(`[${this.constructor.name}]`, `initComponent() >> `);
  }

  initButton() {
    console.log(`[${this.constructor.name}]`, `initButton() >> `);
    this.ctx.header.click(() => {
      let current = this.ctx.header.html().trim();
      console.log(`current: ${current}`);
      if(current == `Text`)
        this.displayListUI();
      else if(current == `List`)
        this.displayText();
    });
  }

  initDataCleaner() {
    console.log(`[${this.constructor.name}]`, `initDataCleaner() >> `);
    this.current.dataCleaner.worker = setInterval(
      () => {
        this.cleanData();
      },
      this.current.dataCleaner.interval
    );
  }

  setData(dataArr, display = `List`) {
    console.log(`[${this.constructor.name}]`, `setData() >> `);
    // this.current.data = JSON.parse(JSON.stringify(dataArr));
    // this.current.data = [...dataArr];
    this.current.data = dataArr;
    // this.ctx.listui.html(``);
    (display == `List`)
      ? this.displayListUI()
      : (display == `Text`)
        ? this.displayText()
        : {};
  }

  pushData(data) {
    console.log(`[${this.constructor.name}]`, `pushData(${data.x}, ${data.y}) >> `);
    this.current.data.push(data);
    this.prependList(data);
  }

  cleanData(timescale = this.current.timescale) {
    console.log(`[${this.constructor.name}]`, `cleanData() >> `);
    let duration = this.timescaleToDuration(timescale);
    let currRange = new Date(Date.now() - duration);
    while(this.current.data[0] && new Date(this.current.data[0].x) < currRange)
      this.current.data.shift();

    let listui = this.ctx.listui[0];
    let childrens = listui.children;
    console.log(listui);
    // while(!childNodes.lastChild)
    //   childNodes.removeChild(childNodes.lastChild);
    while(new Date(listui.children[listui.children.length - 1].attributes.timestamp.nodeValue) < currRange)
      listui.removeChild(listui.lastElementChild);
    console.log(childrens);
    console.log(listui.lastElementChild);
    console.log(listui.children[listui.children.length - 1]);
    console.log(listui.children[listui.children.length - 1].attributes.timestamp.nodeValue);
  }

  timescaleToDuration(timescale = this.current.timescale) {
    console.log(`[${this.constructor.name}]`, `timescaleToDuration(${timescale}) >> `);
    let prefix = parseInt(timescale.match(/^\d+/)) || 1;
    let suffix = timescale.match(/[^ ]+$/)[0];
    switch(suffix) {
      case `minute`: return prefix * 60 * 1000;
      case `hour`: return prefix * 60 * 60 * 1000;
      case `day`: return prefix * 60 * 60 * 24 * 1000;
      case `week`: return prefix * 60 * 60 * 24 * 7 * 1000;
      case `month`: return prefix * 60 * 60 * 24 * 30 * 1000;
      default : 
        let last = (new Date()).getTime();
        let begin = (new Date(timescale)).getTime();
        return Math.floor((last - begin));
    };
  }

  displayListUI() {
    console.log(`[${this.constructor.name}]`, `displayUi() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.ctx.header.html(`List`);
        this.ctx.listui.addClass(`hide`);
        this.ctx.textarea.addClass(`hide`);
        this.ctx.listui.html(``);
      })
      .then(() => {
        this.current.data.forEach((data) => {
          this.prependList(data);
        })
      })
      // .then(() => {
      //   let html = ``;
      //   this.current.data.forEach((data) => {
      //     html = `
      //       ${html}
      //       ${html.length ? `\n` : ``}
      //       <li class="list-group-item bg-dark pt-1 pb-1">
      //         ${this.toIsoString(data.x)}: ${data.y}
      //       </li>
      //     `;
      //   });
      //   this.ctx.listui.html(html);
      // })
      .then(() => this.ctx.listui.removeClass(`hide`))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  displayText() {
    console.log(`[${this.constructor.name}]`, `displayText() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.ctx.header.html(`Text`);
        this.ctx.listui.addClass(`hide`);
        this.ctx.textarea.addClass(`hide`);
      })
      .then(() => {
        let text = ``;
        this.current.data.forEach((data) => {
          text = `${text}${text.length ? `\n` : ``}${this.toIsoString(data.x)}: ${data.y}`
        });
        this.ctx.textarea.val(text);
      })
      .then(() => this.ctx.textarea.removeClass(`hide`))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  prependList(data) {
    console.log(`prepend`);
    let dom = this.ctx.listui;
    let timestamp = this.toIsoString(data.x);
    dom.prepend(`
      <li class="list-group-item bg-dark pt-1 pb-1" timestamp="${timestamp}">
        ${timestamp}: ${data.y}
      </li>
    `);
  }

  setTimescale(timescale) {
    console.log(`[${this.constructor.name}]`, `setTimescale() >> `);
    this.current.timescale = timescale;
  }

  toIsoString(date, gmt = false) {
    console.log(`typeof date: ${typeof date}`);
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