'use strict';

const turnipExtension = require('./src/turnip-extension');

module.exports = (addonManager) => {
  new turnipExtension(addonManager);
};

