const config = {
  job: {
    queue: {
      maxlength: 100,
      timeout: 2000
    },
    process: {
      concurrency: 5,
      timeout: 5000
    },
    request: {
      timeout: 5000
    }
  }
};

module.exports = config;