'use strict'

cosnt turnipExtension = require('./src/turnip-extension');

module.exports = (addonManager) => {
    new turnipExtension(addonManager);
};
