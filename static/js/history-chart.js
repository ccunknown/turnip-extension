// import { Chart } from `chart.min.js`;
// import 'chartjs-adapter-luxon';
// import ChartStreaming from `chartjs-plugin-streaming`;
// import { Chart } from './chart.min';

class TurnipExtensionHistoryChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.chart = null;
    this.config = config || null;

    this.default = {
      timescale: `hour`
      // timescale: `minute`
    };
    this.current = {
      timescale: this.default.timescale
    };

    this.realtimeOpts = null;

    // this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.initChartPlugin())
      .then(() => this.initConfig())
      .then(() => this.initChart())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initChartPlugin() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
      // .then(() => import(`chartjs-adapter-luxon`))
      // .then(() => import(`chartjs-plugin-streaming`))
      // .then((chartStreaming) => Chart.register(chartStreaming))
      .then(() => resolve())
      .catch((err) => reject(err));
    })
    // Chart.register(ChartStreaming);
  }

  initConfig() {
    this.config = {
      type: `line`,
      data: {
        datasets: [{
          fill: false,
          borderColor: `rgb(75, 192, 192)`,
          tension: 0.1,
          // backgroundColor: [`rgba(0, 0, 0, 0.3)`],
          data: []
        }]
      },
      options: {
        scales: {
          x: {
            type: `realtime`,
            realtime: {
              duration: this.timescaleToDuration(this.current.timescale),
              refresh: 1000,
              delay: 1000,
              pause: false,
              ttl: this.timescaleToDuration(this.current.timescale),
              frameRate: 30
            }
          }
        }
      }
    };
  }

  initChart() {
    this.chart = new Chart(this.ctx, this.config);
    this.realtimeOpts = this.chart.options.scales.x.realtime;
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

  setData(dataArr) {
    console.log(`[${this.constructor.name}]`, `setData() >> `);
    this.chart.data.datasets[0].data = JSON.parse(JSON.stringify(dataArr));
  }

  pushData(data) {
    console.log(`[${this.constructor.name}]`, `pushData({${data.x}, ${data.y}}) >> `);
    this.chart.data.datasets[0].data.push(data);
    // this.chart.update(`none`);
  }

  setLabel(label) {
    console.log(`[${this.constructor.name}]`, `setLabel(${label}) >> `);
    this.chart.data.datasets[0].label = label;
    this.chart.update(`none`);
  }

  setTimescale(timescale) {
    console.log(`[${this.constructor.name}]`, `setTimescale() >> `);
    this.current.timescale = timescale;
    let duration = this.timescaleToDuration(this.current.timescale);
    console.log(`duration: ${duration}`);
    // this.realtimeOpts.duration = duration;
    // this.realtimeOpts.ttl = duration;
    this.chart.options.scales.x.realtime.duration = duration;
    this.chart.options.scales.x.realtime.ttl = duration + (60 * 1000);
    this.chart.update(`none`);
  }
}